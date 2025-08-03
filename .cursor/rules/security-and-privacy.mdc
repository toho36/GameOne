---
alwaysApply: true
---

# Security and Privacy Rules

## Overview

This document defines comprehensive security and privacy guidelines for the GameOne event management system. These rules ensure data protection, regulatory compliance (GDPR, PCI DSS), and robust security practices throughout the application.

## Security Principles

### 1. **Defense in Depth**

- Multiple layers of security controls
- Fail-safe defaults (deny by default)
- Principle of least privilege
- Regular security assessments

### 2. **Data Protection by Design**

- Privacy by default
- Data minimization
- Purpose limitation
- Storage limitation

### 3. **Zero Trust Architecture**

- Never trust, always verify
- Verify explicitly
- Use least privilege access
- Assume breach mentality

## Authentication & Authorization

### Authentication Rules

#### Kinde Auth Integration

```typescript
// src/lib/auth/kinde.ts
import { KindeApi } from '@kinde-oss/kinde-typescript-sdk';

export class AuthService {
  private kindeClient: KindeApi;

  constructor() {
    this.kindeClient = new KindeApi({
      domain: process.env.KINDE_ISSUER_URL!,
      clientId: process.env.KINDE_CLIENT_ID!,
      clientSecret: process.env.KINDE_CLIENT_SECRET!,
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
    });
  }

  // Secure token validation
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const decoded = await this.kindeClient.verifyToken(token);

      // Additional custom validation
      if (!this.isValidTokenClaims(decoded)) {
        throw new AuthError('Invalid token claims');
      }

      return {
        valid: true,
        user: await this.getUserFromToken(decoded),
        permissions: decoded.permissions || []
      };
    } catch (error) {
      logger.warn('Token validation failed', { error: error.message });
      return { valid: false, error: error.message };
    }
  }

  private isValidTokenClaims(decoded: any): boolean {
    return (
      decoded.aud === process.env.KINDE_CLIENT_ID &&
      decoded.iss === process.env.KINDE_ISSUER_URL &&
      decoded.exp > Date.now() / 1000 &&
      decoded.sub &&
      decoded.email
    );
  }
}
```

#### Session Management

```typescript
// src/lib/auth/session.ts
import { cookies } from 'next/headers';
import { JWTPayload, SignJWT, jwtVerify } from 'jose';

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_THRESHOLD = 4 * 60 * 60 * 1000; // 4 hours

export class SessionManager {
  private static readonly SECRET = new TextEncoder().encode(
    process.env.SESSION_SECRET!
  );

  static async createSession(user: User): Promise<string> {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + SESSION_TIMEOUT) / 1000)
    };

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(this.SECRET);
  }

  static async validateSession(token: string): Promise<SessionValidationResult> {
    try {
      const { payload } = await jwtVerify(token, this.SECRET);

      // Check if session needs refresh
      const needsRefresh = this.needsRefresh(payload);

      return {
        valid: true,
        payload,
        needsRefresh,
        user: await this.getUserFromPayload(payload)
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  static needsRefresh(payload: JWTPayload): boolean {
    const expiresAt = payload.exp! * 1000;
    return (expiresAt - Date.now()) < REFRESH_THRESHOLD;
  }

  static setSecureCookie(token: string): void {
    cookies().set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_TIMEOUT / 1000,
      path: '/'
    });
  }

  static clearSession(): void {
    cookies().delete('session');
  }
}
```

### Authorization Patterns

#### Role-Based Access Control (RBAC)

