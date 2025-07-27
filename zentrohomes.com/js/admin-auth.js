// Admin Authentication Manager
class AdminAuth {
  constructor() {
    this.baseURL = window.location.origin;
    this.token = localStorage.getItem('admin_token');
    this.isAuthenticated = false;
    this.init();
  }

  async init() {
    // Check if user is already authenticated
    if (this.token) {
      await this.verifyToken();
    }
    
    // Show login form if not authenticated
    if (!this.isAuthenticated) {
      this.showLoginForm();
    } else {
      this.hideLoginForm();
    }
  }

  async verifyToken() {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.isAuthenticated = true;
        return true;
      } else {
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      this.logout();
      return false;
    }
  }

  async login(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = data.token;
        localStorage.setItem('admin_token', this.token);
        this.isAuthenticated = true;
        this.hideLoginForm();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    localStorage.removeItem('admin_token');
    this.showLoginForm();
  }

  showLoginForm() {
    // Create login modal if it doesn't exist
    if (!document.getElementById('admin-login-modal')) {
      this.createLoginModal();
    }
    document.getElementById('admin-login-modal').style.display = 'flex';
  }

  hideLoginForm() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  createLoginModal() {
    const modalHTML = `
      <div id="admin-login-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      ">
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          width: 400px;
          max-width: 90vw;
        ">
          <div style="text-align: center; margin-bottom: 2rem;">
            <img src="../wp-content/themes/zentro/images/logo.png" alt="Zentro Homes" style="height: 40px; margin-bottom: 1rem;">
            <h2 style="color: #171e22; margin: 0;">Admin Login</h2>
          </div>
          
          <form id="admin-login-form">
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; color: #171e22; font-weight: 600;">Username</label>
              <input 
                type="text" 
                id="admin-username" 
                required
                style="
                  width: 100%;
                  padding: 0.75rem;
                  border: 1px solid #dbe0e6;
                  border-radius: 6px;
                  font-size: 1rem;
                  box-sizing: border-box;
                "
              >
            </div>
            
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; color: #171e22; font-weight: 600;">Password</label>
              <input 
                type="password" 
                id="admin-password" 
                required
                style="
                  width: 100%;
                  padding: 0.75rem;
                  border: 1px solid #dbe0e6;
                  border-radius: 6px;
                  font-size: 1rem;
                  box-sizing: border-box;
                "
              >
            </div>
            
            <div id="login-error" style="
              color: #dc2626;
              margin-bottom: 1rem;
              font-size: 0.875rem;
              display: none;
            "></div>
            
            <button 
              type="submit"
              style="
                width: 100%;
                padding: 0.75rem;
                background: #00987a;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s;
              "
              onmouseover="this.style.background='#007d64'"
              onmouseout="this.style.background='#00987a'"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add form submission handler
    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('admin-username').value;
      const password = document.getElementById('admin-password').value;
      const errorDiv = document.getElementById('login-error');
      
      const result = await this.login(username, password);
      
      if (result.success) {
        // Reload page to show admin interface
        window.location.reload();
      } else {
        errorDiv.textContent = result.error;
        errorDiv.style.display = 'block';
      }
    });
  }

  // Get authorization header for API requests
  getAuthHeader() {
    return this.token ? { 'Authorization': `Basic ${this.token}` } : {};
  }

  // Check if user is authenticated
  checkAuth() {
    return this.isAuthenticated;
  }
}

// Initialize admin auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.adminAuth = new AdminAuth();
});

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminAuth;
}