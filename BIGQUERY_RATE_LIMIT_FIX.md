# BigQuery Rate Limit Error - Fix Guide

## The Problem

Your Supabase API Gateway logs show:
```
Job exceeded rate limits: Your project_and_region exceeded quota for creating jobs
```

This is a **Google Cloud BigQuery rate limit** error. Supabase uses BigQuery for analytics/logging, and you've hit the quota.

## Why This Causes CORS Errors

When the API gateway hits rate limits:
1. Requests fail at the gateway level
2. Browser sees failed requests without proper CORS headers
3. Browser throws CORS errors (even though it's actually a rate limit issue)

## Solutions

### Solution 1: Wait and Retry (Quick Fix)

BigQuery rate limits are usually **per-minute** or **per-hour**. 

**Action:**
1. Wait 5-10 minutes
2. Try your requests again
3. The rate limit should reset

### Solution 2: Check Supabase Dashboard

1. Go to **Supabase Dashboard → Settings → Usage**
2. Check if you're on the **Free Tier** and hitting limits
3. Look for any quota warnings

### Solution 3: Disable Analytics/Logging (If Not Needed)

If you don't need detailed analytics:

1. **Supabase Dashboard → Settings → API**
2. Look for analytics/logging settings
3. Disable or reduce logging if possible

### Solution 4: Upgrade Plan (If Needed)

If you're on Free Tier and hitting limits frequently:
- Consider upgrading to Pro plan
- Or optimize your queries to reduce API calls

### Solution 5: Optimize Your Queries

Reduce unnecessary API calls:

1. **Cache data** on the frontend
2. **Batch requests** where possible
3. **Use React Query** (you already have it) to cache responses
4. **Debounce** search/filter requests

## Immediate Fix

**Right now, try this:**

1. **Wait 10 minutes** (let rate limits reset)
2. **Restart your dev server:**
   ```bash
   npm run dev
   ```
3. **Hard refresh browser:** `Ctrl+Shift+R`
4. **Try again**

## Verify It's Fixed

After waiting, check:
- Can you fetch invoices?
- Can you fetch students?
- Are CORS errors gone?

If errors persist after 10 minutes, it might be a different issue.

## Prevention

To avoid hitting rate limits:

1. **Use React Query caching** (you already have it set up)
2. **Don't make unnecessary API calls**
3. **Batch operations** when possible
4. **Monitor your usage** in Supabase Dashboard

## Check Your Current Usage

Go to: **Supabase Dashboard → Settings → Usage**

Look for:
- API requests per hour
- Database queries per hour
- Any quota warnings

---

## Summary

✅ **The Issue:** BigQuery rate limits (not actual CORS)  
⏰ **Quick Fix:** Wait 10 minutes, then retry  
🔧 **Long-term:** Optimize queries, consider upgrading plan  
📊 **Monitor:** Check Supabase Dashboard → Usage  

The CORS errors should disappear once the rate limits reset!

