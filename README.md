# Mercado Pago Transparent Checkout Integration Example (Dynamic CVV)

This project demonstrates integration with Mercado Pago's Transparent Checkout, focusing on secure CVV collection for saved cards and updating the card token (pseudotoken).

## Functionality Overview

The main implemented flow is:

1.  **Page Load (`js/script.js` - `setupInitialView`):**
    - The Mercado Pago SDK is initialized.
    - `MPAuthenticator.initializeAuthenticator(amount, payerEmail)` is called to initialize the `authenticatorInstance` in the background.
    - A single "Credit Card" option is displayed as a trigger.
2.  **User Clicks "Credit Card" Trigger (`js/script.js` - `renderStaticPaymentOptions` initial `onclick`):**
    - The section for saved payment methods becomes visible.
    - `initializePaymentFlow()` in `script.js` is executed.
3.  **Payment Flow Execution (`js/script.js` - `initializePaymentFlow`):**
    - `MPAuthenticator.getAuthorizationToken()` is called, which internally uses the pre-initialized `authenticatorInstance` to call `authenticatorInstance.show()` and obtain an `authorizationToken`.
    - `MPAuthenticator.getAccountPaymentMethods(authorizationToken)` is called to fetch saved payment methods.
    - Saved payment methods are rendered.
    - The "Credit Card" trigger is re-rendered below the saved methods, now functioning as an "Add new credit card" option.
4.  **When a saved credit card requiring CVV is selected (`js/script.js`):**
    - A Mercado Pago Secure Field for CVV input is rendered (`MPAuthenticator.createSecureField`).
    - The `card_id` of the selected card is obtained (`MPAuthenticator.getCardId`).
    - A `cardToken` (single-use token) is created from the `card_id` and the CVV (`MPAuthenticator.getCardToken`).
    - The `selectedCard.token` (pseudotoken) of the saved card is updated with the newly generated `cardToken` (`MPAuthenticator.updateSelectedCardToken`).
5.  Simulation of payment processing (call to a placeholder backend endpoint in `js/script.js`).

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

To simplify local execution directly from the filesystem (`file:///`) and avoid CORS issues with ES6 modules, the project does not use native `import`/`export`. Scripts are loaded sequentially in `index.html`.

The Mercado Pago interaction logic is centralized in the `js/mercadoPago.js` file. This file defines a global object `window.MPAuthenticator` that encapsulates all calls to the Mercado Pago SDK and related flow logic. The main responsibilities of `MPAuthenticator` include:

- **`MPAuthenticator.initializeAuthenticator(amount, payerEmail)`**: Called on page load (by `script.js`) to initialize the `mp.authenticator(amount, payerEmail)` and stores the `authenticatorInstance`.
- **`MPAuthenticator.getAuthorizationToken()`**: Uses the stored `authenticatorInstance` to call `authenticatorInstance.show()` and returns the `authorizationToken`.
- **`MPAuthenticator.getAccountPaymentMethods(authorizationToken)`**: Fetches the payment methods available to the user.
- **`MPAuthenticator.getCardId(authorizationToken, selectedCardPaymentMethodToken)`**: Gets the ID of a saved card.
- **`MPAuthenticator.createSecureField(cardData, cvvContainerId)`**: Creates and mounts the Mercado Pago Secure Field for CVV collection.
- **`MPAuthenticator.getCardToken(cardId)`**: Generates a card token (`cardToken`) from the card ID and the CVV entered in the Secure Field.
- **`MPAuthenticator.updateSelectedCardToken(authorizationToken, selectedCardPaymentMethodToken, cardToken)`**: Updates the saved card's token (pseudotoken) with the newly generated `cardToken`.
- Exposes the main SDK instance: `MPAuthenticator.mp`.

The `js/script.js` file is responsible for:

- Initializing the authenticator on page load by calling `MPAuthenticator.initializeAuthenticator`.
- Orchestrating the display of payment methods: initially showing a trigger, then upon click, calling `MPAuthenticator.getAuthorizationToken` followed by `MPAuthenticator.getAccountPaymentMethods`.
- Manipulating the DOM to render the initial trigger, payment methods, input fields (like the CVV container and installment selector).
- Managing the user interface state (e.g., which payment method is selected, handling loading states).
- Handling user feedback (alerts, error messages).

## How to Run

1.  Clone this repository (if applicable).
2.  Navigate to the project directory.
3.  Open the `index.html` file directly in a modern web browser.

    **Note**: Due to how the Mercado Pago SDK and payment interactions work, some functionalities (especially those depending on a valid `authorizationToken` and real-time interactions) may behave in a limited or simulated manner without a real backend and an HTTP/HTTPS server context. However, the frontend structure and SDK calls are configured according to best practices for secure CVV collection.

## Key Points for Developers (Mercado Pago Focus)

When analyzing this example, developers should focus on:

- **`js/mercadoPago.js`**: How the SDK is initialized, and how `initializeAuthenticator`, `getAuthorizationToken`, and `getAccountPaymentMethods` are structured.
- **`js/script.js`**: How `initializeAuthenticator` is called on page load (`setupInitialView`), and how `getAuthorizationToken` and then `getAccountPaymentMethods` are called sequentially after user interaction (`initializePaymentFlow`).
- The flow for obtaining the `card_id` for a saved card.
- The creation and mounting of the CVV `SecureField`.
- The generation of a `cardToken` using the `card_id` (which includes the CVV from the Secure Field).
- The use of `updatePseudotoken` to associate the new `cardToken` (with CVV) with the saved card before attempting payment.

This README aims to provide a clear guide to the structure and flow of the Mercado Pago integration in this example project.
