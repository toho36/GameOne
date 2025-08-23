/**
 * Bank accounts API endpoint - Thin handler for GameOne
 * Refactored from 272 lines following project standards
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requirePermissions } from "@/lib/api/common/auth";
import { bankAccountsService } from "@/lib/api/bank-accounts/service";

// GET /api/bank-accounts - Get bank accounts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const authResult = await requirePermissions(["bank_accounts.manage"]);
    if (!authResult.success) {
      return authResult.response;
    }

    // Delegate to service
    const result = await bankAccountsService.getBankAccounts(request);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Bank accounts fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bank accounts" }, { status: 500 });
  }
}

// POST /api/bank-accounts - Create new bank account (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const authResult = await requirePermissions(["bank_accounts.manage"]);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();

    // Delegate to service
    const result = await bankAccountsService.createBankAccount(body);

    if (!result.success) {
      return result.response!;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error("Bank account creation error:", error);
    return NextResponse.json({ error: "Failed to create bank account" }, { status: 500 });
  }
}
