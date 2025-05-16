import { process } from './mercadoPago.js';

let selectedAccountPaymentMethod;

async function pay() {
    if (!selectedAccountPaymentMethod || !selectedAccountPaymentMethod.type) {
        alert("Por favor, selecione um meio de pagamento.");
        return;
    }

    if (selectedAccountPaymentMethod.type === 'credit_card') {
        const cardData = selectedAccountPaymentMethod;

        // CVV Validation
        const cvvRequired = cardData.security_code_settings && cardData.security_code_settings.mode !== 'optional';
        const cvvMinLength = cardData.security_code_settings ? cardData.security_code_settings.length : 3;
        if (cvvRequired && (!cardData.cvv || cardData.cvv.length < cvvMinLength)) {
            alert(`Por favor, insira o código de segurança (CVV) de ${cvvMinLength} dígitos.`);
            document.getElementById('cvvInput')?.focus();
            return;
        }

        // Installments Validation
        const installmentsAvailable = cardData.installments && cardData.installments.length > 0;
        if (installmentsAvailable) {
            if (!cardData.selected_installment && cardData.installments.length > 1) {
                alert("Por favor, selecione o número de parcelas.");
                document.getElementById('installmentsSelect')?.focus();
                return;
            }
            if (!cardData.selected_installment && cardData.installments.length === 1) {
                console.warn("Single installment option was not auto-selected. Proceeding with the single option.");
                selectedAccountPaymentMethod.selected_installment = cardData.installments[0];
            }
        }
    }


    try {
        console.log("Simulating payment processing with:", JSON.parse(JSON.stringify(selectedAccountPaymentMethod)));
        // In a real application, send selectedAccountPaymentMethod to your backend
        // The endpoint /process-payment is a placeholder for your backend logic.
        const response = await fetch("process-payment", {
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify(selectedAccountPaymentMethod),
        });

        if (!response.ok) {
            // Try to get error message from backend if available
            let errorData = { message: `HTTP error! status: ${response.status}` };
            try {
                errorData = await response.json();
            } catch (e) {
                // Ignore if response is not JSON
            }
            console.error("Payment processing error from server:", errorData);
            alert(`Erro ao processar pagamento: ${errorData.message || response.statusText} (simulado - verifique o console).`);
            return;
        }

        const data = await response.json();
        console.log("Payment response (simulated):", data);
        alert("Pagamento processado com sucesso! (simulado - verifique o console)");

    } catch (error) {
        console.error("Payment processing fetch/network error:", error);
        alert("Erro de comunicação ao processar pagamento (simulado - verifique o console).");
    }
}

function manageCardDetailsArea(show, cardDataItem = null) {
    const cardDetailsArea = document.getElementById('card-details-input-area');
    if (!cardDetailsArea) return;

    if (show && cardDataItem) {
        renderCardSpecificInputs(cardDataItem, cardDetailsArea);
        cardDetailsArea.style.display = 'block';
    } else {
        cardDetailsArea.innerHTML = ''; // Clear content
        cardDetailsArea.style.display = 'none';
    }
}

function updatePaymentOptionUI(selectedOptionDivId, associatedRadioId) {
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
    });

    const selectedDiv = document.getElementById(selectedOptionDivId);
    const radioToSelect = document.getElementById(associatedRadioId);

    if (selectedDiv) selectedDiv.classList.add('selected');
    if (radioToSelect) radioToSelect.checked = true;

    const cardDetailsArea = document.getElementById('card-details-input-area');
    if (selectedDiv && cardDetailsArea && selectedDiv.parentNode !== cardDetailsArea.parentNode) {
        if (selectedDiv.classList.contains('selected') && cardDetailsArea.style.display === 'block') {
            selectedDiv.parentNode.insertBefore(cardDetailsArea, selectedDiv.nextSibling);
        }
    }
}

function updateSelection(selectedOptionDivId, associatedRadioId, isAccountMethod, dataItem) {
    updatePaymentOptionUI(selectedOptionDivId, associatedRadioId);

    if (isAccountMethod) {
        selectedAccountPaymentMethod = { ...dataItem }; // Shallow clone
        console.log('Selected account payment method:', selectedAccountPaymentMethod);

        if (dataItem.type === 'credit_card') {
            manageCardDetailsArea(true, dataItem);
            const selectedDiv = document.getElementById(selectedOptionDivId);
            const cardDetailsArea = document.getElementById('card-details-input-area');
            if (selectedDiv && cardDetailsArea) {
                selectedDiv.parentNode.insertBefore(cardDetailsArea, selectedDiv.nextSibling);
            }
        } else {
            manageCardDetailsArea(false);
            delete selectedAccountPaymentMethod.cvv;
            delete selectedAccountPaymentMethod.selected_installment;
        }
    } else {
        selectedAccountPaymentMethod = { type: dataItem.id, name: dataItem.name }; // Store basic info
        console.log('Selected static option:', selectedAccountPaymentMethod.name, ". 'selectedAccountPaymentMethod' updated.");
        manageCardDetailsArea(false);
    }
}

