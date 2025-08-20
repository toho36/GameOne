import { NextResponse } from "next/server";

import { bankAccountFormSchema, bankAccountUpdateSchema } from "@/lib/validation/bank-account";

export function validateBankAccountData(data: any, isUpdate = false) {
  const schema = isUpdate ? bankAccountUpdateSchema : bankAccountFormSchema;
  const validationResult = schema.safeParse(data);

  if (!validationResult.success) {
    const errors = validationResult.error.flatten().fieldErrors;
    return {
      success: false as const,
      errors,
      response: NextResponse.json({ errors }, { status: 400 }),
    };
  }

  return {
    success: true as const,
    data: validationResult.data,
  };
}

export function createValidationErrorResponse(errors: Record<string, string[]>) {
  return NextResponse.json({ errors }, { status: 400 });
}

export default {
  validateBankAccountData,
  createValidationErrorResponse,
};
