// Firebase-based property management
import { FirestoreManager, FirebaseStorageManager } from './firebase-config.js';

class PropertyManager {
  constructor() {
    this.properties = [];
    this.filteredProperties = [];
    this.currentFilters = {};
    this.init();
  }

  async init() {
    await this.loadProperties();
    this.renderProperties();
    this.setupEventListeners();
  }

  async loadProperties(filters = {}) {
    try {
      this.properties = await FirestoreManager.getProperties(filters);
      this.filteredProperties = [...this.properties];
      this.currentFilters = filters;
    } catch (error) {
      console.error('Failed to load properties:', error);
      this.showError('Failed to load properties. Please try again later.');
    }
  }

  renderProperties() {
    const container = document.getElementById('apartments-grid');
    if (!container) return;

    if (this.filteredProperties.length === 0) {
      container.innerHTML = `
        <div class="no-properties">
          <h3>No properties found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredProperties.map(property => this.createPropertyCard(property)).join('');
  }

  createPropertyCard(property) {
    const mainImage = property.images && property.images.length > 0 ? property.images[0].url : '/wp-content/uploads/2025/02/default-property.jpg';
    
    return `
      <div class="unique-card">
        <img src="${mainImage}" alt="${property.title}" class="unique-card-img" loading="lazy">
        <div class="unique-card-price">KSh ${property.price?.toLocaleString() || 'Contact for price'}</div>
        <div class="unique-card-content">
          <h3 class="unique-card-title">${property.title}</h3>
          <p class="unique-card-location">
            <i class="fas fa-map-marker-alt"></i> ${property.location}
          </p>
          <div class="unique-card-features">
            <span><i class="fas fa-bed"></i> ${property.bedrooms || 0} beds</span>
            <span><i class="fas fa-bath"></i> ${property.bathrooms || 0} baths</span>
            <span><i class="fas fa-ruler-combined"></i> ${property.area || 'N/A'} sq ft</span>
          </div>
          <p class="unique-card-desc">${property.description?.substring(0, 100) || ''}...</p>
          <a href="apartment-details.html?id=${property.id}" class="unique-card-btn">View Details</a>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Search functionality
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
      searchButton.addEventListener('click', () => this.handleSearch());
    }

    // Filter dropdowns
    this.setupFilterDropdowns();
  }

  setupFilterDropdowns() {
    const dropdowns = [
      { id: 'location', values: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'] },
      { id: 'type', values: ['Apartment', 'Villa', 'Penthouse', 'Studio'] },
      { id: 'bedrooms', values: ['1', '2', '3', '4', '5+'] },
      { id: 'price', values: ['Under 5M', '5M-10M', '10M-20M', '20M+'] }
    ];

    dropdowns.forEach(dropdown => {
      const container = document.getElementById(`${dropdown.id}-dropdown`);
      const display = document.getElementById(`${dropdown.id}-display`);
      const field = document.querySelector(`[data-field="${dropdown.id}"]`);

      if (container && display) {
        container.innerHTML = dropdown.values.map(value => 
          `<div class="dropdown-option" data-value="${value}">${value}</div>`
        ).join('');

        // Handle clicks
        container.addEventListener('click', (e) => {
          if (e.target.classList.contains('dropdown-option')) {
            const value = e.target.dataset.value;
            display.textContent = value;
            this.currentFilters[dropdown.id] = value;
          }
        });
      }
    });
  }

  async handleSearch() {
    const filters = { ...this.currentFilters };
    
    // Convert display values to filter values
    if (filters.bedrooms && filters.bedrooms.includes('+')) {
      filters.bedrooms = parseInt(filters.bedrooms.replace('+', ''));
    }

    await this.loadProperties(filters);
    this.renderProperties();
  }

  showError(message) {
    const container = document.getElementById('apartments-grid');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <h3>Error</h3>
          <p>${message}</p>
        </div>
      `;
    }
  }
}

// Contact form handler
class ContactFormManager {
  constructor() {
    this.setupContactForm();
  }

  setupContactForm() {
    const form = document.querySelector('.contact-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = Object.fromEntries(formData.entries());

    try {
      await FirestoreManager.submitContact(contactData);
      this.showSuccess('Thank you! Your message has been sent successfully.');
      e.target.reset();
    } catch (error) {
      console.error('Contact form submission failed:', error);
      this.showError('Failed to send message. Please try again.');
    }
  }

  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type) {
    // Create or update message element
    let messageEl = document.getElementById('form-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'form-message';
      messageEl.className = `form-message ${type}`;
      
      const form = document.querySelector('.contact-form');
      form.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.className = `form-message ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PropertyManager();
  new ContactFormManager();
});