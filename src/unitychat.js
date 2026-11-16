const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class UnityChatSessionsManager {
    constructor() {
        this.sessions = {};
    }

    add(unityChatSession) {
        if (!unityChatSession || (!unityChatSession.sessionName && !unityChatSession.uuid)) {
            throw new Error('Sessão inválida: objeto precisa possuir a propriedade "sessionName" ou "uuid".');
        }
        const key = unityChatSession.sessionName || unityChatSession.uuid;
        const client = this.sessions[key];
        if (!client) {
            this.sessions[key] = unityChatSession;
            if (unityChatSession.uuid && unityChatSession.sessionName) {
                this.sessions[unityChatSession.uuid] = unityChatSession;
            }
            return true;
        }
        return false;
    }

    get(identifier) {
        return this.sessions[identifier] || null;
    }

    getAll() {
        return { ...this.sessions };
    }

    remove(identifier) {
        if (this.sessions[identifier]) {
            const session = this.sessions[identifier];
            delete this.sessions[identifier];
            if (session.sessionName && this.sessions[session.sessionName]) {
                delete this.sessions[session.sessionName];
            }
            if (session.uuid && this.sessions[session.uuid]) {
                delete this.sessions[session.uuid];
            }
            return true;
        }
        return false;
    }
}

class UnityChatService {
    constructor(apiKeyOrOptions, apiVersion = 1, options = {}) {
        let opts = options;
        if (typeof apiKeyOrOptions === 'object' && apiKeyOrOptions !== null) {
            opts = { ...apiKeyOrOptions, ...options };
            this.apiKey = opts.apiKey || null;
            this.token = opts.token || null;
            this.apiVersion = opts.apiVersion || apiVersion || 1;
        } else {
            if (apiKeyOrOptions === '' || (typeof apiKeyOrOptions === 'string' && !apiKeyOrOptions.trim())) {
                throw new Error('API Key não pode ser vazia.');
            }
            this.apiKey = apiKeyOrOptions || null;
            this.token = opts.token || null;
            this.apiVersion = apiVersion || 1;
        }

        this.timeout = opts.timeout || 30000;
        this.baseURL = (opts.baseURL || opts.baseUrl || `https://api.unitychat.areum.com.br/api/v${this.apiVersion}`).replace(/\/$/, '');
        this.user = opts.user || null;

        // URLs mantidas para compatibilidade retroativa
        this.urls = {
            authentication: `${this.baseURL}/authentication/api-keys`,
            revokeAuthentication: `${this.baseURL}/authentication/api-keys/revoke`,
            unityChatStatus: `${this.baseURL}/whatsapp/management/status`,
            getSessions: `${this.baseURL}/accounts/services/sessions`,
        };

        this._initSubmodules();
    }

