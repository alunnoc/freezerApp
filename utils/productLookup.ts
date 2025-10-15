// Utility per la ricerca prodotti tramite codice a barre
// Usa Open Food Facts API (gratuita e open source)

export interface ProductInfo {
  name: string;
  category: string;
  image?: string;
  ingredients?: string;
  brand?: string;
  estimatedExpiry?: string; // Data stimata di scadenza
}

// Mappa le categorie di Open Food Facts alle nostre categorie
const CATEGORY_MAPPING: Record<string, string> = {
  'dairy': 'dairy',
  'milk': 'dairy',
  'cheese': 'dairy',
  'yogurt': 'dairy',
  'vegetables': 'vegetables',
  'fruits': 'vegetables',
  'meat': 'meat',
  'poultry': 'meat',
  'fish': 'fish',
  'seafood': 'fish',
  'frozen': 'frozen',
  'beverages': 'beverages',
  'drinks': 'beverages',
  'water': 'beverages',
};

// Stima la data di scadenza basata sulla categoria
const getEstimatedExpiry = (categories: string[]): string => {
  const today = new Date();
  
  // Cerca categorie che indicano durata breve
  const shortLifeCategories = ['dairy', 'milk', 'meat', 'fish', 'vegetables', 'fruits'];
  const hasShortLife = categories.some(cat => 
    shortLifeCategories.some(short => cat.toLowerCase().includes(short))
  );
  
  if (hasShortLife) {
    // Prodotti freschi: 3-7 giorni
    const expiry = new Date(today);
    expiry.setDate(expiry.getDate() + 5);
    return formatDate(expiry);
  }
  
  // Prodotti confezionati: 30-90 giorni
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + 60);
  return formatDate(expiry);
};

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Mappa le categorie di Open Food Facts alle nostre categorie
const mapCategory = (categories: string[]): string => {
  if (!categories || categories.length === 0) return 'other';
  
  // Cerca corrispondenze nelle categorie
  for (const category of categories) {
    const lowerCategory = category.toLowerCase();
    
    // Controlla mapping diretto
    for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
      if (lowerCategory.includes(key)) {
        return value;
      }
    }
  }
  
  return 'other';
};

export async function lookupProduct(barcode: string): Promise<ProductInfo | null> {
  try {
    console.log('Looking up product with barcode:', barcode);
    
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.log('API request failed:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('API response:', data);

    if (data.status !== 1 || !data.product) {
      console.log('Product not found in database');
      return null;
    }

    const product = data.product;
    
    // Estrai le categorie
    const categories = product.categories_tags || [];
    const category = mapCategory(categories);
    
    // Stima la scadenza
    const estimatedExpiry = getEstimatedExpiry(categories);

    const productInfo: ProductInfo = {
      name: product.product_name || product.product_name_it || 'Prodotto sconosciuto',
      category,
      image: product.image_url || product.image_front_url,
      ingredients: product.ingredients_text || product.ingredients_text_it,
      brand: product.brands || product.brand,
      estimatedExpiry,
    };

    console.log('Product found:', productInfo);
    return productInfo;

  } catch (error) {
    console.error('Error looking up product:', error);
    return null;
  }
}

// Funzione di fallback per prodotti non trovati
export function createFallbackProduct(barcode: string): ProductInfo {
  return {
    name: `Prodotto ${barcode}`,
    category: 'other',
    estimatedExpiry: undefined,
  };
}
