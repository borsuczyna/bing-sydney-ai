import * as fs from 'fs';
import { ConversationStyle, ConversationStyleOptionSet } from "./ConversationStyle";
import Message, { MessageType } from "./Message";
import { ConversationHistoryOptionsSets, CookieOptions, DefaultOptions, NoSearchOptions } from "./Options";
import StartConversationResponse from "./StartConversationResponse";
import { SydneyMessageType, SydneyRequest, SydneyResponse } from "./SydneyResponse";
import { WSClient, createWSClient, delimeter } from "./WSClient";
import uris from "./uris";
import sydneyHeaders from "./headers";
import ThrottlingInfo from "./ThrottlingInfo";
import UploadResult from './UploadResult';

interface AskOptions {
    attachment?: string;
    webSearch?: (search: any[]) => void;
    messageUpdate?: (message: Message) => void;
    messageAdded?: (message: Message) => void;
}

export class SydneyClient {
    search: boolean = true;
    conversationStyle: ConversationStyle = ConversationStyle.Balanced;

    cookies?: string;
    conversationId?: string;
    clientId?: string;
    invocationId: number = 0;
    conversationSignature?: string;
    encryptedConversationSignature?: string;
    _throttlingInfo?: ThrottlingInfo;

    wsClient?: WSClient;
    
    constructor(cookies: string = '') {
        this.cookies = cookies;
    }

    private get conversationStyleOptionSet(): string[] {
        return ConversationStyleOptionSet[this.conversationStyle].split(',');
    }
    
    setSearch(search: boolean) {
        this.search = search;
        return this;
    }

    setConversationStyle(conversationStyle: ConversationStyle) {
        this.conversationStyle = conversationStyle;
        return this;
    }

    async startConversation(): Promise<void> {
        if (this.conversationId) return;

        let response = await fetch(uris.bingCreateConversationUrl, {
            headers: {
                ...sydneyHeaders.create,
                cookie: this.cookies ?? '',
            }
        });

        let data: StartConversationResponse = await response.json() as StartConversationResponse;
        if (data.result.value !== 'Success') {
            throw new Error(data.result.message);
        }

        this.conversationId = data.conversationId;
        this.clientId = data.clientId;
        this.conversationSignature = response.headers.get('X-Sydney-Conversationsignature') as string;
        this.encryptedConversationSignature = response.headers.get('X-Sydney-Encryptedconversationsignature') as string;
        this.invocationId = 0;
    }

    private buildUploadArguments(attachment: string, base64?: string): FormData {
        let data = new FormData();

        let payload = {
            imageInfo: { url: attachment },
            knowledgeRequest: {
                invokedSkills: ['ImageById'],
                subscriptionId: 'Bing.Chat.Multimodal',
                invokedSkillsRequestData: { enableFaceBlur: true },
                convoData: {
                    convoid: this.conversationId,
                    convotone: this.conversationStyle.toString(),
                },
            },
        };

        data.append('knowledgeRequest', JSON.stringify(payload));

        if (base64) {
            data.append('imageBase64', base64);
        }

        return data;
    }

    async uploadAttachment(file: string): Promise<string> {
        let isUrl = file.startsWith('http://') || file.startsWith('https://');

        let attachment: string = file;
        let base64: string | undefined;
        if (!isUrl && fs.existsSync(file)) {
            base64 = fs.readFileSync(file, 'base64');
        }

        let data = this.buildUploadArguments(attachment, base64);
        let response = await fetch(uris.bingKBlobUrl, {
            method: 'POST',
            body: data,
            headers: {
                ...sydneyHeaders.kBlob,
                cookie: this.cookies ?? '',
            }
        });

        let result: UploadResult = await response.json() as UploadResult;
        
        if (!result.blobId) {
            throw new Error('Failed to upload image, Copilot rejected uploading it');
        }

        if (result.blobId.length === 0) {
            throw new Error('Failed to upload image, received empty image info from Copilot');
        }

        return result.blobId;
    }

