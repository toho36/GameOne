import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

export interface KindeUser {
    id: string;
    email: string | null;
    given_name?: string | null;
    family_name?: string | null;
    picture?: string | null;
}

export interface KindeSession {
    user: KindeUser;
    accessToken: string;
    refreshToken: string;
    isAuthenticated: boolean;
}

/**
 * Get the current user session from Kinde
 */
export async function getCurrentUser(): Promise<KindeUser | null> {
    try {
        const { getUser } = await getKindeServerSession();
        const user = await getUser();
        return user;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

/**
 * Get the full session including tokens
 */
export async function getSession(): Promise<KindeSession | null> {
    try {
        const { getUser } = await getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return null;
        }

        return {
            user,
            accessToken: "", // Access token handling simplified for now
            refreshToken: "", // Kinde doesn't expose refresh token in this way
            isAuthenticated: true
        };
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(): Promise<KindeUser> {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/api/auth/login");
    }

    return user;
}

/**
 * Check if user has specific permissions
 */
export async function hasPermission(permission: string): Promise<boolean> {
    try {
        const { getPermissions } = await getKindeServerSession();
        const permissions = await getPermissions();

        if (!permissions) {
            return false;
        }

        // Check if the permission exists in the permissions object
        return permission in permissions;
    } catch (error) {
        console.error("Error checking permissions:", error);
        return false;
    }
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string): Promise<boolean> {
    try {
        const { getRoles } = await getKindeServerSession();
        const roles = await getRoles();

        if (!roles) {
            return false;
        }

        // Check if the role exists in the roles array
        return roles.some(r => r.name === role);
    } catch (error) {
        console.error("Error checking roles:", error);
        return false;
    }
}

/**
 * Get user permissions
 */
export async function getUserPermissions(): Promise<string[]> {
    try {
        const { getPermissions } = await getKindeServerSession();
        const permissions = await getPermissions();

        if (!permissions) {
            return [];
        }

        // Convert permissions object to array of permission names
        return Object.keys(permissions);
    } catch (error) {
        console.error("Error getting permissions:", error);
        return [];
    }
}

/**
 * Get user roles
 */
export async function getUserRoles(): Promise<string[]> {
    try {
        const { getRoles } = await getKindeServerSession();
        const roles = await getRoles();

        if (!roles) {
            return [];
        }

        // Extract role names from the roles array
        return roles.map(role => role.name);
    } catch (error) {
        console.error("Error getting roles:", error);
        return [];
    }
} 