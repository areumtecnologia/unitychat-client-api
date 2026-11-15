# @areumtecnologia/unitychat-client-api

Biblioteca client oficial em Node.js para integração com a **API v1 do UnityChat**.

Esta biblioteca fornece uma interface completa, fortemente tipada e com suporte a TypeScript para todos os módulos e endpoints canônicos da API UnityChat:
- **WhatsApp Core (WaSockets)**: Resolução híbrida via `uuid` ou `sessionName`, pareamento com QR Code, ciclo de vida (reconectar, desconectar, logout), configurações de bloqueios e PIX, envio de mensagens (texto, link, mídias, documentos, localização, enquetes e botões interativos/PIX), histórico de conversas, validação de números (`isOnWhatsApp`), grupos, canais/newsletters e perfil conectado.
- **Autenticação & Contas**: Login com credenciais, autenticação via API Key, perfil `/me`, recuperação e redefinição de senha, registro e ativação de contas.
- **CRM & Gestão**: Contatos, usuários, papéis e permissões (RBAC), chaves de API, templates de mensagens e campanhas em massa.
- **Automações & IA**: Fluxos de automação com palavras-chave, agentes inteligentes e comunidades inteligentes para moderação de grupos e canais.
- **Central de Atendimento (Service Desk)**: Filas de atendimento, triagem, atribuição, transferência, encerramento e reabertura de tickets.
- **Faturamento & Assinaturas (Billing)**: Faturas, planos, consulta pública de fatura e checkout PIX/Cartão.
- **Webhooks & Integrações**: Configuração e teste de disparos de eventos.
- **Enumeradores Estáticos Congelados**: Previnem erros de digitação e facilitam o autocomplete.
- **Express Middleware**: Middleware `.merger()` para autenticação automática e injeção do serviço nas requisições.

---

## 📦 Instalação

```bash
npm install @areumtecnologia/unitychat-client-api
```

---

## 🚀 Importação

```javascript
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
} = require('@areumtecnologia/unitychat-client-api');
```

---

## 🔒 Enumeradores Estáticos (Tipagem Segura)

Todos os enumeradores são congelados (`Object.freeze`) para garantir a imutabilidade:

*   **`SessionAction` / `DisconnectAction`**:
    *   `SessionAction.RECONNECT` (`'reconnect'`) - Reconecta a sessão no serviço.
    *   `SessionAction.DISCONNECT` (`'disconnect'`) - Desconecta a sessão mantendo as credenciais.
    *   `SessionAction.LOGOUT` (`'logout'`) - Realiza o logout completo no WhatsApp.
*   **`QRCodeFormat`**:
    *   `QRCodeFormat.RENDER` (`'render'`) - Retorna tag HTML pronta para renderização em tela.
    *   `QRCodeFormat.RAW` (`true`) - Retorna objeto JSON com Base64 e ASCII.
    *   `QRCodeFormat.NONE` (`false`) - Não gera QR Code.
*   **`MessageType`**:
    *   `MessageType.TEXT` (`'text'`)
    *   `MessageType.LINK` (`'link'`)
    *   `MessageType.LOCATION` (`'location'`)
    *   `MessageType.POLL` (`'poll'`) - Enquete com opções.
    *   `MessageType.RAW` (`'raw'`) - Botões interativos, PIX ou estruturas customizadas.
    *   `MessageType.IMAGE` (`'image'`)
    *   `MessageType.VIDEO` (`'video'`)
    *   `MessageType.AUDIO` (`'audio'`)
    *   `MessageType.DOCUMENT` (`'document'`)
*   **`FileType`**:
    *   `FileType.FILES` (`'files'`)
    *   `FileType.IMAGE` (`'image'`)
    *   `FileType.VIDEO` (`'video'`)
    *   `FileType.AUDIO` (`'audio'`)
    *   `FileType.DOCUMENT` (`'document'`)
*   **`Platform`**: `Platform.ANDROID` (`'android'`), `Platform.CHROME` (`'chrome'`).
*   **`TicketStatus`**: `TicketStatus.OPEN` (`'open'`), `TicketStatus.IN_PROGRESS` (`'in_progress'`), `TicketStatus.CLOSED` (`'closed'`).
*   **`TriggerType`**: `TriggerType.KEYWORD` (`'keyword'`), `TriggerType.WELCOME` (`'welcome'`), `TriggerType.FALLBACK` (`'fallback'`), `TriggerType.AI_AGENT` (`'ai_agent'`).
*   **`ActionType`**: `ActionType.SEND_TEXT` (`'send_text'`), `ActionType.SEND_MENU` (`'send_menu'`), `ActionType.CALL_WEBHOOK` (`'call_webhook'`), `ActionType.TRANSFER_QUEUE` (`'transfer_queue'`).
*   **`PixKeyType`**: `PixKeyType.CPF` (`'CPF'`), `PixKeyType.CNPJ` (`'CNPJ'`), `PixKeyType.EMAIL` (`'EMAIL'`), `PixKeyType.PHONE` (`'PHONE'`), `PixKeyType.EVP` (`'EVP'`).

---

