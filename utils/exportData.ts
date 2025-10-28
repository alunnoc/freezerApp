import { Item } from '../hooks/useStorage';

export interface WeeklyMenu {
  [weekday: string]: {
    breakfast?: string;
    lunch?: string;
    menuBimbo?: string;
    dinner?: string;
  };
}

export interface ExportData {
  fridge: Item[];
  freezer: Item[];
  pantry: Item[];
  weeklyMenu?: WeeklyMenu;
  exportDate: string;
  version: string;
}

export const exportToJSON = (fridge: Item[], freezer: Item[], pantry: Item[], weeklyMenu?: WeeklyMenu): string => {
  const exportData: ExportData = {
    fridge,
    freezer,
    pantry,
    weeklyMenu,
    exportDate: new Date().toISOString(),
    version: "1.0.0",
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const exportToCSV = (fridge: Item[], freezer: Item[], pantry: Item[], weeklyMenu?: WeeklyMenu): string => {
  const allItems = [
    ...fridge.map(item => ({ ...item, section: 'Frigo' })),
    ...freezer.map(item => ({ ...item, section: 'Freezer' })),
    ...pantry.map(item => ({ ...item, section: 'Dispensa' }))
  ];

  const headers = ['Sezione', 'ID', 'Nome', 'Quantità', 'Unità', 'Categoria', 'Data Scadenza', 'Data Congelamento', 'Data Aggiunta'];
  const csvRows = [headers.join(',')];

  allItems.forEach(item => {
    const row = [
      item.section,
      `"${item.id}"`,
      `"${item.name}"`,
      item.qty,
      `"${item.unit}"`,
      `"${item.category || 'N/A'}"`,
      `"${item.expiryDate || 'N/A'}"`,
      `"${item.frozenAt || 'N/A'}"`,
      `"${item.addedAt || 'N/A'}"`
    ];
    csvRows.push(row.join(','));
  });

  // Aggiungi il menù settimanale se presente
  if (weeklyMenu) {
    csvRows.push(''); // Riga vuota
    csvRows.push('MENU SETTIMANALE');
    csvRows.push('Giorno,Pasto,Contenuto');
    
    Object.entries(weeklyMenu).forEach(([day, menu]) => {
      if (menu.lunch) {
        csvRows.push(`"${day}","Pranzo","${menu.lunch}"`);
      }
      if (menu.menuBimbo) {
        csvRows.push(`"${day}","Menù bimbo","${menu.menuBimbo}"`);
      }
      if (menu.dinner) {
        csvRows.push(`"${day}","Cena","${menu.dinner}"`);
      }
    });
  }

  return csvRows.join('\n');
};

// Esportazione CSV completa con tutte le proprietà dettagliate
export const exportToDetailedCSV = (fridge: Item[], freezer: Item[], pantry: Item[], weeklyMenu?: WeeklyMenu): string => {
  const allItems = [
    ...fridge.map(item => ({ ...item, section: 'Frigo' })),
    ...freezer.map(item => ({ ...item, section: 'Freezer' })),
    ...pantry.map(item => ({ ...item, section: 'Dispensa' }))
  ];

  const headers = [
    'Sezione', 
    'ID', 
    'Nome', 
    'Quantità', 
    'Unità', 
    'Categoria', 
    'Data Scadenza', 
    'Data Congelamento',
    'Data Aggiunta',
    'Giorni alla Scadenza',
    'Stato Scadenza'
  ];
  const csvRows = [headers.join(',')];

  allItems.forEach(item => {
    // Calcola giorni alla scadenza
    let daysToExpiry = 'N/A';
    let expiryStatus = 'N/A';
    
    if (item.expiryDate) {
      const today = new Date();
      const expiry = new Date(item.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      daysToExpiry = diffDays.toString();
      
      if (diffDays < 0) {
        expiryStatus = 'SCADUTO';
      } else if (diffDays <= 3) {
        expiryStatus = 'SCADENZA IMMINENTE';
      } else if (diffDays <= 7) {
        expiryStatus = 'SCADENZA PROSSIMA';
      } else {
        expiryStatus = 'OK';
      }
    }

    const row = [
      item.section,
      `"${item.id}"`,
      `"${item.name}"`,
      item.qty,
      `"${item.unit}"`,
      `"${item.category || 'N/A'}"`,
      `"${item.expiryDate || 'N/A'}"`,
      `"${item.frozenAt || 'N/A'}"`,
      `"${item.addedAt || 'N/A'}"`,
      daysToExpiry,
      `"${expiryStatus}"`
    ];
    csvRows.push(row.join(','));
  });

  // Aggiungi il menù settimanale se presente
  if (weeklyMenu) {
    csvRows.push(''); // Riga vuota
    csvRows.push('MENU SETTIMANALE');
    csvRows.push('Giorno,Pasto,Contenuto');
    
    Object.entries(weeklyMenu).forEach(([day, menu]) => {
      if (menu.lunch) {
        csvRows.push(`"${day}","Pranzo","${menu.lunch}"`);
      }
      if (menu.menuBimbo) {
        csvRows.push(`"${day}","Menù bimbo","${menu.menuBimbo}"`);
      }
      if (menu.dinner) {
        csvRows.push(`"${day}","Cena","${menu.dinner}"`);
      }
    });
  }

  return csvRows.join('\n');
};

export const generateSummary = (fridge: Item[], freezer: Item[], pantry: Item[], weeklyMenu?: WeeklyMenu): string => {
  const allItems = [...fridge, ...freezer, ...pantry];
  const totalItems = allItems.length;
  const totalQuantity = allItems.reduce((sum, item) => sum + item.qty, 0);
  
  const categories = allItems.reduce((acc, item) => {
    const category = item.category || 'Altro';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const expiringSoon = allItems.filter(item => {
    if (!item.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const expiredItems = allItems.filter(item => {
    if (!item.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    return expiry < today;
  });

  const frozenItems = allItems.filter(item => item.frozenAt);
  const recentlyAdded = allItems.filter(item => {
    if (!item.addedAt) return false;
    const today = new Date();
    const added = new Date(item.addedAt.split('/').reverse().join('-'));
    const diffTime = today.getTime() - added.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });

  let summary = `RIEPILOGO FRIGO, FREEZER E CREDENZA\n`;
  summary += `==================================\n\n`;
  summary += `Data: ${new Date().toLocaleDateString('it-IT')}\n`;
  summary += `Totale prodotti: ${totalItems}\n`;
  summary += `Totale quantità: ${totalQuantity}\n\n`;
  
  summary += `DISTRIBUZIONE PER CATEGORIA:\n`;
  Object.entries(categories).forEach(([category, count]) => {
    summary += `- ${category}: ${count} prodotti\n`;
  });
  
  summary += `\nSCADENZE:\n`;
  summary += `- Prodotti scaduti: ${expiredItems.length}\n`;
  summary += `- Prodotti in scadenza (7 giorni): ${expiringSoon.length}\n`;
  
  summary += `\nCONGELAMENTI:\n`;
  summary += `- Prodotti congelati: ${frozenItems.length}\n`;
  
  summary += `\nAGGIUNTE RECENTI:\n`;
  summary += `- Prodotti aggiunti negli ultimi 7 giorni: ${recentlyAdded.length}\n`;
  
  summary += `\nSEZIONI:\n`;
  summary += `- Frigo: ${fridge.length} prodotti\n`;
  summary += `- Freezer: ${freezer.length} prodotti\n`;
  summary += `- Dispensa: ${pantry.length} prodotti\n`;

  // Aggiungi lista dettagliata dei prodotti in scadenza
  if (expiringSoon.length > 0) {
    summary += `\nPRODOTTI IN SCADENZA:\n`;
    summary += `===================\n`;
    expiringSoon.forEach(item => {
      const today = new Date();
      const expiry = new Date(item.expiryDate!);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      summary += `- ${item.name} (${item.qty} ${item.unit}) - Scade tra ${diffDays} giorni\n`;
    });
  }

  // Aggiungi lista dettagliata dei prodotti scaduti
  if (expiredItems.length > 0) {
    summary += `\nPRODOTTI SCADUTI:\n`;
    summary += `================\n`;
    expiredItems.forEach(item => {
      const today = new Date();
      const expiry = new Date(item.expiryDate!);
      const diffTime = today.getTime() - expiry.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      summary += `- ${item.name} (${item.qty} ${item.unit}) - Scaduto da ${diffDays} giorni\n`;
    });
  }

  // Aggiungi il menù settimanale se presente
  if (weeklyMenu) {
    summary += `\nMENU SETTIMANALE:\n`;
    summary += `================\n`;
    
    const weekDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    weekDays.forEach(day => {
      const dayMenu = weeklyMenu[day];
      if (dayMenu && (dayMenu.lunch || dayMenu.menuBimbo || dayMenu.dinner)) {
        summary += `\n${day}:\n`;
        if (dayMenu.lunch) {
          summary += `  Pranzo: ${dayMenu.lunch}\n`;
        }
        if (dayMenu.menuBimbo) {
          summary += `  Menù bimbo: ${dayMenu.menuBimbo}\n`;
        }
        if (dayMenu.dinner) {
          summary += `  Cena: ${dayMenu.dinner}\n`;
        }
      }
    });
  }

  return summary;
};

// Funzioni di import per ripristinare i dati
export const importFromJSON = (jsonContent: string): { fridge: Item[], freezer: Item[], pantry: Item[], weeklyMenu?: WeeklyMenu } | null => {
  try {
    const data = JSON.parse(jsonContent) as ExportData;
    
    // Validazione base
    if (!data.fridge || !data.freezer || !data.pantry) {
      throw new Error('Formato JSON non valido: mancano le sezioni frigo, freezer o pantry');
    }
    
    return {
      fridge: data.fridge,
      freezer: data.freezer,
      pantry: data.pantry,
      weeklyMenu: data.weeklyMenu
    };
  } catch (error) {
    console.error('Errore import JSON:', error);
    return null;
  }
};

export const importFromCSV = (csvContent: string): { fridge: Item[], freezer: Item[], pantry: Item[] } | null => {
  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('File CSV vuoto o non valido');
    }
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const items: Item[] = [];
    
    // Trova gli indici delle colonne
    const sectionIndex = headers.findIndex(h => h.toLowerCase().includes('sezione'));
    const nameIndex = headers.findIndex(h => h.toLowerCase().includes('nome'));
    const qtyIndex = headers.findIndex(h => h.toLowerCase().includes('quantità'));
    const unitIndex = headers.findIndex(h => h.toLowerCase().includes('unità'));
    const categoryIndex = headers.findIndex(h => h.toLowerCase().includes('categoria'));
    const expiryIndex = headers.findIndex(h => h.toLowerCase().includes('scadenza'));
    const frozenIndex = headers.findIndex(h => h.toLowerCase().includes('congelamento'));
    const addedIndex = headers.findIndex(h => h.toLowerCase().includes('aggiunta'));
    const idIndex = headers.findIndex(h => h.toLowerCase().includes('id'));
    
    if (sectionIndex === -1 || nameIndex === -1 || qtyIndex === -1 || unitIndex === -1) {
      throw new Error('Formato CSV non valido: mancano colonne obbligatorie');
    }
    
    // Processa ogni riga
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      
      // Salta righe vuote o intestazioni del menu
      if (values.length < headers.length || values[sectionIndex] === 'MENU SETTIMANALE' || values[sectionIndex] === '') {
        continue;
      }
      
      const section = values[sectionIndex].toLowerCase();
      const name = values[nameIndex];
      const qty = parseFloat(values[qtyIndex]) || 1;
      const unit = values[unitIndex];
      
      if (!name) continue; // Salta righe senza nome
      
      const item: Item = {
        id: idIndex !== -1 && values[idIndex] ? values[idIndex] : `imported-${Date.now()}-${i}`,
        name,
        qty,
        unit,
        category: categoryIndex !== -1 && values[categoryIndex] && values[categoryIndex] !== 'N/A' ? values[categoryIndex] : undefined,
        expiryDate: expiryIndex !== -1 && values[expiryIndex] && values[expiryIndex] !== 'N/A' ? values[expiryIndex] : undefined,
        frozenAt: frozenIndex !== -1 && values[frozenIndex] && values[frozenIndex] !== 'N/A' ? values[frozenIndex] : undefined,
        addedAt: addedIndex !== -1 && values[addedIndex] && values[addedIndex] !== 'N/A' ? values[addedIndex] : new Date().toLocaleDateString('it-IT')
      };
      
      items.push(item);
    }
    
    // Raggruppa per sezione
    const fridge: Item[] = [];
    const freezer: Item[] = [];
    const pantry: Item[] = [];
    
    items.forEach(item => {
      const section = lines.find(line => line.includes(item.name))?.split(',')[sectionIndex]?.replace(/"/g, '').trim().toLowerCase();
      
      if (section === 'frigo') {
        fridge.push(item);
      } else if (section === 'freezer') {
        freezer.push(item);
      } else if (section === 'dispensa') {
        pantry.push(item);
      }
    });
    
    return { fridge, freezer, pantry };
  } catch (error) {
    console.error('Errore import CSV:', error);
    return null;
  }
};
