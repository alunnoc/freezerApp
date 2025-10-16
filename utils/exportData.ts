import { Item } from '../hooks/useStorage';

export interface ExportData {
  fridge: Item[];
  freezer: Item[];
  pantry: Item[];
  exportDate: string;
  version: string;
}

export const exportToJSON = (fridge: Item[], freezer: Item[], pantry: Item[]): string => {
  const exportData: ExportData = {
    fridge,
    freezer,
    pantry,
    exportDate: new Date().toISOString(),
    version: "1.0.0",
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const exportToCSV = (fridge: Item[], freezer: Item[], pantry: Item[]): string => {
  const allItems = [
    ...fridge.map(item => ({ ...item, section: 'Frigo' })),
    ...freezer.map(item => ({ ...item, section: 'Freezer' })),
    ...pantry.map(item => ({ ...item, section: 'Dispensa' }))
  ];

  const headers = ['Sezione', 'Nome', 'Quantità', 'Unità', 'Categoria', 'Data Scadenza'];
  const csvRows = [headers.join(',')];

  allItems.forEach(item => {
    const row = [
      item.section,
      `"${item.name}"`,
      item.qty,
      `"${item.unit}"`,
      `"${item.category || 'N/A'}"`,
      `"${item.expiryDate || 'N/A'}"`
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

export const generateSummary = (fridge: Item[], freezer: Item[], pantry: Item[]): string => {
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
  summary += `- Prodotti in scadenza (7 giorni): ${expiringSoon.length}\n`;
  
  summary += `\nSEZIONI:\n`;
  summary += `- Frigo: ${fridge.length} prodotti\n`;
  summary += `- Freezer: ${freezer.length} prodotti\n`;
  summary += `- Dispensa: ${pantry.length} prodotti\n`;

  return summary;
};
