/**
 * API Service for Zentro Homes
 * Handles all communication with the backend API
 */
class ApiService {
  constructor() {
    // Set the base URL for the API
    this.baseUrl = window.location.origin + '/api';
    this.authToken = null;
    
    // Initialize authentication if available
    this.initializeAuth();
  }

  /**
   * Initialize authentication from localStorage or session
   */
  initializeAuth() {
    // Check for stored auth token (from Clerk)
    const token = localStorage.getItem('clerk_token') || sessionStorage.getItem('clerk_token');
    if (token) {
      this.setAuthToken(token);
    }
  }

  /**
   * Set authentication token for admin requests
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('clerk_token');
    sessionStorage.removeItem('clerk_token');
  }

  /**
   * Make authenticated request with proper headers
   */
  async makeRequest(url, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add authorization header for admin requests
    if (this.authToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config = {
      headers: defaultHeaders,
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}${url}`, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        this.clearAuthToken();
        if (window.location.pathname.includes('/admin')) {
          // Redirect to admin login if on admin page
          window.location.href = '/admin/login.html';
        }
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  /**
   * Properties API methods
   */

  // Get all properties with optional filters (public)
  async getProperties(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const url = `/properties${queryString ? '?' + queryString : ''}`;
    
    return this.makeRequest(url);
  }

  // Get single property by ID (public)
  async getProperty(id) {
    return this.makeRequest(`/properties/${id}`);
  }

  // Create new property (admin only)
  async createProperty(propertyData) {
    return this.makeRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData)
    });
  }

  // Update property (admin only)
  async updateProperty(id, propertyData) {
    return this.makeRequest(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData)
    });
  }

  // Delete property (admin only)
  async deleteProperty(id) {
    return this.makeRequest(`/properties/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Contacts API methods
   */

  // Submit contact form (public)
  async submitContact(contactData) {
    return this.makeRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
  }

  // Get all contacts (admin only)
  async getContacts(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const url = `/contacts${queryString ? '?' + queryString : ''}`;
    
    return this.makeRequest(url);
  }

  // Get single contact (admin only)
  async getContact(id) {
    return this.makeRequest(`/contacts/${id}`);
  }

  // Update contact status (admin only)
  async updateContactStatus(id, status) {
    return this.makeRequest(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Delete contact (admin only)
  async deleteContact(id) {
    return this.makeRequest(`/contacts/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Upload API methods
   */

  // Upload media files for a property (admin only)
  async uploadPropertyMedia(propertyId, files) {
    const formData = new FormData();
    formData.append('property_id', propertyId);
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    // Don't set Content-Type for FormData - let browser set it with boundary
    const headers = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/upload/property-media`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.status === 401) {
        this.clearAuthToken();
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // Delete image (admin only)
  async deleteImage(imageId) {
    return this.makeRequest(`/upload/image/${imageId}`, {
      method: 'DELETE'
    });
  }

  // Delete video (admin only)
  async deleteVideo(videoId) {
    return this.makeRequest(`/upload/video/${videoId}`, {
      method: 'DELETE'
    });
  }

  // Get property media (admin only)
  async getPropertyMedia(propertyId) {
    return this.makeRequest(`/upload/property/${propertyId}/media`);
  }

  /**
   * Utility methods
   */

  // Check API health
  async checkHealth() {
    try {
      return await this.makeRequest('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Format price for display
  static formatPrice(price, currency = 'KES') {
    if (!price || isNaN(price)) return 'Price on request';
    
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(price);
  }

  // Format date for display
  static formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Debounce function for search inputs
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Create global instance
window.apiService = new ApiService();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
}