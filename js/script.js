
let selectedAccountPaymentMethod;
let authorizationToken = null;
let securityCodeField = null;

async function payWithMercadoPago() {
    if (!selectedAccountPaymentMethod || !selectedAccountPaymentMethod.type) {
        alert("Please select a payment method.");
        return;
    }

    if (selectedAccountPaymentMethod.type === 'credit_card') {
        const cardData = selectedAccountPaymentMethod;
        const isCVVMandatory = cardData.security_code_settings && cardData.security_code_settings.mode === 'mandatory';

        if (isCVVMandatory) {
            try {
                const cardId = await MPAuthenticator.getCardId(authorizationToken, cardData.token);

                const cardTokenResponse = await MPAuthenticator.getCardToken(cardId);
                if (!cardTokenResponse || !cardTokenResponse.id) {
                    alert("Could not generate card token from CVV. Please verify the CVV and try again.");
                    return;
                }
                const cvvCardToken = cardTokenResponse.id;
                await MPAuthenticator.updateSelectedCardToken(authorizationToken, cardData.token, cvvCardToken);

            } catch (error) {
                console.error("Error during Mercado Pago card processing via MPAuthenticator:", error);
                return;
            }
        }
    }

    if (selectedAccountPaymentMethod.type === 'credit_card') {
        const cardData = selectedAccountPaymentMethod;

        // Installments Validation
        const installmentsAvailable = cardData.installments && cardData.installments.length > 0;
        if (installmentsAvailable) {
            if (!cardData.selected_installment && cardData.installments.length > 1) {
                alert("Please select the number of installments.");
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
            const errorData = await response.json().catch(() => ({
                message: `HTTP error! status: ${response.status}`
            }));
            console.error("Payment processing error from server:", errorData);
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
        securityCodeField?.unmount();
        cardDetailsArea.innerHTML = '';
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
        selectedAccountPaymentMethod = { ...dataItem };
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
        selectedAccountPaymentMethod = { type: dataItem.id, name: dataItem.name };
        console.log('Selected static option:', selectedAccountPaymentMethod.name, ". 'selectedAccountPaymentMethod' updated.");
        manageCardDetailsArea(false);
    }
}

function renderCardSpecificInputs(cardDataItem, containerDiv) {
    containerDiv.innerHTML = '';

    if (cardDataItem.type === 'credit_card' && cardDataItem.security_code_settings && cardDataItem.security_code_settings.mode === 'mandatory') {
        const cvvContainerId = 'mercadopago-cvv-container';
        const cvvLabelText = 'Security code';

        const cvvHtml = `
            <div class="card-input-group">
                <label>${cvvLabelText}</label> 
                <div id="${cvvContainerId}" class="cvv-input-sdk-container"></div>
            </div>
        `;
        containerDiv.insertAdjacentHTML('beforeend', cvvHtml);

        try {
            if (securityCodeField && typeof securityCodeField.destroy === 'function') {
                securityCodeField.destroy();
                securityCodeField = null;
            }
            securityCodeField = MPAuthenticator.createSecureField(cardDataItem, cvvContainerId);

        } catch (error) {
            console.error("Error creating or mounting secure field via MPAuthenticator:", error);
            const cvvMountElement = containerDiv.querySelector(`#${cvvContainerId}`);
            if (cvvMountElement) cvvMountElement.innerHTML = `<p style="color:red;">${error.message || 'Error creating or mounting secure field.'}</p>`;
            securityCodeField = null;
        }

    } else {
        if (securityCodeField && typeof securityCodeField.destroy === 'function') {
            try { securityCodeField.destroy(); } catch (e) { console.warn("Error destroying secure field:", e); }
            securityCodeField = null;
        }
    }

    // Installments Dropdown
    if (cardDataItem.installments && cardDataItem.installments.length > 0) {
        const installmentsSelectId = 'installmentsSelect';
        const installmentsLabelText = 'Select the number of installments';
        let optionsHtml = '<option value="">Select an option</option>';

        cardDataItem.installments.forEach((inst, index) => {
            let text = `${inst.installments}x of R$${parseFloat(inst.installment_amount).toFixed(2).replace('.', ',')}`;
            if (inst.installment_rate === 0 && inst.installments > 1) {
                text += ' without interest';
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
            // Auto-select if only one actual installment option (excluding the default "Select an option")
            if (cardDataItem.installments.length === 1) {
                installmentsSelect.value = "0";
                installmentsSelect.dispatchEvent(new Event('change'));
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
    container.innerHTML = '';

    if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
        console.error('Invalid API response format for payment methods.', apiResponse);
        container.innerHTML = '<p>It was not possible to load the saved payment methods.</p>';
        return;
    }
    if (apiResponse.data.length === 0) {
        container.innerHTML = '<p>No saved payment methods found.</p>';
        return;
    }

    apiResponse.data.forEach((item, index) => {
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
            subtitle = 'Available for this purchase';
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
                subtitle = `Up to ${maxZeroRateInstallments}x without interest`;
            } else if (item.installments && item.installments.some(inst => inst.installments > 1)) {
                subtitle = 'Installment available';
            } else if (item.installments && item.installments.length > 0) {
                subtitle = 'Payment in 1x';
            }
        } else {
            title = item.name || 'Unknown payment option';
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
    container.innerHTML = '';

    const staticOptions = [
        { id: 'new_credit_card', name: 'Credit card', icon: '💳' },
        { id: 'new_debit_card', name: 'Debit card', icon: '📲' },
        { id: 'pix', name: 'Pix', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.4999 12.37C15.4999 12.37 15.5 12.37 15.5 12.371C15.5 13.237 14.806 13.931 13.94 13.931L13.938 13.931C13.938 13.931 13.937 13.931 13.936 13.931L10.063 13.931C10.063 13.931 10.062 13.931 10.062 13.931C9.19497 13.931 8.49997 13.238 8.49997 12.371C8.49997 12.37 8.50003 12.37 8.50003 12.37L8.50003 12.371L8.50003 8.49903C8.50003 8.49903 8.50003 8.49903 8.50003 8.49903C8.50003 7.63203 9.19303 6.93803 10.059 6.93803L10.062 6.93803C10.062 6.93803 10.063 6.93803 10.063 6.93803L13.936 6.93803C13.937 6.93803 13.938 6.93803 13.938 6.93803L13.94 6.93803C14.806 6.93803 15.5 7.63203 15.5 8.49903C15.5 8.49903 15.4999 8.49903 15.4999 8.49903L15.4999 12.37ZM12.3219 10.06H11.6779V11.674L10.0619 11.674V12.32H11.6779V13.934H12.3219V12.32H13.9379V11.674L12.3219 11.674V10.06Z" fill="#303030"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM0 12C0 5.373 5.373 0 12 0C18.627 0 24 5.373 24 12C24 18.627 18.627 24 12 24C5.373 24 0 18.627 0 12Z" fill="#303030"/></svg>' }
    ];

    staticOptions.forEach((option, index) => {
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
        const result = await MPAuthenticator.initializePaymentData(); // Alterado de MercadoPagoService
        if (result && result.accountPaymentMethodsResponse) {
            authorizationToken = result.authorizationToken;
            renderPaymentMethods(result.accountPaymentMethodsResponse);
        } else {
            console.error("Failed to fetch payment methods or authorization token from MPAuthenticator.");
            const container = document.getElementById('account-payment-methods-list');
            if (container) container.innerHTML = '<p>Erro ao carregar dados de pagamento. Tente recarregar.</p>';
        }
    } catch (error) {
        console.error("Failed to process or render payment methods via MPAuthenticator:", error);
        const container = document.getElementById('account-payment-methods-list');
        if (container) container.innerHTML = '<p>Erro ao carregar meios de pagamento. Tente novamente mais tarde.</p>';
    }
    */

    renderPaymentMethods(exampleApiResponse);
    renderStaticPaymentOptions();
}

document.addEventListener('DOMContentLoaded', initializePaymentFlow);