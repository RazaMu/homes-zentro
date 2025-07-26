// Batch Media Processor for Zentro Homes Admin
class BatchMediaProcessor {
  constructor(options = {}) {
    // Configuration
    this.options = {
      maxConcurrentUploads: 3,
      maxRetries: 3,
      retryDelay: 1000, // Base delay in ms
      chunkSize: 1024 * 1024, // 1MB chunks
      maxFileSize: 50 * 1024 * 1024, // 50MB max per file
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
      uploadEndpoint: 'api/upload.php',
      progressCallback: null,
      statusCallback: null,
      ...options
    };

    // State management
    this.uploadQueue = [];
    this.activeUploads = new Map();
    this.completedUploads = [];
    this.failedUploads = [];
    this.batchId = null;
    this.isProcessing = false;
    this.abortController = null;

    // Progress tracking
    this.totalFiles = 0;
    this.processedFiles = 0;
    this.totalBytes = 0;
    this.uploadedBytes = 0;
    this.startTime = null;

    this.init();
  }

  init() {
    // Create abort controller for cancelling uploads
    this.abortController = new AbortController();
  }

  // Add files to upload queue
  addFiles(files, propertyId) {
    if (!propertyId) {
      throw new Error('Property ID is required for file upload');
    }

    const validFiles = [];
    const invalidFiles = [];

    Array.from(files).forEach(file => {
      const validation = this.validateFile(file);
      if (validation.valid) {
        const uploadItem = {
          id: this.generateFileId(),
          file: file,
          propertyId: propertyId,
          status: 'pending',
          progress: 0,
          retryCount: 0,
          error: null,
          startTime: null,
          endTime: null
        };
        validFiles.push(uploadItem);
        this.uploadQueue.push(uploadItem);
      } else {
        invalidFiles.push({
          file: file,
          error: validation.error
        });
      }
    });

    this.totalFiles += validFiles.length;
    this.totalBytes += validFiles.reduce((sum, item) => sum + item.file.size, 0);

    // Trigger status callback
    this.triggerStatusCallback('files_added', {
      validFiles: validFiles.length,
      invalidFiles: invalidFiles.length,
      totalFiles: this.totalFiles,
      totalBytes: this.totalBytes
    });

    return {
      validFiles,
      invalidFiles,
      totalFiles: this.totalFiles
    };
  }

  // Validate individual file
  validateFile(file) {
    // Check file size
    if (file.size > this.options.maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${this.formatBytes(this.options.maxFileSize)}`
      };
    }

    // Check file type
    const isImage = this.options.allowedImageTypes.includes(file.type);
    const isVideo = this.options.allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${[...this.options.allowedImageTypes, ...this.options.allowedVideoTypes].join(', ')}`
      };
    }

