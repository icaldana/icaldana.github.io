const publicKey = "APP_USR-3221c3fc-b9b2-4e68-a278-63bb4c46f578";
const mp = new MercadoPago(publicKey, {
    locale: "pt-BR",
});

// Global variable for the selected payment method object
let selectedAccountPaymentMethod;

async function process() {
    const payerEmail = "test_user_1413841135@testuser.com";
    const totalAmount = "200.00";
    let authenticator;
    let authorizationToken;
    let accountPaymentMethodsData; // Renamed to avoid conflict with function name

    try {
        authenticator = await mp.authenticator(totalAmount, payerEmail);
    } catch (error) {
        const { message, errorCode, details } = error;
        console.error("Authenticator error:", { message, errorCode, details });
        return;
    }

    try {
        authorizationToken = await authenticator.show();
    } catch (error) {
        const { message, errorCode, details } = error;
        console.error("Authorization token error:", { message, errorCode, details });
        return;
    }

    try {
        accountPaymentMethodsData = await mp.getAccountPaymentMethods(authorizationToken);
        return accountPaymentMethodsData;
    } catch (error) {
        const { message, errorCode, details } = error;
        console.error("Get account payment methods error:", { message, errorCode, details });
        return;
    }
}

async function pay() {
    if (!selectedAccountPaymentMethod) {
        alert("Por favor, selecione um meio de pagamento.");
        return;
    }

    // If it's a credit card, check for CVV and installments
    if (selectedAccountPaymentMethod.type === 'credit_card') {
        if (!selectedAccountPaymentMethod.cvv || selectedAccountPaymentMethod.cvv.length < (selectedAccountPaymentMethod.security_code_settings.length || 3)) {
            alert("Por favor, insira o código de segurança (CVV) válido.");
            document.getElementById('cvvInput')?.focus();
            return;
        }
        // Check if installments are mandatory or if a selection was made from multiple options
        const installmentsAvailable = selectedAccountPaymentMethod.installments && selectedAccountPaymentMethod.installments.length > 0;
        if (installmentsAvailable && !selectedAccountPaymentMethod.selected_installment) {
            // If only one installment option and it's 1x, it might be implicitly selected.
            // For now, assume if multiple options, one must be selected.
            if (selectedAccountPaymentMethod.installments.length > 1) {
                alert("Por favor, selecione o número de parcelas.");
                document.getElementById('installmentsSelect')?.focus();
                return;
            } else if (selectedAccountPaymentMethod.installments.length === 1) {
                // Auto-select the only installment option if not already selected
                selectedAccountPaymentMethod.selected_installment = selectedAccountPaymentMethod.installments[0];
            }
        }
    }

    try {
        console.log("Processing payment with:", JSON.parse(JSON.stringify(selectedAccountPaymentMethod))); // Deep copy for logging
        // In a real application, send selectedAccountPaymentMethod to your backend
        const response = await fetch("process-payment", { // Ensure this endpoint exists on your server
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify(selectedAccountPaymentMethod),
        });

        const data = await response.json();
        console.log("Payment response:", data);
        alert("Pagamento processado! (simulado - verifique o console)");
    } catch (error) {
        console.error("Payment processing error:", error);
        alert("Erro ao processar pagamento (simulado - verifique o console).");
    }
}

function updateSelection(selectedOptionDivId, associatedRadioId, isAccountMethod, dataItem) {
    document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => radio.checked = false);

    const selectedDiv = document.getElementById(selectedOptionDivId);
    const radioToSelect = document.getElementById(associatedRadioId);
    const cardDetailsArea = document.getElementById('card-details-input-area');

    if (selectedDiv && radioToSelect) {
        selectedDiv.classList.add('selected');
        radioToSelect.checked = true;
        // Insert card details area after the selected item, if it's a card
        if (isAccountMethod && dataItem.type === 'credit_card') {
            selectedDiv.parentNode.insertBefore(cardDetailsArea, selectedDiv.nextSibling);
        }
    }

    if (isAccountMethod) {
        selectedAccountPaymentMethod = { ...dataItem }; // Clone to avoid modifying original API response data
        console.log('Selected account payment method:', selectedAccountPaymentMethod);

        if (dataItem.type === 'credit_card') {
            renderCardSpecificInputs(dataItem, cardDetailsArea);
            cardDetailsArea.style.display = 'block';
        } else {
            cardDetailsArea.innerHTML = ''; // Clear content
            cardDetailsArea.style.display = 'none';
            delete selectedAccountPaymentMethod.cvv;
            delete selectedAccountPaymentMethod.selected_installment;
        }
    } else {
        selectedAccountPaymentMethod = null;
        console.log('Selected static option:', dataItem ? dataItem.name : 'None', ". 'selectedAccountPaymentMethod' is now null.");
        cardDetailsArea.innerHTML = ''; // Clear content
        cardDetailsArea.style.display = 'none';
    }
}