    _getHeaders(extraHeaders = {}) {
        const headers = { ...extraHeaders };
        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }
        return headers;
    }

    async _request(method, endpoint, { data, params, headers, ...config } = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        return axios({
            method,
            url,
            data,
            params,
            headers: this._getHeaders(headers),
            timeout: this.timeout,
            ...config
        });
    }

    // ==========================================
    // 3. MÓDULO: AUTENTICAÇÃO & REGISTRO
    // ==========================================

    async authenticate(apiKey) {
        const key = apiKey || this.apiKey;
        if (!key) {
            throw new Error('API Key é obrigatória para autenticar.');
        }
        try {
            const { data } = await axios.post(
                this.urls.authentication,
                { apiKey: key },
                { timeout: this.timeout }
            );
            this.token = data?.token || null;
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha na autenticação via API Key:', e.response?.data || e.message);
            return null;
        }
    }

    async login({ username, password }) {
        try {
            const { data } = await this._request('post', '/authentication/users', {
                data: { username, password }
            });
            if (data?.token) {
                this.token = data.token;
            }
            if (data?.user) {
                this.user = data.user;
            }
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha no login:', e.response?.data || e.message);
            return null;
        }
    }

    async getMe() {
        try {
            const { data } = await this._request('get', '/authentication/me');
            this.user = data;
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha ao consultar perfil /me:', e.response?.data || e.message);
            return null;
        }
    }

    async forgotPassword(email) {
        try {
            const { data } = await this._request('post', '/authentication/forgot-password', {
                data: { email }
            });
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha na solicitação de recuperação de senha:', e.response?.data || e.message);
            return null;
        }
    }

    async resetPassword({ token, newPassword, password }) {
        try {
            const { data } = await this._request('post', '/authentication/reset-password', {
                data: { token, newPassword: newPassword || password }
            });
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha na redefinição de senha:', e.response?.data || e.message);
            return null;
        }
    }

    async register(accountData) {
        try {
            const { data } = await this._request('post', '/register', {
                data: accountData
            });
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha no registro de nova conta:', e.response?.data || e.message);
            return null;
        }
    }

    async activateAccount(keyOrToken) {
        try {
            const key = (keyOrToken && typeof keyOrToken === 'object')
                ? (keyOrToken.key || keyOrToken.token)
                : keyOrToken;

            const { data } = await this._request('get', '/register/account-activation', {
                params: { key },
                validateStatus: (status) => status < 400 || status === 302
            });
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha na ativação da conta:', e.response?.data || e.message);
            return null;
        }
    }

    async logout() {
        try {
            const { data } = await this._request('post', '/authentication/logout');
            this.token = null;
            this.user = null;
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha no logout:', e.response?.data || e.message);
            return null;
        }
    }

    async revoke() {
        try {
            const { data } = await axios.post(
                this.urls.revokeAuthentication,
                { apiKey: this.apiKey },
                {
                    headers: this._getHeaders(),
                    timeout: this.timeout
                }
            );
            this.token = null;
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha ao revogar credencial:', e.response?.data || e.message);
            return null;
        }
    }

    // ==========================================
    // SESSÕES & GERENCIAMENTO
    // ==========================================

    async getServicesStatus() {
        try {
            const { data } = await this._request('get', '/whatsapp/management/status');
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha ao consultar status dos serviços:', e.response?.data || e.message);
            return null;
        }
    }

    async reloadWhatsApp() {
        try {
            const { data } = await this._request('get', '/whatsapp/management/reload');
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha ao recarregar WhatsApp bootstrap:', e.response?.data || e.message);
            return null;
        }
    }

    async getSessions() {
        try {
            const { data } = await this._request('get', '/accounts/services/sessions');
            return data;
        } catch (e) {
            console.error('[UnityChatService] Falha ao consultar lista de sessões:', e.response?.data || e.message);
            return null;
        }
    }

    session(sessionIdentifier, options = {}) {
        return new UnityChatSession(this.token, sessionIdentifier, this.apiVersion, {
            baseURL: this.baseURL,
            timeout: this.timeout,
            ...options
        });
    }

    merger() {
        return async (req, res, next) => {
            try {
                let authData = this.token ? { token: this.token } : null;
                if (!authData) {
                    authData = await this.authenticate();
                }

                req.services = {
                    ...req.services,
                    unityChatService: {
                        data: authData
                    }
                };
                next();
            } catch (err) {
                req.services = {
                    ...req.services,
                    unityChatService: {
                        data: null,
                        error: err
                    }
                };
                next();
            }
        };
    }

    // ==========================================
    // SUBMÓDULOS DA API UNITYCHAT v1
    // ==========================================

    _initSubmodules() {
        // 5. Contas & Usuários
        this.accounts = {
            get: async () => (await this._request('get', '/accounts')).data,
            update: async (data) => (await this._request('put', '/accounts', { data })).data
        };

        this.users = {
            list: async (params) => (await this._request('get', '/accounts/users', { params })).data,
            create: async (data) => (await this._request('post', '/accounts/users', { data })).data,
            update: async (data) => (await this._request('put', '/accounts/users', { data })).data,
            delete: async (id) => (await this._request('delete', '/accounts/users', { data: { id } })).data
        };

        this.apiKeys = {
            list: async (params) => (await this._request('get', '/accounts/api-keys', { params })).data,
            create: async (data) => (await this._request('post', '/accounts/api-keys', { data })).data,
            delete: async (id) => (await this._request('delete', '/accounts/api-keys', { data: { id }, params: { id } })).data
        };

        // 6. Controle de Acesso (RBAC)
        this.roles = {
            list: async (params) => (await this._request('get', '/accounts/roles', { params })).data,
            create: async (data) => (await this._request('post', '/accounts/roles', { data })).data,
            update: async (data) => (await this._request('put', '/accounts/roles', { data })).data,
            delete: async (id) => (await this._request('delete', '/accounts/roles', { data: { id } })).data,
            getSelectRules: async () => (await this._request('get', '/accounts/roles/permissions/select-rules')).data
        };

        // 7. Contatos (CRM)
        this.contacts = {
            list: async (params) => (await this._request('get', '/accounts/contacts', { params })).data,
            create: async (data) => (await this._request('post', '/accounts/contacts', { data })).data,
            update: async (data) => (await this._request('put', '/accounts/contacts', { data })).data,
            delete: async (id) => (await this._request('delete', '/accounts/contacts', { data: { id }, params: { id } })).data
        };

        // 8. Mensagens & Sessões Omnichannel
        this.omnichannel = {
            getServices: async () => (await this._request('get', '/accounts/services')).data,
            getSessions: async () => (await this._request('get', '/accounts/services/sessions')).data,
            getMetaOAuthUrl: async () => (await this._request('get', '/accounts/services/sessions/auth/meta/url')).data,
            getMessages: async (params) => (await this._request('get', '/accounts/services/sessions/messages', { params })).data
        };

        // 9. Templates de Mensagens
        this.messageTemplates = {
            list: async () => (await this._request('get', '/accounts/message-templates')).data,
            create: async (data) => (await this._request('post', '/accounts/message-templates', { data })).data,
            update: async (data) => (await this._request('put', '/accounts/message-templates', { data })).data,
            delete: async (id) => (await this._request('delete', '/accounts/message-templates', { data: { id }, params: { id } })).data
        };

        // 10. Campanhas em Massa (Bulk Campaigns)
        this.bulkCampaigns = {
            list: async () => (await this._request('get', '/accounts/bulk-campaigns')).data,
            create: async (data) => (await this._request('post', '/accounts/bulk-campaigns', { data })).data,
            update: async (data) => (await this._request('put', '/accounts/bulk-campaigns', { data })).data
        };

        // 11. Automações & Agentes IA
        this.automations = {
            list: async () => (await this._request('get', '/accounts/automations')).data,
            create: async (data) => (await this._request('post', '/accounts/automations', { data })).data,
            update: async (data) => (await this._request('put', '/accounts/automations', { data })).data,
            delete: async (id) => (await this._request('delete', '/accounts/automations', { data: { id }, params: { id } })).data
        };

        // 12. Comunidades Inteligentes (Smart Communities)
        this.smartCommunities = {
            list: async () => (await this._request('get', '/accounts/smart-communities')).data,
            create: async (data) => (await this._request('post', '/accounts/smart-communities', { data })).data,
            getLogs: async () => (await this._request('get', '/accounts/smart-communities/logs')).data,
            testChannel: async (data) => (await this._request('post', '/accounts/smart-communities/test-channel', { data })).data,
            generatePreview: async (data) => (await this._request('post', '/accounts/smart-communities/generate-preview', { data })).data
        };

        // 13. Agendamentos & Calendários
        this.calendars = {
            list: async () => (await this._request('get', '/accounts/calendars')).data,
            create: async (data) => (await this._request('post', '/accounts/calendars', { data })).data,
            get: async (id) => (await this._request('get', `/accounts/calendars/${id}`)).data,
            update: async (id, data) => (await this._request('put', `/accounts/calendars/${id}`, { data })).data,
            delete: async (id) => (await this._request('delete', `/accounts/calendars/${id}`)).data
        };

        this.schedules = {
            list: async (params) => (await this._request('get', '/accounts/schedules', { params })).data,
            create: async (data) => (await this._request('post', '/accounts/schedules', { data })).data,
            get: async (id) => (await this._request('get', `/accounts/schedules/${id}`)).data,
            update: async (id, data) => (await this._request('put', `/accounts/schedules/${id}`, { data })).data,
            delete: async (id) => (await this._request('delete', `/accounts/schedules/${id}`)).data
        };

        // 14. Central de Atendimento & Suporte (Service Desk & Help Desk)
        this.serviceDesk = {
            getDashboard: async () => (await this._request('get', '/support/dashboard')).data,
            getTickets: async (params) => (await this._request('get', '/accounts/service-desk/tickets', { params })).data,
            getTicket: async (id) => (await this._request('get', `/accounts/service-desk/tickets/${id}`)).data,
            getContactHistory: async (contactId) => (await this._request('get', `/accounts/service-desk/tickets/history/${contactId}`)).data,
            assignTicket: async (id, data) => (await this._request('post', `/accounts/service-desk/tickets/${id}/assign`, { data })).data,
            transferTicket: async (id, data) => (await this._request('post', `/accounts/service-desk/tickets/${id}/transfer`, { data })).data,
            closeTicket: async (id, data) => (await this._request('post', `/accounts/service-desk/tickets/${id}/close`, { data })).data,
            reopenTicket: async (id) => (await this._request('post', `/accounts/service-desk/tickets/${id}/reopen`)).data
        };

        this.support = {
            getStats: async (params) => (await this._request('get', '/support/stats', { params })).data,
            listTickets: async (params) => (await this._request('get', '/support/tickets', { params })).data,
            createTicket: async (data) => (await this._request('post', '/support/tickets', { data })).data,
            getTicket: async (id) => (await this._request('get', `/support/tickets/${id}`)).data,
            updateTicket: async (id, data) => (await this._request('put', `/support/tickets/${id}`, { data })).data,
            addTicketMessage: async (id, data) => (await this._request('post', `/support/tickets/${id}/messages`, { data })).data
        };

        // 15. Faturamento & Assinaturas (Billing)
        this.billing = {
            getSummary: async () => (await this._request('get', '/billing/summary')).data,
            getPlans: async () => (await this._request('get', '/billing/plans')).data,
            createPlan: async (data) => (await this._request('post', '/billing/plans', { data })).data,
            updatePlan: async (id, data) => (await this._request('put', `/billing/plans/${id}`, { data })).data,
            deletePlan: async (id) => (await this._request('delete', `/billing/plans/${id}`)).data,
            getInvoices: async () => (await this._request('get', '/billing/invoices')).data,
            createInvoice: async (data) => (await this._request('post', '/billing/invoices', { data })).data,
            updateInvoice: async (id, data) => (await this._request('put', `/billing/invoices/${id}`, { data })).data,
            deleteInvoice: async (id) => (await this._request('delete', `/billing/invoices/${id}`)).data,
            sendInvoice: async (id) => (await this._request('post', `/billing/invoices/${id}/send`)).data,
            getPublicInvoice: async (uuid) => (await this._request('get', `/billing/public/${uuid}`)).data,
            checkout: async (data) => (await this._request('post', '/billing/checkout', { data })).data,
            getSettings: async () => (await this._request('get', '/billing/settings')).data,
            updateSettings: async (data) => (await this._request('put', '/billing/settings', { data })).data,
            getDiscounts: async () => (await this._request('get', '/billing/discounts')).data,
            createDiscount: async (data) => (await this._request('post', '/billing/discounts', { data })).data,
            updateDiscount: async (id, data) => (await this._request('put', `/billing/discounts/${id}`, { data })).data,
            deleteDiscount: async (id) => (await this._request('delete', `/billing/discounts/${id}`)).data,
            triggerCycle: async () => (await this._request('post', '/billing/trigger-cycle')).data
        };

        // 16. Webhooks
        this.webhooks = {
            list: async () => (await this._request('get', '/accounts/webhooks')).data,
            create: async (data) => (await this._request('post', '/accounts/webhooks', { data })).data,
            test: async (data) => (await this._request('post', '/accounts/webhooks/test', { data })).data
        };

        // 17. Mídias & Arquivos
        this.media = {
            getUrl: (filename, tempToken) => `${this.baseURL}/accounts/media/${filename}${tempToken ? `?token=${encodeURIComponent(tempToken)}` : ''}`,
            download: async (filename, options = {}) => (await this._request('get', `/accounts/media/${filename}`, { responseType: 'stream', ...options })).data
        };

        // 18. Localizações
        this.locations = {
            getCountries: async () => (await this._request('get', '/locations/countries')).data,
            getStates: async (countryId) => (await this._request('get', `/locations/states/${countryId}`)).data,
            getCities: async (stateId) => (await this._request('get', `/locations/cities/${stateId}`)).data
        };

        // 19. Administração & Auditoria Inteligente
        this.admin = {
            getStats: async () => (await this._request('get', '/admin/stats')).data,
            getLogs: async () => (await this._request('get', '/admin/logs')).data,
            analyzeAi: async (data) => (await this._request('post', '/admin/ai-analysis', { data })).data,
            getModules: async () => (await this._request('get', '/system/modules')).data
        };
    }
}

