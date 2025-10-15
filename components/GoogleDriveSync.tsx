// Componente per la sincronizzazione con Google Drive
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useGoogleDriveSync } from '../hooks/useGoogleDriveSync';
import { IconSymbol } from './ui/icon-symbol';

interface GoogleDriveSyncProps {
  onSyncComplete?: (data: { fridge: any[], freezer: any[], pantry: any[] }) => void;
}

export function GoogleDriveSync({ onSyncComplete }: GoogleDriveSyncProps) {
  const { syncStatus, connect, disconnect, syncData, saveToDrive, loadFromDrive } = useGoogleDriveSync();
  const [showModal, setShowModal] = useState(false);

  const handleConnect = async () => {
    try {
      const success = await connect();
      if (success) {
        Alert.alert('Successo', 'Connesso a Google Drive!');
      } else {
        Alert.alert('Errore', 'Impossibile connettersi a Google Drive');
      }
    } catch (error) {
      Alert.alert('Errore', 'Errore durante la connessione');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      Alert.alert('Disconnesso', 'Disconnesso da Google Drive');
    } catch (error) {
      Alert.alert('Errore', 'Errore durante la disconnessione');
    }
  };

  const handleSync = async () => {
    try {
      // Qui dovresti passare i dati attuali del frigo/freezer/credenza
      // Per ora uso array vuoti come esempio
      const result = await syncData([], [], []);
      onSyncComplete?.(result);
      Alert.alert('Sincronizzato', 'Dati sincronizzati con successo!');
    } catch (error) {
      Alert.alert('Errore', 'Errore durante la sincronizzazione');
    }
  };

  const handleSave = async () => {
    try {
      // Qui dovresti passare i dati attuali del frigo/freezer/credenza
      const success = await saveToDrive([], [], []);
      if (success) {
        Alert.alert('Salvato', 'Dati salvati su Google Drive!');
      } else {
        Alert.alert('Errore', 'Errore durante il salvataggio');
      }
    } catch (error) {
      Alert.alert('Errore', 'Errore durante il salvataggio');
    }
  };

  const handleLoad = async () => {
    try {
      const data = await loadFromDrive();
      if (data) {
        onSyncComplete?.(data);
        Alert.alert('Caricato', 'Dati caricati da Google Drive!');
      } else {
        Alert.alert('Nessun dato', 'Nessun dato trovato su Google Drive');
      }
    } catch (error) {
      Alert.alert('Errore', 'Errore durante il caricamento');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.syncButton}
        onPress={() => setShowModal(true)}
      >
        <IconSymbol 
          name="icloud.and.arrow.up" 
          size={20} 
          color={syncStatus.isConnected ? '#4CAF50' : '#666'} 
        />
        <Text style={styles.syncButtonText}>
          {syncStatus.isConnected ? 'Sincronizzato' : 'Sincronizza'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <Text style={styles.modalTitle}>Sincronizzazione Google Drive</Text>
            
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Stato:</Text>
                <Text style={[
                  styles.statusValue,
                  { color: syncStatus.isConnected ? '#4CAF50' : '#F44336' }
                ]}>
                  {syncStatus.isConnected ? 'Connesso' : 'Disconnesso'}
                </Text>
              </View>
              
              {syncStatus.lastSync && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Ultima sincronizzazione:</Text>
                  <Text style={styles.statusValue}>
                    {new Date(syncStatus.lastSync).toLocaleString('it-IT')}
                  </Text>
                </View>
              )}
              
              {syncStatus.error && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Errore:</Text>
                  <Text style={[styles.statusValue, { color: '#F44336' }]}>
                    {syncStatus.error}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {!syncStatus.isConnected ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.connectButton]}
                  onPress={handleConnect}
                  disabled={syncStatus.isSyncing}
                >
                  {syncStatus.isSyncing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <IconSymbol name="icloud.and.arrow.up" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Connetti</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                   <TouchableOpacity
                     style={[styles.actionButton, styles.syncActionButton]}
                     onPress={handleSync}
                     disabled={syncStatus.isSyncing}
                   >
                    {syncStatus.isSyncing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <IconSymbol name="arrow.triangle.2.circlepath" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Sincronizza</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSave}
                    disabled={syncStatus.isSyncing}
                  >
                    <IconSymbol name="square.and.arrow.up" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Salva</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.loadButton]}
                    onPress={handleLoad}
                    disabled={syncStatus.isSyncing}
                  >
                    <IconSymbol name="square.and.arrow.down" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Carica</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.disconnectButton]}
                    onPress={handleDisconnect}
                    disabled={syncStatus.isSyncing}
                  >
                    <IconSymbol name="xmark.circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Disconnetti</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  syncButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  syncActionButton: {
    backgroundColor: '#2196F3',
  },
  saveButton: {
    backgroundColor: '#FF9800',
  },
  loadButton: {
    backgroundColor: '#9C27B0',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});
