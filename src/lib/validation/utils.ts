import { getTranslations } from "next-intl/server";

// Validation message utility for server-side validation
export async function getValidationMessages() {
  const t = await getTranslations("Validation");

  return {
    bankAccount: {
      nameRequired: t("bankAccount.nameRequired"),
      nameMin: t("bankAccount.nameMin"),
      nameMax: t("bankAccount.nameMax"),
      ibanRequired: t("bankAccount.ibanRequired"),
      ibanInvalid: t("bankAccount.ibanInvalid"),
      bankNameLength: t("bankAccount.bankNameLength"),
      accountNumberInvalid: t("bankAccount.accountNumberInvalid"),
      bankCodeInvalid: t("bankAccount.bankCodeInvalid"),
      swiftInvalid: t("bankAccount.swiftInvalid"),
    },
    event: {
      titleMin: t("event.titleMin"),
      titleMax: t("event.titleMax"),
      descriptionMax: t("event.descriptionMax"),
      venueRequired: t("event.venueRequired"),
      venueMax: t("event.venueMax"),
      capacityInteger: t("event.capacityInteger"),
      capacityMin: t("event.capacityMin"),
      capacityMax: t("event.capacityMax"),
      priceMin: t("event.priceMin"),
      priceMax: t("event.priceMax"),
      startDateInvalid: t("event.startDateInvalid"),
      endDateInvalid: t("event.endDateInvalid"),
      endDateAfterStart: t("event.endDateAfterStart"),
    },
  };
}

// Client-side validation messages using useTranslations hook
// eslint-disable-next-line no-unused-vars
export function createValidationMessages(t: (key: string) => string) {
  return {
    bankAccount: {
      nameRequired: t("Validation.bankAccount.nameRequired"),
      nameMin: t("Validation.bankAccount.nameMin"),
      nameMax: t("Validation.bankAccount.nameMax"),
      ibanRequired: t("Validation.bankAccount.ibanRequired"),
      ibanInvalid: t("Validation.bankAccount.ibanInvalid"),
      bankNameLength: t("Validation.bankAccount.bankNameLength"),
      accountNumberInvalid: t("Validation.bankAccount.accountNumberInvalid"),
      bankCodeInvalid: t("Validation.bankAccount.bankCodeInvalid"),
      swiftInvalid: t("Validation.bankAccount.swiftInvalid"),
    },
    event: {
      titleMin: t("Validation.event.titleMin"),
      titleMax: t("Validation.event.titleMax"),
      descriptionMax: t("Validation.event.descriptionMax"),
      venueRequired: t("Validation.event.venueRequired"),
      venueMax: t("Validation.event.venueMax"),
      capacityInteger: t("Validation.event.capacityInteger"),
      capacityMin: t("Validation.event.capacityMin"),
      capacityMax: t("Validation.event.capacityMax"),
      priceMin: t("Validation.event.priceMin"),
      priceMax: t("Validation.event.priceMax"),
      startDateInvalid: t("Validation.event.startDateInvalid"),
      endDateInvalid: t("Validation.event.endDateInvalid"),
      endDateAfterStart: t("Validation.event.endDateAfterStart"),
    },
  };
}
