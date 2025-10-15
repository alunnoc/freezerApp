import React, { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStorage } from '../../hooks/useStorage';

type MenuDay = {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
};

type WeeklyMenu = {
  [weekday: string]: MenuDay;
};

const WEEK_DAYS = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];

export default function MenuScreen() {
  const defaultMenu: WeeklyMenu = useMemo(() => Object.fromEntries(WEEK_DAYS.map(d => [d, {} as MenuDay])), []);
  const { data: menu, saveData: saveMenu } = useStorage<WeeklyMenu>('weeklyMenu', defaultMenu);
  
  // Accesso ai dati del frigo, freezer e credenza per i suggerimenti
  const { data: fridgeData } = useStorage<any[]>('fridge', []);
  const { data: freezerData } = useStorage<any[]>('freezer', []);
  const { data: pantryData } = useStorage<any[]>('pantry', []);

  const [editing, setEditing] = useState<{ day: string; field: keyof MenuDay } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Calcola il nome del giorno odierno in italiano (array inizia da Lunedì)
  const todayName = useMemo(() => {
    const jsDay = new Date().getDay(); // 0 = Domenica ... 6 = Sabato
    const idx = (jsDay + 6) % 7; // mappa: Lun=0 ... Dom=6
    return WEEK_DAYS[idx];
  }, []);

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
      location: 'Credenza',
      locationColor: '#9C27B0'
    }));
    return [...fridgeProducts, ...freezerProducts, ...pantryProducts];
  }, [fridgeData, freezerData, pantryData]);

  const startEdit = (day: string, field: keyof MenuDay, current?: string) => {
    setEditing({ day, field });
    setTempValue(current ?? '');
    setShowSuggestions(true);
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
  };

  const selectProduct = (product: any) => {
    setTempValue(product.name);
    setShowSuggestions(false);
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

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Menù settimanale</Text>

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

              {(['lunch','dinner'] as (keyof MenuDay)[]).map(field => (
                <View key={field} style={styles.row}>
                  <Text style={styles.label}>
                    {field === 'lunch' ? 'Pranzo' : 'Cena'}
                  </Text>
                  <TouchableOpacity
                    style={styles.valueBox}
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

        {editing && (
          <View style={styles.editBar}>
            <TextInput
              style={styles.input}
              placeholder="Inserisci piatto / ricetta"
              value={tempValue}
              onChangeText={handleTextChange}
              returnKeyType="done"
              onSubmitEditing={saveEdit}
            />
            <TouchableOpacity onPress={() => { setEditing(null); setTempValue(''); }} style={[styles.actionBtn, styles.cancel]}>
              <Text style={styles.actionText}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveEdit} style={[styles.actionBtn, styles.save]}>
              <Text style={[styles.actionText, styles.saveText]}>Salva</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Barra orizzontale prodotti */}
        {editing && allProducts.length > 0 && (
          <View style={styles.productsContainer}>
            <Text style={styles.productsTitle}>I tuoi prodotti:</Text>
            <FlatList
              data={allProducts}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.productCard, { borderLeftColor: item.locationColor }]}
                  onPress={() => selectProduct(item)}
                >
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productCategory} numberOfLines={1}>
                    {item.category}
                  </Text>
                  <View style={styles.productLocation}>
                    <View style={[styles.locationDot, { backgroundColor: item.locationColor }]} />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                </TouchableOpacity>
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faff', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginVertical: 8 },
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
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  cancel: { backgroundColor: 'white', marginRight: 8 },
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
});


