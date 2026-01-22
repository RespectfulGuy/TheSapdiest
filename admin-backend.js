// ATELIER Admin Backend System
// Uses localStorage as a simple database (can be upgraded to real backend later)

// ============================================
// DATABASE STRUCTURE & INITIALIZATION
// ============================================

class AtelierDB {
    constructor() {
        this.initializeDB();
    }

    initializeDB() {
        // Initialize default data if not exists
        if (!localStorage.getItem('atelier_users')) {
            const defaultUsers = [
                { id: 1, username: 'admin', password: 'atelier2026', role: 'admin', name: 'Admin User' },
                { id: 2, username: 'staff', password: 'staff123', role: 'staff', name: 'Staff Member' }
            ];
            this.saveData('users', defaultUsers);
        }

        if (!localStorage.getItem('atelier_products')) {
            const defaultProducts = [
                {
                    id: 1,
                    name: 'Papier Plume 0.5',
                    category: 'Paper',
                    stock: 50,
                    minStock: 10,
                    price: null, // Set when needed
                    unit: 'sheets',
                    description: 'Premium quality paper for detailed work',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Papier Raisin 300g/m²',
                    category: 'Paper',
                    stock: 30,
                    minStock: 5,
                    price: null,
                    unit: 'sheets',
                    description: 'Heavy weight watercolor ready paper',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Papier Raisin 90g/m²',
                    category: 'Paper',
                    stock: 100,
                    minStock: 20,
                    price: null,
                    unit: 'sheets',
                    description: 'Lightweight versatile paper',
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveData('products', defaultProducts);
        }

        if (!localStorage.getItem('atelier_orders')) {
            this.saveData('orders', []);
        }

        if (!localStorage.getItem('atelier_customers')) {
            this.saveData('customers', []);
        }
    }

    getData(key) {
        const data = localStorage.getItem(`atelier_${key}`);
        return data ? JSON.parse(data) : null;
    }

    saveData(key, data) {
        localStorage.setItem(`atelier_${key}`, JSON.stringify(data));
    }

    // Generate unique ID
    generateId(collection) {
        const items = this.getData(collection) || [];
        return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    }
}

const db = new AtelierDB();

// ============================================
// AUTHENTICATION
// ============================================

let currentUser = null;

document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const users = db.getData('users');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        sessionStorage.setItem('atelier_session', JSON.stringify(user));
        showDashboard();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

function showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('currentUser').textContent = currentUser.name;
    loadDashboardData();
}

function logout() {
    sessionStorage.removeItem('atelier_session');
    currentUser = null;
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('loginForm').reset();
}

// Check for existing session on load
window.addEventListener('load', function() {
    const session = sessionStorage.getItem('atelier_session');
    if (session) {
        currentUser = JSON.parse(session);
        showDashboard();
    }
});

// ============================================
// NAVIGATION
// ============================================

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding section
        const sectionId = this.dataset.section;
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
        
        // Load section data
        loadSectionData(sectionId);
    });
});

// ============================================
// DATA LOADING & DISPLAY
// ============================================

function loadDashboardData() {
    loadOverviewStats();
    loadSectionData('overview');
}