function renderCardSpecificInputs(cardDataItem, containerDiv) {
    containerDiv.innerHTML = ''; // Clear previous inputs

    // CVV Input
    const cvvGroup = document.createElement('div');
    cvvGroup.className = 'card-input-group';
    const cvvLabel = document.createElement('label');
    cvvLabel.setAttribute('for', 'cvvInput');
    cvvLabel.textContent = 'Código de segurança';
    const cvvInputContainer = document.createElement('div');
    cvvInputContainer.className = 'cvv-input-container';
    const cvvInput = document.createElement('input');
    cvvInput.type = cardDataItem.security_code_settings.mode === 'optional' ? 'text' : 'tel'; // 'tel' for numeric keyboard
    cvvInput.id = 'cvvInput';
    cvvInput.placeholder = 'Ex.: 1234';
    cvvInput.maxLength = cardDataItem.security_code_settings.length || 3;
    cvvInput.oninput = () => {
        selectedAccountPaymentMethod.cvv = cvvInput.value;
        console.log('CVV updated:', selectedAccountPaymentMethod.cvv);
    };
    // CVV icon placeholder (from image)
    const cvvIcon = document.createElement('img');
    cvvIcon.src = "data:image/svg+xml,%3Csvg width='58' height='36' viewBox='0 0 58 36' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0.5' y='0.5' width='57' height='35' rx='3.5' fill='white' stroke='%23E0E0E0'/%3E%3Crect x='8' y='15' width='26' height='2' rx='1' fill='%23BDBDBD'/%3E%3Crect x='41' y='12' width='9' height='8' rx='1' fill='%23BDBDBD'/%3E%3C/svg%3E"; // Placeholder SVG for CVV icon
    cvvIcon.className = 'cvv-icon-placeholder';

    cvvInputContainer.appendChild(cvvInput);
    cvvInputContainer.appendChild(cvvIcon);
    cvvGroup.appendChild(cvvLabel);
    cvvGroup.appendChild(cvvInputContainer);
    containerDiv.appendChild(cvvGroup);

    // Installments Dropdown
    if (cardDataItem.installments && cardDataItem.installments.length > 0) {
        const installmentsGroup = document.createElement('div');
        installmentsGroup.className = 'card-input-group';
        const installmentsLabel = document.createElement('label');
        installmentsLabel.setAttribute('for', 'installmentsSelect');
        installmentsLabel.textContent = 'Selecione o número de parcelas';
        const installmentsSelect = document.createElement('select');
        installmentsSelect.id = 'installmentsSelect';

        // Default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecione uma opção';
        installmentsSelect.appendChild(defaultOption);

        cardDataItem.installments.forEach((inst, index) => {
            const option = document.createElement('option');
            option.value = index; // Store index to retrieve full object later
            let text = `${inst.installments}x de R$${parseFloat(inst.installment_amount).toFixed(2).replace('.', ',')}`;
            if (inst.installment_rate === 0 && inst.installments > 1) {
                text += ' sem acréscimo';
            } else if (inst.installments > 1 && inst.total_amount && parseFloat(inst.total_amount) > parseFloat(cardDataItem.total_amount || '0')) {
                // Assuming total_amount on cardDataItem is the original transaction amount for comparison
                // This part of the label logic might need adjustment based on exact display requirements for interest.
            }
            option.textContent = text;
            installmentsSelect.appendChild(option);
        });

        installmentsSelect.onchange = () => {
            if (installmentsSelect.value === '') {
                delete selectedAccountPaymentMethod.selected_installment;
                console.log('Installment selection cleared');
            } else {
                selectedAccountPaymentMethod.selected_installment = cardDataItem.installments[parseInt(installmentsSelect.value)];
                console.log('Installment selected:', selectedAccountPaymentMethod.selected_installment);
            }
        };

        installmentsGroup.appendChild(installmentsLabel);
        installmentsGroup.appendChild(installmentsSelect);
        containerDiv.appendChild(installmentsGroup);
    }
}