class UnityChatSession {
    constructor(token, sessionIdentifier, apiVersion = 1, options = {}) {
        if (!token || typeof token !== 'string' || !token.trim()) {
            throw new Error('Token é obrigatório para inicializar o UnityChatSession.');
        }
        if (!sessionIdentifier) {
            throw new Error('sessionName ou uuid é obrigatório para inicializar o UnityChatSession.');
        }

        this.token = token;
        this.apiVersion = apiVersion || 1;
        this.timeout = options.timeout || 30000;
        this.baseURL = (options.baseURL || options.baseUrl || `https://api.unitychat.areum.com.br/api/v${this.apiVersion}`).replace(/\/$/, '');

        // Resolução Híbrida: Suporta string (sessionName ou UUID) ou objeto { sessionName, uuid }
        if (typeof sessionIdentifier === 'string') {
            if (UUID_REGEX.test(sessionIdentifier)) {
                this.uuid = sessionIdentifier;
                this.sessionName = options.sessionName || null;
            } else {
                this.sessionName = sessionIdentifier;
                this.uuid = options.uuid || null;
            }
        } else if (typeof sessionIdentifier === 'object' && sessionIdentifier !== null) {
            this.sessionName = sessionIdentifier.sessionName || null;
            this.uuid = sessionIdentifier.uuid || null;
        }

        this.urls = {
            connect: `${this.baseURL}/whatsapp/sessions`,
            disconnect: `${this.baseURL}/whatsapp/sessions`,
            getSessionStatus: `${this.baseURL}/whatsapp/sessions`,
            getQRcode: `${this.baseURL}/whatsapp/sessions`,
            sendMessage: `${this.baseURL}/whatsapp/messages`,
            getMessages: `${this.baseURL}/accounts/services/sessions/messages`,
            getConversations: `${this.baseURL}/whatsapp/conversations`,
            verifyNumber: `${this.baseURL}/whatsapp/wa-account-verify`,
            groups: `${this.baseURL}/whatsapp/groups`,
            newsletters: `${this.baseURL}/whatsapp/newsletters`,
            me: `${this.baseURL}/whatsapp/sessions/me`
        };

        this.onError = null;
    }

