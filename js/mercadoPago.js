const publicKey = "APP_USR-3221c3fc-b9b2-4e68-a278-63bb4c46f578";
const mp = new MercadoPago(publicKey, {
    locale: "pt-BR",
});

async function process() {
    const payerEmail = "test_user_1413841135@testuser.com";
    const totalAmount = "200.00";
    let authenticator;
    let authorizationToken;
    let accountPaymentMethodsResponse;

    try {
        authenticator = await mp.authenticator(totalAmount, payerEmail);
    } catch (error) {
        const { message, errorCode, details } = error;
        console.error("Authenticator error:", { message, errorCode, details });
        return; // Or throw error for caller to handle
    }

    try {
        authorizationToken = await authenticator.show();
    } catch (error) {
        const { message, errorCode, details } = error;
        console.error("Authorization token error:", { message, errorCode, details });
        return; // Or throw error
    }

    try {
        accountPaymentMethodsResponse = await mp.getAccountPaymentMethods(authorizationToken);
        return accountPaymentMethodsResponse;
    } catch (error) {
        const { message, errorCode, details } = error;
        console.error("Get account payment methods error:", { message, errorCode, details });
        return; // Or throw error
    }
}

export { process };
