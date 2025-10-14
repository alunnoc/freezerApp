import { useEffect, useState } from 'react';

type Item = { id: string; name: string; qty: number; unit: string; category?: string; expiryDate?: string; frozenAt?: string };

// Versione con persistenza locale usando localStorage (web) o AsyncStorage (mobile)
export function useStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Carica i dati all'avvio
  useEffect(() => {
    loadData();
  }, []);

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
        console.log(`Data saved to localStorage for key: ${key}`);
      } else {
        // React Native: usa AsyncStorage se disponibile
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem(key, JSON.stringify(newData));
          console.log(`Data saved to AsyncStorage for key: ${key}`);
        } catch (error) {
          console.log('AsyncStorage not available, data saved in memory only');
        }
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  return { data, saveData, loading };
}

export type { Item };

