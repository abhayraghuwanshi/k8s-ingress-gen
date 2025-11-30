# SPA Routing Fix - Direct URL Navigation

## Problem
When accessing `https://www.k8sdiagram.fun/tutorial` directly (or refreshing the page), you get a 404 error. However, navigating via the "Learn YAML" button works fine.

## Root Cause
This is a common issue with Single Page Applications (SPAs). When you:
- Click the button → React Router handles the navigation (client-side)
- Type the URL directly → Server looks for a file called `tutorial` (doesn't exist)

The server needs to be configured to serve `index.html` for ALL routes, allowing React Router to handle the routing on the client side.

## Solution by Hosting Platform

### 1. Netlify (Most Common)

**Option A: Using `_redirects` file** (already created)
- File location: `public/_redirects`
- Automatically copied to `dist` during build
- No additional steps needed - just redeploy

**Option B: Using `netlify.toml`** (already created)
- File location: `netlify.toml` (root directory)
- Alternative to `_redirects`
- Preferred for more complex configurations

**Steps:**
1. Commit the changes (includes `public/_redirects` or `netlify.toml`)
2. Push to your repository
3. Netlify will auto-deploy
4. Test: https://www.k8sdiagram.fun/tutorial

---

### 2. Vercel

**Using `vercel.json`** (already created)
- File location: `vercel.json` (root directory)
- Rewrites all routes to `/index.html`

**Steps:**
1. Commit `vercel.json`
2. Push to repository
3. Vercel will auto-deploy
4. Test the URL

---

### 3. Apache Server

**Using `.htaccess`** (already created)
- File location: `public/.htaccess`
- Requires `mod_rewrite` module enabled

**Steps:**
1. Ensure Apache has `mod_rewrite` enabled:
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```
2. Upload `.htaccess` to your web root
3. Test the URL

---

### 4. Nginx

**Create nginx configuration:**

Add to your nginx config (`/etc/nginx/sites-available/your-site`):

```nginx
server {
    listen 80;
    server_name k8sdiagram.fun www.k8sdiagram.fun;
    root /var/www/k8sdiagram;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Steps:**
1. Update nginx config
2. Test config: `sudo nginx -t`
3. Reload nginx: `sudo systemctl reload nginx`
4. Test the URL

---

### 5. GitHub Pages

**Create `404.html`** (for GitHub Pages only):

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/'" />
  </head>
</html>
```

Then update your `index.html` to read from sessionStorage.

**Note:** GitHub Pages has limitations with SPAs. Consider using Netlify or Vercel instead.

---

## How to Deploy

### Current Setup Check
Which platform is k8sdiagram.fun hosted on? Check:

1. **Netlify**: Look for deployment logs or check netlify.com dashboard
2. **Vercel**: Check vercel.com dashboard
3. **Custom Server**: Check server configuration files

### Quick Deploy Steps

**If using Netlify or Vercel:**
```bash
# Build the project
npm run build

# Commit and push
git add .
git commit -m "Fix SPA routing for direct URL access"
git push

# Platform will auto-deploy
```

**If using custom server:**
1. Build: `npm run build`
2. Upload `dist` folder contents to web server
3. Ensure appropriate config file is in place (`.htaccess` or nginx config)

---

## Testing

After deploying, test these URLs:

1. ✅ Direct access: https://www.k8sdiagram.fun/tutorial
2. ✅ Refresh on tutorial page (should not 404)
3. ✅ Browser back/forward buttons
4. ✅ Bookmarked URLs

---

## Files Created

- ✅ `public/_redirects` - Netlify redirects
- ✅ `netlify.toml` - Netlify configuration
- ✅ `vercel.json` - Vercel configuration
- ✅ `public/.htaccess` - Apache configuration

Choose the one that matches your hosting platform and deploy!

---

## Alternative: HashRouter

If server configuration is not possible, you can use HashRouter instead:

**In `src/App.tsx`:**
```tsx
import { HashRouter, Routes, Route } from "react-router-dom";

const App = () => (
  <HashRouter>
    <Routes>
      {/* ... */}
    </Routes>
  </HashRouter>
);
```

This changes URLs to: `https://k8sdiagram.fun/#/tutorial`

**Pros:** Works without server configuration
**Cons:** Ugly URLs with `#`, bad for SEO

**Not recommended** - Use server configuration instead.
