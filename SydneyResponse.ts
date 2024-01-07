import Message from "./Message";
import ThrottlingInfo from "./ThrottlingInfo";

export enum SydneyMessageType {
    MessageUpdate = 1,
    MessageAdded = 2,
    SendMessage = 4,
    Heartbeat = 6,
}

export interface SydneyResponse {
    type: SydneyMessageType;
    target?: string;
    invocationId?: string;
    item?: {
        messages?: Message[];
    };
    arguments?: {
        requestId?: string;
        messages?: Message[];
        throttling?: ThrottlingInfo;
    }[]
}

export interface RequestMessage {
    source: string;
    optionsSets: string[];
    allowedMessageTypes: string[];
    sliceIds: string[];
    verbosity: string;
    scenario: string;
    plugins: string[];
    conversationHistoryOptionsSets: string[];
    isStartOfSession: boolean;
    message: Message;
    conversationSignature: string;
    participant: {
        id: string;
    };
    tone: string;
    spokenTextMode: string;
    conversationId: string;
}

export interface SydneyRequest {
    arguments: RequestMessage[];
    invocationId: string;
    target: string;
    type: SydneyMessageType;
}