```typescript
// src/lib/auth/permissions.ts
export enum Permission {
  // Event permissions
  EVENT_CREATE = 'event:create',
  EVENT_READ = 'event:read',
  EVENT_UPDATE = 'event:update',
  EVENT_DELETE = 'event:delete',
  EVENT_PUBLISH = 'event:publish',

  // Registration permissions
  REGISTRATION_CREATE = 'registration:create',
  REGISTRATION_READ = 'registration:read',
  REGISTRATION_UPDATE = 'registration:update',
  REGISTRATION_DELETE = 'registration:delete',
  REGISTRATION_APPROVE = 'registration:approve',

  // User permissions
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_IMPERSONATE = 'user:impersonate',

  // Admin permissions
  ADMIN_FULL_ACCESS = 'admin:*',
  SYSTEM_CONFIG = 'system:config',
  AUDIT_LOGS = 'audit:logs'
}

export class PermissionChecker {
  static hasPermission(
    userPermissions: string[],
    requiredPermission: Permission
  ): boolean {
    // Check for wildcard admin permission
    if (userPermissions.includes(Permission.ADMIN_FULL_ACCESS)) {
      return true;
    }

    // Check specific permission
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check wildcard permissions
    const [resource, action] = requiredPermission.split(':');
    const wildcardPermission = `${resource}:*`;

    return userPermissions.includes(wildcardPermission);
  }

  static hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: Permission[]
  ): boolean {
    return requiredPermissions.some(permission =>
      this.hasPermission(userPermissions, permission)
    );
  }

  static hasAllPermissions(
    userPermissions: string[],
    requiredPermissions: Permission[]
  ): boolean {
    return requiredPermissions.every(permission =>
      this.hasPermission(userPermissions, permission)
    );
  }

  // Resource-specific permission checks
  static canAccessEvent(
    user: User,
    event: Event,
    action: 'read' | 'update' | 'delete'
  ): boolean {
    // Public events are readable by all
    if (action === 'read' && !event.isPrivate) {
      return true;
    }

    // Owner can do everything
    if (event.createdById === user.id) {
      return true;
    }

    // Check role-based permissions
    const permissionMap = {
      read: Permission.EVENT_READ,
      update: Permission.EVENT_UPDATE,
      delete: Permission.EVENT_DELETE
    };

    return this.hasPermission(user.permissions, permissionMap[action]);
  }

  static canAccessUserData(
    currentUser: User,
    targetUserId: string,
    action: 'read' | 'update' | 'delete'
  ): boolean {
    // Users can access their own data
    if (currentUser.id === targetUserId) {
      return action !== 'delete'; // Users can't delete themselves
    }

    // Check admin permissions
    const permissionMap = {
      read: Permission.USER_READ,
      update: Permission.USER_UPDATE,
      delete: Permission.USER_DELETE
    };

    return this.hasPermission(currentUser.permissions, permissionMap[action]);
  }
}
```

#### API Route Protection

```typescript
// src/lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export interface RouteProtectionConfig {
  permissions?: Permission[];
  roles?: string[];
  requiresAuth?: boolean;
  allowSelf?: boolean;
  customCheck?: (user: User, request: NextRequest) => boolean;
}

export function withAuth(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  config: RouteProtectionConfig = {}
) {
  return async (request: NextRequest, context: any) => {
    try {
      // Extract and validate token
      const token = extractToken(request);
      if (!token && config.requiresAuth !== false) {
        return createUnauthorizedResponse();
      }

      let user: User | null = null;
      if (token) {
        const sessionResult = await SessionManager.validateSession(token);
        if (!sessionResult.valid) {
          return createUnauthorizedResponse();
        }
        user = sessionResult.user;
      }

      // Check authentication requirement
      if (config.requiresAuth && !user) {
        return createUnauthorizedResponse();
      }

      // Check permissions
      if (config.permissions && user) {
        const hasPermission = config.permissions.some(permission =>
          PermissionChecker.hasPermission(user.permissions, permission)
        );
        if (!hasPermission) {
          return createForbiddenResponse();
        }
      }

      // Check roles
      if (config.roles && user) {
        const hasRole = config.roles.some(role =>
          user.roles.includes(role)
        );
        if (!hasRole) {
          return createForbiddenResponse();
        }
      }

      // Self-access check
      if (config.allowSelf && user) {
        const resourceId = context.params?.id;
        if (resourceId === user.id) {
          // Allow self-access
        } else if (config.permissions || config.roles) {
          // Still need proper permissions for non-self access
        }
      }

      // Custom authorization check
      if (config.customCheck && user) {
        if (!config.customCheck(user, request)) {
          return createForbiddenResponse();
        }
      }

      // Add user to request context
      (request as any).user = user;

      return handler(request, context);
    } catch (error) {
      logger.error('Auth middleware error', { error: error.message });
      return createErrorResponse('INTERNAL_ERROR', 'Authentication failed', 500);
    }
  };
}

// Usage examples
export const GET = withAuth(async (request) => {
  // Handler implementation
}, {
  requiresAuth: true,
  permissions: [Permission.EVENT_READ]
});

export const DELETE = withAuth(async (request, { params }) => {
  // Handler implementation
}, {
  requiresAuth: true,
  permissions: [Permission.EVENT_DELETE],
  customCheck: async (user, request) => {
    const event = await prisma.event.findUnique({
      where: { id: params.id }
    });
    return event?.createdById === user.id;
  }
});
```

