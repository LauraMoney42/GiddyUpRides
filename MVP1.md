# Giddy-Up Rides — MVP1 Scope Document
**Bundle ID:** com.kindcode.giddyuprides
**Date:** 2026-03-29
**Status:** Pre-Development

---

## Overview
Giddy-Up Rides is a ride-sharing service designed to give elderly users reliable, easy-to-use transportation. The rider app is accessibility-first by default. The driver app is clean, functional, and familiar to anyone who has used a rideshare platform before.

---

## MVP1 Scope

### In Scope
- ✅ Rider app — React Native (iOS + Android)
- ✅ Driver app — React Native (iOS + Android)
- ✅ Admin web dashboard — React (web)
- ✅ Firebase (Firestore + Auth + Storage)
- ✅ Google Maps SDK (real-time location, routing, ETA)
- ✅ Simulated payments (Stripe wired, test mode only)
- ✅ Full accessibility suite (rider app)
- ✅ Rides only

### Out of Scope (MVP2)
- ❌ Deliveries
- ❌ Live payments (Stripe production)
- ❌ Surge pricing
- ❌ Driver ratings/reviews system
- ❌ Scheduled/advance bookings

---

## Project Structure

```
GiddyUpRides/
├── giddyup-rider/        # React Native — Rider app (iOS + Android)
├── giddyup-driver/       # React Native — Driver app (iOS + Android)
├── giddyup-admin/        # React — Admin web dashboard
├── giddyup-backend/      # Node.js — API server (Firebase Functions or Railway)
└── Docs/                 # Project documentation
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Rider App | React Native (Expo or bare workflow) |
| Driver App | React Native (Expo or bare workflow) |
| Admin Dashboard | React + Tailwind CSS |
| Database | Firebase Firestore (real-time NoSQL) |
| Auth | Firebase Authentication |
| Storage | Firebase Storage (driver docs, photos) |
| Maps | Google Maps SDK (iOS + Android + Web) |
| Payments | Stripe (simulated / test mode for MVP1) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Backend | Node.js (Firebase Functions or Railway) |

---

## Rider App — Accessibility Requirements

### Welcome Screen (First Launch)
1. Choose text size — live preview of 3 options (Normal / Large / Extra Large)
2. "Would you like the app to read things aloud?" — Yes / No / Ask me later
3. Done → home screen

### Accessibility Suite
| Feature | Detail |
|---|---|
| Default large font | 22pt+ base, Dynamic Type support |
| Text size options | 3 tiers selectable at any time in Settings |
| Read aloud / TTS | All screens, status updates, driver info |
| VoiceOver + TalkBack | Full screen reader support (iOS + Android) |
| High contrast mode | Toggle — pure black/white option |
| Touch targets | 60×60pt minimum buttons |
| Haptic feedback | Confirm every button press |
| Tap-only gestures | No swipes, pinch-zoom, or drag interactions |
| No time-limits | No auto-dismissing toasts or countdowns |
| Confirmation dialogs | "Book this ride?" — prevents accidental orders |
| Plain language errors | "Can't connect — check your WiFi" style |
| Reduce Motion | Honors system reduce-motion setting |
| Biometric / PIN login | Face ID, Touch ID, or 4-digit PIN — no passwords |
| Caregiver mode | Family member can book rides on behalf of user |
| SOS button | Always visible on every screen |
| Driver card | Large photo, car color + make in plain text, ETA in words |
| SMS fallback | Ride confirmation + driver info sent via SMS |

---

## Driver App — Core Features
- Driver registration + document upload (license, insurance)
- Pending approval state (admin must approve before going live)
- Go online / Go offline toggle
- Incoming ride request card (accept / decline)
- Active ride map view (pickup → dropoff routing)
- Ride history
- Earnings summary (simulated for MVP1)

---

## Admin Web Dashboard — Core Features
- Driver approval queue (review docs, approve/suspend)
- Live map (all active rides)
- Ride history (search, filter, export)
- Rider account management (view, flag, ban)
- Caregiver link management
- SOS alert feed (emergency button triggers)
- Basic reports (daily/weekly ride counts)
- Service area settings

---

## Firebase Data Model (High Level)

### Collections
- `users` — riders (profile, accessibility prefs, caregiver links)
- `drivers` — driver profiles, docs, approval status, location
- `rides` — ride requests, status, timestamps, driver + rider refs
- `payments` — simulated payment records
- `alerts` — SOS events

---

## API Keys Needed Before Development
- [ ] Google Maps API key (Maps SDK for iOS, Maps SDK for Android, Maps JavaScript API for web)
  - Create at: https://console.cloud.google.com
  - Enable: Maps SDK for Android, Maps SDK for iOS, Maps JavaScript API, Directions API, Places API
- [ ] Firebase project (new — starting fresh)
- [ ] Stripe account (test mode keys only for MVP1)

---

## Brand
- **Name:** Giddy-Up Rides
- **Tagline:** Saddle Up!
- **Style:** Western logo/splash screen, then modern clean UI throughout
- **Colors:** TBD — warm earthy tones for branding, clean white/neutral for functional screens
- **Logo usage:** Western horse + "GIDDY-UP" branding on splash, app icon, and loading screen only

---

## MVP1 Milestones (TBD)
- [ ] Project scaffolding (3 apps + backend)
- [ ] Firebase setup + auth flows
- [ ] Rider app — accessibility welcome flow
- [ ] Rider app — book a ride flow
- [ ] Driver app — registration + approval flow
- [ ] Driver app — active ride flow
- [ ] Admin dashboard — driver approval + live map
- [ ] Google Maps integration (all 3 apps)
- [ ] Simulated payment flow
- [ ] End-to-end ride test (rider books → driver accepts → ride completes)
