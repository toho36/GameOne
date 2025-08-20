import React from "react";
import { UseFormReturn } from "react-hook-form";

import { extractBankInfoFromIBAN } from "@/lib/validation/bank-account";

import type { BankAccountFormData } from "@/types/bank-account";

export function useBankAccountForm(form: UseFormReturn<BankAccountFormData>) {
  const watchedIban = form.watch("iban");

  // Auto-populate fields when IBAN changes
  React.useEffect(() => {
    if (watchedIban && watchedIban.length >= 20) {
      const bankInfo = extractBankInfoFromIBAN(watchedIban);

      if (bankInfo.bankCode && !form.getValues("bankCode")) {
        form.setValue("bankCode", bankInfo.bankCode);
      }

      if (bankInfo.accountNumber && !form.getValues("accountNumber")) {
        form.setValue("accountNumber", bankInfo.accountNumber);
      }

      if (bankInfo.bankName && !form.getValues("bankName")) {
        form.setValue("bankName", bankInfo.bankName);
      }
    }
  }, [watchedIban, form]);

  return {
    watchedIban,
  };
}

export default useBankAccountForm;
