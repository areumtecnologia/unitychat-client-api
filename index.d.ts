import { Readable } from 'stream';

export const DisconnectAction: {
    readonly LOGOUT: 'logout';
    readonly DISCONNECT: 'disconnect';
    readonly RECONNECT: 'reconnect';
};

export const SessionAction: {
    readonly RECONNECT: 'reconnect';
    readonly DISCONNECT: 'disconnect';
    readonly LOGOUT: 'logout';
};

export const QRCodeFormat: {
    readonly RAW: true;
    readonly RENDER: 'render';
    readonly NONE: false;
};

export const MessageType: {
    readonly TEXT: 'text';
    readonly LINK: 'link';
    readonly LOCATION: 'location';
    readonly POLL: 'poll';
    readonly RAW: 'raw';
    readonly IMAGE: 'image';
    readonly VIDEO: 'video';
    readonly AUDIO: 'audio';
    readonly DOCUMENT: 'document';
};

export const FileType: {
    readonly FILES: 'files';
    readonly IMAGE: 'image';
    readonly VIDEO: 'video';
    readonly AUDIO: 'audio';
    readonly DOCUMENT: 'document';
};

export const MessageMode: {
    readonly CHAT: 'chat';
    readonly GROUPS: 'groups';
};

export const Platform: {
    readonly ANDROID: 'android';
    readonly CHROME: 'chrome';
};

export const TicketStatus: {
    readonly OPEN: 'open';
    readonly IN_PROGRESS: 'in_progress';
    readonly CLOSED: 'closed';
};

export const TriggerType: {
    readonly KEYWORD: 'keyword';
    readonly WELCOME: 'welcome';
    readonly FALLBACK: 'fallback';
    readonly AI_AGENT: 'ai_agent';
};

export const ActionType: {
    readonly SEND_TEXT: 'send_text';
    readonly SEND_MENU: 'send_menu';
    readonly CALL_WEBHOOK: 'call_webhook';
    readonly TRANSFER_QUEUE: 'transfer_queue';
};

export const PixKeyType: {
    readonly CPF: 'CPF';
    readonly CNPJ: 'CNPJ';
    readonly EMAIL: 'EMAIL';
    readonly PHONE: 'PHONE';
    readonly EVP: 'EVP';
};

export interface UnityChatServiceOptions {
    apiKey?: string;
    token?: string;
    apiVersion?: number;
    baseURL?: string;
    baseUrl?: string;
    timeout?: number;
    user?: any;
}

export interface UnityChatSessionOptions {
    timeout?: number;
    baseURL?: string;
    baseUrl?: string;
    uuid?: string;
    sessionName?: string;
}

export interface ConnectOptions {
    platform?: 'android' | 'chrome' | string;
    blockIncomingCalls?: boolean | number;
    [key: string]: any;
}

export interface SendMessagePayload {
    to: string;
    type?: 'text' | 'link' | 'location' | 'poll' | 'raw' | 'image' | 'video' | 'audio' | 'document' | string;
    body?: string | Record<string, any>;
    title?: string;
    subtitle?: string;
    buttons?: any[];
    url?: string;
    lat?: number | string;
    long?: number | string;
    address?: string;
    pollName?: string;
    pollOptions?: string[];
    options?: Record<string, any>;
    [key: string]: any;
}

export interface SendFileItem {
    filename?: string;
    path?: string;
    base64?: string;
    stream?: Readable;
    buffer?: Buffer;
}

export interface SendFilesPayload {
    to: string;
    type?: 'files' | 'image' | 'video' | 'audio' | 'document' | string;
    caption?: string;
    files: SendFileItem[];
    options?: Record<string, any>;
}

export interface GetMessagesOptions {
    from?: string;
    chatId?: string;
    chat_id?: string;
    mode?: 'chat' | 'groups' | string;
    limit?: number;
    [key: string]: any;
}

export interface GetConversationsOptions {
    chatId?: string;
    from?: string;
    limit?: number;
}

export interface SessionIdentifierObject {
    sessionName?: string;
    uuid?: string;
}

