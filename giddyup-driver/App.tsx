// GiddyUpRides Driver App — App.tsx
// gu-006: State-based navigator for driver auth + onboarding flow.
//
// Screen flow:
//   login → (register → documentUpload → pendingApproval)
//           └─ existing users go straight to pendingApproval (or home, future)

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DocumentUploadScreen from './src/screens/DocumentUploadScreen';
import PendingApprovalScreen from './src/screens/PendingApprovalScreen';

type Screen = 'login' | 'register' | 'documentUpload' | 'pendingApproval';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [driverName, setDriverName] = useState<string | undefined>(undefined);

  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return (
          <LoginScreen
            onLoginSuccess={() => setScreen('pendingApproval')}
            onGoToRegister={() => setScreen('register')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onRegistered={() => setScreen('documentUpload')}
            onGoToLogin={() => setScreen('login')}
          />
        );
      case 'documentUpload':
        return (
          <DocumentUploadScreen
            onDocumentsSubmitted={() => setScreen('pendingApproval')}
          />
        );
      case 'pendingApproval':
        return (
          <PendingApprovalScreen
            driverName={driverName}
            onSignOut={() => {
              setDriverName(undefined);
              setScreen('login');
            }}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
});
