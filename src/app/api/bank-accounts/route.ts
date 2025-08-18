import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";

// GET /api/bank-accounts - Get all active bank accounts
export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get active bank accounts
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        bankName: true,
        accountNumber: true,
        isDefault: true,
        isActive: true,
        qrCodeEnabled: true,
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(bankAccounts);
  } catch (error) {
    console.error("Bank accounts fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bank accounts" }, { status: 500 });
  }
}

// POST /api/bank-accounts - Create new bank account (admin only)
export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user from database and check admin role
    const dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has admin or event manager role
    const hasPermission = dbUser.userRoles.some((userRole) =>
      ["ADMIN", "EVENT_MANAGER"].includes(userRole.role.name)
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.bankName || !body.accountNumber) {
      return NextResponse.json(
        { error: "Name, bank name, and account number are required" },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await prisma.bankAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create bank account
    const bankAccount = await prisma.bankAccount.create({
      data: {
        name: body.name,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        bankCode: body.bankCode || "",
        iban: body.iban,
        swift: body.swift,
        isDefault: body.isDefault || false,
        isActive: body.isActive !== false,
        qrCodeEnabled: body.qrCodeEnabled !== false,
      },
    });

    return NextResponse.json({
      success: true,
      bankAccount,
      message: "Bank account created successfully",
    });
  } catch (error) {
    console.error("Bank account creation error:", error);
    return NextResponse.json({ error: "Failed to create bank account" }, { status: 500 });
  }
}
