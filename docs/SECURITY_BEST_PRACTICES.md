# Security Best Practices

Panduan keamanan untuk Performa Dashboard RBAC System.

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Authorization](#authorization)
3. [Data Protection](#data-protection)
4. [Input Validation](#input-validation)
5. [API Security](#api-security)
6. [Database Security](#database-security)
7. [Session Management](#session-management)
8. [Audit & Logging](#audit--logging)
9. [Security Checklist](#security-checklist)

---

## 🔐 Authentication

### Password Security

#### ✅ DO:
- Use bcrypt for password hashing
- Set minimum password length (6+ characters)
- Hash passwords with salt (bcrypt does this automatically)
- Store only hashed passwords, never plaintext
- Use strong hashing rounds (10 is default, good for most cases)

```typescript
// ✅ GOOD: Proper password hashing
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 10);
```

#### ❌ DON'T:
- Store passwords in plaintext
- Use weak hashing algorithms (MD5, SHA1)
- Log passwords (even hashed)
- Send passwords in URLs
- Return passwords in API responses

```typescript
// ❌ BAD: Never do this
const user = {
  email: 'user@example.com',
  password: 'plaintextpassword' // NEVER!
};
```

### Password Requirements (Implementation)

Add password strength validation:

```typescript
// lib/validation.ts
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number'
    };
  }

  return { valid: true };
}
```

### JWT Token Security

#### ✅ DO:
- Use strong, random JWT secrets (min 32 characters)
- Set appropriate token expiration
- Store tokens in HTTP-only cookies
- Rotate secrets periodically
- Validate tokens on every request

```typescript
// ✅ GOOD: Secure JWT configuration
const token = jwt.sign(payload, process.env.JWT_SECRET!, {
  expiresIn: '7d',
  algorithm: 'HS256'
});

// Set HTTP-only cookie
response.cookies.set('auth-token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 7 // 7 days
});
```

#### ❌ DON'T:
- Use weak secrets (short, predictable)
- Store tokens in localStorage (XSS vulnerability)
- Set very long expiration times
- Expose secrets in code or logs

```typescript
// ❌ BAD: Insecure JWT usage
const token = jwt.sign(payload, 'secret123'); // Weak secret!
localStorage.setItem('token', token); // XSS vulnerability!
```

### Multi-Factor Authentication (Future)

Consider implementing:
- TOTP (Time-based One-Time Password)
- SMS verification
- Email verification
- Authenticator apps (Google Authenticator, Authy)

---

## 🔒 Authorization

### Permission Checking

#### ✅ DO:
- Check permissions at multiple layers (middleware, API, UI)
- Use server-side permission validation
- Verify permissions on every request
- Use granular permissions
- Log authorization failures

```typescript
// ✅ GOOD: Multi-layer protection

// 1. Page level (Server Component)
<PermissionGate permission="manage_users">
  <UsersPage />
</PermissionGate>

// 2. API level
export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request);
  await requirePermission(userId, 'manage_users');
  // ... proceed
}

// 3. UI level (Client Component)
'use client';
const { hasPermission } = usePermissions();
{hasPermission('delete_user') && <DeleteButton />}
```

#### ❌ DON'T:
- Rely only on client-side checks
- Trust user-supplied permission data
- Skip permission checks for "trusted" users
- Hard-code permissions in UI

```typescript
// ❌ BAD: Client-only check
'use client';
if (user.isAdmin) { // Easy to manipulate!
  return <AdminPanel />;
}
```

### Role-Based Access

#### ✅ DO:
- Use roles for grouping permissions
- Support multiple roles per user
- Make roles configurable
- Protect system roles from deletion
- Audit role changes

#### ❌ DON'T:
- Hard-code role checks in business logic
- Allow role escalation
- Trust client-side role data

---

## 🛡️ Data Protection

### Sensitive Data

#### ✅ DO:
- Encrypt sensitive data at rest
- Use HTTPS for all traffic
- Mask sensitive data in logs
- Implement data retention policies
- Use parameterized queries (Prisma does this)

```typescript
// ✅ GOOD: Sanitized audit log
await createAuditLog({
  userId: payload.userId,
  action: 'UPDATE_USER',
  entity: 'User',
  entityId: userId,
  oldValue: {
    email: oldUser.email,
    name: oldUser.name,
    // password NOT included!
  },
  newValue: {
    email: newUser.email,
    name: newUser.name,
    // password NOT included!
  }
});
```

#### ❌ DON'T:
- Log sensitive data (passwords, tokens, credit cards)
- Return sensitive data in API responses
- Store unnecessary sensitive data
- Use plaintext protocols (HTTP, FTP)

```typescript
// ❌ BAD: Logging sensitive data
console.log('User password:', user.password); // NEVER!
console.log('JWT token:', token); // NEVER!
```

### Personal Data (GDPR Compliance)

#### ✅ DO:
- Collect only necessary data
- Provide data export functionality
- Implement data deletion (right to be forgotten)
- Get user consent for data collection
- Document data usage in privacy policy

---

## ✅ Input Validation

### Server-Side Validation

#### ✅ DO:
- Validate all user input
- Use whitelist validation (allowed values)
- Sanitize input before processing
- Validate data types
- Check string lengths
- Validate email formats
- Escape special characters

```typescript
// ✅ GOOD: Comprehensive validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, name, roleId } = body;

  // Required field validation
  if (!email || !name || !roleId) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { success: false, message: 'Invalid email format' },
      { status: 400 }
    );
  }

  // Type validation
  const roleIdNum = parseInt(roleId);
  if (isNaN(roleIdNum)) {
    return NextResponse.json(
      { success: false, message: 'Invalid role ID' },
      { status: 400 }
    );
  }

  // Length validation
  if (name.length > 100) {
    return NextResponse.json(
      { success: false, message: 'Name too long' },
      { status: 400 }
    );
  }

  // Proceed with validated data
}
```

#### ❌ DON'T:
- Trust client-side validation alone
- Accept any user input without validation
- Use blacklist validation (blocked values)

```typescript
// ❌ BAD: No validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Directly using body.email without validation!
  await prisma.user.create({ data: body }); // DANGEROUS!
}
```

### SQL Injection Prevention

#### ✅ DO:
- Use Prisma ORM (parameterized queries)
- Never concatenate user input into queries
- Validate and sanitize inputs

```typescript
// ✅ GOOD: Prisma prevents SQL injection
const user = await prisma.user.findUnique({
  where: { email: userInput } // Safe with Prisma
});
```

#### ❌ DON'T:
- Use raw SQL with user input
- Concatenate strings into queries

```typescript
// ❌ BAD: SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${userInput}'`; // DANGEROUS!
```

### XSS Prevention

#### ✅ DO:
- Use React (escapes by default)
- Sanitize HTML if needed
- Set Content-Security-Policy headers
- Validate URLs before redirecting

```typescript
// ✅ GOOD: React escapes automatically
<div>{userInput}</div> // Safe with React

// If you need HTML, sanitize it
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlInput) }} />
```

#### ❌ DON'T:
- Use dangerouslySetInnerHTML with unsanitized input
- Disable XSS protection

```typescript
// ❌ BAD: XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // DANGEROUS!
```

---

## 🌐 API Security

### Rate Limiting

Implement rate limiting to prevent:
- Brute force attacks
- DDoS attacks
- API abuse

```typescript
// lib/ratelimit.ts (example implementation)
import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number;
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited ? reject() : resolve();
      }),
  };
}

// Usage in API route
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';

  try {
    await limiter.check(10, ip); // 10 requests per minute
  } catch {
    return NextResponse.json(
      { success: false, message: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Proceed with request
}
```

### CORS Configuration

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Only allow specific origins
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ];

  const origin = request.headers.get('origin');

  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 403,
      statusText: 'Forbidden',
    });
  }

  // ... rest of middleware
}
```

### HTTPS Only

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Force HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }

  // ... rest of middleware
}
```

---

## 🗄️ Database Security

### Connection Security

#### ✅ DO:
- Use SSL/TLS for database connections
- Restrict database access by IP
- Use strong database passwords
- Use least privilege principle
- Regular security updates

```env
# ✅ GOOD: Secure connection string
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
```

#### ❌ DON'T:
- Expose database to public internet
- Use default passwords
- Grant excessive privileges

### Backup Security

#### ✅ DO:
- Encrypt backups
- Store backups securely
- Test restore procedures
- Automate backups
- Keep multiple backup versions

```bash
# ✅ GOOD: Encrypted backup
pg_dump database_name | gpg --encrypt --recipient admin@example.com > backup.sql.gpg
```

---

## 🔑 Session Management

### Cookie Security

#### ✅ DO:
- Use HTTP-only cookies
- Set Secure flag (HTTPS only)
- Set SameSite attribute
- Set appropriate expiration
- Regenerate session on login

```typescript
// ✅ GOOD: Secure cookie configuration
response.cookies.set('auth-token', token, {
  httpOnly: true, // Prevent JavaScript access
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: 'strict', // CSRF protection
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/' // Cookie available everywhere
});
```

#### ❌ DON'T:
- Use localStorage for auth tokens
- Set very long expiration
- Allow cross-site cookies

### Session Invalidation

#### ✅ DO:
- Implement logout functionality
- Clear session on logout
- Implement session timeout
- Revoke tokens on password change

```typescript
// ✅ GOOD: Proper logout
export async function POST(request: NextRequest) {
  // Clear cookie
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });

  response.cookies.delete('auth-token');

  return response;
}
```

---

## 📝 Audit & Logging

### Audit Logging

#### ✅ DO:
- Log all sensitive operations
- Include user, action, timestamp
- Log failures (especially auth failures)
- Protect logs from tampering
- Regular log review

```typescript
// ✅ GOOD: Comprehensive audit log
await createAuditLog({
  userId: payload.userId,
  action: 'DELETE_USER',
  entity: 'User',
  entityId: deletedUserId,
  oldValue: { email: user.email, name: user.name },
  ipAddress: request.headers.get('x-forwarded-for') || undefined,
  userAgent: request.headers.get('user-agent') || undefined,
});
```

#### ❌ DON'T:
- Log sensitive data
- Allow users to delete their own logs
- Ignore failed login attempts

### Security Monitoring

Monitor for:
- Failed login attempts
- Permission violations
- Unusual activity patterns
- API rate limit violations
- Database errors

```typescript
// Example: Alert on multiple failed logins
const failedAttempts = await prisma.auditLog.count({
  where: {
    action: 'FAILED_LOGIN',
    userId: userId,
    createdAt: {
      gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
    }
  }
});

