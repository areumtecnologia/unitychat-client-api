# unitychat-client-api

Biblioteca client oficial em Node.js para integração com a API do **UnityChat**.

Esta biblioteca facilita a autenticação, gerenciamento de sessões do WhatsApp, envio de mensagens (incluindo mensagens estruturadas/customizadas e tipos de dados flexíveis), envio de arquivos (através de Streams, Buffers, caminhos locais ou strings Base64), além de fornecer um middleware integrado para Express e um gerenciador de sessões em memória.

Para garantir robustez e evitar erros de digitação pelo desenvolvedor, a biblioteca fornece **Enumeradores Estáticos** (tipos estáticos congelados) para todas as opções de configuração e tipos de dados de strings repetitivas da API.

---

## Instalação

Instale a biblioteca em seu projeto utilizando o npm ou yarn:

```bash
npm install @areumtecnologia/unitychat-client-api
```

---

## Importação

```javascript
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
} = require('@areumtecnologia/unitychat-client-api');
```

---

## Enumeradores Estáticos (Evitando Strings Mágicas)

Utilize estes enumeradores para evitar o uso de strings brutas (strings mágicas) que podem ser escritas incorretamente. Todos os objetos são congelados (`Object.freeze`) para evitar modificações acidentais:

*   **`Platform`**: Plataformas suportadas para inicializar sessões de WhatsApp.
    *   `Platform.ANDROID` (`'android'`)
    *   `Platform.CHROME` (`'chrome'`)
*   **`DisconnectAction`**: Tipos de desconexão para uma sessão.
    *   `DisconnectAction.LOGOUT` (`'logout'`) - Mantém as credenciais mas desconecta o cliente.
    *   `DisconnectAction.DESTROY` (`'destroy'`) - Destrói completamente o cache e credenciais.
*   **`QRCodeFormat`**: Opções de retorno do QR Code.
    *   `QRCodeFormat.RAW` (`true`) - Retorna os dados em string limpa.
    *   `QRCodeFormat.RENDER` (`'render'`) - Retorna os dados prontos para renderização em tela.
    *   `QRCodeFormat.NONE` (`false`) - Desativa a geração de QR Code.
*   **`MessageType`**: Tipos de mensagens a serem enviadas por `sendMessage`.
    *   `MessageType.TEXT` (`'text'`)
    *   `MessageType.LINK` (`'link'`)
    *   `MessageType.LOCATION` (`'location'`)
    *   `MessageType.RAW` (`'raw'`)
*   **`FileType`**: Tipos de arquivos para envio de mídias por `sendFiles`.
    *   `FileType.FILES` (`'files'`)
    *   `FileType.IMAGE` (`'image'`)
    *   `FileType.VIDEO` (`'video'`)
    *   `FileType.AUDIO` (`'audio'`)
*   **`MessageMode`**: Filtros de tipos de chats para buscas de mensagens.
    *   `MessageMode.CHAT` (`'chat'`)
    *   `MessageMode.GROUPS` (`'groups'`)

---

## Como Usar

### 1. Autenticação e Status do Serviço (`UnityChatService`)

O `UnityChatService` é responsável por autenticar suas credenciais (API Key) e obter o token temporário necessário para interagir com as sessões do WhatsApp. Ele também gerencia o status geral dos serviços e sessões da conta.

```javascript
// O segundo parâmetro (apiVersion) é opcional e tem como padrão 1
const unityChatService = new UnityChatService('SUA_API_KEY', 1);

async function iniciar() {
    // 1. Autenticar para obter o token de acesso
    const authData = await unityChatService.authenticate();
    if (!authData) {
        console.error('Falha na autenticação. Verifique sua API Key.');
        return;
    }
    console.log('Autenticado com sucesso! Token:', unityChatService.token);

    // 2. Verificar o status dos serviços do UnityChat
    const status = await unityChatService.getServicesStatus();
    console.log('Status do serviço:', status);

    // 3. Obter a lista de todas as sessões ativas da conta
    const sessions = await unityChatService.getSessions();
    console.log('Sessões ativas:', sessions);

    // 4. Revogar o token quando não for mais necessário
    // await unityChatService.revoke();
}

iniciar();
```

#### Middleware para Express (`merger`)

Se você estiver usando Express, pode usar o método `.merger()` como um middleware para injetar automaticamente os dados de autenticação nas requisições:

```javascript
const express = require('express');
const app = express();

app.use(unityChatService.merger());

app.get('/minha-rota', (req, res) => {
    // Os dados autenticados estarão disponíveis em req.services.unityChatService.data
    const authData = req.services.unityChatService.data;
    res.json({ status: 'OK', authData });
});
```

---

### 2. Gerenciamento de Sessões do WhatsApp (`UnityChatSession`)

Uma vez autenticado, você pode criar instâncias de `UnityChatSession` usando o token gerado para interagir com instâncias individuais do WhatsApp.

```javascript
// O terceiro parâmetro (apiVersion) é opcional e tem como padrão 2
const session = new UnityChatSession(unityChatService.token, 'nome_da_sessao', 2);

// Opcional: callback para capturar erros de requisições da sessão
session.onError = (error) => {
    console.error('Erro na sessão:', error.message || error);
};
```

#### Conectar uma Sessão

Inicia ou conecta a sessão do WhatsApp. Você pode passar opções de configuração adicionais.

```javascript
async function conectarSessao() {
    const response = await session.connect({
        platform: Platform.ANDROID, // Usando Platform enum em vez de 'android'
        blockIncomingCalls: true // Opcional (bloquear chamadas recebidas no WhatsApp)
    });
    console.log('Conexão iniciada:', response);
}
```

#### Desconectar ou Destruir Sessão