## Data Protection & Privacy

### GDPR Compliance

#### Data Processing Principles

```typescript
// src/lib/privacy/gdpr.ts
export enum DataProcessingPurpose {
  REGISTRATION = 'registration',
  COMMUNICATION = 'communication',
  PAYMENT = 'payment',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing'
}

export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

export interface DataProcessingRecord {
  userId: string;
  purpose: DataProcessingPurpose;
  legalBasis: LegalBasis;
  dataTypes: string[];
  processingStartDate: Date;
  retentionPeriod: number; // in days
  consentGiven?: boolean;
  consentDate?: Date;
  consentWithdrawn?: boolean;
  consentWithdrawalDate?: Date;
}

export class GDPRComplianceService {
  // Data mapping and inventory
  static getPersonalDataFields(): Record<string, string[]> {
    return {
      user: ['email', 'name', 'phone', 'picture', 'givenName', 'familyName'],
      profile: ['bio', 'website', 'socialLinks', 'emergencyContact', 'address'],
      registration: ['specialRequirements', 'dietaryRestrictions'],
      payment: ['billingAddress', 'paymentMethod']
    };
  }

  // Consent management
  static async recordConsent(
    userId: string,
    purpose: DataProcessingPurpose,
    consentGiven: boolean
  ): Promise<void> {
    await prisma.dataProcessingRecord.upsert({
      where: {
        userId_purpose: { userId, purpose }
      },
      update: {
        consentGiven,
        consentDate: consentGiven ? new Date() : undefined,
        consentWithdrawn: !consentGiven,
        consentWithdrawalDate: !consentGiven ? new Date() : undefined
      },
      create: {
        userId,
        purpose,
        legalBasis: LegalBasis.CONSENT,
        dataTypes: this.getDataTypesForPurpose(purpose),
        processingStartDate: new Date(),
        retentionPeriod: this.getRetentionPeriod(purpose),
        consentGiven,
        consentDate: consentGiven ? new Date() : undefined
      }
    });
  }

  // Data subject rights
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const [user, profile, registrations, payments, activities] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.profile.findUnique({ where: { userId } }),
      prisma.registration.findMany({ where: { userId } }),
      prisma.payment.findMany({ where: { userId } }),
      prisma.auditLog.findMany({ where: { userId } })
    ]);

    return {
      exportDate: new Date(),
      user: this.sanitizeUserData(user),
      profile: this.sanitizeProfileData(profile),
      registrations: registrations.map(this.sanitizeRegistrationData),
      payments: payments.map(this.sanitizePaymentData),
      activities: activities.map(this.sanitizeActivityData)
    };
  }

  static async deleteUserData(
    userId: string,
    retainForLegal: boolean = false
  ): Promise<DeletionResult> {
    const deletionRecord = await prisma.dataDeletion.create({
      data: {
        userId,
        requestDate: new Date(),
        status: 'PROCESSING',
        retainForLegal
      }
    });

    try {
      if (retainForLegal) {
        // Anonymize instead of delete
        await this.anonymizeUserData(userId);
      } else {
        // Complete deletion
        await this.completeDataDeletion(userId);
      }

      await prisma.dataDeletion.update({
        where: { id: deletionRecord.id },
        data: {
          status: 'COMPLETED',
          completedDate: new Date()
        }
      });

      return { success: true, deletionId: deletionRecord.id };
    } catch (error) {
      await prisma.dataDeletion.update({
        where: { id: deletionRecord.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });

      throw error;
    }
  }

  private static async anonymizeUserData(userId: string): Promise<void> {
    const anonymizedEmail = `deleted-${userId}@anonymized.local`;
    const anonymizedName = 'Deleted User';

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        name: anonymizedName,
        givenName: null,
        familyName: null,
        phone: null,
        picture: null,
        isVerified: false,
        locale: null,
        timezone: null
      }
    });

    // Anonymize related data
    await prisma.profile.updateMany({
      where: { userId },
      data: {
        bio: null,
        website: null,
        socialLinks: {},
        emergencyContact: {},
        address: {}
      }
    });
  }

  // Data retention
  static async cleanupExpiredData(): Promise<CleanupResult> {
    const retentionPolicies = await this.getRetentionPolicies();
    const cleanupResults = [];

    for (const policy of retentionPolicies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      const result = await this.deleteExpiredData(policy.dataType, cutoffDate);
      cleanupResults.push(result);
    }

    return {
      totalCleaned: cleanupResults.reduce((sum, r) => sum + r.count, 0),
      details: cleanupResults
    };
  }
}
```

