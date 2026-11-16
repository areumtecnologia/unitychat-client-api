const {
    UnityChatService,
    UnityChatSession,
    UnityChatSessionsManager,
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
} = require('../index.js');

console.log('Classes e Enums importados com sucesso:');
console.log('UnityChatService:', typeof UnityChatService);
console.log('UnityChatSession:', typeof UnityChatSession);
console.log('UnityChatSessionsManager:', typeof UnityChatSessionsManager);
console.log('DisconnectAction:', typeof DisconnectAction, DisconnectAction);
console.log('SessionAction:', typeof SessionAction, SessionAction);
console.log('QRCodeFormat:', typeof QRCodeFormat, QRCodeFormat);
console.log('MessageType:', typeof MessageType, MessageType);
console.log('FileType:', typeof FileType, FileType);
console.log('MessageMode:', typeof MessageMode, MessageMode);
console.log('Platform:', typeof Platform, Platform);
console.log('TicketStatus:', typeof TicketStatus, TicketStatus);
console.log('TriggerType:', typeof TriggerType, TriggerType);
console.log('ActionType:', typeof ActionType, ActionType);
console.log('PixKeyType:', typeof PixKeyType, PixKeyType);

const allOk = UnityChatService && UnityChatSession && UnityChatSessionsManager &&
    DisconnectAction && SessionAction && QRCodeFormat && MessageType && FileType &&
    MessageMode && Platform && TicketStatus && TriggerType && ActionType && PixKeyType;

if (!allOk) {
    console.error('Erro: Algum elemento não foi exportado corretamente.');
    process.exit(1);
}

// Testes de integridade em memória
console.log('\nExecutando testes unitários das classes em memória...');

// 1. SessionsManager com suporte híbrido (sessionName e UUID)
const manager = new UnityChatSessionsManager();
const sessionMock = new UnityChatSession('fake-token', 'sessao-1', 1, { uuid: 'c3580456-e97d-4df6-9fa8-e7c65c531d04' });
manager.add(sessionMock);

if (manager.get('sessao-1') !== sessionMock) {
    console.error('FAIL: SessionsManager get/add falhou por sessionName.');
    process.exit(1);
}

if (manager.get('c3580456-e97d-4df6-9fa8-e7c65c531d04') !== sessionMock) {
    console.error('FAIL: SessionsManager get por UUID falhou.');
    process.exit(1);
}

const allSessions = manager.getAll();
allSessions['sessao-1'] = null; // Tentativa de mutação externa
if (!manager.get('sessao-1')) {
    console.error('FAIL: SessionsManager.getAll vazou referência mutável interna.');
    process.exit(1);
}

manager.remove('sessao-1');
if (manager.get('sessao-1') !== null || manager.get('c3580456-e97d-4df6-9fa8-e7c65c531d04') !== null) {
    console.error('FAIL: SessionsManager.remove falhou.');
    process.exit(1);
}

// 2. Validações de construtores
try {
    new UnityChatService('');
    console.error('FAIL: UnityChatService deveria rejeitar apiKey vazia.');
    process.exit(1);
} catch (e) {
    // Esperado
}

try {
    new UnityChatSession('', 'sessao');
    console.error('FAIL: UnityChatSession deveria rejeitar token vazio.');
    process.exit(1);
} catch (e) {
    // Esperado
}

try {
    new UnityChatSession('token', '');
    console.error('FAIL: UnityChatSession deveria rejeitar identificador vazio.');
    process.exit(1);
} catch (e) {
    // Esperado
}

// 3. Teste de identificação híbrida direta por UUID no construtor
const sessionUuidOnly = new UnityChatSession('fake-token', 'c3580456-e97d-4df6-9fa8-e7c65c531d04');
if (sessionUuidOnly.uuid !== 'c3580456-e97d-4df6-9fa8-e7c65c531d04' || sessionUuidOnly.sessionName !== null) {
    console.error('FAIL: UnityChatSession não identificou UUID como parâmetro principal.');
    process.exit(1);
}

// 4. Teste de presença dos métodos e submódulos no UnityChatService
const service = new UnityChatService('fake-key');
const requiredSubmodules = [
    'accounts', 'users', 'apiKeys', 'roles', 'contacts', 'omnichannel',
    'messageTemplates', 'bulkCampaigns', 'automations', 'smartCommunities',
    'calendars', 'schedules', 'serviceDesk', 'support', 'billing', 'webhooks', 'media',
    'locations', 'admin'
];

for (const sub of requiredSubmodules) {
    if (!service[sub] || typeof service[sub] !== 'object') {
        console.error(`FAIL: UnityChatService submódulo ausente: ${sub}`);
        process.exit(1);
    }
}

// 5. Teste de presença dos métodos novos no UnityChatSession
const requiredSessionMethods = [
    'connect', 'disconnect', 'logout', 'reconnect', 'updateConfig', 'deleteSession',
    'getStatus', 'getQRcode', 'sendMessage', 'sendText', 'sendLink', 'sendLocation',
    'sendPoll', 'sendRaw', 'sendFiles', 'sendImage', 'sendVideo', 'sendAudio',
    'sendDocument', 'getConversations', 'verifyNumber', 'isOnWhatsApp', 'getGroups',
    'getNewsletters', 'getMe', 'getMessages', 'reload', 'getManagementStatus'
];

for (const m of requiredSessionMethods) {
    if (typeof sessionMock[m] !== 'function') {
        console.error(`FAIL: UnityChatSession método ausente: ${m}`);
        process.exit(1);
    }
}

console.log('Sucesso! Todas as classes, enums, submódulos e comportamentos em memória foram validados com êxito.');
process.exit(0);
