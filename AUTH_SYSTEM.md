# Authentication System Documentation

This document describes the comprehensive authentication system implemented for
the Next.js 15 application using Kinde authentication.

## Overview

The authentication system provides:

- **Modern SessionProvider** optimized for Next.js 15 with App Router
- **Global authentication state management** with React Context
- **Comprehensive UI components** for authentication flows
- **Route protection** with AuthGuard components
- **Permission-based access control**
- **Loading states and error handling**
- **Automatic session refresh** and synchronization across tabs

## Core Components

### SessionProvider

The main provider component that wraps your application and manages
authentication state.

```tsx
import { SessionProvider } from "@/components/auth";

function App() {
  return (
    <SessionProvider refreshInterval={300000}> // 5 minutes
      {/* Your app content */}
    </SessionProvider>
  );
}
```

**Features:**

- Automatic session fetching and caching
- Optional auto-refresh intervals
- Cross-tab synchronization
- Visibility-based refresh (when tab becomes active)
- Error handling and retry logic

### Authentication Hooks

#### useSession()

Access the complete session data:

```tsx
import { useSession } from "@/components/auth";

function MyComponent() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    permissions,
    organization,
    refresh,
    clearError
  } = useSession();
}
```

#### useAuth()

Simplified authentication hook:

```tsx
import { useAuth } from "@/components/auth";

function MyComponent() {
  const { user, isAuthenticated, isLoading, error } = useAuth();
}
```

#### useAuthorization()

Permission and role-based access control:

```tsx
import { useAuthorization } from "@/components/auth";

function MyComponent() {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
    organization
  } = useAuthorization();

  if (hasPermission("admin:users")) {
    // Show admin content
  }
}
```

## UI Components

### AuthButtons

Smart authentication buttons that show/hide based on auth state:

```tsx
import { AuthButtons } from "@/components/auth";

// Basic usage
<AuthButtons />

// With options
<AuthButtons
  variant="outline"
  size="sm"
  layout="vertical"
  showLogout={true}
/>
```

### UserProfile

Display user information with avatar and logout:

```tsx
import { UserProfile } from "@/components/auth";

<UserProfile
  showAvatar={true}
  showEmail={true}
  variant="default" // or "compact"
/>
```

### AuthStatus

Show detailed authentication status:

```tsx
import { AuthStatus } from "@/components/auth";

<AuthStatus
  showDetails={true}
  showPermissions={true}
  showOrganization={true}
/>
```

### Individual Buttons

For more control over button placement:

```tsx
import { LoginButton, RegisterButton, LogoutButton } from "@/components/auth";

<LoginButton variant="default" size="md" />
<RegisterButton variant="outline" size="sm" />
<LogoutButton variant="ghost" size="lg" />
```

## Route Protection

### AuthGuard Component

Protect components based on authentication and permissions:

```tsx
import { AuthGuard } from "@/components/auth";

// Basic protection
<AuthGuard>
  <ProtectedContent />
</AuthGuard>

// With permissions
<AuthGuard requirePermissions={["admin:users"]}>
  <AdminContent />
</AuthGuard>

// With custom fallback
<AuthGuard
  requirePermissions={["premium:access"]}
  fallback={<UpgradePrompt />}
>
  <PremiumContent />
</AuthGuard>

// With redirect
<AuthGuard redirectTo="/login">
  <ProtectedPage />
</AuthGuard>
```

### withAuthGuard HOC

Higher-order component for page protection:

```tsx
import { withAuthGuard } from "@/components/auth";

const ProtectedPage = withAuthGuard(MyPage, {
  requirePermissions: ["read:data"],
  redirectTo: "/unauthorized"
});
```

### ConditionalAuth Component

Render different content based on auth state:

```tsx
import { ConditionalAuth } from "@/components/auth";

<ConditionalAuth
  loading={<LoadingSpinner />}
  error={<ErrorMessage />}
  unauthenticated={<LoginPrompt />}
  authenticated={<Dashboard />}
/>
```

## API Routes

The system includes these API endpoints:

- `GET /api/auth/me` - Get current user info
- `GET /api/auth/permissions` - Get user permissions
- `GET /api/auth/organization` - Get user organization

## Best Practices

### 1. Use SessionProvider at the Root

Place the SessionProvider as high as possible in your component tree:

```tsx
// app/layout.tsx
import { SessionProvider } from "@/components/auth";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 2. Prefer Hooks Over Direct API Calls

Use the provided hooks instead of making direct API calls:

```tsx
// ✅ Good
const { user, isLoading } = useAuth();

// ❌ Avoid
const [user, setUser] = useState(null);
useEffect(() => {
  fetch('/api/auth/me').then(/* ... */);
}, []);
```

### 3. Handle Loading States

Always handle loading states for better UX:

```tsx
const { user, isLoading, error } = useAuth();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage />;
if (!user) return <LoginPrompt />;

return <UserContent user={user} />;
```

### 4. Use AuthGuard for Route Protection

Instead of manual checks, use AuthGuard:

```tsx
// ✅ Good
<AuthGuard requirePermissions={["admin:access"]}>
  <AdminPanel />
</AuthGuard>

// ❌ Avoid
{hasPermission("admin:access") && <AdminPanel />}
```

### 5. Optimize Re-renders

The SessionProvider is optimized to minimize re-renders, but be mindful of
destructuring:

```tsx
// ✅ Good - only re-renders when user changes
const { user } = useSession();

// ✅ Also good - only re-renders when auth status changes
const { isAuthenticated } = useSession();

// ⚠️ Be careful - re-renders on any session change
const session = useSession();
```

## Error Handling

The system includes comprehensive error handling:

- **Network errors** are caught and displayed
- **Invalid tokens** trigger re-authentication
- **Permission errors** show appropriate messages
- **Loading states** prevent user confusion

## Performance Optimizations

- **Automatic caching** of session data
- **Minimal re-renders** with optimized context
- **Lazy loading** of non-critical data
- **Debounced refreshes** to prevent excessive API calls
- **Cross-tab synchronization** without duplicate requests

## Troubleshooting

### Session Not Loading

1. Check that SessionProvider is wrapping your app
2. Verify Kinde configuration in environment variables
3. Check browser network tab for API errors

### Components Not Updating

1. Ensure you're using the hooks inside SessionProvider
2. Check for JavaScript errors in console
3. Verify API routes are accessible

### Permission Checks Not Working

1. Confirm permissions are set up in Kinde dashboard
2. Check that user has been assigned the required permissions
3. Verify permission names match exactly (case-sensitive)

## Migration Guide

If you're migrating from the old authentication setup:

1. **Replace direct API calls** with hooks
2. **Update component props** to use new interfaces
3. **Add SessionProvider** to your root layout
4. **Update imports** to use the new auth module
5. **Test authentication flows** thoroughly

The new system is backward-compatible with existing Kinde setup and doesn't
require changes to your Kinde configuration.
