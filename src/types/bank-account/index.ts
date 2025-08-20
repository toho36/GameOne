// Bank account types and interfaces

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  bankCode: string;
  iban?: string;
  swift?: string;
  isDefault: boolean;
  isActive: boolean;
  qrCodeEnabled: boolean;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  owner?: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface BankAccountFormData {
  name: string;
  bankName: string;
  accountNumber: string;
  bankCode: string;
  iban?: string;
  swift?: string;
  isDefault: boolean;
  isActive: boolean;
  qrCodeEnabled: boolean;
}

export interface BankAccountFormErrors {
  name?: string;
  bankName?: string;
  accountNumber?: string;
  bankCode?: string;
  iban?: string;
  swift?: string;
  isDefault?: string;
  isActive?: string;
  qrCodeEnabled?: string;
  general?: string;
}

export interface BankAccountsResponse {
  bankAccounts: BankAccount[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface BankAccountCreateRequest {
  name: string;
  bankName: string;
  accountNumber: string;
  bankCode: string;
  iban?: string;
  swift?: string;
  isDefault?: boolean;
  isActive?: boolean;
  qrCodeEnabled?: boolean;
}

export interface BankAccountUpdateRequest {
  name?: string;
  bankName?: string;
  accountNumber?: string;
  bankCode?: string;
  iban?: string;
  swift?: string;
  isDefault?: boolean;
  isActive?: boolean;
  qrCodeEnabled?: boolean;
}

export interface BankAccountApiResponse {
  success: boolean;
  bankAccount?: BankAccount;
  error?: string;
  message?: string;
}

// Common bank codes for Czech Republic
export const CZECH_BANK_CODES = {
  "0100": "Komerční banka",
  "0300": "Československá obchodní banka",
  "0600": "MONETA Money Bank",
  "0700": "Česká národní banka",
  "0800": "Česká spořitelna",
  "2010": "Fio banka",
  "2020": "Bank of Tokyo-Mitsubishi UFJ",
  "2030": "AKCENTA CZ",
  "2060": "Citfin",
  "2070": "Creditas",
  "2100": "Hypoteční banka",
  "2200": "Peněžní dům",
  "2220": "Artesa",
  "2240": "Poštová banka",
  "2250": "Banka CREDITAS",
  "2260": "NEY spořitelní družstvo",
  "2275": "Podnikatelská družstevní záložna",
  "2600": "Citibank",
  "2700": "UniCredit Bank",
  "3030": "Air Bank",
  "3050": "BNP Paribas Personal Finance",
  "4000": "Expobank CZ",
  "4300": "Českomoravská záruční a rozvojová banka",
  "5500": "Raiffeisenbank",
  "5800": "J&T BANKA",
  "6000": "PPF banka",
  "6100": "Equa bank",
  "6200": "MUFG Bank",
  "6210": "mBank",
  "6300": "BNP Paribas",
  "6700": "Všeobecná úverová banka",
  "6800": "Sberbank CZ",
  "7910": "Deutsche Bank",
  "7940": "Waldviertler Sparkasse",
  "7950": "Raiffeisen stavební spořitelna",
  "7960": "Českomoravská stavební spořitelna",
  "7970": "Wüstenrot - stavební spořitelna",
  "7980": "Wüstenrot hypoteční banka",
  "7990": "Modrá pyramida stavební spořitelna",
  "8030": "Volksbank Raiffeisenbank",
  "8040": "Oberbank",
  "8090": "Česká exportní banka",
  "8150": "HSBC Bank",
  "8200": "PRIVAT BANK",
  "8220": "Payment Execution",
  "8230": "EURAM Bank",
  "8240": "Sberbank",
  "8250": "Bank of China",
  "8260": "ANO spořitelní družstvo",
} as const;

// Slovak bank codes
export const SLOVAK_BANK_CODES = {
  "0200": "Všeobecná úverová banka",
  "0720": "Národná banka Slovenska",
  "0900": "Slovenská sporiteľňa",
  "1100": "Tatra banka",
  "1111": "UniCredit Bank Slovakia",
  "3100": "Slovenská záručná a rozvojová banka",
  "5200": "OTP Banka Slovensko",
  "5600": "Dexia banka Slovensko",
  "6500": "Poštová banka",
  "7300": "Sberbank Slovensko",
  "7500": "Raiffeisen banka",
  "8100": "Volksbank Slovensko",
  "8120": "Istrokapitál",
  "8130": "ČSOB",
  "8160": "Prima banka Slovensko",
  "8170": "Hypo-Banka Slovakia",
  "8180": "Komerční banka Bratislava",
  "8320": "COMMERZBANK Bratislava",
  "8350": "Crédit Agricole Slovakia",
} as const;

export type CzechBankCode = keyof typeof CZECH_BANK_CODES;
export type SlovakBankCode = keyof typeof SLOVAK_BANK_CODES;
export type BankCode = CzechBankCode | SlovakBankCode;

// Default form values
export const DEFAULT_BANK_ACCOUNT_FORM_DATA: BankAccountFormData = {
  name: "",
  bankName: "",
  accountNumber: "",
  bankCode: "",
  iban: "",
  swift: "",
  isDefault: false,
  isActive: true,
  qrCodeEnabled: true,
};
