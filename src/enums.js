/**
 * Enumerações estáticas e imutáveis da API UnityChat.
 * Estes objetos são congelados com Object.freeze para garantir a integridade em tempo de execução.
 */

const DisconnectAction = Object.freeze({
    LOGOUT: 'logout',
    DISCONNECT: 'disconnect',
    RECONNECT: 'reconnect'
});

const SessionAction = Object.freeze({
    RECONNECT: 'reconnect',
    DISCONNECT: 'disconnect',
    LOGOUT: 'logout'
});

const QRCodeFormat = Object.freeze({
    RAW: true,
    RENDER: 'render',
    NONE: false
});

const MessageType = Object.freeze({
    TEXT: 'text',
    LINK: 'link',
    LOCATION: 'location',
    POLL: 'poll',
    RAW: 'raw',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document'
});

const FileType = Object.freeze({
    FILES: 'files',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document'
});

const MessageMode = Object.freeze({
    CHAT: 'chat',
    GROUPS: 'groups'
});

const Platform = Object.freeze({
    ANDROID: 'android',
    CHROME: 'chrome'
});

const TicketStatus = Object.freeze({
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    CLOSED: 'closed'
});

const TriggerType = Object.freeze({
    KEYWORD: 'keyword',
    WELCOME: 'welcome',
    FALLBACK: 'fallback',
    AI_AGENT: 'ai_agent'
});

const ActionType = Object.freeze({
    SEND_TEXT: 'send_text',
    SEND_MENU: 'send_menu',
    CALL_WEBHOOK: 'call_webhook',
    TRANSFER_QUEUE: 'transfer_queue'
});

const PixKeyType = Object.freeze({
    CPF: 'CPF',
    CNPJ: 'CNPJ',
    EMAIL: 'EMAIL',
    PHONE: 'PHONE',
    EVP: 'EVP'
});

module.exports = {
    DisconnectAction,
    SessionAction,
    QRCodeFormat,
    MessageType,
    FileType,
    MessageMode,
    Platform,
    TicketStatus,
    TriggerType,
    ActionType,
    PixKeyType
};
