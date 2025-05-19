window.MPAuthenticator = (function () {
    const publicKey = "APP_USR-3221c3fc-b9b2-4e68-a278-63bb4c46f578";
    const mp = new MercadoPago(publicKey, {
        locale: "pt-BR",
    });

    async function initializePaymentData() {
        const payerEmail = "test_user_1413841135@testuser.com";
        const totalAmount = "200.00";

        const authenticator = await initializeAuthenticator(totalAmount, payerEmail);
        const authorizationToken = await getAuthorizationToken(authenticator);
        const accountPaymentMethodsResponse = await getAccountPaymentMethods(authorizationToken);

        return { accountPaymentMethodsResponse, authorizationToken };
    }

    async function initializeAuthenticator(amount, payerEmail) {
        try {
            // Starts the authentication flow using the payer's email and amount
            const authenticator = await mp.authenticator(amount, payerEmail);
            return authenticator;
        } catch (error) {
            console.log({ message: error.message, errorCode: error?.errorCode });
            throw error;
        }
    }

    async function getAuthorizationToken(authenticator) {
        try {
            // Shows the authentication modal flow and returns the token
            const authorizationToken = await authenticator.show();
            return authorizationToken;
        } catch (error) {
            console.log({ message: error.message, errorCode: error?.errorCode });
            throw error;
        }
    }

    async function getAccountPaymentMethods(authorizationToken) {
        try {
            // Gets the payment methods available for the user
            const userPaymentMethods = await mp.getAccountPaymentMethods(authorizationToken);
            return userPaymentMethods;
        } catch (error) {
            console.log({ message: error.message, errorCode: error?.errorCode, details: error?.details });
            throw error;
        }
    }

    async function getCardId(authorizationToken, selectedCardPaymentMethodToken) {
        try {
            // Gets the identification number from the selected payment method
            const { card_id } = await mp.getCardId(authorizationToken, selectedCardPaymentMethodToken);
            return card_id;
        } catch (error) {
            console.log({ message: error.message, errorCode: error?.errorCode, details: error?.details });
            throw error;
        }
    }

    function createSecureField(cardData, cvvContainerId) {
        // Creates a secure fields to get the CVV from the selected payment method
        const field = mp.fields.create('securityCode', {
            placeholder: cardData.security_code_settings.placeholder || "CVV",
        });

        field.mount(`#${cvvContainerId}`);
        field.update({ settings: cardData.security_code_settings });
        return field;
    }

    async function getCardToken(cardId) {
        try {
            // Generates a payment intention token for the selected payment method
            const { id: cardToken } = await mp.fields.createCardToken({ cardId });
            return cardToken;
        } catch (error) {
            console.error("Error while generating card token:", error);
        }
    }

    async function updateSelectedCardToken(authorizationToken, selectedCardPaymentMethodToken, cardToken) {
        try {
            // Updates the card token (pseudotoken) for the selected payment method
            await mp.updatePseudotoken(authorizationToken, selectedCardPaymentMethodToken, cardToken);
        } catch (error) {
            console.log({ message: error.message, errorCode: error?.errorCode, details: error?.details });
            throw error;
        }
    }


    return {
        mp: mp,
        initializePaymentData,
        createSecureField,
        getCardId,
        getCardToken,
        updateSelectedCardToken
    };
})();
