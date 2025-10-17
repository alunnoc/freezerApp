import React, { useState } from 'react';
import {
    Alert,
    Clipboard,
    FlatList,
    SafeAreaView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useStorage } from '../../hooks/useStorage';

interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  completed: boolean;
  category?: string;
}

// Prodotti comuni che si comprano sempre
const COMMON_PRODUCTS = [
  'Pollo', 'Hamburger', 'Latte', 'Insalata', 'Pomodori',
  'Pane', 'Uova', 'Formaggio', 'Yogurt', 'Pasta',
  'Riso', 'Patate', 'Cipolle', 'Aglio', 'Olio',
  'Burro', 'Sale', 'Pepe', 'Zucchero', 'Farina',
  'Banane', 'Mele', 'Pere', 'Limoni', 'Carote',
  'Broccoli', 'Spinaci', 'Peperoni', 'Zucchine', 'Melanzane',
  'Pesce', 'Salmone', 'Tonno', 'Gamberetti', 'Manzo',
  'Maiale', 'Salsicce', 'Prosciutto', 'Salame', 'Mozzarella',
  'Parmigiano', 'Ricotta', 'Mascarpone', 'Gorgonzola', 'Stracchino',
  'Aceto', 'Salsa di pomodoro', 'Passata', 'Pesto', 'Olio extravergine',
  'Caffè', 'Tè', 'Biscotti', 'Crackers', 'Cereali',
  'Muesli', 'Avena', 'Miele', 'Marmellata', 'Nutella',
  'Cioccolato', 'Gelato', 'Yogurt greco', 'Kefir', 'Acqua',
  'Succo', 'Coca Cola', 'Birra', 'Vino', 'Spumante'
];