    _handleError(exc) {
        if (typeof this.onError === 'function') {
            this.onError(exc);
        }
        return exc?.response?.data || { error: exc.message || exc };
    }

    _getIdentifier() {
        const id = {};
        if (this.uuid) id.uuid = this.uuid;
        if (this.sessionName) id.sessionName = this.sessionName;
        return id;
    }

    _syncSessionUuid(data) {
        if (data && data.uuid && !this.uuid) {
            this.uuid = data.uuid;
        }
        return data;
    }

    // ==========================================
    // 4. MÓDULO: WHATSAPP (CICLO DE VIDA & SESSÕES)
    // ==========================================

    /**
     * Inicializa ou cria uma nova sessão do WhatsApp.
     * Rota: POST /whatsapp/sessions
     */
    async connect(options = {}) {
        try {
            const payload = {
                sessionName: this.sessionName,
                ...options
            };
            const { data } = await axios.post(
                this.urls.connect,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`
                    },
                    timeout: this.timeout
                }
            );
            this._syncSessionUuid(data);
            return data;
        } catch (exc) {
            try {
                const statusData = await this.getStatus();
                if (statusData && statusData.status && !statusData.error) {
                    return statusData;
                }
            } catch (statusErr) {}
            return this._handleError(exc);
        }
    }

    /**
     * Ações do ciclo de vida: 'disconnect', 'logout' ou 'reconnect'.
     * Rota: PUT /whatsapp/sessions
     */
    async disconnect(action = 'disconnect') {
        try {
            const payload = {
                ...this._getIdentifier(),
                action
            };

            const response = await axios.put(this.urls.disconnect, payload, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });

            this._syncSessionUuid(response?.data);
            return response?.data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Desconecta e faz logout da sessão no WhatsApp.
     */
    async logout() {
        return this.disconnect('logout');
    }

    /**
     * Reconecta uma sessão desconectada.
     */
    async reconnect() {
        return this.disconnect('reconnect');
    }

    /**
     * Atualiza as configurações de bloqueios, PIX keys ou automações da sessão.
     * Rota: PATCH /whatsapp/sessions
     */
    async updateConfig(config = {}) {
        try {
            const payload = {
                ...this._getIdentifier(),
                ...config
            };
            const { data } = await axios.patch(this.urls.connect, payload, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            this._syncSessionUuid(data);
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Deleta a sessão permanentemente da memória e do banco de dados.
     * Rota: DELETE /whatsapp/sessions
     */
    async deleteSession() {
        try {
            const { data } = await axios.delete(this.urls.disconnect, {
                data: this._getIdentifier(),
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Consulta o status atual da sessão.
     * Rota: GET /whatsapp/sessions
     */
    async getStatus() {
        try {
            const { data } = await axios.get(this.urls.getSessionStatus, {
                params: {
                    ...this._getIdentifier()
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            this._syncSessionUuid(data);
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Obtém o QR Code para pareamento.
     * qrCode pode ser: true, 'render' ou false (QRCodeFormat)
     * Rota: GET /whatsapp/sessions?qrCode=...
     */
    async getQRcode(qrCode = 'render') {
        try {
            const { data } = await axios.get(this.urls.getQRcode, {
                params: {
                    ...this._getIdentifier(),
                    qrCode
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            this._syncSessionUuid(data);
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    // ==========================================
    // ENVIO DE MENSAGENS
    // ==========================================

    /**
     * Envia mensagem de qualquer tipo suportado: text, link, location, poll ou raw.
     * Rota: POST /whatsapp/messages
     */
    async sendMessage(message = { type: 'text' }) {
        try {
            const payload = {
                ...this._getIdentifier(),
                ...message
            };

            const response = await axios.post(
                this.urls.sendMessage,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`
                    },
                    timeout: this.timeout,
                    validateStatus: () => true
                }
            );

