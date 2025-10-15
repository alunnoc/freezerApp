import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
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

  const resetScanner = () => {
    setScanned(false);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Richiesta permessi camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Accesso alla camera negato</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Richiedi permesso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Chiudi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93'],
        }}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Scansiona codice a barre</Text>
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
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    marginRight: 40, // Compensa il pulsante chiusura
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
  button: {
    backgroundColor: '#0077cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});
