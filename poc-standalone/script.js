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

        this.config = {
            timeout: 60000
        };


        this.setupEventListeners();
        this.logger.log('🚀 WebAuthn POC initialized', 'info');
    }

    setupEventListeners() {
        // Authentication button
        document.getElementById('authenticate-btn').addEventListener('click', () => {
            this.handleAuthenticationClick();
        });

        // Clear logs button
        document.getElementById('clear-logs').addEventListener('click', () => {
            this.logger.clear();
        });

        window.addEventListener('message', (event) => {
            this.logger.log(`📨 Window message from ${event.origin}`, 'info');
        });

        window.addEventListener('error', (event) => {
            this.logger.log(`💥 Global Error: ${event.message}`, 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logger.log(`💥 Unhandled Promise Rejection: ${event.reason}`, 'error');
        });
    }

    validateInputs() {
        const userId = document.getElementById('user-id').value;
        const transactionId = document.getElementById('transaction-id').value;

        if (!userId || !transactionId) {
            throw new Error('User ID and Transaction ID are required');
        }

        return { userId, transactionId };
    }

    displaySecurityToken(securityToken) {
        const tokenDisplay = document.createElement('div');
        tokenDisplay.className = 'security-token-display';
        tokenDisplay.innerHTML = `
            <div class="security-token-label">🎫 Security Token Obtained:</div>
            <div class="security-token-value">${securityToken}</div>
        `;

        this.resultElement.insertBefore(tokenDisplay, this.resultElement.firstChild);
    }

    async handleAuthenticationClick() {
        const button = document.getElementById('authenticate-btn');

        // Configure UI for loading state
        button.disabled = true;
        button.classList.add('loading');
        button.textContent = '⏳ Processing...';
        this.updateStatus('Validating input data...', 'loading');

        try {
            // Validate required inputs
            const { userId, transactionId } = this.validateInputs();
            this.logger.log(`✅ Starting WebAuthn - User: ${userId}, TX: ${transactionId}`, 'info');

            // Start WebAuthn authentication
            this.updateStatus('Waiting for WebAuthn authentication...', 'loading');

            const result = await this.authenticateWithPasskey(userId, transactionId);

            if (result.success) {
                this.handleSuccessfulAuth(result);
            } else {
                this.handleAuthError(result.error);
            }
        } catch (error) {
            this.logger.log(`❌ Process error: ${error.message}`, 'error');
            this.handleAuthError({ message: error.message, retriable: true });
        } finally {
            // Restore UI
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = '🚀 Start FIDO Authentication';
        }
    }

    async authenticateWithPasskey(userId = null, transactionId = null) {
        return new Promise((resolve, reject) => {
            // Create MessageChannel for secure communication
            this.messageChannel = new MessageChannel();
            const port1 = this.messageChannel.port1;
            const port2 = this.messageChannel.port2;

            // Configurar listener para resposta
            port1.onmessage = (event) => {
                this.logger.log('📨 Message received via MessageChannel', 'info');
                const { message, data } = event.data;

                switch (message) {
                    case 'authenticate':
                        // Success! Received security token from Factors
                        this.logger.log(`✅ Token obtained: ${data.securityToken?.substring(0, 30) || 'N/A'}...`, 'success');
                        resolve({
                            success: true,
                            token: data.token,
                            transactionCode: data.transactionCode || data.token, // The credential.id
                            securityToken: data.securityToken, // Security token obtained from Factors
                            sessionId: data.sessionId || `session_${Date.now()}`,
                            timestamp: data.timestamp || new Date().toISOString(),
                            credentialId: data.credentialId,
                            validationType: data.validationType
                        });
                        break;

                    case 'error':
                        // Authentication error
                        const error = data.error || {};
                        this.logger.log(`❌ Error: ${error.message} (${error.cause || 'Unknown'})`, 'error');
                        resolve({
                            success: false,
                            error: {
                                message: error.message,
                                name: error.name || 'AuthenticationError',
                                retriable: error.retriable || false,
                                cause: error.cause || 'UNKNOWN_ERROR',
                                timestamp: error.timestamp || new Date().toISOString()
                            },
                        });
                        break;

                    case 'cancelled':
                        // Usuário cancelou
                        this.logger.log('🚫 Authentication cancelled by user', 'error');
                        resolve({
                            success: false,
                            error: {
                                message: 'User cancelled authentication',
                                name: 'UserCancelledError',
                                retriable: true,
                                cause: 'USER_CANCELLED'
                            }
                        });
                        break;

                    case 'ready':
                        // Iframe loaded and ready
                        this.logger.log('✅ Iframe ready for authentication', 'info');
                        break;

                    default:
                        this.logger.log(`❓ Unknown message type: ${message}`, 'info');
                        break;
                }

                port1.close();
            };

            // Get iframe reference
            this.iframe = document.getElementById('passkey-iframe');

            // Configure timeout
            const timeoutId = setTimeout(() => {
                if (port1.onmessage) {
                    port1.close();
                    this.logger.log(`⏰ Authentication timeout (${this.config.timeout / 1000}s)`, 'error');
                    reject(new Error(`Authentication timeout after ${this.config.timeout / 1000} seconds`));
                }
            }, this.config.timeout);

            // Wait for iframe to load
            const handleIframeLoad = () => {
                // Send message to start the flow
                const messageData = {
                    message: 'authenticate',
                    data: {
                        userId,
                        transactionId,
                        timestamp: Date.now()
                    },
                };

                this.iframe.contentWindow.postMessage(messageData, '*', [port2]);

                // Clear timeout if everything went well
                clearTimeout(timeoutId);
            };

            // Check if iframe is already loaded
            if (this.iframe.contentDocument && this.iframe.contentDocument.readyState === 'complete') {
                handleIframeLoad();
            } else {
                this.iframe.onload = handleIframeLoad;
            }
        });
    }

    handleSuccessfulAuth(result) {
        this.updateStatus('✅ Authentication completed successfully!', 'success');

        const securityToken = result.securityToken || result.token;
        this.currentSecurityToken = securityToken;

        // Display final result
        this.displayResult({
            success: true,
            securityToken: securityToken,
            sessionId: result.sessionId,
            timestamp: result.timestamp
        });

        // Highlight security token display
        this.displaySecurityToken(securityToken);

        this.logger.log(`✅ Authentication completed! Token: ${securityToken.substring(0, 30)}...`, 'success');
    }

    handleAuthError(error) {
        this.logger.log(`❌ Authentication failure: ${error.message}`, 'error');

        let statusMessage = '❌ Authentication failure';
        if (error.retriable) {
            statusMessage += ' (can try again)';
        }

        let suggestion = this.getErrorSuggestion(error);

        this.updateStatus(statusMessage, 'error');

        // Display detailed error
        this.displayResult({
            success: false,
            error: {
                message: error.message,
                name: error.name || 'AuthenticationError',
                retriable: error.retriable || false,
                cause: error.cause || 'Erro desconhecido',
                suggestion: suggestion,
                timestamp: error.timestamp || new Date().toISOString()
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
    getErrorSuggestion(error) {
        switch (error.cause) {
            case 'USER_CANCELLED':
                return 'Try the authentication again and complete the biometric verification.';
            case 'NO_PASSKEY_AVAILABLE':
                return 'Register a passkey for this account or use a device with a registered passkey.';
            case 'NETWORK_ERROR':
                return 'Check your internet connection and try again.';
            case 'SECURITY_ERROR':
                return 'Ensure you are using HTTPS and the iframe can load properly.';
            default:
                return 'Please try again or contact support if the issue persists.';
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando POC WebAuthn Standalone...');
    window.passkeyIntegration = new PasskeyStandaloneIntegration();

    console.log('✅ POC inicializada com sucesso!');
    console.log('💡 Use window.passkeyIntegration.authenticateWithPasskey() para testes manuais');
});
