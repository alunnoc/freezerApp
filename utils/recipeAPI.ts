// API per ricette da TheMealDB (completamente gratuita)
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  difficulty: 'Facile' | 'Media' | 'Difficile';
  time: string;
  servings: number;
  category: string;
  image: string;
  source: string;
}

// Cerca ricette per categoria
export async function searchRecipesByCategory(category: string): Promise<Recipe[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
    const data = await response.json();
    
    if (!data.meals) return [];
    
    // Prendi solo le prime 10 ricette per evitare troppe chiamate
    const limitedMeals = data.meals.slice(0, 10);
    
    // Per ogni ricetta, ottieni i dettagli completi
    const detailedRecipes = await Promise.all(
      limitedMeals.map(async (meal: any) => {
        try {
          const detailResponse = await fetch(`${API_BASE_URL}/lookup.php?i=${meal.idMeal}`);
          const detailData = await detailResponse.json();
          
          if (!detailData.meals || detailData.meals.length === 0) return null;
          
          const recipe = detailData.meals[0];
          return parseRecipe(recipe);
        } catch (error) {
          console.error('Errore nel recupero dettagli ricetta:', error);
          return null;
        }
      })
    );
    
    return detailedRecipes.filter(recipe => recipe !== null) as Recipe[];
  } catch (error) {
    console.error('Errore nella ricerca ricette:', error);
    return [];
  }
}

// Cerca ricette per ingrediente
export async function searchRecipesByIngredient(ingredient: string): Promise<Recipe[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`);
    const data = await response.json();
    
    if (!data.meals) return [];
    
    // Prendi solo le prime 5 ricette
    const limitedMeals = data.meals.slice(0, 5);
    
    const detailedRecipes = await Promise.all(
      limitedMeals.map(async (meal: any) => {
        try {
          const detailResponse = await fetch(`${API_BASE_URL}/lookup.php?i=${meal.idMeal}`);
          const detailData = await detailResponse.json();
          
          if (!detailData.meals || detailData.meals.length === 0) return null;
          
          const recipe = detailData.meals[0];
          return parseRecipe(recipe);
        } catch (error) {
          console.error('Errore nel recupero dettagli ricetta:', error);
          return null;
        }
      })
    );
    
    return detailedRecipes.filter(recipe => recipe !== null) as Recipe[];
  } catch (error) {
    console.error('Errore nella ricerca per ingrediente:', error);
    return [];
  }
}

// Ottieni ricette casuali
export async function getRandomRecipes(count: number = 10): Promise<Recipe[]> {
  try {
    const recipes: Recipe[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const response = await fetch(`${API_BASE_URL}/random.php`);
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
          const recipe = parseRecipe(data.meals[0]);
          recipes.push(recipe);
        }
      } catch (error) {
        console.error('Errore nel recupero ricetta casuale:', error);
      }
    }
    
    return recipes;
  } catch (error) {
    console.error('Errore nel recupero ricette casuali:', error);
    return [];
  }
}

// Parsing di una ricetta da TheMealDB
function parseRecipe(meal: any): Recipe {
  // Estrai ingredienti e misure
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim()) {
      const fullIngredient = measure ? `${measure} ${ingredient}` : ingredient;
      ingredients.push(fullIngredient.trim());
    }
  }
  
  // Estrai istruzioni
  const instructions = meal.strInstructions
    ? meal.strInstructions
        .split('\r\n')
        .filter((step: string) => step.trim())
        .map((step: string) => step.trim())
    : [];
  
  // Determina difficoltà basata sul numero di ingredienti
  let difficulty: 'Facile' | 'Media' | 'Difficile' = 'Facile';
  if (ingredients.length > 10) difficulty = 'Media';
  if (ingredients.length > 15) difficulty = 'Difficile';
  
  // Stima tempo di preparazione (TheMealDB non fornisce questa info)
  let time = '30 min';
  if (ingredients.length > 8) time = '45 min';
  if (ingredients.length > 12) time = '60 min';
  
  return {
    id: meal.idMeal,
    name: meal.strMeal || 'Ricetta senza nome',
    description: `Deliziosa ricetta ${meal.strCategory || 'internazionale'}`,
    ingredients,
    instructions,
    difficulty,
    time,
    servings: 4, // Valore predefinito
    category: meal.strCategory || 'Generale',
    image: meal.strMealThumb || '',
    source: 'TheMealDB'
  };
}

// Categorie disponibili in TheMealDB
export const AVAILABLE_CATEGORIES = [
  'Beef',
  'Chicken', 
  'Dessert',
  'Lamb',
  'Miscellaneous',
  'Pasta',
  'Pork',
  'Seafood',
  'Side',
  'Starter',
  'Vegan',
  'Vegetarian'
];

// Mappa categorie italiane
export const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'Beef': 'Carne',
  'Chicken': 'Pollo',
  'Dessert': 'Dolci',
  'Lamb': 'Agnello',
  'Miscellaneous': 'Varie',
  'Pasta': 'Pasta',
  'Pork': 'Maiale',
  'Seafood': 'Pesce',
  'Side': 'Contorni',
  'Starter': 'Antipasti',
  'Vegan': 'Vegano',
  'Vegetarian': 'Vegetariano'
};
