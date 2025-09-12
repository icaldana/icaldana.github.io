// Função Netlify para criar transação de autenticação
exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, Accept, Origin, Referer, User-Agent',
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
        console.log('📝 Criando transação de autenticação via Netlify Function');
        console.log('Headers:', event.headers);
        console.log('Body:', event.body);

        const response = await fetch('https://login-sandbox.melioffice.com/internal/authentication_transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': event.headers['x-user-id'] || event.headers['X-User-Id'],
                'Accept': 'application/json',
                'User-Agent': 'Netlify-Function-Proxy/1.0'
            },
            body: event.body || '{}'
        });

        const data = await response.json();

        console.log('✅ Resposta do MP:', response.status, data);

        return {
            statusCode: response.status,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('❌ Erro na função auth-create:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: error.message,
                timestamp: new Date().toISOString(),
                function: 'auth-create'
            })
        };
    }
};
