import type { BankAccount } from "@/types/bank-account";
import { logger } from "@/lib/logger";

// Get default bank account from configuration
export function getDefaultBankAccount(): BankAccount {
  // This would typically come from a config file or database
  // For now, using a default fallback
  return {
    id: "default",
    name: "Default Account",
    bankName: "Default Bank",
    accountNumber: process.env["NEXT_PUBLIC_BANK_ACCOUNT"] || "CZ9130300000001628400020",
    bankCode: "3030",
    iban: process.env["NEXT_PUBLIC_BANK_ACCOUNT"] || "CZ9130300000001628400020",
    isDefault: true,
    isActive: true,
    qrCodeEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Get bank account by ID (would typically query database)
export function getBankAccountById(id: string): BankAccount | null {
  // This would typically query the database
  // For now, return default if ID matches
  if (id === "default") {
    return getDefaultBankAccount();
  }
  return null;
}

// Generate QR code URL for payment
export function generateQRCodeURL(
  name: string,
  eventDate: string,
  price: number = 150,
  bankAccount?: string
) {
  // Use provided bank account, or fall back to environment variable, or default from config
  const account =
    bankAccount || process.env["NEXT_PUBLIC_BANK_ACCOUNT"] || getDefaultBankAccount().accountNumber;

  const paymentString = `SPD*1.0*ACC:${account}*RN:VU LOAN TIKOVSKA*AM:${price}*CC:CZK*MSG:GameOn ${name} for event on ${eventDate}`;
  const encodedPaymentString = encodeURIComponent(paymentString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedPaymentString}`;
}

// Helper function to generate QR with specific bank account
export function generateQRCodeURLWithAccount(
  name: string,
  eventDate: string,
  price: number,
  bankAccount: string
) {
  return generateQRCodeURL(name, eventDate, price, bankAccount);
}

// Generate QR code using bank account ID from configuration
export function generateQRCodeURLWithAccountId(
  name: string,
  eventDate: string,
  price: number,
  bankAccountId: string
) {
  const account = getBankAccountById(bankAccountId);
  if (!account) {
    throw new Error(`Bank account with ID '${bankAccountId}' not found`);
  }
  return generateQRCodeURL(name, eventDate, price, account.accountNumber);
}

// Generate QR code with full bank account config (for more control)
export function generateQRCodeURLWithBankAccount(
  name: string,
  eventDate: string,
  price: number,
  bankAccount: BankAccount
) {
  return generateQRCodeURL(name, eventDate, price, bankAccount.accountNumber);
}

// Enhanced function to generate QR code using database bank account
export async function generateQRCodeURLWithDatabaseAccount(
  name: string,
  eventDate: string,
  price: number,
  bankAccountId: string
): Promise<string> {
  // This would typically fetch from database
  // For now, using a mock implementation
  try {
    const response = await fetch(`/api/bank-accounts/${bankAccountId}`);
    if (!response.ok) {
      throw new Error(`Bank account not found: ${bankAccountId}`);
    }

    const { bankAccount } = await response.json();
    return generateQRCodeURL(name, eventDate, price, bankAccount.accountNumber);
  } catch (error) {
    logger.error("Error fetching bank account for QR code generation", error);
    // Fallback to default account
    return generateQRCodeURL(name, eventDate, price);
  }
}

// Generate Czech bank transfer payment string
export function generateCzechPaymentString(
  accountNumber: string,
  amount: number,
  currency: string = "CZK",
  message?: string,
  recipientName?: string
): string {
  const parts = [
    "SPD*1.0",
    `ACC:${accountNumber}`,
    ...(recipientName ? [`RN:${recipientName}`] : []),
    `AM:${amount}`,
    `CC:${currency}`,
    ...(message ? [`MSG:${message}`] : []),
  ];

  return parts.join("*");
}

// Generate Slovak bank transfer payment string
export function generateSlovakPaymentString(
  iban: string,
  amount: number,
  currency: string = "EUR",
  message?: string,
  recipientName?: string
): string {
  const parts = [
    "SPD*1.0",
    `ACC:${iban}`,
    ...(recipientName ? [`RN:${recipientName}`] : []),
    `AM:${amount}`,
    `CC:${currency}`,
    ...(message ? [`MSG:${message}`] : []),
  ];

  return parts.join("*");
}

// Generate QR code for any bank account with proper formatting
export function generateQRCodeForBankAccount(
  bankAccount: BankAccount,
  amount: number,
  eventName: string,
  eventDate: string,
  currency: string = "CZK"
): string {
  const message = `GameOn ${eventName} for event on ${eventDate}`;

  // Use IBAN if available for Slovak accounts, otherwise use account number
  const accountInfo = bankAccount.iban?.startsWith("SK")
    ? bankAccount.iban
    : bankAccount.accountNumber;

  // Determine currency based on account type
  const finalCurrency = bankAccount.iban?.startsWith("SK") ? "EUR" : currency;

  const paymentString = bankAccount.iban?.startsWith("SK")
    ? generateSlovakPaymentString(accountInfo, amount, finalCurrency, message, "GameOne Event")
    : generateCzechPaymentString(accountInfo, amount, finalCurrency, message, "GameOne Event");

  const encodedPaymentString = encodeURIComponent(paymentString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedPaymentString}`;
}

// Validate QR code generation parameters
export function validateQRCodeParameters(
  eventName: string,
  eventDate: string,
  amount: number
): { isValid: boolean; error?: string } {
  if (!eventName || eventName.trim().length === 0) {
    return { isValid: false, error: "Event name is required" };
  }

  if (!eventDate || eventDate.trim().length === 0) {
    return { isValid: false, error: "Event date is required" };
  }

  if (amount <= 0) {
    return { isValid: false, error: "Amount must be greater than 0" };
  }

  if (amount > 1000000) {
    return { isValid: false, error: "Amount is too large" };
  }

  return { isValid: true };
}
