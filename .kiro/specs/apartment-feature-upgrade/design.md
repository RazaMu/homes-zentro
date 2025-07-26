# Design Document: Apartment Feature Upgrade

## Overview

This design document outlines the technical approach for upgrading the featured apartment section of the Zentro Homes website. The upgrade will implement a modern, visually appealing property card design based on the provided reference image, enhance the search and filtering functionality, and create a robust admin backend for property management. The design focuses on creating a seamless user experience for property investors while providing administrators with powerful tools to manage property listings.

## Architecture

The apartment feature upgrade will follow a modular architecture with clear separation of concerns:

1. **Frontend Components**:
   - Property Card Component
   - Search & Filter Component
   - Property Detail Component
   - Image Gallery Component
   - Admin Property Management Component

2. **Data Layer**:
   - Property Data Model
   - Filter & Search Logic
   - Data Persistence

3. **Backend Services** (for future implementation):
   - Property API Service
   - Image Upload Service
   - User Authentication Service

The current implementation will focus on enhancing the frontend components and data layer, with hooks for future backend integration.

## Components and Interfaces

### 1. Property Card Component

The property card component will be redesigned to match the reference image with the following elements:

```html
<div class="property-card">
  <div class="property-image-wrapper">
    <img src="[property-image]" alt="[property-title]" class="property-image">
    <div class="property-tags">
      <span class="tag featured">FEATURED</span>
      <span class="tag status">[FOR SALE/FOR RENT]</span>
    </div>
    <div class="property-price">[FORMATTED-PRICE]</div>
    <button class="expand-button" aria-label="View details"></button>
  </div>
  <div class="property-content">
    <h3 class="property-title">[PROPERTY-TITLE]</h3>
    <p class="property-location">[AREA], [CITY], [COUNTRY]</p>
    <div class="property-features">
      <div class="feature"><i class="icon-bed"></i> [BEDROOMS]</div>
      <div class="feature"><i class="icon-bath"></i> [BATHROOMS]</div>
      <div class="feature"><i class="icon-size"></i> [SIZE]</div>
    </div>
    <div class="property-type">[PROPERTY-TYPE]</div>
  </div>
</div>
```

### 2. Search & Filter Component

The search and filter component will be enhanced with a modern design and improved functionality:

```html
<div class="search-filter-container">
  <div class="search-bar">
    <input type="text" placeholder="Search properties..." id="property-search">
    <button class="search-button"><i class="icon-search"></i></button>
  </div>
  
  <div class="filter-controls">
    <div class="filter-group">
      <label for="filter-type">Property Type</label>
      <select id="filter-type">
        <option value="">All Types</option>
        <!-- Dynamic options -->
      </select>
    </div>
    
    <div class="filter-group">
      <label for="filter-status">Status</label>
      <select id="filter-status">
        <option value="">All</option>
        <!-- Dynamic options -->
      </select>
    </div>
    
    <div class="filter-group">
      <label for="filter-location">Location</label>
      <select id="filter-location">
        <option value="">All Locations</option>
        <!-- Dynamic options -->
      </select>
    </div>
    
    <div class="filter-group">
      <label for="filter-price">Price Range</label>
      <select id="filter-price">
        <option value="">All Prices</option>
        <!-- Dynamic options -->
      </select>
    </div>
    
    <div class="filter-group">
      <label for="filter-bedrooms">Bedrooms</label>
      <select id="filter-bedrooms">
        <option value="">Any</option>
        <!-- Dynamic options -->
      </select>
    </div>
    
    <button id="clear-filters" class="clear-button">Clear All</button>
  </div>
</div>
```

### 3. Admin Property Management Interface

The admin interface will provide comprehensive property management capabilities:

```html
<div class="admin-property-panel">
  <div class="admin-header">
    <h2>Property Management</h2>
    <button class="add-property-btn">Add New Property</button>
  </div>
  
  <div class="property-form">
    <div class="form-section">
      <h3>Basic Information</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="property-title">Property Title</label>
          <input type="text" id="property-title" required>
        </div>
        <div class="form-group">
          <label for="property-type">Property Type</label>
          <select id="property-type" required>
            <!-- Dynamic options -->
          </select>
        </div>
      </div>
      <!-- Additional form fields -->
    </div>
    
    <div class="form-section">
      <h3>Media Upload</h3>
      <div class="media-upload">
        <div class="upload-section">
          <h4>Photos</h4>
          <div class="dropzone" id="photo-dropzone">
            <p>Drag and drop photos here</p>
            <p>Or, browse to select files from your computer</p>
            <button class="browse-btn">Browse</button>
          </div>
          <div class="preview-container" id="photo-previews"></div>
        </div>
        
        <div class="upload-section">
          <h4>Videos</h4>
          <div class="dropzone" id="video-dropzone">
            <p>Drag and drop videos here</p>
            <p>Or, browse to select files from your computer</p>
            <button class="browse-btn">Browse</button>
          </div>
          <div class="preview-container" id="video-previews"></div>
        </div>
      </div>
    </div>
    
    <div class="form-actions">
      <button type="submit" class="save-btn">Save Property</button>
      <button type="button" class="cancel-btn">Cancel</button>
    </div>
  </div>
</div>
```

