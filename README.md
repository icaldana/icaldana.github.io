# Mercado Pago Transparent Checkout Integration Example (Dynamic CVV)

This project demonstrates integration with Mercado Pago's Transparent Checkout, focusing on secure CVV collection for saved cards and updating the card token (pseudotoken).

## Functionality Overview

The main implemented flow is:

1.  Initialization of the Mercado Pago SDK.
2.  User/payment authentication to obtain an `authorizationToken`.
3.  Fetching saved payment methods from the Mercado Pago account.
4.  Rendering the payment methods.
5.  When a saved credit card requiring CVV is selected:
    - Rendering a Mercado Pago Secure Field for CVV input.
    - Obtaining the `card_id` of the selected card.
    - Creating a `cardToken` (single-use token) from the `card_id` and the CVV entered in the Secure Field.
    - Updating the `selectedCard.token` (pseudotoken) of the saved card with the newly generated `cardToken`.
6.  Simulation of payment processing (call to a placeholder backend endpoint).

## Project Structure

```
.├── index.html              # Main HTML document, user interface
├── css/
│   └── style.css           # Styles for the application
├── js/
│   ├── mercadoPago.js      # Mercado Pago SDK interaction logic (encapsulated in window.MPAuthenticator)
│   └── script.js           # DOM manipulation, UI logic, calls to MPAuthenticator
└── README.md               # This documentation
```

## JavaScript Implementation Details

To simplify local execution directly from the filesystem (`file:///`) and avoid CORS issues with ES6 modules, the project does not use native `import`/`export`. Instead, scripts are loaded sequentially in `index.html`.

The Mercado Pago interaction logic is centralized in the `js/mercadoPago.js` file. This file defines a global object `window.MPAuthenticator` that encapsulates all calls to the Mercado Pago SDK and related flow logic. The main responsibilities of `MPAuthenticator` include:

- **`MPAuthenticator.initializePaymentData()`**: Orchestrates the initial authentication process (`mp.authenticator`, `authenticator.show`) and fetching account payment methods (`mp.getAccountPaymentMethods`). Returns payment methods and the `authorizationToken`.
- **`MPAuthenticator.initializeAuthenticator(amount, payerEmail)`**: Starts the Mercado Pago authentication flow.
- **`MPAuthenticator.getAuthorizationToken(authenticator)`**: Displays the authentication modal (if necessary) and returns the `authorizationToken`.
- **`MPAuthenticator.getAccountPaymentMethods(authorizationToken)`**: Fetches the payment methods available to the user.
- **`MPAuthenticator.getCardId(authorizationToken, selectedCardPaymentMethodToken)`**: Gets the ID of a saved card.
- **`MPAuthenticator.createSecureField(cardData, cvvContainerId)`**: Creates and mounts the Mercado Pago Secure Field for CVV collection.
- **`MPAuthenticator.getCardToken(cardId)`**: Generates a card token (`cardToken`) from the card ID and the CVV entered in the Secure Field.
- **`MPAuthenticator.updateSelectedCardToken(authorizationToken, selectedCardPaymentMethodToken, cardToken)`**: Updates the saved card's token (pseudotoken) with the newly generated `cardToken`.
- Exposes the main SDK instance: `MPAuthenticator.mp`.

The `js/script.js` file is responsible for:

- Manipulating the DOM to render payment methods, input fields (like the CVV container and installment selector).
- Managing the user interface state (e.g., which payment method is selected).
- Orchestrating the payment flow from the user's perspective, calling the appropriate methods of `window.MPAuthenticator` to interact with Mercado Pago.
- Handling user feedback (alerts, error messages).

## How to Run

1.  Clone this repository (if applicable).
2.  Navigate to the project directory.
3.  Open the `index.html` file directly in a modern web browser.

    **Note**: Due to how the Mercado Pago SDK and payment interactions work, some functionalities (especially those depending on a valid `authorizationToken` and real-time interactions) may behave in a limited or simulated manner without a real backend and an HTTP/HTTPS server context. However, the frontend structure and SDK calls are configured according to best practices for secure CVV collection.

## Key Points for Developers (Mercado Pago Focus)

When analyzing this example, developers should focus on `js/mercadoPago.js` to understand how:

- The SDK is initialized.
- The authentication flow (`mp.authenticator`, `authenticator.show`) is executed to obtain the `authorizationToken`.
- Payment methods are retrieved.
- The `card_id` is obtained for a saved card.
- The CVV `SecureField` is created, mounted, and configured.
- A `cardToken` is generated from the `card_id` (including the CVV from the Secure Field).
- `updatePseudotoken` is used to associate the new `cardToken` (with CVV) with the saved card before attempting payment.

This README aims to provide a clear guide to the structure and flow of the Mercado Pago integration in this example project.
