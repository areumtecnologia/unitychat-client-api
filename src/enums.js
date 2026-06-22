/**
 * Enumerações para evitar o uso de strings mágicas ou erros de digitação.
 * Estes objetos são congelados para garantir a imutabilidade em tempo de execução.
 */

const DisconnectAction = Object.freeze({
    LOGOUT: 'logout',
    DESTROY: 'destroy'
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
    RAW: 'raw'
});

const FileType = Object.freeze({
    FILES: 'files',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio'
});

const MessageMode = Object.freeze({
    CHAT: 'chat',
    GROUPS: 'groups'
});

const Platform = Object.freeze({
    ANDROID: 'android',
    CHROME: 'chrome'
});

module.exports = {
    DisconnectAction,
    QRCodeFormat,
    MessageType,
    FileType,
    MessageMode,
    Platform
};
