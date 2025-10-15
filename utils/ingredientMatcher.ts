// Sistema di matching intelligente per ingredienti
export interface IngredientMatch {
  original: string;
  matched: string;
  confidence: number;
}

// Ingredienti comuni sempre disponibili (non stanno nel frigo)
const COMMON_INGREDIENTS = [
  'aglio', 'garlic', 'spicchio d\'aglio',
  'olio', 'olio d\'oliva', 'olive oil', 'olio extravergine',
  'sale', 'salt', 'sale fino', 'sale grosso',
  'pepe', 'pepper', 'pepe nero', 'black pepper',
  'acqua', 'water', 'acqua fredda', 'acqua calda',
  'aceto', 'vinegar', 'aceto balsamico', 'aceto di vino',
  'rosmarino', 'rosemary', 'rosmarino fresco',
  'origano', 'oregano', 'origano secco',
  'basilico', 'basil', 'basilico fresco',
  'prezzemolo', 'parsley', 'prezzemolo fresco',
  'timo', 'thyme', 'timo fresco',
  'alloro', 'bay leaf', 'foglia di alloro',
  'peperoncino', 'chili', 'peperoncino piccante',
  'paprika', 'paprika dolce', 'paprika affumicata',
  'cannella', 'cinnamon', 'cannella in polvere',
  'noce moscata', 'nutmeg', 'noce moscata grattugiata',
  'zenzero', 'ginger', 'zenzero fresco',
  'curcuma', 'turmeric', 'curcuma in polvere',
  'cumino', 'cumin', 'cumino in polvere',
  'coriandolo', 'coriander', 'coriandolo fresco',
  'aneto', 'dill', 'aneto fresco',
  'maggiorana', 'marjoram', 'maggiorana secca',
  'salvia', 'sage', 'salvia fresca',
  'menta', 'mint', 'menta fresca',
  'limone', 'lemon', 'succo di limone', 'scorza di limone',
  'lime', 'lime juice', 'succo di lime',
  'arancia', 'orange', 'succo d\'arancia', 'scorza d\'arancia',
  'zucchero', 'sugar', 'zucchero bianco', 'zucchero di canna',
  'miele', 'honey', 'miele di acacia',
  'lievito', 'yeast', 'lievito di birra', 'lievito secco',
  'bicarbonato', 'baking soda', 'bicarbonato di sodio',
  'vanillina', 'vanilla', 'vanilla extract',
  'cacao', 'cocoa', 'cacao in polvere',
  'caffè', 'coffee', 'caffè solubile',
  'brodo', 'broth', 'brodo vegetale', 'brodo di carne',
  'dado', 'stock cube', 'dado vegetale',
  'concentrato di pomodoro', 'tomato paste', 'doppio concentrato',
  'capperi', 'capers', 'capperi sotto sale'
];

