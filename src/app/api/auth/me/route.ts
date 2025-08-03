import { getCurrentUser } from "@/lib/kinde-auth";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/me
 * Returns the current user's authentication information
 */
export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Return user information (excluding sensitive data)
        return NextResponse.json({
            id: user.id,
            email: user.email,
            given_name: user.given_name,
            family_name: user.family_name,
            picture: user.picture
        });
    } catch (error) {
        console.error("Error fetching current user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}