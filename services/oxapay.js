const config = require('../config.json');
if (process.env.OXAPAY_API_KEY) config.oxapay.apiKey = process.env.OXAPAY_API_KEY;

const BASE = 'https://api.oxapay.com/v1';

async function createInvoice(amount, orderId, description) {
  const payload = {
    amount,
    currency: config.oxapay.currency,
    lifetime: config.oxapay.lifetime,
    order_id: orderId,
    description: description || `Paiement #${orderId}`,
  };

  try {
    const response = await fetch(`${BASE}/payment/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant_api_key': config.oxapay.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status === 200 && data.data) {
      return {
        success: true,
        payLink: data.data.payment_url,
        trackId: data.data.track_id,
      };
    }
    return { success: false, error: data.message || data.error?.message || 'Erreur OxaPay' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkPayment(trackId) {
  try {
    const response = await fetch(`${BASE}/payment/${trackId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'merchant_api_key': config.oxapay.apiKey,
      },
    });

    const data = await response.json();

    if (data.status === 200 && data.data) {
      return {
        success: true,
        status: data.data.status,
        paid: data.data.status === 'Completed',
        amount: data.data.amount,
        currency: data.data.currency,
      };
    }
    return { success: false, status: 'unknown', paid: false };
  } catch (error) {
    return { success: false, status: 'error', paid: false };
  }
}

module.exports = { createInvoice, checkPayment };
