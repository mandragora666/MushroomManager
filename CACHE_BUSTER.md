# 🔥 CACHE BUSTING REQUIRED

Build Status: ✅ SUCCESS (37s, ec657eb)
Problem: Cloudflare CDN/Browser Cache serving old content

## Cache Clearing Methods:

### Browser (Manual):
1. Hard Refresh: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
2. Clear Site Data: F12 → Application → Storage → Clear Site Data  
3. Incognito/Private Mode: New private window
4. URL with timestamp: ?v=1728211200

### Cloudflare CDN:
- Cache purge happens automatically in 5-15 minutes
- OR manual purge via Cloudflare Dashboard → Caching → Purge Everything

### Verification URLs:
- Main: https://mushroom-manager.pages.dev
- With cache buster: https://mushroom-manager.pages.dev?v=$(date +%s)
- Expected: protocol-meta-label">Art: (with colon)