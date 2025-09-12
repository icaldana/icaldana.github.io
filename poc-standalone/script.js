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
        this.currentSecurityToken = null;
        this.setupEventListeners();
        this.logger.log('🚀 POC WebAuthn inicializada', 'info');
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
    }

    validateInputs() {
        const userId = document.getElementById('user-id').value;
        const transactionId = document.getElementById('transaction-id').value;

        if (!userId || !transactionId) {
            throw new Error('User ID e Transaction ID são obrigatórios');
        }

        return { userId, transactionId };
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

    async handleAuthenticationClick() {
        const button = document.getElementById('authenticate-btn');

        // Configurar UI para estado de loading
        button.disabled = true;
        button.classList.add('loading');
        button.textContent = '⏳ Processando...';
        this.updateStatus('Validando dados de entrada...', 'loading');

        try {
            // Validar inputs obrigatórios
            const { userId, transactionId } = this.validateInputs();
            this.logger.log(`✅ Iniciando WebAuthn - User: ${userId}, TX: ${transactionId}`, 'info');

            // Iniciar autenticação WebAuthn
            this.updateStatus('Aguardando autenticação WebAuthn...', 'loading');

            const result = await this.authenticateWithPasskey(userId, transactionId);

            if (result.success) {
                this.handleSuccessfulAuth(result);
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
            // Criar MessageChannel para comunicação segura
            this.messageChannel = new MessageChannel();
            const port1 = this.messageChannel.port1;
            const port2 = this.messageChannel.port2;

            // Configurar listener para resposta
            port1.onmessage = (event) => {
                const { message, data } = event.data;

                switch (message) {
                    case 'authenticate':
                        // Sucesso! Recebeu o security token dos Factors
                        this.logger.log(`✅ Token obtido: ${data.securityToken.substring(0, 30)}...`, 'success');
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
                        this.logger.log(`❌ Erro: ${data.error.message}`, 'error');
                        resolve({
                            success: false,
                            error: data.error,
                        });
                        break;

                    case 'ready':
                        // Iframe carregado e pronto
                        break;

                    default:
                        break;
                }

                port1.close();
            };

            // Obter referência do iframe
            this.iframe = document.getElementById('passkey-iframe');

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
                // Enviar mensagem para iniciar o fluxo
                const messageData = {
                    message: 'authenticate',
                    data: {
                        userId,
                        transactionId,
                        timestamp: Date.now()
                    },
                };

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

    handleSuccessfulAuth(result) {
        this.updateStatus('✅ Autenticação realizada com sucesso!', 'success');

        const securityToken = result.securityToken || result.token;
        this.currentSecurityToken = securityToken;

        // Exibir resultado final
        this.displayResult({
            success: true,
            securityToken: securityToken,
            sessionId: result.sessionId,
            timestamp: result.timestamp
        });

        // Exibir security token em destaque
        this.displaySecurityToken(securityToken);

        this.logger.log(`✅ Autenticação concluída! Token: ${securityToken.substring(0, 30)}...`, 'success');
    }

    handleAuthError(error) {
        this.logger.log(`❌ Falha na autenticação: ${error.message}`, 'error');

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
            }
        });
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

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando POC WebAuthn Standalone...');
    window.passkeyIntegration = new PasskeyStandaloneIntegration();

    console.log('✅ POC inicializada com sucesso!');
    console.log('💡 Use window.passkeyIntegration.authenticateWithPasskey() para testes manuais');
});
