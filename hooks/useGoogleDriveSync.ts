// Hook per la sincronizzazione con Google Drive
import { useEffect, useState } from 'react';
import { realGoogleDriveSync, SyncStatus } from '../utils/realGoogleDriveSync';
import { Item } from './useStorage';

export interface UseGoogleDriveSyncReturn {
  syncStatus: SyncStatus;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  syncData: (
    fridge: Item[], 
    freezer: Item[], 
    pantry: Item[]
  ) => Promise<{ fridge: Item[], freezer: Item[], pantry: Item[] }>;
  saveToDrive: (
    fridge: Item[], 
    freezer: Item[], 
    pantry: Item[]
  ) => Promise<boolean>;
  loadFromDrive: () => Promise<{ fridge: Item[], freezer: Item[], pantry: Item[] } | null>;
}

export function useGoogleDriveSync(): UseGoogleDriveSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    isSyncing: false,
    lastSync: null,
    error: null
  });

  useEffect(() => {
    // Aggiungi listener per lo stato di sincronizzazione
    const unsubscribe = realGoogleDriveSync.addSyncStatusListener(setSyncStatus);
    
    return unsubscribe;
  }, []);

  const connect = async (): Promise<boolean> => {
    return await realGoogleDriveSync.connect();
  };

  const disconnect = async (): Promise<void> => {
    await realGoogleDriveSync.disconnect();
  };

  const syncData = async (
    fridge: Item[], 
    freezer: Item[], 
    pantry: Item[]
  ) => {
    return await realGoogleDriveSync.syncData(fridge, freezer, pantry);
  };

  const saveToDrive = async (
    fridge: Item[], 
    freezer: Item[], 
    pantry: Item[]
  ): Promise<boolean> => {
    return await realGoogleDriveSync.saveToDrive(fridge, freezer, pantry);
  };

  const loadFromDrive = async () => {
    const data = await realGoogleDriveSync.loadFromDrive();
    if (!data) return null;
    
    return {
      fridge: data.fridge,
      freezer: data.freezer,
      pantry: data.pantry
    };
  };

  return {
    syncStatus,
    connect,
    disconnect,
    syncData,
    saveToDrive,
    loadFromDrive
  };
}