function renderPaymentMethods(apiResponse) {
    const container = document.getElementById('account-payment-methods-list');
    if (!container) {
        console.error('Account payment methods container (#account-payment-methods-list) not found.');
        return;
    }
    container.innerHTML = '';

    if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
        console.error('Invalid API response format for payment methods.', apiResponse);
        container.innerHTML = '<p>Não foi possível carregar os meios de pagamento salvos.</p>';
        return;
    }
    if (apiResponse.data.length === 0) {
        container.innerHTML = '<p>Nenhum meio de pagamento salvo encontrado.</p>';
        return;
    }

    apiResponse.data.forEach(item => {
        const paymentMethodDiv = document.createElement('div');
        paymentMethodDiv.className = 'payment-option';
        const divId = `option-div-${item.id}-${Math.random().toString(36).substr(2, 9)}`; // Ensure unique ID
        const radioId = `pm-radio-${item.id}-${Math.random().toString(36).substr(2, 9)}`; // Ensure unique ID
        paymentMethodDiv.id = divId;

        let iconSrc = item.thumbnail;
        const iconDiv = document.createElement('div');
        iconDiv.className = 'payment-icon';

        let title = item.name;
        let subtitle = '';
        let subtitleClass = '';

        if (item.type === 'account_money') {
            title = item.name; // Example: "Saldo no Mercado Pago"
            subtitle = 'Disponível para esta compra'; // Placeholder text
            subtitleClass = 'info';
            iconDiv.classList.add('account-money-icon-bg'); // Add class for yellow background
        } else if (item.type === 'credit_card' && item.card && item.issuer) {
            title = `${item.issuer.name} **** ${item.card.card_number.last_four_digits}`;
            let maxZeroRateInstallments = 0;
            if (item.installments && Array.isArray(item.installments)) {
                const zeroRateOptions = item.installments.filter(inst => inst.installment_rate === 0 && inst.installments > 1);
                if (zeroRateOptions.length > 0) {
                    maxZeroRateInstallments = Math.max(...zeroRateOptions.map(inst => inst.installments));
                }
            }
            if (maxZeroRateInstallments > 1) {
                subtitle = `Até ${maxZeroRateInstallments}x sem acréscimo`;
            } else if (item.installments && item.installments.some(inst => inst.installments > 1)) {
                subtitle = 'Parcelamento disponível';
            } else if (item.installments && item.installments.length > 0) {
                subtitle = 'Pagamento em 1x';
            }
        } else {
            // Fallback for items that don't match expected structure
            title = item.name || 'Opção de pagamento desconhecida';
        }

        const img = document.createElement('img');
        img.src = iconSrc;
        img.alt = item.name || 'Payment method icon';
        iconDiv.appendChild(img);

        paymentMethodDiv.innerHTML = `
            <input type="radio" name="payment-method" id="${radioId}" value="${item.id}">
            ${iconDiv.outerHTML} <div class="payment-details">
                <label for="${radioId}" class="payment-title">${title}</label>
                ${subtitle ? `<span class="payment-subtitle ${subtitleClass}">${subtitle}</span>` : ''}
            </div>
        `;

        paymentMethodDiv.onclick = () => updateSelection(divId, radioId, true, item);
        container.appendChild(paymentMethodDiv);
    });
}