function renderCardSpecificInputs(cardDataItem, containerDiv) {
    containerDiv.innerHTML = ''; // Clear previous inputs

    // CVV Input
    const cvvInputId = 'cvvInput';
    const cvvLabelText = 'Código de segurança';
    const cvvPlaceholder = 'Ex.: 1234';
    const cvvMaxLength = cardDataItem.security_code_settings.length || 3;
    const cvvInputType = cardDataItem.security_code_settings.mode === 'optional' ? 'text' : 'tel';
    // Using an inline SVG for the CVV icon for simplicity, though a linked asset or CSS background might be better for complex SVGs.
    const cvvIconSvg = `<svg width="58" height="36" viewBox="0 0 58 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="57" height="35" rx="3.5" fill="white" stroke="#E0E0E0"/><rect x="8" y="15" width="26" height="2" rx="1" fill="#BDBDBD"/><rect x="41" y="12" width="9" height="8" rx="1" fill="#BDBDBD"/></svg>`;

    let cvvHtml = `
        <div class="card-input-group">
            <label for="${cvvInputId}">${cvvLabelText}</label>
            <div class="cvv-input-container">
                <input type="${cvvInputType}" id="${cvvInputId}" placeholder="${cvvPlaceholder}" maxLength="${cvvMaxLength}">
                <span class="cvv-icon-placeholder">${cvvIconSvg}</span>
            </div>
        </div>
    `;
    containerDiv.insertAdjacentHTML('beforeend', cvvHtml);
    const cvvInput = document.getElementById(cvvInputId);
    if (cvvInput) {
        cvvInput.oninput = () => {
            selectedAccountPaymentMethod.cvv = cvvInput.value;
            console.log('CVV updated:', selectedAccountPaymentMethod.cvv);
        };
    }

    // Installments Dropdown
    if (cardDataItem.installments && cardDataItem.installments.length > 0) {
        const installmentsSelectId = 'installmentsSelect';
        const installmentsLabelText = 'Selecione o número de parcelas';
        let optionsHtml = '<option value="">Selecione uma opção</option>';

        cardDataItem.installments.forEach((inst, index) => {
            let text = `${inst.installments}x de R$${parseFloat(inst.installment_amount).toFixed(2).replace('.', ',')}`;
            if (inst.installment_rate === 0 && inst.installments > 1) {
                text += ' sem acréscimo';
            } else if (inst.installments === 1) {
            } else if (inst.total_amount && parseFloat(inst.total_amount) > parseFloat(cardDataItem.total_amount || '0')) {
            }
            optionsHtml += `<option value="${index}">${text}</option>`;
        });

        let installmentsHtml = `
            <div class="card-input-group">
                <label for="${installmentsSelectId}">${installmentsLabelText}</label>
                <select id="${installmentsSelectId}">
                    ${optionsHtml}
                </select>
            </div>
        `;
        containerDiv.insertAdjacentHTML('beforeend', installmentsHtml);

        const installmentsSelect = document.getElementById(installmentsSelectId);
        if (installmentsSelect) {
            installmentsSelect.onchange = () => {
                if (installmentsSelect.value === '') {
                    delete selectedAccountPaymentMethod.selected_installment;
                    console.log('Installment selection cleared');
                } else {
                    selectedAccountPaymentMethod.selected_installment = cardDataItem.installments[parseInt(installmentsSelect.value)];
                    console.log('Installment selected:', selectedAccountPaymentMethod.selected_installment);
                }
            };
            // Auto-select if only one actual installment option (excluding the default "Selecione uma opção")
            if (cardDataItem.installments.length === 1) {
                installmentsSelect.value = "0"; // Value is the index
                installmentsSelect.dispatchEvent(new Event('change')); // Trigger onchange to update state
            }
        }
    }
}

