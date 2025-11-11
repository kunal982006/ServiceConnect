import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
  accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendBookingNotification(
  to: string,
  status: 'accepted' | 'declined',
  providerName: string,
  scheduledDate?: string
) {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();

    const message = status === 'accepted'
      ? `Good news! ${providerName} has accepted your booking${scheduledDate ? ` for ${scheduledDate}` : ''}. They will contact you soon.`
      : `${providerName} has declined your booking request. Please try booking with another provider.`;

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

// --- YEH NAYA FUNCTION ADD KIYA HAI ---
/**
 * Customer ko Service OTP SMS se bhejta hai
 */
export async function sendOtpNotification(
  to: string,
  otp: string
) {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();

    const message = `Your service OTP for Shirur Express is ${otp}. Please share this with your technician to complete the service.`;

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    return result;
  } catch (error) {
    console.error('Error sending OTP SMS:', error);
    throw error;
  }
}