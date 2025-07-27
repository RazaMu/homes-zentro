/**
 * Property Manager for Public Frontend
 * Handles property display, search, and contact forms for the public website
 */
class PropertyManager {
  constructor() {
    this.properties = [];
    this.filteredProperties = [];
    this.currentPage = 1;
    this.propertiesPerPage = 12;
    this.totalProperties = 0;
    this.isLoading = false;
    
    // Initialize API service
    this.api = window.apiService;
    
    // Current filters
    this.currentFilters = {
      type: '',
      status: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      bathrooms: '',
      city: '',
      area: '',
      search: ''
    };
    
    this.init();
  }

  async init() {
    try {
      // Check if we're on a page that needs property management
      if (this.shouldInitialize()) {
        this.bindEvents();
        await this.loadProperties();
        this.renderProperties();
        this.setupPagination();
      }
    } catch (error) {
      console.error('Error initializing property manager:', error);
      this.showError('Failed to initialize property manager');
    }
  }

  shouldInitialize() {
    // Check if we're on properties page or have property containers
    return document.getElementById('properties-container') || 
           document.getElementById('property-grid') ||
           document.querySelector('.properties-list') ||
           document.querySelector('[data-property-container]');
  }

  bindEvents() {
    // Search functionality
    const searchInput = document.getElementById('property-search') || 
                       document.querySelector('[data-property-search]');
    if (searchInput) {
      searchInput.addEventListener('input', 
        this.api.constructor.debounce(() => this.handleSearch(), 300)
      );
    }

    // Filter dropdowns and inputs
    this.bindFilterEvents();
    
    // Contact form
    this.bindContactForm();
    
    // Property cards click events (for details)
    this.bindPropertyCardEvents();
  }

