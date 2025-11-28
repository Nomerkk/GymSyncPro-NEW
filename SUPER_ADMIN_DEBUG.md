# Super Admin Access Debugging Guide

## Issue
User cannot access Super Admin pages after implementation of multi-branch access feature.

## Potential Causes

### 1. Session/Authentication Issues
- Session not persisting after login
- Cookie not being set correctly
- Role not being saved in session

### 2. Frontend Routing Issues
- Admin routes not properly checking for super_admin role
- Redirect logic interfering with access

### 3. Backend Middleware Issues
- requireSuperAdmin middleware too restrictive
- isAdmin middleware not recognizing super_admin role

## Debugging Steps

### Step 1: Verify User Role in Database
```sql
SELECT username, email, role, "homeBranch" FROM users WHERE role IN ('admin', 'super_admin');
```

### Step 2: Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for errors related to:
   - 401 Unauthorized
   - 403 Forbidden
   - Failed API calls

### Step 3: Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try accessing `/admin/audit-logs`
4. Check:
   - Request to `/api/auth/user` - does it return correct role?
   - Any 401/403 responses?

### Step 4: Check Session Cookie
1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Look for cookie named `sid`
4. Verify it exists and has value

## Quick Fixes to Try

### Fix 1: Clear Browser Cache and Cookies
1. Logout
2. Clear all site data for localhost:5000
3. Login again

### Fix 2: Verify Super Admin User Exists
Run: `npx tsx create_super_admin.ts`

### Fix 3: Check Server Logs
Look for any errors when accessing admin pages

## Information Needed

Please provide:
1. **Exact error message** (screenshot or copy-paste)
2. **Which page** cannot be accessed (URL)
3. **Browser console errors** (F12 → Console tab)
4. **Network request failures** (F12 → Network tab)
5. **Current user info** from `/api/auth/user` endpoint
