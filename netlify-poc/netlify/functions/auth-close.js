// Função Netlify para fechar transação e obter security token
exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin, Referer, User-Agent',
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: 'OK'
        };
    }

    // Only allow POST method
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Extract transaction ID from path
        const pathSegments = event.path.split('/');
        const transactionId = pathSegments[pathSegments.length - 2]; // .../{id}/close

        if (!transactionId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Transaction ID is required' })
            };
        }

        console.log(`🎫 Fechando transação ${transactionId} via Netlify Function`);
        console.log('Body:', event.body);

        const response = await fetch(`https://login-sandbox.melioffice.com/internal/authentication_transactions/${transactionId}/close`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Netlify-Function-Proxy/1.0'
            },
            body: event.body
        });

        // Se endpoint /close não existir, retornar fallback
        if (!response.ok && response.status === 404) {
            const requestBody = JSON.parse(event.body || '{}');
            const fallbackToken = requestBody.transaction_code || `fallback_${transactionId}`;

            console.log(`⚠️ Endpoint /close não disponível, usando fallback: ${fallbackToken}`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    security_token: fallbackToken,
                    token: fallbackToken,
                    status: 'completed',
                    fallback: true,
                    timestamp: new Date().toISOString()
                })
            };
        }

        const data = await response.json();

        console.log(`✅ Fechamento ${transactionId}:`, response.status, data);

        return {
            statusCode: response.status,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('❌ Erro na função auth-close:', error);

        // Fallback em caso de erro
        try {
            const requestBody = JSON.parse(event.body || '{}');
            const fallbackToken = requestBody.transaction_code || `error_fallback_${Date.now()}`;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    security_token: fallbackToken,
                    token: fallbackToken,
                    status: 'completed',
                    fallback: true,
                    error: error.message,
                    timestamp: new Date().toISOString()
                })
            };
        } catch (parseError) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: error.message,
                    timestamp: new Date().toISOString(),
                    function: 'auth-close'
                })
            };
        }
    }
};