### Data Encryption

#### Field-Level Encryption

```typescript
// src/lib/security/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export class FieldEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  private static getKey(purpose: string): Buffer {
    const secret = process.env.ENCRYPTION_SECRET!;
    return scryptSync(secret + purpose, 'salt', this.KEY_LENGTH);
  }

  static encrypt(plaintext: string, purpose: string = 'default'): string {
    try {
      const key = this.getKey(purpose);
      const iv = randomBytes(this.IV_LENGTH);
      const cipher = createCipheriv(this.ALGORITHM, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combine iv, tag, and encrypted data
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Encryption failed', { purpose, error: error.message });
      throw new SecurityError('Encryption failed');
    }
  }

  static decrypt(encryptedData: string, purpose: string = 'default'): string {
    try {
      const [ivHex, tagHex, encrypted] = encryptedData.split(':');

      if (!ivHex || !tagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      const key = this.getKey(purpose);
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { purpose, error: error.message });
      throw new SecurityError('Decryption failed');
    }
  }

  // Prisma custom types for automatic encryption/decryption
  static createEncryptedField(purpose: string) {
    return {
      get: (value: string | null) => {
        return value ? this.decrypt(value, purpose) : value;
      },
      set: (value: string | null) => {
        return value ? this.encrypt(value, purpose) : value;
      }
    };
  }
}

// Usage in Prisma schema
export const encryptedPhone = FieldEncryption.createEncryptedField('phone');
export const encryptedAddress = FieldEncryption.createEncryptedField('address');
```

## Input Validation & Sanitization

### Request Validation

```typescript
// src/lib/security/validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export class SecurityValidator {
  // SQL Injection prevention
  static sanitizeInput(input: string): string {
    return input
      .replace(/[';\\x00\\n\\r\\x08\\x09\\x1a]/g, '') // Remove dangerous chars
      .trim()
      .slice(0, 10000); // Limit length
  }

  // XSS prevention
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: []
    });
  }

  // File upload validation
  static validateFile(file: File): FileValidationResult {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'text/plain'
    ];

    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'File too large' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check file signature
    if (!this.validateFileSignature(file)) {
      return { valid: false, error: 'Invalid file signature' };
    }

    return { valid: true };
  }

  private static async validateFileSignature(file: File): Promise<boolean> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check magic numbers for common file types
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'application/pdf': [0x25, 0x50, 0x44, 0x46]
    };

    const signature = signatures[file.type as keyof typeof signatures];
    if (!signature) return false;

    return signature.every((byte, index) => bytes[index] === byte);
  }

  // Rate limiting validation
  static createRateLimitValidator(
    windowMs: number,
    maxRequests: number
  ) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get existing requests for this identifier
      const userRequests = requests.get(identifier) || [];

      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => time > windowStart);

      // Check if under limit
      if (validRequests.length >= maxRequests) {
        return false;
      }

      // Add current request
      validRequests.push(now);
      requests.set(identifier, validRequests);

      return true;
    };
  }
}

// Schema validation with security checks
export const secureEventSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title too long')
    .transform(SecurityValidator.sanitizeInput),

  description: z.string()
    .min(1, 'Description is required')
    .max(5000, 'Description too long')
    .transform(SecurityValidator.sanitizeHtml),

  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(100000, 'Price too high'),

  maxParticipants: z.number()
    .min(1, 'Must allow at least 1 participant')
    .max(10000, 'Too many participants')
    .optional()
});
```

