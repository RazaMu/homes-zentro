// Upload Progress UI Components for Zentro Homes Admin
class UploadProgressUI {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      showIndividualFiles: true,
      showBatchProgress: true,
      showSpeed: true,
      showETA: true,
      autoHide: false,
      hideDelay: 3000,
      ...options
    };
    
    this.isVisible = false;
    this.files = new Map();
    this.batchData = null;
    
    this.init();
  }

  init() {
    if (!this.container) {
      console.error('UploadProgressUI: Container not found');
      return;
    }
    
    this.createProgressUI();
    this.hide();
  }

  createProgressUI() {
    this.container.innerHTML = `
      <div class="upload-progress-overlay" id="upload-progress-overlay">
        <div class="upload-progress-modal">
          <div class="upload-progress-header">
            <h3 class="upload-progress-title">
              <svg class="upload-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17,8 12,3 7,8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Uploading Media Files
            </h3>
            <button class="upload-progress-close" id="upload-progress-close" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          ${this.options.showBatchProgress ? this.createBatchProgressHTML() : ''}
          
          <div class="upload-progress-content">
            <div class="upload-files-list" id="upload-files-list">
              <!-- File progress items will be added here -->
            </div>
          </div>
          
          <div class="upload-progress-actions">
            <button class="btn-secondary" id="upload-cancel-btn" type="button">Cancel Upload</button>
            <button class="btn-primary hidden" id="upload-done-btn" type="button">Done</button>
          </div>
        </div>
      </div>
    `;
    
    this.bindEvents();
  }

  createBatchProgressHTML() {
    return `
      <div class="batch-progress-section">
        <div class="batch-progress-info">
          <div class="batch-progress-stats">
            <span class="batch-progress-text" id="batch-progress-text">Preparing...</span>
            <span class="batch-progress-percentage" id="batch-progress-percentage">0%</span>
          </div>
          <div class="batch-progress-details">
            <span class="batch-files-count" id="batch-files-count">0 / 0 files</span>
            <span class="batch-speed" id="batch-speed">0 KB/s</span>
            <span class="batch-eta" id="batch-eta">--:--</span>
          </div>
        </div>
        <div class="batch-progress-bar">
          <div class="batch-progress-fill" id="batch-progress-fill" style="width: 0%"></div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Close button
    const closeBtn = document.getElementById('upload-progress-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Done button
    const doneBtn = document.getElementById('upload-done-btn');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => this.hide());
    }

    // Cancel button
    const cancelBtn = document.getElementById('upload-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.onCancel());
    }

    // Prevent modal close on backdrop click during upload
    const overlay = document.getElementById('upload-progress-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && this.batchData?.status !== 'processing') {
          this.hide();
        }
      });
    }
  }

  show() {
    this.isVisible = true;
    this.container.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add fade-in animation
    setTimeout(() => {
      this.container.classList.add('visible');
    }, 10);
  }

  hide() {
    this.isVisible = false;
    this.container.classList.remove('visible');
    
    setTimeout(() => {
      this.container.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
  }

  // Update batch progress
  updateBatchProgress(data) {
    this.batchData = data;
    
    if (!this.options.showBatchProgress) return;

    const textEl = document.getElementById('batch-progress-text');
    const percentageEl = document.getElementById('batch-progress-percentage');
    const filesCountEl = document.getElementById('batch-files-count');
    const speedEl = document.getElementById('batch-speed');
    const etaEl = document.getElementById('batch-eta');
    const fillEl = document.getElementById('batch-progress-fill');

    if (textEl) {
      let statusText = 'Processing...';
      if (data.type === 'batch') {
        if (data.processedFiles === data.totalFiles) {
          statusText = 'Upload Complete!';
        } else {
          statusText = `Uploading... (${data.processedFiles} of ${data.totalFiles})`;
        }
      }
      textEl.textContent = statusText;
    }

    if (percentageEl) {
      percentageEl.textContent = `${Math.round(data.progress || 0)}%`;
    }

    if (filesCountEl) {
      filesCountEl.textContent = `${data.processedFiles || 0} / ${data.totalFiles || 0} files`;
    }

    if (speedEl && data.speed) {
      speedEl.textContent = this.formatSpeed(data.speed);
    }

    if (etaEl && data.speed && data.totalBytes && data.uploadedBytes) {
      const remainingBytes = data.totalBytes - data.uploadedBytes;
      const eta = remainingBytes / data.speed;
      etaEl.textContent = this.formatETA(eta);
    }

    if (fillEl) {
      fillEl.style.width = `${data.progress || 0}%`;
    }
  }

  // Add file to progress list
  addFile(fileData) {
    if (!this.options.showIndividualFiles) return;

    this.files.set(fileData.id, fileData);
    
    const filesList = document.getElementById('upload-files-list');
    if (!filesList) return;

    const fileItem = document.createElement('div');
    fileItem.className = 'upload-file-item';
    fileItem.id = `file-${fileData.id}`;
    
    fileItem.innerHTML = this.createFileItemHTML(fileData);
    filesList.appendChild(fileItem);
  }

  createFileItemHTML(fileData) {
    const fileType = fileData.file.type.startsWith('image/') ? 'image' : 'video';
    const fileIcon = fileType === 'image' ? this.getImageIcon() : this.getVideoIcon();
    
    return `
      <div class="file-item-header">
        <div class="file-item-info">
          ${fileIcon}
          <div class="file-item-details">
            <div class="file-item-name" title="${fileData.file.name}">${fileData.file.name}</div>
            <div class="file-item-meta">
              <span class="file-size">${this.formatBytes(fileData.file.size)}</span>
              <span class="file-status" id="file-status-${fileData.id}">Queued</span>
            </div>
          </div>
        </div>
        <div class="file-item-progress-text" id="file-progress-text-${fileData.id}">0%</div>
      </div>
      <div class="file-progress-bar">
        <div class="file-progress-fill" id="file-progress-fill-${fileData.id}" style="width: 0%"></div>
      </div>
      <div class="file-error-message hidden" id="file-error-${fileData.id}"></div>
    `;
  }

  // Update individual file progress
  updateFileProgress(fileData) {
    const fileItem = document.getElementById(`file-${fileData.id}`);
    if (!fileItem) return;

    const statusEl = document.getElementById(`file-status-${fileData.id}`);
    const progressTextEl = document.getElementById(`file-progress-text-${fileData.id}`);
    const progressFillEl = document.getElementById(`file-progress-fill-${fileData.id}`);
    const errorEl = document.getElementById(`file-error-${fileData.id}`);

    // Update status
    if (statusEl) {
      let statusText = fileData.status || 'pending';
      let statusClass = 'file-status';
      
      switch (fileData.status) {
        case 'uploading':
          statusText = 'Uploading...';
          statusClass += ' status-uploading';
          break;
        case 'completed':
          statusText = 'Complete';
          statusClass += ' status-completed';
          break;
        case 'failed':
          statusText = 'Failed';
          statusClass += ' status-failed';
          break;
        case 'retrying':
          statusText = `Retry ${fileData.retryCount}`;
          statusClass += ' status-retrying';
          break;
        default:
          statusText = 'Queued';
          statusClass += ' status-pending';
      }
      
      statusEl.textContent = statusText;
      statusEl.className = statusClass;
    }

    // Update progress
    if (progressTextEl) {
      progressTextEl.textContent = `${Math.round(fileData.progress || 0)}%`;
    }

    if (progressFillEl) {
      progressFillEl.style.width = `${fileData.progress || 0}%`;
    }

    // Show/hide error message
    if (errorEl) {
      if (fileData.error) {
        errorEl.textContent = fileData.error;
        errorEl.classList.remove('hidden');
      } else {
        errorEl.classList.add('hidden');
      }
    }

    // Update file item class based on status
    fileItem.className = `upload-file-item file-${fileData.status || 'pending'}`;
  }

  // Handle status updates from BatchMediaProcessor
  onStatusUpdate(event, data) {
    switch (event) {
      case 'files_added':
        if (!this.isVisible) this.show();
        break;
        
      case 'batch_started':
        this.show();
        this.updateBatchProgress({
          type: 'batch',
          progress: 0,
          processedFiles: 0,
          totalFiles: data.totalFiles,
          uploadedBytes: 0,
          totalBytes: data.totalBytes
        });
        break;
        
      case 'file_started':
        this.updateFileProgress(data);
        break;
        
      case 'file_completed':
        this.updateFileProgress(data);
        break;
        
      case 'file_failed':
        this.updateFileProgress(data);
        break;
        
      case 'file_retry':
        this.updateFileProgress(data);
        break;
        
      case 'batch_completed':
        this.updateBatchProgress({
          type: 'batch',
          progress: 100,
          processedFiles: data.completedFiles,
          totalFiles: data.totalFiles,
          uploadedBytes: data.uploadedBytes,
          totalBytes: data.totalBytes
        });
        
        this.showCompletionState(data);
        break;
        
      case 'batch_cancelled':
        this.showCancelledState();
        break;
    }
  }

  // Show completion state
  showCompletionState(data) {
    const cancelBtn = document.getElementById('upload-cancel-btn');
    const doneBtn = document.getElementById('upload-done-btn');
    
    if (cancelBtn) cancelBtn.classList.add('hidden');
    if (doneBtn) doneBtn.classList.remove('hidden');

    // Auto-hide after delay if enabled
    if (this.options.autoHide && data.failedFiles === 0) {
      setTimeout(() => {
        if (this.isVisible) this.hide();
      }, this.options.hideDelay);
    }
  }

  // Show cancelled state
  showCancelledState() {
    const textEl = document.getElementById('batch-progress-text');
    if (textEl) textEl.textContent = 'Upload Cancelled';
    
    const cancelBtn = document.getElementById('upload-cancel-btn');
    const doneBtn = document.getElementById('upload-done-btn');
    
    if (cancelBtn) cancelBtn.classList.add('hidden');
    if (doneBtn) doneBtn.classList.remove('hidden');
  }

  // Reset UI for new batch
  reset() {
    this.files.clear();
    this.batchData = null;
    
    const filesList = document.getElementById('upload-files-list');
    if (filesList) filesList.innerHTML = '';
    
    // Reset batch progress
    if (this.options.showBatchProgress) {
      this.updateBatchProgress({
        type: 'batch',
        progress: 0,
        processedFiles: 0,
        totalFiles: 0,
        uploadedBytes: 0,
        totalBytes: 0
      });
    }
    
    // Reset buttons
    const cancelBtn = document.getElementById('upload-cancel-btn');
    const doneBtn = document.getElementById('upload-done-btn');
    
    if (cancelBtn) cancelBtn.classList.remove('hidden');
    if (doneBtn) doneBtn.classList.add('hidden');
  }

  // Event handlers
  onCancel() {
    if (this.onCancelCallback) {
      this.onCancelCallback();
    }
  }

  // Set cancel callback
  setCancelCallback(callback) {
    this.onCancelCallback = callback;
  }

  // Utility functions
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatSpeed(bytesPerSecond) {
    return this.formatBytes(bytesPerSecond) + '/s';
  }

  formatETA(seconds) {
    if (!seconds || seconds === Infinity) return '--:--';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      return `${hours}:${String(mins % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  getImageIcon() {
    return `
      <svg class="file-type-icon image-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
      </svg>
    `;
  }

  getVideoIcon() {
    return `
      <svg class="file-type-icon video-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    `;
  }
}

// Export for global use
window.UploadProgressUI = UploadProgressUI;