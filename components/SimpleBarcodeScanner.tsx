import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SimpleBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function SimpleBarcodeScanner({ onScan, onClose }: SimpleBarcodeScannerProps) {
  const [manualBarcode, setManualBarcode] = useState('');

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode('');
    } else {
      Alert.alert('Errore', 'Inserisci un codice a barre valido');
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scanner Codice a Barre</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.scannerPlaceholder}>
            <Text style={styles.scannerIcon}>📷</Text>
            <Text style={styles.scannerText}>
              Scanner non disponibile
            </Text>
            <Text style={styles.scannerSubtext}>
              Inserisci manualmente il codice a barre
            </Text>
          </View>

          <View style={styles.manualInput}>
            <Text style={styles.inputLabel}>Codice a barre:</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={manualBarcode}
                onChangeText={setManualBarcode}
                placeholder="Inserisci il codice a barre"
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleManualSubmit}
              >
                <Text style={styles.submitButtonText}>Cerca</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Come usare:</Text>
            <Text style={styles.instructionText}>
              1. Trova il codice a barre sul prodotto
            </Text>
            <Text style={styles.instructionText}>
              2. Inserisci i numeri nel campo sopra
            </Text>
            <Text style={styles.instructionText}>
              3. Premi "Cerca" per trovare il prodotto
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0077cc',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scannerPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scannerIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  scannerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  scannerSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  manualInput: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginRight: 12,
  },
  submitButton: {
    backgroundColor: '#0077cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
