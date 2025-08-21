import { z } from "zod";

// Czech IBAN validation pattern
const CZECH_IBAN_REGEX = /^CZ\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}$/;

// Slovak IBAN validation pattern
const SLOVAK_IBAN_REGEX = /^SK\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}$/;

// Czech account number validation (can be just digits or format: prefix-account/bank)
const CZECH_ACCOUNT_NUMBER_REGEX = /^(\d{1,6}-)?[\d]{2,10}$/;

// Slovak account number validation
const SLOVAK_ACCOUNT_NUMBER_REGEX = /^[\d]{2,10}$/;

// Bank code validation (4 digits)
const BANK_CODE_REGEX = /^\d{4}$/;

// SWIFT/BIC validation (8 or 11 characters)
const SWIFT_REGEX = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

// Function to create bank account schema with translated messages
export const createBankAccountFormSchema = (messages?: {
  nameRequired?: string;
  nameMin?: string;
  nameMax?: string;
  ibanRequired?: string;
  ibanInvalid?: string;
  bankNameLength?: string;
  accountNumberInvalid?: string;
  bankCodeInvalid?: string;
  swiftInvalid?: string;
}) => {
  const msgs = messages || {
    nameRequired: "Account name is required",
    nameMin: "Account name must be at least 2 characters",
    nameMax: "Account name must be less than 100 characters",
    ibanRequired: "IBAN is required",
    ibanInvalid: "Invalid IBAN format. Must be valid Czech (CZ) or Slovak (SK) IBAN",
    bankNameLength: "Bank name must be between 2 and 100 characters",
    accountNumberInvalid: "Invalid account number format",
    bankCodeInvalid: "Bank code must be exactly 4 digits",
    swiftInvalid: "Invalid SWIFT/BIC format. Must be 8 or 11 characters (e.g., KOMBCZPP)",
  };

  return z.object({
    name: z.string().min(1, msgs.nameRequired).min(2, msgs.nameMin).max(100, msgs.nameMax).trim(),

    // Primary field - IBAN (required)
    iban: z
      .string()
      .min(1, msgs.ibanRequired)
      .refine((value) => {
        const cleaned = value.replace(/\s/g, "").toUpperCase();
        return CZECH_IBAN_REGEX.test(cleaned) || SLOVAK_IBAN_REGEX.test(cleaned);
      }, msgs.ibanInvalid),

    // Optional fields - auto-extracted from IBAN or manually provided
    bankName: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) return true;
        return value.trim().length >= 2 && value.trim().length <= 100;
      }, msgs.bankNameLength),

    accountNumber: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) return true;
        const cleaned = value.replace(/\s/g, "");
        return (
          CZECH_ACCOUNT_NUMBER_REGEX.test(cleaned) || SLOVAK_ACCOUNT_NUMBER_REGEX.test(cleaned)
        );
      }, msgs.accountNumberInvalid),

    bankCode: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) return true;
        return BANK_CODE_REGEX.test(value);
      }, msgs.bankCodeInvalid),

    swift: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) return true;
        return SWIFT_REGEX.test(value.toUpperCase());
      }, msgs.swiftInvalid),

    isDefault: z.boolean().default(false),

    isActive: z.boolean().default(true),

    qrCodeEnabled: z.boolean().default(true),
  });
};

// Default schema for backward compatibility
export const bankAccountFormSchema = createBankAccountFormSchema();

export const bankAccountUpdateSchema = bankAccountFormSchema.partial();

export const bankAccountQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  // ownerId: z.string().optional(), // Temporarily disabled - column doesn't exist in DB
});

// Validation functions
export function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  return CZECH_IBAN_REGEX.test(cleaned) || SLOVAK_IBAN_REGEX.test(cleaned);
}

export function validateAccountNumber(accountNumber: string): boolean {
  const cleaned = accountNumber.replace(/\s/g, "");
  return CZECH_ACCOUNT_NUMBER_REGEX.test(cleaned) || SLOVAK_ACCOUNT_NUMBER_REGEX.test(cleaned);
}

export function validateBankCode(bankCode: string): boolean {
  return BANK_CODE_REGEX.test(bankCode);
}

