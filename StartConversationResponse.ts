interface StartConversationResponse {
    conversationId: string;
    clientId: string;
    result: {
        value: 'Success' | 'Failure';
        message?: string;
    };
}

export default StartConversationResponse;