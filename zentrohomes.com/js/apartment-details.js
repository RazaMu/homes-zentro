// Apartment Details Page JavaScript
class ApartmentDetailsManager {
  constructor() {
    this.apartmentId = this.getApartmentIdFromUrl();
    this.apartment = null;
    this.currentImageIndex = 0;
    this.init();
  }

  init() {
    this.loadApartmentData();
    this.bindEvents();
  }

  getApartmentIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
  }

  loadApartmentData() {
    this.apartment = apartmentsData.apartments.find(apt => apt.id === this.apartmentId);

    if (!this.apartment) {
      this.showNotFound();
      return;
    }

    this.renderPropertyHeader();
    this.renderImageGallery();
    this.renderPropertyInfo();
    this.renderVideoPlayer();
    this.renderPropertyDetails();
    this.renderSimilarProperties();
    this.updatePageTitle();
  }

  showNotFound() {
    document.getElementById('property-header').innerHTML = `
      <div class="not-found">
        <h1 class="property-title">Property Not Found</h1>
        <p>The property you're looking for doesn't exist or has been removed.</p>
        <a href="index.html" class="btn">Back to Properties</a>
      </div>
    `;
  }

  updatePageTitle() {
    document.title = `${this.apartment.title} - ${this.apartment.location.area} | Zentro Homes`;
  }

  renderPropertyHeader() {
    const apartment = this.apartment;
    const headerContainer = document.getElementById('property-header');

    headerContainer.innerHTML = `
      <div class="property-title-row">
        <h1 class="property-title">${apartment.title}</h1>
        <div class="property-status-price">
          <div class="property-status ${apartment.status.toLowerCase().replace(' ', '-')}">${apartment.status}</div>
          <div class="property-price">${ApartmentUtils.formatPrice(apartment.price, apartment.currency)}</div>
        </div>
      </div>
      <div class="property-location">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.58172 7.58172 1 12 1C16.4183 1 21 5.58172 21 10Z" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>${apartment.location.area}, ${apartment.location.city}, ${apartment.location.country}</span>
      </div>
    `;
  }

  renderImageGallery() {
    const apartment = this.apartment;
    const allImages = [apartment.images.main, ...apartment.images.gallery];
    const galleryContainer = document.getElementById('property-gallery');

    galleryContainer.innerHTML = `
      <div class="main-image-container">
        <img src="${allImages[0]}" alt="${apartment.title}" class="main-image" id="main-image">
        <div class="image-counter">
          <span id="current-image">1</span> / ${allImages.length}
        </div>
      </div>
      <div class="gallery-thumbnails">
        ${allImages.map((image, index) => `
          <img src="${image}" alt="${apartment.title} - Image ${index + 1}" 
               class="thumbnail ${index === 0 ? 'active' : ''}" 
               data-index="${index}"
               onclick="apartmentDetails.changeMainImage(${index})">
        `).join('')}
      </div>
      
      <!-- Gallery Modal -->
      <div class="gallery-modal" id="gallery-modal">
        <div class="modal-content">
          <button class="modal-close" onclick="apartmentDetails.closeModal()">&times;</button>
          <button class="modal-nav modal-prev" onclick="apartmentDetails.prevImage()">&#8249;</button>
          <img src="" alt="" class="modal-image" id="modal-image">
          <button class="modal-nav modal-next" onclick="apartmentDetails.nextImage()">&#8250;</button>
        </div>
      </div>
      
      <!-- Swipe indicator for touch devices -->
      <div class="swipe-indicator">Swipe to navigate</div>
    `;

    // Make main image clickable to open modal
    document.getElementById('main-image').addEventListener('click', () => {
      this.openModal();
    });

    // Add touch-specific attributes for better mobile experience
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      const mainImage = document.getElementById('main-image');
      if (mainImage) {
        mainImage.setAttribute('role', 'button');
        mainImage.setAttribute('aria-label', 'View image gallery');
        mainImage.setAttribute('tabindex', '0');
      }

      // Add touch feedback to thumbnails
      const thumbnails = document.querySelectorAll('.thumbnail');
      thumbnails.forEach(thumb => {
        thumb.setAttribute('role', 'button');
        thumb.setAttribute('aria-label', `View image ${parseInt(thumb.dataset.index) + 1}`);
        thumb.setAttribute('tabindex', '0');
      });
    }
  }

  renderPropertyInfo() {
    const apartment = this.apartment;
    const infoContainer = document.getElementById('property-info');

    infoContainer.innerHTML = `
      <div class="property-description">
        <p>${apartment.description}</p>
      </div>
      
      <div class="property-features">
        <h3 class="features-title">Property Features</h3>
        <div class="features-grid">
          <div class="feature-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 9V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V9"/>
              <path d="M2 11H22"/>
              <path d="M2 15H22"/>
              <path d="M8 19V15"/>
              <path d="M16 19V15"/>
              <rect x="2" y="11" width="20" height="8" rx="1"/>
            </svg>
            <span>${apartment.features.bedrooms} Bedrooms</span>
          </div>
          <div class="feature-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 6L20 6C20.5523 6 21 6.44772 21 7V17C21 17.5523 20.5523 18 20 18H4C3.44772 18 3 17.5523 3 17V7C3 6.44772 3.44772 6 4 6H5"/>
              <circle cx="9" cy="12" r="2"/>
              <path d="M16 12H18"/>
              <path d="M6 9V15"/>
            </svg>
            <span>${apartment.features.bathrooms} Bathrooms</span>
          </div>
          <div class="feature-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="8" rx="2"/>
              <path d="M7 11V7C7 5.89543 7.89543 5 9 5H15C16.1046 5 17 5.89543 17 7V11"/>
              <circle cx="12" cy="15" r="1"/>
            </svg>
            <span>${apartment.features.parking} Parking Spaces</span>
          </div>
          <div class="feature-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z"/>
              <path d="M8 9L16 15"/>
              <path d="M16 9L8 15"/>
            </svg>
            <span>${apartment.features.size}${apartment.features.sizeUnit}</span>
          </div>
        </div>
      </div>
      
      <div class="property-amenities">
        <h3 class="features-title">Amenities</h3>
        <div class="amenities-list">
          ${apartment.amenities.map(amenity => `<span class="amenity-item">${amenity}</span>`).join('')}
        </div>
      </div>
      
      <div class="contact-actions">
        <a href="#" class="contact-btn primary" onclick="apartmentDetails.scheduleVisit()">Schedule a Visit</a>
        <a href="contact-us/index.html" class="contact-btn secondary">Contact Agent</a>
        <a href="tel:+254706641871" class="contact-btn secondary">Call Now</a>
      </div>
    `;
  }

  renderVideoPlayer() {
    const apartment = this.apartment;
    const videoSection = document.getElementById('property-video-section');

    // Check if the property has videos
    if (!apartment.videos || apartment.videos.length === 0) {
      videoSection.classList.add('hidden');
      return;
    }

    // Show the video section
    videoSection.classList.remove('hidden');

    // Create the video player HTML
    let videoPlayerHTML = `
      <div class="video-container">
        <h3>Property Videos</h3>
        <div class="video-player-wrapper">
          <video id="property-video" class="video-player" src="${apartment.videos[0].url}" poster="${apartment.videos[0].thumbnail}" preload="metadata"></video>
        </div>
        <div class="video-controls">
          <div class="video-control-group">
            <button id="play-pause-btn" class="video-control-btn" aria-label="Play">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <div class="video-time" id="video-time">0:00 / 0:00</div>
          </div>
          
          <div class="video-progress" id="video-progress">
            <div class="video-progress-bar" id="video-progress-bar"></div>
          </div>
          
          <div class="video-control-group">
            <div class="video-volume-container">
              <button id="mute-btn" class="video-control-btn" aria-label="Mute">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
              <div class="video-volume-slider" id="volume-slider">
                <div class="video-volume-level" id="volume-level"></div>
              </div>
            </div>
            <button id="fullscreen-btn" class="video-control-btn video-fullscreen-btn" aria-label="Fullscreen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            </button>
          </div>
        </div>
    `;

    // Add video playlist if there are multiple videos
    if (apartment.videos.length > 1) {
      videoPlayerHTML += `
        <div class="video-playlist">
          ${apartment.videos.map((video, index) => `
            <div class="video-playlist-item ${index === 0 ? 'active' : ''}" data-index="${index}" data-url="${video.url}">
              <img src="${video.thumbnail}" alt="${video.title}" class="video-playlist-thumbnail">
              <div class="video-playlist-overlay">
                <div class="video-playlist-play">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>
              <div class="video-playlist-title">${video.title}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Close the container
    videoPlayerHTML += `</div>`;

    // Set the HTML
    videoSection.innerHTML = videoPlayerHTML;

    // Initialize video player functionality
    this.initVideoPlayer();
  }

  initVideoPlayer() {
    const video = document.getElementById('property-video');
    if (!video) return;

    const playPauseBtn = document.getElementById('play-pause-btn');
    const muteBtn = document.getElementById('mute-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const videoProgress = document.getElementById('video-progress');
    const progressBar = document.getElementById('video-progress-bar');
    const videoTime = document.getElementById('video-time');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeLevel = document.getElementById('volume-level');
    const videoPlaylistItems = document.querySelectorAll('.video-playlist-item');

    // Play/Pause functionality
    playPauseBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        playPauseBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        `;
        playPauseBtn.setAttribute('aria-label', 'Pause');
      } else {
        video.pause();
        playPauseBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        `;
        playPauseBtn.setAttribute('aria-label', 'Play');
      }
    });

    // Update progress bar
    video.addEventListener('timeupdate', () => {
      const progress = (video.currentTime / video.duration) * 100;
      progressBar.style.width = `${progress}%`;

      // Update time display
      const currentMinutes = Math.floor(video.currentTime / 60);
      const currentSeconds = Math.floor(video.currentTime % 60);
      const durationMinutes = Math.floor(video.duration / 60) || 0;
      const durationSeconds = Math.floor(video.duration % 60) || 0;

      videoTime.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} / ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
    });

    // Click on progress bar to seek
    videoProgress.addEventListener('click', (e) => {
      const rect = videoProgress.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.currentTime = pos * video.duration;
    });

    // Mute/Unmute functionality
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;

      if (video.muted) {
        muteBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        `;
        volumeLevel.style.width = '0';
      } else {
        muteBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        `;
        volumeLevel.style.width = `${video.volume * 100}%`;
      }
    });

    // Volume slider functionality
    volumeSlider.addEventListener('click', (e) => {
      const rect = volumeSlider.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.volume = Math.max(0, Math.min(1, pos));
      volumeLevel.style.width = `${video.volume * 100}%`;

      // Update mute button if needed
      if (video.volume > 0 && video.muted) {
        video.muted = false;
        muteBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        `;
      }
    });

    // Fullscreen functionality
    fullscreenBtn.addEventListener('click', () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        const videoWrapper = document.querySelector('.video-player-wrapper');
        if (videoWrapper.requestFullscreen) {
          videoWrapper.requestFullscreen();
        } else if (videoWrapper.webkitRequestFullscreen) {
          videoWrapper.webkitRequestFullscreen();
        } else if (videoWrapper.msRequestFullscreen) {
          videoWrapper.msRequestFullscreen();
        }
      }
    });

    // Video ended event
    video.addEventListener('ended', () => {
      playPauseBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
      playPauseBtn.setAttribute('aria-label', 'Play');
    });

    // Video playlist functionality
    videoPlaylistItems.forEach(item => {
      item.addEventListener('click', () => {
        const videoUrl = item.dataset.url;
        const index = parseInt(item.dataset.index);

        // Update video source
        video.src = videoUrl;
        video.load();

        // Play the video
        video.play();
        playPauseBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        `;
        playPauseBtn.setAttribute('aria-label', 'Pause');

        // Update active class
        videoPlaylistItems.forEach(pl => pl.classList.remove('active'));
        item.classList.add('active');
      });
    });

    // Add touch event support for mobile devices
    if ('ontouchstart' in window) {
      // Add swipe gestures for video player
      let touchStartX = 0;
      let touchEndX = 0;

      video.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      });

      video.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      });

      const handleSwipe = () => {
        const swipeThreshold = 50;

        if (touchEndX < touchStartX - swipeThreshold) {
          // Swipe left - forward 10 seconds
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
        }

        if (touchEndX > touchStartX + swipeThreshold) {
          // Swipe right - backward 10 seconds
          video.currentTime = Math.max(0, video.currentTime - 10);
        }
      };
    }
  }

  renderPropertyDetails() {
    const apartment = this.apartment;
    const detailsContainer = document.getElementById('property-details-grid');

    detailsContainer.innerHTML = `
      <div class="detail-card">
        <h3>Property Details</h3>
        <ul class="detail-list">
          <li><span class="detail-label">Property Type</span><span class="detail-value">${apartment.type}</span></li>
          <li><span class="detail-label">Status</span><span class="detail-value">${apartment.status}</span></li>
          <li><span class="detail-label">Year Built</span><span class="detail-value">${apartment.yearBuilt}</span></li>
          <li><span class="detail-label">Furnished</span><span class="detail-value">${apartment.furnished ? 'Yes' : 'No'}</span></li>
          <li><span class="detail-label">Available</span><span class="detail-value">${apartment.available ? 'Yes' : 'No'}</span></li>
          <li><span class="detail-label">Date Added</span><span class="detail-value">${new Date(apartment.dateAdded).toLocaleDateString()}</span></li>
        </ul>
      </div>
      
      <div class="detail-card">
        <h3>Location Information</h3>
        <ul class="detail-list">
          <li><span class="detail-label">Area</span><span class="detail-value">${apartment.location.area}</span></li>
          <li><span class="detail-label">City</span><span class="detail-value">${apartment.location.city}</span></li>
          <li><span class="detail-label">Country</span><span class="detail-value">${apartment.location.country}</span></li>
        </ul>
      </div>
      
      <div class="detail-card">
        <h3>Financial Information</h3>
        <ul class="detail-list">
          <li><span class="detail-label">Price</span><span class="detail-value">${ApartmentUtils.formatPrice(apartment.price, apartment.currency)}</span></li>
          <li><span class="detail-label">Currency</span><span class="detail-value">${apartment.currency}</span></li>
          <li><span class="detail-label">Price per ${apartment.features.sizeUnit}</span><span class="detail-value">${ApartmentUtils.formatPrice(Math.round(apartment.price / apartment.features.size), apartment.currency)}</span></li>
        </ul>
      </div>
    `;
  }

  renderSimilarProperties() {
    const apartment = this.apartment;
    const similarProperties = apartmentsData.apartments
      .filter(apt => apt.id !== apartment.id && apt.location.area === apartment.location.area)
      .slice(0, 3);

    if (similarProperties.length === 0) {
      // If no properties in same area, show random properties
      const otherProperties = apartmentsData.apartments.filter(apt => apt.id !== apartment.id);
      similarProperties.push(...otherProperties.slice(0, 3));
    }

    const similarContainer = document.getElementById('similar-properties-grid');

    similarContainer.innerHTML = similarProperties.map(similar => `
      <div class="similar-property-card" onclick="apartmentDetails.viewProperty(${similar.id})">
        <img src="${similar.images.main}" alt="${similar.title}" class="similar-property-image">
        <div class="similar-property-content">
          <h4 class="similar-property-title">${similar.title}</h4>
          <div class="similar-property-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.58172 7.58172 1 12 1C16.4183 1 21 5.58172 21 10Z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>${similar.location.area}, ${similar.location.city}</span>
          </div>
          <div class="similar-property-price">${ApartmentUtils.formatPrice(similar.price, similar.currency)}</div>
        </div>
      </div>
    `).join('');
  }

  changeMainImage(index) {
    const apartment = this.apartment;
    const allImages = [apartment.images.main, ...apartment.images.gallery];
    const mainImage = document.getElementById('main-image');
    const currentImageSpan = document.getElementById('current-image');

    // Update main image
    mainImage.src = allImages[index];
    this.currentImageIndex = index;

    // Update counter
    currentImageSpan.textContent = index + 1;

    // Update thumbnail active state
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
  }

  openModal() {
    const modal = document.getElementById('gallery-modal');
    const modalImage = document.getElementById('modal-image');
    const apartment = this.apartment;
    const allImages = [apartment.images.main, ...apartment.images.gallery];

    modalImage.src = allImages[this.currentImageIndex];
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    const modal = document.getElementById('gallery-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  prevImage() {
    const apartment = this.apartment;
    const allImages = [apartment.images.main, ...apartment.images.gallery];
    this.currentImageIndex = (this.currentImageIndex - 1 + allImages.length) % allImages.length;
    this.updateModalImage();
    this.changeMainImage(this.currentImageIndex);
  }

  nextImage() {
    const apartment = this.apartment;
    const allImages = [apartment.images.main, ...apartment.images.gallery];
    this.currentImageIndex = (this.currentImageIndex + 1) % allImages.length;
    this.updateModalImage();
    this.changeMainImage(this.currentImageIndex);
  }

  updateModalImage() {
    const apartment = this.apartment;
    const allImages = [apartment.images.main, ...apartment.images.gallery];
    const modalImage = document.getElementById('modal-image');
    modalImage.src = allImages[this.currentImageIndex];
  }

  scheduleVisit() {
    // Scroll to contact section or show booking form
    const ctaSection = document.querySelector('.cta_section');
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      alert(`Interested in scheduling a visit to ${this.apartment.title}? Please contact us at +254706641871 or through our contact form.`);
    }
  }

  viewProperty(id) {
    window.location.href = `apartment-details.html?id=${id}`;
  }

  bindEvents() {
    // Keyboard navigation for modal
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('gallery-modal');
      if (modal && modal.classList.contains('active')) {
        switch (e.key) {
          case 'Escape':
            this.closeModal();
            break;
          case 'ArrowLeft':
            this.prevImage();
            break;
          case 'ArrowRight':
            this.nextImage();
            break;
        }
      }
    });

    // Close modal when clicking outside
    document.getElementById('gallery-modal')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('gallery-modal')) {
        this.closeModal();
      }
    });

    // Add touch swipe gestures for gallery
    this.addTouchGestures();
  }

  addTouchGestures() {
    // Add swipe gestures for main image
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
      let touchStartX = 0;
      let touchEndX = 0;
      let touchStartY = 0;
      let touchEndY = 0;
      let startTime = 0;

      mainImage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        startTime = new Date().getTime();
      }, { passive: true });

      mainImage.addEventListener('touchmove', (e) => {
        const currentX = e.changedTouches[0].screenX;
        const swipeDistance = currentX - touchStartX;

        // Add visual feedback during swipe if significant horizontal movement
        if (Math.abs(swipeDistance) > 30) {
          const direction = swipeDistance > 0 ? 'right' : 'left';
          mainImage.parentElement.setAttribute('data-swipe-direction', direction);
        }
      }, { passive: true });

      mainImage.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        const endTime = new Date().getTime();
        const touchDuration = endTime - startTime;

        // Remove visual feedback
        mainImage.parentElement.removeAttribute('data-swipe-direction');

        this.handleSwipe(touchStartX, touchEndX, touchStartY, touchEndY, touchDuration);
      }, { passive: true });
    }

    // Add swipe gestures for modal
    const modalImage = document.getElementById('modal-image');
    if (modalImage) {
      let touchStartX = 0;
      let touchEndX = 0;
      let touchStartY = 0;
      let touchEndY = 0;
      let startTime = 0;

      modalImage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        startTime = new Date().getTime();
      }, { passive: true });

      modalImage.addEventListener('touchmove', (e) => {
        const currentX = e.changedTouches[0].screenX;
        const swipeDistance = currentX - touchStartX;

        // Add visual feedback during swipe if significant horizontal movement
        if (Math.abs(swipeDistance) > 30) {
          const direction = swipeDistance > 0 ? 'right' : 'left';
          modalImage.parentElement.setAttribute('data-swipe-direction', direction);
        }
      }, { passive: true });

      modalImage.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        const endTime = new Date().getTime();
        const touchDuration = endTime - startTime;

        // Remove visual feedback
        modalImage.parentElement.removeAttribute('data-swipe-direction');

        this.handleSwipe(touchStartX, touchEndX, touchStartY, touchEndY, touchDuration);
      }, { passive: true });
    }

    // Add swipe gestures for similar properties
    const similarPropertiesGrid = document.getElementById('similar-properties-grid');
    if (similarPropertiesGrid) {
      let touchStartX = 0;
      let touchEndX = 0;
      let touchStartY = 0;
      let touchEndY = 0;
      let startTime = 0;
      let scrollStartPosition = 0;
      let isSwiping = false;

      // Add snap scrolling for better touch experience
      similarPropertiesGrid.style.scrollSnapType = 'x mandatory';

      // Add snap align to carousel items
      const items = similarPropertiesGrid.querySelectorAll('.similar-property-card');
      items.forEach(item => {
        item.style.scrollSnapAlign = 'center';
      });

      similarPropertiesGrid.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        startTime = new Date().getTime();
        scrollStartPosition = similarPropertiesGrid.scrollLeft;
        isSwiping = true;
      }, { passive: true });

      similarPropertiesGrid.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;

        const currentX = e.changedTouches[0].screenX;
        const currentY = e.changedTouches[0].screenY;
        const deltaX = touchStartX - currentX;
        const deltaY = Math.abs(touchStartY - currentY);

        // If primarily vertical scrolling, don't interfere
        if (deltaY > Math.abs(deltaX) * 1.5) {
          isSwiping = false;
          return;
        }

        // Add resistance at the edges
        if ((scrollStartPosition <= 0 && deltaX < 0) ||
          (scrollStartPosition >= similarPropertiesGrid.scrollWidth - similarPropertiesGrid.clientWidth && deltaX > 0)) {
          // Apply resistance at the edges
          similarPropertiesGrid.scrollLeft = scrollStartPosition + (deltaX * 0.3);
        } else {
          similarPropertiesGrid.scrollLeft = scrollStartPosition + deltaX;
        }
      }, { passive: true });

      similarPropertiesGrid.addEventListener('touchend', (e) => {
        if (!isSwiping) return;

        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        const endTime = new Date().getTime();
        const timeElapsed = endTime - startTime;

        this.handleCarouselSwipe(similarPropertiesGrid, touchStartX, touchEndX, touchStartY, touchEndY, timeElapsed, scrollStartPosition);
        isSwiping = false;
      }, { passive: true });
    }

    // Add touch gestures for video player
    const videoPlayer = document.getElementById('property-video');
    if (videoPlayer) {
      this.initVideoTouchGestures(videoPlayer);
    }
  }

  handleSwipe(touchStartX, touchEndX, touchStartY, touchEndY, touchDuration) {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    const verticalDistance = Math.abs(touchEndY - touchStartY);

    // Only process if it's a significant horizontal swipe and not primarily vertical
    if (Math.abs(swipeDistance) < swipeThreshold || verticalDistance > Math.abs(swipeDistance) * 1.5) return;

    // Add haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    if (swipeDistance < 0) {
      // Swipe left - next image
      this.nextImage();
      this.showSwipeIndicator('next');
    } else {
      // Swipe right - previous image
      this.prevImage();
      this.showSwipeIndicator('prev');
    }
  }

  handleCarouselSwipe(carousel, touchStartX, touchEndX, touchStartY, touchEndY, timeElapsed, scrollStartPosition) {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    const verticalDistance = Math.abs(touchEndY - touchStartY);

    // Only process if it's a significant horizontal swipe and not primarily vertical
    if (Math.abs(swipeDistance) < swipeThreshold || verticalDistance > Math.abs(swipeDistance) * 1.5) {
      // Snap to the nearest item
      this.snapToNearestItem(carousel);
      return;
    }

    // Calculate momentum scrolling
    if (timeElapsed < 300) {
      // Fast swipe - add momentum
      const momentum = swipeDistance * 3;
      const targetScroll = scrollStartPosition - momentum;

      // Smooth scroll to the target position
      carousel.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });

      // After momentum scrolling, snap to nearest item
      setTimeout(() => {
        this.snapToNearestItem(carousel);
      }, 300);
    } else {
      // Slow swipe - just snap to nearest item
      this.snapToNearestItem(carousel);
    }

    // Add haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
  }

  snapToNearestItem(carousel) {
    const items = carousel.querySelectorAll('.similar-property-card');
    if (!items.length) return;

    let minDistance = Infinity;
    let targetItem = null;
    const carouselLeft = carousel.scrollLeft;
    const carouselCenter = carouselLeft + (carousel.offsetWidth / 2);

    items.forEach(item => {
      const itemLeft = item.offsetLeft;
      const itemCenter = itemLeft + (item.offsetWidth / 2);
      const distance = Math.abs(carouselCenter - itemCenter);

      if (distance < minDistance) {
        minDistance = distance;
        targetItem = item;
      }
    });

    if (targetItem) {
      const targetLeft = targetItem.offsetLeft - ((carousel.offsetWidth - targetItem.offsetWidth) / 2);
      carousel.scrollTo({
        left: targetLeft,
        behavior: 'smooth'
      });
    }
  }

  initVideoTouchGestures(videoPlayer) {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    let touchStartTime = 0;

    videoPlayer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      touchStartTime = new Date().getTime();
    }, { passive: true });

    videoPlayer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      const touchEndTime = new Date().getTime();
      const touchDuration = touchEndTime - touchStartTime;

      // Handle video player touch interactions
      this.handleVideoPlayerTouch(videoPlayer, touchStartX, touchEndX, touchStartY, touchEndY, touchDuration);
    }, { passive: true });
  }

  handleVideoPlayerTouch(videoPlayer, touchStartX, touchEndX, touchStartY, touchEndY, touchDuration) {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    const verticalDistance = Math.abs(touchEndY - touchStartY);

    // Short tap - toggle play/pause
    if (Math.abs(swipeDistance) < 20 && verticalDistance < 20 && touchDuration < 300) {
      if (videoPlayer.paused) {
        videoPlayer.play();
        // Update play button UI
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (playPauseBtn) {
          playPauseBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          `;
          playPauseBtn.setAttribute('aria-label', 'Pause');
        }
      } else {
        videoPlayer.pause();
        // Update play button UI
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (playPauseBtn) {
          playPauseBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          `;
          playPauseBtn.setAttribute('aria-label', 'Play');
        }
      }
      return;
    }

    // Only process if it's a significant horizontal swipe and not primarily vertical
    if (Math.abs(swipeDistance) < swipeThreshold || verticalDistance > Math.abs(swipeDistance)) return;

    // Add haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    if (swipeDistance < 0) {
      // Swipe left - forward 10 seconds
      videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 10);
      this.showVideoSeekIndicator(videoPlayer, 'forward');
    } else {
      // Swipe right - backward 10 seconds
      videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
      this.showVideoSeekIndicator(videoPlayer, 'backward');
    }
  }

  showVideoSeekIndicator(videoPlayer, direction) {
    // Remove any existing indicators
    const existingIndicator = document.querySelector('.video-seek-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'video-seek-indicator';

    if (direction === 'forward') {
      indicator.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 4 15 12 5 20 5 4"></polygon>
          <polygon points="13 4 23 12 13 20 13 4"></polygon>
        </svg>
        <span>+10s</span>
      `;
    } else {
      indicator.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="19 20 9 12 19 4 19 20"></polygon>
          <polygon points="11 20 1 12 11 4 11 20"></polygon>
        </svg>
        <span>-10s</span>
      `;
    }

    // Add to video container
    const videoContainer = videoPlayer.closest('.video-player-wrapper');
    if (videoContainer) {
      videoContainer.appendChild(indicator);

      // Remove after animation
      setTimeout(() => {
        indicator.classList.add('fade-out');
        setTimeout(() => {
          indicator.remove();
        }, 500);
      }, 1000);
    }
  }

  showSwipeIndicator(direction) {
    // Remove any existing indicators
    const existingIndicator = document.querySelector('.swipe-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'swipe-indicator';

    if (direction === 'next') {
      indicator.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span>Next</span>
      `;
    } else if (direction === 'prev') {
      indicator.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        <span>Previous</span>
      `;
    }

    // Add to gallery container
    const galleryContainer = document.querySelector('.property-gallery');
    if (galleryContainer) {
      galleryContainer.appendChild(indicator);

      // Remove after animation
      setTimeout(() => {
        indicator.classList.add('fade-out');
        setTimeout(() => {
          indicator.remove();
        }, 500);
      }, 1000);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  if (window.location.pathname.includes('apartment-details')) {
    window.apartmentDetails = new ApartmentDetailsManager();
  }
});