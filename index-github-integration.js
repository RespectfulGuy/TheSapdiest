// This script should be added to index.html to fetch data from GitHub

// Add this to index.html right after the config.js script tag

async function loadProductsFromGitHub() {
    try {
        console.log('🔄 Loading products from GitHub...');
        
        const response = await fetch(GITHUB_API.getFileUrl(), {
            headers: GITHUB_API.headers
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const result = await response.json();
        const content = atob(result.content);
        const data = JSON.parse(content);
        
        // Store in localStorage for offline access
        localStorage.setItem('atelier_products', JSON.stringify(data.products || []));
        localStorage.setItem('atelier_quotes', JSON.stringify(data.quotes || []));
        
        console.log('✅ Products loaded from GitHub');
        
        // Reload products display
        loadProducts();
        loadQuote();
        
    } catch (error) {
        console.warn('⚠️ Failed to load from GitHub, using local data:', error);
        // Fallback to localStorage if GitHub fails
        loadProducts();
        loadQuote();
    }
}

// Save order to GitHub
async function saveOrderToGitHub(orderData) {
    try {
        console.log('💾 Saving order to GitHub...');
        
        // First, get current data
        const response = await fetch(GITHUB_API.getFileUrl(), {
            headers: GITHUB_API.headers
        });

        if (!response.ok) {
            throw new Error('Failed to fetch current data');
        }

        const result = await response.json();
        const content = atob(result.content);
        const data = JSON.parse(content);
        
        // Add new order
        if (!data.orders) data.orders = [];
        orderData.id = data.orders.length > 0 
            ? Math.max(...data.orders.map(o => o.id)) + 1 
            : 1;
        data.orders.push(orderData);
        
        // Update metadata
        if (!data._metadata) data._metadata = {};
        data._metadata.lastUpdated = new Date().toISOString();
        
        // Save back to GitHub
        const newContent = btoa(JSON.stringify(data, null, 2));
        
        const saveResponse = await fetch(GITHUB_API.getFileUrl(), {
            method: 'PUT',
            headers: GITHUB_API.headers,
            body: JSON.stringify({
                message: `New order #${orderData.id} from ${orderData.customerName}`,
                content: newContent,
                sha: result.sha,
                branch: GITHUB_CONFIG.branch
            })
        });

        if (!saveResponse.ok) {
            throw new Error('Failed to save order');
        }

        console.log('✅ Order saved to GitHub');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to save order to GitHub:', error);
        // Fallback to localStorage
        const orders = JSON.parse(localStorage.getItem('atelier_orders') || '[]');
        orderData.id = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
        orders.push(orderData);
        localStorage.setItem('atelier_orders', JSON.stringify(orders));
        console.log('💾 Order saved to localStorage (fallback)');
        return false;
    }
}

// Load products from GitHub when page loads
if (typeof GITHUB_CONFIG !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        loadProductsFromGitHub();
        
        // Refresh products every 30 seconds to get updates
        setInterval(loadProductsFromGitHub, 30000);
    });
}
