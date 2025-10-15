import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStorage } from '../../hooks/useStorage';

type Recipe = {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  difficulty: 'Facile' | 'Media' | 'Difficile';
  time: string;
  servings: number;
  category: string;
};

const RECIPES_DATABASE: Recipe[] = [
  {
    id: '1',
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
    category: 'Primi'
  },
  {
    id: '2',
    name: 'Insalata Caprese',
    description: 'Fresca insalata con mozzarella, pomodori e basilico',
    ingredients: ['Mozzarella', 'Pomodori', 'Basilico', 'Olio d\'oliva', 'Sale', 'Pepe'],
    instructions: [
      'Taglia a fette mozzarella e pomodori',
      'Disponi alternando mozzarella e pomodori',
      'Condisci con olio, sale e pepe',
      'Guarnisci con foglie di basilico'
    ],
    difficulty: 'Facile',
    time: '10 min',
    servings: 2,
    category: 'Antipasti'
  },
  {
    id: '3',
    name: 'Pollo al Limone',
    description: 'Petto di pollo marinato con limone e erbe aromatiche',
    ingredients: ['Pollo', 'Limone', 'Aglio', 'Rosmarino', 'Olio d\'oliva', 'Sale', 'Pepe'],
    instructions: [
      'Marina il pollo con limone, aglio e rosmarino per 30 min',
      'Scalda l\'olio in una padella',
      'Cuoci il pollo per 6-7 min per lato',
      'Servi con il sugo di cottura'
    ],
    difficulty: 'Media',
    time: '45 min',
    servings: 4,
    category: 'Secondi'
  },
  {
    id: '4',
    name: 'Risotto ai Funghi',
    description: 'Cremoso risotto con funghi porcini e parmigiano',
    ingredients: ['Riso', 'Funghi', 'Cipolla', 'Brodo', 'Parmigiano', 'Burro', 'Vino bianco'],
    instructions: [
      'Soffriggi la cipolla nel burro',
      'Aggiungi i funghi e cuoci per 5 min',
      'Versa il riso e tostalo per 2 min',
      'Aggiungi il vino e poi il brodo poco alla volta',
      'Mantecare con parmigiano e burro'
    ],
    difficulty: 'Difficile',
    time: '30 min',
    servings: 4,
    category: 'Primi'
  },
  {
    id: '5',
    name: 'Torta di Mele',
    description: 'Dolce torta di mele con cannella e zucchero',
    ingredients: ['Mele', 'Farina', 'Uova', 'Zucchero', 'Burro', 'Cannella', 'Lievito'],
    instructions: [
      'Sbuccia e taglia le mele a fette',
      'Mescola farina, zucchero, uova e burro',
      'Aggiungi il lievito e la cannella',
      'Disponi le mele nell\'impasto',
      'Cuoci in forno a 180°C per 40 min'
    ],
    difficulty: 'Media',
    time: '60 min',
    servings: 8,
    category: 'Dolci'
  },
  {
    id: '6',
    name: 'Minestrone',
    description: 'Zuppa di verdure con pasta e legumi',
    ingredients: ['Verdure miste', 'Pasta', 'Fagioli', 'Pomodori', 'Cipolla', 'Carote', 'Sedano'],
    instructions: [
      'Trita tutte le verdure',
      'Soffriggi cipolla, carote e sedano',
      'Aggiungi le altre verdure e i fagioli',
      'Cuoci per 30 minuti',
      'Aggiungi la pasta negli ultimi 10 minuti'
    ],
    difficulty: 'Facile',
    time: '45 min',
    servings: 6,
    category: 'Zuppe'
  }
];

export default function RecipesScreen() {
  const { data: fridgeData } = useStorage<any[]>('fridge', []);
  const { data: freezerData } = useStorage<any[]>('freezer', []);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');
  
  // Combina tutti i prodotti disponibili
  const availableProducts = useMemo(() => {
    const allProducts = [...(fridgeData || []), ...(freezerData || [])];
    return allProducts.map(product => product.name?.toLowerCase() || '');
  }, [fridgeData, freezerData]);

  // Filtra ricette in base agli ingredienti disponibili
  const suggestedRecipes = useMemo(() => {
    return RECIPES_DATABASE.map(recipe => {
      const availableIngredients = recipe.ingredients.filter(ingredient => 
        availableProducts.some(product => 
          product.includes(ingredient.toLowerCase()) || 
          ingredient.toLowerCase().includes(product)
        )
      );
      
      const matchPercentage = (availableIngredients.length / recipe.ingredients.length) * 100;
      
      return {
        ...recipe,
        availableIngredients,
        missingIngredients: recipe.ingredients.filter(ingredient => 
          !availableIngredients.includes(ingredient)
        ),
        matchPercentage
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [availableProducts]);

  // Filtra per categoria
  const filteredRecipes = useMemo(() => {
    if (selectedCategory === 'Tutte') {
      return suggestedRecipes;
    }
    return suggestedRecipes.filter(recipe => recipe.category === selectedCategory);
  }, [suggestedRecipes, selectedCategory]);

  const categories = ['Tutte', ...Array.from(new Set(RECIPES_DATABASE.map(r => r.category)))];

  const renderRecipe = ({ item }: { item: any }) => (
    <View style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeName}>{item.name}</Text>
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{Math.round(item.matchPercentage)}%</Text>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Ricette Consigliate</Text>
      
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
            onPress={() => setSelectedCategory(category)}
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
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipe}
          contentContainerStyle={styles.recipesList}
          showsVerticalScrollIndicator={false}
        />
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
    marginBottom: 24,
    color: '#333',
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
});
