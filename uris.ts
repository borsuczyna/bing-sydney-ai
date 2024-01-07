const bundleVersion = '1.1381.12';

const uris = {
    bingCreateConversationUrl: `https://edgeservices.bing.com/edgesvc/turing/conversation/create?bundleVersion=${bundleVersion}`,
    bingGetConversationsUrl: 'https://copilot.microsoft.com/turing/conversation/chats',
    bingChatHubUrl: 'wss://sydney.bing.com/sydney/ChatHub',
    bingKBlobUrl: 'https://copilot.microsoft.com/images/kblob',
    bingBlobUrl: 'https://copilot.microsoft.com/images/blob?bcid='
};

export default uris;