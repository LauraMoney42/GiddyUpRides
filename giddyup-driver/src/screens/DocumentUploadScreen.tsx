// GiddyUpRides Driver — DocumentUploadScreen.tsx
// gu-006: Document upload step — driver's license + insurance (UI only, mocked for prototype).

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

interface Props {
  onDocumentsSubmitted: () => void;
}

interface DocState {
  uploaded: boolean;
  fileName: string | null;
}

export default function DocumentUploadScreen({ onDocumentsSubmitted }: Props) {
  const [license, setLicense] = useState<DocState>({ uploaded: false, fileName: null });
  const [insurance, setInsurance] = useState<DocState>({ uploaded: false, fileName: null });
  const [submitting, setSubmitting] = useState(false);

  const allUploaded = license.uploaded && insurance.uploaded;

  // Prototype: mock upload — no real file picker needed
  const mockUpload = (
    docType: 'license' | 'insurance',
    setter: React.Dispatch<React.SetStateAction<DocState>>
  ) => {
    const mockNames: Record<string, string> = {
      license: 'drivers_license.jpg',
      insurance: 'insurance_card.pdf',
    };
    setTimeout(() => {
      setter({ uploaded: true, fileName: mockNames[docType] });
    }, 600);
  };

  const handleSubmit = async () => {
    if (!allUploaded) {
      Alert.alert('Missing documents', 'Please upload both documents to continue.');
      return;
    }
    setSubmitting(true);
    // Prototype: simulate submit delay
    setTimeout(() => {
      setSubmitting(false);
      onDocumentsSubmitted();
    }, 1200);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Step 2 of 2</Text>
        <Text style={styles.title}>Upload Your Documents</Text>
        <Text style={styles.subtitle}>
          We need a few documents to verify your identity and eligibility to drive.
          This is a one-time step.
        </Text>
      </View>

      {/* Document cards */}
      <View style={styles.docList}>
        <DocCard
          icon="🪪"
          title="Driver's License"
          description="A clear photo of the front of your valid driver's license."
          docState={license}
          onUpload={() => mockUpload('license', setLicense)}
        />
        <DocCard
          icon="📄"
          title="Proof of Insurance"
          description="Current auto insurance card showing your name and vehicle."
          docState={insurance}
          onUpload={() => mockUpload('insurance', setInsurance)}
        />
      </View>

      {/* Privacy note */}
      <View style={styles.privacyNote}>
        <Text style={styles.privacyIcon}>🔒</Text>
        <Text style={styles.privacyText}>
          Your documents are encrypted and only used for driver verification. They are
          never shared with riders.
        </Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.button,
          (!allUploaded || submitting) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!allUploaded || submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Submit Application</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Doc card sub-component ──────────────────────────────────────────────────

interface DocCardProps {
  icon: string;
  title: string;
  description: string;
  docState: DocState;
  onUpload: () => void;
}

function DocCard({ icon, title, description, docState, onUpload }: DocCardProps) {
  const [uploading, setUploading] = useState(false);

  const handleTap = () => {
    if (docState.uploaded) return;
    setUploading(true);
    onUpload();
    setTimeout(() => setUploading(false), 700);
  };

  return (
    <View style={[styles.card, docState.uploaded && styles.cardDone]}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon}>{icon}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        {docState.uploaded && docState.fileName ? (
          <Text style={styles.cardFileName}>✓ {docState.fileName}</Text>
        ) : (
          <Text style={styles.cardDesc}>{description}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.uploadBtn, docState.uploaded && styles.uploadBtnDone]}
        onPress={handleTap}
        disabled={docState.uploaded || uploading}
        activeOpacity={0.75}
      >
        {uploading ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text style={[styles.uploadBtnText, docState.uploaded && styles.uploadBtnTextDone]}>
            {docState.uploaded ? '✓' : 'Upload'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  inner: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  step: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4A017',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
  },
  docList: {
    gap: 12,
    marginBottom: 24,
  },
  // Doc card
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  cardDone: {
    borderColor: '#2A7A4A',
    backgroundColor: '#0D1F15',
  },
  cardLeft: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: '#777',
    lineHeight: 17,
  },
  cardFileName: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  uploadBtn: {
    backgroundColor: '#D4A017',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 68,
    alignItems: 'center',
  },
  uploadBtnDone: {
    backgroundColor: '#2A7A4A',
  },
  uploadBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadBtnTextDone: {
    color: '#4CAF50',
  },
  // Privacy note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 28,
  },
  privacyIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  // Submit button
  button: {
    backgroundColor: '#D4A017',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
