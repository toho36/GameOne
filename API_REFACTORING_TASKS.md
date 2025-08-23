# API Structure Refactoring Tasks

## 🚨 **CRITICAL VIOLATIONS FOUND**

- **send-email/route.ts**: 466 lines (55% over 300-line limit)
- **Business logic mixed with route handlers**
- **Code duplication**: `createUserWithDefaults` in 8+ files

## 📋 **Refactoring Task List**

### **Priority 1: CRITICAL - Fix File Size Violations**

1. ⏳ **Refactor send-email/route.ts (466 → <300 lines)**
   - Extract email handlers to `/src/lib/api/email/handlers/`
   - Move rate limiter to separate file
   - Create email service layer
   - Split validation schemas

2. ⏳ **Refactor bank-accounts/route.ts (272 → <200 lines)**
   - Extract business logic to service layer
   - Move validation to separate file
   - Create data access layer

3. ⏳ **Refactor events/route.ts (254 → <200 lines)**
   - Extract event business logic
   - Create event service layer
   - Separate validation logic

4. ⏳ **Refactor events/[id]/route.ts (251 → <200 lines)**
   - Extract individual event operations
   - Create event data access layer

### **Priority 2: HIGH - Eliminate Code Duplication**

5. ⏳ **Create shared authentication utilities**
   - Extract `createUserWithDefaults` to `/src/lib/api/common/auth.ts`
   - Centralize permission checking logic
   - Create reusable auth middleware

6. ⏳ **Standardize error handling**
   - Create `/src/lib/api/common/error-handling.ts`
   - Standardize error response formats
   - Implement consistent logging patterns

7. ⏳ **Create common response helpers**
   - Extract response formatting logic
   - Create standard success/error responses
   - Add pagination utilities

### **Priority 3: MEDIUM - Improve Architecture**

8. ⏳ **Create user service layer**
   - Move user business logic to `/src/lib/services/user.service.ts`
   - Create user data access layer
   - Extract user validation

9. ⏳ **Create event service layer**
   - Move event business logic to `/src/lib/services/event.service.ts`
   - Create event data access layer
   - Extract event validation

10. ⏳ **Create bank-account service layer**
    - Move bank account logic to service layer
    - Enhance existing validation/operations files
    - Create data access abstraction

11. ⏳ **Create email service layer**
    - Move email logic to `/src/lib/services/email.service.ts`
    - Create email template handlers
    - Add email rate limiting service

### **Priority 4: LOW - Polish and Type Safety**

12. ⏳ **Add comprehensive TypeScript types**
    - Create API types for each domain
    - Add request/response type definitions
    - Improve type inference

13. ⏳ **Create request handling middleware**
    - Add proper logging and monitoring
    - Implement request/response middleware
    - Add performance metrics

14. ⏳ **Optimize route handlers**
    - Make all route files thin handlers (<50 lines)
    - Implement consistent patterns
    - Add proper error boundaries

## 🏗️ **Recommended Structure**

```
src/
├── app/api/                    # Thin route handlers only
│   ├── auth/
│   ├── bank-accounts/
│   ├── events/
│   ├── users/
│   └── email/
├── lib/
│   ├── api/                    # API-specific utilities
│   │   ├── auth/
│   │   ├── users/
│   │   ├── events/
│   │   ├── bank-accounts/
│   │   ├── email/
│   │   └── common/            # Shared utilities
│   │       ├── auth.ts
│   │       ├── error-handling.ts
│   │       ├── response-helpers.ts
│   │       └── pagination.ts
│   └── services/              # Business logic layer
│       ├── user.service.ts
│       ├── event.service.ts
│       ├── bank-account.service.ts
│       └── email.service.ts
```

## 🎯 **Implementation Pattern**

### **Thin Route Handler (Target: <50 lines)**

```typescript
// src/app/api/users/route.ts
import { userService } from "@/lib/services/user.service";
import { handleApiRequest } from "@/lib/api/common/request-handler";

export async function GET(request: NextRequest) {
  return handleApiRequest(request, async (authResult) => {
    return await userService.getUsers(request, authResult);
  });
}
```

### **Service Layer**

```typescript
// src/lib/services/user.service.ts
import { userDataAccess } from "@/lib/api/users/data-access";
import { validateUserData } from "@/lib/api/users/validation";
import { requirePermissions } from "@/lib/api/common/auth";

class UserService {
  async getUsers(request: NextRequest, authResult: AuthResult) {
    await requirePermissions(["users.manage"]);
    return userDataAccess.getUsers(queryParams);
  }
}
```

## 📊 **Benefits**

- ✅ **Compliance**: All files under 300-line limit
- ✅ **Maintainability**: Small, focused files
- ✅ **Testability**: Separated business logic
- ✅ **Reusability**: Shared utilities eliminate duplication
- ✅ **Type Safety**: Proper TypeScript integration
- ✅ **Performance**: Optimized imports and lazy loading

## 🚀 **Implementation Order**

1. **Start with send-email/route.ts** (most critical violation)
2. **Extract createUserWithDefaults** (affects 8+ files)
3. **Create common utilities** (auth, error handling)
4. **Refactor remaining large files** one by one
5. **Add service layers** progressively
6. **Polish with types and middleware**

---

**Estimated Timeline**: 3-4 days **Impact**: High - Will significantly improve
maintainability and compliance
