const payerEmail = "test_user_1771046888@testuser.com";
const totalAmount = "3.00";

let selectedPaymentMethod;
let selectedInstallment = null;
let authorizationToken = null;
let securityCodeField = null;
let initialLoadDone = false;

async function payWithMercadoPago() {
    if (!selectedPaymentMethod || !selectedPaymentMethod.type) {
        alert("Please select a payment method.");
        return;
    }

    if (selectedPaymentMethod.type === 'credit_card') {
        const cardData = selectedPaymentMethod;
        const isCVVMandatory = cardData.security_code_settings && cardData.security_code_settings.mode === 'mandatory';

        if (isCVVMandatory) {

            try {
                const cardId = await MPAuthenticator.getCardId(authorizationToken, cardData.token);

                const cardTokenResponse = await MPAuthenticator.getCardToken(cardId);
                if (!cardTokenResponse) {
                    alert("Could not generate card token from CVV. Please verify the CVV and try again.");
                    return;
                }
                await MPAuthenticator.updatePaymentMethodToken(authorizationToken, cardData.token, cardTokenResponse);

            } catch (error) {
                console.error("Error during Mercado Pago card processing via MPAuthenticator:", error);
                return;
            }
        }
    }

    if (selectedPaymentMethod.type === 'credit_card') {
        const cardData = selectedPaymentMethod;

        // Installments Validation
        const installmentsAvailable = cardData.installments && cardData.installments.length > 0;
        if (installmentsAvailable) {
            if (!selectedInstallment && cardData.installments.length > 1) {
                alert("Please select the number of installments.");
                document.getElementById('installmentsSelect')?.focus();
                return;
            }
            if (!selectedInstallment && cardData.installments.length === 1) {
                console.warn("Single installment option was not auto-selected. Proceeding with the single option.");
                selectedInstallment = cardData.installments[0];
            }
        }
    }

    try {
        // In a real application, send the selected payment method to your backend
        // The endpoint /process-payment is a placeholder for your backend logic.
        // For more information on the Order API parameters, see:
        // https://www.mercadopago.com/developers/en/reference/orders/online-payments/create/post

        const response = await fetch("/process-payment", {
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                type: "online",
                external_reference: "{{EXTERNAL_REFERENCE}}",
                total_amount: totalAmount,
                payer: {
                    email: payerEmail,
                },
                transactions: {
                    payments: [
                        {
                            amount: totalAmount,
                            payment_method: {
                                id: selectedPaymentMethod.id,
                                type: selectedPaymentMethod.type,
                                token: selectedPaymentMethod.token,
                                installments: selectedInstallment?.installments
                            },
                        },
                    ],
                },
            }),
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
        selectedPaymentMethod = { ...dataItem };

        if (dataItem.type === 'credit_card') {
            manageCardDetailsArea(true, dataItem);
            const selectedDiv = document.getElementById(selectedOptionDivId);
            const cardDetailsArea = document.getElementById('card-details-input-area');
            if (selectedDiv && cardDetailsArea) {
                selectedDiv.parentNode.insertBefore(cardDetailsArea, selectedDiv.nextSibling);
            }
        } else {
            manageCardDetailsArea(false);
            selectedInstallment = null;
            delete selectedPaymentMethod.cvv;
        }
    } else {
        selectedPaymentMethod = { type: dataItem.id, name: dataItem.name };
        manageCardDetailsArea(false);
        selectedInstallment = null;
    }
}

