// ATELIER Admin Backend System - GitHub Database Version
// All data is stored in registry.json on GitHub

// ============================================
// PASSWORD ENCODING/DECODING
// ============================================

function encodePassword(password) {
    // Simple Base64 encoding (not encryption, just obscuration)
    return btoa(password);
}

function decodePassword(encoded) {
    try {
        return atob(encoded);
    } catch (e) {
        return null;
    }
}

// ============================================
// GITHUB DATABASE CLASS
// ============================================

class GitHubDB {
    constructor() {
        this.data = null;
        this.sha = null; // GitHub requires SHA for updates
        this.isLoading = false;
        this.loadAttempts = 0;
        this.maxRetries = 3;
    }

    async initialize() {
        console.log('🔄 Initializing database from GitHub...');
        await this.loadFromGitHub();
    }

    async loadFromGitHub() {
        if (this.isLoading) {
            console.log('⏳ Already loading...');
            return;
        }

        this.isLoading = true;
        this.loadAttempts++;

        try {
            const response = await fetch(GITHUB_API.getFileUrl(), {
                headers: GITHUB_API.headers
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            this.sha = result.sha; // Store SHA for future updates
            
            // Decode Base64 content
            const content = atob(result.content);
            this.data = JSON.parse(content);
            
            console.log('✅ Database loaded successfully from GitHub');
            console.log('📊 Data:', {
                users: this.data.users?.length || 0,
                products: this.data.products?.length || 0,
                orders: this.data.orders?.length || 0,
                quotes: this.data.quotes?.length || 0
            });

            this.isLoading = false;
            this.loadAttempts = 0;
            return true;

        } catch (error) {
            console.error('❌ Failed to load from GitHub:', error);
            
            // Retry logic
            if (this.loadAttempts < this.maxRetries) {
                console.log(`🔄 Retry attempt ${this.loadAttempts}/${this.maxRetries}...`);
                this.isLoading = false;
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                return await this.loadFromGitHub();
            }

            // If all retries failed, use fallback
            console.warn('⚠️ Using fallback local data');
            this.useFallbackData();
            this.isLoading = false;
            return false;
        }
    }

    useFallbackData() {
        // Fallback to default data if GitHub fails
        this.data = {
            users: [
                { 
                    id: 1, 
                    username: 'admin', 
                    password: encodePassword('atelier2026'), 
                    role: 'admin', 
                    name: 'Admin User', 
                    createdAt: new Date().toISOString() 
                }
            ],
            products: [],
            orders: [],
            customers: [],
            quotes: [
                {
                    id: 1,
                    text: "Architecture is the learned game, correct and magnificent, of forms assembled in the light.",
                    author: "Le Corbusier",
                    createdAt: new Date().toISOString()
                }
            ],
            _metadata: {
                lastUpdated: new Date().toISOString(),
                version: "1.0",
                note: "FALLBACK MODE - Changes won't be saved to GitHub"
            }
        };
    }

    async saveToGitHub() {
        if (!this.sha) {
            console.error('❌ Cannot save: No SHA available. Load data first.');
            return false;
        }

        try {
            // Update metadata
            if (!this.data._metadata) {
                this.data._metadata = {};
            }
            this.data._metadata.lastUpdated = new Date().toISOString();

            // Convert data to Base64
            const content = btoa(JSON.stringify(this.data, null, 2));

            const body = {
                message: `Update ATELIER data - ${new Date().toLocaleString()}`,
                content: content,
                sha: this.sha,
                branch: GITHUB_CONFIG.branch
            };

            console.log('💾 Saving to GitHub...');

            const response = await fetch(GITHUB_API.getFileUrl(), {
                method: 'PUT',
                headers: GITHUB_API.headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            this.sha = result.content.sha; // Update SHA for next save
            
            console.log('✅ Data saved successfully to GitHub');
            return true;

        } catch (error) {
            console.error('❌ Failed to save to GitHub:', error);
            alert('⚠️ Failed to save changes to GitHub. Please check your connection and try again.');
            return false;
        }
    }

    getData(key) {
        if (!this.data) {
            console.warn('⚠️ Database not loaded yet');
            return null;
        }
        return this.data[key] || null;
    }

    async saveData(key, value) {
        if (!this.data) {
            console.error('❌ Database not loaded yet');
            return false;
        }
        
        this.data[key] = value;
        return await this.saveToGitHub();
    }

    generateId(collection) {
        const items = this.getData(collection) || [];
        return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    }
}

// ============================================
// INITIALIZE DATABASE
// ============================================

const db = new GitHubDB();
let currentUser = null;
let isInitialized = false;

// Show loading screen
function showLoading(message = 'Loading...') {
    const existingLoader = document.getElementById('globalLoader');
    if (existingLoader) {
        existingLoader.querySelector('p').textContent = message;
        return;
    }

    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 15, 15, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        flex-direction: column;
    `;
    
    loader.innerHTML = `
        <div style="
            width: 50px;
            height: 50px;
            border: 3px solid #2a2a2a;
            border-top-color: #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <p style="
            color: #00ff88;
            margin-top: 1rem;
            font-family: 'JetBrains Mono', monospace;
        ">${message}</p>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.remove();
    }
}

// Initialize on page load
async function initializeSystem() {
    if (isInitialized) return;
    
    showLoading('Connecting to database...');
    
    try {
        await db.initialize();
        isInitialized = true;
        hideLoading();
        console.log('✅ System initialized successfully');
    } catch (error) {
        console.error('❌ System initialization failed:', error);
        hideLoading();
        alert('Failed to connect to database. Please refresh the page.');
    }
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
} else {
    initializeSystem();
}

// ============================================
// AUTHENTICATION
// ============================================

document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!isInitialized) {
        alert('⚠️ System is still loading. Please wait...');
        return;
    }
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const users = db.getData('users');
    if (!users) {
        alert('❌ Failed to load user data');
        return;
    }
    
    // Find user and decode password
    const user = users.find(u => {
        const decodedPass = decodePassword(u.password);
        return u.username === username && decodedPass === password;
    });
    
    if (user) {
        currentUser = user;
        sessionStorage.setItem('atelier_temp_session', JSON.stringify({
            userId: user.id,
            username: user.username,
            timestamp: Date.now()
        }));
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
    sessionStorage.removeItem('atelier_temp_session');
    currentUser = null;
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('loginForm').reset();
}

// Check for session on page load (but don't auto-login)
window.addEventListener('load', () => {
    const session = sessionStorage.getItem('atelier_temp_session');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            // Session expires after 1 hour
            if (Date.now() - sessionData.timestamp < 3600000) {
                const users = db.getData('users');
                const user = users?.find(u => u.id === sessionData.userId);
                if (user) {
                    currentUser = user;
                    // Don't auto-show dashboard - require manual action
                }
            }
        } catch (e) {
            sessionStorage.removeItem('atelier_temp_session');
        }
    }
});

