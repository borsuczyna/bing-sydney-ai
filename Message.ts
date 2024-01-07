import SearchResult from "./SearchResult";

export enum MessageType {
    Chat = 'Chat',
    ActionRequest = 'ActionRequest',
    AdsQuery = 'AdsQuery',
    ConfirmationCard = 'ConfirmationCard',
    Context = 'Context',
    Disengaged = 'Disengaged',
    InternalLoaderMessage = 'InternalLoaderMessage',
    InternalSearchQuery = 'InternalSearchQuery',
    InternalSearchResult = 'InternalSearchResult',
    InvokeAction = 'InvokeAction',
    Progress = 'Progress',
    RenderCardRequest = 'RenderCardRequest',
    RenderContentRequest = 'RenderContentRequest',
    SemanticSerp = 'SemanticSerp',
    GenerateContentQuery = 'GenerateContentQuery',
    SearchQuery = 'SearchQuery',
}

export interface From {
    id: string;
    name: any;
    partnerId: any;
}

export interface LocationInfo {
    country: string;
    state: string;
    city: string;
    sourceType: number;
    isImplicitLocationIntent: boolean;
}

export interface ScoredClassification {
    classification: string;
    score: any;
}
  
export interface ClassificationRanking {
    classification: string;
    score: any;
}

export interface Nlu {
    scoredClassification: ScoredClassification;
    classificationRanking: ClassificationRanking[];
    qualifyingClassifications: any;
    ood: any;
    metaData: any;
    entities: any;
}

export interface Feedback {
    tag: any;
    updatedOn: any;
    type: string;
}

export interface Score {
    component: string;
    score: number;
}

export interface AdaptiveCard {
    type: string;
    version: string;
    body: Body[];
}
  
export interface Body {
    type: string;
    text: string;
    wrap: boolean;
}

export interface SuggestedResponse {
    text: string;
    author: string;
    createdAt: string;
    timestamp: string;
    messageId: string;
    messageType: string;
    offense: string;
    feedback: Feedback;
    contentOrigin: string;
}

export interface Message {
    text?: string;
    author?: string;
    from?: From;
    createdAt?: string;
    timestamp?: string;
    locale?: string;
    market?: string;
    region?: string;
    locationInfo?: LocationInfo;
    messageId?: string;
    requestId?: string;
    nlu?: Nlu;
    offense?: string;
    feedback?: Feedback;
    contentOrigin?: string;
    scores?: Score[];
    inputMethod?: string;
    adaptiveCards?: AdaptiveCard[];
    sourceAttributions?: any[];
    suggestedResponses?: SuggestedResponse[];
    messageType?: MessageType;
    imageUrl?: string;
    originalImageUrl?: string;
    invocation?: string;
    groundingInfo?: {
        web_search_results?: SearchResult[];
    };
}

export interface RequestMessage {
    source: string;
}

export default Message;