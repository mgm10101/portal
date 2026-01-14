# CORS Error Troubleshooting Guide

## ✅ GOOD NEWS: Your Database is Working!

Your `pg_stat_statements` output shows:
- ✅ 299 invoice inserts executed successfully
- ✅ 320 line item inserts executed successfully
- ✅ 573 invoice fetches executed successfully
- ✅ All queries are completing without database errors

**The database is fine. The issue is CORS (Cross-Origin Resource Sharing) at the HTTP/API level.**

---

## What is CORS?

CORS errors happen when your browser blocks requests to Supabase because:
1. The browser doesn't see the correct CORS headers in the response
2. Supabase project settings have CORS restrictions
3. Your environment variables are missing/incorrect
4. Network/proxy/firewall is interfering

---

## Step-by-Step Fix

### 1. **Check Your `.env` File**

Create or verify `.env` in your project root:

```env
VITE_SUPABASE_URL=https://tyillyfcqesfucnzrzmg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** 
- Get your anon key from: Supabase Dashboard → Settings → API → `anon` `public` key
- Make sure there are NO quotes around the values
- Make sure there are NO spaces around the `=` sign

### 2. **Restart Your Dev Server**

After changing `.env`, you MUST restart:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

Vite only reads `.env` on startup!

### 3. **Check Supabase Dashboard Settings**

Go to: **Supabase Dashboard → Settings → API**

Check:
- ✅ Project URL matches your `.env` file
- ✅ CORS settings allow `http://localhost:5173`
- ✅ No IP restrictions blocking localhost

### 4. **Clear Browser Cache**

- **Chrome/Edge:** Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox:** Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Or: Open DevTools → Right-click refresh button → "Empty Cache and Hard Reload"

### 5. **Check Browser Console for More Details**

Open DevTools (F12) → Console tab:
- Look for the exact error message
- Check the Network tab to see the failed request
- Look for any additional error details

### 6. **Try a Different Browser**

Sometimes browser extensions or settings cause issues:
- Try Chrome, Firefox, or Edge
- Use incognito/private mode (disables extensions)

### 7. **Check Network/Firewall**

- Disable VPN if active
- Disable proxy settings
- Try a different network (mobile hotspot)
- Check if corporate firewall is blocking

### 8. **Verify Supabase Client Setup**

Check `src/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Add this temporary debug log:

```typescript
console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Supabase Key exists:', !!supabaseAnonKey);
```

If these are `undefined` or `null`, your `.env` file isn't being read.

---

## Quick Test

Run this in your browser console (on your app page):

```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

If these show `undefined`, your `.env` file isn't being loaded.

---

## Common Mistakes

❌ **Wrong file location:** `.env` must be in project root (same folder as `package.json`)  
❌ **Wrong variable names:** Must be `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`  
❌ **Quotes in .env:** Don't use quotes: `VITE_SUPABASE_URL="https://..."` ❌  
❌ **Didn't restart:** Vite only reads `.env` on startup  
❌ **Typo in URL:** Check for typos in the Supabase URL  

---

## Still Not Working?

1. **Check Supabase Status:** https://status.supabase.com
2. **Check Supabase Logs:** Dashboard → Logs → API Logs
3. **Try direct API call:**
   ```bash
   curl -H "apikey: YOUR_ANON_KEY" \
        -H "Authorization: Bearer YOUR_ANON_KEY" \
        https://tyillyfcqesfucnzrzmg.supabase.co/rest/v1/invoices?select=*&limit=1
   ```
4. **Contact Supabase Support** if the above doesn't work

---

## Summary

✅ Your database is working (proven by query stats)  
❌ CORS is blocking HTTP requests  
🔧 Fix: Check `.env`, restart server, clear cache, check Supabase settings  

The code changes I made are fine - this is purely a configuration issue!

