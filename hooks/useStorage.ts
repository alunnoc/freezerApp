import { useEffect, useState } from 'react';

type Item = { 
  id: string; 
  name: string; 
  qty: number; 
  unit: string; 
  category?: string; 
  expiryDate?: string; 
  frozenAt?: string;
  addedAt?: string;
};

// Versione con persistenza locale usando localStorage (web) o AsyncStorage (mobile)
export function useStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Carica i dati all'avvio e ogni volta che il componente si monta
  useEffect(() => {
    loadData();
  }, []);
  
  // Per React Native, ricarica i dati quando il componente si monta
  useEffect(() => {
    if (typeof window === 'undefined') {
      loadData();
    }
  }, []);

  // Ascolta i cambiamenti globali per questo key
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing storage data:', error);
        }
      }
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
    
    // Per React Native, ricarica i dati quando il componente si monta
    // Questo assicura che i dati siano sempre aggiornati
    return () => {};
  }, [key]);

  const loadData = async () => {
    try {
      // Prova prima con AsyncStorage (React Native)
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web: usa localStorage
        const stored = window.localStorage.getItem(key);
        if (stored) {
          setData(JSON.parse(stored));
        }
      } else {
        // React Native: usa AsyncStorage se disponibile
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            setData(JSON.parse(stored));
          }
        } catch (error) {
          console.log('AsyncStorage not available, using memory only');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData: T) => {
    setData(newData);
    try {
      // Prova prima con AsyncStorage (React Native)
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web: usa localStorage
        window.localStorage.setItem(key, JSON.stringify(newData));
        // Data saved to localStorage
      } else {
        // React Native: usa AsyncStorage se disponibile
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem(key, JSON.stringify(newData));
          // Data saved to AsyncStorage
        } catch (error) {
          console.log('AsyncStorage not available, data saved in memory only');
        }
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Funzione per forzare il ricaricamento dei dati
  const forceReload = async () => {
    await loadData();
  };

  return { data, saveData, loading, forceReload };
}

export type { Item };

