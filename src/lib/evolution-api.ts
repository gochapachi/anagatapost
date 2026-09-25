/**
 * Evolution API integration for WhatsApp delivery notifications
 * Hosted on user's VPS at https://evo.anagataitsolutions.in
 */

interface WhatsAppSendOptions {
  phone: string;
  recipientName: string;
  letterId: string;
  consignmentNumber: string;
  city: string;
  state: string;
  pincode: string;
  trackingUrl: string;
}

export async function sendDispatchWhatsAppNotification(options: WhatsAppSendOptions) {
  const evoBaseUrl = process.env.EVOLUTION_API_URL || "https://evo.anagataitsolutions.in";
  const evoApiKey = process.env.EVOLUTION_API_KEY || "";
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || "anagata-post";

  // Sanitize Indian phone number (ensure country code 91)
  let cleanNumber = options.phone.replace(/[^0-9]/g, "");
  if (cleanNumber.length === 10) {
    cleanNumber = "91" + cleanNumber;
  }

  const messageText = `📮 *AnagataPost — Physical Mail Dispatch Alert*

Hello, a real physical letter has been printed, stamped, and dispatched!

👤 *Recipient:* ${options.recipientName}
📍 *Destination:* ${options.city}, ${options.state} — ${options.pincode}
🚀 *Carrier:* India Post (Speed Post)
📦 *Tracking / Consignment No:* \`${options.consignmentNumber}\`

🔗 *Live Postal Tracking:*
${options.trackingUrl}

_Printed on 100 GSM Bond Paper, Enveloped & Dispatched via AnagataPost._`;

  // If no API key configured yet, log safely and return success simulation
  if (!evoApiKey) {
    console.log("[Evolution API Simulation] WhatsApp alert would be sent to:", cleanNumber);
    console.log(messageText);
    return {
      success: true,
      simulated: true,
      message: "Evolution API key not configured yet; simulated alert logged successfully.",
    };
  }

  try {
    const response = await fetch(`${evoBaseUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evoApiKey,
      },
      body: JSON.stringify({
        number: cleanNumber,
        text: messageText,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Evolution API Error]", response.status, errText);
      return { success: false, error: errText };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[Evolution API Exception]", error.message);
    return { success: false, error: error.message };
  }
}