## PCI DSS Compliance (Payment Security)

### Payment Data Protection

```typescript
// src/lib/payments/security.ts
export class PaymentSecurity {
  // Never store sensitive payment data
  static readonly PROHIBITED_FIELDS = [
    'cardNumber',
    'cvv',
    'expiryDate',
    'cardHolderName'
  ];

  // Tokenize payment methods
  static async tokenizePaymentMethod(
    paymentData: PaymentMethodData
  ): Promise<PaymentToken> {
    // Use payment processor's tokenization
    const token = await paymentProcessor.tokenize({
      type: paymentData.type,
      // Only send allowed fields to processor
      ...this.sanitizePaymentData(paymentData)
    });

    // Store only the token and minimal metadata
    return {
      token: token.id,
      last4: paymentData.cardNumber?.slice(-4),
      brand: token.brand,
      expiryMonth: token.expiryMonth,
      expiryYear: token.expiryYear,
      fingerprint: token.fingerprint
    };
  }

  static sanitizePaymentData(data: any): any {
    const sanitized = { ...data };

    // Remove prohibited fields
    this.PROHIBITED_FIELDS.forEach(field => {
      delete sanitized[field];
    });

    return sanitized;
  }

  // Secure payment processing
  static async processPayment(
    paymentToken: string,
    amount: number,
    currency: string,
    metadata: PaymentMetadata
  ): Promise<PaymentResult> {
    try {
      // Log payment attempt
      logger.info('Payment processing started', {
        amount,
        currency,
        eventId: metadata.eventId,
        userId: metadata.userId
      });

      const result = await paymentProcessor.charge({
        paymentMethod: paymentToken,
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        description: `Event registration: ${metadata.eventTitle}`,
        metadata: {
          eventId: metadata.eventId,
          userId: metadata.userId,
          registrationId: metadata.registrationId
        }
      });

      // Create audit trail
      await this.createPaymentAudit({
        action: 'PAYMENT_PROCESSED',
        paymentIntentId: result.id,
        amount,
        currency,
        status: result.status,
        metadata
      });

      return {
        success: true,
        paymentIntentId: result.id,
        status: result.status
      };

    } catch (error) {
      logger.error('Payment processing failed', {
        amount,
        currency,
        error: error.message,
        metadata
      });

      await this.createPaymentAudit({
        action: 'PAYMENT_FAILED',
        amount,
        currency,
        error: error.message,
        metadata
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  private static async createPaymentAudit(data: PaymentAuditData): Promise<void> {
    await prisma.paymentAudit.create({
      data: {
        ...data,
        timestamp: new Date(),
        ipAddress: data.metadata.ipAddress,
        userAgent: data.metadata.userAgent
      }
    });
  }
}
```

## Security Headers & CSP

### Security Headers Configuration

```typescript
// src/lib/security/headers.ts
export function getSecurityHeaders(): Record<string, string> {
  return {
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',

    // Content Type Options
    'X-Content-Type-Options': 'nosniff',

    // Frame Options
    'X-Frame-Options': 'DENY',

    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)',
      'usb=()',
      'bluetooth=()'
    ].join(', '),

    // Strict Transport Security
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Content Security Policy
    'Content-Security-Policy': getCSPDirectives()
  };
}

function getCSPDirectives(): string {
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // For Next.js inline scripts
      'https://cdn.kinde.com',
      'https://js.stripe.com',
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // For Tailwind CSS
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      '*.vercel-storage.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https://api.kinde.com',
      'https://api.stripe.com',
      'wss:',
      process.env.NODE_ENV === 'development' ? 'http://localhost:*' : ''
    ].filter(Boolean),
    'frame-src': [
      'https://js.stripe.com',
      'https://hooks.stripe.com'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': []
  };

  return Object.entries(directives)
    .map(([directive, sources]) =>
      sources.length > 0
        ? `${directive} ${sources.join(' ')}`
        : directive
    )
    .join('; ');
}
```

