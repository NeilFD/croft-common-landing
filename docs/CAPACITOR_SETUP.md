# Common Beacon - Capacitor Mobile App Setup

## Phase 1: Native Shell Implementation

### Overview
This implements a native iOS and Android shell for the Croft Common PWA using Capacitor 6. The app loads the live PWA in a WebView with native features like deep linking and push notifications.

### Setup Instructions

#### 1. Initialize Native Projects
```bash
# Add iOS platform
npx cap add ios

# Add Android platform  
npx cap add android

# Build the web app
npm run build

# Sync to native platforms
npx cap sync
```

#### 2. iOS Setup (requires macOS + Xcode)
```bash
# Open in Xcode
npx cap open ios

# Configure in Xcode:
# - Set team/signing certificates
# - Configure app icons and launch screen
# - Test on simulator or device
npx cap run ios
```

#### 3. Android Setup
```bash
# Open in Android Studio
npx cap open android

# Configure in Android Studio:
# - Set signing certificates
# - Configure app icons and splash screen
# - Test on emulator or device
npx cap run android
```

### Features Implemented

#### ✅ Remote PWA Loading
- Loads live PWA from: `https://410602d4-4805-4fdf-8c51-900e548d9b20.lovableproject.com`
- No bundled build to avoid cache conflicts
- PWA updates automatically without app store releases

#### ✅ Deep Linking
- Universal links (iOS) and app links (Android) support
- Handles `/from-notification` deep links
- Redirects to appropriate PWA routes

#### ✅ Hidden Dev Panel
- Tap logo 7 times to open
- Shows: app version, platform, URL, network status, user agent
- Native-aware debugging information

#### ✅ Push Notifications (Basic)
- Requests permission on app launch
- Logs APNs/FCM tokens to console
- No server integration yet (Phase 2)

### App Store Deployment

#### iOS TestFlight
1. Archive in Xcode (Product > Archive)
2. Upload to App Store Connect
3. Configure TestFlight metadata
4. Add internal/external testers

#### Android Play Console
1. Generate signed APK/AAB in Android Studio
2. Upload to Google Play Console
3. Configure Closed Testing track
4. Add test users via email

### Configuration
- **App ID**: `com.croftcommon.beacon`
- **App Name**: Common Beacon
- **Remote URL**: Live PWA (always latest)
- **Platform**: Capacitor 6

The PWA functionality remains completely intact - this is purely a native wrapper.