function renderStaticPaymentOptions() {
    const container = document.getElementById('other-payment-options-list');
    if (!container) {
        console.error('Static payment options container (#other-payment-options-list) not found.');
        return;
    }
    container.innerHTML = '';

    const staticOptions = [
        { id: 'new_credit_card', name: 'Cartão de crédito' },
        { id: 'new_debit_card', name: 'Cartão de débito' },
        { id: 'pix', name: 'Pix' }
    ];

    staticOptions.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'payment-option static-option';
        const divId = `option-div-static-${option.id}-${Math.random().toString(36).substr(2, 9)}`;
        const radioId = `pm-radio-static-${option.id}-${Math.random().toString(36).substr(2, 9)}`;
        optionDiv.id = divId;

        let iconHTML;
        if (option.id === 'new_credit_card') {
            iconHTML = `<div class="static-option-icon">💳</div>`; // Credit card emoji
        } else if (option.id === 'new_debit_card') {
            iconHTML = `<div class="static-option-icon">📲</div>`; // Different emoji for debit, or use an actual icon path
        } else if (option.id === 'pix') {
            iconHTML = `<div class="static-option-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.4999 12.37C15.4999 12.37 15.5 12.37 15.5 12.371C15.5 13.237 14.806 13.931 13.94 13.931L13.938 13.931C13.938 13.931 13.937 13.931 13.936 13.931L10.063 13.931C10.063 13.931 10.062 13.931 10.062 13.931C9.19497 13.931 8.49997 13.238 8.49997 12.371C8.49997 12.37 8.50003 12.37 8.50003 12.37L8.50003 12.371L8.50003 8.49903C8.50003 8.49903 8.50003 8.49903 8.50003 8.49903C8.50003 7.63203 9.19303 6.93803 10.059 6.93803L10.062 6.93803C10.062 6.93803 10.063 6.93803 10.063 6.93803L13.936 6.93803C13.937 6.93803 13.938 6.93803 13.938 6.93803L13.94 6.93803C14.806 6.93803 15.5 7.63203 15.5 8.49903C15.5 8.49903 15.4999 8.49903 15.4999 8.49903L15.4999 12.37ZM12.3219 10.06H11.6779V11.674L10.0619 11.674V12.32H11.6779V13.934H12.3219V12.32H13.9379V11.674L12.3219 11.674V10.06Z" fill="#303030"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM0 12C0 5.373 5.373 0 12 0C18.627 0 24 5.373 24 12C24 18.627 18.627 24 12 24C5.373 24 0 18.627 0 12Z" fill="#303030"/>
                </svg>
            </div>`; // Placeholder PIX SVG
        } else {
            iconHTML = `<div class="static-option-icon">⚙️</div>`; // Generic icon
        }

        optionDiv.innerHTML = `
            <input type="radio" name="payment-method" id="${radioId}" value="${option.id}">
            ${iconHTML}
            <div class="payment-details">
                <label for="${radioId}" class="payment-title">${option.name}</label>
            </div>
        `;
        optionDiv.onclick = () => updateSelection(divId, radioId, false, option);
        container.appendChild(optionDiv);
    });
}

async function initializePaymentFlow() {
    // This is the example JSON data you provided for getAccountPaymentMethods.
    const exampleApiResponse = {
        "data": [
            {
                "id": "account_money",
                "token": "STPRAPI01JTNT3WMMQVV5E573FAQVBY10",
                "name": "Saldo no Mercado Pago",
                "type": "account_money",
                "thumbnail": "http://img.mlstatic.com/org-img/MP3/API/logos/2007.gif",
                "issuer": {
                    "name": "Dinheiro na minha conta do MercadoPago\"", // Note: check this escaped quote in real data
                    "id": 2007,
                    "default": false
                }
            },
            {
                "id": "master",
                "token": "STPRAPI01JTNT3WMMQVV5E573FAMPS0A0",
                "name": "Mastercard",
                "type": "credit_card",
                "thumbnail": "https://http2.mlstatic.com/storage/logos-api-admin/0daa1670-5c81-11ec-ae75-df2bef173be2-xl.png",
                "security_code_settings": { "mode": "mandatory", "length": 3 },
                "card": { "card_number": { "last_four_digits": "6351", "bin": "50314332", "length": 16 } },
                "issuer": { "name": "Mastercard", "id": 24, "default": true },
                "installments": [
                    { "total_amount": "10", "installment_amount": "10", "installment_rate_collector": ["MERCADOPAGO"], "installments": 1, "max_allowed_amount": 60000, "min_allowed_amount": 0.5, "installment_rate": 0 },
                    { "total_amount": "10.96", "installment_amount": "5.48", "installment_rate_collector": ["MERCADOPAGO"], "installments": 2, "max_allowed_amount": 60000, "min_allowed_amount": 10, "installment_rate": 9.64 }
                ]
            }
        ]
    };

    // To use the live API call, uncomment the following lines:
    /*
    try {
        const paymentMethodsApiData = await process(); 
        renderPaymentMethods(paymentMethodsApiData);
    } catch (error) {
        console.error("Failed to process or render payment methods:", error);
        const container = document.getElementById('account-payment-methods-list');
        if (container) container.innerHTML = '<p>Erro ao carregar meios de pagamento. Tente novamente mais tarde.</p>';
    }
    */

    // For this demonstration, we use the exampleApiResponse directly:
    renderPaymentMethods(exampleApiResponse);

    renderStaticPaymentOptions();
}

// Initialize the payment flow when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializePaymentFlow);