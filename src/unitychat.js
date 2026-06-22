const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

class UnityChatSessionsManager {
    constructor() {
        this.sessions = {};

    }

    add(unityChatSession) {
        const client = this.sessions[unityChatSession.sessionName];
        if (!client) {
            this.sessions[unityChatSession.sessionName] = unityChatSession;
        }
    }

    get(sessionName) {
        return this.sessions[sessionName];
    }

    getAll() {
        return this.sessions;
    }

    remove(sessionName) {
        delete this.sessions[sessionName];
    }
}

class UnityChatService {
    constructor(apiKey, apiVersion = 1) {
        this.apiKey = apiKey;
        this.apiVersion = apiVersion;
        this.token = null;
        this.sessions = [];
        this.urls = {
            authentication: `https://api.unitychat.areum.com.br/api/v${apiVersion}/authentication/api-keys`,
            revokeAuthentication: `https://api.unitychat.areum.com.br/api/v${apiVersion}/authentication/api-keys/revoke`,
            unityChatStatus: `https://api.unitychat.areum.com.br/api/v${apiVersion}/services/unitychat/status`,
            getSessions: `https://api.unitychat.areum.com.br/api/v${apiVersion}/accounts/services/sessions`,
        }
    }

    async authenticate() {
        try {
            const { data } = await axios.post(this.urls.authentication, { apiKey: this.apiKey });
            this.token = data.token;
            return data;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async revoke() {
        try {
            const { data } = await axios.post(this.urls.revokeAuthentication, { apiKey: this.apiKey }, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.token = null;
            return data;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getServicesStatus() {
        try {
            const { data } = await axios.get(this.urls.unityChatStatus, {
                params: { unityChatStatus: true },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            return data;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getSessions() {
        try {
            const { data } = await axios.get(this.urls.getSessions, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            return data;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    merger() {
        console.log('UnityChat middleware executado')
        return async (req, res, next) => {
            try {
                req.services = {
                    unityChatService: {
                        data: await this.authenticate()
                    }
                };
                next();
            } catch {
                req.services = {
                    unityChatService: {
                        data: null
                    }
                };
                next();
            }
        }
    }
}

class UnityChatSession {
    constructor(token, sessionName, apiVersion = 2) {
        this.token = token;
        this.apiVersion = apiVersion;
        this.sessionName = sessionName;
        this.urls = {
            connect: `https://api.unitychat.areum.com.br/api/v${apiVersion}/whatsapp/sessions`,
            sessionClose: `https://api.unitychat.areum.com.br/api/v${apiVersion}/whatsapp/sessions`,
            disconnect: `https://api.unitychat.areum.com.br/api/v${apiVersion}/whatsapp/sessions`,
            getSessionStatus: `https://api.unitychat.areum.com.br/api/v${apiVersion}/whatsapp/sessions`,
            getQRcode: `https://api.unitychat.areum.com.br/api/v${apiVersion}/whatsapp/sessions`,
            sendMessage: `https://api.unitychat.areum.com.br/api/v${apiVersion}/whatsapp/messages`,
            getMessages: `https://api.unitychat.areum.com.br/api/v${apiVersion}/whatsapp/messages`,
            getConversations: `https://api.unitychat.areum.com.br/api/v${apiVersion}/whatsapp/conversations`,
        }
        this.onError;
    }

    async connect(options = {}) {
        try {
            const { data } = await axios.post(this.urls.connect, { sessionName: this.sessionName, platform: options.platform, blockIncomingCalls: options.blockIncomingCalls }, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            return data;
        } catch (exc) {
            if (this.onError) {
                this.onError(exc);
            }
            return exc;
        }

    }

    //mode pode ser 'logout' ou 'destroy'
    async disconnect(action = 'logout') {
        try {
            const { data } = await axios.delete(this.urls.disconnect, {
                data: { sessionName: this.sessionName, action },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            return data;
        } catch (exc) {
            //console.error(exc)
            if (this.onError) {
                this.onError(exc);
            }
            return exc;
        }

    }

    async getStatus() {
        try {
            const { data } = await axios.get(this.urls.getSessionStatus, {
                params: { sessionStatus: true, sessionName: this.sessionName },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            return data;
        } catch (exc) {
            if (this.onError) {
                this.onError(exc);
            }
            return exc;
        }
    }
    //qrCode - Pode ter valor true ou 'render'
    async getQRcode(qrCode = true) {
        try {
            const { data } = await axios.get(this.urls.getQRcode, {
                params: { qrCode, sessionName: this.sessionName },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            return data;
        } catch (exc) {
            if (this.onError) {
                this.onError(exc);
            }
            return exc;
        }
    }
    /* 
    to: 5591...
    type: text (body) 
    type: link (title, url)
    type: location (title, lat, long)
    */
    async sendMessage(message = { type: 'text' }) {
        try {
            const response = await axios.post(
                this.urls.sendMessage,
                {
                    sessionName: this.sessionName,
                    to: message.to,
                    type: message.type,
                    body: message.body,
                    title: message.title,
                    subtitle: message.subtitle,
                    buttons: message.buttons,
                    url: message.url,
                    lat: message.lat,
                    long: message.long
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`
                    },
                    // 👇 força axios a não jogar 4xx/5xx no catch
                    validateStatus: () => true
                }
            );
            const { data } = response;
            return data;
        } catch (exc) {
            // só pega erros de rede, timeout, etc
            if (this.onError) {
                this.onError(exc);
            }
            return { error: exc };
        }
    }


    /* 
    type: files, image, video 
    type: files (caption, files, filename)
    
    */
    async sendFiles(message = { type: 'files' }) {
        try {
            const form = new FormData();

            // Adiciona os campos de texto ao formulário
            form.append('sessionName', this.sessionName);
            form.append('to', message.to);
            form.append('type', message.type);
            message.caption ? form.append('caption', message.caption) : null;

            // Anexa arquivos ao formulário
            for (const file of message.files) {
                file.filename ? form.append('filename', file.filename) : null;
                if (file.path) {
                    // Se o arquivo for fornecido como um caminho, cria um Stream de leitura
                    form.append('files', fs.createReadStream(file.path));
                } else if (file.base64) {
                    // Se o arquivo for fornecido como base64, converte para Buffer
                    form.append('files', Buffer.from(file.base64, 'base64'));
                } else if (file.stream) {
                    // Se o arquivo for fornecido como Stream, anexa diretamente
                    form.append('files', file.stream);
                } else if (file.buffer) {
                    // Se o arquivo for fornecido como Buffer, anexa diretamente
                    form.append('files', file.buffer);
                }
            }

            const { data } = await axios.post(this.urls.sendMessage, form, {
                headers: {
                    ...form.getHeaders(), // Pega os cabeçalhos corretos da instância do FormData
                    Authorization: `Bearer ${this.token}`
                }
            });

            return data;
        } catch (exc) {
            if (this.onError) {
                this.onError(exc);
            }
            return exc;
        }
    }

    async getMessages(options = {}) {
        try {
            const { data } = await axios.get(this.urls.getMessages, {
                params: { sessionName: this.sessionName, from: options.from, mode: options.mode },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            return data;
        } catch (exc) {
            if (this.onError) {
                this.onError(exc);
            }
        }
    }

    async getConversations(options = {}) {
        try {
            const { data } = await axios.get(this.urls.getConversations, {
                params: { sessionName: this.sessionName, from: options.from },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            return data;
        } catch (exc) {
            if (this.onError) {
                this.onError(exc);
            }
        }
    }
}

module.exports = {
    UnityChatService,
    UnityChatSession,
    UnityChatSessionsManager,
}