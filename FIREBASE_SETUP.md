# Firebase Setup for La Mandanga

## 1. Create Firebase project

1. Go to https://console.firebase.google.com
2. Create new project "la-mandanga"
3. Disable Google Analytics (not needed)

## 2. Enable Authentication

1. Go to Authentication > Sign-in method
2. Enable "Email/Password"

## 3. Create Firestore Database

1. Go to Firestore Database > Create database
2. Select region (europe-west1 for Spain)
3. Start in test mode, then apply rules from `firestore.rules`

## 4. Enable Storage

1. Go to Storage > Get started
2. Select same region
3. Default rules are fine for now

## 5. Get config

1. Go to Project Settings > General > Your apps
2. Click "Web" icon to add a web app
3. Register app name "la-mandanga-web"
4. Copy the config values to `.env`:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 6. Set yourself as admin

After registering in the app:
1. Go to Firestore > users collection
2. Find your user document
3. Change `estado` to `"aprobado"` and `rol` to `"admin"`

## 7. Deploy Firestore rules

Copy contents of `firestore.rules` to Firestore > Rules tab and publish.
