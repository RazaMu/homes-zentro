// Modern Apartments JavaScript Implementation
class ModernApartmentManager {
    constructor() {
        this.apartments = apartmentsData.apartments;
        this.filteredApartments = [...this.apartments];
        this.currentFilters = {};
        this.currentSort = 'newest';

        this.init();
    }

    init() {
        this.renderSearchAndFilters();
        this.renderApartments();
        this.bindEvents();
    }

    renderSearchAndFilters() {
        const filtersContainer = document.getElementById('apartments-filters');
        if (!filtersContainer) return;

        filtersContainer.innerHTML = `
      <div class="search-filter-container enhanced-search-bar">
        <!-- Enhanced Unified Search Bar -->
        <div class="unified-search-bar">
          <div class="unified-search-item">
            <label class="unified-search-label">Property Type</label>
            <select id="filter-type" class="unified-search-select">
              <option value="">Select</option>
              ${apartmentsData.filters.types.map(type => `<option value="${type}">${type}</option>`).join('')}
            </select>
          </div>
          
          <div class="unified-search-item">
            <label class="unified-search-label">Bedrooms</label>
            <select id="filter-bedrooms" class="unified-search-select">
              <option value="">Select</option>
              ${apartmentsData.filters.bedrooms.map(count => `<option value="${count}">${count}${count === 8 ? '+' : ''}</option>`).join('')}
            </select>
          </div>
          
          <div class="unified-search-item">
            <label class="unified-search-label">Location</label>
            <select id="filter-location" class="unified-search-select">
              <option value="">Select</option>
              ${apartmentsData.filters.locations.map(location => `<option value="${location}">${location}</option>`).join('')}
            </select>
          </div>
          
          <div class="unified-search-item">
            <label class="unified-search-label">Status</label>
            <select id="filter-status" class="unified-search-select">
              <option value="">Select</option>
              ${apartmentsData.filters.statuses.map(status => `<option value="${status}">${status}</option>`).join('')}
            </select>
          </div>
          
          <div class="unified-search-item">
            <label class="unified-search-label">Budget</label>
            <select id="filter-price" class="unified-search-select">
              <option value="">Select</option>
              ${apartmentsData.filters.priceRanges.map(range =>
            `<option value="${range.min}-${range.max}">${range.label}</option>`
        ).join('')}
            </select>
          </div>
          
          <button class="unified-search-button" id="search-button">
            Search
          </button>
        </div>
      </div>
    `;
    }

    renderApartments() {
        const apartmentsContainer = document.getElementById('apartments-grid');
        if (!apartmentsContainer) return;

        // Change the class to property-grid for our new styling
        apartmentsContainer.className = 'property-grid';

        if (this.filteredApartments.length === 0) {
            // Enhanced no results state with icon and better styling
            apartmentsContainer.innerHTML = `
        <div class="no-results">
          <svg class="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M10 10l4 4m0-4l-4 4m2-10a8 8 0 100 16 8 8 0 000-16z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h3>No properties found</h3>
          <p>We couldn't find any properties matching your current filters.</p>
          <p>Try adjusting your search criteria or clearing all filters to see more options.</p>
          <button class="no-results-btn" onclick="modernApartmentManager.clearFilters()">Clear All Filters</button>
        </div>
      `;
            return;
        }

        apartmentsContainer.innerHTML = this.filteredApartments.map(apartment => `
      <div class="property-card" data-id="${apartment.id}" onclick="modernApartmentManager.viewApartment(${apartment.id})" style="cursor: pointer;">
        <div class="property-image-wrapper">
          <img src="${apartment.images.main}" alt="${apartment.title}" class="property-image">
          <div class="property-tags">
            ${apartment.featured ? '<span class="property-tag tag-featured">FEATURED</span>' : ''}
            <span class="property-tag tag-${apartment.status.toLowerCase().replace(' ', '-')}">${apartment.status}</span>
          </div>
          <div class="property-price">${ApartmentUtils.formatPrice(apartment.price, apartment.currency)}</div>
          <button class="expand-button" aria-label="View preview" onclick="modernApartmentManager.showPreview(${apartment.id}); event.stopPropagation();">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </button>
          <div class="property-branding">
            <span>ZENTRO HOMES</span>
          </div>
        </div>
        
        <div class="property-content">
          <h3 class="property-title">${apartment.title}</h3>
          <p class="property-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${apartment.location.area}, ${apartment.location.city}
          </p>
          
          <div class="property-features">
            <div class="feature-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21V8l9-7 9 7v13h-6v-7h-6v7H3z"/>
              </svg>
              ${apartment.features.bedrooms} beds
            </div>
            <div class="feature-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 14v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M17 5H7a2 2 0 0 0-2 2v3h14V7a2 2 0 0 0-2-2zM5 10h14"/>
              </svg>
              ${apartment.features.bathrooms} baths
            </div>
            <div class="feature-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              ${apartment.features.size}${apartment.features.sizeUnit}
            </div>
          </div>
          
          <div class="property-type">${apartment.type}</div>
        </div>
      </div>
    `).join('');
    }