  bindFilterEvents() {
    const filterElements = {
      'property-type-filter': 'type',
      'property-status-filter': 'status',
      'min-price-filter': 'min_price',
      'max-price-filter': 'max_price',
      'bedrooms-filter': 'bedrooms',
      'bathrooms-filter': 'bathrooms',
      'city-filter': 'city',
      'area-filter': 'area'
    };

    Object.entries(filterElements).forEach(([elementId, filterKey]) => {
      const element = document.getElementById(elementId) || 
                     document.querySelector(`[data-filter="${filterKey}"]`);
      if (element) {
        element.addEventListener('change', () => this.handleFilterChange(filterKey, element.value));
      }
    });

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters') ||
                           document.querySelector('[data-clear-filters]');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }
  }

  bindContactForm() {
    const contactForm = document.getElementById('contact-form') ||
                       document.querySelector('[data-contact-form]');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => this.handleContactSubmission(e));
    }
  }

  bindPropertyCardEvents() {
    // Delegate click events for property cards
    document.addEventListener('click', (e) => {
      const propertyCard = e.target.closest('[data-property-id]');
      if (propertyCard) {
        const propertyId = propertyCard.dataset.propertyId;
        this.showPropertyDetails(propertyId);
      }
    });
  }

  async loadProperties(filters = this.currentFilters) {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      this.showLoading();
      
      const queryParams = {
        ...filters,
        limit: this.propertiesPerPage,
        offset: (this.currentPage - 1) * this.propertiesPerPage,
        sort_by: 'created_at',
        sort_order: 'DESC'
      };

      const response = await this.api.getProperties(queryParams);
      
      if (response.success) {
        this.properties = response.data.properties || [];
        this.totalProperties = response.data.pagination?.total || 0;
        this.filteredProperties = [...this.properties];
      } else {
        throw new Error(response.error || 'Failed to load properties');
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      this.showError('Failed to load properties. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async handleSearch() {
    const searchInput = document.getElementById('property-search') || 
                       document.querySelector('[data-property-search]');
    if (!searchInput) return;

    this.currentFilters.search = searchInput.value;
    this.currentPage = 1;
    await this.loadProperties();
    this.renderProperties();
    this.updatePagination();
  }

  async handleFilterChange(filterKey, value) {
    this.currentFilters[filterKey] = value;
    this.currentPage = 1;
    await this.loadProperties();
    this.renderProperties();
    this.updatePagination();
  }

  async clearFilters() {
    // Reset all filters
    this.currentFilters = {
      type: '',
      status: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      bathrooms: '',
      city: '',
      area: '',
      search: ''
    };
    
    // Clear filter UI elements
    const filterElements = document.querySelectorAll('[data-filter], #property-search');
    filterElements.forEach(element => {
      element.value = '';
    });

    this.currentPage = 1;
    await this.loadProperties();
    this.renderProperties();
    this.updatePagination();
  }

  renderProperties() {
    const container = this.getPropertyContainer();
    if (!container) return;

    if (this.properties.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }

    container.innerHTML = this.properties.map(property => 
      this.generatePropertyCardHTML(property)
    ).join('');
  }

  getPropertyContainer() {
    return document.getElementById('properties-container') || 
           document.getElementById('property-grid') ||
           document.querySelector('.properties-list') ||
           document.querySelector('[data-property-container]');
  }

  generatePropertyCardHTML(property) {
    const mainImage = this.getMainImage(property);
    const price = this.api.constructor.formatPrice(property.price, property.currency);
    
    return `
      <div class="property-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 cursor-pointer" 
           data-property-id="${property.id}">
        <div class="property-image-container relative">
          <img src="${mainImage}" 
               alt="${property.title}" 
               class="w-full h-48 object-cover"
               onerror="this.src='/wp-content/uploads/2025/02/top_img.png'">
          <div class="absolute top-2 left-2">
            <span class="bg-zentro-gold text-white px-2 py-1 rounded text-sm font-medium">
              ${property.status}
            </span>
          </div>
          ${property.type ? `
            <div class="absolute top-2 right-2">
              <span class="bg-zentro-dark text-white px-2 py-1 rounded text-sm">
                ${property.type}
              </span>
            </div>
          ` : ''}
        </div>
        
        <div class="p-4">
          <h3 class="text-lg font-semibold text-zentro-dark mb-2 line-clamp-2">
            ${property.title}
          </h3>
          
          <p class="text-gray-600 text-sm mb-2 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            ${property.area}, ${property.city}
          </p>
          
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-4 text-sm text-gray-600">
              ${property.bedrooms ? `
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                  </svg>
                  ${property.bedrooms} bed
                </span>
              ` : ''}
              ${property.bathrooms ? `
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                  </svg>
                  ${property.bathrooms} bath
                </span>
              ` : ''}
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-zentro-gold">
              ${price}
            </span>
            <button class="bg-zentro-green text-white px-4 py-2 rounded hover:bg-zentro-green/90 transition-colors text-sm font-medium"
                    onclick="event.stopPropagation(); propertyManager.openContactForm(${property.id})">
              Contact
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getMainImage(property) {
    if (property.images && property.images.length > 0) {
      const mainImage = property.images.find(img => img.is_main) || property.images[0];
      return mainImage.url;
    }
    return '/wp-content/uploads/2025/02/top_img.png';
  }

  getEmptyStateHTML() {
    return `
      <div class="col-span-full text-center py-12">
        <div class="text-gray-500">
          <svg class="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6m-6 4h6"></path>
          </svg>
          <h3 class="text-lg font-medium mb-2">No properties found</h3>
          <p class="text-sm">Try adjusting your search criteria or clear filters to see more results.</p>
          <button onclick="propertyManager.clearFilters()" 
                  class="mt-4 bg-zentro-gold text-white px-4 py-2 rounded hover:bg-zentro-gold/90 transition-colors">
            Clear Filters
          </button>
        </div>
      </div>
    `;
  }

  setupPagination() {
    const paginationContainer = document.getElementById('pagination') ||
                               document.querySelector('[data-pagination]');
    if (!paginationContainer) return;

    this.updatePagination();
  }

  updatePagination() {
    const paginationContainer = document.getElementById('pagination') ||
                               document.querySelector('[data-pagination]');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(this.totalProperties / this.propertiesPerPage);
    
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let paginationHTML = '<div class="flex items-center justify-center space-x-2 mt-8">';
    
    // Previous button
    if (this.currentPage > 1) {
      paginationHTML += `
        <button onclick="propertyManager.goToPage(${this.currentPage - 1})" 
                class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
          Previous
        </button>
      `;
    }

    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.currentPage;
      paginationHTML += `
        <button onclick="propertyManager.goToPage(${i})" 
                class="px-3 py-2 ${isActive ? 'bg-zentro-gold text-white' : 'bg-gray-200 text-gray-700'} rounded hover:bg-zentro-gold hover:text-white transition-colors">
          ${i}
        </button>
      `;
    }

    // Next button
    if (this.currentPage < totalPages) {
      paginationHTML += `
        <button onclick="propertyManager.goToPage(${this.currentPage + 1})" 
                class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
          Next
        </button>
      `;
    }

    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
  }

  async goToPage(page) {
    this.currentPage = page;
    await this.loadProperties();
    this.renderProperties();
    this.updatePagination();
    
    // Scroll to top of properties
    const container = this.getPropertyContainer();
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async showPropertyDetails(propertyId) {
    try {
      const response = await this.api.getProperty(propertyId);
      
      if (response.success) {
        this.openPropertyModal(response.data);
      } else {
        throw new Error(response.error || 'Failed to load property details');
      }
    } catch (error) {
      console.error('Error loading property details:', error);
      this.showNotification('Failed to load property details', 'error');
    }
  }

  openPropertyModal(property) {
    // Create or update property details modal
    let modal = document.getElementById('property-details-modal');
    if (!modal) {
      modal = this.createPropertyModal();
      document.body.appendChild(modal);
    }

    // Populate modal with property data
    modal.innerHTML = this.generatePropertyModalHTML(property);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // Bind close events
    this.bindModalCloseEvents(modal);
  }

  createPropertyModal() {
    const modal = document.createElement('div');
    modal.id = 'property-details-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden items-center justify-center p-4';
    return modal;
  }

  generatePropertyModalHTML(property) {
    const mainImage = this.getMainImage(property);
    const price = this.api.constructor.formatPrice(property.price, property.currency);
    
    return `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="relative">
          <img src="${mainImage}" alt="${property.title}" class="w-full h-64 object-cover">
          <button onclick="propertyManager.closePropertyModal()" 
                  class="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-2xl font-bold text-zentro-dark mb-2">${property.title}</h2>
              <p class="text-gray-600 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
                ${property.area}, ${property.city}
              </p>
            </div>
            <div class="text-right">
              <span class="text-3xl font-bold text-zentro-gold">${price}</span>
              <p class="text-sm text-gray-600">${property.status}</p>
            </div>
          </div>

          ${property.description ? `
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-2">Description</h3>
              <p class="text-gray-600 leading-relaxed">${property.description}</p>
            </div>
          ` : ''}

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            ${property.bedrooms ? `
              <div class="text-center p-3 bg-gray-50 rounded">
                <div class="text-2xl font-bold text-zentro-dark">${property.bedrooms}</div>
                <div class="text-sm text-gray-600">Bedrooms</div>
              </div>
            ` : ''}
            ${property.bathrooms ? `
              <div class="text-center p-3 bg-gray-50 rounded">
                <div class="text-2xl font-bold text-zentro-dark">${property.bathrooms}</div>
                <div class="text-sm text-gray-600">Bathrooms</div>
              </div>
            ` : ''}
            ${property.parking ? `
              <div class="text-center p-3 bg-gray-50 rounded">
                <div class="text-2xl font-bold text-zentro-dark">${property.parking}</div>
                <div class="text-sm text-gray-600">Parking</div>
              </div>
            ` : ''}
            ${property.size ? `
              <div class="text-center p-3 bg-gray-50 rounded">
                <div class="text-2xl font-bold text-zentro-dark">${property.size}</div>
                <div class="text-sm text-gray-600">${property.size_unit || 'm²'}</div>
              </div>
            ` : ''}
          </div>

          ${property.amenities && property.amenities.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-2">Amenities</h3>
              <div class="flex flex-wrap gap-2">
                ${property.amenities.map(amenity => `
                  <span class="bg-zentro-green/10 text-zentro-green px-3 py-1 rounded-full text-sm">
                    ${amenity}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="flex gap-4">
            <button onclick="propertyManager.openContactForm(${property.id})" 
                    class="flex-1 bg-zentro-gold text-white py-3 px-6 rounded-lg hover:bg-zentro-gold/90 transition-colors font-medium">
              Contact About This Property
            </button>
            <button onclick="propertyManager.closePropertyModal()" 
                    class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindModalCloseEvents(modal) {
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closePropertyModal();
      }
    });

    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.closePropertyModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  closePropertyModal() {
    const modal = document.getElementById('property-details-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }
  }

  openContactForm(propertyId = null) {
    // Find or create contact form modal
    let contactModal = document.getElementById('contact-modal');
    if (!contactModal) {
      contactModal = this.createContactModal();
      document.body.appendChild(contactModal);
    }

    // Store property ID for form submission
    this.selectedPropertyId = propertyId;

    // Show modal
    contactModal.classList.remove('hidden');
    contactModal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // If we have a property ID, load property details for context
    if (propertyId) {
      this.loadPropertyForContact(propertyId);
    }
  }

  createContactModal() {
    const modal = document.createElement('div');
    modal.id = 'contact-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Contact Us</h3>
          <button onclick="propertyManager.closeContactModal()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div id="contact-property-info" class="mb-4 p-3 bg-gray-50 rounded hidden">
          <!-- Property info will be loaded here -->
        </div>

        <form id="property-contact-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" name="name" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zentro-gold">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" name="email" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zentro-gold">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" name="phone" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zentro-gold">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea name="message" rows="4" required 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zentro-gold"
                      placeholder="I'm interested in this property..."></textarea>
          </div>
          
          <div class="flex gap-3">
            <button type="submit" 
                    class="flex-1 bg-zentro-gold text-white py-2 px-4 rounded-md hover:bg-zentro-gold/90 transition-colors">
              Send Message
            </button>
            <button type="button" onclick="propertyManager.closeContactModal()" 
                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `;

    // Bind form submission
    const form = modal.querySelector('#property-contact-form');
    form.addEventListener('submit', (e) => this.handleContactSubmission(e));

    return modal;
  }

  async loadPropertyForContact(propertyId) {
    try {
      const response = await this.api.getProperty(propertyId);
      if (response.success) {
        const property = response.data;
        const infoContainer = document.getElementById('contact-property-info');
        if (infoContainer) {
          infoContainer.innerHTML = `
            <div class="flex items-center space-x-3">
              <img src="${this.getMainImage(property)}" alt="${property.title}" 
                   class="w-12 h-12 object-cover rounded">
              <div>
                <h4 class="font-medium text-sm">${property.title}</h4>
                <p class="text-xs text-gray-600">${property.area}, ${property.city}</p>
                <p class="text-xs font-medium text-zentro-gold">
                  ${this.api.constructor.formatPrice(property.price, property.currency)}
                </p>
              </div>
            </div>
          `;
          infoContainer.classList.remove('hidden');
        }
      }
    } catch (error) {
      console.error('Error loading property for contact:', error);
    }
  }

  closeContactModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
      
      // Clear property info
      const infoContainer = document.getElementById('contact-property-info');
      if (infoContainer) {
        infoContainer.classList.add('hidden');
        infoContainer.innerHTML = '';
      }
      
      // Reset form
      const form = document.getElementById('property-contact-form');
      if (form) {
        form.reset();
      }
      
      this.selectedPropertyId = null;
    }
  }

  async handleContactSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || null,
      message: formData.get('message'),
      property_id: this.selectedPropertyId || null,
      subject: this.selectedPropertyId ? 'Property Inquiry' : 'General Inquiry'
    };

    try {
      this.showNotification('Sending message...', 'info');
      
      const response = await this.api.submitContact(contactData);
      
      if (response.success) {
        this.showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        this.closeContactModal();
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      this.showNotification('Failed to send message. Please try again.', 'error');
    }
  }

  showLoading() {
    const container = this.getPropertyContainer();
    if (container) {
      container.innerHTML = `
        <div class="col-span-full flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-zentro-gold"></div>
          <span class="ml-3 text-gray-600">Loading properties...</span>
        </div>
      `;
    }
  }

  showError(message) {
    const container = this.getPropertyContainer();
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="text-red-500">
            <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-lg font-medium">Error</p>
            <p class="text-sm mt-2 text-gray-600">${message}</p>
            <button onclick="propertyManager.loadProperties()" 
                    class="mt-4 bg-zentro-gold text-white px-4 py-2 rounded hover:bg-zentro-gold/90 transition-colors">
              Try Again
            </button>
          </div>
        </div>
      `;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 transition-all duration-300 transform translate-x-full`;

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
    window.propertyManager = new PropertyManager();
  } else {
    console.error('API Service not found. Please include api-service.js first.');
  }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PropertyManager;
}