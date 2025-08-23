import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function ensureSingleDefault(excludeId?: string) {
  await prisma.bankAccount.updateMany({
    where: {
      isDefault: true,
      ...(excludeId && { id: { not: excludeId } }),
    },
    data: { isDefault: false },
  });
}

export async function checkBankAccountUsage(bankAccountId: string) {
  const [eventsCount, pendingPaymentsCount] = await Promise.all([
    prisma.event.count({ where: { bankAccountId } }),
    prisma.pendingPayment.count({ where: { bankAccountId } }),
  ]);

  return {
    eventsCount,
    pendingPaymentsCount,
    canDelete: eventsCount === 0 && pendingPaymentsCount === 0,
  };
}

export async function validateBankAccountExists(bankAccountId: string) {
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!bankAccount) {
    return {
      exists: false,
      response: NextResponse.json({ error: "Bank account not found" }, { status: 404 }),
    };
  }

  return {
    exists: true,
    bankAccount,
  };
}

export async function checkCanDeleteBankAccount(bankAccountId: string) {
  const existingBankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!existingBankAccount) {
    return {
      canDelete: false,
      response: NextResponse.json({ error: "Bank account not found" }, { status: 404 }),
    };
  }

  if (existingBankAccount.isDefault) {
    return {
      canDelete: false,
      response: NextResponse.json(
        { error: "Cannot delete default bank account. Set another account as default first." },
        { status: 400 }
      ),
    };
  }

  const usage = await checkBankAccountUsage(bankAccountId);

  if (usage.eventsCount > 0) {
    return {
      canDelete: false,
      response: NextResponse.json(
        { error: `Cannot delete bank account. It is being used by ${usage.eventsCount} event(s).` },
        { status: 400 }
      ),
    };
  }

  if (usage.pendingPaymentsCount > 0) {
    return {
      canDelete: false,
      response: NextResponse.json(
        {
          error: `Cannot delete bank account. It has ${usage.pendingPaymentsCount} pending payment(s).`,
        },
        { status: 400 }
      ),
    };
  }

  return {
    canDelete: true,
    bankAccount: existingBankAccount,
  };
}
