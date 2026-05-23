const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

async function sendSMS(toPhoneNumber, message) {
  const response = await vonage.sms.send({
    to: toPhoneNumber, // Format: 6421XXXXXXX — country code, no + sign, no spaces
    from: 'GARAGE',    // This is what appears as the sender name on the recipient's phone
    text: message,
  });
  return response;
}

module.exports = { sendSMS };