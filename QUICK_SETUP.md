# 🚀 ATELIER Quick Setup Guide

## What You Have

3 files that work together:
1. `architecture-store.html` - Customer website
2. `admin-dashboard.html` - Staff dashboard  
3. `admin-backend.js` - The backend logic

## 5-Minute Setup

### Step 1: Upload Files

**Option A: GitHub Pages (Free)**
1. Create GitHub account
2. New repository → "atelier-store"
3. Upload all 3 files
4. Settings → Pages → Enable
5. Done! You have: `yourname.github.io/atelier-store`

**Option B: Netlify (Easiest)**
1. Go to netlify.com
2. Drag & drop all 3 files
3. Done! You get: `random-name.netlify.app`
4. Can change to custom domain later

### Step 2: Rename Customer Site
Rename `architecture-store.html` to `index.html` before uploading
(This makes it the default homepage)

### Step 3: Test It

**Customer Side:**
1. Visit your site URL
2. Fill out order form
3. Submit

**Admin Side:**
1. Visit: `your-site-url/admin-dashboard.html`
2. Login: admin / atelier2026
3. See the order appear!

### Step 4: Secure It

1. Open `admin-backend.js` in text editor
2. Find line 16-17:
```javascript
{ id: 1, username: 'admin', password: 'atelier2026', role: 'admin', name: 'Admin User' },
```
3. Change 'atelier2026' to your password
4. Save and re-upload

### Step 5: Share Links

**With Students:** 
`your-site.com` (or `your-site.com/index.html`)

**With Staff:**
`your-site.com/admin-dashboard.html`
(Keep this secret!)

## Daily Use

### As Staff:

**Every Morning:**
1. Open admin dashboard
2. Check pending orders
3. Prepare materials

**After Preparing:**
1. Click order → "Mark as Ready"
2. Contact student (phone/email shown)

**After Pickup:**
1. Click "Mark as Completed"
2. Stock automatically updates!

### Managing Stock:

**When Receiving Supplies:**
1. Dashboard → Inventory
2. Find product → "Adjust Stock"
3. Type: +50 (for 50 new sheets)

**When Running Low:**
1. Red "LOW STOCK" badge appears
2. Time to reorder!

## Customization

### Change Colors:
Edit `architecture-store.html`, find:
```css
--accent: #d4a574;
```
Change to your color!

### Add Your Logo:
Replace `ATELIER` text with:
```html
<img src="your-logo.png" style="height: 40px;">
```

### Change Contact Info:
Edit footer section in `architecture-store.html`

## What Happens When...

**Student Orders:**
1. Fills form on website
2. Clicks submit
3. Order saved to browser database
4. Confirmation shows
5. You see it in admin dashboard instantly!

**You Mark as Ready:**
1. Click "Mark as Ready" in dashboard
2. Status changes to green
3. You call/email student to pick up

**Student Picks Up:**
1. Click "Mark as Completed"
2. Stock automatically reduced
3. Order moves to completed

## Important Notes

⚠️ **Both sites must be on same domain**
- Customer site: `yoursite.com`
- Admin: `yoursite.com/admin-dashboard.html`
- This allows them to share the database

✅ **Data persists**
- Orders stay even after closing browser
- Safe to close and reopen

❌ **Don't clear browser data**
- This deletes all orders!
- Set up backups later

## Troubleshooting

**Can't see orders in admin?**
→ Make sure both files are on same website domain

**Lost password?**
→ Edit `admin-backend.js` and change it back

**Data disappeared?**
→ Browser data was cleared. This is why backups matter!
→ Time to upgrade to Firebase (covered in full docs)

## Getting Help

1. Read BACKEND_DOCUMENTATION.md for details
2. Check browser console (F12) for errors
3. All code is commented - you can read it!

## Next Steps

Once running smoothly:
- [ ] Add more products to inventory
- [ ] Train other staff members
- [ ] Set up weekly backups
- [ ] Consider upgrading to Firebase (when you have 50+ orders)
- [ ] Add email notifications
- [ ] Customize design

---

## Remember

**You now have a complete order management system!**

- Students order → You process → They pick up
- Inventory tracked automatically
- All data in one place
- Works on phones and computers
- Can upgrade anytime

**Start simple, learn as you grow!** 🌱

Need help? Everything is documented in BACKEND_DOCUMENTATION.md