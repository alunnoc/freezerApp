import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Share, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStorage } from '../../hooks/useStorage';
import { generateSummary } from '../../utils/exportData';

type MenuDay = {
  breakfast?: string;
  lunch?: string;
  menuBimbo?: string;
  dinner?: string;
};

type WeeklyMenu = {
  [weekday: string]: MenuDay;
};

const WEEK_DAYS = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica' ];

export default function MenuScreen() {
  const defaultMenu: WeeklyMenu = useMemo(() => Object.fromEntries(WEEK_DAYS.map(d => [d, {} as MenuDay])), []);
  const { data: menu, saveData: saveMenu } = useStorage<WeeklyMenu>('weeklyMenu', defaultMenu);
  
  // Accesso ai dati del frigo, freezer e credenza per i suggerimenti
  const { data: fridgeData, saveData: saveFridge, forceReload: reloadFridge } = useStorage<any[]>('fridge', []);
  const { data: freezerData, saveData: saveFreezer, forceReload: reloadFreezer } = useStorage<any[]>('freezer', []);
  const { data: pantryData, saveData: savePantry, forceReload: reloadPantry } = useStorage<any[]>('pantry', []);
  const { data: myRecipes, forceReload: reloadRecipes } = useStorage<any[]>('my-recipes', []);
  // Toggle per abilitare/disabilitare il processamento automatico del menù di ieri
  const { data: autoProcessMenu, saveData: saveAutoProcessMenu } = useStorage<boolean>('autoProcessMenu', true);
  
  // Traccia l'ultima data processata per il menu
  const { data: lastProcessedDate, saveData: saveLastProcessedDate } = useStorage<string>('lastProcessedMenuDate', '');

  const [editing, setEditing] = useState<{ day: string; field: keyof MenuDay } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUnifiedTab, setShowUnifiedTab] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calcola il nome del giorno odierno in italiano (array inizia da Lunedì)
  const todayName = useMemo(() => {
    const jsDay = new Date().getDay(); // 0 = Domenica ... 6 = Sabato
    const idx = (jsDay + 6) % 7; // mappa: Lun=0 ... Dom=6
    return WEEK_DAYS[idx];
  }, []);

  // Funzioni helper per gestire le date
  const formatDateYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDate = (): Date => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  };

  const getDayNameFromDate = (date: Date): string => {
    const jsDay = date.getDay(); // 0 = Domenica ... 6 = Sabato
    const idx = (jsDay + 6) % 7; // mappa: Lun=0 ... Dom=6
    return WEEK_DAYS[idx];
  };

  // Estrae i nomi dei prodotti da un MenuDay
  const extractProductNames = (dayMenu: MenuDay): string[] => {
    const productNames: string[] = [];
    // Non considerare la riga "menù bimbo" per l'eliminazione automatica
    const fields: (keyof MenuDay)[] = ['lunch', 'dinner'];
    
    fields.forEach(field => {
      const value = dayMenu[field];
      if (value && value.trim()) {
        // Separa i prodotti per virgola e pulisce gli spazi
        const products = value.split(',').map(p => p.trim()).filter(p => p.length > 0);
        productNames.push(...products);
      }
    });
    
    return productNames;
  };

  // Processa il menu del giorno precedente e decrementa i prodotti
  const processYesterdayMenu = async () => {
    try {
      // Calcola la data di ieri
      const yesterdayDate = getYesterdayDate();
      const yesterdayDayName = getDayNameFromDate(yesterdayDate);
      const todayStr = formatDateYYYYMMDD(new Date());
      
      // Controlla se il menu di ieri ha contenuti
      const yesterdayMenu = menu[yesterdayDayName];
      
      if (!yesterdayMenu || (!yesterdayMenu.lunch && !yesterdayMenu.menuBimbo && !yesterdayMenu.dinner)) {
        // Aggiorna la data processata a oggi
        saveLastProcessedDate(todayStr);
        return;
      }

      // Estrai i nomi dei prodotti dal menu di ieri
      const productNames = extractProductNames(yesterdayMenu);
      
      if (productNames.length === 0) {
        // Aggiorna la data processata a oggi
        saveLastProcessedDate(todayStr);
        return;
      }

      // Decrementa i prodotti in tutte le sezioni
      let changed = false;

      // Processa Frigo
      const updatedFridge = [...(fridgeData || [])].map(product => {
        const nameMatch = productNames.some(name => 
          product.name?.toLowerCase() === name.toLowerCase()
        );
        if (nameMatch && product.qty > 0) {
          changed = true;
          if (product.qty === 1) {
            return null; // Rimuovi se qty = 1
          }
          return { ...product, qty: product.qty - 1 };
        }
        return product;
      }).filter(p => p !== null) as any[];

      // Processa Freezer
      const updatedFreezer = [...(freezerData || [])].map(product => {
        const nameMatch = productNames.some(name => 
          product.name?.toLowerCase() === name.toLowerCase()
        );
        if (nameMatch && product.qty > 0) {
          changed = true;
          if (product.qty === 1) {
            return null;
          }
          return { ...product, qty: product.qty - 1 };
        }
        return product;
      }).filter(p => p !== null) as any[];

      // Processa Dispensa
      const updatedPantry = [...(pantryData || [])].map(product => {
        const nameMatch = productNames.some(name => 
          product.name?.toLowerCase() === name.toLowerCase()
        );
        if (nameMatch && product.qty > 0) {
          changed = true;
          if (product.qty === 1) {
            return null;
          }
          return { ...product, qty: product.qty - 1 };
        }
        return product;
      }).filter(p => p !== null) as any[];

      // Salva solo se ci sono state modifiche
      if (changed) {
        await Promise.all([
          saveFridge(updatedFridge),
          saveFreezer(updatedFreezer),
          savePantry(updatedPantry)
        ]);
      }

      // Aggiorna la data processata a oggi
      saveLastProcessedDate(todayStr);
      
    } catch (error) {
      console.error('Errore nel processamento del menu:', error);
    }
  };

  // Edge detector: esegui una sola volta per ogni ingresso schermata
  const processedOnFocusRef = useRef(false);

  // Reset del guard quando si entra nella schermata
  useFocusEffect(
    React.useCallback(() => {
      processedOnFocusRef.current = false;
      return () => {};
    }, [])
  );

  // Esegui il processamento una sola volta quando i dati sono pronti e la schermata è a fuoco
  useFocusEffect(
    React.useCallback(() => {
      if (processedOnFocusRef.current) return;
      if (fridgeData === undefined || freezerData === undefined || pantryData === undefined || menu === undefined) {
        return;
      }
      if (autoProcessMenu !== false) {
        processedOnFocusRef.current = true;
        processYesterdayMenu();
      }
      return () => {};
    }, [fridgeData, freezerData, pantryData, menu, autoProcessMenu])
  );

  // Traccia quando i dati sono caricati
  useEffect(() => {
    const hasData = fridgeData !== undefined && freezerData !== undefined && pantryData !== undefined && myRecipes !== undefined;
    setIsDataLoaded(hasData);
    
    // Se i dati non sono caricati dopo 2 secondi, forziamo il caricamento
    if (!hasData) {
      const timeout = setTimeout(() => {
        // Forza un re-render
        setIsDataLoaded(true);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [fridgeData, freezerData, pantryData, myRecipes]);

  // Forza il ricaricamento dei dati quando il componente si monta
  useEffect(() => {
    const reloadData = async () => {
      await Promise.all([
        reloadFridge(),
        reloadFreezer(), 
        reloadPantry(),
        reloadRecipes()
      ]);
    };
    
    // Ricarica i dati dopo un breve delay per assicurarsi che siano aggiornati
    const timeout = setTimeout(reloadData, 100);
    
    return () => clearTimeout(timeout);
  }, []);

  // Ricarica i dati ogni volta che si torna al menù
  useFocusEffect(
    React.useCallback(() => {
      const reloadData = async () => {
        await Promise.all([
          reloadFridge(),
          reloadFreezer(), 
          reloadPantry(),
          reloadRecipes()
        ]);
      };
      
      // Piccolo delay per assicurarsi che i dati siano aggiornati
      const timeout = setTimeout(reloadData, 50);
      
      return () => clearTimeout(timeout);
    }, [reloadFridge, reloadFreezer, reloadPantry, reloadRecipes])
  );

  // Lista di tutti i prodotti per la barra orizzontale
  const allProducts = useMemo(() => {
    const fridgeProducts = (fridgeData || []).map(product => ({
      ...product,
      location: 'Frigo',
      locationColor: '#4CAF50'
    }));
    const freezerProducts = (freezerData || []).map(product => ({
      ...product,
      location: 'Freezer',
      locationColor: '#2196F3'
    }));
    const pantryProducts = (pantryData || []).map(product => ({
      ...product,
      location: 'Dispensa',
      locationColor: '#9C27B0'
    }));
    const result = [...fridgeProducts, ...freezerProducts, ...pantryProducts];
    return result;
  }, [fridgeData, freezerData, pantryData]);

  // Prodotti filtrati
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return allProducts;
    }
    const query = searchQuery.toLowerCase();
    return allProducts.filter(product =>
      product.name?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    );
  }, [allProducts, searchQuery]);

  // Ricette filtrate
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) {
      return myRecipes || [];
    }
    const query = searchQuery.toLowerCase();
    return (myRecipes || []).filter(recipe =>
      recipe.name?.toLowerCase().includes(query) ||
      recipe.category?.toLowerCase().includes(query)
    );
  }, [myRecipes, searchQuery]);

  const startEdit = (day: string, field: keyof MenuDay, current?: string) => {
    setEditing({ day, field });
    setTempValue(current ?? '');
    setShowSuggestions(true);
    setShowUnifiedTab(true);
    setSearchQuery('');
  };

  const saveEdit = () => {
    if (!editing) return;
    const next = { ...menu };
    const dayMenu = { ...(next[editing.day] ?? {}) } as MenuDay;
    dayMenu[editing.field] = tempValue.trim() || undefined;
    next[editing.day] = dayMenu;
    saveMenu(next);
    setEditing(null);
    setTempValue('');
    setShowSuggestions(false);
    setShowUnifiedTab(false);
    setSearchQuery('');
  };

  const selectProduct = (product: any) => {
    // Se il campo è vuoto, aggiungi il prodotto
    if (tempValue.trim() === '') {
      setTempValue(product.name);
    } else {
      // Se il campo ha già contenuto, aggiungi il prodotto con una virgola
      setTempValue(prev => prev + ', ' + product.name);
    }
    setShowSuggestions(false);
    // Non nascondere la tab, mantienila visibile per aggiungere altri prodotti
  };

  const removeLastProduct = () => {
    const products = tempValue.split(', ');
    if (products.length > 1) {
      // Rimuovi l'ultimo prodotto
      setTempValue(products.slice(0, -1).join(', '));
    } else {
      // Se c'è solo un prodotto, svuota il campo
      setTempValue('');
    }
  };

  const handleTextChange = (text: string) => {
    setTempValue(text);
    setShowSuggestions(text.trim().length > 0);
  };

  const clearDay = (day: string) => {
    const next = { ...menu };
    next[day] = {};
    saveMenu(next);
  };

  // Funzione per esportare il menù in formato riepilogo per WhatsApp
  const handleMenuExport = async () => {
    try {
      const content = generateSummary(fridgeData || [], freezerData || [], pantryData || [], menu);
      
      await Share.share({
        message: content,
        title: 'Menu Settimanale',
      });
    } catch (error) {
      Alert.alert('Errore', 'Impossibile esportare il menù');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Menù settimanale</Text>
          <View style={styles.headerActions}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Auto</Text>
              <Switch
                value={autoProcessMenu !== false}
                onValueChange={(v) => saveAutoProcessMenu(v)}
              />
            </View>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={handleMenuExport}
            >
              <Text style={styles.exportButtonText}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140, paddingTop: 4 }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
        {WEEK_DAYS.map(day => {
          const dayMenu = menu[day] ?? {};
            const isToday = day === todayName;
          return (
              <View key={day} style={[styles.card, isToday && styles.todayCard]}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.day, isToday && styles.todayDay]}>{day}</Text>
                    {isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>Oggi</Text>
                      </View>
                    )}
                  </View>
                <TouchableOpacity onPress={() => clearDay(day)} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Pulisci</Text>
                </TouchableOpacity>
              </View>

              {(['lunch','menuBimbo','dinner'] as (keyof MenuDay)[]).map(field => (
                <View key={field} style={styles.row}>
                  <Text style={styles.label}>
                    {field === 'lunch' ? 'Pranzo' : field === 'menuBimbo' ? 'Menù bimbo' : 'Cena'}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.valueBox,
                      dayMenu[field] && styles.valueBoxFilled
                    ]}
                    onPress={() => startEdit(day, field, dayMenu[field])}
                  >
                    <Text style={styles.valueText} numberOfLines={2}>
                      {dayMenu[field] ?? 'Tocca per aggiungere'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
        </ScrollView>

        {editing && showUnifiedTab && (
          <View style={styles.editBar}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Inserisci piatto / ricetta"
                placeholderTextColor="#999"
                value={tempValue}
                onChangeText={handleTextChange}
                returnKeyType="done"
                onSubmitEditing={saveEdit}
              />
              {tempValue.trim() && (
                <TouchableOpacity onPress={removeLastProduct} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>⌫</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={saveEdit} style={[styles.actionBtn, styles.save]}>
              <Text style={[styles.actionText, styles.saveText]}>Salva</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Overlay per nascondere la tab quando si clicca fuori */}
        {editing && showUnifiedTab && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => {
              setShowUnifiedTab(false);
              setSearchQuery('');
            }}
          />
        )}

        {/* Tab unificata con prodotti e ricette */}
        {editing && showUnifiedTab && (
          <View style={styles.unifiedContainer}>
            {/* Barra di ricerca */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca prodotti o ricette..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
              />
            </View>

            {/* Prima riga: Prodotti */}
            {allProducts.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>I tuoi prodotti:</Text>
                <FlatList
                  data={filteredProducts}
                  keyExtractor={(item, index) => `${item.name}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.unifiedCard, { borderLeftColor: item.locationColor }]}
                      onPress={() => selectProduct(item)}
                    >
                      <Text style={styles.unifiedCardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.unifiedCardCategory} numberOfLines={1}>
                        {item.category}
                      </Text>
                      <View style={styles.unifiedCardLocation}>
                        <View style={[styles.unifiedLocationDot, { backgroundColor: item.locationColor }]} />
                        <Text style={styles.unifiedLocationText}>{item.location}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.unifiedList}
                />
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Caricamento prodotti...</Text>
                <TouchableOpacity 
                  style={styles.reloadButton}
                  onPress={async () => {
                    await Promise.all([
                      reloadFridge(),
                      reloadFreezer(), 
                      reloadPantry(),
                      reloadRecipes()
                    ]);
                  }}
                >
                  <Text style={styles.reloadButtonText}>🔄 Ricarica dati</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Seconda riga: Ricette */}
            {myRecipes && myRecipes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Le tue ricette:</Text>
                <FlatList
                  data={filteredRecipes}
                  keyExtractor={(item, index) => `${item.id}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.unifiedCard, { borderLeftColor: '#9C27B0' }]}
                      onPress={() => selectProduct({ name: item.name, category: item.category, location: 'Ricetta' })}
                    >
                      <Text style={styles.unifiedCardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.unifiedCardCategory} numberOfLines={1}>
                        {item.category}
                      </Text>
                      <View style={styles.unifiedCardLocation}>
                        <View style={[styles.unifiedLocationDot, { backgroundColor: '#9C27B0' }]} />
                        <Text style={styles.unifiedLocationText}>Ricetta</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.unifiedList}
                />
              </View>
            )}

          </View>
        )}

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faff' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#333',
    flex: 1, 
    textAlign: 'center',
    marginTop: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  switchLabel: { fontWeight: '600', marginRight: 8, color: '#333' },
  exportButton: {
    backgroundColor: '#0b67b2',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exportButtonText: {
    fontSize: 18,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  todayCard: {
    borderWidth: 2,
    borderColor: '#0b67b2',
    backgroundColor: '#e8f3ff',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  day: { fontSize: 18, fontWeight: '700' },
  todayDay: { color: '#0b67b2' },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f5f5f5', borderRadius: 8 },
  clearBtnText: { color: '#666', fontWeight: '600' },
  todayBadge: {
    backgroundColor: '#0b67b2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  todayBadgeText: { color: 'white', fontWeight: '700', fontSize: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { width: 90, color: '#333', fontWeight: '600' },
  valueBox: {
    flex: 1,
    minHeight: 40,
    backgroundColor: '#f7f9fc',
    borderWidth: 1,
    borderColor: '#e5eaf0',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  valueBoxFilled: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  valueText: { color: '#333' },
  editBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#0b67b2',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, elevation: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  removeButton: {
    backgroundColor: '#ff4444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  save: { backgroundColor: '#054a80' },
  actionText: { fontWeight: '700', color: '#054a80' },
  saveText: { color: 'white', fontWeight: '700' },
  // Stili per la barra orizzontale prodotti
  productsContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 80,
    backgroundColor: '#0b67b2',
    borderRadius: 14,
    maxHeight: 140,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  productsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    padding: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  productsList: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 12,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    width: 120,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  productLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  // Stili per la barra orizzontale ricette
  recipesContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    maxHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recipesList: {
    paddingBottom: 4,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 120,
    borderLeftWidth: 3,
    borderLeftColor: '#9C27B0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recipeCategory: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  recipeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9C27B0',
  },
  recipeLocationText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  // Stili per il container unificato
  unifiedContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 80,
    backgroundColor: '#0b67b2',
    borderRadius: 12,
    padding: 12,
    maxHeight: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  unifiedList: {
    paddingBottom: 4,
  },
  unifiedCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 100,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unifiedCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unifiedCardCategory: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  unifiedCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unifiedLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unifiedLocationText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  reloadButton: {
    backgroundColor: '#0077cc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'center',
  },
  reloadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 80, // Esclude la zona della editBar (circa 80px dal basso)
    backgroundColor: 'transparent',
    zIndex: 1,
  },
});