## 📱 Módulo: WhatsApp (WaSockets Core)

O `UnityChatSession` gerencia uma sessão do WhatsApp. Suporta **identificação híbrida**: você pode instanciar passando o **`sessionName`** (ex: `'5511999999999'`) ou o **`uuid`** gerado na criação da sessão.

### 1. Inicializando uma Sessão

```javascript
// Usando sessionName
const session = new UnityChatSession(token, 'minha-sessao-vendas');

// Ou usando UUID diretamente
const session = new UnityChatSession(token, '4c6a9e1d-8472-4b71-91ea-69e12089b0cf');

// Ou através da factory do UnityChatService
const session = unityChatService.session('minha-sessao-vendas');

session.onError = (err) => {
    console.error('Erro na sessão:', err.message || err);
};
```

### 2. Conexão, QR Code e Status

```javascript
// 1. Iniciar conexão (POST /whatsapp/sessions)
const conn = await session.connect({ platform: Platform.ANDROID, blockIncomingCalls: true });
console.log('UUID da sessão gerado:', session.uuid);

// 2. Obter QR Code (GET /whatsapp/sessions?qrCode=render)
const qrHtml = await session.getQRcode(QRCodeFormat.RENDER);

// 3. Consultar status atual (connecting, connected, pairing_code, disconnected)
const status = await session.getStatus();
console.log('Status da sessão:', status);
```

### 3. Ciclo de Vida & Configurações da Sessão

```javascript
// Reconectar uma sessão
await session.reconnect();

// Desconectar temporariamente mantendo credenciais
await session.disconnect(SessionAction.DISCONNECT);

// Logout completo do WhatsApp
await session.logout();

// Atualizar configurações e regras de bloqueio (PATCH /whatsapp/sessions)
await session.updateConfig({
    block_incoming_calls: true,
    block_audio_messages: false,
    block_empty_text_messages: true,
    pix_keys: [
        { key: '12345678909', type: PixKeyType.CPF, name: 'Minha Empresa LTDA' }
    ]
});

// Deletar a sessão permanentemente (DELETE /whatsapp/sessions)
await session.deleteSession();
```

### 4. Envio de Mensagens

#### A. Texto Puro e Links
```javascript
// Texto simples
await session.sendText('5511999999999', 'Olá! Como posso ajudar você hoje?');

// Link com preview
await session.sendLink('5511999999999', {
    url: 'https://unitychat.areum.com.br',
    title: 'UnityChat Omnichannel',
    body: 'Conheça nossa plataforma de atendimento'
});
```

#### B. Localização Geográfica
```javascript
await session.sendLocation(
    '5511999999999',
    -23.55052,
    -46.633308,
    'Av. Paulista, 1000 - São Paulo, SP'
);
```

#### C. Enquetes (Polls)
```javascript
await session.sendPoll(
    '5511999999999',
    'Qual o melhor horário para entrarmos em contato?',
    ['Manhã (09h - 12h)', 'Tarde (14h - 18h)', 'Noite (19h - 21h)']
);
```

#### D. Mensagens Interativas / Botões / PIX (Raw)
```javascript
await session.sendRaw('5511999999999', {
    title: 'Confirmação do Pedido #1234',
    text: 'Seu pedido foi faturado com sucesso!',
    footer: 'UnityChat Nexus',
    interactiveButtons: [
        {
            name: 'cta_copy',
            buttonParamsJson: {
                display_text: 'Copiar Chave PIX',
                copy_code: '00020126360014br.gov.bcb.pix...'
            }
        },
        {
            name: 'cta_url',
            buttonParamsJson: {
                display_text: 'Rastrear Pedido',
                url: 'https://meupedido.com/1234'
            }
        }
    ]
});
```

#### E. Mídias e Arquivos (Imagens, Vídeos, Áudios e Documentos)
O método `sendFiles` ou os helpers específicos cuidam de multipart/form-data com suporte a arquivos em disco, Buffers, Streams ou Base64:

```javascript
// Imagem a partir de arquivo local
await session.sendImage('5511999999999', { path: './comprovante.jpg', filename: 'comprovante.jpg' }, 'Segue o comprovante');

// Documento em PDF
await session.sendDocument('5511999999999', { path: './contrato.pdf', filename: 'contrato.pdf' }, 'Contrato assinado');

// Áudio gravado (enviado com recording indicator)
await session.sendAudio('5511999999999', { path: './audio.mp3', filename: 'audio.mp3' });

// Múltiplos arquivos via sendFiles
await session.sendFiles({
    to: '5511999999999',
    type: FileType.DOCUMENT,
    caption: 'Documentos do processo',
    files: [
        { filename: 'doc1.pdf', path: './doc1.pdf' },
        { filename: 'doc2.pdf', buffer: bufferData }
    ]
});
```

### 5. Histórico, Validações e Comunidades

