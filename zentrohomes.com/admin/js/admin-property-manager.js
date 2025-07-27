// Admin Property Manager - Main admin functionality
class AdminPropertyManager {
  constructor() {
    this.baseURL = window.location.origin;
    this.properties = [];
    this.currentProperty = null;
    this.selectedFiles = { photos: [], videos: [] };
    this.init();
  }

  async init() {
    // Wait for admin auth to be ready
    this.waitForAuth().then(() => {
      this.initializeEventListeners();
      this.initializeNavigation();
      this.loadProperties();
      this.updateDashboard();
    });
  }

  async waitForAuth() {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (window.adminAuth && window.adminAuth.checkAuth()) {
          resolve();
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  }

  initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        if (section) {
          this.showSection(section);
        }
      });
    });

    // Property modal
    const addBtn = document.getElementById('add-property-btn');
    if (addBtn) addBtn.addEventListener('click', () => this.openPropertyModal());

    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closePropertyModal());

    // Property form
    const propertyForm = document.getElementById('property-form');
    if (propertyForm) {
      propertyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProperty();
      });
    }

    // File upload handlers
    this.initializeFileUploads();

    // Search functionality
    const searchInput = document.getElementById('property-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterProperties(e.target.value);
      });
    }

    // Status filters
    document.querySelectorAll('.status-filter').forEach(filter => {
      filter.addEventListener('click', (e) => {
        e.preventDefault();
        const status = filter.dataset.status;
        this.filterByStatus(status);
      });
    });
  }

  initializeNavigation() {
    // Show properties section by default
    this.showSection('properties');
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.add('hidden');
    });

    // Show selected section
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
      section.classList.remove('hidden');
    }

    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.section === sectionName) {
        item.classList.add('active');
      }
    });

    // Load section-specific data
    switch (sectionName) {
      case 'dashboard':
        this.updateDashboard();
        break;
      case 'properties':
        this.loadProperties();
        break;
      case 'media':
        this.loadMediaSection();
        break;
    }
  }

  async loadProperties() {
    try {
      const response = await fetch(`${this.baseURL}/api/properties`, {
        headers: window.adminAuth.getAuthHeader()
      });

      if (response.ok) {
        this.properties = await response.json();
        this.renderProperties(this.properties);
      } else {
        console.error('Failed to load properties');
        this.showError('Failed to load properties');
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      this.showError('Error loading properties');
    }
  }

  renderProperties(properties) {
    const container = document.getElementById('properties-list');
    if (!container) return;

    if (properties.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <p class="text-gray-500 text-lg">No properties found</p>
          <button onclick="window.adminPropertyManager.openPropertyModal()" 
            class="mt-4 px-6 py-2 bg-zentro-green text-white rounded-lg hover:bg-zentro-green/90">
            Add Your First Property
          </button>
        </div>
      `;
      return;
    }

    const propertiesHTML = properties.map(property => `
      <div class="property-card border border-[#dbe0e6] rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold text-zentro-dark">${property.title}</h3>
              <span class="px-2 py-1 text-xs rounded-full ${
                property.status === 'For Sale' 
                  ? 'bg-zentro-green/10 text-zentro-green' 
                  : 'bg-zentro-gold/10 text-zentro-gold'
              }">
                ${property.status}
              </span>
            </div>
            <p class="text-gray-600 text-sm mb-2">${property.area}, ${property.city}</p>
            <p class="text-zentro-dark font-bold">KES ${Number(property.price).toLocaleString()}</p>
            <div class="flex gap-4 text-sm text-gray-500 mt-2">
              <span>${property.bedrooms} bed</span>
              <span>${property.bathrooms} bath</span>
              <span>${property.size}m²</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="window.adminPropertyManager.editProperty(${property.id})" 
              class="px-3 py-1 text-sm bg-zentro-gold text-white rounded hover:bg-zentro-gold/90">
              Edit
            </button>
            <button onclick="window.adminPropertyManager.deleteProperty(${property.id})" 
              class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">
              Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = propertiesHTML;
  }

  openPropertyModal(property = null) {
    this.currentProperty = property;
    const modal = document.getElementById('property-modal');
    const form = document.getElementById('property-form');
    const title = document.getElementById('modal-title');

    if (property) {
      title.textContent = 'Edit Property';
      this.populateForm(property);
    } else {
      title.textContent = 'Add Property';
      form.reset();
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closePropertyModal() {
    const modal = document.getElementById('property-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    this.currentProperty = null;
    this.selectedFiles = { photos: [], videos: [] };
  }

  populateForm(property) {
    document.getElementById('property-title').value = property.title || '';
    document.getElementById('property-type').value = property.type || '';
    document.getElementById('property-status').value = property.status || '';
    document.getElementById('property-price').value = property.price || '';
    document.getElementById('property-area').value = property.area || '';
    document.getElementById('property-city').value = property.city || '';
    document.getElementById('property-bedrooms').value = property.bedrooms || '';
    document.getElementById('property-bathrooms').value = property.bathrooms || '';
    document.getElementById('property-parking').value = property.parking || '';
    document.getElementById('property-size').value = property.size || '';
    document.getElementById('property-description').value = property.description || '';
    document.getElementById('property-amenities').value = property.amenities || '';
  }

  async saveProperty() {
    const formData = this.getFormData();
    
    try {
      const url = this.currentProperty 
        ? `${this.baseURL}/api/properties/${this.currentProperty.id}`
        : `${this.baseURL}/api/properties`;
        
      const method = this.currentProperty ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...window.adminAuth.getAuthHeader()
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        this.showSuccess(this.currentProperty ? 'Property updated successfully' : 'Property created successfully');
        this.closePropertyModal();
        this.loadProperties();
        this.updateDashboard();
      } else {
        const error = await response.json();
        this.showError(error.message || 'Failed to save property');
      }
    } catch (error) {
      console.error('Error saving property:', error);
      this.showError('Error saving property');
    }
  }

  getFormData() {
    return {
      title: document.getElementById('property-title').value,
      type: document.getElementById('property-type').value,
      status: document.getElementById('property-status').value,
      price: parseFloat(document.getElementById('property-price').value),
      area: document.getElementById('property-area').value,
      city: document.getElementById('property-city').value,
      bedrooms: parseInt(document.getElementById('property-bedrooms').value),
      bathrooms: parseInt(document.getElementById('property-bathrooms').value),
      parking: parseInt(document.getElementById('property-parking').value),
      size: parseFloat(document.getElementById('property-size').value),
      description: document.getElementById('property-description').value,
      amenities: document.getElementById('property-amenities').value
    };
  }

  async editProperty(id) {
    const property = this.properties.find(p => p.id === id);
    if (property) {
      this.openPropertyModal(property);
    }
  }

  async deleteProperty(id) {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const response = await fetch(`${this.baseURL}/api/properties/${id}`, {
        method: 'DELETE',
        headers: window.adminAuth.getAuthHeader()
      });

      if (response.ok) {
        this.showSuccess('Property deleted successfully');
        this.loadProperties();
        this.updateDashboard();
      } else {
        this.showError('Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      this.showError('Error deleting property');
    }
  }

  initializeFileUploads() {
    // File upload initialization will be implemented here
    // For now, just basic event listeners
  }

  filterProperties(searchTerm) {
    const filtered = this.properties.filter(property => 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.renderProperties(filtered);
  }

  filterByStatus(status) {
    // Update filter UI
    document.querySelectorAll('.status-filter').forEach(filter => {
      if (filter.dataset.status === status) {
        filter.classList.add('border-b-zentro-dark', 'text-zentro-dark');
        filter.classList.remove('border-b-transparent', 'text-gray-500');
      } else {
        filter.classList.remove('border-b-zentro-dark', 'text-zentro-dark');
        filter.classList.add('border-b-transparent', 'text-gray-500');
      }
    });

    // Filter properties
    const filtered = status === 'all' 
      ? this.properties 
      : this.properties.filter(property => property.status === status);
    
    this.renderProperties(filtered);
  }

  updateDashboard() {
    const totalElement = document.getElementById('total-properties');
    const forSaleElement = document.getElementById('for-sale-count');
    const forRentElement = document.getElementById('for-rent-count');
    const avgPriceElement = document.getElementById('avg-price');

    if (totalElement) totalElement.textContent = this.properties.length;
    
    if (forSaleElement) {
      const forSaleCount = this.properties.filter(p => p.status === 'For Sale').length;
      forSaleElement.textContent = forSaleCount;
    }
    
    if (forRentElement) {
      const forRentCount = this.properties.filter(p => p.status === 'For Rent').length;
      forRentElement.textContent = forRentCount;
    }
    
    if (avgPriceElement) {
      const avgPrice = this.properties.length > 0 
        ? this.properties.reduce((sum, p) => sum + p.price, 0) / this.properties.length
        : 0;
      avgPriceElement.textContent = `KES ${Math.round(avgPrice).toLocaleString()}`;
    }
  }

  loadMediaSection() {
    // Media section functionality will be implemented here
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // Create and show notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-zentro-green text-white' : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.adminPropertyManager = new AdminPropertyManager();
});