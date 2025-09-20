import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { generateQRCodeURL } from "@/lib/qr-code";

import { createTranslator } from "next-intl";
import { messages } from "@/lib/i18n/messages";

function toPlainCurrency(amount: any): number {
  // Prisma Decimal or number
  if (typeof amount === "number") return amount;
  if (amount && typeof amount === "object" && "toNumber" in amount) {
    try {
      return (amount as any).toNumber();
    } catch {
      return Number(String(amount));
    }
  }
  return Number(amount ?? 0);
}

function getT(locale?: string) {
  const localeKey = (locale === "cs" ? "cs" : "en") as keyof typeof messages;
  return createTranslator({ locale: localeKey, messages: messages[localeKey] });
}

async function getEmailContext(userId: string, eventId: string, registrationId: string) {
  const [user, event, registration] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
    prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true, startDate: true, price: true, currency: true },
    }),
    prisma.registration.findUnique({ where: { id: registrationId }, select: { id: true } }),
  ]);
  if (!user?.email || !event || !registration) {
    return null;
  }
  const amount = toPlainCurrency(event.price);
  const date = new Date(event.startDate).toISOString().slice(0, 10);
  const qrUrl = generateQRCodeURL(event.title, date, amount);
  const t = getT("en");
  return { user, event, registration, amount, date, qrUrl, t };
}

export async function sendPaymentClaimReceived(
  userId: string,
  eventId: string,
  registrationId: string
) {
  const ctx = await getEmailContext(userId, eventId, registrationId);
  if (!ctx) return { success: false, error: "Email context missing" } as const;
  const subject = ctx.t("RegistrationEmails.claim.subject", { title: ctx.event.title });
  const html = `
    <div>
      <h2>${ctx.t("RegistrationEmails.claim.title")}</h2>
      <p>${ctx.t("RegistrationEmails.claim.title")} for registration <strong>${ctx.registration.id}</strong> to <strong>${ctx.event.title}</strong>.</p>
      <p><strong>${ctx.t("RegistrationEmails.claim.amount", { amount: ctx.amount, currency: ctx.event.currency ?? "" })}</strong></p>
      <p>${ctx.t("RegistrationEmails.claim.eventDate", { date: ctx.date })}</p>
      <p>${ctx.t("RegistrationEmails.claim.qrHint")}</p>
      <img src="${ctx.qrUrl}" alt="Payment QR" style="width:160px;height:160px;border:1px solid #eee;border-radius:8px" />
      <p>${ctx.t("RegistrationEmails.claim.nextSteps")}</p>
    </div>
  `;
  const text = `${ctx.t("RegistrationEmails.claim.title")} ${ctx.event.title}. ${ctx.t("RegistrationEmails.claim.amount", { amount: ctx.amount, currency: ctx.event.currency ?? "" })}. ${ctx.t("RegistrationEmails.claim.eventDate", { date: ctx.date })}.`;
  return await sendEmail({ to: ctx.user.email, subject, html, text });
}

export async function sendPaymentVerified(userId: string, eventId: string, registrationId: string) {
  const ctx = await getEmailContext(userId, eventId, registrationId);
  if (!ctx) return { success: false, error: "Email context missing" } as const;
  const subject = ctx.t("RegistrationEmails.verified.subject", { title: ctx.event.title });
  const html = `
    <div>
      <h2>${ctx.t("RegistrationEmails.verified.title")}</h2>
      <p>${ctx.t("RegistrationEmails.verified.body", { date: ctx.date })}</p>
      <p><strong>${ctx.event.title}</strong></p>
    </div>
  `;
  const text = ctx.t("RegistrationEmails.verified.body", { date: ctx.date });
  return await sendEmail({ to: ctx.user.email, subject, html, text });
}

export async function sendPaymentRejected(
  userId: string,
  eventId: string,
  registrationId: string,
  reason?: string
) {
  const ctx = await getEmailContext(userId, eventId, registrationId);
  if (!ctx) return { success: false, error: "Email context missing" } as const;
  const subject = ctx.t("RegistrationEmails.rejected.subject", { title: ctx.event.title });
  const html = `
    <div>
      <h2>${ctx.t("RegistrationEmails.rejected.title")}</h2>
      ${reason ? `<p><strong>${ctx.t("RegistrationEmails.rejected.reason", { reason })}</strong></p>` : ""}
      <p>${ctx.t("RegistrationEmails.rejected.body")}</p>
      <p>${ctx.t("RegistrationEmails.rejected.qrHint")}</p>
      <img src="${ctx.qrUrl}" alt="Payment QR" style="width:160px;height:160px;border:1px solid #eee;border-radius:8px" />
    </div>
  `;
  const text = reason
    ? `${ctx.t("RegistrationEmails.rejected.title")} ${ctx.event.title}. ${ctx.t("RegistrationEmails.rejected.reason", { reason })}`
    : `${ctx.t("RegistrationEmails.rejected.title")} ${ctx.event.title}.`;
  return await sendEmail({ to: ctx.user.email, subject, html, text });
}
