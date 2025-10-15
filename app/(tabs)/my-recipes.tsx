// Tab per le ricette personali dell'utente
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useStorage } from '../../hooks/useStorage';
import { matchIngredients } from '../../utils/ingredientMatcher';

interface PersonalRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  difficulty: 'Facile' | 'Medio' | 'Difficile';
  time: string;
  servings: number;
  category: string;
  image?: string;
  createdAt: string;
}

const DIFFICULTY_OPTIONS = ['Facile', 'Medio', 'Difficile'];
const CATEGORY_OPTIONS = ['Antipasti', 'Primi', 'Secondi', 'Dolci', 'Bevande', 'Altro'];

export default function MyRecipesScreen() {
  const { data: recipes, saveData: saveRecipes } = useStorage<PersonalRecipe[]>('my-recipes', []);
  const { data: fridgeData } = useStorage<any[]>('fridge', []);
  const { data: freezerData } = useStorage<any[]>('freezer', []);
  const { data: pantryData } = useStorage<any[]>('pantry', []);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<PersonalRecipe | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  
  // Combina tutti i prodotti disponibili
  const availableProducts = useMemo(() => {
    const allProducts = [...(fridgeData || []), ...(freezerData || []), ...(pantryData || [])];
    return allProducts.map(product => product.name?.toLowerCase() || '');
  }, [fridgeData, freezerData, pantryData]);
  
  // Form fields
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [recipeDifficulty, setRecipeDifficulty] = useState<'Facile' | 'Medio' | 'Difficile'>('Facile');
  const [recipeTime, setRecipeTime] = useState('');
  const [recipeServings, setRecipeServings] = useState('');
  const [recipeCategory, setRecipeCategory] = useState('Primi');

  const resetForm = () => {
    setRecipeName('');
    setRecipeDescription('');
    setRecipeIngredients('');
    setRecipeInstructions('');
    setRecipeDifficulty('Facile');
    setRecipeTime('');
    setRecipeServings('');
    setRecipeCategory('Primi');
    setEditingRecipe(null);
  };

  const handleAddRecipe = () => {
    if (!recipeName.trim()) {
      Alert.alert('Errore', 'Inserisci il nome della ricetta');
      return;
    }

    if (!recipeIngredients.trim()) {
      Alert.alert('Errore', 'Inserisci almeno un ingrediente');
      return;
    }

    if (!recipeInstructions.trim()) {
      Alert.alert('Errore', 'Inserisci le istruzioni');
      return;
    }

    const ingredients = recipeIngredients
      .split('\n')
      .map(ing => ing.trim())
      .filter(ing => ing.length > 0);

    const instructions = recipeInstructions
      .split('\n')
      .map(inst => inst.trim())
      .filter(inst => inst.length > 0);

    const newRecipe: PersonalRecipe = {
      id: editingRecipe?.id || Date.now().toString(),
      name: recipeName.trim(),
      description: recipeDescription.trim(),
      ingredients,
      instructions,
      difficulty: recipeDifficulty,
      time: recipeTime.trim() || 'Non specificato',
      servings: parseInt(recipeServings) || 1,
      category: recipeCategory,
      createdAt: editingRecipe?.createdAt || new Date().toISOString()
    };

    if (editingRecipe) {
      // Aggiorna ricetta esistente
      const updatedRecipes = recipes.map(recipe => 
        recipe.id === editingRecipe.id ? newRecipe : recipe
      );
      saveRecipes(updatedRecipes);
      Alert.alert('Successo', 'Ricetta aggiornata!');
    } else {
      // Aggiungi nuova ricetta
      saveRecipes([...recipes, newRecipe]);
      Alert.alert('Successo', 'Ricetta aggiunta!');
    }

    resetForm();
    setShowAddForm(false);
  };

  const handleEditRecipe = (recipe: PersonalRecipe) => {
    setEditingRecipe(recipe);
    setRecipeName(recipe.name);
    setRecipeDescription(recipe.description);
    setRecipeIngredients(recipe.ingredients.join('\n'));
    setRecipeInstructions(recipe.instructions.join('\n'));
    setRecipeDifficulty(recipe.difficulty);
    setRecipeTime(recipe.time);
    setRecipeServings(recipe.servings.toString());
    setRecipeCategory(recipe.category);
    setShowAddForm(true);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare questa ricetta?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            const updatedRecipes = recipes.filter(recipe => recipe.id !== recipeId);
            saveRecipes(updatedRecipes);
            Alert.alert('Successo', 'Ricetta eliminata!');
          }
        }
      ]
    );
  };

  const renderRecipe = ({ item }: { item: PersonalRecipe }) => {
    const isExpanded = expandedRecipe === item.id;
    
    // Calcola la percentuale di ingredienti disponibili
    const matchResult = matchIngredients(availableProducts, item.ingredients);
    const matchPercentage = matchResult.matchPercentage;
    const availableIngredients = matchResult.availableIngredients;
    const missingIngredients = matchResult.missingIngredients;
    
    return (
      <TouchableOpacity 
        style={styles.recipeCard}
        onPress={() => setExpandedRecipe(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeName}>{item.name}</Text>
          <View style={styles.headerRight}>
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{Math.round(matchPercentage)}%</Text>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
            <View style={styles.recipeActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditRecipe(item);
                }}
              >
                <Text style={styles.actionText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteRecipe(item.id);
                }}
              >
                <Text style={styles.actionText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      
      {item.description && (
        <Text style={styles.recipeDescription}>{item.description}</Text>
      )}
      
      <View style={styles.recipeMeta}>
        <Text style={styles.metaItem}>⏱️ {item.time}</Text>
        <Text style={styles.metaItem}>👥 {item.servings} persone</Text>
        <Text style={styles.metaItem}>📊 {item.difficulty}</Text>
        <Text style={styles.metaItem}>🏷️ {item.category}</Text>
      </View>
      
      <View style={styles.ingredientsSection}>
        <Text style={styles.sectionTitle}>Ingredienti disponibili:</Text>
        <View style={styles.ingredientsList}>
          {availableIngredients.map((ingredient: string, index: number) => (
            <View key={index} style={styles.availableIngredient}>
              <Text style={styles.ingredientText}>✅ {ingredient}</Text>
            </View>
          ))}
        </View>
        
        {missingIngredients.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Ingredienti mancanti:</Text>
            <View style={styles.ingredientsList}>
              {missingIngredients.map((ingredient: string, index: number) => (
                <View key={index} style={styles.missingIngredient}>
                  <Text style={styles.ingredientText}>❌ {ingredient}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

        {isExpanded && item.instructions && item.instructions.length > 0 && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Istruzioni:</Text>
            {item.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>{index + 1}.</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (showAddForm) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editingRecipe ? 'Modifica Ricetta' : 'Nuova Ricetta'}
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                resetForm();
                setShowAddForm(false);
              }}
            >
              <Text style={styles.backText}>Indietro</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome ricetta *</Text>
              <TextInput
                style={styles.textInput}
                value={recipeName}
                onChangeText={setRecipeName}
                placeholder="Es. Pasta alla Carbonara"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descrizione</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={recipeDescription}
                onChangeText={setRecipeDescription}
                placeholder="Breve descrizione della ricetta..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ingredienti * (uno per riga)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={recipeIngredients}
                onChangeText={setRecipeIngredients}
                placeholder="Pasta\nUova\nPancetta\nPecorino"
                placeholderTextColor="#999"
                multiline
                numberOfLines={5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Istruzioni * (un passo per riga)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={recipeInstructions}
                onChangeText={setRecipeInstructions}
                placeholder="1. Cuoci la pasta\n2. Prepara la carbonara\n3. Mescola tutto"
                placeholderTextColor="#999"
                multiline
                numberOfLines={5}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Difficoltà</Text>
                <View style={styles.difficultyContainer}>
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty}
                      style={[
                        styles.difficultyButton,
                        recipeDifficulty === difficulty && styles.difficultyButtonActive
                      ]}
                      onPress={() => setRecipeDifficulty(difficulty as any)}
                    >
                      <Text style={[
                        styles.difficultyText,
                        recipeDifficulty === difficulty && styles.difficultyTextActive
                      ]}>
                        {difficulty}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Categoria</Text>
                <View style={styles.categoryContainer}>
                  {CATEGORY_OPTIONS.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        recipeCategory === category && styles.categoryButtonActive
                      ]}
                      onPress={() => setRecipeCategory(category)}
                    >
                      <Text style={[
                        styles.categoryText,
                        recipeCategory === category && styles.categoryTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Tempo di preparazione</Text>
                <TextInput
                  style={styles.textInput}
                  value={recipeTime}
                  onChangeText={setRecipeTime}
                  placeholder="Es. 30 min"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Porzioni</Text>
                <TextInput
                  style={styles.textInput}
                  value={recipeServings}
                  onChangeText={setRecipeServings}
                  placeholder="Es. 4"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddRecipe}
            >
              <Text style={styles.saveButtonText}>
                {editingRecipe ? 'Aggiorna Ricetta' : 'Salva Ricetta'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Le mie ricette</Text>
      </View>

      {recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>Nessuna ricetta</Text>
          <Text style={styles.emptyText}>
            Inizia aggiungendo la tua prima ricetta personale!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.emptyButtonText}>Aggiungi ricetta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.fabIcon}>➕</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 150, // Spazio extra per evitare sovrapposizione con la barra di navigazione
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: '#007AFF',
  },
  difficultyText: {
    fontSize: 14,
    color: '#666',
  },
  difficultyTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40, // Spazio maggiore sotto il tasto
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100, // Spazio per il FAB
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  recipeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 16,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  recipeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ingredientsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  availableIngredient: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  missingIngredient: {
    backgroundColor: '#ffe8e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ingredientText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    marginTop: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
    minWidth: 16,
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
