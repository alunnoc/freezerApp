import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface OfficialCameraScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function OfficialCameraScanner({ onScan, onClose }: OfficialCameraScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('Barcode scanned:', { type, data });
    
    // Supporta diversi tipi di barcode
    const supportedTypes = [
      'ean13',
      'ean8',
      'upc_a',
      'upc_e',
      'code128',
      'code39',
      'code93',
    ];

    if (supportedTypes.includes(type)) {
      onScan(data);
    } else {
      Alert.alert('Errore', 'Tipo di codice a barre non supportato');
      setScanned(false);
    }
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode('');
    } else {
      Alert.alert('Errore', 'Inserisci un codice a barre valido');
    }
  };

  const resetScanner = () => {
    setScanned(false);
  };

  const switchToManual = () => {
    setShowManualInput(true);
  };

  const switchToCamera = () => {
    setShowManualInput(false);
  };

  // Se non ha permessi o vuole input manuale
  if (!permission?.granted || showManualInput) {
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
            {/* Camera option */}
            {permission?.granted && (
              <View style={styles.optionCard}>
                <Text style={styles.optionIcon}>📷</Text>
                <Text style={styles.optionTitle}>Camera Scanner</Text>
                <Text style={styles.optionDescription}>
                  Scansiona il codice a barre con la camera
                </Text>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={switchToCamera}
                >
                  <Text style={styles.optionButtonText}>Usa Camera</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Manual input */}
            <View style={styles.optionCard}>
              <Text style={styles.optionIcon}>⌨️</Text>
              <Text style={styles.optionTitle}>Input Manuale</Text>
              <Text style={styles.optionDescription}>
                Inserisci il codice a barre manualmente
              </Text>
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

            {!permission?.granted && (
              <View style={styles.permissionCard}>
                <Text style={styles.permissionTitle}>⚠️ Camera non disponibile</Text>
                <Text style={styles.permissionText}>
                  L'accesso alla camera è stato negato. Puoi comunque inserire il codice a barre manualmente.
                </Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionButtonText}>Richiedi Permesso</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // Loading state
  if (!permission) {
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
            <Text style={styles.title}>Richiesta Permessi</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.message}>Richiesta permessi camera...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Camera scanner
  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93'],
          }}
        />
        
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Scansiona codice a barre</Text>
            <TouchableOpacity style={styles.manualButton} onPress={switchToManual}>
              <Text style={styles.manualButtonText}>⌨️</Text>
            </TouchableOpacity>
          </View>

          {/* Scanner frame */}
          <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.instructionText}>
              Inquadra il codice a barre nel riquadro
            </Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            {scanned && (
              <TouchableOpacity style={styles.resetButton} onPress={resetScanner}>
                <Text style={styles.resetButtonText}>Scansiona di nuovo</Text>
              </TouchableOpacity>
            )}
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
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  },
  manualButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButtonText: {
    color: 'white',
    fontSize: 20,
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 150,
    position: 'relative',
    marginBottom: 30,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#0077cc',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#0077cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  message: {
    color: '#333',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#0077cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  optionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    backgroundColor: '#f7f7f7',
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
  permissionCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
  },
});
