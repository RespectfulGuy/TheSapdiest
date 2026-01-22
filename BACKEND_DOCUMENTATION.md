# ATELIER Backend System Documentation

## 🎯 System Overview

This is a complete order and inventory management system for ATELIER, your architecture materials store at UM6P SAP+D. The system consists of:

1. **Customer-Facing Website** (`architecture-store.html`) - Where students browse and order
2. **Admin Dashboard** (`admin-dashboard.html`) - Where you manage everything
3. **Backend System** (`admin-backend.js`) - The brain that handles all data

---

## 🗄️ How the Database Works

### Current Setup: LocalStorage (Simple & Works Immediately)

**What is it?**
- Browser-based storage that saves data on the computer
- Data persists even after closing the browser
- Perfect for getting started quickly
- No server or hosting needed initially

**Data Structure:**
The system stores 4 types of data:

1. **Users** (`atelier_users`)
   - Admin/staff accounts with login credentials
   - Default accounts created automatically

2. **Products** (`atelier_products`)
   - Your inventory items (papers, materials)
   - Stock levels, descriptions, minimum stock alerts

3. **Orders** (`atelier_orders`)
   - Customer orders from the website
   - Status tracking (pending → ready → completed)

4. **Customers** (`atelier_customers`)
   - Automatically built from orders
   - Order history and contact info

### How Data Flows:

```
CUSTOMER WEBSITE                    ADMIN DASHBOARD
     ↓                                     ↓
  Places Order          ←→        Views/Manages Orders
     ↓                                     ↓
LocalStorage Database (Shared Between Both)
```

---

## 🔐 Accessing the Admin Dashboard

### Method 1: Hidden URL (Recommended)
Upload `admin-dashboard.html` to a secret path like:
- `yoursite.com/staff-access-2026`
- `yoursite.com/admin-xyz123`
- `yoursite.com/backstage`

**Advantages:**
- Clean and professional
- No visible admin button on main site
- Just share the secret URL with staff

### Method 2: Hidden Button on Main Site
Add this invisible area to your main website (bottom corner):

```html
<!-- Add at bottom of architecture-store.html -->
<div style="position: fixed; bottom: 10px; right: 10px; width: 50px; height: 50px; cursor: pointer;" 
     onclick="window.location.href='admin-dashboard.html'"></div>
```

Triple-click the corner to access admin!

### Login Credentials:

**Default Admin Account:**
- Username: `admin`
- Password: `atelier2026`

**Default Staff Account:**
- Username: `staff`
- Password: `staff123`

⚠️ **IMPORTANT:** Change these passwords immediately in production!

---

## 📊 Admin Dashboard Features

### 1. Overview Section
**What you see:**
- Total orders (all time)
- Pending orders needing attention
- Low stock alerts
- Recent orders table

**What you can do:**
- Quick status of your business
- See what needs immediate attention
- Click any order to view details

### 2. Orders Section
**Features:**
- View ALL customer orders
- Filter by status: All/Pending/Ready/Completed
- See customer details, product requested, quantity
- Update order status
- Delete orders if needed

**Typical Workflow:**
1. New order comes in → Status: **PENDING**
2. You prepare the materials → Click "Mark as Ready" → Status: **READY**
3. Student picks up → Click "Mark as Completed" → Status: **COMPLETED**
4. System automatically reduces inventory when completed

### 3. Inventory Section
**Features:**
- View all products and stock levels
- Low stock warnings (red badge)
- Add new products
- Edit product details
- Adjust stock levels quickly

**Managing Stock:**
- Click "Adjust Stock" on any product
- Enter +20 to add 20 units
- Enter -15 to remove 15 units
- System tracks automatically

**Adding Custom Products:**
When a student requests something not in stock:
1. Click "+ Add New Product"
2. Fill in details
3. Set initial stock to 0
4. Now you can track it!

### 4. Customers Section
**Features:**
- See all customers who've ordered
- Total orders per customer
- Contact information
- Last order date

**Use Cases:**
- Identify repeat customers
- Contact customers about their orders
- Build customer relationships

### 5. Analytics Section
**Business Insights:**
- Most popular product
- Average order size
- Total unique customers
- Fulfillment rate (% of completed orders)

**Use this to:**
- Know what to stock more of
- Track business growth
- Measure performance

---

## 🔧 Backend Technical Details

### Database Class: `AtelierDB`

**Key Methods:**

```javascript
// Get data
const orders = db.getData('orders');

// Save data
db.saveData('orders', updatedOrders);

// Generate new ID
const newId = db.generateId('orders');
```

### Data Structure Examples:

**Order Object:**
```javascript
{
  id: 1,
  customerName: "Ahmed El Amrani",
  email: "ahmed@um6p.ma",
  phone: "+212612345678",
  productName: "Papier Plume 0.5",
  quantity: 50,
  pickup: "campus",
  message: "Need by Friday",
  status: "pending", // or "ready" or "completed"
  createdAt: "2026-01-22T10:30:00Z"
}
```

**Product Object:**
```javascript
{
  id: 1,
  name: "Papier Plume 0.5",
  category: "Paper",
  stock: 50,
  minStock: 10,
  unit: "sheets",
  description: "Premium quality paper",
  price: null, // Can add pricing later
  createdAt: "2026-01-22T10:00:00Z"
}
```

---

## 🚀 Upgrading to Real Backend (Future)

### When you need it:
- Multiple staff accessing simultaneously
- Want data accessible from any device
- Need automatic backups
- Processing 50+ orders per day

### Migration Path:

