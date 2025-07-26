// Firebase-based admin interface for property management
import { FirestoreManager, FirebaseStorageManager } from '../js/firebase-config.js';

class PropertyAdminManager {
  constructor() {
    this.properties = [];
    this.selectedImages = [];
    this.uploadProgress = 0;
    this.init();
  }

  async init() {
    await this.loadProperties();
    this.renderPropertiesList();
    this.setupEventListeners();
    this.setupImageUpload();
  }

  async loadProperties() {
    try {
      this.properties = await FirestoreManager.getProperties();
    } catch (error) {
      console.error('Failed to load properties:', error);
      this.showError('Failed to load properties');
    }
  }

  renderPropertiesList() {
    const container = document.getElementById('properties-list');
    if (!container) return;

    container.innerHTML = `
      <div class="admin-header">
        <h2>Properties Management</h2>
        <button class="btn btn-primary" id="add-property-btn">Add New Property</button>
      </div>
      
      <div class="properties-grid">
        ${this.properties.map(property => this.createPropertyAdminCard(property)).join('')}
      </div>
    `;
  }

  createPropertyAdminCard(property) {
    const mainImage = property.images && property.images.length > 0 
      ? property.images[0].url 
      : '/wp-content/uploads/2025/02/default-property.jpg';

    return `
      <div class="admin-property-card" data-id="${property.id}">
        <div class="property-image">
          <img src="${mainImage}" alt="${property.title}" loading="lazy">
          <div class="image-count">${property.images?.length || 0} images</div>
        </div>
        
        <div class="property-details">
          <h3>${property.title}</h3>
          <p class="location">${property.location}</p>
          <p class="price">KSh ${property.price?.toLocaleString() || 'Contact for price'}</p>
          <div class="property-meta">
            <span class="status ${property.status}">${property.status}</span>
            <span class="type">${property.type}</span>
          </div>
        </div>
        
        <div class="property-actions">
          <button class="btn btn-secondary" onclick="adminManager.editProperty('${property.id}')">Edit</button>
          <button class="btn btn-danger" onclick="adminManager.deleteProperty('${property.id}')">Delete</button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Add property button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'add-property-btn') {
        this.showPropertyForm();
      }
      
      if (e.target.id === 'save-property') {
        this.saveProperty();
      }
      
      if (e.target.id === 'cancel-property') {
        this.hidePropertyForm();
      }
    });
  }

  setupImageUpload() {
    // Image upload handling
    document.addEventListener('change', (e) => {
      if (e.target.id === 'property-images') {
        this.handleImageSelection(e.target.files);
      }
    });

    // Drag and drop
    document.addEventListener('dragover', (e) => {
      if (e.target.classList.contains('image-upload-area')) {
        e.preventDefault();
        e.target.classList.add('dragover');
      }
    });

    document.addEventListener('dragleave', (e) => {
      if (e.target.classList.contains('image-upload-area')) {
        e.target.classList.remove('dragover');
      }
    });

    document.addEventListener('drop', (e) => {
      if (e.target.classList.contains('image-upload-area')) {
        e.preventDefault();
        e.target.classList.remove('dragover');
        this.handleImageSelection(e.dataTransfer.files);
      }
    });
  }

  showPropertyForm(property = null) {
    const isEdit = property !== null;
    const formHtml = `
      <div class="property-form-overlay" id="property-form-overlay">
        <div class="property-form-modal">
          <div class="form-header">
            <h3>${isEdit ? 'Edit Property' : 'Add New Property'}</h3>
            <button class="close-btn" id="cancel-property">&times;</button>
          </div>
          
          <form class="property-form" id="property-form">
            <div class="form-row">
              <div class="form-group">
                <label>Property Title</label>
                <input type="text" id="property-title" required value="${property?.title || ''}">
              </div>
              
              <div class="form-group">
                <label>Location</label>
                <select id="property-location" required>
                  <option value="">Select Location</option>
                  <option value="Nairobi" ${property?.location === 'Nairobi' ? 'selected' : ''}>Nairobi</option>
                  <option value="Mombasa" ${property?.location === 'Mombasa' ? 'selected' : ''}>Mombasa</option>
                  <option value="Kisumu" ${property?.location === 'Kisumu' ? 'selected' : ''}>Kisumu</option>
                  <option value="Nakuru" ${property?.location === 'Nakuru' ? 'selected' : ''}>Nakuru</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Property Type</label>
                <select id="property-type" required>
                  <option value="">Select Type</option>
                  <option value="Apartment" ${property?.type === 'Apartment' ? 'selected' : ''}>Apartment</option>
                  <option value="Villa" ${property?.type === 'Villa' ? 'selected' : ''}>Villa</option>
                  <option value="Penthouse" ${property?.type === 'Penthouse' ? 'selected' : ''}>Penthouse</option>
                  <option value="Studio" ${property?.type === 'Studio' ? 'selected' : ''}>Studio</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Status</label>
                <select id="property-status" required>
                  <option value="For Sale" ${property?.status === 'For Sale' ? 'selected' : ''}>For Sale</option>
                  <option value="For Rent" ${property?.status === 'For Rent' ? 'selected' : ''}>For Rent</option>
                  <option value="Sold" ${property?.status === 'Sold' ? 'selected' : ''}>Sold</option>
                  <option value="Rented" ${property?.status === 'Rented' ? 'selected' : ''}>Rented</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Price (KSh)</label>
                <input type="number" id="property-price" required value="${property?.price || ''}">
              </div>
              
              <div class="form-group">
                <label>Area (sq ft)</label>
                <input type="number" id="property-area" value="${property?.area || ''}">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Bedrooms</label>
                <input type="number" id="property-bedrooms" min="0" value="${property?.bedrooms || ''}">
              </div>
              
              <div class="form-group">
                <label>Bathrooms</label>
                <input type="number" id="property-bathrooms" min="0" value="${property?.bathrooms || ''}">
              </div>
            </div>
            
            <div class="form-group">
              <label>Description</label>
              <textarea id="property-description" rows="4">${property?.description || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label>Images</label>
              <div class="image-upload-area" id="image-upload-area">
                <input type="file" id="property-images" multiple accept="image/*">
                <div class="upload-text">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <p>Drag and drop images here, or click to select</p>
                  <small>Support: JPG, PNG, WebP (Max 50MB each)</small>
                </div>
              </div>
              <div class="selected-images" id="selected-images"></div>
              <div class="upload-progress" id="upload-progress" style="display: none;">
                <div class="progress-bar">
                  <div class="progress-fill" id="progress-fill"></div>
                </div>
                <span class="progress-text" id="progress-text">0%</span>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" id="cancel-property">Cancel</button>
              <button type="submit" class="btn btn-primary" id="save-property">
                ${isEdit ? 'Update Property' : 'Save Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', formHtml);
    
    // Store current property for editing
    if (property) {
      this.currentEditProperty = property;
    }
  }

  hidePropertyForm() {
    const overlay = document.getElementById('property-form-overlay');
    if (overlay) {
      overlay.remove();
    }
    this.selectedImages = [];
    this.currentEditProperty = null;
  }

  handleImageSelection(files) {
    this.selectedImages = Array.from(files);
    this.renderSelectedImages();
  }

  renderSelectedImages() {
    const container = document.getElementById('selected-images');
    if (!container) return;

    container.innerHTML = this.selectedImages.map((file, index) => `
      <div class="selected-image">
        <img src="${URL.createObjectURL(file)}" alt="Selected image">
        <button type="button" class="remove-image" onclick="adminManager.removeSelectedImage(${index})">
          &times;
        </button>
        <span class="image-name">${file.name}</span>
      </div>
    `).join('');
  }

  removeSelectedImage(index) {
    this.selectedImages.splice(index, 1);
    this.renderSelectedImages();
  }

  async saveProperty() {
    const form = document.getElementById('property-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const propertyData = {
      title: document.getElementById('property-title').value,
      location: document.getElementById('property-location').value,
      type: document.getElementById('property-type').value,
      status: document.getElementById('property-status').value,
      price: parseInt(document.getElementById('property-price').value),
      area: parseInt(document.getElementById('property-area').value) || null,
      bedrooms: parseInt(document.getElementById('property-bedrooms').value) || null,
      bathrooms: parseInt(document.getElementById('property-bathrooms').value) || null,
      description: document.getElementById('property-description').value
    };

    try {
      // Show upload progress
      if (this.selectedImages.length > 0) {
        this.showUploadProgress();
        
        // Upload images
        const imageUploads = await FirebaseStorageManager.uploadMultipleImages(
          this.selectedImages,
          'properties',
          (completed, total) => this.updateUploadProgress(completed, total)
        );
        
        propertyData.images = imageUploads.filter(upload => !upload.error);
      }

      // Save or update property
      if (this.currentEditProperty) {
        await FirestoreManager.updateProperty(this.currentEditProperty.id, propertyData);
        this.showSuccess('Property updated successfully!');
      } else {
        await FirestoreManager.addProperty(propertyData);
        this.showSuccess('Property added successfully!');
      }

      // Refresh the list
      await this.loadProperties();
      this.renderPropertiesList();
      this.hidePropertyForm();

    } catch (error) {
      console.error('Save failed:', error);
      this.showError('Failed to save property. Please try again.');
    }
  }

  showUploadProgress() {
    const progressContainer = document.getElementById('upload-progress');
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }
  }

  updateUploadProgress(completed, total) {
    const percentage = Math.round((completed / total) * 100);
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}%`;
  }

  async editProperty(propertyId) {
    const property = this.properties.find(p => p.id === propertyId);
    if (property) {
      this.showPropertyForm(property);
    }
  }

  async deleteProperty(propertyId) {
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      // Find property to get image paths for deletion
      const property = this.properties.find(p => p.id === propertyId);
      
      // Delete images from storage
      if (property.images) {
        for (const image of property.images) {
          await FirebaseStorageManager.deleteImage(image.path);
        }
      }

      // Delete property document
      await FirestoreManager.deleteProperty(propertyId);
      
      this.showSuccess('Property deleted successfully!');
      
      // Refresh the list
      await this.loadProperties();
      this.renderPropertiesList();
      
    } catch (error) {
      console.error('Delete failed:', error);
      this.showError('Failed to delete property. Please try again.');
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
}

// Global instance for onclick handlers
window.adminManager = new PropertyAdminManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // adminManager is already initialized above
});