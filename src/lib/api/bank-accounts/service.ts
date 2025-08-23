/**
 * Bank accounts business logic service for GameOne
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { bankAccountQuerySchema } from "@/lib/validation/bank-account";
import { validateBankAccountData } from "./validation";
import { ensureSingleDefault } from "./operations";

export interface BankAccountQuery {
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

export interface BankAccountCreateData {
  name: string;
  iban: string;
  bankName?: string;
  accountNumber?: string;
  bankCode?: string;
  swift?: string;
  isDefault?: boolean;
  isActive?: boolean;
  qrCodeEnabled?: boolean;
}

/**
 * Bank accounts service class
 */
export class BankAccountsService {
  /**
   * Get bank accounts with filtering and pagination
   */
  async getBankAccounts(request: NextRequest) {
    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = bankAccountQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};

    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: "insensitive" } },
        { bankName: { contains: validatedQuery.search, mode: "insensitive" } },
        { accountNumber: { contains: validatedQuery.search } },
      ];
    }

    if (validatedQuery.isActive !== undefined) {
      where.isActive = validatedQuery.isActive;
    }

    // Note: ownerId filtering temporarily disabled due to missing column in database
    // TODO: Re-enable after adding ownerId column via migration

    // Get total count for pagination
    const totalCount = await prisma.bankAccount.count({ where });

    // Get bank accounts with pagination
    const bankAccounts = await prisma.bankAccount.findMany({
      where,
      select: {
        id: true,
        name: true,
        bankName: true,
        accountNumber: true,
        bankCode: true,
        iban: true,
        swift: true,
        isDefault: true,
        isActive: true,
        qrCodeEnabled: true,
        // ownerId: true, // Temporarily disabled - column doesn't exist in DB
        createdAt: true,
        updatedAt: true,
        // owner: { // Temporarily disabled - ownerId column doesn't exist in DB
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //   },
        // },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      skip: (validatedQuery.page - 1) * validatedQuery.limit,
      take: validatedQuery.limit,
    });

    const totalPages = Math.ceil(totalCount / validatedQuery.limit);
    const hasMore = validatedQuery.page < totalPages;

    return {
      bankAccounts,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount,
        totalPages,
        hasMore,
      },
    };
  }

  /**
   * Create new bank account
   */
  async createBankAccount(data: any) {
    // Validate form data
    const validation = validateBankAccountData(data);
    if (!validation.success) {
      return {
        success: false,
        response: validation.response,
      };
    }

    const validatedData = validation.data!;

    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await ensureSingleDefault();
    }

    // Create bank account (global account - no ownerId)
    const bankAccount = await prisma.bankAccount.create({
      data: {
        name: validatedData.name!,
        iban: validatedData.iban!,
        bankName: validatedData.bankName || null,
        accountNumber: validatedData.accountNumber || null,
        bankCode: validatedData.bankCode || null,
        swift: validatedData.swift || null,
        isDefault: validatedData.isDefault ?? false,
        isActive: validatedData.isActive ?? true,
        qrCodeEnabled: validatedData.qrCodeEnabled ?? true,
      },
    });

    return {
      success: true,
      data: {
        success: true,
        bankAccount,
        message: "Bank account created successfully",
      },
    };
  }
}

export const bankAccountsService = new BankAccountsService();
