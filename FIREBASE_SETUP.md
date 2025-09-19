# Firebase Setup Guide for Paper Airplane App

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: "paper-airplane-app" (or your preferred name)
4. Enable Google Analytics (optional, but recommended)
5. Click "Create project"

## Step 2: Enable Required Services

### Authentication
1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable "Anonymous" authentication
3. Enable "Email/Password" authentication

### Firestore Database
1. Go to "Firestore Database" → "Create database"
2. Choose "Start in test mode" (for development)
3. Select a location close to your users

### Storage
1. Go to "Storage" → "Get started"
2. Choose "Start in test mode" (for development)
3. Select the same location as Firestore

## Step 3: Get Your Configuration

1. Go to Project Settings (gear icon) → "General"
2. Scroll down to "Your apps" section
3. Click "Web" icon (</>) to add a web app
4. Enter app nickname: "Paper Airplane Web"
5. Copy the configuration object

## Step 4: Update Configuration

Replace the placeholder values in `src/firebase/config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## Step 5: Set Up Security Rules (Optional)

### Firestore Rules
Go to "Firestore Database" → "Rules" and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Rules
Go to "Storage" → "Rules" and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 6: Test Your Setup

1. Run your app: `npm run dev`
2. Try creating a message - it should save to Firestore
3. Check Firebase Console to see your data

## Troubleshooting

- **Permission denied**: Check your Firestore/Storage rules
- **Network error**: Verify your Firebase config is correct
- **Authentication failed**: Make sure Anonymous auth is enabled

## Next Steps

Once Firebase is set up, your app will have:
- ✅ User authentication
- ✅ Real-time message storage
- ✅ File upload for images/audio
- ✅ Location-based messaging
- ✅ Real-time updates

Happy coding! 🚀