// Database di sinonimi e traduzioni
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  // Verdure
  'pomodoro': ['tomato', 'pomodori', 'pomodorini', 'cherry tomato'],
  'pomodori': ['tomato', 'pomodoro', 'pomodorini', 'cherry tomato'],
  'cipolla': ['onion', 'cipolle', 'cipollotto'],
  'cipolle': ['onion', 'cipolla', 'cipollotto'],
  'aglio': ['garlic', 'aglio fresco', 'spicchio d\'aglio'],
  'carota': ['carrot', 'carote'],
  'carote': ['carrot', 'carota'],
  'sedano': ['celery', 'sedano rapa'],
  'peperone': ['bell pepper', 'peperoni', 'peperoncino'],
  'peperoni': ['bell pepper', 'peperone', 'peperoncino'],
  'zucchina': ['zucchini', 'zucchine', 'courgette'],
  'zucchine': ['zucchini', 'zucchina', 'courgette'],
  'melanzana': ['eggplant', 'melanzane', 'aubergine'],
  'melanzane': ['eggplant', 'melanzana', 'aubergine'],
  'spinaci': ['spinach', 'spinaci freschi'],
  'lattuga': ['lettuce', 'insalata', 'lattuga iceberg'],
  'insalata': ['lettuce', 'lattuga', 'salad'],
  
  // Carne
  'carne': ['beef', 'meat', 'carne macinata', 'manzo', 'ground beef', 'beef steak', 'beef mince', 'beef meat', 'carne bovina'],
  'manzo': ['beef', 'carne', 'bistecca', 'ground beef', 'beef steak', 'beef mince', 'beef meat', 'carne bovina'],
  'pollo': ['chicken', 'pollo intero', 'petto di pollo', 'chicken breast', 'chicken thigh', 'chicken meat'],
  'maiale': ['pork', 'carne di maiale', 'lonza', 'pork chop', 'pork meat', 'pork loin'],
  'agnello': ['lamb', 'carne di agnello', 'lamb meat', 'lamb chop'],
  'tacchino': ['turkey', 'pollo di tacchino', 'turkey meat', 'turkey breast'],
  'prosciutto': ['ham', 'prosciutto crudo', 'prosciutto cotto', 'cooked ham', 'raw ham'],
  'pancetta': ['bacon', 'guanciale', 'pancetta affumicata'],
  'salsiccia': ['sausage', 'salsicce', 'wurstel', 'italian sausage', 'pork sausage'],
  'salsicce': ['sausage', 'salsiccia', 'wurstel', 'italian sausage', 'pork sausage'],
  
  // Pesce
  'pesce': ['fish', 'pesce fresco'],
  'salmone': ['salmon', 'salmone fresco'],
  'tonno': ['tuna', 'tonno in scatola'],
  'merluzzo': ['cod', 'baccalà'],
  'gamberi': ['shrimp', 'gamberetti', 'scampi'],
  'gamberetti': ['shrimp', 'gamberi', 'scampi'],
  'cozze': ['mussels', 'cozze fresche'],
  'vongole': ['clams', 'vongole veraci'],
  
  // Latticini
  'latte': ['milk', 'latte intero', 'latte scremato'],
  'formaggio': ['cheese', 'formaggio fresco'],
  'parmigiano': ['parmesan', 'parmigiano reggiano', 'grana'],
  'mozzarella': ['mozzarella', 'mozzarella di bufala'],
  'ricotta': ['ricotta', 'ricotta fresca'],
  'yogurt': ['yogurt', 'yogurt greco'],
  'burro': ['butter', 'burro salato'],
  'panna': ['cream', 'panna fresca', 'panna da cucina'],
  
  // Uova e derivati
  'uova': ['eggs', 'uovo', 'uova fresche'],
  'uovo': ['egg', 'uova', 'uova fresche'],
  
  // Cereali e pasta
  'pasta': ['pasta', 'spaghetti', 'penne', 'rigatoni'],
  'riso': ['rice', 'riso basmati', 'riso integrale'],
  'pane': ['bread', 'pane fresco', 'pane integrale'],
  'farina': ['flour', 'farina 00', 'farina integrale'],
  'pizza': ['pizza', 'pizza margherita'],
  
  // Legumi
  'fagioli': ['beans', 'fagioli cannellini', 'fagioli borlotti'],
  'lenticchie': ['lentils', 'lenticchie rosse'],
  'ceci': ['chickpeas', 'ceci secchi'],
  'piselli': ['peas', 'piselli freschi'],
  
  // Frutta
  'mela': ['apple', 'mele', 'mela rossa'],
  'mele': ['apple', 'mela', 'mele rosse'],
  'banana': ['banana', 'banane'],
  'banane': ['banana', 'banane'],
  'arancia': ['orange', 'arance', 'arancia rossa'],
  'arance': ['orange', 'arancia', 'arance rosse'],
  'limone': ['lemon', 'limoni', 'limone fresco'],
  'limoni': ['lemon', 'limone', 'limoni freschi'],
  'fragole': ['strawberries', 'fragole fresche'],
  'fragola': ['strawberry', 'fragole', 'fragole fresche'],
  
  // Erbe e spezie
  'basilico': ['basil', 'basilico fresco'],
  'prezzemolo': ['parsley', 'prezzemolo fresco'],
  'origano': ['oregano', 'origano secco'],
  'rosmarino': ['rosemary', 'rosmarino fresco'],
  'salvia': ['sage', 'salvia fresca'],
  'timo': ['thyme', 'timo fresco'],
  'pepe': ['pepper', 'pepe nero'],
  'sale': ['salt', 'sale grosso'],
  'olio': ['oil', 'olio d\'oliva', 'olio extravergine'],
  'aceto': ['vinegar', 'aceto balsamico'],
  
  // Funghi
  'funghi': ['mushrooms', 'funghi porcini', 'champignon'],
  'funghi porcini': ['porcini mushrooms', 'funghi', 'porcini'],
  
  // Noci e semi
  'noci': ['walnuts', 'noci sgusciate'],
  'mandorle': ['almonds', 'mandorle sgusciate'],
  'pinoli': ['pine nuts', 'pinoli'],
  
  // Altri
  'patate': ['potatoes', 'patate novelle'],
  'patata': ['potato', 'patate', 'patate novelle']
};

// Funzione per normalizzare un ingrediente
function normalizeIngredient(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Rimuove punteggiatura
    .replace(/\s+/g, ' ') // Normalizza spazi
    .replace(/^\d+\s*(kg|g|ml|l|oz|lb|cup|tsp|tbsp|tablespoon|teaspoon)\s*/g, '') // Rimuove quantità
    .replace(/^\d+\s*/g, '') // Rimuove numeri all'inizio
    .trim();
}

