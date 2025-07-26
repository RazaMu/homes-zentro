

# Firebase Setup Guide for Zentro Homes

## Prerequisites
- Node.js (version 14 or higher)
- Firebase CLI
- Google account

## Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase
```bash
firebase login
```

## Step 3: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `zentro-homes`
4. Enable Google Analytics (optional)
5. Wait for project creation

## Step 4: Initialize Firebase in Your Project
```bash
cd your-project-directory
firebase init
```

Select these services:
- ✅ Hosting
- ✅ Firestore
- ✅ Storage
- ✅ Functions (optional)

Configuration:
- Use existing project: `zentro-homes`
- Database rules file: `firestore.rules`
- Database indexes file: `firestore.indexes.json`  
- Public directory: `zentrohomes.com`
- Single-page app: `Yes`
- Automatic builds: `No`
- Storage rules file: `storage.rules`

## Step 5: Update Firebase Configuration
Edit `zentrohomes.com/js/firebase-config.js` with your project credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "zentro-homes.firebaseapp.com",
  projectId: "zentro-homes",
  storageBucket: "zentro-homes.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

Get these values from:
Firebase Console → Project Settings → General → Your apps → Web app

## Step 6: Install Dependencies
```bash
npm install firebase
```

## Step 7: Update HTML Files
Add Firebase SDK to your HTML files (already added in index.html):

```html
<script type="module" src="js/firebase-config.js"></script>
<script type="module" src="js/firebase-properties.js"></script>
```

For admin panel:
```html
<script type="module" src="js/firebase-admin.js"></script>
```

## Step 8: Deploy Security Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Step 9: Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

Your site will be available at: `https://zentro-homes.web.app`

## Step 10: Set Up Custom Domain (Optional)
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain: `zentrohomes.com`
4. Follow DNS verification steps
5. Wait for SSL certificate provision

## Features Included

### 🏠 Property Management
- Add/Edit/Delete properties
- Image upload to Firebase Storage
- Real-time property search and filtering
- Responsive property cards

### 📸 Media Storage
- Automatic image optimization
- CDN delivery via Firebase
- Secure file upload rules
- Thumbnail generation (optional)

### 💬 Contact Management
- Contact form submissions stored in Firestore
- Email notifications (requires Cloud Functions)
- Lead tracking and management

### 🔒 Security
- Firebase Authentication ready
- Secure storage rules for media uploads
- Firestore security rules for data access

## Environment Variables
Create `.env` file for sensitive configuration:
```
FIREBASE_API_KEY=your-api-key
FIREBASE_PROJECT_ID=zentro-homes
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
```

## Monitoring and Analytics
- Firebase Analytics automatically tracks page views
- Performance monitoring available
- Storage and database usage tracking in Firebase Console

## Backup Strategy
- Firestore automatic backups available in Blaze plan
- Export data using Firebase CLI:
```bash
firebase firestore:export gs://zentro-homes.appspot.com/backups
```

## Troubleshooting

### Common Issues:
1. **Permission Denied**: Check Firestore and Storage rules
2. **Module Not Found**: Ensure Firebase SDK is properly imported
3. **CORS Errors**: Check Firebase hosting configuration
4. **Upload Fails**: Verify file size limits and authentication

### Support Resources:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Status Page](https://status.firebase.google.com/)

## Cost Estimation
### Free Tier Includes:
- 1GB storage
- 10GB/month hosting transfer
- 50K document reads/day
- 20K document writes/day

### Paid Features (Blaze Plan):
- Additional storage: $0.026/GB
- Additional transfer: $0.15/GB
- Functions: Pay per execution

## Maintenance
- Monitor usage in Firebase Console
- Update security rules as needed
- Regular backup of Firestore data
- Keep Firebase SDK updated

---

**Ready to deploy!** 🚀

Run `firebase deploy` to launch your Zentro Homes website on Firebase.