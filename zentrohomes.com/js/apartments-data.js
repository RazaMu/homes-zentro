// Zentro Homes Property Data - Will be populated from database
const apartmentsData = {
  apartments: [
    // Properties will be loaded from database via API
  ],
  
  // Filter options for search
  filters: {
    locations: [
      "Kilimani", "Westlands", "Karen", "Lavington", "Runda", 
      "Muthaiga", "Spring Valley", "Riverside", "Kileleshwa", "Gigiri"
    ],
    types: [
      "Villa", "Apartment", "Penthouse", "Condo", "House", "Studio"
    ],
    priceRanges: [
      { min: 0, max: 5000000, label: "Under KES 5M" },
      { min: 5000000, max: 15000000, label: "KES 5M - 15M" },
      { min: 15000000, max: 30000000, label: "KES 15M - 30M" },
      { min: 30000000, max: 50000000, label: "KES 30M - 50M" },
      { min: 50000000, max: 100000000, label: "KES 50M - 100M" },
      { min: 100000000, max: null, label: "Above KES 100M" }
    ],
    bedrooms: [1, 2, 3, 4, 5, 6, 7, 8]
  }
};

// Utility functions for apartment data
const ApartmentUtils = {
  // Format price with currency
  formatPrice(price, currency = 'KES') {
    if (price >= 1000000) {
      return `${currency} ${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${currency} ${(price / 1000).toFixed(0)}K`;
    } else {
      return `${currency} ${price.toLocaleString()}`;
    }
  },

  // Filter apartments based on criteria
  filterApartments(apartments, filters) {
    return apartments.filter(apartment => {
      // Status filter
      if (filters.status && apartment.status !== filters.status) return false;

      // Location filter
      if (filters.location && apartment.location.area !== filters.location) return false;

      // Type filter
      if (filters.type && apartment.type !== filters.type) return false;

      // Price filter
      if (filters.priceMin !== null && apartment.price < filters.priceMin) return false;
      if (filters.priceMax !== null && apartment.price > filters.priceMax) return false;

      // Bedrooms filter
      if (filters.bedrooms && apartment.features.bedrooms !== filters.bedrooms) return false;

      return true;
    });
  },

  // Sort apartments by various criteria
  sortApartments(apartments, sortBy = 'dateAdded', sortOrder = 'desc') {
    return [...apartments].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'price':
          valueA = a.price;
          valueB = b.price;
          break;
        case 'size':
          valueA = a.features.size;
          valueB = b.features.size;
          break;
        case 'bedrooms':
          valueA = a.features.bedrooms;
          valueB = b.features.bedrooms;
          break;
        case 'dateAdded':
        default:
          valueA = new Date(a.dateAdded || '2025-01-01');
          valueB = new Date(b.dateAdded || '2025-01-01');
          break;
      }

      if (sortOrder === 'desc') {
        return valueB > valueA ? 1 : -1;
      } else {
        return valueA > valueB ? 1 : -1;
      }
    });
  },

  // Get apartment by ID
  getApartmentById(id) {
    return apartmentsData.apartments.find(apt => apt.id === parseInt(id));
  },

  // Get featured apartments
  getFeaturedApartments(limit = 6) {
    return apartmentsData.apartments
      .filter(apt => apt.available)
      .slice(0, limit);
  },

  // Load apartments from API
  async loadApartments() {
    try {
      const response = await fetch('api/properties.php');
      const data = await response.json();
      
      if (data.success) {
        apartmentsData.apartments = data.properties || [];
        return data.properties;
      } else {
        console.error('Failed to load properties:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      return [];
    }
  },

  // Search apartments by text
  searchApartments(query) {
    if (!query) return apartmentsData.apartments;
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return apartmentsData.apartments.filter(apartment => {
      const searchableText = [
        apartment.title,
        apartment.description,
        apartment.type,
        apartment.location.area,
        apartment.location.city,
        ...(apartment.amenities || [])
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  }
};

// Initialize data loading
document.addEventListener('DOMContentLoaded', function() {
  // Load properties from database when page loads
  ApartmentUtils.loadApartments().then(properties => {
    // Trigger update for any components that depend on apartment data
    window.dispatchEvent(new CustomEvent('apartmentsLoaded', { 
      detail: { properties } 
    }));
  });
});