export interface UpdateSessionConfigPayload {
    is_default?: boolean | number;
    block_incoming_calls?: boolean | number;
    block_group_messages?: boolean | number;
    block_audio_messages?: boolean | number;
    block_video_messages?: boolean | number;
    block_image_messages?: boolean | number;
    block_document_messages?: boolean | number;
    block_location_messages?: boolean | number;
    block_broadcast_messages?: boolean | number;
    block_empty_text_messages?: boolean | number;
    enable_automation?: boolean | number;
    pix_keys?: Array<{ key: string; type: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP' | string; name: string }>;
    [key: string]: any;
}

export class UnityChatSessionsManager {
    constructor();
    sessions: Record<string, UnityChatSession>;
    add(unityChatSession: UnityChatSession): boolean;
    get(identifier: string): UnityChatSession | null;
    getAll(): Record<string, UnityChatSession>;
    remove(identifier: string): boolean;
}

export class UnityChatService {
    constructor(apiKeyOrOptions: string | UnityChatServiceOptions, apiVersion?: number, options?: UnityChatServiceOptions);
    apiKey: string | null;
    token: string | null;
    apiVersion: number;
    timeout: number;
    baseURL: string;
    user: any;
    urls: {
        authentication: string;
        revokeAuthentication: string;
        unityChatStatus: string;
        getSessions: string;
    };

    // Autenticação & Conta
    authenticate(apiKey?: string): Promise<{ token: string; [key: string]: any } | null>;
    login(credentials: { username: string; password: string }): Promise<any | null>;
    getMe(): Promise<any | null>;
    forgotPassword(email: string): Promise<any | null>;
    resetPassword(data: { token: string; newPassword?: string; password?: string }): Promise<any | null>;
    register(accountData: { name: string; email: string; phone?: string; website?: string; [key: string]: any }): Promise<any | null>;
    activateAccount(keyOrToken: string | { key?: string; token?: string }): Promise<any | null>;
    logout(): Promise<any | null>;
    revoke(): Promise<any | null>;

    // Sessões
    getServicesStatus(): Promise<any | null>;
    reloadWhatsApp(): Promise<any | null>;
    getSessions(): Promise<any | null>;
    session(sessionIdentifier: string | SessionIdentifierObject, options?: UnityChatSessionOptions): UnityChatSession;
    merger(): (req: any, res: any, next: (err?: any) => void) => Promise<void>;

    // Submódulos API v1
    accounts: {
        get(): Promise<any>;
        update(data: any): Promise<any>;
    };
    users: {
        list(params?: any): Promise<any>;
        create(data: any): Promise<any>;
        update(data: any): Promise<any>;
        delete(id: number): Promise<any>;
    };
    apiKeys: {
        list(params?: any): Promise<any>;
        create(data: any): Promise<any>;
        delete(id: number): Promise<any>;
    };
    roles: {
        list(params?: any): Promise<any>;
        create(data: any): Promise<any>;
        update(data: any): Promise<any>;
        delete(id: number): Promise<any>;
        getSelectRules(): Promise<any>;
    };
    contacts: {
        list(params?: { page?: number; limit?: number; search?: string; tag?: string; [key: string]: any }): Promise<any>;
        create(data: any): Promise<any>;
        update(data: any): Promise<any>;
        delete(id: number): Promise<any>;
    };
    omnichannel: {
        getServices(): Promise<any>;
        getSessions(): Promise<any>;
        getMetaOAuthUrl(): Promise<any>;
        getMessages(params?: any): Promise<any>;
    };
    messageTemplates: {
        list(): Promise<any>;
        create(data: any): Promise<any>;
        update(data: any): Promise<any>;
        delete(id: number): Promise<any>;
    };
    bulkCampaigns: {
        list(): Promise<any>;
        create(data: any): Promise<any>;
        update(data: any): Promise<any>;
    };
    automations: {
        list(): Promise<any>;
        create(data: any): Promise<any>;
        update(data: any): Promise<any>;
        delete(id: number): Promise<any>;
    };
    smartCommunities: {
        list(): Promise<any>;
        create(data: any): Promise<any>;
        getLogs(): Promise<any>;
        testChannel(data: { session_id: number; channel_jid: string }): Promise<any>;
        generatePreview(data: any): Promise<any>;
    };
    calendars: {
        list(): Promise<any>;
        create(data: any): Promise<any>;
        get(id: number | string): Promise<any>;
        update(id: number | string, data: any): Promise<any>;
        delete(id: number | string): Promise<any>;
    };
    schedules: {
        list(params?: any): Promise<any>;
        create(data: any): Promise<any>;
        get(id: number | string): Promise<any>;
        update(id: number | string, data: any): Promise<any>;
        delete(id: number | string): Promise<any>;
    };
    serviceDesk: {
        getDashboard(): Promise<any>;
        getTickets(params?: any): Promise<any>;
        getTicket(id: number | string): Promise<any>;
        getContactHistory(contactId: number | string): Promise<any>;
        assignTicket(id: number | string, data?: any): Promise<any>;
        transferTicket(id: number | string, data: any): Promise<any>;
        closeTicket(id: number | string, data?: any): Promise<any>;
        reopenTicket(id: number | string): Promise<any>;
    };
    support: {
        getStats(params?: any): Promise<any>;
        listTickets(params?: any): Promise<any>;
        createTicket(data: any): Promise<any>;
        getTicket(id: number | string): Promise<any>;
        updateTicket(id: number | string, data: any): Promise<any>;
        addTicketMessage(id: number | string, data: any): Promise<any>;
    };
    billing: {
        getSummary(): Promise<any>;
        getPlans(): Promise<any>;
        createPlan(data: any): Promise<any>;
        updatePlan(id: number | string, data: any): Promise<any>;
        deletePlan(id: number | string): Promise<any>;
        getInvoices(): Promise<any>;
        createInvoice(data: any): Promise<any>;
        updateInvoice(id: number | string, data: any): Promise<any>;
        deleteInvoice(id: number | string): Promise<any>;
        sendInvoice(id: number | string): Promise<any>;
        getPublicInvoice(uuid: string): Promise<any>;
        checkout(data: any): Promise<any>;
        getSettings(): Promise<any>;
        updateSettings(data: any): Promise<any>;
        getDiscounts(): Promise<any>;
        createDiscount(data: any): Promise<any>;
        updateDiscount(id: number | string, data: any): Promise<any>;
        deleteDiscount(id: number | string): Promise<any>;
        triggerCycle(): Promise<any>;
    };
    webhooks: {
        list(): Promise<any>;
        create(data: { url: string; secret_key?: string; events: string[] }): Promise<any>;
        test(data?: any): Promise<any>;
    };
    media: {
        getUrl(filename: string, tempToken?: string): string;
        download(filename: string, options?: any): Promise<any>;
    };
    locations: {
        getCountries(): Promise<any>;
        getStates(countryId: number | string): Promise<any>;
        getCities(stateId: number | string): Promise<any>;
    };
    admin: {
        getStats(): Promise<any>;
        getLogs(): Promise<any>;
        analyzeAi(data?: { timeframe?: string; focus?: string }): Promise<any>;
        getModules(): Promise<any>;
    };
}

export class UnityChatSession {
    constructor(
        token: string,
        sessionIdentifier: string | SessionIdentifierObject,
        apiVersion?: number,
        options?: UnityChatSessionOptions
    );

