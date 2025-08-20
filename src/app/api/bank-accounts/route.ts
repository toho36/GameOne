import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";
import { bankAccountQuerySchema } from "@/lib/validation/bank-account";
import { validateBankAccountData } from "@/lib/api/bank-accounts/validation";
import { ensureSingleDefault } from "@/lib/api/bank-accounts/operations";
import { logger } from "@/lib/logger";

// GET /api/bank-accounts - Get bank accounts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user from database with auto-creation
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: kindeUser.id },
      include: {
        primaryRole: true,
        userRoles: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!dbUser) {
      const defaultRole = await prisma.role.findUnique({
        where: { name: "USER" },
      });

      dbUser = await prisma.user.create({
        data: {
          kindeId: kindeUser.id,
          email: kindeUser.email || "",
          name: kindeUser.given_name || kindeUser.family_name || kindeUser.email || "User",
          firstName: kindeUser.given_name || "",
          lastName: kindeUser.family_name || "",
          status: "ACTIVE",
          primaryRoleId: defaultRole?.id,
        },
        include: {
          primaryRole: true,
          userRoles: {
            where: { isActive: true },
            include: { role: true },
          },
        },
      });
    }

    // Check permissions for bank account management
    const roles = [
      ...(dbUser.primaryRole ? [dbUser.primaryRole] : []),
      ...dbUser.userRoles.map((ur) => ur.role),
    ];

    const hasPermission = roles.some((role) => {
      if (role.name === "ADMIN") return true;

      try {
        const permissions = Array.isArray(role.permissions)
          ? role.permissions
          : JSON.parse(role.permissions as string);

        return (
          permissions.includes("bank_accounts.manage") || permissions.includes("admin.full_access")
        );
      } catch {
        return false;
      }
    });

    if (!hasPermission) {
      return NextResponse.json({ error: "insufficient_permissions" }, { status: 403 });
    }

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
    // if (validatedQuery.ownerId !== undefined) {
    //   where.ownerId = validatedQuery.ownerId || null;
    // }

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

    return NextResponse.json({
      bankAccounts,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    logger.error("Bank accounts fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bank accounts" }, { status: 500 });
  }
}

// POST /api/bank-accounts - Create new bank account (admin only)
export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user from database with auto-creation
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: kindeUser.id },
      include: {
        primaryRole: true,
        userRoles: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!dbUser) {
      const defaultRole = await prisma.role.findUnique({
        where: { name: "USER" },
      });

      dbUser = await prisma.user.create({
        data: {
          kindeId: kindeUser.id,
          email: kindeUser.email || "",
          name: kindeUser.given_name || kindeUser.family_name || kindeUser.email || "User",
          firstName: kindeUser.given_name || "",
          lastName: kindeUser.family_name || "",
          status: "ACTIVE",
          primaryRoleId: defaultRole?.id,
        },
        include: {
          primaryRole: true,
          userRoles: {
            where: { isActive: true },
            include: { role: true },
          },
        },
      });
    }

    // Check permissions for bank account management
    const roles = [
      ...(dbUser.primaryRole ? [dbUser.primaryRole] : []),
      ...dbUser.userRoles.map((ur) => ur.role),
    ];

    const hasPermission = roles.some((role) => {
      if (role.name === "ADMIN") return true;

      try {
        const permissions = Array.isArray(role.permissions)
          ? role.permissions
          : JSON.parse(role.permissions as string);

        return (
          permissions.includes("bank_accounts.manage") || permissions.includes("admin.full_access")
        );
      } catch {
        return false;
      }
    });

    if (!hasPermission) {
      return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
    }

    const body = await request.json();

    // Validate form data
    const validation = validateBankAccountData(body);
    if (!validation.success) {
      return validation.response!;
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

    return NextResponse.json({
      success: true,
      bankAccount,
      message: "Bank account created successfully",
    });
  } catch (error) {
    logger.error("Bank account creation error:", error);
    return NextResponse.json({ error: "Failed to create bank account" }, { status: 500 });
  }
}
