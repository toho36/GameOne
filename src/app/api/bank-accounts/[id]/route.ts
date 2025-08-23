import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requirePermissions } from "@/lib/api/auth/permissions";
import { validateBankAccountData } from "@/lib/api/bank-accounts/validation";
import {
  validateBankAccountExists,
  ensureSingleDefault,
  checkCanDeleteBankAccount,
} from "@/lib/api/bank-accounts/operations";

const BANK_ACCOUNT_PERMISSIONS = ["bank_accounts.manage", "admin.full_access"];

// GET /api/bank-accounts/[id] - Get single bank account
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requirePermissions(BANK_ACCOUNT_PERMISSIONS);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const validation = await validateBankAccountExists(id);
    if (!validation.exists) return validation.response;

    return NextResponse.json({ bankAccount: validation.bankAccount });
  } catch (error) {
    console.error("Bank account fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bank account" }, { status: 500 });
  }
}

// PUT /api/bank-accounts/[id] - Update bank account
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requirePermissions(BANK_ACCOUNT_PERMISSIONS);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const validation = validateBankAccountData(body, true);

    if (!validation.success) {
      return validation.response!;
    }

    const validatedData = validation.data!;

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await ensureSingleDefault(id);
    }

    // Prepare update data with proper handling of nullable fields
    const updateData: any = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.iban !== undefined) updateData.iban = validatedData.iban;
    if (validatedData.bankName !== undefined) updateData.bankName = validatedData.bankName || null;
    if (validatedData.accountNumber !== undefined)
      updateData.accountNumber = validatedData.accountNumber || null;
    if (validatedData.bankCode !== undefined) updateData.bankCode = validatedData.bankCode || null;
    if (validatedData.swift !== undefined) updateData.swift = validatedData.swift || null;
    if (validatedData.isDefault !== undefined) updateData.isDefault = validatedData.isDefault;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.qrCodeEnabled !== undefined)
      updateData.qrCodeEnabled = validatedData.qrCodeEnabled;

    const bankAccount = await prisma.bankAccount.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ bankAccount });
  } catch (error) {
    console.error("Bank account update error:", error);
    return NextResponse.json({ error: "Failed to update bank account" }, { status: 500 });
  }
}

// DELETE /api/bank-accounts/[id] - Delete bank account
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermissions(BANK_ACCOUNT_PERMISSIONS);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const deleteCheck = await checkCanDeleteBankAccount(id);
    if (!deleteCheck.canDelete) {
      return deleteCheck.response!;
    }

    await prisma.bankAccount.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Bank account deleted successfully",
    });
  } catch (error) {
    console.error("Bank account deletion error:", error);
    return NextResponse.json({ error: "Failed to delete bank account" }, { status: 500 });
  }
}