    bindEvents() {
        // Unified search bar selects
        document.getElementById('filter-type')?.addEventListener('change', (e) => {
            this.updateFilterValue('type', e.target.value);
            this.animateSelectChange(e.target);
        });

        document.getElementById('filter-status')?.addEventListener('change', (e) => {
            this.updateFilterValue('status', e.target.value);
            this.animateSelectChange(e.target);
        });

        document.getElementById('filter-location')?.addEventListener('change', (e) => {
            this.updateFilterValue('location', e.target.value);
            this.animateSelectChange(e.target);
        });

        document.getElementById('filter-price')?.addEventListener('change', (e) => {
            if (e.target.value) {
                const [min, max] = e.target.value.split('-').map(Number);
                this.updateFilterValue('priceRange', { priceMin: min, priceMax: max });
            } else {
                this.updateFilterValue('priceRange', { priceMin: null, priceMax: null });
            }
            this.animateSelectChange(e.target);
        });

        document.getElementById('filter-bedrooms')?.addEventListener('change', (e) => {
            this.updateFilterValue('bedrooms', e.target.value ? parseInt(e.target.value) : null);
            this.animateSelectChange(e.target);
        });

        // Search button
        document.getElementById('search-button')?.addEventListener('click', () => {
            this.applyAllFilters();
            this.animateSearchButton();
        });

        // Remove dropdown option clicks to prevent dropdown from showing on click
        // We'll rely only on the native select behavior
        
        // Add focus and blur events for enhanced dropdown experience
        document.querySelectorAll('.unified-search-select').forEach(select => {
            select.addEventListener('focus', (e) => {
                const item = e.target.closest('.unified-search-item');
                item.style.backgroundColor = 'rgba(248, 211, 94, 0.05)';
            });
            
            select.addEventListener('blur', (e) => {
                const item = e.target.closest('.unified-search-item');
                item.style.backgroundColor = '';
            });
        });
    }

    updateFilterValue(filterType, value) {
        // Store the value but don't apply filters yet
        switch (filterType) {
            case 'type':
                this.currentFilters.type = value;
                break;
            case 'status':
                this.currentFilters.status = value;
                break;
            case 'location':
                this.currentFilters.location = value;
                break;
            case 'priceRange':
                this.currentFilters.priceMin = value.priceMin;
                this.currentFilters.priceMax = value.priceMax;
                break;
            case 'bedrooms':
                this.currentFilters.bedrooms = value;
                break;
            default:
                break;
        }
    }

    applyAllFilters() {
        this.filteredApartments = ApartmentUtils.filterApartments(this.apartments, this.currentFilters);
        this.applySorting();
        this.updateFilterUI();
    }

    applyFilters(newFilters) {
        this.currentFilters = { ...this.currentFilters, ...newFilters };
        this.filteredApartments = ApartmentUtils.filterApartments(this.apartments, this.currentFilters);
        this.applySorting();
        this.renderApartments();
    }

    applySorting() {
        this.filteredApartments = ApartmentUtils.sortApartments(this.filteredApartments, this.currentSort);
        this.renderApartments();
    }