export default function ShoppingListScreen() {
  const { data: shoppingList, saveData: saveShoppingList } = useStorage<ShoppingItem[]>('shopping-list', []);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  // Filtra i suggerimenti basati sul testo inserito
  const filteredSuggestions = newItemName.length > 0 
    ? COMMON_PRODUCTS.filter(product =>
        product.toLowerCase().includes(newItemName.toLowerCase())
      ).slice(0, 8) // Mostra massimo 8 suggerimenti filtrati
    : COMMON_PRODUCTS.slice(0, 8); // Mostra i primi 8 prodotti quando non c'è testo

  const handleNameChange = (text: string) => {
    setNewItemName(text);
    setShowSuggestions(true); // Mostra sempre i suggerimenti
  };

  const selectSuggestion = (product: string) => {
    setNewItemName(product);
    setShowSuggestions(false);
  };

  const addItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Errore', 'Inserisci il nome del prodotto');
      return;
    }

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      quantity: newItemQuantity ? parseInt(newItemQuantity) : undefined,
      unit: newItemUnit.trim() || undefined,
      completed: false,
    };

    saveShoppingList([newItem, ...shoppingList]);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemUnit('');
    setShowAddForm(false);
    setShowSuggestions(false);
  };

  const toggleItem = (id: string) => {
    const updatedList = shoppingList.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveShoppingList(updatedList);
  };

  const deleteItem = (id: string) => {
    Alert.alert(
      'Conferma',
      'Sei sicuro di voler eliminare questo elemento?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            const updatedList = shoppingList.filter(item => item.id !== id);
            saveShoppingList(updatedList);
          },
        },
      ]
    );
  };

  const clearCompleted = () => {
    const activeItems = shoppingList.filter(item => !item.completed);
    saveShoppingList(activeItems);
  };

  const clearAll = () => {
    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare TUTTI gli elementi della lista? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina tutto',
          style: 'destructive',
          onPress: () => {
            saveShoppingList([]);
            Alert.alert('Lista svuotata', 'Tutti gli elementi sono stati eliminati.');
          },
        },
      ]
    );
  };

  const shareShoppingList = async () => {
    if (shoppingList.length === 0) {
      Alert.alert('Lista vuota', 'Non ci sono elementi da condividere');
      return;
    }

    const pendingItems = shoppingList.filter(item => !item.completed);
    const completedItems = shoppingList.filter(item => item.completed);

    let shareText = '🛒 LISTA DELLA SPESA\n\n';
    
    if (pendingItems.length > 0) {
      shareText += '📝 DA COMPRARE:\n';
      pendingItems.forEach((item, index) => {
        const quantity = item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : '';
        shareText += `${index + 1}. ${item.name}${quantity ? ` (${quantity})` : ''}\n`;
      });
      shareText += '\n';
    }

    if (completedItems.length > 0) {
      shareText += '✅ GIÀ COMPRATO:\n';
      completedItems.forEach((item, index) => {
        const quantity = item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : '';
        shareText += `${index + 1}. ${item.name}${quantity ? ` (${quantity})` : ''}\n`;
      });
    }

    shareText += `\n📊 Totale: ${shoppingList.length} elementi`;
    shareText += `\n📝 Da comprare: ${pendingItems.length}`;
    shareText += `\n✅ Comprati: ${completedItems.length}`;

    try {
      await Share.share({
        message: shareText,
        title: 'Lista della Spesa',
      });
    } catch (error) {
      Alert.alert('Errore', 'Impossibile condividere la lista');
    }
  };

  // Funzione per parsare il testo importato
  const parseImportedText = (text: string): ShoppingItem[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items: ShoppingItem[] = [];
    
    let currentSection = '';
    
    for (const line of lines) {
      // Salta header e sezioni
      if (line.includes('LISTA DELLA SPESA') || 
          line.includes('DA COMPRARE') || 
          line.includes('GIÀ COMPRATO') ||
          line.includes('Totale:') ||
          line.includes('Da comprare:') ||
          line.includes('Comprati:')) {
        continue;
      }
      
      // Rileva sezione
      if (line.includes('📝 DA COMPRARE')) {
        currentSection = 'pending';
        continue;
      }
      if (line.includes('✅ GIÀ COMPRATO')) {
        currentSection = 'completed';
        continue;
      }
      
      // Parsa elementi della lista (formato: "1. Nome prodotto (quantità unità)")
      const itemMatch = line.match(/^\d+\.\s+(.+?)(?:\s+\(([^)]+)\))?$/);
      if (itemMatch) {
        const name = itemMatch[1].trim();
        const quantityInfo = itemMatch[2] ? itemMatch[2].trim() : '';
        
        let quantity = '';
        let unit = '';
        
        if (quantityInfo) {
          // Prova a separare quantità e unità
          const quantityMatch = quantityInfo.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
          if (quantityMatch) {
            quantity = quantityMatch[1];
            unit = quantityMatch[2] || '';
          } else {
            quantity = quantityInfo;
          }
        }
        
        const newItem: ShoppingItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name,
          quantity: quantity || undefined,
          unit: unit || undefined,
          completed: currentSection === 'completed'
        };
        
        items.push(newItem);
      }
    }
    
    return items;
  };

  // Funzione per gestire l'import
  const handleImport = async () => {
    try {
      if (!importText.trim()) {
        Alert.alert('Errore', 'Incolla il testo della lista da importare');
        return;
      }

      const importedItems = parseImportedText(importText);
      
      if (importedItems.length === 0) {
        Alert.alert('Errore', 'Nessun elemento valido trovato nel testo. Assicurati che il formato sia corretto.');
        return;
      }

      // Aggiungi gli elementi importati alla lista esistente
      const updatedList = [...shoppingList, ...importedItems];
      saveShoppingList(updatedList);
      
      setImportText('');
      setShowImportModal(false);
      
      Alert.alert(
        'Import completato!', 
        `Sono stati importati ${importedItems.length} elementi nella lista della spesa.`
      );
    } catch (error) {
      Alert.alert('Errore', 'Impossibile importare la lista. Controlla il formato del testo.');
    }
  };

  // Funzione per incollare dalla clipboard
  const pasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent) {
        setImportText(clipboardContent);
      } else {
        Alert.alert('Clipboard vuoto', 'Non c\'è nulla da incollare nella clipboard');
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile accedere alla clipboard');
    }
  };

  const totalItems = shoppingList.length;
  const completedItems = shoppingList.filter(item => item.completed).length;
  const pendingItems = totalItems - completedItems;

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View style={[styles.itemCard, item.completed && styles.completedItem]}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => toggleItem(item.id)}
      >
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, item.completed && styles.completedText]}>
            {item.name}
          </Text>
          {(item.quantity || item.unit) && (
            <Text style={styles.itemDetails}>
              {item.quantity && `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`}
            </Text>
          )}
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.checkbox, item.completed && styles.checkedBox]}
            onPress={() => toggleItem(item.id)}
          >
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteItem(item.id)}
          >
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lista della Spesa</Text>
        
        {/* Statistiche */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Totale</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingItems}</Text>
            <Text style={styles.statLabel}>Da fare</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedItems}</Text>
            <Text style={styles.statLabel}>Fatto</Text>
          </View>
        </View>

        {/* Pulsanti azione */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareShoppingList}
          >
            <Text style={styles.shareButtonText}>📤 Condividi</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.importButton}
            onPress={() => setShowImportModal(true)}
          >
            <Text style={styles.importButtonText}>📥 Importa</Text>
          </TouchableOpacity>
          
          {completedItems > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearCompleted}
            >
              <Text style={styles.clearButtonText}>Pulisci completati</Text>
            </TouchableOpacity>
          )}
          
        </View>
      </View>

      {/* Lista elementi */}
      <FlatList
        data={shoppingList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>La tua lista è vuota</Text>
            <Text style={styles.emptySubtext}>Aggiungi il primo elemento!</Text>
          </View>
        }
      />

      {/* Modal aggiungi elemento */}
      {showAddForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aggiungi elemento</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nome prodotto"
              placeholderTextColor="#999"
              value={newItemName}
              onChangeText={handleNameChange}
            />
            
            {/* Suggerimenti prodotti comuni */}
            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Suggerimenti:</Text>
                <View style={styles.suggestionsList}>
                  {filteredSuggestions.map((product, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(product)}
                    >
                      <Text style={styles.suggestionText}>{product}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.quantityRow}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                placeholder="Quantità"
                placeholderTextColor="#999"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.unitInput]}
                placeholder="Unità (kg, pz, etc.)"
                placeholderTextColor="#999"
                value={newItemUnit}
                onChangeText={setNewItemUnit}
              />
            </View>


            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addItem}
              >
                <Text style={styles.saveButtonText}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal Import */}
      {showImportModal && (
        <View style={styles.importModalOverlay}>
          <View style={styles.importModalContent}>
            <Text style={styles.importModalTitle}>Importa Lista</Text>
            <Text style={styles.importModalSubtitle}>
              Incolla il testo della lista esportata per importarla
            </Text>
            
            <TextInput
              style={styles.importTextArea}
              placeholder="Incolla qui il testo della lista della spesa..."
              placeholderTextColor="#999"
              value={importText}
              onChangeText={setImportText}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            
            <View style={styles.importButtons}>
              <TouchableOpacity 
                style={styles.pasteButton}
                onPress={pasteFromClipboard}
              >
                <Text style={styles.pasteButtonText}>📋 Incolla</Text>
              </TouchableOpacity>
              
              <View style={styles.importActionButtons}>
                <TouchableOpacity 
                  style={styles.cancelImportButton}
                  onPress={() => {
                    setShowImportModal(false);
                    setImportText('');
                  }}
                >
                  <Text style={styles.cancelImportButtonText}>Annulla</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmImportButton}
                  onPress={handleImport}
                >
                  <Text style={styles.confirmImportButtonText}>Importa</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Pulsante aggiungi rotondo */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setShowAddForm(true);
          setShowSuggestions(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Pulsante elimina tutto rotondo */}
      {shoppingList.length > 0 && (
        <TouchableOpacity
          style={styles.clearAllFab}
          onPress={clearAll}
        >
          <Text style={styles.clearAllFabText}>🗑️</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faff',
  },
  header: {
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0077cc',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    gap: 10,
  },
  shareButton: {
    backgroundColor: '#0077cc',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80,
    flex: 0,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  importButton: {
    backgroundColor: '#0b67b2',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80,
    flex: 0,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  importButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80,
    flex: 0,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // Spazio per i FAB in basso
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  completedItem: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 5,
  },
  deleteText: {
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0077cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Stili per il modal di import
  importModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  importModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  importModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  importModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  importTextArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
    minHeight: 120,
  },
  importButtons: {
    gap: 12,
  },
  pasteButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pasteButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  importActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelImportButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelImportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmImportButton: {
    flex: 1,
    backgroundColor: '#0b67b2',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  confirmImportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Stili per il FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0077cc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 1000,
  },
  fabText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  // Stili per il FAB "Elimina tutto"
  clearAllFab: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 1000,
  },
  clearAllFabText: {
    fontSize: 20,
    color: 'white',
  },
  suggestionsContainer: {
    marginBottom: 15,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionItem: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#0077cc',
  },
  suggestionText: {
    fontSize: 12,
    color: '#0077cc',
    fontWeight: '500',
  },
});