// Funzione per trovare sinonimi
function findSynonyms(ingredient: string): string[] {
  const normalized = normalizeIngredient(ingredient);
  const synonyms: string[] = [normalized];
  
  // Cerca sinonimi diretti
  for (const [key, values] of Object.entries(INGREDIENT_SYNONYMS)) {
    if (key === normalized || values.includes(normalized)) {
      synonyms.push(...values);
    }
  }
  
  // Cerca sinonimi parziali
  for (const [key, values] of Object.entries(INGREDIENT_SYNONYMS)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      synonyms.push(...values);
    }
  }
  
  return [...new Set(synonyms)]; // Rimuove duplicati
}

// Funzione principale per il matching
export function matchIngredients(
  availableProducts: string[], 
  recipeIngredients: string[]
): {
  availableIngredients: string[];
  missingIngredients: string[];
  matchPercentage: number;
} {
  const availableIngredients: string[] = [];
  const missingIngredients: string[] = [];
  
  console.log('🔍 Matching ingredienti:');
  console.log('Prodotti disponibili:', availableProducts);
  console.log('Ingredienti ricetta:', recipeIngredients);
  
  for (const recipeIngredient of recipeIngredients) {
    const normalizedRecipe = normalizeIngredient(recipeIngredient);
    const synonyms = findSynonyms(normalizedRecipe);
    
    console.log(`\n📝 Ingrediente ricetta: "${recipeIngredient}"`);
    console.log(`🔧 Normalizzato: "${normalizedRecipe}"`);
    console.log(`📚 Sinonimi:`, synonyms);
    
    // Controlla se è un ingrediente comune (sempre disponibile)
    const isCommonIngredient = COMMON_INGREDIENTS.some(common => 
      common.toLowerCase() === normalizedRecipe.toLowerCase() ||
      synonyms.some(synonym => common.toLowerCase() === synonym.toLowerCase())
    );
    
    if (isCommonIngredient) {
      console.log(`  ✅ Ingrediente comune - sempre disponibile!`);
      availableIngredients.push(recipeIngredient);
      continue;
    }
    
    let found = false;
    let bestMatch = '';
    let bestConfidence = 0;
    
    for (const product of availableProducts) {
      const normalizedProduct = normalizeIngredient(product);
      
      console.log(`  🛒 Prodotto: "${product}" → "${normalizedProduct}"`);
      
      // Match esatto
      if (normalizedProduct === normalizedRecipe) {
        console.log(`  ✅ Match esatto trovato!`);
        availableIngredients.push(recipeIngredient);
        found = true;
        break;
      }
      
      // Match con sinonimi
      for (const synonym of synonyms) {
        if (normalizedProduct === synonym) {
          console.log(`  ✅ Match con sinonimo: "${synonym}"`);
          availableIngredients.push(recipeIngredient);
          found = true;
          break;
        }
        
        // Match parziale
        if (normalizedProduct.includes(synonym) || synonym.includes(normalizedProduct)) {
          const confidence = Math.min(normalizedProduct.length, synonym.length) / 
                           Math.max(normalizedProduct.length, synonym.length);
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = recipeIngredient;
          }
        }
        
        // Match per parole chiave (es. "carne" in "ground beef")
        const productWords = normalizedProduct.split(' ');
        const synonymWords = synonym.split(' ');
        for (const productWord of productWords) {
          for (const synonymWord of synonymWords) {
            if (productWord === synonymWord && productWord.length > 2) {
              const confidence = 0.8; // Alta confidenza per match di parole chiave
              if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestMatch = recipeIngredient;
              }
            }
          }
        }
      }
      
      if (found) break;
    }
    
    // Se non trovato ma c'è un match parziale con confidenza sufficiente
    if (!found && bestConfidence > 0.5) {
      availableIngredients.push(bestMatch);
      found = true;
    }
    
    if (!found) {
      missingIngredients.push(recipeIngredient);
    }
  }
  
  const matchPercentage = (availableIngredients.length / recipeIngredients.length) * 100;
  
  return {
    availableIngredients,
    missingIngredients,
    matchPercentage
  };
}

// Funzione per aggiungere nuovi sinonimi
export function addIngredientSynonym(ingredient: string, synonyms: string[]) {
  INGREDIENT_SYNONYMS[ingredient.toLowerCase()] = synonyms;
}

// Funzione per ottenere tutti i sinonimi di un ingrediente
export function getIngredientSynonyms(ingredient: string): string[] {
  return findSynonyms(ingredient);
}
