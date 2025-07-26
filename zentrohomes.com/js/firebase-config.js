// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase config - Replace with your actual config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "zentro-homes.firebaseapp.com",
  projectId: "zentro-homes",
  storageBucket: "zentro-homes.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize anonymous authentication for uploads
signInAnonymously(auth).catch((error) => {
  console.error('Auth initialization failed:', error);
});

// Storage utilities
export class FirebaseStorageManager {
  static async uploadImage(file, folder = 'properties') {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        path: snapshot.ref.fullPath,
        fileName: fileName
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  static async uploadMultipleImages(files, folder = 'properties', onProgress = null) {
    const uploads = [];
    let completed = 0;
    
    for (const file of files) {
      try {
        const result = await this.uploadImage(file, folder);
        uploads.push(result);
        completed++;
        
        if (onProgress) {
          onProgress(completed, files.length);
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        uploads.push({ error: error.message, fileName: file.name });
      }
    }
    
    return uploads;
  }

  static async deleteImage(imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }
}

// Firestore utilities
export class FirestoreManager {
  static async addProperty(propertyData) {
    try {
      const docRef = await addDoc(collection(db, 'properties'), {
        ...propertyData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Failed to add property:', error);
      throw error;
    }
  }

  static async getProperties(filters = {}) {
    try {
      let q = collection(db, 'properties');
      
      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.location) {
        q = query(q, where('location', '==', filters.location));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.bedrooms) {
        q = query(q, where('bedrooms', '==', parseInt(filters.bedrooms)));
      }
      
      // Order by created date
      q = query(q, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const properties = [];
      
      querySnapshot.forEach((doc) => {
        properties.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return properties;
    } catch (error) {
      console.error('Failed to get properties:', error);
      throw error;
    }
  }

  static async updateProperty(propertyId, updates) {
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, {
        ...updates,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Failed to update property:', error);
      throw error;
    }
  }

  static async deleteProperty(propertyId) {
    try {
      await deleteDoc(doc(db, 'properties', propertyId));
      return true;
    } catch (error) {
      console.error('Failed to delete property:', error);
      throw error;
    }
  }

  static async submitContact(contactData) {
    try {
      const docRef = await addDoc(collection(db, 'contacts'), {
        ...contactData,
        createdAt: new Date(),
        status: 'new'
      });
      return docRef.id;
    } catch (error) {
      console.error('Failed to submit contact:', error);
      throw error;
    }
  }
}