## Data Models

### Property Model

```javascript
/**
 * Property data model
 */
class Property {
  constructor({
    id,
    title,
    type,
    status,
    price,
    currency,
    location,
    features,
    description,
    images,
    videos,
    amenities,
    yearBuilt,
    furnished,
    available,
    featured,
    dateAdded
  }) {
    this.id = id;
    this.title = title;
    this.type = type;
    this.status = status;
    this.price = price;
    this.currency = currency;
    this.location = location; // { area, city, country, coordinates }
    this.features = features; // { bedrooms, bathrooms, parking, size, sizeUnit }
    this.description = description;
    this.images = images; // { main, gallery }
    this.videos = videos || []; // Array of video URLs
    this.amenities = amenities;
    this.yearBuilt = yearBuilt;
    this.furnished = furnished;
    this.available = available;
    this.featured = featured || false;
    this.dateAdded = dateAdded;
  }
  
  // Helper methods
  getFormattedPrice() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(this.price);
  }
  
  getMainImage() {
    return this.images.main;
  }
  
  getGalleryImages() {
    return this.images.gallery;
  }
  
  getAllImages() {
    return [this.images.main, ...this.images.gallery];
  }
}
```

### Filter Model

```javascript
/**
 * Filter data model
 */
class PropertyFilter {
  constructor() {
    this.searchTerm = '';
    this.type = '';
    this.status = '';
    this.location = '';
    this.priceMin = null;
    this.priceMax = null;
    this.bedrooms = null;
    this.featured = null;
  }
  
  // Apply filters to property array
  applyFilters(properties) {
    return properties.filter(property => {
      // Search term filter
      if (this.searchTerm) {
        const searchableText = `${property.title} ${property.description} ${property.location.area} ${property.location.city}`.toLowerCase();
        if (!searchableText.includes(this.searchTerm.toLowerCase())) return false;
      }
      
      // Type filter
      if (this.type && property.type !== this.type) return false;
      
      // Status filter
      if (this.status && property.status !== this.status) return false;
      
      // Location filter
      if (this.location && property.location.area !== this.location) return false;
      
      // Price range filter
      if (this.priceMin && property.price < this.priceMin) return false;
      if (this.priceMax && property.price > this.priceMax) return false;
      
      // Bedrooms filter
      if (this.bedrooms && property.features.bedrooms !== this.bedrooms) return false;
      
      // Featured filter
      if (this.featured !== null && property.featured !== this.featured) return false;
      
      return true;
    });
  }
  
  // Reset all filters
  reset() {
    this.searchTerm = '';
    this.type = '';
    this.status = '';
    this.location = '';
    this.priceMin = null;
    this.priceMax = null;
    this.bedrooms = null;
    this.featured = null;
  }
}
```

## Error Handling

The application will implement comprehensive error handling:

1. **Form Validation**:
   - Client-side validation for all form inputs
   - Visual feedback for validation errors
   - Helpful error messages for users

2. **Data Loading Errors**:
   - Graceful handling of data loading failures
   - User-friendly error messages
   - Retry mechanisms for transient failures

3. **Media Upload Errors**:
   - Validation for file types and sizes
   - Progress indicators for uploads
   - Error handling for failed uploads

4. **Search and Filter Errors**:
   - Graceful handling of no results
   - Suggestions for broadening search criteria
   - Clear feedback on applied filters

## Testing Strategy

The testing strategy will cover multiple levels:

1. **Unit Testing**:
   - Test individual components in isolation
   - Test data models and utility functions
   - Test filter and search logic

2. **Integration Testing**:
   - Test component interactions
   - Test data flow between components
   - Test filter application and results

3. **UI Testing**:
   - Test responsive design across devices
   - Test accessibility compliance
   - Test browser compatibility

