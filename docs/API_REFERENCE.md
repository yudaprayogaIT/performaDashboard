# API Reference Documentation

Complete API reference for the Performa Dashboard RBAC system.

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Role Management](#role-management)
3. [Permission Management](#permission-management)
4. [User Management](#user-management)
5. [Notifications](#notifications)
6. [Error Handling](#error-handling)
7. [Response Codes](#response-codes)

---

## 🔐 Authentication

All API endpoints (except login) require authentication via JWT token stored in HTTP-only cookie.

### Cookie Name
```
auth-token
```

### Token Expiration
- Default: 7 days
- Configurable via JWT_EXPIRES_IN env variable

---

## 🔑 Login

### POST `/api/auth/login`

Login user and create session.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Administrator"
  }
}
```

**Error Responses:**

400 - Validation Error:
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

401 - Invalid Credentials:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

403 - Account Inactive:
```json
{
  "success": false,
  "message": "Account is inactive"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

---

### POST `/api/auth/logout`

Logout user and clear session.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

### GET `/api/auth/permissions`

Get current user's permissions.

**Headers:**
```
Cookie: auth-token=YOUR_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "permissions": [
    "view_dashboard",
    "manage_users",
    "manage_roles",
    "export_data"
  ]
}
```

**Error Responses:**

401 - Unauthorized:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/auth/permissions \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

## 👥 Role Management

### GET `/api/admin/roles`

Get all roles with permissions and user count.

**Required Permission:** `manage_roles`

**Success Response (200):**
```json
{
  "success": true,
  "roles": [
    {
      "id": 1,
      "name": "ADMINISTRATOR",
      "description": "Full system access",
      "isSystem": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "permissions": [
        {
          "id": 1,
          "slug": "view_dashboard",
          "name": "View Dashboard",
          "description": "Access to dashboard pages",
          "module": "DASHBOARD"
        }
      ],
      "userCount": 5
    }
  ]
}
```

**Error Responses:**

401 - Unauthorized
403 - Forbidden (no permission)
500 - Server Error

**Example:**
```bash
curl -X GET http://localhost:3000/api/admin/roles \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

### POST `/api/admin/roles`

Create new role.

**Required Permission:** `manage_roles`

**Request Body:**
```json
{
  "name": "string (required, uppercase)",
  "description": "string (optional)",
  "permissionIds": [1, 2, 3] // array of permission IDs
}
```

**Validation Rules:**
- `name`: Required, will be converted to uppercase, max 50 chars
- `description`: Optional, max 255 chars
- `permissionIds`: Must be valid permission IDs

**Success Response (200):**
```json
{
  "success": true,
  "role": {
    "id": 5,
    "name": "CUSTOM_ROLE",
    "description": "Custom role description",
    "isSystem": false,
    "createdAt": "2024-01-23T10:00:00.000Z",
    "permissions": [...]
  },
  "message": "Role created successfully"
}
```

**Error Responses:**

400 - Validation Error:
```json
{
  "success": false,
  "message": "Role name is required"
}
```

400 - Duplicate Name:
```json
{
  "success": false,
  "message": "Role name already exists"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/roles \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "name": "ANALYST",
    "description": "Data analyst role",
    "permissionIds": [1, 2, 5, 10]
  }'
```

---

### PATCH `/api/admin/roles/:id`

Update existing role.

**Required Permission:** `manage_roles`

**URL Parameters:**
- `id`: Role ID (integer)

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "permissionIds": [1, 2, 3] // optional
}
```

**Restrictions:**
- Cannot update system roles
- Cannot change `isSystem` flag

**Success Response (200):**
```json
{
  "success": true,
  "role": {
    "id": 5,
    "name": "UPDATED_ROLE",
    "description": "Updated description",
    "isSystem": false,
    "permissions": [...]
  },
  "message": "Role updated successfully"
}
```

**Error Responses:**

400 - System Role:
```json
{
  "success": false,
  "message": "Cannot update system role"
}
```

404 - Not Found:
```json
{
  "success": false,
  "message": "Role not found"
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/admin/roles/5 \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "name": "SENIOR_ANALYST",
    "permissionIds": [1, 2, 3, 4, 5]
  }'
```

---

### DELETE `/api/admin/roles/:id`

Delete role.

**Required Permission:** `manage_roles`

**URL Parameters:**
- `id`: Role ID (integer)

**Restrictions:**
- Cannot delete system roles
- Cannot delete roles assigned to users

**Success Response (200):**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

**Error Responses:**

400 - System Role:
```json
{
  "success": false,
  "message": "Cannot delete system role"
}
```

400 - Role In Use:
```json
{
  "success": false,
  "message": "Cannot delete role. It is assigned to 3 user(s)"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/admin/roles/5 \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

## 🔑 Permission Management

### GET `/api/admin/permissions`

Get all permissions grouped by module.

**Required Permission:** `manage_permissions`

**Success Response (200):**
```json
{
  "success": true,
  "permissions": [
    {
      "module": "DASHBOARD",
      "permissions": [
        {
          "id": 1,
          "slug": "view_dashboard",
          "name": "View Dashboard",
          "description": "Access to dashboard pages",
          "module": "DASHBOARD",
          "isSystem": true,
          "roleCount": 4,
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    },
    {
      "module": "UPLOAD",
      "permissions": [...]
    }
  ]
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/admin/permissions \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

### POST `/api/admin/permissions`

Create new permission.

**Required Permission:** `manage_permissions`

**Request Body:**
```json
{
  "slug": "string (required, lowercase_with_underscores)",
  "name": "string (required)",
  "description": "string (optional)",
  "module": "DASHBOARD|UPLOAD|SETTINGS|AUDIT|EXPORT (required)"
}
```

**Validation Rules:**
- `slug`: Required, lowercase with underscores only, unique
- `name`: Required, max 100 chars
- `description`: Optional, max 255 chars
- `module`: Required, must be valid module enum

**Success Response (200):**
```json
{
  "success": true,
  "permission": {
    "id": 26,
    "slug": "custom_action",
    "name": "Custom Action",
    "description": "Custom permission description",
    "module": "DASHBOARD",
    "isSystem": false,
    "createdAt": "2024-01-23T10:00:00.000Z"
  },
  "message": "Permission created successfully"
}
```

**Error Responses:**

400 - Validation Error:
```json
{
  "success": false,
  "message": "Slug, name, and module are required"
}
```

400 - Duplicate Slug:
```json
{
  "success": false,
  "message": "Permission slug already exists"
}
```

400 - Invalid Module:
```json
{
  "success": false,
  "message": "Invalid module"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/permissions \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "slug": "advanced_analytics",
    "name": "Advanced Analytics",
    "description": "Access to advanced analytics features",
    "module": "DASHBOARD"
  }'
```

---

### PATCH `/api/admin/permissions/:id`

Update permission.

**Required Permission:** `manage_permissions`

**URL Parameters:**
- `id`: Permission ID (integer)

**Request Body:**
```json
{
  "slug": "string (optional)",
  "name": "string (optional)",
  "description": "string (optional)",
  "module": "string (optional)"
}
```

**Restrictions:**
- Cannot update system permissions
- Slug must be unique

**Success Response (200):**
```json
{
  "success": true,
  "permission": {
    "id": 26,
    "slug": "updated_slug",
    "name": "Updated Name",
    "description": "Updated description",
    "module": "DASHBOARD",
    "isSystem": false
  },
  "message": "Permission updated successfully"
}
```

**Error Responses:**

400 - System Permission:
```json
{
  "success": false,
  "message": "Cannot update system permission"
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/admin/permissions/26 \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "name": "Super Advanced Analytics",
    "description": "Even more advanced features"
  }'
```

---

### DELETE `/api/admin/permissions/:id`

Delete permission.

**Required Permission:** `manage_permissions`

**URL Parameters:**
- `id`: Permission ID (integer)

**Restrictions:**
- Cannot delete system permissions
- Cannot delete permissions assigned to roles

**Success Response (200):**
```json
{
  "success": true,
  "message": "Permission deleted successfully"
}
```

**Error Responses:**

400 - System Permission:
```json
{
  "success": false,
  "message": "Cannot delete system permission"
}
```

400 - Permission In Use:
```json
{
  "success": false,
  "message": "Cannot delete permission. It is assigned to 2 role(s)"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/admin/permissions/26 \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

## 👤 User Management

### GET `/api/admin/users`

Get all users with their roles.

**Required Permission:** `manage_users`

**Success Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "email": "admin@example.com",
      "name": "Administrator",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "roles": [
        {
          "id": 1,
          "name": "ADMINISTRATOR",
          "description": "Full system access"
        }
      ]
    }
  ]
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

### POST `/api/admin/users`

Create new user.

**Required Permission:** `manage_users`

**Request Body:**
```json
{
  "email": "string (required, valid email)",
  "name": "string (required)",
  "password": "string (required, min 6 chars)",
  "roleId": "number (required)",
  "isActive": "boolean (optional, default: true)"
}
```

**Validation Rules:**
- `email`: Required, valid email format, unique
- `name`: Required, max 100 chars
- `password`: Required, min 6 chars, will be hashed
- `roleId`: Required, must be valid role ID
- `isActive`: Optional, defaults to true

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 10,
    "email": "newuser@example.com",
    "name": "New User",
    "isActive": true,
    "createdAt": "2024-01-23T10:00:00.000Z",
    "roles": [
      {
        "id": 2,
        "name": "DIREKTUR",
        "description": "Director level access"
      }
    ]
  },
  "message": "User created successfully"
}
```

**Error Responses:**

400 - Validation Error:
```json
{
  "success": false,
  "message": "Email, name, password, and role are required"
}
```

400 - Invalid Email:
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

400 - Duplicate Email:
```json
{
  "success": false,
  "message": "Email already exists"
}
```

404 - Role Not Found:
```json
{
  "success": false,
  "message": "Role not found"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "email": "analyst@example.com",
    "name": "John Analyst",
    "password": "secure123",
    "roleId": 3,
    "isActive": true
  }'
```

---

### PATCH `/api/admin/users/:id`

Update user.

**Required Permission:** `manage_users`

**URL Parameters:**
- `id`: User ID (integer)

**Request Body:**
```json
{
  "email": "string (optional)",
  "name": "string (optional)",
  "password": "string (optional)",
  "roleId": "number (optional)",
  "isActive": "boolean (optional)"
}
```

**Notes:**
- If `password` not provided, existing password is kept
- If `roleId` provided, replaces all existing roles
- Permission cache is cleared if role changed

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 10,
    "email": "updated@example.com",
    "name": "Updated Name",
    "isActive": true,
    "createdAt": "2024-01-23T10:00:00.000Z",
    "updatedAt": "2024-01-23T10:30:00.000Z",
    "roles": [...]
  },
  "message": "User updated successfully"
}
```

**Error Responses:**

400 - Invalid Email:
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

400 - Duplicate Email:
```json
{
  "success": false,
  "message": "Email already exists"
}
```

404 - User Not Found:
```json
{
  "success": false,
  "message": "User not found"
}
```

404 - Role Not Found:
```json
{
  "success": false,
  "message": "Role not found"
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/admin/users/10 \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "name": "John Senior Analyst",
    "roleId": 4,
    "isActive": true
  }'
```

---

### DELETE `/api/admin/users/:id`

Delete user.

**Required Permission:** `manage_users`

**URL Parameters:**
- `id`: User ID (integer)

**Restrictions:**
- Cannot delete own account

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses:**

400 - Self Delete:
```json
{
  "success": false,
  "message": "Cannot delete your own account"
}
```

404 - User Not Found:
```json
{
  "success": false,
  "message": "User not found"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/admin/users/10 \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

## 🔔 Notifications

### GET `/api/notifications`

Get user notifications with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "INFO",
      "title": "Upload Complete",
      "message": "Your data has been uploaded successfully",
      "link": "/dashboard",
      "isRead": false,
      "readAt": null,
      "createdAt": "2024-01-23T10:00:00.000Z"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/notifications?page=1&limit=10" \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

### GET `/api/notifications/stream`

Server-Sent Events endpoint for real-time notifications.

**Response Type:** `text/event-stream`

**Event Types:**
- `connected`: Initial connection success
- `notifications`: New notifications available
- `heartbeat`: Keep-alive ping (every 30s)

**Example Event:**
```
data: {"type":"notifications","data":[...],"count":2}

data: {"type":"heartbeat","timestamp":1706001234567}
```

**Example:**
```javascript
const eventSource = new EventSource('/api/notifications/stream');

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'notifications') {
    console.log('New notifications:', data.data);
  }
});
```

---

### PATCH `/api/notifications/:id`

Mark notification as read.

**URL Parameters:**
- `id`: Notification ID (integer)

**Restrictions:**
- Can only mark own notifications

**Success Response (200):**
```json
{
  "success": true,
  "notification": {
    "id": 1,
    "isRead": true,
    "readAt": "2024-01-23T10:30:00.000Z"
  }
}
```

**Error Responses:**

403 - Not Your Notification:
```json
{
  "success": false,
  "message": "Forbidden"
}
```

404 - Not Found:
```json
{
  "success": false,
  "message": "Notification not found"
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/notifications/1 \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

### DELETE `/api/notifications/:id`

Delete notification.

**URL Parameters:**
- `id`: Notification ID (integer)

**Restrictions:**
- Can only delete own notifications

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/notifications/1 \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

### POST `/api/notifications`

Mark all notifications as read.

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

## ⚠️ Error Handling

### Standard Error Response Format

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

### Common Error Scenarios

#### Authentication Errors
```json
// 401 - No token provided
{
  "success": false,
  "message": "Unauthorized"
}

// 401 - Invalid or expired token
{
  "success": false,
  "message": "Invalid token"
}
```

#### Authorization Errors
```json
// 403 - No permission
{
  "success": false,
  "message": "Forbidden: You don't have permission to manage_users"
}
```

#### Validation Errors
```json
// 400 - Missing required fields
{
  "success": false,
  "message": "Email and password are required"
}

// 400 - Invalid format
{
  "success": false,
  "message": "Invalid email format"
}

// 400 - Duplicate entry
{
  "success": false,
  "message": "Email already exists"
}
```

#### Not Found Errors
```json
// 404 - Resource not found
{
  "success": false,
  "message": "User not found"
}
```

#### Server Errors
```json
// 500 - Internal server error
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📊 Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

---

## 🔒 Security Notes

1. **Always use HTTPS in production**
2. **Tokens are HTTP-only cookies** - Not accessible via JavaScript
3. **All passwords are hashed** - Using bcrypt with 10 rounds
4. **Permissions checked on every request** - Don't cache on client
5. **Audit logs created** - For all sensitive operations
6. **Rate limiting recommended** - To prevent brute force

---

## 📝 Best Practices

1. **Handle errors gracefully** - Show user-friendly messages
2. **Validate on both client and server** - Don't trust client input
3. **Use TypeScript types** - For type-safe API calls
4. **Cache GET requests** - But invalidate on mutations
5. **Show loading states** - During API calls
6. **Retry failed requests** - With exponential backoff
7. **Log errors** - For debugging

---

## 🧪 Testing APIs

### Using curl

```bash
# Login and save cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt

# Use saved cookie for subsequent requests
curl -X GET http://localhost:3000/api/admin/roles \
  -b cookies.txt
```

### Using Postman

1. Create request to `/api/auth/login`
2. In Tests tab, add:
   ```javascript
   pm.cookies.jar();
   ```
3. Cookie will be automatically sent with subsequent requests

### Using Fetch (JavaScript)

```javascript
// Login
const login = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  }),
  credentials: 'include' // Important: include cookies
});

// Subsequent requests
const roles = await fetch('/api/admin/roles', {
  credentials: 'include' // Important: include cookies
});
```

---

**Last Updated:** 2024-01-23
**Version:** 1.0.0
