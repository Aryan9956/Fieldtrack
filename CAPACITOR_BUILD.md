# FieldTrack — Capacitor Android APK Build Guide

This guide explains how to build the complete, functional **FieldTrack Android APK** using Capacitor.

---

## 🎯 Architecture Summary

Next.js App Router applications use server-side features (API routes, JWT verification, Prisma SQLite/PostgreSQL database connections, Server-Sent Events real-time maps).

In Capacitor, there are two ways to build your Android APK:

### **Method 1: Live Hosted Server URL (Recommended for Full SaaS Functionality)**
The APK loads your live hosted SaaS URL (e.g. `https://fieldtrack.yourdomain.com`) or your local network IP (e.g. `http://192.168.1.5:3000` / `http://10.0.2.2:3000` for Android Emulator) inside native WebView.

- **Benefits**:
  - 100% of Next.js features work out of the box (Prisma DB, JWT Cookies, API routes, Live Leaflet Maps, Realtime SSE).
  - Native Android Geolocation API permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`) are enabled natively in `AndroidManifest.xml`.
  - When you update your web app, the Android app updates automatically without forcing users to re-install an APK!

---

## 🛠️ Step-by-Step Instructions to Build the Android APK

### Step 1: Configure Target Backend URL
In `capacitor.config.ts`, set `server.url` to your public SaaS domain or local development IP:

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.fieldtrack.app',
  appName: 'FieldTrack',
  webDir: 'out',
  server: {
    // For Production Deployment:
    url: 'https://fieldtrack.yourdomain.com',

    // For Local Dev Testing on Android Emulator:
    // url: 'http://10.0.2.2:3000',

    // For Local Dev Testing on Physical Phone (Same Wi-Fi):
    // url: 'http://192.168.1.5:3000',

    cleartext: true,
    androidScheme: 'https',
  }
};
```

### Step 2: Sync Capacitor Assets & Native Android Plugins
Run in terminal:
```powershell
npx cap sync android
```

### Step 3: Build the APK using Gradle / Android Studio

#### Option A: CLI Build (No Android Studio required if Android SDK installed)
```powershell
cd android
.\gradlew assembleDebug
```
The compiled APK file will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Open in Android Studio
```powershell
npx cap open android
```
In Android Studio:
1. Go to **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
2. Once complete, click **Locate** to copy `app-debug.apk`.

---

## 📱 Testing on Android Phone / Emulator

1. Install `app-debug.apk` on your phone.
2. Open **FieldTrack**.
3. Sign in as employee:
   - **Email**: `rahul@demo.com`
   - **Password**: `emp123`
4. Tap **START WORK** -> Android will prompt: *"Allow FieldTrack to access this device's location?"* -> Tap **While using the app** / **Allow**.
5. GPS tracking is now active!