```javascript
// Desconectar (fazer logout mantendo os dados da sessão)
await session.disconnect(DisconnectAction.LOGOUT);

// Destruir completamente a sessão (remove credenciais e desconecta)
await session.disconnect(DisconnectAction.DESTROY);
```

#### Obter Status e QR Code

```javascript
// Verificar status atual do serviço da sessão
const status = await session.getStatus();
console.log('Status da sessão:', status);

// Obter o QR Code para pareamento
const qrData = await session.getQRcode(QRCodeFormat.RENDER);
console.log('QR Code:', qrData);
```

---

### 3. Envio de Mensagens e Arquivos

#### Enviar Mensagens (Texto, Links, Localização ou Raw/Custom)

O método `sendMessage` aceita uma variedade de estruturas de mensagens:

```javascript
// 1. Mensagem de Texto Simples
await session.sendMessage({
    to: '5591999999999', // Número com DDI + DDD + Telefone
    type: MessageType.TEXT,
    body: 'Olá! Esta é uma mensagem de teste.'
});

// 2. Link com pré-visualização
await session.sendMessage({
    to: '5591999999999',
    type: MessageType.LINK,
    title: 'Áreum Tecnologia',
    subtitle: 'Visite nosso site',
    url: 'https://unitychat.areum.com.br',
    body: 'Opcional: texto que acompanha o link'
});

// 3. Localização geográfica
await session.sendMessage({
    to: '5591999999999',
    type: MessageType.LOCATION,
    title: 'Nossa Localização',
    lat: -1.455833,
    long: -48.503889
});

// 4. Mensagem customizada/estruturada (Type 'raw')
// Útil para enviar botões interativos, templates complexos ou estruturas específicas da API do WhatsApp
await session.sendMessage({
    to: '5591999999999',
    type: MessageType.RAW,
    body: {
        title: '📣 Lembrete de Pagamento',
        text: 'Olá!\n\nSua fatura com vencimento está disponível para pagamento!',
        footer: 'Efetue o pagamento de sua mensalidade usando o link copia e cola abaixo:',
        interactiveButtons: [
            // Definição dos botões interativos suportados pela API
        ]
    }
});
```

#### Enviar Arquivos (Imagens, Vídeos, PDFs, etc.)

O método `sendFiles` suporta o envio de múltiplos arquivos a partir de caminhos locais, Buffers, Streams ou strings Base64 de forma transparente:

```javascript
// Enviar arquivo a partir de um caminho no sistema de arquivos local
await session.sendFiles({
    to: '5591999999999',
    type: FileType.FILES,
    caption: 'Segue o relatório em anexo',
    files: [
        {
            filename: 'relatorio.pdf',
            path: './caminho/para/o/relatorio.pdf'
        }
    ]
});

// Enviar arquivo a partir de uma String Base64
await session.sendFiles({
    to: '5591999999999',
    type: FileType.IMAGE,
    caption: 'Foto de perfil',
    files: [
        {
            filename: 'imagem.png',
            base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        }
    ]
});

// Enviar arquivo a partir de um Buffer
const fs = require('fs');
const buffer = fs.readFileSync('./foto.jpg');

await session.sendFiles({
    to: '5591999999999',
    type: FileType.FILES,
    files: [
        {
            filename: 'foto.jpg',
            buffer: buffer
        }
    ]
});

// Enviar arquivo a partir de um Stream (ex: do próprio fs ou de requisições de rede)
const stream = fs.createReadStream('./documento.docx');

await session.sendFiles({
    to: '5591999999999',
    type: FileType.FILES,
    files: [
        {
            filename: 'documento.docx',
            stream: stream
        }
    ]
});
```

---

### 4. Consultas (Conversas e Mensagens)

#### Listar Conversas
```javascript
const conversas = await session.getConversations({
    from: '5591999999999' // Opcional: filtrar conversas de um remetente específico
});
console.log('Conversas:', conversas);
```

#### Listar Mensagens
```javascript
const mensagens = await session.getMessages({
    from: '5591999999999', // Opcional: filtrar mensagens de um remetente específico
    mode: MessageMode.CHAT // Usando MessageMode enum
});
console.log('Mensagens:', mensagens);
```

---

### 5. Gerenciador de Sessões Ativas (`UnityChatSessionsManager`)

Caso sua aplicação gerencie múltiplas instâncias de sessões do WhatsApp simultaneamente, você pode usar o `UnityChatSessionsManager` para organizá-las e recuperá-las dinamicamente em memória.

```javascript
const manager = new UnityChatSessionsManager();

// Criar e registrar sessões no gerenciador
const sessionA = new UnityChatSession(token, 'sessao_a');
const sessionB = new UnityChatSession(token, 'sessao_b');

manager.add(sessionA);
manager.add(sessionB);

// Obter uma sessão registrada específica
const minhaSessao = manager.get('sessao_a');

// Obter todas as sessões registradas (retorna um objeto com nome da sessão como chave)
const todasSessoes = manager.getAll();

// Remover uma sessão do gerenciador
manager.remove('sessao_a');
```

---

## Desenvolvimento e Testes

Se desejar contribuir ou rodar testes locais:

1. Clone o repositório.
2. Crie um arquivo `.env` na raiz do projeto com sua API Key:
   ```env
   UNITYCHAT_API_KEY=sua_api_key_aqui
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Execute os testes de importação e de integração da API:
   ```bash
   # Executa os testes de importação de classes e enums
   node tests/test-import.js

   # Executa os testes de integração com a API usando a chave fornecida no .env
   npm test
   ```

## Licença

Distribuído sob a licença **ISC**. Veja o arquivo `package.json` para mais detalhes.
