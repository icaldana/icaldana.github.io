// Função Netlify para validar transação com WebAuthn
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
        const transactionId = pathSegments[pathSegments.length - 2]; // .../{id}/validation

        if (!transactionId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Transaction ID is required' })
            };
        }

        console.log(`🔄 Validando transação ${transactionId} via Netlify Function`);
        console.log('Body:', event.body);

        const response = await fetch(`https://login-sandbox.melioffice.com/internal/authentication_transactions/${transactionId}/validation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Netlify-Function-Proxy/1.0'
            },
            body: event.body
        });

        const data = await response.json();

        console.log(`✅ Validação ${transactionId}:`, response.status, data);

        return {
            statusCode: response.status,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('❌ Erro na função auth-validate:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: error.message,
                timestamp: new Date().toISOString(),
                function: 'auth-validate'
            })
        };
    }
};