    clearFilters() {
        this.currentFilters = {};
        this.currentSort = 'newest';
        this.filteredApartments = [...this.apartments];

        // Reset form inputs
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-location').value = '';
        document.getElementById('filter-price').value = '';
        document.getElementById('filter-bedrooms').value = '';

        // Reset active state on filter selects
        document.querySelectorAll('.filter-select, .unified-search-select').forEach(select => {
            select.classList.remove('active');
        });

        this.applySorting();
    }

    updateFilterUI() {
        // Update select dropdowns and set active state
        const filterType = document.getElementById('filter-type');
        filterType.value = this.currentFilters.type || '';
        filterType.classList.toggle('active', !!this.currentFilters.type);

        const filterStatus = document.getElementById('filter-status');
        filterStatus.value = this.currentFilters.status || '';
        filterStatus.classList.toggle('active', !!this.currentFilters.status);

        const filterLocation = document.getElementById('filter-location');
        filterLocation.value = this.currentFilters.location || '';
        filterLocation.classList.toggle('active', !!this.currentFilters.location);

        const filterBedrooms = document.getElementById('filter-bedrooms');
        filterBedrooms.value = this.currentFilters.bedrooms || '';
        filterBedrooms.classList.toggle('active', !!this.currentFilters.bedrooms);

        // Update price range
        const priceSelect = document.getElementById('filter-price');
        if (this.currentFilters.priceMin !== null && this.currentFilters.priceMax !== null) {
            priceSelect.value = `${this.currentFilters.priceMin}-${this.currentFilters.priceMax}`;
            priceSelect.classList.add('active');
        } else {
            priceSelect.value = '';
            priceSelect.classList.remove('active');
        }
    }
    
    animateSelectChange(selectElement) {
        // Add a subtle animation to the select element when changed
        const item = selectElement.closest('.unified-search-item');
        
        // Flash effect
        item.style.backgroundColor = 'rgba(248, 211, 94, 0.1)';
        
        setTimeout(() => {
            item.style.backgroundColor = '';
        }, 300);
        
        // If the select has a value, add the active class
        if (selectElement.value) {
            selectElement.classList.add('active');
        } else {
            selectElement.classList.remove('active');
        }
    }
    
