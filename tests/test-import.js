const {
    UnityChatService,
    UnityChatSession,
    UnityChatSessionsManager,
    DisconnectAction,
    QRCodeFormat,
    MessageType,
    FileType,
    MessageMode,
    Platform
} = require('../index.js');

console.log('Classes e Enums importados com sucesso:');
console.log('UnityChatService:', typeof UnityChatService);
console.log('UnityChatSession:', typeof UnityChatSession);
console.log('UnityChatSessionsManager:', typeof UnityChatSessionsManager);
console.log('DisconnectAction:', typeof DisconnectAction, DisconnectAction);
console.log('QRCodeFormat:', typeof QRCodeFormat, QRCodeFormat);
console.log('MessageType:', typeof MessageType, MessageType);
console.log('FileType:', typeof FileType, FileType);
console.log('MessageMode:', typeof MessageMode, MessageMode);
console.log('Platform:', typeof Platform, Platform);

const allOk = UnityChatService && UnityChatSession && UnityChatSessionsManager &&
    DisconnectAction && QRCodeFormat && MessageType && FileType && MessageMode && Platform;

if (allOk) {
    console.log('Sucesso! Todas as classes e enums foram exportados corretamente.');
    process.exit(0);
} else {
    console.error('Erro: Algum elemento não foi exportado corretamente.');
    process.exit(1);
}