function renderPaymentMethods(apiResponse) {
    const container = document.getElementById('account-payment-methods-list');
    if (!container) {
        console.error('Account payment methods container (#account-payment-methods-list) not found.');
        return;
    }
    container.innerHTML = ''; // Clear existing content

    if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
        console.error('Invalid API response format for payment methods.', apiResponse);
        container.innerHTML = '<p>Não foi possível carregar os meios de pagamento salvos.</p>';
        return;
    }
    if (apiResponse.data.length === 0) {
        container.innerHTML = '<p>Nenhum meio de pagamento salvo encontrado.</p>';
        return;
    }

    apiResponse.data.forEach((item, index) => {
        // Use a more predictable ID based on item ID and index
        const elementIdSuffix = `${item.id}-${index}`;
        const divId = `option-div-${elementIdSuffix}`;
        const radioId = `pm-radio-${elementIdSuffix}`;

        let iconHtml = `<img src="${item.thumbnail}" alt="${item.name || 'Payment method icon'}">`;
        let title = item.name;
        let subtitle = '';
        let subtitleClass = '';
        let iconWrapperClass = 'payment-icon';

        if (item.type === 'account_money') {
            title = item.name;
            subtitle = 'Disponível para esta compra'; // Placeholder
            subtitleClass = 'info';
            iconWrapperClass += ' account-money-icon-bg';
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
            title = item.name || 'Opção de pagamento desconhecida';
        }

        const paymentMethodHtml = `
            <div class="payment-option" id="${divId}">
                <input type="radio" name="payment-method" id="${radioId}" value="${item.id}">
                <div class="${iconWrapperClass}">
                    ${iconHtml}
                </div>
                <div class="payment-details">
                    <label for="${radioId}" class="payment-title">${title}</label>
                    ${subtitle ? `<span class="payment-subtitle ${subtitleClass}">${subtitle}</span>` : ''}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', paymentMethodHtml);

        // Add event listener directly to the new element
        const paymentMethodDiv = document.getElementById(divId);
        if (paymentMethodDiv) {
            paymentMethodDiv.onclick = () => updateSelection(divId, radioId, true, item);
        }
    });
}

function renderStaticPaymentOptions() {
    const container = document.getElementById('other-payment-options-list');
    if (!container) {
        console.error('Static payment options container (#other-payment-options-list) not found.');
        return;
    }
    container.innerHTML = ''; // Clear existing content

    const staticOptions = [
        { id: 'new_credit_card', name: 'Cartão de crédito', icon: '💳' },
        { id: 'new_debit_card', name: 'Cartão de débito', icon: '📲' }, // Consider a more distinct debit card icon or SVG
        { id: 'pix', name: 'Pix', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.4999 12.37C15.4999 12.37 15.5 12.37 15.5 12.371C15.5 13.237 14.806 13.931 13.94 13.931L13.938 13.931C13.938 13.931 13.937 13.931 13.936 13.931L10.063 13.931C10.063 13.931 10.062 13.931 10.062 13.931C9.19497 13.931 8.49997 13.238 8.49997 12.371C8.49997 12.37 8.50003 12.37 8.50003 12.37L8.50003 12.371L8.50003 8.49903C8.50003 8.49903 8.50003 8.49903 8.50003 8.49903C8.50003 7.63203 9.19303 6.93803 10.059 6.93803L10.062 6.93803C10.062 6.93803 10.063 6.93803 10.063 6.93803L13.936 6.93803C13.937 6.93803 13.938 6.93803 13.938 6.93803L13.94 6.93803C14.806 6.93803 15.5 7.63203 15.5 8.49903C15.5 8.49903 15.4999 8.49903 15.4999 8.49903L15.4999 12.37ZM12.3219 10.06H11.6779V11.674L10.0619 11.674V12.32H11.6779V13.934H12.3219V12.32H13.9379V11.674L12.3219 11.674V10.06Z" fill="#303030"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM0 12C0 5.373 5.373 0 12 0C18.627 0 24 5.373 24 12C24 18.627 18.627 24 12 24C5.373 24 0 18.627 0 12Z" fill="#303030"/></svg>' }
    ];

    staticOptions.forEach((option, index) => {
        // Use a more predictable ID
        const elementIdSuffix = `static-${option.id}-${index}`;
        const divId = `option-div-${elementIdSuffix}`;
        const radioId = `pm-radio-${elementIdSuffix}`;

        const iconHtml = `<div class="static-option-icon">${option.icon}</div>`;

        const optionHtml = `
            <div class="payment-option static-option" id="${divId}">
                <input type="radio" name="payment-method" id="${radioId}" value="${option.id}">
                ${iconHtml}
                <div class="payment-details">
                    <label for="${radioId}" class="payment-title">${option.name}</label>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', optionHtml);

        const optionDiv = document.getElementById(divId);
        if (optionDiv) {
            optionDiv.onclick = () => updateSelection(divId, radioId, false, option);
        }
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