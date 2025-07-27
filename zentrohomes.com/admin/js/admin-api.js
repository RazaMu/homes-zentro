/**
 * Enhanced Zentro Admin Dashboard with API Integration
 * Connects to the backend API for all CRUD operations
 */
class ZentroAdminAPI {
  constructor() {
    this.properties = [];
    this.filteredProperties = [];
    this.currentEditingId = null;
    this.isLoading = false;
    
    // Initialize API service
    this.api = window.apiService;
    
    // Initialize components
    this.mediaUploader = new MediaUploader();
    this.selectedMediaProperty = null;
    
    this.init();
  }

  async init() {
    try {
      // Check API health
      const health = await this.api.checkHealth();
      if (health.status === 'healthy') {
        console.log('✅ API connection established');
      } else {
        console.warn('⚠️ API health check failed:', health);
      }

      this.bindNavigation();
      this.bindPropertyEvents();
      this.bindMediaEvents();
      this.bindModalEvents();
      
      // Load initial data
      await this.loadProperties();
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error initializing admin dashboard:', error);
      this.showNotification('Failed to connect to API', 'error');
    }
  }

  // Navigation handling
  bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.switchSection(section);
      });
    });
  }

  switchSection(sectionName) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active', 'bg-[#f0f2f5]');
    });

    const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeItem) {
      activeItem.classList.add('active', 'bg-[#f0f2f5]');
    }

    // Show/hide sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.add('hidden');
    });

    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      
      // Load section-specific data
      if (sectionName === 'properties') {
        this.loadProperties();
      } else if (sectionName === 'contacts') {
        this.loadContacts();
      }
    }
  }

  // Property management
  bindPropertyEvents() {
    // Add property button
    const addBtn = document.getElementById('add-property-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openPropertyModal();
      });
    }

    // Search and filters
    const searchInput = document.getElementById('property-search');
    if (searchInput) {
      searchInput.addEventListener('input', 
        this.api.constructor.debounce(() => this.filterProperties(), 300)
      );
    }

    // Status filter clicks
    document.querySelectorAll('.status-filter').forEach(filter => {
      filter.addEventListener('click', (e) => {
        e.preventDefault();
        const status = filter.dataset.status;
        this.filterByStatus(status);
        this.updateActiveFilter(filter);
      });
    });
  }

  async loadProperties() {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      this.showLoading('properties-list');
      
      const response = await this.api.getProperties();
      
      if (response.success) {
        this.properties = response.data.properties || [];
        this.filteredProperties = [...this.properties];
        this.renderProperties();
        this.updateDashboard();
      } else {
        throw new Error(response.error || 'Failed to load properties');
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      this.showNotification('Failed to load properties: ' + error.message, 'error');
      this.showError('properties-list', 'Failed to load properties');
    } finally {
      this.isLoading = false;
    }
  }

  filterByStatus(status) {
    const search = document.getElementById('property-search')?.value.toLowerCase() || '';

    this.filteredProperties = this.properties.filter(property => {
      const matchesSearch = !search ||
        property.title.toLowerCase().includes(search) ||
        property.area.toLowerCase().includes(search) ||
        property.city.toLowerCase().includes(search);

      const matchesStatus = status === 'all' || property.status === status;

      return matchesSearch && matchesStatus;
    });

    this.renderProperties();
  }

  filterProperties() {
    const search = document.getElementById('property-search')?.value.toLowerCase() || '';
    
    this.filteredProperties = this.properties.filter(property => {
      return !search ||
        property.title.toLowerCase().includes(search) ||
        property.area.toLowerCase().includes(search) ||
        property.city.toLowerCase().includes(search);
    });

    this.renderProperties();
  }

  updateActiveFilter(activeFilter) {
    document.querySelectorAll('.status-filter').forEach(filter => {
      filter.classList.remove('border-b-zentro-dark', 'text-zentro-dark');
      filter.classList.add('border-b-transparent', 'text-gray-500');
      
      const p = filter.querySelector('p');
      if (p) {
        p.classList.remove('text-zentro-dark');
        p.classList.add('text-gray-500');
      }
    });

    activeFilter.classList.remove('border-b-transparent', 'text-gray-500');
    activeFilter.classList.add('border-b-zentro-dark', 'text-zentro-dark');
    
    const p = activeFilter.querySelector('p');
    if (p) {
      p.classList.remove('text-gray-500');
      p.classList.add('text-zentro-dark');
    }
  }

  renderProperties() {
    const container = document.getElementById('properties-list');
    if (!container) return;

    if (this.filteredProperties.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-gray-500">
            <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6m-6 4h6"></path>
            </svg>
            <p class="text-lg font-medium">No properties found</p>
            <p class="text-sm mt-2">Try adjusting your search criteria</p>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="overflow-hidden rounded-lg border border-[#dbe0e6] bg-white">
        <table class="w-full">
          <thead>
            <tr class="bg-white">
              <th class="px-4 py-3 text-left text-zentro-dark text-sm font-medium">ID</th>
              <th class="px-4 py-3 text-left text-zentro-dark text-sm font-medium">Image</th>
              <th class="px-4 py-3 text-left text-zentro-dark text-sm font-medium">Title</th>
              <th class="px-4 py-3 text-left text-zentro-dark text-sm font-medium">Location</th>
              <th class="px-4 py-3 text-left text-zentro-dark text-sm font-medium">Type</th>
              <th class="px-4 py-3 text-left text-zentro-dark text-sm font-medium">Status</th>
              <th class="px-4 py-3 text-left text-zentro-dark text-sm font-medium">Price</th>
              <th class="px-4 py-3 text-left text-zentro-dark text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredProperties.map(property => `
              <tr class="border-t border-t-[#dbe0e6]">
                <td class="h-[72px] px-4 py-2 text-zentro-dark text-sm font-normal">${property.id}</td>
                <td class="h-[72px] px-4 py-2">
                  <div class="w-16 h-16 rounded-lg overflow-hidden">
                    <img src="${this.getMainImage(property)}" alt="${property.title}" class="w-full h-full object-cover" onerror="this.src='/wp-content/uploads/2025/02/top_img.png'">
                  </div>
                </td>
                <td class="h-[72px] px-4 py-2 text-zentro-dark text-sm font-normal">${property.title}</td>
                <td class="h-[72px] px-4 py-2 text-gray-600 text-sm font-normal">${property.area}, ${property.city}</td>
                <td class="h-[72px] px-4 py-2 text-gray-600 text-sm font-normal">${property.type}</td>
                <td class="h-[72px] px-4 py-2">
                  <button class="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 ${property.status === 'For Sale' ? 'bg-zentro-green/10 text-zentro-green' : 'bg-zentro-gold/10 text-zentro-gold'} text-sm font-medium">
                    <span class="truncate">${property.status}</span>
                  </button>
                </td>
                <td class="h-[72px] px-4 py-2 text-zentro-dark text-sm font-medium">${this.api.constructor.formatPrice(property.price, property.currency)}</td>
                <td class="h-[72px] px-4 py-2">
                  <div class="flex gap-2">
                    <button onclick="zentroAdminAPI.editProperty(${property.id})" class="text-zentro-dark text-sm font-bold tracking-[0.015em] hover:text-zentro-gold transition-colors">
                      Edit
                    </button>
                    <button onclick="zentroAdminAPI.deleteProperty(${property.id})" class="text-red-500 text-sm font-bold tracking-[0.015em] hover:text-red-600 transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  getMainImage(property) {
    if (property.images && property.images.length > 0) {
      const mainImage = property.images.find(img => img.is_main) || property.images[0];
      return mainImage.url;
    }
    return '/wp-content/uploads/2025/02/top_img.png'; // Default image
  }

  // Modal handling
  bindModalEvents() {
    const modal = document.getElementById('property-modal');
    const form = document.getElementById('property-form');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (!modal || !form || !cancelBtn) return;

    // Close modal on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closePropertyModal();
      }
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
      this.closePropertyModal();
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProperty();
    });
  }

  openPropertyModal(property = null) {
    const modal = document.getElementById('property-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('property-form');

    if (!modal || !modalTitle || !form) return;

    if (property) {
      modalTitle.textContent = 'Edit Property';
      this.currentEditingId = property.id;
      this.populatePropertyForm(property);
    } else {
      modalTitle.textContent = 'Add Property';
      this.currentEditingId = null;
      form.reset();
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  closePropertyModal() {
    const modal = document.getElementById('property-modal');
    if (!modal) return;
    
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    this.currentEditingId = null;
    
    // Clear media files
    if (this.mediaUploader) {
      this.mediaUploader.clearFiles();
    }
  }

  populatePropertyForm(property) {
    const fields = {
      'property-title': property.title,
      'property-type': property.type,
      'property-status': property.status,
      'property-price': property.price,
      'property-area': property.area,
      'property-city': property.city,
      'property-bedrooms': property.bedrooms,
      'property-bathrooms': property.bathrooms,
      'property-parking': property.parking,
      'property-size': property.size,
      'property-description': property.description,
      'property-amenities': property.amenities?.join(', ') || ''
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element && value !== undefined) {
        element.value = value;
      }
    });
  }

  async saveProperty() {
    try {
      this.showNotification('Saving property...', 'info');
      
      const formData = this.getFormData();
      
      if (!this.validateFormData(formData)) {
        return;
      }

      let response;
      if (this.currentEditingId) {
        response = await this.api.updateProperty(this.currentEditingId, formData);
      } else {
        response = await this.api.createProperty(formData);
      }

      if (response.success) {
        this.showNotification(
          this.currentEditingId ? 'Property updated successfully!' : 'Property created successfully!',
          'success'
        );
        
        this.closePropertyModal();
        await this.loadProperties();
      } else {
        throw new Error(response.error || 'Failed to save property');
      }
      
    } catch (error) {
      console.error('Error saving property:', error);
      this.showNotification('Failed to save property: ' + error.message, 'error');
    }
  }

  getFormData() {
    return {
      title: document.getElementById('property-title')?.value || '',
      type: document.getElementById('property-type')?.value || 'Villa',
      status: document.getElementById('property-status')?.value || 'For Sale',
      price: parseFloat(document.getElementById('property-price')?.value) || 0,
      currency: 'KES',
      area: document.getElementById('property-area')?.value || '',
      city: document.getElementById('property-city')?.value || '',
      country: 'Kenya',
      latitude: -1.2921,
      longitude: 36.8219,
      bedrooms: parseInt(document.getElementById('property-bedrooms')?.value) || 0,
      bathrooms: parseInt(document.getElementById('property-bathrooms')?.value) || 0,
      parking: parseInt(document.getElementById('property-parking')?.value) || 0,
      size: parseInt(document.getElementById('property-size')?.value) || 0,
      size_unit: 'm²',
      description: document.getElementById('property-description')?.value || '',
      amenities: (document.getElementById('property-amenities')?.value || '')
        .split(',').map(a => a.trim()).filter(a => a),
      year_built: new Date().getFullYear(),
      furnished: false,
      available: true
    };
  }

  validateFormData(data) {
    const required = ['title', 'type', 'price', 'area', 'city'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      this.showNotification(`Missing required fields: ${missing.join(', ')}`, 'error');
      return false;
    }
    
    if (data.price <= 0) {
      this.showNotification('Price must be greater than 0', 'error');
      return false;
    }
    
    return true;
  }

  async editProperty(id) {
    const property = this.properties.find(p => p.id === id);
    if (property) {
      this.openPropertyModal(property);
    } else {
      this.showNotification('Property not found', 'error');
    }
  }

  async deleteProperty(id) {
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      const response = await this.api.deleteProperty(id);
      
      if (response.success) {
        this.showNotification('Property deleted successfully!', 'success');
        await this.loadProperties();
      } else {
        throw new Error(response.error || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      this.showNotification('Failed to delete property: ' + error.message, 'error');
    }
  }

  // Media handling
  bindMediaEvents() {
    // Implementation for media upload functionality
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        this.uploadMedia();
      });
    }
  }

  async uploadMedia() {
    if (!this.selectedMediaProperty) {
      this.showNotification('Please select a property first', 'error');
      return;
    }

    const files = this.mediaUploader?.getSelectedFiles();
    if (!files || (files.photos.length === 0 && files.videos.length === 0)) {
      this.showNotification('Please select files to upload', 'error');
      return;
    }

    try {
      const allFiles = [...files.photos, ...files.videos];
      const response = await this.api.uploadPropertyMedia(this.selectedMediaProperty.id, allFiles);

      if (response.success) {
        this.showNotification(
          `Successfully uploaded ${response.data.uploadedFiles.length} file(s)`,
          'success'
        );
        
        // Clear selected files
        this.mediaUploader?.clearFiles();
        
        // Reload properties to show new media
        await this.loadProperties();
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      this.showNotification('Upload failed: ' + error.message, 'error');
    }
  }

  // Contacts management
  async loadContacts() {
    try {
      this.showLoading('contacts-list');
      
      const response = await this.api.getContacts();
      
      if (response.success) {
        this.renderContacts(response.data.contacts || []);
      } else {
        throw new Error(response.error || 'Failed to load contacts');
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      this.showError('contacts-list', 'Failed to load contacts');
    }
  }

  renderContacts(contacts) {
    const container = document.getElementById('contacts-list');
    if (!container) return;

    if (contacts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <p class="text-gray-500">No contacts found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-4">
        ${contacts.map(contact => `
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium">${contact.name}</h3>
                <p class="text-sm text-gray-600">${contact.email}</p>
                ${contact.phone ? `<p class="text-sm text-gray-600">${contact.phone}</p>` : ''}
                <p class="text-sm text-gray-800 mt-2">${contact.message}</p>
                ${contact.property_title ? `<p class="text-sm text-blue-600 mt-1">Re: ${contact.property_title}</p>` : ''}
              </div>
              <div class="text-right">
                <span class="inline-block px-2 py-1 text-xs rounded ${this.getContactStatusClass(contact.status)}">
                  ${contact.status}
                </span>
                <p class="text-xs text-gray-500 mt-1">${this.api.constructor.formatDate(contact.created_at)}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  getContactStatusClass(status) {
    const classes = {
      'new': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'responded': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || classes['new'];
  }

  // Dashboard
  updateDashboard() {
    const totalProperties = this.properties.length;
    const forSaleCount = this.properties.filter(p => p.status === 'For Sale').length;
    const forRentCount = this.properties.filter(p => p.status === 'For Rent').length;
    const avgPrice = totalProperties > 0 
      ? this.properties.reduce((sum, p) => sum + (p.price || 0), 0) / totalProperties 
      : 0;

    this.updateElement('total-properties', totalProperties.toString());
    this.updateElement('for-sale-count', forSaleCount.toString());
    this.updateElement('for-rent-count', forRentCount.toString());
    this.updateElement('avg-price', this.api.constructor.formatPrice(avgPrice, 'KES'));
  }

  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  // Utility methods
  showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-zentro-gold"></div>
          <span class="ml-2 text-gray-600">Loading...</span>
        </div>
      `;
    }
  }

  showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-red-500">
            <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-lg font-medium">Error</p>
            <p class="text-sm mt-2">${message}</p>
          </div>
        </div>
      `;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-xl text-white font-medium z-50 transition-all duration-300 transform translate-x-full`;

    switch (type) {
      case 'success':
        notification.className += ' bg-green-500';
        break;
      case 'error':
        notification.className += ' bg-red-500';
        break;
      case 'info':
      default:
        notification.className += ' bg-blue-500';
        break;
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  // Make sure API service is available
  if (window.apiService) {
    window.zentroAdminAPI = new ZentroAdminAPI();
  } else {
    console.error('API Service not found. Please include api-service.js first.');
  }
});