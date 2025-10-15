import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStorage } from '../../hooks/useStorage';
import { matchIngredients } from '../../utils/ingredientMatcher';
import { AVAILABLE_CATEGORIES, CATEGORY_TRANSLATIONS, getRandomRecipes, Recipe, searchRecipesByCategory } from '../../utils/recipeAPI';

// Database locale come fallback
const FALLBACK_RECIPES: Recipe[] = [
  {
    id: 'fallback-1',
    name: 'Pasta al Pomodoro',
    description: 'Classica pasta con pomodoro fresco e basilico',
    ingredients: ['Pasta', 'Pomodori', 'Aglio', 'Basilico', 'Olio d\'oliva', 'Sale'],
    instructions: [
      'Cuoci la pasta in acqua bollente salata',
      'In una padella, soffriggi l\'aglio nell\'olio',
      'Aggiungi i pomodori tagliati e cuoci per 10 minuti',
      'Condisci la pasta con il sugo e il basilico'
    ],
    difficulty: 'Facile',
    time: '20 min',
    servings: 4,
    category: 'Primi',
    image: '',
    source: 'Locale'
  }
];

export default function RecipesScreen() {
  const { data: fridgeData } = useStorage<any[]>('fridge', []);
  const { data: freezerData } = useStorage<any[]>('freezer', []);
  const { data: pantryData } = useStorage<any[]>('pantry', []);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterEnabled, setFilterEnabled] = useState(true); // Filtro 70% attivo di default
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreRecipes, setHasMoreRecipes] = useState(true);
  const [categoryExhausted, setCategoryExhausted] = useState(false);
  const [categoryOffset, setCategoryOffset] = useState<Record<string, number>>({});
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  
  // Combina tutti i prodotti disponibili
  const availableProducts = useMemo(() => {
    const allProducts = [...(fridgeData || []), ...(freezerData || []), ...(pantryData || [])];
    return allProducts.map(product => product.name?.toLowerCase() || '');
  }, [fridgeData, freezerData, pantryData]);

  // Carica ricette all'avvio
  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carica ricette casuali come default
      const randomRecipes = await getRandomRecipes(10);
      setRecipes(randomRecipes);
      setCategoryOffset(prev => ({ ...prev, 'Tutte': 10 }));
    } catch (err) {
      console.error('Errore nel caricamento ricette:', err);
      setError('Errore nel caricamento delle ricette');
      setRecipes(FALLBACK_RECIPES);
    } finally {
      setLoading(false);
    }
  };

  // Carica ricette per categoria
  const loadRecipesByCategory = async (category: string) => {
    if (category === 'Tutte') {
      loadRecipes();
      setCategoryExhausted(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCategoryExhausted(false);
      setCategoryOffset(prev => ({ ...prev, [category]: 0 }));
      
      // Trova la categoria inglese corrispondente
      const englishCategory = Object.keys(CATEGORY_TRANSLATIONS).find(
        key => CATEGORY_TRANSLATIONS[key] === category
      ) || category;
      
      console.log('Cercando ricette per categoria:', englishCategory);
      const categoryRecipes = await searchRecipesByCategory(englishCategory, 0, 10);
      console.log('Ricette trovate:', categoryRecipes.length);
      
      if (categoryRecipes.length === 0) {
        // Se non ci sono ricette per questa categoria, carica ricette casuali
        console.log('Nessuna ricetta trovata per categoria, caricando ricette casuali...');
        const randomRecipes = await getRandomRecipes(10);
        setRecipes(randomRecipes);
        setCategoryOffset(prev => ({ ...prev, [category]: 0 }));
      } else {
        // Mostra solo le ricette della categoria selezionata
        setRecipes(categoryRecipes);
        setCategoryOffset(prev => ({ ...prev, [category]: 10 }));
      }
    } catch (err) {
      console.error('Errore nel caricamento ricette per categoria:', err);
      setError('Errore nel caricamento delle ricette');
      setRecipes(FALLBACK_RECIPES);
    } finally {
      setLoading(false);
    }
  };

  // Carica più ricette
  const loadMoreRecipes = async () => {
    if (loadingMore || !hasMoreRecipes) return;
    
    try {
      setLoadingMore(true);
      
      if (selectedCategory === 'Tutte') {
        // Carica altre ricette casuali
        const moreRecipes = await getRandomRecipes(5);
        // Filtra le ricette duplicate
        const existingIds = recipes.map(r => r.id);
        const newRecipes = moreRecipes.filter(r => !existingIds.includes(r.id));
        setRecipes(prev => [...prev, ...newRecipes]);
        
        // Aggiorna l'offset per la categoria "Tutte"
        setCategoryOffset(prev => ({ 
          ...prev, 
          'Tutte': (prev['Tutte'] || 0) + newRecipes.length 
        }));
      } else {
        // Per le categorie specifiche, prova a caricare altre ricette della categoria
        try {
          const englishCategory = Object.keys(CATEGORY_TRANSLATIONS).find(
            key => CATEGORY_TRANSLATIONS[key] === selectedCategory
          ) || selectedCategory;
          
          // Ottieni l'offset corrente per questa categoria
          const currentOffset = categoryOffset[selectedCategory] || 0;
          
          // Carica altre ricette della categoria con offset corretto
          const moreCategoryRecipes = await searchRecipesByCategory(englishCategory, currentOffset, 10);
          
          if (moreCategoryRecipes.length > 0) {
            // Filtra le ricette duplicate
            const existingIds = recipes.map(r => r.id);
            const newRecipes = moreCategoryRecipes.filter(r => !existingIds.includes(r.id));
            setRecipes(prev => [...prev, ...newRecipes]);
            
            // Aggiorna l'offset per questa categoria
            setCategoryOffset(prev => ({ 
              ...prev, 
              [selectedCategory]: currentOffset + newRecipes.length 
            }));
          } else {
            // Se non ci sono più ricette per questa categoria, non aggiungere nulla
            console.log('Nessuna altra ricetta disponibile per questa categoria');
            setCategoryExhausted(true);
          }
        } catch (categoryError) {
          console.log('Errore nel caricamento categoria:', categoryError);
          // Non aggiungere ricette casuali per categorie specifiche
        }
      }
    } catch (err) {
      console.error('Errore nel caricamento di altre ricette:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Filtra ricette in base agli ingredienti disponibili
  const suggestedRecipes = useMemo(() => {
    return recipes.map(recipe => {
      const matchResult = matchIngredients(availableProducts, recipe.ingredients);
      
      return {
        ...recipe,
        availableIngredients: matchResult.availableIngredients,
        missingIngredients: matchResult.missingIngredients,
        matchPercentage: matchResult.matchPercentage
      };
    })
    .filter(recipe => !filterEnabled || recipe.matchPercentage >= 70) // Filtro condizionale
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [recipes, availableProducts, filterEnabled]);

  // Categorie disponibili
  const categories = ['Tutte', ...AVAILABLE_CATEGORIES.map(cat => CATEGORY_TRANSLATIONS[cat] || cat)];

  const renderRecipe = ({ item }: { item: any }) => {
    const isExpanded = expandedRecipe === item.id;
    
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
              <Text style={styles.matchText}>{Math.round(item.matchPercentage)}%</Text>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          </View>
        </View>
      
      <Text style={styles.recipeDescription}>{item.description}</Text>
      
      <View style={styles.recipeMeta}>
        <Text style={styles.metaItem}>⏱️ {item.time}</Text>
        <Text style={styles.metaItem}>👥 {item.servings} persone</Text>
        <Text style={styles.metaItem}>📊 {item.difficulty}</Text>
      </View>

      <View style={styles.ingredientsSection}>
        <Text style={styles.sectionTitle}>Ingredienti disponibili:</Text>
        <View style={styles.ingredientsList}>
          {item.availableIngredients.map((ingredient: string, index: number) => (
            <View key={index} style={styles.availableIngredient}>
              <Text style={styles.ingredientText}>✅ {ingredient}</Text>
            </View>
          ))}
        </View>
        
        {item.missingIngredients.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Ingredienti mancanti:</Text>
            <View style={styles.ingredientsList}>
              {item.missingIngredients.map((ingredient: string, index: number) => (
                <View key={index} style={styles.missingIngredient}>
                  <Text style={styles.ingredientText}>❌ {ingredient}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

        {isExpanded && item.instructions && item.instructions.length > 0 && (
          <View style={styles.instructionsSection}>
            <Text style={styles.sectionTitle}>Istruzioni:</Text>
            <View style={styles.instructionsList}>
              {item.instructions.map((instruction: string, index: number) => (
                <View key={index} style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>{index + 1}.</Text>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Ricette dal Web</Text>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterEnabled && styles.filterButtonActive]}
          onPress={() => setFilterEnabled(!filterEnabled)}
        >
          <IconSymbol name="line.3.horizontal.decrease" size={16} color={filterEnabled ? '#fff' : '#666'} />
          <Text style={[styles.filterButtonText, filterEnabled && styles.filterButtonTextActive]}>
            Ricette con i tuoi ingredienti
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Filtri categoria */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategory
            ]}
            onPress={() => {
              setSelectedCategory(category);
              loadRecipesByCategory(category);
            }}
          >
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText
              ]}
              numberOfLines={1}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Lista ricette */}
      <View style={styles.recipesContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0b67b2" />
            <Text style={styles.loadingText}>Caricamento ricette...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadRecipes}>
              <Text style={styles.retryButtonText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        ) : suggestedRecipes.length === 0 ? (
          <View style={styles.noRecipesContainer}>
            <Text style={styles.noRecipesTitle}>
              {filterEnabled ? 'Nessuna ricetta compatibile' : 'Nessuna ricetta disponibile'}
            </Text>
            <Text style={styles.noRecipesText}>
              {filterEnabled 
                ? 'Non ci sono ricette con almeno il 70% degli ingredienti disponibili. Prova a disattivare il filtro o aggiungi più prodotti al frigo.'
                : 'Non ci sono ricette disponibili per questa categoria. Prova a cambiare categoria o aggiungi più prodotti al frigo.'
              }
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={suggestedRecipes}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={renderRecipe}
              contentContainerStyle={styles.recipesList}
              showsVerticalScrollIndicator={false}
            />
            {suggestedRecipes.length > 0 && !categoryExhausted && (
              <TouchableOpacity
                style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
                onPress={loadMoreRecipes}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loadMoreButtonText}>Carica altre ricette</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  filterContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0b67b2',
    borderColor: '#0b67b2',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  categoriesContainer: {
    marginBottom: 8,
    paddingVertical: 0,
    height: 60,
  },
  categoriesContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e5eaf0',
    width: 90,
    minHeight: 48,
    maxHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategory: {
    backgroundColor: '#0b67b2',
    borderColor: '#0b67b2',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: 'white',
  },
  recipesContainer: {
    flex: 1, // Sfrutta tutto lo spazio disponibile
  },
  recipesList: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  matchBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  ingredientsSection: {
    marginTop: 8,
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
    gap: 8,
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
  instructionsSection: {
    marginTop: 16,
  },
  instructionsList: {
    marginTop: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
    minWidth: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  // Stili per loading e errori
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0b67b2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Stili per nessuna ricetta
  noRecipesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noRecipesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  noRecipesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadMoreButton: {
    backgroundColor: '#0b67b2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  loadMoreButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
