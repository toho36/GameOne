import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/auth/organization
 * Returns the current user's organization information
 */
export async function GET() {
  try {
    const { getOrganization, isAuthenticated } = getKindeServerSession();

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organization = await getOrganization();

    return NextResponse.json({
      organization: organization
        ? {
            orgCode: organization.orgCode,
            orgName: organization.orgName ?? "Default Organization",
          }
        : null,
    });
  } catch (error) {
    logger.error("Error fetching user organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
