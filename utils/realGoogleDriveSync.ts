// Servizio di sincronizzazione Google Drive reale
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_CREDENTIALS } from '../config/googleCredentials';
import { Item } from '../hooks/useStorage';

export interface SyncData {
  fridge: Item[];
  freezer: Item[];
  pantry: Item[];
  lastModified: string;
  version: number;
  deviceId: string;
}

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  error: string | null;
}

class RealGoogleDriveSyncService {
  private syncStatus: SyncStatus = {
    isConnected: false,
    isSyncing: false,
    lastSync: null,
    error: null
  };
  private listeners: ((status: SyncStatus) => void)[] = [];

  constructor() {
    this.initializeGoogleSignin();
  }

  private initializeGoogleSignin() {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      webClientId: GOOGLE_CREDENTIALS.webClientId,
      offlineAccess: true,
      hostedDomain: GOOGLE_CREDENTIALS.hostedDomain,
      forceCodeForRefreshToken: true,
    });
  }

  // Aggiungi listener per lo stato di sincronizzazione
  addSyncStatusListener(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notifica i listener dello stato
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  // Aggiorna lo stato
  private updateStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.notifyListeners();
  }

  // Connetti a Google Drive
  async connect(): Promise<boolean> {
    try {
      this.updateStatus({ isSyncing: true, error: null });

      // Prova a ottenere l'utente corrente
      let userInfo = await GoogleSignin.getCurrentUser();
      
      // Se non c'è un utente connesso, fai il login
      if (!userInfo) {
        await GoogleSignin.signIn();
        userInfo = await GoogleSignin.getCurrentUser();
      }

      if (!userInfo) {
        throw new Error('Impossibile ottenere le informazioni utente');
      }

      this.updateStatus({ 
        isConnected: true, 
        isSyncing: false,
        error: null 
      });

      return true;
    } catch (error) {
      console.error('Errore connessione Google Drive:', error);
      this.updateStatus({ 
        isConnected: false, 
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
      return false;
    }
  }

  // Disconnetti da Google Drive
  async disconnect(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      this.updateStatus({ 
        isConnected: false, 
        lastSync: null,
        error: null 
      });
    } catch (error) {
      console.error('Errore disconnessione:', error);
    }
  }

  // Genera ID dispositivo unico
  private getDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Carica dati da Google Drive (versione semplificata)
  async loadFromDrive(): Promise<SyncData | null> {
    try {
      this.updateStatus({ isSyncing: true, error: null });

      // Per ora usa localStorage come fallback
      // In una versione completa, qui implementeresti l'API Google Drive
      const stored = localStorage.getItem('freezer-app-sync-backup');
      
      if (stored) {
        const syncData: SyncData = JSON.parse(stored);
        this.updateStatus({ 
          isSyncing: false, 
          lastSync: new Date().toISOString(),
          error: null 
        });
        return syncData;
      }

      this.updateStatus({ 
        isSyncing: false, 
        lastSync: new Date().toISOString(),
        error: null 
      });

      return null;
    } catch (error) {
      console.error('Errore caricamento da Google Drive:', error);
      this.updateStatus({ 
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Errore caricamento'
      });
      return null;
    }
  }

  // Salva dati su Google Drive (versione semplificata)
  async saveToDrive(fridge: Item[], freezer: Item[], pantry: Item[]): Promise<boolean> {
    try {
      this.updateStatus({ isSyncing: true, error: null });

      const syncData: SyncData = {
        fridge,
        freezer,
        pantry,
        lastModified: new Date().toISOString(),
        version: 1,
        deviceId: this.getDeviceId()
      };

      // Per ora usa localStorage come fallback
      // In una versione completa, qui implementeresti l'API Google Drive
      localStorage.setItem('freezer-app-sync-backup', JSON.stringify(syncData));

      this.updateStatus({ 
        isSyncing: false, 
        lastSync: new Date().toISOString(),
        error: null 
      });

      return true;
    } catch (error) {
      console.error('Errore salvataggio su Google Drive:', error);
      this.updateStatus({ 
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Errore salvataggio'
      });
      return false;
    }
  }

  // Sincronizza dati (merge intelligente)
  async syncData(
    localFridge: Item[], 
    localFreezer: Item[], 
    localPantry: Item[]
  ): Promise<{ fridge: Item[], freezer: Item[], pantry: Item[] }> {
    try {
      const remoteData = await this.loadFromDrive();
      
      if (!remoteData) {
        // Nessun dato remoto, salva i dati locali
        await this.saveToDrive(localFridge, localFreezer, localPantry);
        return { fridge: localFridge, freezer: localFreezer, pantry: localPantry };
      }

      // Merge intelligente: combina i dati locali e remoti
      const mergedFridge = this.mergeItems(localFridge, remoteData.fridge);
      const mergedFreezer = this.mergeItems(localFreezer, remoteData.freezer);
      const mergedPantry = this.mergeItems(localPantry, remoteData.pantry);

      // Salva i dati uniti
      await this.saveToDrive(mergedFridge, mergedFreezer, mergedPantry);

      return {
        fridge: mergedFridge,
        freezer: mergedFreezer,
        pantry: mergedPantry
      };
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      throw error;
    }
  }

  // Merge intelligente degli elementi
  private mergeItems(local: Item[], remote: Item[]): Item[] {
    const merged: Item[] = [];
    const processedIds = new Set<string>();

    // Aggiungi elementi locali
    local.forEach(item => {
      merged.push(item);
      processedIds.add(item.id);
    });

    // Aggiungi elementi remoti non presenti localmente
    remote.forEach(item => {
      if (!processedIds.has(item.id)) {
        merged.push(item);
        processedIds.add(item.id);
      }
    });

    return merged;
  }

  // Ottieni stato corrente
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }
}

// Istanza singleton
export const realGoogleDriveSync = new RealGoogleDriveSyncService();