## Security Monitoring & Incident Response

### Security Event Logging

```typescript
// src/lib/security/monitoring.ts
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHORIZATION_FAILURE = 'authz_failure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_ACCESS = 'data_access',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_INPUT = 'invalid_input',
  FILE_UPLOAD_VIOLATION = 'file_upload_violation'
}

export class SecurityMonitor {
  static async logSecurityEvent(
    eventType: SecurityEventType,
    details: SecurityEventDetails
  ): Promise<void> {
    const event = {
      type: eventType,
      timestamp: new Date(),
      severity: this.getSeverity(eventType),
      userId: details.userId,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      resource: details.resource,
      action: details.action,
      details: details.additionalData,
      riskScore: this.calculateRiskScore(eventType, details)
    };

    // Log to database
    await prisma.securityEvent.create({ data: event });

    // High-severity events trigger immediate alerts
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      await this.triggerSecurityAlert(event);
    }

    // Update user risk profile
    await this.updateUserRiskProfile(details.userId, event.riskScore);
  }

  private static getSeverity(eventType: SecurityEventType): string {
    const severityMap = {
      [SecurityEventType.AUTHENTICATION_FAILURE]: 'MEDIUM',
      [SecurityEventType.AUTHORIZATION_FAILURE]: 'HIGH',
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: 'HIGH',
      [SecurityEventType.DATA_ACCESS]: 'LOW',
      [SecurityEventType.PRIVILEGE_ESCALATION]: 'CRITICAL',
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 'MEDIUM',
      [SecurityEventType.INVALID_INPUT]: 'LOW',
      [SecurityEventType.FILE_UPLOAD_VIOLATION]: 'MEDIUM'
    };

    return severityMap[eventType] || 'LOW';
  }

  private static calculateRiskScore(
    eventType: SecurityEventType,
    details: SecurityEventDetails
  ): number {
    let score = 0;

    // Base score by event type
    const baseScores = {
      [SecurityEventType.AUTHENTICATION_FAILURE]: 20,
      [SecurityEventType.AUTHORIZATION_FAILURE]: 50,
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: 60,
      [SecurityEventType.PRIVILEGE_ESCALATION]: 90,
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 30
    };

    score += baseScores[eventType] || 10;

    // Additional risk factors
    if (details.ipAddress && this.isFromSuspiciousLocation(details.ipAddress)) {
      score += 20;
    }

    if (details.timeOfDay && this.isUnusualTime(details.timeOfDay)) {
      score += 15;
    }

    if (details.deviceFingerprint && this.isNewDevice(details.deviceFingerprint)) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  static async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    const alert = {
      eventId: event.id,
      type: 'SECURITY_INCIDENT',
      severity: event.severity,
      message: this.generateAlertMessage(event),
      createdAt: new Date()
    };

    // Send to security team
    await notificationService.sendSecurityAlert(alert);

    // Auto-block if necessary
    if (event.severity === 'CRITICAL') {
      await this.autoBlockUser(event.userId, event.ipAddress);
    }
  }

  private static async autoBlockUser(
    userId: string,
    ipAddress: string
  ): Promise<void> {
    // Temporarily block user account
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspensionReason: 'Automatic security block'
      }
    });

    // Block IP address
    await prisma.blockedIp.create({
      data: {
        ipAddress,
        reason: 'Security incident',
        blockedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    logger.warn('User and IP blocked due to security incident', {
      userId,
      ipAddress
    });
  }
}
```

This comprehensive security and privacy framework ensures that the GameOne event registration system maintains the highest standards of data protection and security compliance.