export function validateSWIFT(swift: string): boolean {
  return SWIFT_REGEX.test(swift.toUpperCase());
}

// Extract bank code and account number from IBAN
export function extractBankInfoFromIBAN(iban: string): {
  bankCode?: string;
  accountNumber?: string;
  bankName?: string;
} {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();

  if (cleaned.startsWith("CZ") || cleaned.startsWith("SK")) {
    // Czech/Slovak IBAN format: CZXX BBBB SSSS SSNN NNNN NNNN
    // Where BB = bank code, SS+NN = account number
    const bankCode = cleaned.substring(4, 8);
    const accountNumber = cleaned.substring(8, 18).replace(/^0+/, "") + cleaned.substring(18);

    // Basic bank name mapping for common Czech/Slovak banks
    const bankNames: Record<string, string> = {
      "0100": "Komerční banka",
      "0300": "Československá obchodní banka",
      "0600": "GE Money Bank",
      "0800": "Česká spořitelna",
      "2010": "Fio banka",
      "2020": "Bank of Tokyo-Mitsubishi UFJ",
      "2030": "Citibank Europe",
      "2070": "Moravský Peněžní Ústav",
      "2100": "Hypoteční banka",
      "2200": "Peněžní dům",
      "2220": "Artesa",
      "2240": "Poštová banka",
      "2250": "Banka Creditas",
      "2260": "NEY spořitelní družstvo",
      "2275": "Podnikatelská družstevní záložna",
      "2600": "Citibank",
      "2700": "UniCredit Bank Czech Republic and Slovakia",
      "3030": "Air Bank",
      "3500": "ING Bank N.V.",
      "4000": "Expobank CZ",
      "4300": "Českomoravská záruční a rozvojová banka",
      "5500": "Raiffeisenbank",
      "5800": "J & T BANKA",
      "6000": "PPF banka",
      "6100": "Equa bank",
      "6200": "COMMERZBANK Aktiengesellschaft",
      "6210": "mBank",
      "6300": "BNP Paribas Personal Finance SA",
      "6700": "Všeobecná úverová banka",
      "6800": "Sberbank CZ",
      "7910": "Deutsche Bank",
      "7940": "Waldviertler Sparkasse Bank AG",
      "7950": "Raiffeisen stavební spořitelna",
      "7960": "ČSOB stavební spořitelna",
      "7970": "Wüstenrot stavební spořitelna",
      "7980": "Wüstenrot hypoteční banka",
      "7990": "Modrá pyramida stavební spořitelna",
      "8030": "Volksbank Raiffeisenbank Nordoberpfalz",
      "8040": "Oberbank AG",
      "8090": "Česká exportní banka",
      "8150": "HSBC Bank plc",
      "8190": "Sparkasse Oberlausitz-Niederschlesien",
      "8200": "COMMERZBANK Aktiengesellschaft, pobočka Praha",
      "8215": "Bank für Sozialwirtschaft",
      "8220": "Payment Execution s.r.o.",
      "8230": "EEPAYS s.r.o.",
      "8240": "Reiffeisen Bank International AG",
      "8250": "Bank of China (CEE) Ltd. Prague Branch",
      "8260": "PRIVAT BANK der Raiffeisenlandesbank Oberösterreich Aktiengesellschaft",
      "8270": "Fairplay Pay s.r.o.",
      "8280": "B2B Pay s.r.o.",
      "8290": "Allegro Pay s.r.o.",
    };

    return {
      bankCode,
      accountNumber: accountNumber.replace(/^0+/, "") || "0", // Remove leading zeros
      bankName: bankNames[bankCode],
    };
  }

  return {};
}

// Format helpers
export function formatIBAN(iban: string): string {
  return iban
    .replace(/\s/g, "")
    .toUpperCase()
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function formatAccountNumber(accountNumber: string): string {
  return accountNumber.replace(/\s/g, "");
}

export function formatBankCode(bankCode: string): string {
  return bankCode.replace(/\s/g, "");
}

// Type exports
export type BankAccountFormSchema = z.infer<typeof bankAccountFormSchema>;
export type BankAccountUpdateSchema = z.infer<typeof bankAccountUpdateSchema>;
export type BankAccountQuerySchema = z.infer<typeof bankAccountQuerySchema>;