function renderCardSpecificInputs(cardDataItem, containerDiv) {
    containerDiv.innerHTML = '';

    const isCreditCard = cardDataItem.type === 'credit_card';
    const isCVVMandatory = cardDataItem.security_code_settings && cardDataItem.security_code_settings.mode === 'mandatory';

    if (isCreditCard && isCVVMandatory) {
        const cvvContainerId = 'mercadopago-cvv-container';
        const cvvLabelText = 'Security code';

        const cvvHtml = `
            <div class="card-input-group">
                <label>${cvvLabelText}</label> 
                <div id="${cvvContainerId}" class="cvv-input-sdk-container secure-fields"></div>
            </div>
        `;
        containerDiv.insertAdjacentHTML('beforeend', cvvHtml);

        try {
            if (securityCodeField) securityCodeField?.unmount();
            securityCodeField = MPAuthenticator.createSecureField(cardDataItem, cvvContainerId);

        } catch (error) {
            console.error("Error creating or mounting secure field via MPAuthenticator:", error);
            const cvvMountElement = containerDiv.querySelector(`#${cvvContainerId}`);
            if (cvvMountElement) cvvMountElement.innerHTML = `<p style="color:red;">${error.message || 'Error creating or mounting secure field.'}</p>`;
            securityCodeField = null;
        }

    } else {
        if (securityCodeField) securityCodeField?.unmount();
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
                    selectedInstallment = null;
                } else {
                    selectedInstallment = cardDataItem.installments[parseInt(installmentsSelect.value)];
                    console.log('Installment selected:', selectedInstallment);
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

    const creditCardOption = {
        id: 'new_credit_card',
        name: 'Credit Card',
        icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="#333333"/></svg>'
    };

    const divId = `option-div-static-${creditCardOption.id}`;
    const radioId = `pm-radio-static-${creditCardOption.id}`;
    const iconHtml = `<div class="payment-icon credit-card-icon">${creditCardOption.icon}</div>`;

    const optionHtml = `
        <div class="payment-option static-option" id="${divId}">
            <input type="radio" name="payment-method" id="${radioId}" value="${creditCardOption.id}">
            ${iconHtml}
            <div class="payment-details">
                <label for="${radioId}" class="payment-title">${creditCardOption.name}</label>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', optionHtml);

    const optionDiv = document.getElementById(divId);
    if (optionDiv) {
        if (!initialLoadDone) {
            optionDiv.onclick = async () => {
                const savedMethodsSection = document.getElementById('saved-payment-methods-section');
                if (savedMethodsSection) savedMethodsSection.style.display = 'block';
                optionDiv.innerHTML = null;
                optionDiv.onclick = null;

                await initializePaymentFlow();
            };
        } else {
            optionDiv.onclick = () => {
                updateSelection(divId, radioId, false, creditCardOption);
                console.log('Selected option to add a new credit card.');
                manageCardDetailsArea(true, { type: 'new_credit_card' });
            };
        }
    }
}

async function initializePaymentFlow() {

    try {
        const accountPaymentMethodsContainer = document.getElementById('account-payment-methods-list');
        if (accountPaymentMethodsContainer) {
            accountPaymentMethodsContainer.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
        }

        authorizationToken = await MPAuthenticator.getAuthorizationToken();
        const accountPaymentMethodsResponse = await MPAuthenticator.getAccountPaymentMethods(authorizationToken);
        if (accountPaymentMethodsResponse) {
            renderPaymentMethods(accountPaymentMethodsResponse);
        } else {
            console.error("Failed to fetch payment methods or authorization token from MPAuthenticator.");
            if (accountPaymentMethodsContainer) {
                accountPaymentMethodsContainer.innerHTML = '<p>Error loading payment data. Please try reloading.</p>';
            }
        }
    } catch (error) {
        console.error("Failed to process or render payment methods via MPAuthenticator:", error);
        const accountPaymentMethodsContainer = document.getElementById('account-payment-methods-list');
        if (accountPaymentMethodsContainer) {
            accountPaymentMethodsContainer.innerHTML = '<p>Error loading payment methods. Please try again later.</p>';
        }
    }


    initialLoadDone = true;
    renderStaticPaymentOptions();
}

async function setupInitialView() {
    initialLoadDone = false;

    const otherOptionsContainer = document.getElementById('other-payment-options-list');
    if (otherOptionsContainer) {
        otherOptionsContainer.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
    }

    try {
        await MPAuthenticator.initializeAuthenticator(totalAmount, payerEmail);
        if (otherOptionsContainer) otherOptionsContainer.innerHTML = '';
    } catch (error) {
        console.error("Script: Error during start call in setupInitialView:", error);
        const otherOptionsContainer = document.getElementById('other-payment-options-list');
        if (otherOptionsContainer) {
            otherOptionsContainer.innerHTML = `<p style='color:red;'>${error.message}</p>`;
            return;
        }
    }

    renderStaticPaymentOptions();
}

document.addEventListener('DOMContentLoaded', setupInitialView);