    token: string;
    apiVersion: number;
    sessionName: string | null;
    uuid: string | null;
    timeout: number;
    baseURL: string;
    urls: Record<string, string>;
    onError: ((error: any) => void) | null;

    connect(options?: ConnectOptions): Promise<any>;
    disconnect(action?: 'disconnect' | 'logout' | 'reconnect' | string): Promise<any>;
    logout(): Promise<any>;
    reconnect(): Promise<any>;
    updateConfig(config?: UpdateSessionConfigPayload): Promise<any>;
    deleteSession(): Promise<any>;
    getStatus(): Promise<any>;
    getQRcode(qrCode?: boolean | 'render'): Promise<any>;

    sendMessage(message?: SendMessagePayload): Promise<any>;
    sendText(to: string, text: string, options?: Record<string, any>): Promise<any>;
    sendLink(to: string, linkData: string | Record<string, any>, options?: Record<string, any>): Promise<any>;
    sendLocation(to: string, lat: number | string, long: number | string, address?: string): Promise<any>;
    sendPoll(to: string, pollName: string, pollOptions: string[]): Promise<any>;
    sendRaw(to: string, body: Record<string, any>, options?: Record<string, any>): Promise<any>;

    sendFiles(message?: SendFilesPayload): Promise<any>;
    sendImage(to: string, file: SendFileItem, caption?: string, options?: Record<string, any>): Promise<any>;
    sendVideo(to: string, file: SendFileItem, caption?: string, options?: Record<string, any>): Promise<any>;
    sendAudio(to: string, file: SendFileItem, options?: Record<string, any>): Promise<any>;
    sendDocument(to: string, file: SendFileItem, caption?: string, options?: Record<string, any>): Promise<any>;

    getConversations(options?: GetConversationsOptions): Promise<any>;
    verifyNumber(id: string): Promise<{ exists: boolean; jid?: string } | any>;
    isOnWhatsApp(id: string): Promise<{ exists: boolean; jid?: string } | any>;
    getGroups(groupId?: string): Promise<any>;
    getNewsletters(newsletterId?: string): Promise<any>;
    getMe(): Promise<any>;
    getMessages(options?: GetMessagesOptions): Promise<any>;
    reload(): Promise<any>;
    getManagementStatus(): Promise<any>;
}