4. **User Testing**:
   - Test with real users for usability feedback
   - Gather feedback on the new design
   - Identify any usability issues

## Technical Implementation Details

### CSS Implementation

The new property card design will use a combination of CSS Grid and Flexbox for layout:

```css
/* Property Card Styling */
.property-card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: #fff;
  height: 100%;
}

.property-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.property-image-wrapper {
  position: relative;
  padding-top: 66.67%; /* 3:2 aspect ratio */
  overflow: hidden;
}

.property-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.property-card:hover .property-image {
  transform: scale(1.05);
}

.property-tags {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
}

.property-tags .tag {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.property-tags .featured {
  background-color: #4CAF50;
  color: white;
}

.property-tags .status {
  background-color: #2196F3;
  color: white;
}

.property-tags .status.for-sale {
  background-color: #2196F3;
}

.property-tags .status.for-rent {
  background-color: #FF9800;
}

.property-price {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 700;
}

.expand-button {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.property-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.property-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.property-location {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
}

.property-features {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.property-type {
  margin-top: auto;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  text-transform: uppercase;
}
```

### JavaScript Implementation

The property filtering and rendering will be implemented using modern JavaScript:

```javascript
class PropertyManager {
  constructor(properties) {
    this.allProperties = properties.map(p => new Property(p));
    this.filteredProperties = [...this.allProperties];
    this.filter = new PropertyFilter();
    this.sortOption = 'newest';
  }
  
  // Initialize the property manager
  init() {
    this.renderProperties();
    this.bindEvents();
  }
  
  // Render properties to the DOM
  renderProperties() {
    const container = document.getElementById('property-grid');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    if (this.filteredProperties.length === 0) {
      this.renderNoResults(container);
      return;
    }
    
    // Render each property
    this.filteredProperties.forEach(property => {
      const propertyCard = this.createPropertyCard(property);
      container.appendChild(propertyCard);
    });
  }
  
  // Create a property card element
  createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.dataset.id = property.id;
    
    card.innerHTML = `
      <div class="property-image-wrapper">
        <img src="${property.getMainImage()}" alt="${property.title}" class="property-image">
        <div class="property-tags">
          ${property.featured ? '<span class="tag featured">FEATURED</span>' : ''}
          <span class="tag status ${property.status.toLowerCase().replace(' ', '-')}">${property.status}</span>
        </div>
        <div class="property-price">${property.getFormattedPrice()}</div>
        <button class="expand-button" aria-label="View details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
        </button>
      </div>
      <div class="property-content">
        <h3 class="property-title">${property.title}</h3>
        <p class="property-location">${property.location.area}, ${property.location.city}</p>
        <div class="property-features">
          <div class="feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21V8l9-7 9 7v13h-6v-7h-6v7H3z"/>
            </svg>
            ${property.features.bedrooms} beds
          </div>
          <div class="feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 14v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M17 5H7a2 2 0 0 0-2 2v3h14V7a2 2 0 0 0-2-2zM5 10h14"/>
            </svg>
            ${property.features.bathrooms} baths
          </div>
          <div class="feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            ${property.features.size}${property.features.sizeUnit}
          </div>
        </div>
        <div class="property-type">${property.type}</div>
      </div>
    `;
    
    // Add event listener for card click
    card.addEventListener('click', () => this.viewPropertyDetails(property.id));
    
    return card;
  }
  
  // Render no results message
  renderNoResults(container) {
    container.innerHTML = `
      <div class="no-results">
        <h3>No properties found</h3>
        <p>Try adjusting your search criteria or clearing filters</p>
        <button class="btn" id="clear-filters-btn">Clear Filters</button>
      </div>
    `;
    
    document.getElementById('clear-filters-btn').addEventListener('click', () => this.clearFilters());
  }
  
  // Apply filters to properties
  applyFilters(filterUpdates = {}) {
    // Update filter with new values
    Object.assign(this.filter, filterUpdates);
    
    // Apply filters
    this.filteredProperties = this.filter.applyFilters(this.allProperties);
    
    // Apply sorting
    this.applySorting();
    
    // Render updated properties
    this.renderProperties();
    
    // Update filter UI
    this.updateFilterUI();
  }
  
  // Clear all filters
  clearFilters() {
    this.filter.reset();
    this.filteredProperties = [...this.allProperties];
    this.applySorting();
    this.renderProperties();
    this.updateFilterUI();
  }
  
  // Apply sorting to filtered properties
  applySorting() {
    switch (this.sortOption) {
      case 'price-low':
        this.filteredProperties.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProperties.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        this.filteredProperties.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        break;
      case 'bedrooms':
        this.filteredProperties.sort((a, b) => b.features.bedrooms - a.features.bedrooms);
        break;
      default:
        // Default to newest
        this.filteredProperties.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    }
  }
  
  // Update filter UI to reflect current filter state
  updateFilterUI() {
    // Update search input
    document.getElementById('property-search').value = this.filter.searchTerm;
    
    // Update select dropdowns
    document.getElementById('filter-type').value = this.filter.type;
    document.getElementById('filter-status').value = this.filter.status;
    document.getElementById('filter-location').value = this.filter.location;
    document.getElementById('filter-bedrooms').value = this.filter.bedrooms || '';
    
    // Update price range
    const priceSelect = document.getElementById('filter-price');
    if (this.filter.priceMin !== null && this.filter.priceMax !== null) {
      priceSelect.value = `${this.filter.priceMin}-${this.filter.priceMax}`;
    } else {
      priceSelect.value = '';
    }
    
    // Update results count
    document.getElementById('results-count').textContent = `${this.filteredProperties.length} properties found`;
  }
  
  // Navigate to property details page
  viewPropertyDetails(propertyId) {
    window.location.href = `property-details.html?id=${propertyId}`;
  }
  
  // Bind event listeners
  bindEvents() {
    // Search input
    document.getElementById('property-search')?.addEventListener('input', debounce((e) => {
      this.applyFilters({ searchTerm: e.target.value });
    }, 300));
    
    // Filter dropdowns
    document.getElementById('filter-type')?.addEventListener('change', (e) => {
      this.applyFilters({ type: e.target.value });
    });
    
    document.getElementById('filter-status')?.addEventListener('change', (e) => {
      this.applyFilters({ status: e.target.value });
    });
    
    document.getElementById('filter-location')?.addEventListener('change', (e) => {
      this.applyFilters({ location: e.target.value });
    });
    
    document.getElementById('filter-bedrooms')?.addEventListener('change', (e) => {
      this.applyFilters({ bedrooms: e.target.value ? parseInt(e.target.value) : null });
    });
    
    document.getElementById('filter-price')?.addEventListener('change', (e) => {
      if (e.target.value) {
        const [min, max] = e.target.value.split('-').map(Number);
        this.applyFilters({ priceMin: min, priceMax: max });
      } else {
        this.applyFilters({ priceMin: null, priceMax: null });
      }
    });
    
    // Sort dropdown
    document.getElementById('sort-properties')?.addEventListener('change', (e) => {
      this.sortOption = e.target.value;
      this.applySorting();
      this.renderProperties();
    });
    
    // Clear filters button
    document.getElementById('clear-filters')?.addEventListener('click', () => {
      this.clearFilters();
    });
  }
}

// Helper function for debouncing
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
```