function loadSectionData(section) {
    switch(section) {
        case 'overview':
            loadOverviewStats();
            loadRecentOrders();
            break;
        case 'orders':
            loadOrdersTable();
            break;
        case 'inventory':
            loadInventoryTable();
            break;
        case 'customers':
            loadCustomersTable();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

function loadOverviewStats() {
    const orders = db.getData('orders') || [];
    const products = db.getData('products') || [];
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const lowStockItems = products.filter(p => p.stock <= p.minStock).length;
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('lowStock').textContent = lowStockItems;
}

function loadRecentOrders() {
    const orders = db.getData('orders') || [];
    const recentOrders = orders.slice(-5).reverse(); // Last 5 orders
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Order ID</th><th>Customer</th><th>Product</th><th>Quantity</th><th>Status</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    if (recentOrders.length === 0) {
        html += '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No orders yet</td></tr>';
    } else {
        recentOrders.forEach(order => {
            html += `<tr>
                <td>#${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.productName}</td>
                <td>${order.quantity}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td><button class="action-btn" onclick="viewOrderDetails(${order.id})">View</button></td>
            </tr>`;
        });
    }
    
    html += '</tbody></table>';
    document.getElementById('recentOrdersTable').innerHTML = html;
}

function loadOrdersTable() {
    const orders = db.getData('orders') || [];
    const filter = document.getElementById('orderFilter').value;
    
    let filteredOrders = orders;
    if (filter !== 'all') {
        filteredOrders = orders.filter(o => o.status === filter);
    }
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>ID</th><th>Customer</th><th>Email</th><th>Phone</th><th>Product</th><th>Qty</th><th>Pickup</th><th>Status</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    if (filteredOrders.length === 0) {
        html += '<tr><td colspan="10" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No orders found</td></tr>';
    } else {
        filteredOrders.reverse().forEach(order => {
            html += `<tr>
                <td>#${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.email}</td>
                <td>${order.phone}</td>
                <td>${order.productName}</td>
                <td>${order.quantity}</td>
                <td>${order.pickup}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn" onclick="viewOrderDetails(${order.id})">View</button>
                    <button class="action-btn" onclick="updateOrderStatus(${order.id})">Update</button>
                </td>
            </tr>`;
        });
    }
    
    html += '</tbody></table>';
    document.getElementById('ordersTable').innerHTML = html;
}

function loadInventoryTable() {
    const products = db.getData('products') || [];
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>ID</th><th>Product Name</th><th>Category</th><th>Stock</th><th>Min Stock</th><th>Status</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    products.forEach(product => {
        const stockStatus = product.stock <= product.minStock ? 'low' : 'in-stock';
        html += `<tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock} ${product.unit}</td>
            <td>${product.minStock}</td>
            <td><span class="status-badge status-${stockStatus}">${stockStatus === 'low' ? 'LOW STOCK' : 'IN STOCK'}</span></td>
            <td>
                <button class="action-btn" onclick="editProduct(${product.id})">Edit</button>
                <button class="action-btn" onclick="adjustStock(${product.id})">Adjust Stock</button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('inventoryTable').innerHTML = html;
}

function loadCustomersTable() {
    const orders = db.getData('orders') || [];
    
    // Group orders by customer email
    const customerMap = {};
    orders.forEach(order => {
        if (!customerMap[order.email]) {
            customerMap[order.email] = {
                name: order.customerName,
                email: order.email,
                phone: order.phone,
                orderCount: 0,
                lastOrder: order.createdAt
            };
        }
        customerMap[order.email].orderCount++;
        if (new Date(order.createdAt) > new Date(customerMap[order.email].lastOrder)) {
            customerMap[order.email].lastOrder = order.createdAt;
        }
    });
    
    const customers = Object.values(customerMap);
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Name</th><th>Email</th><th>Phone</th><th>Total Orders</th><th>Last Order</th>';
    html += '</tr></thead><tbody>';
    
    if (customers.length === 0) {
        html += '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No customers yet</td></tr>';
    } else {
        customers.forEach(customer => {
            html += `<tr>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td>${customer.orderCount}</td>
                <td>${new Date(customer.lastOrder).toLocaleDateString()}</td>
            </tr>`;
        });
    }
    
    html += '</tbody></table>';
    document.getElementById('customersTable').innerHTML = html;
}

function loadAnalytics() {
    const orders = db.getData('orders') || [];
    const products = db.getData('products') || [];
    
    // Most popular product
    const productCounts = {};
    orders.forEach(order => {
        productCounts[order.productName] = (productCounts[order.productName] || 0) + 1;
    });
    const topProduct = Object.keys(productCounts).reduce((a, b) => 
        productCounts[a] > productCounts[b] ? a : b, '—');
    
    // Average order size
    const avgSize = orders.length > 0 
        ? Math.round(orders.reduce((sum, o) => sum + o.quantity, 0) / orders.length)
        : 0;
    
    // Unique customers
    const uniqueCustomers = new Set(orders.map(o => o.email)).size;
    
    // Fulfillment rate
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const fulfillmentRate = orders.length > 0 
        ? Math.round((completedOrders / orders.length) * 100)
        : 0;
    
    document.getElementById('topProduct').textContent = topProduct;
    document.getElementById('avgOrderSize').textContent = avgSize;
    document.getElementById('totalCustomers').textContent = uniqueCustomers;
    document.getElementById('fulfillmentRate').textContent = fulfillmentRate + '%';
}

// ============================================
// ORDER MANAGEMENT
// ============================================

function viewOrderDetails(orderId) {
    const orders = db.getData('orders') || [];
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    let html = `
        <div style="margin-bottom: 1.5rem;">
            <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">ORDER #${order.id}</p>
            <h3 style="margin-bottom: 1rem;">${order.customerName}</h3>
        </div>
        
        <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">EMAIL</p>
                <p>${order.email}</p>
            </div>
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">PHONE</p>
                <p>${order.phone}</p>
            </div>
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">PRODUCT</p>
                <p>${order.productName}</p>
            </div>
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">QUANTITY</p>
                <p>${order.quantity}</p>
            </div>
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">PICKUP LOCATION</p>
                <p>${order.pickup}</p>
            </div>
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">STATUS</p>
                <p><span class="status-badge status-${order.status}">${order.status}</span></p>
            </div>
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">ORDER DATE</p>
                <p>${new Date(order.createdAt).toLocaleString()}</p>
            </div>
            ${order.message ? `
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">ADDITIONAL DETAILS</p>
                <p>${order.message}</p>
            </div>
            ` : ''}
        </div>
        
        <div style="display: flex; gap: 0.5rem;">
            <button class="action-btn primary" onclick="changeOrderStatus(${order.id}, 'ready')">Mark as Ready</button>
            <button class="action-btn" onclick="changeOrderStatus(${order.id}, 'completed')">Mark as Completed</button>
            <button class="action-btn danger" onclick="deleteOrder(${order.id})">Delete Order</button>
        </div>
    `;
    
    document.getElementById('orderDetails').innerHTML = html;
    document.getElementById('orderModal').classList.add('active');
}

function updateOrderStatus(orderId) {
    viewOrderDetails(orderId);
}

function changeOrderStatus(orderId, newStatus) {
    const orders = db.getData('orders');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        order.status = newStatus;
        order.updatedAt = new Date().toISOString();
        db.saveData('orders', orders);
        
        closeModal('orderModal');
        loadDashboardData();
        loadOrdersTable();
        
        // Update product stock if order is completed
        if (newStatus === 'completed') {
            updateProductStock(order.productName, -order.quantity);
        }
    }
}

function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        let orders = db.getData('orders');
        orders = orders.filter(o => o.id !== orderId);
        db.saveData('orders', orders);
        
        closeModal('orderModal');
        loadDashboardData();
        loadOrdersTable();
    }
}

// ============================================
// INVENTORY MANAGEMENT
// ============================================

function editProduct(productId) {
    const products = db.getData('products');
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    document.getElementById('inventoryModalTitle').textContent = 'Edit Product';
    
    let html = `
        <form id="productForm" onsubmit="saveProduct(event, ${productId})">
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" class="input-field" id="productName" value="${product.name}" required>
            </div>
            <div class="form-group">
                <label>Category</label>
                <input type="text" class="input-field" id="productCategory" value="${product.category}" required>
            </div>
            <div class="form-group">
                <label>Current Stock</label>
                <input type="number" class="input-field" id="productStock" value="${product.stock}" required>
            </div>
            <div class="form-group">
                <label>Minimum Stock Level</label>
                <input type="number" class="input-field" id="productMinStock" value="${product.minStock}" required>
            </div>
            <div class="form-group">
                <label>Unit</label>
                <input type="text" class="input-field" id="productUnit" value="${product.unit}" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea class="input-field" id="productDescription" rows="3">${product.description}</textarea>
            </div>
            <button type="submit" class="action-btn primary" style="width: 100%;">Save Changes</button>
        </form>
    `;
    
    document.getElementById('inventoryForm').innerHTML = html;
    document.getElementById('inventoryModal').classList.add('active');
}

function openAddProductModal() {
    document.getElementById('inventoryModalTitle').textContent = 'Add New Product';
    
    let html = `
        <form id="productForm" onsubmit="saveProduct(event)">
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" class="input-field" id="productName" required>
            </div>
            <div class="form-group">
                <label>Category</label>
                <input type="text" class="input-field" id="productCategory" value="Paper" required>
            </div>
            <div class="form-group">
                <label>Initial Stock</label>
                <input type="number" class="input-field" id="productStock" value="0" required>
            </div>
            <div class="form-group">
                <label>Minimum Stock Level</label>
                <input type="number" class="input-field" id="productMinStock" value="10" required>
            </div>
            <div class="form-group">
                <label>Unit</label>
                <input type="text" class="input-field" id="productUnit" value="sheets" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea class="input-field" id="productDescription" rows="3"></textarea>
            </div>
            <button type="submit" class="action-btn primary" style="width: 100%;">Add Product</button>
        </form>
    `;
    
    document.getElementById('inventoryForm').innerHTML = html;
    document.getElementById('inventoryModal').classList.add('active');
}

function saveProduct(event, productId = null) {
    event.preventDefault();
    
    const products = db.getData('products');
    
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        stock: parseInt(document.getElementById('productStock').value),
        minStock: parseInt(document.getElementById('productMinStock').value),
        unit: document.getElementById('productUnit').value,
        description: document.getElementById('productDescription').value,
        price: null
    };
    
    if (productId) {
        // Update existing product
        const index = products.findIndex(p => p.id === productId);
        products[index] = { ...products[index], ...productData, updatedAt: new Date().toISOString() };
    } else {
        // Add new product
        productData.id = db.generateId('products');
        productData.createdAt = new Date().toISOString();
        products.push(productData);
    }
    
    db.saveData('products', products);
    closeModal('inventoryModal');
    loadInventoryTable();
}

function adjustStock(productId) {
    const products = db.getData('products');
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    const adjustment = prompt(`Current stock: ${product.stock} ${product.unit}\n\nEnter stock adjustment (+/- number):`, '+0');
    
    if (adjustment !== null) {
        const adjustmentValue = parseInt(adjustment);
        if (!isNaN(adjustmentValue)) {
            product.stock += adjustmentValue;
            product.updatedAt = new Date().toISOString();
            db.saveData('products', products);
            loadInventoryTable();
            loadOverviewStats();
        }
    }
}

function updateProductStock(productName, quantityChange) {
    const products = db.getData('products');
    const product = products.find(p => p.name === productName);
    
    if (product) {
        product.stock += quantityChange;
        product.updatedAt = new Date().toISOString();
        db.saveData('products', products);
    }
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// ============================================
// ORDER FILTER
// ============================================

document.getElementById('orderFilter')?.addEventListener('change', loadOrdersTable);

// ============================================
// EXPORT FUNCTIONALITY
// ============================================

function exportData(type) {
    const data = db.getData(type);
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atelier_${type}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}