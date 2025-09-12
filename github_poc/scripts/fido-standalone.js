const ONLINE_PAYMENTS_CONFIG = {
    authTransactionsApiUrl: 'https://login-sandbox.melioffice.com/internal/authentication_transactions',
    passkeyValidationUrl: 'https://auth-passkey-frontend.sandbox.melioffice.com',
    timeout: 60000
};

class FidoLogger {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
      <span class="timestamp">[${timestamp}]</span> ${message}
    `;

        this.container.appendChild(logEntry);
        this.container.scrollTop = this.container.scrollHeight;
    }

    clear() {
        this.container.innerHTML = '<div class="log-entry info"><span class="timestamp">Logs limpos...</span></div>';
    }
}

class PasskeyStandaloneIntegration {
    constructor() {
        this.iframe = null;
        this.messageChannel = null;
        this.logger = new FidoLogger('communication-logs');
        this.statusElement = document.getElementById('auth-status');
        this.resultElement = document.getElementById('auth-result');
        this.paymentMethodsElement = document.getElementById('payment-methods');
        this.currentTransactionId = null;
        this.currentSecurityToken = null;
        this.setupEventListeners();
        this.logger.log('🔧 Github Pages Integration inicializada', 'info');
    }

    setupEventListeners() {
        // Botão de autenticação
        document.getElementById('authenticate-btn').addEventListener('click', () => {
            this.handleAuthenticationClick();
        });

        // Botão de limpar logs
        document.getElementById('clear-logs').addEventListener('click', () => {
            this.logger.clear();
        });

        this.logger.log('📝 Event listeners configurados', 'info');
    }

    getPaymentContext() {
        const userId = document.getElementById('user-id').value;

        if (!userId) {
            throw new Error('User ID é obrigatório');
        }

        return {
            userId,
            paymentContext: {
                amount: 100.00,
                currency: 'ARS',
                merchantId: 'MERCHANT_TEST',
                paymentMethodTypes: ['credit_card', 'debit_card', 'account_money'],
                site: 'MLA'
            }
        };
    }

    async createAuthenticationTransaction() {
        try {
            this.updateStatus('Criando transação de autenticação...', 'loading');

            const config = ONLINE_PAYMENTS_CONFIG;
            const { userId, paymentContext } = this.getPaymentContext();

            this.logger.log(`💰 Contexto coletado (para uso futuro): ${JSON.stringify(paymentContext)}`, 'info');

            const response = await fetch(config.authTransactionsApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': userId
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            this.logger.log(`📋 Resposta da criação: ${JSON.stringify(data)}`, 'info');

            const transactionId = data.id || data.transaction_id || data.txId;
            this.currentTransactionId = transactionId;

            return transactionId;

        } catch (error) {
            this.logger.log(`❌ Erro ao criar transação: ${error.message}`, 'error');
            throw new Error(`Falha ao criar transação: ${error.message}`);
        }
    }

    async getMediosDePago(securityToken) {
        // Em uma implementação real, aqui seria feita a chamada para a API de medios de pago
        // usando o security token obtido dos Factors
        this.logger.log(`💳 [SIMULADO] Obtenção de medios de pago com token: ${securityToken.substring(0, 20)}...`, 'info');

        return {
            message: 'Medios de pago seriam carregados aqui usando o security token',
            token: securityToken,
            status: 'ready_for_implementation',
            github_pages: true
        };
    }

    displaySecurityToken(securityToken) {
        const tokenDisplay = document.createElement('div');
        tokenDisplay.className = 'security-token-display';
        tokenDisplay.innerHTML = `
            <div class="security-token-label">🎫 Security Token Obtido:</div>
            <div class="security-token-value">${securityToken}</div>
        `;

        this.resultElement.insertBefore(tokenDisplay, this.resultElement.firstChild);
    }

    displayPaymentMethods(paymentMethodsResult) {
        this.paymentMethodsElement.innerHTML = `
            <div class="result-placeholder">
                <strong>✅ Integração com Medios de Pago</strong>
                <p>${paymentMethodsResult.message}</p>
                <small>Status: ${paymentMethodsResult.status}</small>
                <br><small>🌐 Hospedado no: Github Pages</small>
            </div>
        `;
    }

    async handleAuthenticationClick() {
        const button = document.getElementById('authenticate-btn');
        const userId = document.getElementById('user-id').value;

        this.logger.log('🚀 Iniciando processo de autenticação no Github Pages...', 'info');

        // Configurar UI para estado de loading
        button.disabled = true;
        button.classList.add('loading');
        button.textContent = '⏳ Processando...';
        this.updateStatus('Conectando com serviço de autenticação...', 'loading');

        try {
            this.paymentMethodsElement.innerHTML = `
                <div class="result-placeholder">
                    Processando autenticação...
                </div>
            `;

            // ✨ PASSO 1: Criar transação no backend
            this.logger.log('📝 Criando transação de autenticação...', 'info');
            const transactionId = await this.createAuthenticationTransaction();
            this.logger.log(`✅ Transação criada: ${transactionId}`, 'success');

            // ✨ PASSO 2: Validar com Passkeys
            this.logger.log('🔐 Iniciando validação com Passkeys...', 'info');
            const result = await this.authenticateWithPasskey(userId, transactionId);

            if (result.success) {
                await this.handleSuccessfulAuth(result);
            } else {
                this.handleAuthError(result.error);
            }
        } catch (error) {
            this.logger.log(`❌ Erro no processo: ${error.message}`, 'error');
            this.handleAuthError({ message: error.message, retriable: true });
        } finally {
            // Restaurar UI
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = '🚀 Iniciar Autenticação FIDO';
        }
    }

    async authenticateWithPasskey(userId = null, transactionId = null) {
        return new Promise((resolve, reject) => {
            this.logger.log('📡 Criando MessageChannel para comunicação segura', 'info');

            // Criar MessageChannel para comunicação segura
            this.messageChannel = new MessageChannel();
            const port1 = this.messageChannel.port1;
            const port2 = this.messageChannel.port2;

            // Configurar listener para resposta
            port1.onmessage = (event) => {
                const { message, data } = event.data;
                this.logger.log(`📨 Mensagem recebida: ${message}`, 'info');

                switch (message) {
                    case 'authenticate':
                        // Sucesso! Recebeu o security token dos Factors
                        this.logger.log(`✅ Autenticação bem-sucedida: ${data.token}`, 'success');
                        this.logger.log(`🎫 Security token recebido: ${data.securityToken}`, 'success');
                        resolve({
                            success: true,
                            token: data.token,
                            transactionCode: data.token, // O credential.id
                            securityToken: data.securityToken, // Security token obtido pelos Factors
                            sessionId: data.sessionId || `session_${Date.now()}`,
                            timestamp: new Date().toISOString()
                        });
                        break;

                    case 'error':
                        // Erro na autenticação
                        this.logger.log(`❌ Erro na autenticação: ${data.error.message}`, 'error');
                        resolve({
                            success: false,
                            error: data.error,
                        });
                        break;

                    case 'ready':
                        // Iframe carregado e pronto
                        this.logger.log('✅ Iframe carregado e pronto para comunicação', 'success');
                        break;

                    default:
                        this.logger.log(`⚠️ Mensagem desconhecida: ${message}`, 'warning');
                }

                port1.close();
            };

            // Obter referência do iframe
            this.iframe = document.getElementById('passkey-iframe');
            this.logger.log('🖼️ Obtendo referência do iframe', 'info');

            // Configurar timeout de 60 segundos
            const timeoutId = setTimeout(() => {
                if (port1.onmessage) {
                    port1.close();
                    this.logger.log('⏰ Timeout na autenticação (60s)', 'error');
                    reject(new Error('Timeout na autenticação após 60 segundos'));
                }
            }, 60000);

            // Aguardar o iframe carregar
            const handleIframeLoad = () => {
                this.logger.log('🔄 Iframe carregado, enviando mensagem de autenticação', 'info');

                // Enviar mensagem para iniciar o fluxo
                const messageData = {
                    message: 'authenticate',
                    data: {
                        userId,
                        transactionId,
                        timestamp: Date.now(),
                        source: 'github_pages'
                    },
                };

                this.logger.log(`📤 Enviando dados: ${JSON.stringify(messageData.data)}`, 'info');

                this.iframe.contentWindow.postMessage(messageData, '*', [port2]);

                // Limpar timeout se tudo correu bem
                clearTimeout(timeoutId);
            };

            // Verificar se o iframe já está carregado
            if (this.iframe.contentDocument && this.iframe.contentDocument.readyState === 'complete') {
                handleIframeLoad();
            } else {
                this.iframe.onload = handleIframeLoad;
            }
        });
    }

    async handleSuccessfulAuth(result) {
        this.logger.log('🎉 Processando autenticação bem-sucedida no Github Pages', 'success');
        this.updateStatus('✅ Autenticação realizada com sucesso!', 'success');

        try {
            const transactionCode = result.transactionCode || result.token;

            // ✨ PASSO 3: Usar security token obtido pelos Factors
            const securityToken = result.securityToken || transactionCode;
            this.currentSecurityToken = securityToken;
            this.logger.log(`🎫 Usando security token obtido pelos Factors: ${securityToken}`, 'success');

            this.logger.log('💳 Integração com medios de pago...', 'info');
            this.updateStatus('💳 Preparando integração com medios de pago...', 'loading');

            const paymentMethodsResult = await this.getMediosDePago(securityToken);

            this.updateStatus('✅ Integração FIDO Standalone concluída no Github Pages!', 'success');

            this.displayResult({
                success: true,
                transactionId: this.currentTransactionId,
                transactionCode: transactionCode,
                securityToken: securityToken,
                paymentMethodsStatus: paymentMethodsResult.status,
                sessionId: result.sessionId,
                timestamp: result.timestamp,
                environment: 'github_pages'
            });

            // Exibir security token
            this.displaySecurityToken(securityToken);

            // Exibir medios de pago
            this.displayPaymentMethods(paymentMethodsResult);

            this.logger.log('🎊 Fluxo FIDO Standalone completo no Github Pages!', 'success');
            this.logger.log(`📊 Resumo: TX:${this.currentTransactionId} | Token:${securityToken.substring(0, 20)}...`, 'info');

        } catch (error) {
            this.logger.log(`❌ Erro no pós-processamento: ${error.message}`, 'error');

            // Fallback: exibir resultado básico
            this.displayResult({
                success: true,
                transactionCode: result.transactionCode,
                sessionId: result.sessionId,
                timestamp: result.timestamp,
                token: result.token,
                warning: 'Alguns passos do fluxo falharam',
                environment: 'github_pages'
            });

            this.paymentMethodsElement.innerHTML = `
                <div class="result-placeholder">
                    ⚠️ Erro na integração: ${error.message}
                </div>
            `;
        }
    }

    handleAuthError(error) {
        this.logger.log(`🚨 Processando erro de autenticação: ${error.message}`, 'error');

        let statusMessage = '❌ Falha na autenticação';
        if (error.retriable) {
            statusMessage += ' (pode tentar novamente)';
        }

        this.updateStatus(statusMessage, 'error');

        // Exibir erro detalhado
        this.displayResult({
            success: false,
            error: {
                message: error.message,
                retriable: error.retriable,
                cause: error.cause || 'Erro desconhecido',
                timestamp: new Date().toISOString()
            },
            environment: 'github_pages'
        });

        // Limpar medios de pago em caso de erro
        this.paymentMethodsElement.innerHTML = `
            <div class="result-placeholder">
                ❌ Erro na autenticação. Complete a autenticação para ver os medios de pago.
            </div>
        `;

        // Sugestões baseadas no tipo de erro
        if (error.retriable) {
            this.logger.log('🔄 Erro temporário - tente novamente em alguns segundos', 'warning');
        } else {
            this.logger.log('🛑 Erro permanente - considere usar método alternativo', 'error');
        }
    }

    updateStatus(message, type) {
        this.statusElement.textContent = message;
        this.statusElement.className = `auth-status ${type}`;
    }

    displayResult(data) {
        const formattedData = JSON.stringify(data, null, 2);
        this.resultElement.innerHTML = `<div class="result-data">${this.syntaxHighlight(formattedData)}</div>`;
    }

    syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'value';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                }
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando FIDO Standalone POC no Github Pages...');
    window.passkeyIntegration = new PasskeyStandaloneIntegration();

    console.log('✅ POC inicializada no Github Pages!');
    console.log('💡 Use window.passkeyIntegration.authenticateWithPasskey() para testes manuais');
});