### Admin Interface Implementation

The admin interface for property management will use a combination of HTML, CSS, and JavaScript:

```javascript
class PropertyAdmin {
  constructor() {
    this.properties = [];
    this.currentProperty = null;
    this.photoFiles = [];
    this.videoFiles = [];
  }
  
  init() {
    this.loadProperties();
    this.initializeDropzones();
    this.bindEvents();
  }
  
  loadProperties() {
    // In a real implementation, this would fetch from an API
    // For now, use the mock data
    this.properties = apartmentsData.apartments.map(p => new Property(p));
    this.renderPropertyList();
  }
  
  renderPropertyList() {
    const container = document.getElementById('property-list');
    if (!container) return;
    
    container.innerHTML = this.properties.map(property => `
      <div class="property-list-item" data-id="${property.id}">
        <img src="${property.getMainImage()}" alt="${property.title}" class="property-thumbnail">
        <div class="property-list-details">
          <h3>${property.title}</h3>
          <p>${property.location.area}, ${property.location.city}</p>
          <p class="property-price">${property.getFormattedPrice()}</p>
        </div>
        <div class="property-list-actions">
          <button class="edit-btn" data-id="${property.id}">Edit</button>
          <button class="delete-btn" data-id="${property.id}">Delete</button>
        </div>
      </div>
    `).join('');
  }
  
  initializeDropzones() {
    // Initialize photo dropzone
    const photoDropzone = document.getElementById('photo-dropzone');
    if (photoDropzone) {
      photoDropzone.addEventListener('dragover', e => {
        e.preventDefault();
        photoDropzone.classList.add('dragover');
      });
      
      photoDropzone.addEventListener('dragleave', () => {
        photoDropzone.classList.remove('dragover');
      });
      
      photoDropzone.addEventListener('drop', e => {
        e.preventDefault();
        photoDropzone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        this.handlePhotoFiles(files);
      });
      
      // Browse button
      photoDropzone.querySelector('.browse-btn')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        input.onchange = e => this.handlePhotoFiles(e.target.files);
        input.click();
      });
    }
    
    // Initialize video dropzone
    const videoDropzone = document.getElementById('video-dropzone');
    if (videoDropzone) {
      videoDropzone.addEventListener('dragover', e => {
        e.preventDefault();
        videoDropzone.classList.add('dragover');
      });
      
      videoDropzone.addEventListener('dragleave', () => {
        videoDropzone.classList.remove('dragover');
      });
      
      videoDropzone.addEventListener('drop', e => {
        e.preventDefault();
        videoDropzone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        this.handleVideoFiles(files);
      });
      
      // Browse button
      videoDropzone.querySelector('.browse-btn')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'video/*';
        input.onchange = e => this.handleVideoFiles(e.target.files);
        input.click();
      });
    }
  }
  
  handlePhotoFiles(files) {
    // Add files to the collection
    this.photoFiles = [...this.photoFiles, ...Array.from(files)];
    
    // Render previews
    this.renderPhotoPreviews();
  }
  
  handleVideoFiles(files) {
    // Add files to the collection
    this.videoFiles = [...this.videoFiles, ...Array.from(files)];
    
    // Render previews
    this.renderVideoPreviews();
  }
  
  renderPhotoPreviews() {
    const container = document.getElementById('photo-previews');
    if (!container) return;
    
    container.innerHTML = this.photoFiles.map((file, index) => `
      <div class="preview-item">
        <img src="${URL.createObjectURL(file)}" alt="Preview">
        <button class="remove-btn" data-type="photo" data-index="${index}">&times;</button>
      </div>
    `).join('');
    
    // Add event listeners to remove buttons
    container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.photoFiles.splice(index, 1);
        this.renderPhotoPreviews();
      });
    });
  }
  
  renderVideoPreviews() {
    const container = document.getElementById('video-previews');
    if (!container) return;
    
    container.innerHTML = this.videoFiles.map((file, index) => `
      <div class="preview-item">
        <video src="${URL.createObjectURL(file)}" controls></video>
        <button class="remove-btn" data-type="video" data-index="${index}">&times;</button>
      </div>
    `).join('');
    
    // Add event listeners to remove buttons
    container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.videoFiles.splice(index, 1);
        this.renderVideoPreviews();
      });
    });
  }
  
  bindEvents() {
    // Add property button
    document.getElementById('add-property-btn')?.addEventListener('click', () => {
      this.showPropertyForm();
    });
    
    // Edit property buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const propertyId = parseInt(btn.dataset.id);
        this.editProperty(propertyId);
      });
    });
    
    // Delete property buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const propertyId = parseInt(btn.dataset.id);
        this.deleteProperty(propertyId);
      });
    });
    
    // Form submission
    document.getElementById('property-form')?.addEventListener('submit', e => {
      e.preventDefault();
      this.saveProperty();
    });
    
    // Cancel button
    document.getElementById('cancel-btn')?.addEventListener('click', () => {
      this.hidePropertyForm();
    });
  }
  
  showPropertyForm(property = null) {
    this.currentProperty = property;
    
    // Show form
    document.getElementById('property-list-container').style.display = 'none';
    document.getElementById('property-form-container').style.display = 'block';
    
    // Reset form
    document.getElementById('property-form').reset();
    
    // Clear file collections
    this.photoFiles = [];
    this.videoFiles = [];
    
    // Clear previews
    document.getElementById('photo-previews').innerHTML = '';
    document.getElementById('video-previews').innerHTML = '';
    
    // Populate form if editing
    if (property) {
      document.getElementById('property-title').value = property.title;
      document.getElementById('property-type').value = property.type;
      document.getElementById('property-status').value = property.status;
      document.getElementById('property-price').value = property.price;
      document.getElementById('property-currency').value = property.currency;
      document.getElementById('property-area').value = property.location.area;
      document.getElementById('property-city').value = property.location.city;
      document.getElementById('property-country').value = property.location.country;
      document.getElementById('property-bedrooms').value = property.features.bedrooms;
      document.getElementById('property-bathrooms').value = property.features.bathrooms;
      document.getElementById('property-parking').value = property.features.parking;
      document.getElementById('property-size').value = property.features.size;
      document.getElementById('property-size-unit').value = property.features.sizeUnit;
      document.getElementById('property-description').value = property.description;
      document.getElementById('property-year-built').value = property.yearBuilt;
      document.getElementById('property-furnished').checked = property.furnished;
      document.getElementById('property-available').checked = property.available;
      document.getElementById('property-featured').checked = property.featured;
      
      // Populate amenities
      property.amenities.forEach(amenity => {
        const checkbox = document.querySelector(`input[name="amenities"][value="${amenity}"]`);
        if (checkbox) checkbox.checked = true;
      });
      
      // Show existing images
      const photoPreviewsContainer = document.getElementById('photo-previews');
      property.getAllImages().forEach(imageUrl => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item existing';
        previewItem.innerHTML = `
          <img src="${imageUrl}" alt="Existing image">
          <span class="existing-label">Existing</span>
        `;
        photoPreviewsContainer.appendChild(previewItem);
      });
    }
  }
  
  hidePropertyForm() {
    document.getElementById('property-list-container').style.display = 'block';
    document.getElementById('property-form-container').style.display = 'none';
  }
  
  saveProperty() {
    // Get form values
    const formData = new FormData(document.getElementById('property-form'));
    
    // Create property object
    const propertyData = {
      id: this.currentProperty ? this.currentProperty.id : Date.now(),
      title: formData.get('title'),
      type: formData.get('type'),
      status: formData.get('status'),
      price: parseFloat(formData.get('price')),
      currency: formData.get('currency'),
      location: {
        area: formData.get('area'),
        city: formData.get('city'),
        country: formData.get('country'),
        coordinates: this.currentProperty ? this.currentProperty.location.coordinates : { lat: 0, lng: 0 }
      },
      features: {
        bedrooms: parseInt(formData.get('bedrooms')),
        bathrooms: parseInt(formData.get('bathrooms')),
        parking: parseInt(formData.get('parking')),
        size: parseFloat(formData.get('size')),
        sizeUnit: formData.get('size-unit')
      },
      description: formData.get('description'),
      images: this.currentProperty ? this.currentProperty.images : { main: '', gallery: [] },
      amenities: formData.getAll('amenities'),
      yearBuilt: parseInt(formData.get('year-built')),
      furnished: formData.get('furnished') === 'on',
      available: formData.get('available') === 'on',
      featured: formData.get('featured') === 'on',
      dateAdded: this.currentProperty ? this.currentProperty.dateAdded : new Date().toISOString().split('T')[0]
    };
    
    // In a real implementation, we would upload the files and update the property object
    // For now, just log the files
    console.log('Photo files to upload:', this.photoFiles);
    console.log('Video files to upload:', this.videoFiles);
    
    // Update or add property
    if (this.currentProperty) {
      // Update existing property
      const index = this.properties.findIndex(p => p.id === this.currentProperty.id);
      if (index !== -1) {
        this.properties[index] = new Property(propertyData);
      }
    } else {
      // Add new property
      this.properties.push(new Property(propertyData));
    }
    
    // Update UI
    this.renderPropertyList();
    this.hidePropertyForm();
    
    // Show success message
    alert('Property saved successfully!');
  }
  
  editProperty(propertyId) {
    const property = this.properties.find(p => p.id === propertyId);
    if (property) {
      this.showPropertyForm(property);
    }
  }
  
  deleteProperty(propertyId) {
    if (confirm('Are you sure you want to delete this property?')) {
      this.properties = this.properties.filter(p => p.id !== propertyId);
      this.renderPropertyList();
      alert('Property deleted successfully!');
    }
  }
}
```

## Responsive Design

The design will be fully responsive, adapting to different screen sizes:

```css
/* Responsive Styles */
@media (max-width: 1200px) {
  .property-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .property-grid {
    grid-template-columns: 1fr;
  }
  
  .search-filter-container {
    flex-direction: column;
  }
  
  .filter-controls {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .clear-filters-btn {
    grid-column: span 2;
  }
}

@media (max-width: 480px) {
  .filter-controls {
    grid-template-columns: 1fr;
  }
  
  .clear-filters-btn {
    grid-column: span 1;
  }
  
  .property-features {
    flex-wrap: wrap;
  }
}
```

This responsive design ensures that the property cards and filters adapt to different screen sizes, providing an optimal user experience across devices.