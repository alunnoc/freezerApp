// app/index.tsx
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SimpleBarcodeScanner } from "../../components/SimpleBarcodeScanner";
import { Item, useStorage } from "../../hooks/useStorage";
import { lookupProduct } from "../../utils/productLookup";

type SectionKey = "fridge" | "freezer";

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
  const [section, setSection] = useState<null | SectionKey>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("other");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editSection, setEditSection] = useState<SectionKey | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Usa il hook personalizzato per la persistenza
  const { data: fridge, saveData: saveFridge, loading: fridgeLoading } = useStorage<Item[]>("fridge", [
    { id: "1", name: "Latte", qty: 1, unit: "L", category: "dairy" },
    { id: "2", name: "Insalata", qty: 2, unit: "pz", category: "vegetables" },
  ]);
  const { data: freezer, saveData: saveFreezer, loading: freezerLoading } = useStorage<Item[]>("freezer", [
    { id: "3", name: "Piselli surgelati", qty: 1, unit: "busta", category: "frozen" },
    { id: "4", name: "Filetti di merluzzo", qty: 6, unit: "pz", category: "fish" },
  ]);

  // form di aggiunta
  const [nameInput, setNameInput] = useState("");
  const [qtyInput, setQtyInput] = useState("1");
  const [unitInput, setUnitInput] = useState("pz");
  const [expiryDate, setExpiryDate] = useState("");

  const getList = (s: SectionKey) => (s === "fridge" ? fridge : freezer);
  const setList = (s: SectionKey, items: Item[]) => {
    if (s === "fridge") {
      saveFridge(items);
    } else {
      saveFreezer(items);
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
    const data = section === "fridge" ? fridge : freezer;
    const loading = section === "fridge" ? fridgeLoading : freezerLoading;
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
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.container}>
            <View style={styles.headerSection}>
          <Text style={styles.title}>{section === "fridge" ? "Frigo" : "Freezer"}</Text>

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
              paddingTop: 10 
            }}
            showsVerticalScrollIndicator={true}
          />
        </View>

        {/* Pulsante Aggiungi prodotto */}
        {!showAddForm && (
          <TouchableOpacity 
            style={styles.addProductBtn} 
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addProductBtnText}>+ Aggiungi prodotto</Text>
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
          <SimpleBarcodeScanner
            onScan={handleBarcodeScan}
            onClose={() => setShowScanner(false)}
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
          style={styles.backBtn} 
          onPress={() => {
            setSection(null);
            setShowAddForm(false);
            setSearchQuery("");
            setFilterCategory(null);
            setEditingItem(null);
            setEditSection(null);
          }}
        >
          <Text style={styles.backText}>← Torna indietro</Text>
        </TouchableOpacity>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  // Home con i due pulsanti (Frigo sopra, Freezer sotto)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.homeContent}>
        <Text style={styles.title}>What's in the</Text>
        <View style={styles.fridgeBox}>
          <TouchableOpacity
            style={[styles.section, styles.fridge]}
            onPress={() => setSection("fridge")}
          >
            <Text style={styles.sectionText}>Fridge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.section, styles.freezer]}
            onPress={() => setSection("freezer")}
          >
            <Text style={styles.sectionText}>Freezer</Text>
          </TouchableOpacity>
        </View>
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
  fridgeBox: {
    width: 220,
    height: 400,
    borderWidth: 3,
    borderColor: "#ccc",
    borderRadius: 20,
    overflow: "hidden",
  },
  section: { flex: 1, justifyContent: "center", alignItems: "center" },
  freezer: { backgroundColor: "#b3e5fc" },
  fridge: { backgroundColor: "#fff8e1" },
  sectionText: { fontSize: 22, fontWeight: "600" },

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
    maxHeight: 50,
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
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
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
  categoryName: { fontSize: 11, color: "#777", fontStyle: "italic" },
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

  addFormContainer: {
    position: "absolute",
    bottom: 70,
    left: 20,
    right: 20,
    maxHeight: "70%",
  },
  addCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    maxHeight: "100%",
    minHeight: 200,
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
    marginTop: 4,
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
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
  },
  scannerButtonText: {
    fontSize: 20,
    color: "white",
  },
});