    return { valid: true };
  }

  // Start processing the upload queue
  async startProcessing() {
    if (this.isProcessing) {
      console.warn('Processing already in progress');
      return;
    }

    if (this.uploadQueue.length === 0) {
      console.warn('No files to process');
      return;
    }

    this.isProcessing = true;
    this.startTime = Date.now();
    this.batchId = this.generateBatchId();

    // Create batch in database
    await this.createBatch();

    this.triggerStatusCallback('batch_started', {
      batchId: this.batchId,
      totalFiles: this.totalFiles,
      totalBytes: this.totalBytes
    });

    // Start concurrent uploads
    this.processQueue();
  }

  // Process upload queue with concurrency control
  async processQueue() {
    const promises = [];
    
    // Start up to maxConcurrentUploads
    for (let i = 0; i < this.options.maxConcurrentUploads && this.uploadQueue.length > 0; i++) {
      promises.push(this.processNextUpload());
    }

    // Wait for all active uploads to complete
    await Promise.allSettled(promises);

    // Process remaining files if any
    if (this.uploadQueue.length > 0 && this.isProcessing) {
      await this.processQueue();
    } else {
      await this.finalizeBatch();
    }
  }

  // Process next file in queue
  async processNextUpload() {
    if (this.uploadQueue.length === 0 || !this.isProcessing) {
      return;
    }

    const uploadItem = this.uploadQueue.shift();
    this.activeUploads.set(uploadItem.id, uploadItem);

    try {
      uploadItem.status = 'uploading';
      uploadItem.startTime = Date.now();
      
      this.triggerStatusCallback('file_started', uploadItem);

      await this.uploadFile(uploadItem);

      uploadItem.status = 'completed';
      uploadItem.endTime = Date.now();
      
      this.completedUploads.push(uploadItem);
      this.activeUploads.delete(uploadItem.id);
      this.processedFiles++;

      this.triggerStatusCallback('file_completed', uploadItem);

    } catch (error) {
      await this.handleUploadError(uploadItem, error);
    }
  }

  // Upload individual file with progress tracking
  async uploadFile(uploadItem) {
    const formData = new FormData();
    formData.append('file', uploadItem.file);
    formData.append('property_id', uploadItem.propertyId);
    formData.append('batch_id', this.batchId);
    formData.append('file_id', uploadItem.id);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          uploadItem.progress = (e.loaded / e.total) * 100;
          this.updateOverallProgress();
          this.triggerProgressCallback(uploadItem);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              uploadItem.serverResponse = response;
              resolve(response);
            } else {
              reject(new Error(response.message || 'Upload failed'));
            }
          } catch (e) {
            reject(new Error('Invalid server response'));
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'));
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Set up abort signal
      this.abortController.signal.addEventListener('abort', () => {
        xhr.abort();
      });

      // Send request
      xhr.open('POST', this.options.uploadEndpoint);
      xhr.send(formData);
    });
  }

  // Handle upload errors with retry logic
  async handleUploadError(uploadItem, error) {
    uploadItem.error = error.message;
    uploadItem.retryCount++;

    this.triggerStatusCallback('file_error', {
      ...uploadItem,
      error: error.message
    });

    // Retry logic with exponential backoff
    if (uploadItem.retryCount < this.options.maxRetries && this.isProcessing) {
      const delay = this.options.retryDelay * Math.pow(2, uploadItem.retryCount - 1);
      
      this.triggerStatusCallback('file_retry', {
        ...uploadItem,
        delay: delay
      });

      setTimeout(async () => {
        try {
          uploadItem.status = 'retrying';
          await this.uploadFile(uploadItem);
          
          uploadItem.status = 'completed';
          uploadItem.endTime = Date.now();
          
          this.completedUploads.push(uploadItem);
          this.activeUploads.delete(uploadItem.id);
          this.processedFiles++;

          this.triggerStatusCallback('file_completed', uploadItem);
          
        } catch (retryError) {
          await this.handleUploadError(uploadItem, retryError);
        }
      }, delay);
      
    } else {
      // Max retries exceeded
      uploadItem.status = 'failed';
      uploadItem.endTime = Date.now();
      
      this.failedUploads.push(uploadItem);
      this.activeUploads.delete(uploadItem.id);
      this.processedFiles++;

      this.triggerStatusCallback('file_failed', uploadItem);
    }
  }

  // Update overall progress
  updateOverallProgress() {
    // Calculate bytes uploaded
    this.uploadedBytes = 0;
    
    // Add completed files
    this.completedUploads.forEach(item => {
      this.uploadedBytes += item.file.size;
    });
    
    // Add progress from active uploads
    this.activeUploads.forEach(item => {
      this.uploadedBytes += (item.file.size * (item.progress / 100));
    });

    const overallProgress = this.totalBytes > 0 ? (this.uploadedBytes / this.totalBytes) * 100 : 0;
    
    this.triggerProgressCallback({
      type: 'batch',
      progress: overallProgress,
      processedFiles: this.processedFiles,
      totalFiles: this.totalFiles,
      uploadedBytes: this.uploadedBytes,
      totalBytes: this.totalBytes,
      speed: this.calculateUploadSpeed()
    });
  }

  // Calculate upload speed
  calculateUploadSpeed() {
    if (!this.startTime || this.uploadedBytes === 0) return 0;
    
    const elapsedTime = (Date.now() - this.startTime) / 1000; // seconds
    return this.uploadedBytes / elapsedTime; // bytes per second
  }

  // Create batch in database
  async createBatch() {
    try {
      const response = await fetch('api/create-batch.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_id: this.batchId,
          property_id: this.uploadQueue[0]?.propertyId,
          total_files: this.totalFiles,
          total_size: this.totalBytes
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }

  // Finalize batch processing
  async finalizeBatch() {
    this.isProcessing = false;
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const summary = {
      batchId: this.batchId,
      totalFiles: this.totalFiles,
      completedFiles: this.completedUploads.length,
      failedFiles: this.failedUploads.length,
      totalBytes: this.totalBytes,
      uploadedBytes: this.uploadedBytes,
      duration: duration,
      avgSpeed: this.calculateUploadSpeed()
    };

    // Update batch status in database
    try {
      await fetch('api/finalize-batch.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_id: this.batchId,
          ...summary
        })
      });
    } catch (error) {
      console.error('Error finalizing batch:', error);
    }

    this.triggerStatusCallback('batch_completed', summary);
  }

  // Cancel all uploads
  cancelUploads() {
    this.isProcessing = false;
    this.abortController.abort();
    
    // Reset state
    this.activeUploads.clear();
    this.uploadQueue = [];
    
    this.triggerStatusCallback('batch_cancelled', {
      batchId: this.batchId,
      processedFiles: this.processedFiles,
      totalFiles: this.totalFiles
    });
  }

  // Get current status
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      batchId: this.batchId,
      totalFiles: this.totalFiles,
      processedFiles: this.processedFiles,
      queuedFiles: this.uploadQueue.length,
      activeUploads: this.activeUploads.size,
      completedFiles: this.completedUploads.length,
      failedFiles: this.failedUploads.length,
      totalBytes: this.totalBytes,
      uploadedBytes: this.uploadedBytes,
      progress: this.totalBytes > 0 ? (this.uploadedBytes / this.totalBytes) * 100 : 0
    };
  }

  // Utility functions
  generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  }

  generateBatchId() {
    return 'batch_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Callback triggers
  triggerProgressCallback(data) {
    if (this.options.progressCallback && typeof this.options.progressCallback === 'function') {
      this.options.progressCallback(data);
    }
  }

  triggerStatusCallback(event, data) {
    if (this.options.statusCallback && typeof this.options.statusCallback === 'function') {
      this.options.statusCallback(event, data);
    }
  }

  // Reset processor for new batch
  reset() {
    this.cancelUploads();
    this.uploadQueue = [];
    this.completedUploads = [];
    this.failedUploads = [];
    this.batchId = null;
    this.totalFiles = 0;
    this.processedFiles = 0;
    this.totalBytes = 0;
    this.uploadedBytes = 0;
    this.startTime = null;
    this.abortController = new AbortController();
  }
}

// Export for global use
window.BatchMediaProcessor = BatchMediaProcessor;