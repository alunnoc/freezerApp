// app/index.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { OfficialCameraScanner } from "../../components/OfficialCameraScanner";
import { Item, useStorage } from "../../hooks/useStorage";
import { exportToCSV, exportToJSON, generateSummary } from "../../utils/exportData";
import { lookupProduct } from "../../utils/productLookup";

type SectionKey = "fridge" | "freezer" | "pantry" | "stats";

const CATEGORIES = [
  { id: "dairy", name: "Latticini", color: "#fff3e0", icon: "🥛" },
  { id: "vegetables", name: "Verdure", color: "#e8f5e8", icon: "🥬" },
  { id: "meat", name: "Carne", color: "#ffebee", icon: "🥩" },
  { id: "fish", name: "Pesce", color: "#e1f5fe", icon: "🐟" },
  { id: "frozen", name: "Surgelati", color: "#f3e5f5", icon: "❄️" },
  { id: "beverages", name: "Bevande", color: "#e0f2f1", icon: "🥤" },
  { id: "other", name: "Altro", color: "#fafafa", icon: "📦" },
];

export default function Home() {
  const router = useRouter();
  const [section, setSection] = useState<null | SectionKey>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("other");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editSection, setEditSection] = useState<SectionKey | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Funzione per gestire l'esportazione
  const handleExport = async (format: 'json' | 'csv' | 'summary') => {
    try {
      let content: string;
      let filename: string;

      switch (format) {
        case 'json':
          content = exportToJSON(fridge, freezer, pantry);
          filename = `frigo-backup-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'csv':
          content = exportToCSV(fridge, freezer, pantry);
          filename = `frigo-dati-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'summary':
          content = generateSummary(fridge, freezer, pantry);
          filename = `frigo-riepilogo-${new Date().toISOString().split('T')[0]}.txt`;
          break;
      }

      await Share.share({
        message: content,
        title: `Backup Frigo - ${filename}`,
      });
    } catch (error) {
      Alert.alert('Errore', 'Impossibile esportare i dati');
    }
  };

  // Resetta sempre alla home quando si torna alla tab
  useFocusEffect(
    React.useCallback(() => {
      setSection(null);
      setShowAddForm(false);
      setEditingItem(null);
      setShowScanner(false);
      setSearchQuery("");
      setFilterCategory(null);
    }, [])
  );

  // Usa il hook personalizzato per la persistenza
  const { data: fridge, saveData: saveFridge, loading: fridgeLoading } = useStorage<Item[]>("fridge", [
    { id: "1", name: "Latte", qty: 1, unit: "L", category: "dairy" },
    { id: "2", name: "Insalata", qty: 2, unit: "pz", category: "vegetables" },
  ]);
  const { data: freezer, saveData: saveFreezer, loading: freezerLoading } = useStorage<Item[]>("freezer", [
    { id: "3", name: "Piselli surgelati", qty: 1, unit: "busta", category: "frozen" },
    { id: "4", name: "Filetti di merluzzo", qty: 6, unit: "pz", category: "fish" },
  ]);
  const { data: pantry, saveData: savePantry, loading: pantryLoading } = useStorage<Item[]>("pantry", [
    { id: "5", name: "Pasta", qty: 2, unit: "kg", category: "other" },
    { id: "6", name: "Riso", qty: 1, unit: "kg", category: "other" },
  ]);

  // form di aggiunta
  const [nameInput, setNameInput] = useState("");
  const [qtyInput, setQtyInput] = useState("1");
  const [unitInput, setUnitInput] = useState("pz");
  const [expiryDate, setExpiryDate] = useState("");

  const getList = (s: SectionKey) => {
    if (s === "fridge") return fridge;
    if (s === "freezer") return freezer;
    return pantry;
  };
  const setList = (s: SectionKey, items: Item[]) => {
    if (s === "fridge") {
      saveFridge(items);
    } else if (s === "freezer") {
      saveFreezer(items);
    } else {
      savePantry(items);
    }
  };

  const formatToday = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const addItem = () => {
    if (!section) return;
    const name = nameInput.trim();
    const qty = Math.max(1, Number(qtyInput) || 1);
    const unit = unitInput.trim() || "pz";
    if (!name) {
      Alert.alert("Nome mancante", "Inserisci un nome prodotto.");
      return;
    }
    const newItem: Item = {
      id: Math.random().toString(36).slice(2),
      name,
      qty,
      unit,
      category: selectedCategory,
      expiryDate: expiryDate || undefined,
      frozenAt: section === "freezer" ? formatToday() : undefined,
    };
    setList(section, [newItem, ...getList(section)]);
    setNameInput("");
    setQtyInput("1");
    setUnitInput("pz");
    setSelectedCategory("other");
    setExpiryDate("");
    setShowAddForm(false);
  };

  const inc = (s: SectionKey, id: string, delta: number) => {
    const updated = getList(s)
      .map((it) =>
        it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it
      )
      .filter((it) => it.qty > 0); // se qty arriva a 0, rimuovi
    setList(s, updated);
  };

  const removeItem = (s: SectionKey, id: string) => {
    const updated = getList(s).filter((it) => it.id !== id);
    setList(s, updated);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setEditExpiryDate(item.expiryDate || "");
    setEditSection(section);
  };

  const saveExpiryDate = () => {
    if (!editingItem || !editSection) return;
    
    // Se la sezione è cambiata, sposta l'elemento
    if (editSection !== section) {
      // Rimuovi dalla sezione corrente
      const currentList = getList(section!);
      const updatedCurrentList = currentList.filter((it) => it.id !== editingItem.id);
      setList(section!, updatedCurrentList);
      
      // Aggiungi alla nuova sezione
      const targetList = getList(editSection);
      const updatedItem: Item = { 
        ...editingItem, 
        expiryDate: editExpiryDate || undefined,
        frozenAt: editSection === "freezer" ? formatToday() : undefined,
      };
      setList(editSection, [...targetList, updatedItem]);
    } else {
      // Aggiorna solo la data nella stessa sezione
      const updated = getList(section!).map((it) =>
        it.id === editingItem.id 
          ? { ...it, expiryDate: editExpiryDate || undefined, frozenAt: section === "freezer" ? (it.frozenAt || formatToday()) : undefined }
          : it
      );
      setList(section!, updated);
    }
    
    setEditingItem(null);
    setEditExpiryDate("");
    setEditSection(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditExpiryDate("");
    setEditSection(null);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    setIsLookingUp(true);
    
    try {
      console.log('Scanning barcode:', barcode);
      const productInfo = await lookupProduct(barcode);
      
      if (productInfo) {
        // Auto-compila il form con i dati del prodotto
        setNameInput(productInfo.name);
        setSelectedCategory(productInfo.category);
        if (productInfo.estimatedExpiry) {
          setExpiryDate(productInfo.estimatedExpiry);
        }
        
        Alert.alert(
          'Prodotto trovato!',
          `Nome: ${productInfo.name}\nCategoria: ${CATEGORIES.find(c => c.id === productInfo.category)?.name || 'Altro'}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Prodotto non trovato',
          'Il prodotto non è stato trovato nel database. Puoi inserire i dati manualmente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error looking up product:', error);
      Alert.alert('Errore', 'Impossibile cercare il prodotto. Riprova.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      // Formatta la data come DD-MM-YYYY
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      setExpiryDate(formattedDate);
    }
  };

  const getCategoryInfo = (categoryId?: string) => {
    return CATEGORIES.find(cat => cat.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
  };

  const filterItems = (items: Item[]) => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !filterCategory || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    try {
      // Converte da DD-MM-YYYY a Date
      const [day, month, year] = expiryDate.split('-');
      if (!day || !month || !year) return null;
      
      const expiry = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date();
      
      // Reset ore per confronto solo date
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);
      
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  const getExpiryStatus = (days?: number | null) => {
    if (days === null || days === undefined) return { color: "#666", text: "N/A", icon: "📅" };
    if (days < 0) return { color: "#e53935", text: "Scaduto", icon: "⚠️" };
    if (days === 0) return { color: "#ff9800", text: "Scade oggi", icon: "🚨" };
    if (days <= 3) return { color: "#ff9800", text: `${days} giorni`, icon: "⏰" };
    if (days <= 7) return { color: "#ffc107", text: `${days} giorni`, icon: "⏳" };
    return { color: "#4caf50", text: `${days} giorni`, icon: "✅" };
  };

  const renderItem = ({ item }: { item: Item }) => {
    const categoryInfo = getCategoryInfo(item.category);
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    const expiryStatus = getExpiryStatus(daysUntilExpiry);
    
    return (
      <View style={[styles.item, { backgroundColor: categoryInfo.color }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.itemHeader}>
            <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          <Text style={styles.itemQty}>
            {item.qty} {item.unit}
          </Text>
          {section === "freezer" && item.frozenAt && (
            <Text style={styles.frozenAtText}>In freezer dal {item.frozenAt}</Text>
          )}
          <View style={styles.itemFooter}>
            <Text style={styles.categoryName}>{categoryInfo.name}</Text>
            <TouchableOpacity 
              style={styles.expiryContainer}
              onPress={() => openEditModal(item)}
            >
              <Text style={styles.expiryIcon}>{expiryStatus.icon}</Text>
              <Text style={[styles.expiryText, { color: expiryStatus.color }]}>
                {expiryStatus.text}
              </Text>
              <Text style={styles.editHint}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.rowBtns}>
          <TouchableOpacity
            style={[styles.smallBtn, styles.btnSecondary]}
            onPress={() => inc(section!, item.id, -1)}
          >
            <Text style={styles.smallBtnText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, styles.btnSecondary]}
            onPress={() => inc(section!, item.id, +1)}
          >
            <Text style={styles.smallBtnText}>＋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, styles.btnDanger]}
            onPress={() =>
              Alert.alert("Rimuovere?", `Eliminare "${item.name}"?`, [
                { text: "Annulla", style: "cancel" },
                { text: "Rimuovi", style: "destructive", onPress: () => removeItem(section!, item.id) },
              ])
            }
          >
            <Text style={[styles.smallBtnText, { color: "white" }]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (section) {
    // Gestione sezione statistiche
    if (section === "stats") {
      const allItems = [...fridge, ...freezer, ...pantry];
      const loading = fridgeLoading || freezerLoading || pantryLoading;
      
      const getCategoryStats = () => {
        const stats = CATEGORIES.map(category => {
          const items = allItems.filter(item => item.category === category.id);
          const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
          return {
            ...category,
            count: items.length,
            totalQty,
          };
        });
        return stats.filter(stat => stat.count > 0);
      };

      const parseDate = (dateString: string) => {
        try {
          // Converte da DD-MM-YYYY a Date
          const [day, month, year] = dateString.split('-');
          if (!day || !month || !year) return null;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } catch (error) {
          return null;
        }
      };

      const getExpiryStats = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const expired = allItems.filter(item => {
          if (!item.expiryDate) return false;
          const expiry = parseDate(item.expiryDate);
          if (!expiry) return false;
          expiry.setHours(0, 0, 0, 0);
          return expiry < today;
        });

        const expiringSoon = allItems.filter(item => {
          if (!item.expiryDate) return false;
          const expiry = parseDate(item.expiryDate);
          if (!expiry) return false;
          expiry.setHours(0, 0, 0, 0);
          const diffTime = expiry.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 3;
        });

        const expiringThisWeek = allItems.filter(item => {
          if (!item.expiryDate) return false;
          const expiry = parseDate(item.expiryDate);
          if (!expiry) return false;
          expiry.setHours(0, 0, 0, 0);
          const diffTime = expiry.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        });

        return {
          expired: expired.length,
          expiringSoon: expiringSoon.length,
          expiringThisWeek: expiringThisWeek.length,
          totalWithExpiry: allItems.filter(item => item.expiryDate).length,
        };
      };

      const categoryStats = getCategoryStats();
      const expiryStats = getExpiryStats();

      const StatCard = ({ title, value, subtitle, color = "#0077cc" }: {
        title: string;
        value: string | number;
        subtitle?: string;
        color?: string;
      }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      );

      if (loading) {
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>Statistiche</Text>
            </View>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Caricamento dati...</Text>
            </View>
          </SafeAreaView>
        );
      }

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Statistiche</Text>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => setShowExportOptions(!showExportOptions)}
            >
              <Text style={styles.exportBtnText}>📤 Export</Text>
            </TouchableOpacity>
          </View>

          {showExportOptions && (
            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport('json')}
              >
                <Text style={styles.exportOptionText}>📄 Backup JSON</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport('csv')}
              >
                <Text style={styles.exportOptionText}>📊 Dati CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport('summary')}
              >
                <Text style={styles.exportOptionText}>📋 Riepilogo</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.statsScrollContent} showsVerticalScrollIndicator={false}>
            {/* Statistiche generali */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Panoramica</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Totale Prodotti"
                  value={allItems.length}
                  subtitle="nel frigo, freezer e credenza"
                  color="#4caf50"
                />
                <StatCard
                  title="Frigo"
                  value={fridge.length}
                  subtitle="prodotti"
                  color="#2196f3"
                />
                <StatCard
                  title="Freezer"
                  value={freezer.length}
                  subtitle="prodotti"
                  color="#00bcd4"
                />
                <StatCard
                  title="Credenza"
                  value={pantry.length}
                  subtitle="prodotti"
                  color="#9c27b0"
                />
                <StatCard
                  title="Con Scadenza"
                  value={expiryStats.totalWithExpiry}
                  subtitle="prodotti"
                  color="#ff9800"
                />
              </View>
            </View>

            {/* Statistiche scadenze */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Scadenze</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Scaduti"
                  value={expiryStats.expired}
                  subtitle="prodotti"
                  color="#e53935"
                />
                <StatCard
                  title="Scadono Presto"
                  value={expiryStats.expiringSoon}
                  subtitle="entro 3 giorni"
                  color="#ff9800"
                />
                <StatCard
                  title="Questa Settimana"
                  value={expiryStats.expiringThisWeek}
                  subtitle="entro 7 giorni"
                  color="#ffc107"
                />
              </View>
            </View>

            {/* Statistiche per categoria */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Per Categoria</Text>
              {categoryStats.map((stat) => (
                <View key={stat.id} style={styles.categoryStat}>
                  <View style={styles.categoryStatHeader}>
                    <Text style={styles.categoryIcon}>{stat.icon}</Text>
                    <Text style={styles.categoryName}>{stat.name}</Text>
                    <View style={styles.categoryStatValues}>
                      <Text style={styles.categoryCount}>{stat.count} prodotti</Text>
                      <Text style={styles.categoryQty}>{stat.totalQty} unità</Text>
                    </View>
                  </View>
                  <View style={[styles.categoryBar, { backgroundColor: stat.color }]}>
                    <View 
                      style={[
                        styles.categoryBarFill, 
                        { 
                          width: `${(stat.count / Math.max(...categoryStats.map(s => s.count))) * 100}%`,
                          backgroundColor: stat.color,
                          opacity: 0.7,
                        }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Prodotti in scadenza */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Prodotti Scaduti</Text>
              {allItems
                .filter(item => {
                  if (!item.expiryDate) return false;
                  const expiry = parseDate(item.expiryDate);
                  if (!expiry) return false;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  expiry.setHours(0, 0, 0, 0);
                  return expiry < today;
                })
                .length > 0 ? (
                allItems
                  .filter(item => {
                    if (!item.expiryDate) return false;
                    const expiry = parseDate(item.expiryDate);
                    if (!expiry) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    expiry.setHours(0, 0, 0, 0);
                    return expiry < today;
                  })
                  .map((item) => (
                    <View key={item.id} style={styles.expiredItem}>
                      <Text style={styles.expiredItemName}>{item.name}</Text>
                      <Text style={styles.expiredItemDate}>
                        Scaduto il {item.expiryDate}
                      </Text>
                    </View>
                  ))
              ) : (
                <View style={styles.noExpiredItems}>
                  <Text style={styles.noExpiredText}>🎉 Nessun prodotto scaduto!</Text>
                </View>
              )}
            </View>
          </ScrollView>
          
          {/* Pulsante Torna Indietro */}
          <TouchableOpacity 
            style={styles.backFabButton} 
            onPress={() => setSection(null)}
          >
            <Text style={styles.backFabIcon}>← Indietro</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    
    const data = section === "fridge" ? fridge : section === "freezer" ? freezer : pantry;
    const loading = section === "fridge" ? fridgeLoading : section === "freezer" ? freezerLoading : pantryLoading;
    const filteredData = filterItems(data);
    
    if (loading) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Caricamento dati...</Text>
          </View>
        </SafeAreaView>
      );
    }
    
    return (
      <SafeAreaView style={styles.container}>
            <View style={styles.headerSection}>
          <Text style={styles.title}>
            {section === "fridge" ? "Frigo" : section === "freezer" ? "Freezer" : "Credenza"}
          </Text>

          {/* Filtri per categoria */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                !filterCategory && styles.activeFilterBtn
              ]}
              onPress={() => setFilterCategory(null)}
            >
              <Text style={[
                styles.filterBtnText,
                !filterCategory && styles.activeFilterBtnText
              ]}>Tutti</Text>
            </TouchableOpacity>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterBtn,
                  filterCategory === category.id && styles.activeFilterBtn
                ]}
                onPress={() => setFilterCategory(category.id)}
              >
                <Text style={styles.filterBtnIcon}>{category.icon}</Text>
                <Text style={[
                  styles.filterBtnText,
                  filterCategory === category.id && styles.activeFilterBtnText
                ]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Barra di ricerca */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Cerca prodotti..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Lista elementi */}
        <View style={styles.listContainer}>
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {searchQuery || filterCategory 
                  ? "Nessun elemento trovato con questi filtri." 
                  : "Nessun elemento. Aggiungine uno sotto."}
              </Text>
            }
            contentContainerStyle={{ 
              paddingBottom: showAddForm ? 20 : 100, 
              paddingTop: 10,
              flexGrow: 1
            }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            style={{ flex: 1 }}
          />
        </View>

        {/* Pulsante Aggiungi prodotto - FAB */}
        {!showAddForm && (
          <TouchableOpacity 
            style={styles.fabButton} 
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        )}

        {/* Form aggiunta */}
        {showAddForm && (
          <View style={styles.addFormContainer}>
            <View style={styles.addCard}>
              <View style={styles.addCardHeader}>
                <Text style={styles.addTitle}>Aggiungi prodotto</Text>
                <TouchableOpacity 
                  style={styles.closeBtn}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.formScrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.formContent}
              >
                <View style={styles.formRow}>
                  <TextInput
                    placeholder="Nome (es. Yogurt)"
                    value={nameInput}
                    onChangeText={setNameInput}
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    style={styles.scannerButton}
                    onPress={() => setShowScanner(true)}
                    disabled={isLookingUp}
                  >
                    <Text style={styles.scannerButtonText}>
                      {isLookingUp ? '🔍' : '📷'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.formRow}>
                  <TextInput
                    placeholder="Quantità"
                    keyboardType="numeric"
                    value={qtyInput}
                    onChangeText={setQtyInput}
                    style={[styles.input, { width: 90 }]}
                  />
                  <TextInput
                    placeholder="Unità (pz, L, g...)"
                    value={unitInput}
                    onChangeText={setUnitInput}
                    style={[styles.input, { flex: 1, marginLeft: 8 }]}
                  />
                </View>
                <View style={styles.formRow}>
                  <TextInput
                    placeholder="Data scadenza (DD-MM-YYYY)"
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>📅</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Selettore categorie */}
                <Text style={styles.categoryLabel}>Categoria:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryBtn,
                        { backgroundColor: category.color },
                        selectedCategory === category.id && styles.selectedCategory
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text style={styles.categoryBtnIcon}>{category.icon}</Text>
                      <Text style={styles.categoryBtnText}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </ScrollView>
              
              <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                <Text style={styles.addBtnText}>Aggiungi</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Barcode Scanner */}
        {showScanner && (
          <OfficialCameraScanner
            onScan={handleBarcodeScan}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Modal modifica data scadenza */}
        {editingItem && (
          <View style={styles.editModalOverlay}>
            <View style={styles.editModal}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Modifica scadenza</Text>
                <TouchableOpacity 
                  style={styles.closeBtn}
                  onPress={cancelEdit}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.editModalContent}>
                <Text style={styles.editItemName}>{editingItem.name}</Text>
                <Text style={styles.editItemInfo}>
                  {editingItem.qty} {editingItem.unit}
                </Text>
                
                <Text style={styles.editLabel}>Posizione:</Text>
                <View style={styles.sectionSelector}>
                  <TouchableOpacity
                    style={[
                      styles.sectionOption,
                      editSection === "fridge" && styles.selectedSectionOption
                    ]}
                    onPress={() => setEditSection("fridge")}
                  >
                    <Text style={[
                      styles.sectionOptionText,
                      editSection === "fridge" && styles.selectedSectionOptionText
                    ]}>🧊 Frigo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sectionOption,
                      editSection === "freezer" && styles.selectedSectionOption
                    ]}
                    onPress={() => setEditSection("freezer")}
                  >
                    <Text style={[
                      styles.sectionOptionText,
                      editSection === "freezer" && styles.selectedSectionOptionText
                    ]}>❄️ Freezer</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.editLabel}>Data scadenza:</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="DD-MM-YYYY"
                  value={editExpiryDate}
                  onChangeText={setEditExpiryDate}
                  keyboardType="default"
                />
                <Text style={styles.editHintText}>
                  Lascia vuoto per rimuovere la data di scadenza
                </Text>
              </View>
              
              <View style={styles.editModalButtons}>
                <TouchableOpacity 
                  style={[styles.editBtn, styles.cancelBtn]}
                  onPress={cancelEdit}
                >
                  <Text style={styles.cancelBtnText}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editBtn, styles.saveBtn]}
                  onPress={saveExpiryDate}
                >
                  <Text style={styles.saveBtnText}>Salva</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.backFabButton} 
          onPress={() => {
            setSection(null);
            setShowAddForm(false);
            setSearchQuery("");
            setFilterCategory(null);
            setEditingItem(null);
            setEditSection(null);
          }}
        >
          <Text style={styles.backFabIcon}>← Indietro</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Home con i tre pulsanti (Frigo, Freezer, Credenza)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.homeContent}>
        <Text style={styles.title}>Cosa c'è in</Text>
        <View style={styles.sectionsContainer}>
          <View style={styles.fridgeBox}>
            <TouchableOpacity
              style={[styles.section, styles.fridge]}
              onPress={() => setSection("fridge")}
            >
              <Text style={styles.sectionText}>🧊 Frigo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.section, styles.freezer]}
              onPress={() => setSection("freezer")}
            >
              <Text style={styles.sectionText}>❄️ Freezer</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.section, styles.pantry]}
            onPress={() => setSection("pantry")}
          >
            <Text style={styles.sectionText}>🥫 Credenza</Text>
          </TouchableOpacity>
        </View>
        
        {/* Pulsante Statistiche */}
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => setSection("stats")}
        >
          <Text style={styles.statsButtonText}>📊 Statistiche</Text>
        </TouchableOpacity>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0faff" },
  headerSection: {
    padding: 20,
    paddingBottom: 10,
  },
  homeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionsContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 15,
    marginBottom: 30,
    alignItems: "center",
  },
  fridgeBox: {
    flexDirection: "column",
    gap: 15,
    flex: 1,
    height: 300,
  },
  pantry: {
    backgroundColor: "#ede7f6",
    flex: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    height: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  fridge: { 
    backgroundColor: "#fff8e1",
    flex: 2
  },
  freezer: { 
    backgroundColor: "#b3e5fc",
    flex: 1
  },
  section: {
    flex: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  sectionText: { fontSize: 22, fontWeight: "600" },

  // Stili per il pulsante statistiche
  statsButton: {
    backgroundColor: "#FFB6C1",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  statsButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  empty: { textAlign: "center", color: "#666", marginTop: 12 },

  // Stili per ricerca e filtri
  searchContainer: {
    width: "100%",
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterScroll: {
    marginBottom: 12,
    maxHeight: 60,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeFilterBtn: {
    backgroundColor: "#0077cc",
    borderColor: "#0077cc",
  },
  filterBtnIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  activeFilterBtnText: {
    color: "white",
  },

  item: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemName: { fontSize: 16, fontWeight: "600", flex: 1, color: "#333" },
  itemQty: { fontSize: 13, color: "#555", marginTop: 2 },
  frozenAtText: { fontSize: 11, color: "#777", marginTop: 2 },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  expiryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  expiryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  editHint: {
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.6,
  },
  rowBtns: { flexDirection: "row", gap: 8 },

  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
  },
  smallBtnText: { fontSize: 16, fontWeight: "700" },
  btnSecondary: { backgroundColor: "#e0f2f1" },
  btnDanger: { backgroundColor: "#e53935" },

  // Pulsante per aggiungere prodotto
  addProductBtn: {
    position: "absolute",
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: "#0077cc",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addProductBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  // FAB (Floating Action Button) styles
  fabButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0077cc",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabIcon: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  addFormContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 50,
    zIndex: 1000,
  },
  addCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    width: "90%",
    minHeight: 400,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  formScrollView: {
    flex: 1,
    maxHeight: 250,
  },
  formContent: {
    paddingBottom: 20,
  },
  addCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addTitle: { fontWeight: "700", fontSize: 18 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  formRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  input: {
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  dateButton: {
    backgroundColor: "#E1BEE7",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
    height: 42, // Stessa altezza dei campi input (paddingVertical: 10 + borderWidth: 1 + padding interno)
  },
  dateButtonText: {
    fontSize: 20,
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  
  // Stili per le categorie
  categoryLabel: { 
    fontWeight: "600", 
    marginBottom: 8, 
    marginTop: 4,
    color: "#333" 
  },
  categoryScroll: { 
    marginBottom: 12,
    maxHeight: 80,
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    alignItems: "center",
    minWidth: 70,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCategory: {
    borderColor: "#0077cc",
    borderWidth: 2,
  },
  categoryBtnIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  categoryBtnText: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  
  addBtn: {
    backgroundColor: "#0077cc",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  addBtnText: { color: "white", fontWeight: "700" },

  backBtn: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "#0077cc",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: "center",
  },
  backText: { color: "white", fontWeight: "bold" },

  // Back FAB (Floating Action Button) styles
  backFabButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: "#0077cc",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  backFabIcon: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Stili per le statistiche (identici alla tab originale)
  exportBtn: {
    backgroundColor: "#0077cc",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exportBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  exportOptions: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exportOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  exportOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  statsScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: "45%",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  categoryStat: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  categoryStatValues: {
    alignItems: "flex-end",
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  categoryQty: {
    fontSize: 12,
    color: "#666",
  },
  categoryBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  categoryBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  expiredItem: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#e53935",
  },
  expiredItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  expiredItemDate: {
    fontSize: 12,
    color: "#e53935",
    marginTop: 2,
  },
  noExpiredItems: {
    backgroundColor: "#e8f5e8",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
  },
  noExpiredText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e7d32",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
  },

  // Stili per il modal di modifica
  editModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  editModal: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  editModalContent: {
    marginBottom: 20,
  },
  editItemName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  editItemInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    fontSize: 16,
    marginBottom: 8,
  },
  editHintText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  sectionSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  sectionOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  selectedSectionOption: {
    borderColor: "#0077cc",
    backgroundColor: "#e3f2fd",
  },
  sectionOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  selectedSectionOptionText: {
    color: "#0077cc",
  },
  editModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  saveBtn: {
    backgroundColor: "#0077cc",
  },
  cancelBtnText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  saveBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  scannerButton: {
    backgroundColor: "#0077cc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
    height: 42, // Stessa altezza dei campi input
  },
  scannerButtonText: {
    fontSize: 20,
    color: "white",
    lineHeight: 20,
    textAlignVertical: 'center',
  },
});