    animateSearchButton() {
        // Add a pulse animation to the search button
        const button = document.getElementById('search-button');
        if (!button) return;
        
        button.style.transform = 'scale(0.95)';
        button.style.boxShadow = '0 2px 8px rgba(248, 211, 94, 0.5)';
        
        setTimeout(() => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 6px 16px rgba(248, 211, 94, 0.4)';
            
            setTimeout(() => {
                button.style.transform = '';
                button.style.boxShadow = '';
            }, 200);
        }, 100);
    }

    showPreview(id) {
        const apartment = apartmentsData.apartments.find(apt => apt.id === id);
        if (!apartment) return;

        // Create modal if it doesn't exist
        let modal = document.getElementById('preview-modal');
        if (!modal) {
            modal = this.createPreviewModal();
        }

        // Populate modal with apartment images
        this.populatePreviewModal(modal, apartment);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    createPreviewModal() {
        const modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="modernApartmentManager.closePreview()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="modernApartmentManager.closePreview()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div class="preview-header">
                        <h3>Property Preview</h3>
                    </div>
                    <div class="preview-slideshow">
                        <div class="slideshow-container">
                            <div class="slides-wrapper"></div>
                            <button class="prev-btn" onclick="modernApartmentManager.changeSlide(-1)">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15,18 9,12 15,6"></polyline>
                                </svg>
                            </button>
                            <button class="next-btn" onclick="modernApartmentManager.changeSlide(1)">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9,18 15,12 9,6"></polyline>
                                </svg>
                            </button>
                        </div>
                        <div class="slide-indicators"></div>
                    </div>
                    <div class="preview-actions">
                        <button class="proceed-btn" onclick="modernApartmentManager.proceedToProperty()">
                            Proceed to Property
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing style if it exists
        const existingStyle = document.getElementById('preview-modal-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Add styles
        const style = document.createElement('style');
        style.id = 'preview-modal-styles';
        style.textContent = `
            #preview-modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.4) !important;
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            .modal-overlay {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0, 0, 0, 0.4) !important;
            }
            .modal-content {
                background: transparent !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border-radius: 0 !important;
                padding: 40px !important;
                width: 100vw !important;
                height: 100vh !important;
                overflow-y: auto !important;
                position: relative !important;
                box-shadow: none !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
            }
            .modal-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            .modal-close:hover {
                background-color: #f5f5f5;
            }
            .preview-header h3 {
                margin: 0 0 20px 0;
                font-size: 24px;
                color: white;
            }
            .slideshow-container {
                position: relative;
                width: 100%;
                height: 70vh;
                overflow: hidden;
                border-radius: 8px;
                background: transparent;
            }
            .slides-wrapper {
                display: flex;
                width: 100%;
                height: 100%;
                transition: transform 0.3s ease;
            }
            .slide {
                flex: 0 0 100%;
                height: 100%;
            }
            .slide img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .prev-btn, .next-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255, 255, 255, 0.9);
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
            .prev-btn:hover, .next-btn:hover {
                background: white;
                transform: translateY(-50%) scale(1.1);
            }
            .prev-btn {
                left: 16px;
            }
            .next-btn {
                right: 16px;
            }
            .slide-indicators {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-top: 16px;
            }
            .indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ddd;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .indicator.active {
                background: #f8d35e;
            }
            .preview-actions {
                margin-top: 24px;
                text-align: center;
            }
            .proceed-btn {
                background: #f8d35e;
                color: #333;
                border: none;
                padding: 12px 32px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .proceed-btn:hover {
                background: #f7d143;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(248, 211, 94, 0.3);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        return modal;
    }

    populatePreviewModal(modal, apartment) {
        this.currentPreviewApartment = apartment;
        this.currentSlideIndex = 0;
        
        const allImages = [apartment.images.main, ...apartment.images.gallery];
        const slidesWrapper = modal.querySelector('.slides-wrapper');
        const indicators = modal.querySelector('.slide-indicators');
        
        // Clear existing content
        slidesWrapper.innerHTML = '';
        indicators.innerHTML = '';
        
        // Add slides
        allImages.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.innerHTML = `<img src="${image}" alt="${apartment.title} - Image ${index + 1}">`;
            slidesWrapper.appendChild(slide);
            
            // Add indicator
            const indicator = document.createElement('div');
            indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
            indicator.onclick = () => this.goToSlide(index);
            indicators.appendChild(indicator);
        });
        
        // Update navigation button visibility
        const prevBtn = modal.querySelector('.prev-btn');
        const nextBtn = modal.querySelector('.next-btn');
        prevBtn.style.display = allImages.length > 1 ? 'flex' : 'none';
        nextBtn.style.display = allImages.length > 1 ? 'flex' : 'none';
    }

    changeSlide(direction) {
        if (!this.currentPreviewApartment) return;
        
        const allImages = [this.currentPreviewApartment.images.main, ...this.currentPreviewApartment.images.gallery];
        this.currentSlideIndex = (this.currentSlideIndex + direction + allImages.length) % allImages.length;
        this.updateSlidePosition();
    }

    goToSlide(index) {
        this.currentSlideIndex = index;
        this.updateSlidePosition();
    }

    updateSlidePosition() {
        const modal = document.getElementById('preview-modal');
        const slidesWrapper = modal.querySelector('.slides-wrapper');
        const indicators = modal.querySelectorAll('.indicator');
        
        slidesWrapper.style.transform = `translateX(-${this.currentSlideIndex * 100}%)`;
        
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlideIndex);
        });
    }

    closePreview() {
        const modal = document.getElementById('preview-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    proceedToProperty() {
        if (this.currentPreviewApartment) {
            this.closePreview();
            window.location.href = `apartment-details.html?id=${this.currentPreviewApartment.id}`;
        }
    }

    viewApartment(id) {
        window.location.href = `apartment-details.html?id=${id}`;
    }
}

// Add featured property flag to some apartments for demonstration
apartmentsData.apartments.forEach((apartment, index) => {
    // Mark some apartments as featured
    apartment.featured = index % 3 === 0;
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('apartments-grid')) {
        window.modernApartmentManager = new ModernApartmentManager();
    }
});