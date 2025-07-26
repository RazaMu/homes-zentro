// Simple test suite for integrated property form submission with media
class AdminTests {
  constructor(zentroAdmin) {
    this.zentroAdmin = zentroAdmin;
    this.results = [];
  }

  async runAllTests() {
    console.log('🧪 Running Admin Tests...\n');
    
    await this.testPropertyFormWithoutMedia();
    await this.testPropertyFormWithMedia();
    await this.testMediaUploadValidation();
    await this.testPropertyMediaAssociation();
    
    this.displayResults();
  }

  async testPropertyFormWithoutMedia() {
    const testName = 'Property Form Submission Without Media';
    console.log(`Running: ${testName}`);
    
    try {
      // Fill form with test data
      document.getElementById('property-title').value = 'Test Property';
      document.getElementById('property-type').value = 'Villa';
      document.getElementById('property-status').value = 'For Sale';
      document.getElementById('property-price').value = '5000000';
      document.getElementById('property-area').value = 'Westlands';
      document.getElementById('property-city').value = 'Nairobi';
      document.getElementById('property-bedrooms').value = '3';
      document.getElementById('property-bathrooms').value = '2';
      document.getElementById('property-parking').value = '2';
      document.getElementById('property-size').value = '200';
      document.getElementById('property-description').value = 'Test description';
      // Main image field removed - will be set automatically from uploaded images
      document.getElementById('property-amenities').value = 'Pool, Gym';

      const initialCount = this.zentroAdmin.properties.length;
      
      // Submit form
      await this.zentroAdmin.saveProperty();
      
      const finalCount = this.zentroAdmin.properties.length;
      const success = finalCount === initialCount + 1;
      
      this.results.push({ test: testName, passed: success, message: success ? 'Property created successfully' : 'Property creation failed' });
      
    } catch (error) {
      this.results.push({ test: testName, passed: false, message: `Error: ${error.message}` });
    }
  }

  async testPropertyFormWithMedia() {
    const testName = 'Property Form Submission With Media';
    console.log(`Running: ${testName}`);
    
    try {
      // Create mock files
      const mockPhotoFile = new File(['photo content'], 'test-photo.jpg', { type: 'image/jpeg' });
      const mockVideoFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
      
      // Add files to media uploader
      this.zentroAdmin.propertyFormWithMedia.mediaUploader.selectedFiles.photos = [mockPhotoFile];
      this.zentroAdmin.propertyFormWithMedia.mediaUploader.selectedFiles.videos = [mockVideoFile];
      
      // Fill form with test data
      document.getElementById('property-title').value = 'Test Property with Media';
      document.getElementById('property-type').value = 'Apartment';
      document.getElementById('property-status').value = 'For Rent';
      document.getElementById('property-price').value = '80000';
      document.getElementById('property-area').value = 'Karen';
      document.getElementById('property-city').value = 'Nairobi';
      document.getElementById('property-bedrooms').value = '2';
      document.getElementById('property-bathrooms').value = '1';
      document.getElementById('property-parking').value = '1';
      document.getElementById('property-size').value = '120';
      document.getElementById('property-description').value = 'Test with media';
      // Main image field removed - will be set automatically from uploaded images
      document.getElementById('property-amenities').value = 'Security, Garden';

      const initialCount = this.zentroAdmin.properties.length;
      
      // Submit form
      await this.zentroAdmin.saveProperty();
      
      const finalCount = this.zentroAdmin.properties.length;
      const newProperty = this.zentroAdmin.properties[finalCount - 1];
      
      const success = finalCount === initialCount + 1 && 
                     newProperty.images.gallery.length > 0 &&
                     newProperty.videos && newProperty.videos.length > 0;
      
      this.results.push({ 
        test: testName, 
        passed: success, 
        message: success ? 'Property with media created successfully' : 'Property with media creation failed' 
      });
      
    } catch (error) {
      this.results.push({ test: testName, passed: false, message: `Error: ${error.message}` });
    }
  }

  async testMediaUploadValidation() {
    const testName = 'Media Upload Validation';
    console.log(`Running: ${testName}`);
    
    try {
      const mediaUploader = new MediaUploader();
      
      // Test with valid image files
      const validImageFiles = [
        new File(['content'], 'test.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'test.png', { type: 'image/png' })
      ];
      
      mediaUploader.handleFileSelection(validImageFiles, 'photos');
      const hasValidImages = mediaUploader.selectedFiles.photos.length === 2;
      
      // Test with valid video files
      const validVideoFiles = [
        new File(['content'], 'test.mp4', { type: 'video/mp4' })
      ];
      
      mediaUploader.handleFileSelection(validVideoFiles, 'videos');
      const hasValidVideos = mediaUploader.selectedFiles.videos.length === 1;
      
      const success = hasValidImages && hasValidVideos;
      
      this.results.push({ 
        test: testName, 
        passed: success, 
        message: success ? 'Media validation works correctly' : 'Media validation failed' 
      });
      
    } catch (error) {
      this.results.push({ test: testName, passed: false, message: `Error: ${error.message}` });
    }
  }

  async testPropertyMediaAssociation() {
    const testName = 'Property-Media Association Logic';
    console.log(`Running: ${testName}`);
    
    try {
      const mockFiles = {
        photos: [new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' })],
        videos: [new File(['video1'], 'video1.mp4', { type: 'video/mp4' })]
      };
      
      const uploadedMedia = await this.zentroAdmin.processMediaFiles(mockFiles);
      
      const hasPhotoUrls = uploadedMedia.photos.length === 1 && 
                          uploadedMedia.photos[0].includes('property-photo-');
      const hasVideoUrls = uploadedMedia.videos.length === 1 && 
                          uploadedMedia.videos[0].includes('property-video-');
      
      const success = hasPhotoUrls && hasVideoUrls;
      
      this.results.push({ 
        test: testName, 
        passed: success, 
        message: success ? 'Property-media association works correctly' : 'Property-media association failed' 
      });
      
    } catch (error) {
      this.results.push({ test: testName, passed: false, message: `Error: ${error.message}` });
    }
  }

  displayResults() {
    console.log('\n📊 Test Results:\n');
    
    let passed = 0;
    let total = this.results.length;
    
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status}: ${result.test}`);
      console.log(`   ${result.message}\n`);
      
      if (result.passed) passed++;
    });
    
    console.log(`Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Media upload integration is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the implementation.');
    }
  }
}

// Function to run tests
function runAdminTests() {
  if (window.zentroAdmin) {
    const tests = new AdminTests(window.zentroAdmin);
    tests.runAllTests();
  } else {
    console.error('ZentroAdmin instance not found. Please ensure the admin dashboard is loaded.');
  }
}

// Export for use
window.runAdminTests = runAdminTests;
window.AdminTests = AdminTests;