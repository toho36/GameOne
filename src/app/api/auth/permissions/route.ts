import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/permissions
 * Returns the current user's permissions
 */
export async function GET() {
    try {
        const { getPermissions, isAuthenticated } = getKindeServerSession();

        const authenticated = await isAuthenticated();
        if (!authenticated) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const permissions = await getPermissions();

        return NextResponse.json({
            permissions: permissions?.permissions ?? [],
            orgCode: permissions?.orgCode ?? null
        });
    } catch (error) {
        console.error("Error fetching user permissions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}