            const { data, status } = response;

            if (status >= 400 && typeof this.onError === 'function') {
                this.onError(new Error(`Erro HTTP ${status} ao enviar mensagem: ${JSON.stringify(data)}`));
            }

            return data;
        } catch (exc) {
            if (typeof this.onError === 'function') {
                this.onError(exc);
            }
            return { error: exc };
        }
    }

    /**
     * Helper para envio de mensagem de texto simples ou com link formatado.
     */
    async sendText(to, text, options) {
        return this.sendMessage({
            to,
            type: 'text',
            body: text,
            options
        });
    }

    /**
     * Helper para envio de mensagem de link com pré-visualização.
     */
    async sendLink(to, linkData, options) {
        return this.sendMessage({
            to,
            type: 'link',
            ...(typeof linkData === 'string' ? { body: linkData } : linkData),
            options
        });
    }

    /**
     * Helper para envio de coordenadas geográficas.
     */
    async sendLocation(to, lat, long, address) {
        return this.sendMessage({
            to,
            type: 'location',
            lat,
            long,
            address
        });
    }

    /**
     * Helper para envio de enquete interativa (Poll).
     */
    async sendPoll(to, pollName, pollOptions) {
        return this.sendMessage({
            to,
            type: 'poll',
            pollName,
            pollOptions
        });
    }

    /**
     * Helper para envio de estrutura bruta / interativa com botões ou PIX.
     */
    async sendRaw(to, body, options) {
        return this.sendMessage({
            to,
            type: 'raw',
            body,
            options
        });
    }

    /**
     * Envia arquivos anexados (imagens, vídeos, áudios e documentos) via multipart/form-data.
     * Rota: POST /whatsapp/messages
     */
    async sendFiles(message = { type: 'document' }) {
        try {
            const form = new FormData();

            const identifier = this._getIdentifier();
            if (identifier.uuid) form.append('uuid', identifier.uuid);
            if (identifier.sessionName) form.append('sessionName', identifier.sessionName);

            if (message.to) form.append('to', message.to);

            // Mapeia legado 'files' para 'document'
            let mediaType = message.type || 'document';
            if (mediaType === 'files') {
                mediaType = 'document';
            }
            form.append('type', mediaType);

            if (message.caption) form.append('caption', message.caption);

            const filesList = Array.isArray(message.files) ? message.files : [];

            for (const file of filesList) {
                const fileOptions = file.filename ? { filename: file.filename } : undefined;

                if (file.path) {
                    form.append('files', fs.createReadStream(file.path), fileOptions);
                } else if (file.base64) {
                    const cleanBase64 = file.base64.replace(/^data:[^;]+;base64,/, '');
                    form.append('files', Buffer.from(cleanBase64, 'base64'), fileOptions);
                } else if (file.stream) {
                    form.append('files', file.stream, fileOptions);
                } else if (file.buffer) {
                    form.append('files', file.buffer, fileOptions);
                }
            }

            const { data } = await axios.post(this.urls.sendMessage, form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });

            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    async sendImage(to, file, caption, options) {
        return this.sendFiles({
            to,
            type: 'image',
            caption,
            files: [file],
            options
        });
    }

    async sendVideo(to, file, caption, options) {
        return this.sendFiles({
            to,
            type: 'video',
            caption,
            files: [file],
            options
        });
    }

    async sendAudio(to, file, options) {
        return this.sendFiles({
            to,
            type: 'audio',
            files: [file],
            options
        });
    }

    async sendDocument(to, file, caption, options) {
        return this.sendFiles({
            to,
            type: 'document',
            caption,
            files: [file],
            options
        });
    }

    // ==========================================
    // HISTÓRICO, CONVERSAS E VALIDAÇÕES
    // ==========================================

    /**
     * Consulta histórico de mensagens de uma conversa.
     * Rota: GET /whatsapp/conversations
     */
    async getConversations(options = {}) {
        try {
            const chatId = options.chatId || options.from;
            const limit = options.limit || 50;

            const { data } = await axios.get(this.urls.getConversations, {
                params: {
                    ...this._getIdentifier(),
                    chatId,
                    limit
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Verifica se um número está registrado no WhatsApp (isOnWhatsApp).
     * Rota: GET /whatsapp/wa-account-verify
     */
    async verifyNumber(id) {
        try {
            const { data } = await axios.get(this.urls.verifyNumber, {
                params: {
                    ...this._getIdentifier(),
                    id
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Alias para verifyNumber.
     */
    async isOnWhatsApp(id) {
        return this.verifyNumber(id);
    }

    /**
     * Lista todos os grupos ou obtém metadados de um grupo específico.
     * Rota: GET /whatsapp/groups
     */
    async getGroups(groupId) {
        try {
            const params = {
                ...this._getIdentifier()
            };
            if (groupId) {
                params.id = groupId;
            }
            const { data } = await axios.get(this.urls.groups, {
                params,
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Lista todos os canais/newsletters ou metadados de um canal específico.
     * Rota: GET /whatsapp/newsletters
     */
    async getNewsletters(newsletterId) {
        try {
            const params = {
                ...this._getIdentifier()
            };
            if (newsletterId) {
                params.id = newsletterId;
            }
            const { data } = await axios.get(this.urls.newsletters, {
                params,
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Obtém informações do perfil da conta conectada (Push Name, LID, foto).
     * Rota: GET /whatsapp/sessions/me
     */
    async getMe() {
        try {
            const { data } = await axios.get(this.urls.me, {
                params: {
                    ...this._getIdentifier()
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Consulta banco centralizado de mensagens omnichannel.
     * Rota: GET /accounts/services/sessions/messages
     */
    async getMessages(options = {}) {
        try {
            const { data } = await axios.get(this.urls.getMessages, {
                params: {
                    ...this._getIdentifier(),
                    from: options.from,
                    mode: options.mode,
                    chat_id: options.chatId || options.chat_id,
                    limit: options.limit
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Dispara o re-bootstrap assíncrono das sessões WhatsApp em background.
     * Rota: GET /whatsapp/management/reload
     */
    async reload() {
        try {
            const { data } = await axios.get(`${this.baseURL}/whatsapp/management/reload`, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }

    /**
     * Consulta as estatísticas e status atual do processo de bootstrap.
     * Rota: GET /whatsapp/management/status
     */
    async getManagementStatus() {
        try {
            const { data } = await axios.get(`${this.baseURL}/whatsapp/management/status`, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                timeout: this.timeout
            });
            return data;
        } catch (exc) {
            return this._handleError(exc);
        }
    }
}

module.exports = {
    UnityChatService,
    UnityChatSession,
    UnityChatSessionsManager,
};
