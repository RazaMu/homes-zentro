// Property Search Grid Component for Admin Media Upload
class PropertySearchGrid {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.properties = [];
    this.filteredProperties = [];
    this.selectedProperty = null;
    this.searchTerm = '';
    this.activeFilters = {
      status: 'all',
      type: 'all'
    };
    
    // Configuration
    this.options = {
      enableSearch: true,
      enableFilters: true,
      maxHeight: '400px',
      columns: 'auto-fit',
      minCardWidth: '250px',
      showThumbnails: true,
      ...options
    };
    
    // Debounce search functionality
    this.searchDebounceTimer = null;
    this.searchDelay = 300;
    
    this.init();
  }

  init() {
    if (!this.container) {
      console.error('PropertySearchGrid: Container element not found');
      return;
    }
    
    this.loadProperties();
    this.render();
    this.bindEvents();
  }

  loadProperties() {
    // Get properties from ZentroAdmin instance or apartments data
    if (window.zentroAdmin && window.zentroAdmin.properties) {
      this.properties = [...window.zentroAdmin.properties];
    } else if (window.apartmentsData && window.apartmentsData.apartments) {
      this.properties = [...window.apartmentsData.apartments];
    } else {
      console.warn('PropertySearchGrid: No property data found');
      this.properties = [];
    }
    
    this.filteredProperties = [...this.properties];
  }

  render() {
    this.container.innerHTML = `
      <div class="property-search-grid">
        ${this.renderHeader()}
        ${this.renderContent()}
      </div>
    `;
  }

  renderHeader() {
    if (!this.options.enableSearch && !this.options.enableFilters) {
      return '';
    }
    
    return `
      <div class="grid-header mb-4">
        ${this.options.enableSearch ? this.renderSearchBar() : ''}
        ${this.options.enableFilters ? this.renderFilters() : ''}
      </div>
    `;
  }

  renderSearchBar() {
    return `
      <div class="search-bar mb-3">
        <div class="relative">
          <input 
            type="text" 
            id="property-grid-search" 
            placeholder="Search by title, location, or type..."
            class="w-full px-4 py-2 pl-10 text-sm border border-[#dbe0e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-zentro-gold/50 focus:border-zentro-gold transition-all duration-300"
            value="${this.searchTerm}"
          >
          <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>
    `;
  }

  renderFilters() {
    const statuses = ['all', 'For Sale', 'For Rent'];
    const types = ['all', ...new Set(this.properties.map(p => p.type))];
    
    return `
      <div class="filter-controls flex flex-wrap gap-3 mb-3">
        <div class="filter-group">
          <label class="block text-sm font-medium text-zentro-dark mb-1">Status</label>
          <select id="property-status-filter" class="px-3 py-1.5 text-sm border border-[#dbe0e6] rounded-lg focus:outline-none focus:ring-1 focus:ring-zentro-gold">
            ${statuses.map(status => `
              <option value="${status}" ${this.activeFilters.status === status ? 'selected' : ''}>
                ${status === 'all' ? 'All Status' : status}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="filter-group">
          <label class="block text-sm font-medium text-zentro-dark mb-1">Type</label>
          <select id="property-type-filter" class="px-3 py-1.5 text-sm border border-[#dbe0e6] rounded-lg focus:outline-none focus:ring-1 focus:ring-zentro-gold">
            ${types.map(type => `
              <option value="${type}" ${this.activeFilters.type === type ? 'selected' : ''}>
                ${type === 'all' ? 'All Types' : type}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="filter-group flex-1 flex items-end">
          <span class="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            ${this.filteredProperties.length} properties
          </span>
        </div>
      </div>
    `;
  }

  renderContent() {
    if (this.filteredProperties.length === 0) {
      return this.renderEmptyState();
    }
    
    return `
      <div class="grid-content" style="max-height: ${this.options.maxHeight}; overflow-y: auto;">
        <div class="property-grid" style="
          display: grid;
          grid-template-columns: repeat(${this.options.columns}, minmax(${this.options.minCardWidth}, 1fr));
          gap: 1rem;
        ">
          ${this.filteredProperties.map(property => this.renderPropertyCard(property)).join('')}
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6m-6 4h6"></path>
        </svg>
        <h3 class="text-lg font-medium text-zentro-dark mb-2">No properties found</h3>
        <p class="text-gray-500">Try adjusting your search criteria or filters.</p>
      </div>
    `;
  }

  renderPropertyCard(property) {
    const isSelected = this.selectedProperty && this.selectedProperty.id === property.id;
    const imageUrl = property.images?.main || '../wp-content/uploads/2025/02/unsplash.jpg';
    
    return `
      <div 
        class="property-card ${isSelected ? 'selected' : ''}" 
        data-property-id="${property.id}"
        role="button"
        tabindex="0"
      >
        <div class="card-inner">
          ${this.options.showThumbnails ? `
            <div class="property-thumbnail">
              <img src="${imageUrl}" alt="${property.title}" class="w-full h-32 object-cover rounded-t-lg">
              <div class="thumbnail-overlay">
                ${isSelected ? `
                  <div class="selected-indicator">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                ` : ''}
                <div class="status-badge ${property.status.toLowerCase().replace(' ', '-')}">
                  ${property.status}
                </div>
              </div>
            </div>
          ` : ''}
          
          <div class="property-info p-4">
            <h3 class="property-title text-base font-semibold text-zentro-dark mb-1 line-clamp-1">${property.title}</h3>
            <p class="property-location text-sm text-gray-600 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              ${property.location.area}, ${property.location.city}
            </p>
            
            <div class="property-meta flex justify-between items-center">
              <span class="property-type text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">${property.type}</span>
              <span class="property-price text-sm font-bold text-zentro-green">
                ${this.formatPrice(property.price, property.currency)}
              </span>
            </div>
            
            <div class="property-features flex gap-3 mt-2 text-xs text-gray-600">
              <span class="flex items-center">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                ${property.features.bedrooms} beds
              </span>
              <span class="flex items-center">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                </svg>
                ${property.features.bathrooms} baths
              </span>
              <span class="flex items-center">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                </svg>
                ${property.features.size}${property.features.sizeUnit || 'm²'}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  formatPrice(price, currency = 'KES') {
    if (window.ApartmentUtils && window.ApartmentUtils.formatPrice) {
      return window.ApartmentUtils.formatPrice(price, currency);
    }
    
    // Fallback formatting
    const formatted = new Intl.NumberFormat('en-KE').format(price);
    return `${currency} ${formatted}`;
  }

  bindEvents() {
    // Search input with debouncing
    const searchInput = this.container.querySelector('#property-grid-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          this.searchTerm = e.target.value;
          this.applyFilters();
        }, this.searchDelay);
      });
    }

    // Filter selects
    const statusFilter = this.container.querySelector('#property-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.activeFilters.status = e.target.value;
        this.applyFilters();
      });
    }

    const typeFilter = this.container.querySelector('#property-type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.activeFilters.type = e.target.value;
        this.applyFilters();
      });
    }

    // Property card selection
    this.container.addEventListener('click', (e) => {
      const card = e.target.closest('.property-card');
      if (card) {
        this.selectProperty(parseInt(card.dataset.propertyId));
      }
    });

    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.property-card');
        if (card) {
          e.preventDefault();
          this.selectProperty(parseInt(card.dataset.propertyId));
        }
      }
    });
  }

  applyFilters() {
    this.filteredProperties = this.properties.filter(property => {
      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const matchesSearch = 
          property.title.toLowerCase().includes(searchLower) ||
          property.location.area.toLowerCase().includes(searchLower) ||
          property.location.city.toLowerCase().includes(searchLower) ||
          property.type.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (this.activeFilters.status !== 'all' && property.status !== this.activeFilters.status) {
        return false;
      }

      // Type filter
      if (this.activeFilters.type !== 'all' && property.type !== this.activeFilters.type) {
        return false;
      }

      return true;
    });

    this.render();
    this.bindEvents();
  }

  selectProperty(propertyId) {
    const property = this.properties.find(p => p.id === propertyId);
    if (property) {
      this.selectedProperty = property;
      this.render();
      this.bindEvents();
      
      // Trigger selection event
      this.container.dispatchEvent(new CustomEvent('propertySelected', {
        detail: { property }
      }));
    }
  }

  getSelectedProperty() {
    return this.selectedProperty;
  }

  clearSelection() {
    this.selectedProperty = null;
    this.render();
    this.bindEvents();
  }

  refresh() {
    this.loadProperties();
    this.applyFilters();
  }
}

// Export for global use
window.PropertySearchGrid = PropertySearchGrid;