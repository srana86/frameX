# SMTP Email Troubleshooting Guide

## Common Error: "535 5.7.8 Error: authentication failed"

This error means your SMTP server rejected your username/password combination. Follow these steps:

### Step 1: Check if Password is Encrypted (Most Common Issue)

If your password was saved before encryption was properly set up, it might still be encrypted in the database.

**Solution:**

1. Go to **Settings → Email Settings** in your tenant dashboard
2. **Re-enter your SMTP password** (even if it looks correct)
3. Click **Save**
4. Click **Test Connection** to verify

### Step 2: Gmail Setup (Most Common Provider)

Gmail requires an **App Password**, not your regular password.

**Steps:**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Select **Mail** and **Other (Custom name)**
5. Enter "ShoeStore" or your app name
6. Click **Generate**
7. Copy the 16-character password (no spaces)
8. Use this App Password in your SMTP settings

**Gmail SMTP Settings:**

- **Host:** `smtp.gmail.com`
- **Port:** `587` (or `465` for SSL)
- **Secure:** `true` (SSL/TLS)
- **Username:** Your full Gmail address (e.g., `you@gmail.com`)
- **Password:** The 16-character App Password (not your regular password)

### Step 3: Outlook/Hotmail Setup

**Steps:**

1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Enable **2-Step Verification**
3. Go to **Security** → **Advanced security options**
4. Click **Create a new app password**
5. Use this App Password in your SMTP settings

**Outlook SMTP Settings:**

- **Host:** `smtp-mail.outlook.com`
- **Port:** `587`
- **Secure:** `true`
- **Username:** Your full Outlook email
- **Password:** App Password

### Step 4: Yahoo Mail Setup

**Steps:**

1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Enable **2-Step Verification**
3. Generate an **App Password**
4. Use this App Password in your SMTP settings

**Yahoo SMTP Settings:**

- **Host:** `smtp.mail.yahoo.com`
- **Port:** `587` (or `465`)
- **Secure:** `true`
- **Username:** Your full Yahoo email
- **Password:** App Password

### Step 5: Other Email Providers

For other providers (custom SMTP servers):

1. **Check if 2FA is enabled:**

   - If yes, disable it OR use an app-specific password
   - Some providers require app passwords even without 2FA

2. **Verify SMTP settings:**

   - Contact your email provider for correct SMTP settings
   - Common ports: `587` (TLS), `465` (SSL), `25` (not recommended)

3. **Test connection:**
   - Use the "Test Connection" button in Email Settings
   - Check server logs for detailed error messages

### Step 6: Verify Password Format

**Check your password:**

- Should NOT contain `:` (colon) in the middle - this means it's still encrypted
- Should be the actual password or App Password (16-32 characters typically)
- No extra spaces before/after (automatically trimmed)

**If password contains `:` (like `abc123:def456`):**

1. This means decryption failed
2. Re-enter the password in Email Settings
3. Save and test again

### Step 7: Check Server Logs

Check your application logs for:

- `[SMTP] Password appears to still be encrypted` - means password needs to be re-entered
- `[SMTP] Attempting connection:` - shows connection details (password masked)
- `[SMTP] Send error:` - shows the actual error from SMTP server

### Quick Checklist

- [ ] Password re-entered in Email Settings
- [ ] Using App Password (for Gmail/Outlook/Yahoo)
- [ ] 2-Step Verification enabled (if using App Password)
- [ ] Correct SMTP host and port
- [ ] Secure/TLS enabled (usually `true` for port 587)
- [ ] Username is full email address
- [ ] Password does NOT contain `:` character
- [ ] Test Connection button used to verify

### Still Having Issues?

1. **Check ENCRYPTION_KEY:**

   - Ensure `ENCRYPTION_KEY` environment variable is set
   - If changed, all passwords need to be re-entered

2. **Try a different email provider:**

   - Use SendGrid, Postmark, or Amazon SES as alternatives
   - These don't require SMTP authentication

3. **Contact Support:**
   - Provide error logs
   - Include SMTP settings (mask password)
   - Mention which email provider you're using