```javascript
// 1. Consultar histórico de conversa (GET /whatsapp/conversations)
const historico = await session.getConversations({ chatId: '5511999999999@s.whatsapp.net', limit: 30 });

// 2. Verificar se um número possui conta no WhatsApp (GET /whatsapp/wa-account-verify)
const check = await session.isOnWhatsApp('5511999999999');
if (check.exists) {
    console.log('JID Oficial:', check.jid);
}

// 3. Listar grupos ou obter metadados (GET /whatsapp/groups)
const todosGrupos = await session.getGroups();
const detalhesGrupo = await session.getGroups('120363000000000000@g.us');

// 4. Listar canais / newsletters (GET /whatsapp/newsletters)
const canais = await session.getNewsletters();

// 5. Perfil da conta conectada (GET /whatsapp/sessions/me)
const me = await session.getMe();
console.log('Conectado como:', me.name, me.id);
```

---

## 🏢 Módulo: Autenticação, Contas & Submódulos

O `UnityChatService` unifica o acesso aos submódulos corporativos da API v1:

```javascript
const unityChatService = new UnityChatService('SUA_API_KEY');

// Autenticar com a API Key para obter o Bearer Token
await unityChatService.authenticate();
```

### 1. Autenticação & Usuários
```javascript
// Login com e-mail e senha
const loginData = await unityChatService.login({ username: 'operador@empresa.com', password: '123' });

// Consultar perfil do usuário autenticado (GET /authentication/me)
const me = await unityChatService.getMe();

// Recuperação de senha
await unityChatService.forgotPassword('operador@empresa.com');
await unityChatService.resetPassword({ token: 'reset_token', newPassword: 'nova_senha_forte' });

// Registro e ativação de nova conta
await unityChatService.register({ name: 'João', email: 'joao@empresa.com', password: '123', company: 'Minha Empresa' });
await unityChatService.activateAccount('activation_token');
```

### 2. Contatos (CRM)
```javascript
// Listar contatos com busca e paginação
const contatos = await unityChatService.contacts.list({ page: 1, limit: 20, search: 'Silva' });

// Criar contato
const novoContato = await unityChatService.contacts.create({
    name: 'Maria Silva',
    phone: '5511988887777',
    email: 'maria@gmail.com',
    tags: 'lead,vip'
});
```

### 3. Templates de Mensagens & Campanhas em Massa
```javascript
// Listar templates salvos
const templates = await unityChatService.messageTemplates.list();

// Disparar campanha em massa
await unityChatService.bulkCampaigns.create({
    name: 'Promoção Black Friday',
    session_id: 1,
    message_body: 'Olá {{1}}, aproveite nosso cupom de 20%!',
    recipients: [
        { phone: '5511999999999', variables: { '1': 'Carlos' } }
    ]
});
```

### 4. Central de Atendimento (Service Desk)
```javascript
// Dashboard de atendimento em tempo real
const dashboard = await unityChatService.serviceDesk.getDashboard();

// Listar tickets abertos
const tickets = await unityChatService.serviceDesk.getTickets({ status: TicketStatus.OPEN });

// Atribuir, transferir ou encerrar ticket
await unityChatService.serviceDesk.assignTicket(101, { user_id: 5 });
await unityChatService.serviceDesk.transferTicket(101, { department_id: 2 });
await unityChatService.serviceDesk.closeTicket(101, { resolution: 'RESOLVED', rating: 5 });
```

### 5. Faturamento & Assinaturas (Billing)
```javascript
// Resumo do plano e consumo
const summary = await unityChatService.billing.getSummary();

// Faturas emitidas
const faturas = await unityChatService.billing.getInvoices();

// Gerar sessão de checkout para pagamento via PIX ou Cartão
const checkout = await unityChatService.billing.checkout({ plan_id: 2, payment_method: 'pix' });
```

### 6. Webhooks
```javascript
// Cadastrar webhook para receber eventos
await unityChatService.webhooks.create({
    url: 'https://meuservidor.com/webhook',
    secret_key: 'meu_segredo_hmac',
    events: ['messages.received', 'status.change', 'tickets.created']
});

// Testar webhook
await unityChatService.webhooks.test({ url: 'https://meuservidor.com/webhook' });
```

---

## 🗄️ Gerenciador de Sessões em Memória (`UnityChatSessionsManager`)

Armazena instâncias de sessões em memória com resolução automática por **sessionName** ou **UUID**:

```javascript
const manager = new UnityChatSessionsManager();

const session = new UnityChatSession(token, 'sessao-principal');
manager.add(session);

// Recuperar por sessionName
const s1 = manager.get('sessao-principal');

// Se a sessão possuir UUID, também pode ser recuperada diretamente por ele
const s2 = manager.get(session.uuid);

// Listar todas as sessões registradas
const todas = manager.getAll();
```

---

## 🌐 Middleware para Express (`merger`)

```javascript
const express = require('express');
const { UnityChatService } = require('@areumtecnologia/unitychat-client-api');

const app = express();
const unityChatService = new UnityChatService(process.env.UNITYCHAT_API_KEY);

app.use(unityChatService.merger());

app.get('/minha-rota', (req, res) => {
    const authData = req.services.unityChatService.data;
    res.json({ status: 'OK', token: authData?.token });
});
```

---

## 📄 Licença e Suporte
- **Mantido por**: Áreum Tecnologia
- **Suporte Técnico**: `suporte@areum.com.br`
