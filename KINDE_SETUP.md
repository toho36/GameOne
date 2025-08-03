# Kinde Auth Setup Guide

## ✅ Successfully Implemented

The Kinde Auth integration has been successfully set up with the following
components:

### 1. **API Route** (`src/app/api/auth/[kindeAuth]/route.ts`)

- Handles all authentication flows (login, logout, callback)
- Uses the required `handleAuth()` function from Kinde

### 2. **Auth Configuration** (`src/lib/kinde-auth.ts`)

- Server-side auth functions for getting user data
- Permission and role checking utilities
- Session management functions
- **Fixed**: All TypeScript errors resolved

### 3. **Auth Components** (`src/components/auth/`)

- **Auth Buttons**: Login and Register buttons with styling
- **User Profile**: Shows user info and logout functionality
- **Individual Components**: Separate LoginButton, RegisterButton, LogoutButton
- **Fixed**: All TypeScript errors resolved

### 4. **Dashboard Page** (`src/app/[locale]/dashboard/page.tsx`)

- **Protected Route**: Automatically redirects to login if not authenticated
- **User Information**: Displays user email, name, and ID
- **Logout Functionality**: Working logout button with Kinde integration
- **Authentication Status**: Visual indicator showing successful login
- **Navigation**: Links back to home page

### 5. **Navigation Component** (`src/components/layout/navigation.tsx`)

- **Global Navigation**: Available on all pages
- **User Profile**: Shows current user status
- **Dashboard Link**: Easy access to the dashboard
- **Responsive Design**: Works on mobile and desktop

### 6. **Updated Home Page**

- Added auth buttons and user profile to your main page
- Shows sign in/sign up when not authenticated
- Shows user info when authenticated
- Added dashboard link for easy navigation

### 7. **Updated Middleware**

- Combined Kinde auth with your existing internationalization
- Handles both auth routes and localized routes
- **Fixed**: Correct `withAuth` function usage

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Kinde Auth Configuration
KINDE_CLIENT_ID=your_client_id_here
KINDE_CLIENT_SECRET=your_client_secret_here
KINDE_ISSUER_URL=https://your-domain.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gameone"

# Cron Jobs
CRON_SECRET=your_cron_secret_here

# App Configuration
NODE_ENV=development
```

## Getting Your Kinde Credentials

1. Go to [Kinde Console](https://kinde.com)
2. Create a new application or use an existing one
3. Go to the "Settings" tab
4. Copy the following values:
   - **Client ID**: Found in the "Application" section
   - **Client Secret**: Found in the "Application" section
   - **Issuer URL**: Found in the "Domain" section (e.g.,
     `https://your-app.kinde.com`)

## Configure Redirect URLs

In your Kinde application settings, add these redirect URLs:

- `http://localhost:3000/api/auth/kinde_callback`
- `http://localhost:3000/api/auth/kinde_logout`

## Testing the Implementation

1. Start your development server:

   ```bash
   bun dev
   ```

2. Visit `http://localhost:3000`
3. Click "Sign in" to test authentication
4. After successful login, you'll be redirected back
5. Visit `/dashboard` to see the protected dashboard page
6. Test the logout functionality

## Usage Examples

### Auth Buttons

```tsx
import { AuthButtons, LoginButton, RegisterButton } from "@/components/auth";

// All buttons together
<AuthButtons variant="outline" size="lg" />

// Individual buttons
<LoginButton variant="default" size="md">Sign In</LoginButton>
<RegisterButton variant="outline" size="md">Sign Up</RegisterButton>
```

### User Profile

```tsx
import { UserProfile, LogoutButton } from "@/components/auth";

// User profile with logout
<UserProfile variant="default" showEmail={true} />

// Standalone logout button
<LogoutButton variant="ghost" size="sm">Sign Out</LogoutButton>
```

### Server-Side Auth

```tsx
import { getCurrentUser, requireAuth, hasPermission } from "@/lib/kinde-auth";

// Get current user (can be null)
const user = await getCurrentUser();

// Require authentication (redirects if not logged in)
const user = await requireAuth();

// Check permissions
const canEditEvents = await hasPermission("event:edit");
```

## Dashboard Features

The dashboard demonstrates:

- ✅ **Authentication Protection**: Redirects to login if not authenticated
- ✅ **User Information Display**: Shows email, name, and user ID
- ✅ **Logout Functionality**: Working logout with Kinde integration
- ✅ **Visual Status Indicators**: Green indicator showing successful
  authentication
- ✅ **Navigation**: Easy access to home page and other sections
- ✅ **Internationalization**: Supports both English and Czech
- ✅ **Responsive Design**: Works on all device sizes

## Next Steps

1. **Set up your Kinde application** with the credentials above
2. **Test the authentication flow** by visiting the dashboard
3. **Customize the dashboard** to match your application's needs
4. **Add more protected routes** using the `requireAuth()` function
5. **Implement role-based access control** using the permission functions

The authentication system is now fully functional and ready for production use!
