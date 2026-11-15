require('dotenv').config();

const { UnityChatService, UnityChatSession } = require('../index.js');
const apiKey = process.env.UNITYCHAT_API_KEY;
const unityChatService = new UnityChatService(apiKey);

async function testApi() {
    console.log('Iniciando teste de autenticação...');
    const authData = await unityChatService.authenticate();

    if (!authData) {
        console.error('FAIL: Falha ao autenticar.');
        process.exit(1);
    }

    console.log('SUCCESS: Autenticado com sucesso!');
    console.log('Token obtido:', authData.token);
    console.log('Dados da resposta de autenticação:', JSON.stringify(authData, null, 2));

    console.log(`\nObtendo lista de sessions...`);
    const sessions = await unityChatService.getSessions();
    console.log('Resposta da lista de sessions:', JSON.stringify(sessions, null, 2));

    // Instanciar uma sessão de teste chamada 'teste-antigravity'
    const sessionName = process.env.UNITYCHAT_TEST_SESSION || '5591984185577';
    console.log(`\nCriando sessão de teste: "${sessionName}"`);
    const session = new UnityChatSession(authData.token, sessionName);

    session.onError = (err) => {
        console.error('Erro na sessão:', err.message || err);
    };

    console.log('Obtendo status da sessão...');
    const sessionStatus = await session.getStatus();
    console.log('Resposta do status da sessão:', JSON.stringify(sessionStatus, null, 2));

    const errors = [];
    const testRecipient = process.env.UNITYCHAT_TEST_RECIPIENT || '5591981648646';
    const msgRes = await session.sendMessage({
        type: 'raw',
        to: testRecipient,
        body: {
            title: '*ProAtivo CRM*\n\n📣 Lembrete de Pagamento',
            text: `Olá!\n\nSua fatura já está disponível para pagamento!\n\n👉 https://app.proativo.areum.com.br/invoices/demo\n\n`,
            footer: 'Efetue o pagamento de sua mensalidade agora mesmo usando o link copia e cola do pix 👇 ou acessando sua fatura 👆',
            interactiveButtons: []
        },
    });

    if (!msgRes || msgRes.error) {
        errors.push({ id: 500, message: msgRes });
        console.error('Falha no envio da mensagem:', errors);
    } else {
        console.log('Mensagem enviada com sucesso:', JSON.stringify(msgRes, null, 2));
    }
    // console.log('\nRevogando token...');
    // const revokeData = await unityChatService.revoke();
    // console.log('SUCCESS: Token revogado com sucesso!');
}

testApi().catch(err => {
    console.error('Erro durante o teste:', err);
    process.exit(1);
});
