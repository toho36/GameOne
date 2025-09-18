import { Resend } from "resend";

const apiKey = process.env["RESEND_API_KEY"];

if (!apiKey) {
  // We deliberately don't throw here to avoid breaking non-email flows in dev.
  // Callers should handle errors from sendEmail when API key is missing.
  // eslint-disable-next-line no-console
  console.warn("RESEND_API_KEY is not set. Emails will not be sent.");
}

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}) {
  if (!resend) {
    return { success: false as const, error: "RESEND_API_KEY not configured" };
  }
  const from = params.from ?? "GameOne <no-reply@gameone.local>";
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (error) {
      return { success: false as const, error: String(error) };
    }
    return { success: true as const, data };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Email send failed",
    };
  }
}