if (failedAttempts >= 5) {
  // Lock account or send alert
  await notifyAdmins('Multiple failed login attempts detected');
}
```

---

## ✅ Security Checklist

### Development
- [ ] Environment variables not committed to git
- [ ] .env files in .gitignore
- [ ] Dependencies regularly updated
- [ ] Security linting enabled (ESLint security plugins)
- [ ] Code reviews include security checks
- [ ] Secrets not hard-coded
- [ ] Error messages don't leak sensitive info

### Authentication
- [ ] Strong password requirements
- [ ] Password hashing with bcrypt
- [ ] JWT tokens in HTTP-only cookies
- [ ] Token expiration configured
- [ ] Secure cookie flags set
- [ ] Failed login attempt limiting
- [ ] Account lockout mechanism

### Authorization
- [ ] Permission checks at all layers
- [ ] Server-side validation
- [ ] Role-based access control
- [ ] System roles protected
- [ ] Audit logging for permission changes
- [ ] Principle of least privilege

### Data Protection
- [ ] HTTPS enforced
- [ ] Sensitive data encrypted
- [ ] Passwords never logged
- [ ] Tokens never logged
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (React)
- [ ] CSRF protection
- [ ] Input validation everywhere

### API Security
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] API authentication required
- [ ] Request size limits
- [ ] File upload validation
- [ ] Content-Type validation

### Database
- [ ] SSL/TLS for connections
- [ ] Strong database passwords
- [ ] Principle of least privilege
- [ ] Regular backups
- [ ] Encrypted backups
- [ ] Access restricted by IP

### Deployment
- [ ] SSL certificate installed
- [ ] Security headers configured
- [ ] Firewall rules set
- [ ] Default passwords changed
- [ ] Unnecessary services disabled
- [ ] System updates applied
- [ ] Monitoring configured
- [ ] Incident response plan

### Compliance
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy
- [ ] User data export feature
- [ ] User data deletion feature
- [ ] Consent mechanisms

---

## 🚨 Incident Response

### If Security Breach Detected:

1. **Contain**
   - Isolate affected systems
   - Block suspicious IPs
   - Disable compromised accounts

2. **Assess**
   - Review audit logs
   - Identify scope of breach
   - Determine data affected

3. **Remediate**
   - Patch vulnerabilities
   - Reset compromised credentials
   - Update security measures

4. **Notify**
   - Inform affected users
   - Report to authorities (if required)
   - Document incident

5. **Review**
   - Conduct post-mortem
   - Update security procedures
   - Improve monitoring

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/authentication)
- [Prisma Security](https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/prisma-and-sql-injection)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Remember: Security is not a one-time task, it's an ongoing process.**

**Last Updated:** 2024-01-23
**Version:** 1.0.0