**Option 1: Google Sheets (Easiest)**
- Use Google Sheets API
- Data visible in spreadsheet
- No coding needed
- Cost: Free

**Option 2: Firebase (Recommended)**
- Google's real-time database
- Free tier: 1GB storage
- Easy authentication
- Minimal code changes needed

**Option 3: Full Backend**
- Node.js + Express + MongoDB
- Full control and scalability
- Need hosting ($5-10/month)

### How to Migrate:

Current localStorage code can be swapped with API calls:

```javascript
// Current (localStorage)
const orders = db.getData('orders');

// Future (API)
const orders = await fetch('/api/orders').then(r => r.json());
```

The admin dashboard UI stays the same!

---

## 🔒 Security Best Practices

### Immediate Actions:

1. **Change Default Passwords**
   - Edit `admin-backend.js`, line 16-17
   - Use strong passwords

2. **Hide Admin URL**
   - Don't link it from main site
   - Use obscure path name

3. **HTTPS Only**
   - Use SSL certificate (free with most hosts)
   - Prevents password interception

4. **Regular Backups**
   - Export data weekly (feature coming)
   - Store in Google Drive

### For Production:

1. Use proper authentication (Firebase Auth, Auth0)
2. Rate limit login attempts
3. Add CAPTCHA to prevent bots
4. Encrypt sensitive data
5. Set up proper user roles (admin, staff, viewer)

---

## 📱 Mobile Access

The admin dashboard is **fully responsive**:
- Works on phones and tablets
- Touch-friendly buttons
- Optimized layouts
- Manage orders on the go!

---

## 💡 Tips for Staff Training

### For Order Management:
1. Check dashboard daily for new orders
2. Update status as you process orders
3. Use "View" to see full details and contact info
4. Always mark as "Completed" after pickup (tracks inventory)

### For Inventory:
1. Set minimum stock levels realistically
2. Reorder when you see red "LOW STOCK" badges
3. Adjust stock immediately after receiving deliveries
4. Use "Other" category for custom materials

### For Analytics:
1. Check weekly to understand trends
2. Stock more of popular items
3. Track fulfillment rate (aim for 95%+)

---

## 🐛 Troubleshooting

**Problem: Can't login**
- Check username/password spelling
- Clear browser cache
- Try different browser

**Problem: Orders not showing**
- Check customer website and admin are on same domain
- Both need access to same localStorage
- Don't use incognito mode

**Problem: Lost all data**
- LocalStorage cleared (browser data cleared)
- Set up backups!
- Migrate to proper backend

**Problem: Multiple staff can't access same data**
- LocalStorage is per-browser
- Time to upgrade to Firebase or backend

---

## 📞 Support & Customization

This system is designed to be easily customizable. Common requests:

**Add Email Notifications:**
```javascript
// After order submission, add:
await fetch('/api/send-email', {
  method: 'POST',
  body: JSON.stringify({ to: 'staff@atelier.com', order: newOrder })
});
```

**Add Pricing:**
1. Enable price field in products
2. Calculate total in order details
3. Add payment tracking

**Add Images:**
1. Use image hosting (Imgur, Cloudinary)
2. Add `imageUrl` to product object
3. Display in product cards

**WhatsApp Integration:**
```javascript
// Add to order details view
<a href="https://wa.me/${order.phone}">Contact on WhatsApp</a>
```

---

## 🎓 Learning Resources

To customize further, learn:
- **HTML/CSS**: UI changes
- **JavaScript**: Functionality
- **localStorage API**: Data handling
- **Firebase**: Real database
- **REST APIs**: Backend communication

---

## ✅ Pre-Launch Checklist

- [ ] Changed default passwords
- [ ] Tested order flow (customer → admin)
- [ ] Set minimum stock levels
- [ ] Added all products to inventory
- [ ] Hidden admin URL chosen
- [ ] Staff trained on dashboard
- [ ] Backup plan in place
- [ ] Mobile tested
- [ ] Contact info on customer site correct

---

## 🚢 Deployment

### Hosting Options:

**Free Options:**
1. **GitHub Pages**
   - Upload files to repository
   - Enable GitHub Pages
   - Custom domain supported

2. **Netlify**
   - Drag & drop deployment
   - Automatic HTTPS
   - Custom domain

3. **Vercel**
   - Similar to Netlify
   - Great performance

### Files to Upload:
- `architecture-store.html` → Main site (index.html)
- `admin-dashboard.html` → Secret path
- `admin-backend.js` → Same directory as admin dashboard

**All three files work together through localStorage!**

---

## 📈 Scaling Roadmap

### Phase 1: Current Setup (0-50 orders/week)
✅ LocalStorage
✅ Manual order management
✅ Basic analytics

### Phase 2: Growth (50-200 orders/week)
- Migrate to Firebase
- Add email notifications
- Automated low stock alerts
- Export features

### Phase 3: Established (200+ orders/week)
- Full backend with database
- Payment integration
- Mobile app
- Multiple locations
- Advanced analytics

---

## 📝 Notes

- **Data Persistence**: LocalStorage is permanent unless browser data is cleared
- **Concurrent Access**: Same browser = same data. Different browsers = different data.
- **Capacity**: LocalStorage can store ~5-10MB (thousands of orders)
- **Performance**: Instant - no server delays

---

## 🎉 You're Ready!

This system gives you everything you need to:
- Take orders professionally
- Manage inventory efficiently  
- Track business performance
- Scale as you grow

Start simple, learn as you go, upgrade when needed!

**Questions? Check the code comments or reach out for help!**