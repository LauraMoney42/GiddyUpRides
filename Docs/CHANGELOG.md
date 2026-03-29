## 2026-03-29 — Text Size Floor audit and documentation

- Added **Text Size Floor** rule to `STYLE_GUIDE.md` (Typography section) and `MVP1.md` (Accessibility Suite section)
- Replaced all raw hardcoded `fontSize: N` values in `screens/` with `FontSize.X` constants from `constants/theme.ts`
- Added `FontSize` to the theme import in `screens/welcome/TextSizeScreen.tsx` and `screens/welcome/ReadAloudScreen.tsx`
- Files affected: `STYLE_GUIDE.md`, `MVP1.md`, `screens/HomeScreen.tsx`, `screens/SettingsScreen.tsx`, `screens/LiveRideScreen.tsx`, `screens/SOSScreen.tsx`, `screens/EmergencyContactScreen.tsx`, `screens/ScheduleRideScreen.tsx`, `screens/ScheduledRidesScreen.tsx`, `screens/RideHistoryScreen.tsx`, `screens/BookingScreen.tsx`, `screens/onboarding/MobilitySetupScreen.tsx`, `screens/onboarding/LegalDisclaimerScreen.tsx`, `screens/onboarding/NotificationPermissionScreen.tsx`, `screens/onboarding/OnboardingSlides.tsx`, `screens/onboarding/WelcomeSplashScreen.tsx`, `screens/onboarding/NameSetupScreen.tsx`, `screens/welcome/TextSizeScreen.tsx`, `screens/welcome/ReadAloudScreen.tsx`