// ============================================
// NAVIGATION
// ============================================

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        const sectionId = this.dataset.section;
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
        
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
        case 'quotes':
            loadQuotesTable();
            break;
        case 'users':
            loadUsersTable();
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
    const recentOrders = orders.slice(-5).reverse();
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Order ID</th><th>Customer</th><th>Items</th><th>Status</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    if (recentOrders.length === 0) {
        html += '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No orders yet</td></tr>';
    } else {
        recentOrders.forEach(order => {
            let itemsDisplay = '';
            if (order.items && Array.isArray(order.items)) {
                itemsDisplay = order.items.map(item => `${item.quantity}x ${item.material}`).join(', ');
            } else if (order.productName) {
                itemsDisplay = `${order.quantity}x ${order.productName}`;
            }
            
            html += `<tr>
                <td>#${order.id}</td>
                <td>${order.customerName}</td>
                <td style="max-width: 300px;">${itemsDisplay}</td>
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
    html += '<th>ID</th><th>Customer</th><th>Email</th><th>Phone</th><th>Items</th><th>Pickup</th><th>Status</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    if (filteredOrders.length === 0) {
        html += '<tr><td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No orders found</td></tr>';
    } else {
        filteredOrders.reverse().forEach(order => {
            let itemsDisplay = '';
            if (order.items && Array.isArray(order.items)) {
                itemsDisplay = order.items.map(item => `${item.quantity}x ${item.material}`).join(', ');
            } else if (order.productName) {
                itemsDisplay = `${order.quantity}x ${order.productName}`;
            }
            
            html += `<tr>
                <td>#${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.email}</td>
                <td>${order.phone}</td>
                <td style="max-width: 300px;">${itemsDisplay}</td>
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
    
    if (products.length === 0) {
        html += '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No products yet</td></tr>';
    } else {
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
                    <button class="action-btn danger" onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            </tr>`;
        });
    }
    
    html += '</tbody></table>';
    document.getElementById('inventoryTable').innerHTML = html;
}

function loadCustomersTable() {
    const orders = db.getData('orders') || [];
    
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
    
    const productCounts = {};
    orders.forEach(order => {
        if (order.productName) {
            productCounts[order.productName] = (productCounts[order.productName] || 0) + 1;
        }
    });
    const topProduct = Object.keys(productCounts).length > 0 
        ? Object.keys(productCounts).reduce((a, b) => productCounts[a] > productCounts[b] ? a : b)
        : '—';
    
    const avgSize = orders.length > 0 
        ? Math.round(orders.reduce((sum, o) => sum + (o.quantity || 1), 0) / orders.length)
        : 0;
    
    const uniqueCustomers = new Set(orders.map(o => o.email)).size;
    
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
    
    let itemsHTML = '';
    if (order.items && Array.isArray(order.items)) {
        itemsHTML = `
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">ITEMS ORDERED</p>
                <ul style="margin-top: 0.5rem; padding-left: 1.2rem;">
                    ${order.items.map(item => `<li>${item.quantity}x ${item.material}</li>`).join('')}
                </ul>
            </div>
        `;
    } else if (order.productName) {
        itemsHTML = `
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">PRODUCT</p>
                <p>${order.productName}</p>
            </div>
            <div>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">QUANTITY</p>
                <p>${order.quantity}</p>
            </div>
        `;
    }
    
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
            ${itemsHTML}
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

async function changeOrderStatus(orderId, newStatus) {
    const orders = db.getData('orders');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        order.status = newStatus;
        order.updatedAt = new Date().toISOString();
        
        showLoading('Saving changes...');
        const success = await db.saveData('orders', orders);
        hideLoading();
        
        if (success) {
            closeModal('orderModal');
            loadDashboardData();
            loadOrdersTable();
            
            if (newStatus === 'completed' && order.productName) {
                await updateProductStock(order.productName, -order.quantity);
            }
        }
    }
}

async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    let orders = db.getData('orders');
    orders = orders.filter(o => o.id !== orderId);
    
    showLoading('Deleting order...');
    const success = await db.saveData('orders', orders);
    hideLoading();
    
    if (success) {
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
                <label>Product Image URL</label>
                <input type="text" class="input-field" id="productImage" value="${product.image || ''}" placeholder="https://example.com/image.jpg">
            </div>
            <div class="form-group">
                <label>Icon/Emoji (if no image)</label>
                <input type="text" class="input-field" id="productIcon" value="${product.icon || '📄'}" maxlength="2">
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
                <label>Price (optional)</label>
                <input type="text" class="input-field" id="productPrice" value="${product.price || ''}" placeholder="50 MAD or leave blank">
            </div>
            <div class="form-group">
                <label>Unit</label>
                <input type="text" class="input-field" id="productUnit" value="${product.unit}" required>
            </div>
            <div class="form-group">
                <label>Short Description</label>
                <input type="text" class="input-field" id="productSpecs" value="${product.specs || ''}" placeholder="Premium quality • Perfect for detailed work">
            </div>
            <div class="form-group">
                <label>Full Description</label>
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
                <label>Product Image URL</label>
                <input type="text" class="input-field" id="productImage" placeholder="https://example.com/image.jpg">
            </div>
            <div class="form-group">
                <label>Icon/Emoji (if no image)</label>
                <input type="text" class="input-field" id="productIcon" value="📄" maxlength="2">
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
                <label>Price (optional)</label>
                <input type="text" class="input-field" id="productPrice" placeholder="50 MAD or leave blank">
            </div>
            <div class="form-group">
                <label>Unit</label>
                <input type="text" class="input-field" id="productUnit" value="sheets" required>
            </div>
            <div class="form-group">
                <label>Short Description (specs)</label>
                <input type="text" class="input-field" id="productSpecs" placeholder="Premium quality • Perfect for detailed work">
            </div>
            <div class="form-group">
                <label>Full Description</label>
                <textarea class="input-field" id="productDescription" rows="3"></textarea>
            </div>
            <button type="submit" class="action-btn primary" style="width: 100%;">Add Product</button>
        </form>
    `;
    
    document.getElementById('inventoryForm').innerHTML = html;
    document.getElementById('inventoryModal').classList.add('active');
}

async function saveProduct(event, productId = null) {
    event.preventDefault();
    
    const products = db.getData('products');
    
    const productData = {
        name: document.getElementById('productName').value,
        image: document.getElementById('productImage').value || null,
        icon: document.getElementById('productIcon').value || '📄',
        category: document.getElementById('productCategory').value,
        stock: parseInt(document.getElementById('productStock').value),
        minStock: parseInt(document.getElementById('productMinStock').value),
        price: document.getElementById('productPrice').value || null,
        unit: document.getElementById('productUnit').value,
        specs: document.getElementById('productSpecs').value || '',
        description: document.getElementById('productDescription').value
    };
    
    if (productId) {
        const index = products.findIndex(p => p.id === productId);
        products[index] = { ...products[index], ...productData, updatedAt: new Date().toISOString() };
    } else {
        productData.id = db.generateId('products');
        productData.createdAt = new Date().toISOString();
        products.push(productData);
    }
    
    showLoading('Saving product...');
    const success = await db.saveData('products', products);
    hideLoading();
    
    if (success) {
        closeModal('inventoryModal');
        loadInventoryTable();
    }
}

async function adjustStock(productId) {
    const products = db.getData('products');
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    const adjustment = prompt(`Current stock: ${product.stock} ${product.unit}\n\nEnter stock adjustment (+/- number):`, '+0');
    
    if (adjustment !== null) {
        const adjustmentValue = parseInt(adjustment);
        if (!isNaN(adjustmentValue)) {
            product.stock += adjustmentValue;
            product.updatedAt = new Date().toISOString();
            
            showLoading('Updating stock...');
            const success = await db.saveData('products', products);
            hideLoading();
            
            if (success) {
                loadInventoryTable();
                loadOverviewStats();
            }
        }
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
    
    let products = db.getData('products');
    products = products.filter(p => p.id !== productId);
    
    showLoading('Deleting product...');
    const success = await db.saveData('products', products);
    hideLoading();
    
    if (success) {
        loadInventoryTable();
        loadOverviewStats();
    }
}

async function updateProductStock(productName, quantityChange) {
    const products = db.getData('products');
    const product = products.find(p => p.name === productName);
    
    if (product) {
        product.stock += quantityChange;
        product.updatedAt = new Date().toISOString();
        await db.saveData('products', products);
    }
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

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
// USER MANAGEMENT
// ============================================

let userAccessClicks = 0;
let userAccessTimer = null;

document.getElementById('secretTrigger')?.addEventListener('click', function(e) {
    userAccessClicks++;
    
    if (userAccessClicks === 1) {
        this.style.opacity = '0.5';
        userAccessTimer = setTimeout(() => {
            userAccessClicks = 0;
            document.getElementById('secretTrigger').style.opacity = '0.3';
        }, 2000);
    }
    
    if (userAccessClicks === 2) {
        this.style.opacity = '0.7';
        this.style.color = 'var(--accent)';
    }
    
    if (userAccessClicks === 3) {
        clearTimeout(userAccessTimer);
        userAccessClicks = 0;
        
        const userNav = document.getElementById('userManagementNav');
        userNav.style.display = 'block';
        userNav.style.animation = 'fadeIn 0.5s ease';
        
        this.textContent = '🔓 v1.0';
        this.style.color = 'var(--success)';
        
        setTimeout(() => {
            userNav.style.background = 'var(--accent-dim)';
            setTimeout(() => {
                userNav.style.background = '';
            }, 500);
        }, 100);
    }
});

function loadUsersTable() {
    const users = db.getData('users') || [];
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>ID</th><th>Username</th><th>Name</th><th>Role</th><th>Created</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    users.forEach(user => {
        const roleColor = user.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)';
        html += `<tr>
            <td>${user.id}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.name}</td>
            <td style="color: ${roleColor}; text-transform: uppercase; font-weight: 600;">${user.role}</td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
            <td>
                <button class="action-btn" onclick="editUser(${user.id})">Edit</button>
                ${user.id > 1 ? `<button class="action-btn danger" onclick="deleteUser(${user.id})">Delete</button>` : ''}
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('usersTable').innerHTML = html;
}

function openAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add New User';
    
    let html = `
        <form id="userFormElement" onsubmit="saveUser(event)">
            <div class="form-group">
                <label>Username</label>
                <input type="text" class="input-field" id="userUsername" required>
            </div>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="input-field" id="userName" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" class="input-field" id="userPassword" required>
            </div>
            <div class="form-group">
                <label>Role</label>
                <select class="input-field" id="userRole" required>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <button type="submit" class="action-btn primary" style="width: 100%;">Add User</button>
        </form>
    `;
    
    document.getElementById('userForm').innerHTML = html;
    document.getElementById('userModal').classList.add('active');
}

function editUser(userId) {
    const users = db.getData('users');
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    document.getElementById('userModalTitle').textContent = 'Edit User';
    
    let html = `
        <form id="userFormElement" onsubmit="saveUser(event, ${userId})">
            <div class="form-group">
                <label>Username</label>
                <input type="text" class="input-field" id="userUsername" value="${user.username}" required>
            </div>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="input-field" id="userName" value="${user.name}" required>
            </div>
            <div class="form-group">
                <label>New Password (leave blank to keep current)</label>
                <input type="password" class="input-field" id="userPassword" placeholder="Leave blank to keep current">
            </div>
            <div class="form-group">
                <label>Role</label>
                <select class="input-field" id="userRole" required>
                    <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </div>
            <button type="submit" class="action-btn primary" style="width: 100%;">Save Changes</button>
        </form>
    `;
    
    document.getElementById('userForm').innerHTML = html;
    document.getElementById('userModal').classList.add('active');
}

async function saveUser(event, userId = null) {
    event.preventDefault();
    
    const users = db.getData('users');
    
    const userData = {
        username: document.getElementById('userUsername').value,
        name: document.getElementById('userName').value,
        role: document.getElementById('userRole').value
    };
    
    const password = document.getElementById('userPassword').value;
    
    if (userId) {
        const index = users.findIndex(u => u.id === userId);
        users[index] = { 
            ...users[index], 
            ...userData, 
            ...(password ? { password: encodePassword(password) } : {}),
            updatedAt: new Date().toISOString() 
        };
    } else {
        if (!password) {
            alert('Password is required for new users');
            return;
        }
        userData.id = db.generateId('users');
        userData.password = encodePassword(password);
        userData.createdAt = new Date().toISOString();
        users.push(userData);
    }
    
    showLoading('Saving user...');
    const success = await db.saveData('users', users);
    hideLoading();
    
    if (success) {
        closeModal('userModal');
        loadUsersTable();
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    
    let users = db.getData('users');
    users = users.filter(u => u.id !== userId);
    
    showLoading('Deleting user...');
    const success = await db.saveData('users', users);
    hideLoading();
    
    if (success) {
        loadUsersTable();
    }
}

// ============================================
// QUOTE MANAGEMENT
// ============================================

function loadQuotesTable() {
    const quotes = db.getData('quotes') || [];
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>ID</th><th>Quote</th><th>Author</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    if (quotes.length === 0) {
        html += '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No quotes yet</td></tr>';
    } else {
        quotes.forEach(quote => {
            html += `<tr>
                <td>${quote.id}</td>
                <td style="max-width: 500px;">${quote.text}</td>
                <td>${quote.author}</td>
                <td>
                    <button class="action-btn" onclick="editQuote(${quote.id})">Edit</button>
                    <button class="action-btn danger" onclick="deleteQuote(${quote.id})">Delete</button>
                </td>
            </tr>`;
        });
    }
    
    html += '</tbody></table>';
    
    if (quotes.length > 0) {
        html += `<p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
            💡 Quotes are randomly displayed on the store and change every 10 seconds
        </p>`;
    }
    
    document.getElementById('quotesTable').innerHTML = html;
}

function openAddQuoteModal() {
    document.getElementById('quoteModalTitle').textContent = 'Add New Quote';
    
    let html = `
        <form id="quoteFormElement" onsubmit="saveQuote(event)">
            <div class="form-group">
                <label>Quote Text</label>
                <textarea class="input-field" id="quoteText" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label>Author</label>
                <input type="text" class="input-field" id="quoteAuthor" required>
            </div>
            <button type="submit" class="action-btn primary" style="width: 100%;">Add Quote</button>
        </form>
    `;
    
    document.getElementById('quoteForm').innerHTML = html;
    document.getElementById('quoteModal').classList.add('active');
}

function editQuote(quoteId) {
    const quotes = db.getData('quotes');
    const quote = quotes.find(q => q.id === quoteId);
    
    if (!quote) return;
    
    document.getElementById('quoteModalTitle').textContent = 'Edit Quote';
    
    let html = `
        <form id="quoteFormElement" onsubmit="saveQuote(event, ${quoteId})">
            <div class="form-group">
                <label>Quote Text</label>
                <textarea class="input-field" id="quoteText" rows="4" required>${quote.text}</textarea>
            </div>
            <div class="form-group">
                <label>Author</label>
                <input type="text" class="input-field" id="quoteAuthor" value="${quote.author}" required>
            </div>
            <button type="submit" class="action-btn primary" style="width: 100%;">Save Changes</button>
        </form>
    `;
    
    document.getElementById('quoteForm').innerHTML = html;
    document.getElementById('quoteModal').classList.add('active');
}

async function saveQuote(event, quoteId = null) {
    event.preventDefault();
    
    const quotes = db.getData('quotes');
    const text = document.getElementById('quoteText').value;
    const author = document.getElementById('quoteAuthor').value;
    
    if (quoteId) {
        const index = quotes.findIndex(q => q.id === quoteId);
        quotes[index] = { 
            ...quotes[index], 
            text, 
            author,
            updatedAt: new Date().toISOString() 
        };
    } else {
        const newQuote = {
            id: db.generateId('quotes'),
            text,
            author,
            createdAt: new Date().toISOString()
        };
        quotes.push(newQuote);
    }
    
    showLoading('Saving quote...');
    const success = await db.saveData('quotes', quotes);
    hideLoading();
    
    if (success) {
        closeModal('quoteModal');
        loadQuotesTable();
    }
}

async function deleteQuote(quoteId) {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    
    let quotes = db.getData('quotes');
    quotes = quotes.filter(q => q.id !== quoteId);
    
    showLoading('Deleting quote...');
    const success = await db.saveData('quotes', quotes);
    hideLoading();
    
    if (success) {
        loadQuotesTable();
    }
}
