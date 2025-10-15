// Servizio di sincronizzazione Google Drive per Expo
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

class ExpoGoogleDriveSyncService {
  private syncStatus: SyncStatus = {
    isConnected: false,
    isSyncing: false,
    lastSync: null,
    error: null
  };
  private listeners: ((status: SyncStatus) => void)[] = [];

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

  // Simula connessione a Google Drive
  async connect(): Promise<boolean> {
    try {
      this.updateStatus({ isSyncing: true, error: null });

      // Simula il processo di connessione
      await new Promise(resolve => setTimeout(resolve, 2000));

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
        error: 'Google Drive non disponibile in modalità demo'
      });
      return false;
    }
  }

  // Simula disconnessione
  async disconnect(): Promise<void> {
    try {
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

  // Simula caricamento dati da Google Drive
  async loadFromDrive(): Promise<SyncData | null> {
    try {
      this.updateStatus({ isSyncing: true, error: null });

      // Simula il caricamento
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Restituisce dati di esempio
      const mockData: SyncData = {
        fridge: [
          { id: '1', name: 'Latte', qty: 1, unit: 'L', category: 'dairy', expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '2', name: 'Uova', qty: 6, unit: 'pz', category: 'dairy', expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }
        ],
        freezer: [
          { id: '3', name: 'Pesce', qty: 500, unit: 'g', category: 'meat', expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
        ],
        pantry: [
          { id: '4', name: 'Pasta', qty: 500, unit: 'g', category: 'grains', expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }
        ],
        lastModified: new Date().toISOString(),
        version: 1,
        deviceId: this.getDeviceId()
      };
      
      this.updateStatus({ 
        isSyncing: false, 
        lastSync: new Date().toISOString(),
        error: null 
      });

      return mockData;
    } catch (error) {
      console.error('Errore caricamento da Google Drive:', error);
      this.updateStatus({ 
        isSyncing: false,
        error: 'Errore durante il caricamento'
      });
      return null;
    }
  }

  // Simula salvataggio dati su Google Drive
  async saveToDrive(fridge: Item[], freezer: Item[], pantry: Item[]): Promise<boolean> {
    try {
      this.updateStatus({ isSyncing: true, error: null });

      // Simula il salvataggio
      await new Promise(resolve => setTimeout(resolve, 1500));

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
        error: 'Errore durante il salvataggio'
      });
      return false;
    }
  }

  // Simula sincronizzazione dati
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
export const expoGoogleDriveSync = new ExpoGoogleDriveSyncService();
