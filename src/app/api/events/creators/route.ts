import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database with roles
    const dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
      include: {
        primaryRole: true,
        userRoles: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has admin or moderator role
    const roleNames = [
      ...(dbUser.primaryRole?.name ? [dbUser.primaryRole.name] : []),
      ...(dbUser.userRoles?.map((ur) => ur.role?.name).filter(Boolean) || []),
    ];
    const isAdmin = roleNames.includes("ADMIN") || roleNames.includes("MODERATOR");

    if (!isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get all unique event creators
    const creators = await prisma.user.findMany({
      where: {
        createdEvents: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    return NextResponse.json({
      creators: creators.map((creator) => ({
        id: creator.id,
        name: creator.name || creator.email || "Unknown User",
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