    private buildAskArguments(prompt: string, options?: AskOptions) {
        let optionsSets: string[] = [...Object.values(DefaultOptions) as string[]];

        // Add conversation style option values.
        this.conversationStyleOptionSet.forEach((style) => {
            optionsSets.push(style.trim());
        });

        // Build option sets based on whether search is allowed or not.
        if (this.cookies) {
            optionsSets.push(...Object.values(CookieOptions) as string[]);
        }
        
        if (!this.search) {
            optionsSets.push(...Object.values(NoSearchOptions) as string[]);
        }

        let imageUrl, originalImageUrl;
        if (options?.attachment) {
            imageUrl = `${uris.bingBlobUrl}${options.attachment}`;
            originalImageUrl = `${uris.bingBlobUrl}${options.attachment}`;
            console.log('Image URL:', imageUrl);
        }

        let args: SydneyRequest = {
            arguments: [
                {
                    source: 'cib',
                    optionsSets: optionsSets,
                    allowedMessageTypes: [...Object.values(MessageType) as string[]],
                    sliceIds: [],
                    verbosity: 'verbose',
                    scenario: 'SERP',
                    plugins: [],
                    conversationHistoryOptionsSets: [
                        ...Object.values(ConversationHistoryOptionsSets) as string[],
                    ],
                    isStartOfSession: this.invocationId === 0,
                    message: {
                        author: 'user',
                        inputMethod: 'Keyboard',
                        text: prompt,
                        messageType: MessageType.Chat,
                        imageUrl: imageUrl,
                        originalImageUrl: originalImageUrl,
                    },
                    conversationSignature: this.conversationSignature!,
                    participant: {
                        id: this.clientId!,
                    },
                    tone: this.conversationStyle,
                    spokenTextMode: 'None',
                    conversationId: this.conversationId!,
                }
            ],
            invocationId: this.invocationId!.toString(),
            target: 'chat',
            type: SydneyMessageType.SendMessage
        };

        return args;
    }

    async ask(prompt: string, options?: AskOptions): Promise<Message> {
        if (
            !this.conversationId ||
            !this.clientId ||
            this.invocationId === undefined
        ) {
            await this.startConversation();
        }

        let bingChatHubUrl = uris.bingChatHubUrl;
        if (this.encryptedConversationSignature)
            bingChatHubUrl += `?sec_access_token=${encodeURIComponent(this.encryptedConversationSignature)}`;

        // create socket
        if (!this.wsClient) {
            let wsClient: WSClient | undefined = await createWSClient(bingChatHubUrl);
            if (!wsClient) throw new Error('Failed to connect to chat hub.');
            
            this.wsClient = wsClient;
        }

        // send protocol and wait for response
        this.wsClient.send({
            'protocol': 'json',
            'version': 1
        });

        let messages = await new Promise((resolve, reject) => {
            this.wsClient!.once('message', (data: string) => resolve(data));
            this.wsClient!.once('error', (err) => reject(err));
        });

        // upload attachment
        if (options?.attachment) {
            options.attachment = await this.uploadAttachment(options.attachment);
        }

        // send message
        let request = this.buildAskArguments(prompt, options);
        this.invocationId++;

        this.wsClient.send(request);
        let message = await this.waitForMessage(options ?? {});

        // close socket
        await this.closeSocket();

        return message;
    }

    private async waitForMessage(options: AskOptions): Promise<Message> {
        let previousMessage: Message | undefined;
        
        return new Promise<Message>((resolve, reject) => {
            this.wsClient!.on('message', (data) => {
                let objects = data.toString().split(delimeter);
                
                for (let object of objects) {
                    if (!object) continue;

                    let response: SydneyResponse = JSON.parse(object) as SydneyResponse;

                    if (response.arguments?.[0]?.throttling) {
                        this._throttlingInfo = response.arguments[0].throttling;
                    }

                    if (response.type === SydneyMessageType.MessageAdded) {
                        let messages = response.item!.messages;
                        if (!messages) continue;

                        let lastMessage = messages[messages.length - 1];
                        if (!lastMessage) continue;

                        resolve(lastMessage);
                    } else if (response.type === SydneyMessageType.MessageUpdate) {
                        let messages = response.arguments![0].messages;
                        if (!messages) continue;

                        let lastMessage = messages[messages.length - 1];
                        if (!lastMessage) continue;

                        // check if its web search result
                        if (lastMessage.groundingInfo?.web_search_results?.length || 0 > 0) {
                            options.webSearch?.(lastMessage.groundingInfo!.web_search_results!);
                        } else {
                            // if its updating other than last message, then its a new message
                            if (previousMessage && previousMessage?.messageId !== lastMessage.messageId) {
                                if (previousMessage != undefined) 
                                    options.messageAdded?.(previousMessage);
                            } else {
                                if (lastMessage != undefined) 
                                    options.messageUpdate?.(lastMessage);
                            }

                            previousMessage = lastMessage;
                        }
                    }
                }
            });
        });
    }

    private async closeSocket() {
        await new Promise((resolve, reject) => {
            this.wsClient!.once('close', () => resolve(0));
            this.wsClient!.close();
        });

        this.wsClient = undefined;
    }

    get throttlingInfo(): ThrottlingInfo {
        if (!this._throttlingInfo) {
            return {
                maxNumUserMessagesInConversation: 10,
                numUserMessagesInConversation: 1,
                maxNumLongDocSummaryUserMessagesInConversation: 5,
                numLongDocSummaryUserMessagesInConversation: 0,
            }
        }

        return this._throttlingInfo;
    }
}