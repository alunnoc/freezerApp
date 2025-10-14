# 🧊 Freezer App - Gestione Frigo e Freezer

Un'app mobile moderna per gestire il contenuto del tuo frigo e freezer, sviluppata con React Native ed Expo.

## ✨ Funzionalità

### 🏠 Gestione Prodotti
- **Aggiunta prodotti**: Nome, quantità, unità di misura
- **Categorie**: Latticini, verdure, carne, pesce, surgelati, bevande e altro
- **Date di scadenza**: Tracciamento scadenze con indicatori visivi (formato DD-MM-YYYY)
- **Incremento/Decremento**: Gestione quantità con pulsanti intuitivi
- **Rimozione**: Eliminazione prodotti con conferma

### 🔍 Ricerca e Filtri
- **Ricerca testuale**: Trova prodotti per nome
- **Filtri per categoria**: Visualizza solo prodotti di una categoria specifica
- **Filtro "Tutti"**: Mostra tutti i prodotti

### 📊 Statistiche e Analisi
- **Panoramica generale**: Totale prodotti, distribuzione frigo/freezer
- **Statistiche scadenze**: Prodotti scaduti, in scadenza, questa settimana
- **Analisi per categoria**: Conteggio e quantità per ogni categoria
- **Grafici visivi**: Barre di progresso per visualizzare la distribuzione

### 📤 Backup e Export
- **Backup JSON**: Esporta tutti i dati in formato JSON
- **Dati CSV**: Esporta in formato CSV per analisi esterne
- **Riepilogo testuale**: Genera un report dettagliato

### 🎨 Interfaccia Utente
- **Design moderno**: UI pulita e intuitiva
- **Colori per categoria**: Ogni categoria ha il suo colore distintivo
- **Icone emoji**: Identificazione visiva immediata
- **Indicatori scadenza**: Colori e icone per lo stato di scadenza
- **Navigazione a tab**: Frigo, Statistiche, Explore

## 🚀 Installazione e Avvio

### Prerequisiti
- Node.js (versione 18 o superiore)
- npm o yarn
- Expo CLI: `npm install -g @expo/cli`

### Setup
1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd freezer-app
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Avvia l'app**
   ```bash
   npx expo start
   ```

4. **Scegli come visualizzare l'app**:
   - **Expo Go**: Scansiona il QR code con l'app Expo Go
   - **Emulatore Android**: Premi 'a' nel terminale
   - **Simulatore iOS**: Premi 'i' nel terminale (solo su macOS)
   - **Web**: Premi 'w' nel terminale

## 📱 Struttura dell'App

```
app/
├── (tabs)/
│   ├── index.tsx      # Pagina principale (Frigo/Freezer)
│   ├── stats.tsx      # Pagina statistiche
│   └── explore.tsx    # Pagina explore
├── _layout.tsx        # Layout principale
└── modal.tsx          # Modal

components/            # Componenti riutilizzabili
hooks/                 # Hook personalizzati
├── useStorage.ts      # Gestione persistenza dati
└── use-color-scheme.ts

utils/                 # Utility
└── exportData.ts      # Funzioni di export

constants/             # Costanti
└── theme.ts           # Tema e colori
```

## 🛠️ Tecnologie Utilizzate

- **React Native**: Framework per app mobile
- **Expo**: Piattaforma di sviluppo
- **TypeScript**: Tipizzazione statica
- **Expo Router**: Navigazione basata su file
- **React Hooks**: Gestione stato e effetti
- **AsyncStorage**: Persistenza dati locale (preparato)

## 📋 Categorie Prodotti

| Categoria | Icona | Colore | Descrizione |
|-----------|-------|--------|-------------|
| Latticini | 🥛 | Giallo chiaro | Latte, yogurt, formaggi |
| Verdure | 🥬 | Verde chiaro | Insalata, verdure fresche |
| Carne | 🥩 | Rosso chiaro | Carne rossa, pollo, salumi |
| Pesce | 🐟 | Blu chiaro | Pesce fresco, filetti |
| Surgelati | ❄️ | Viola chiaro | Verdure surgelate, gelati |
| Bevande | 🥤 | Verde acqua | Bibite, succhi, acqua |
| Altro | 📦 | Grigio chiaro | Prodotti vari |

## ⏰ Indicatori Scadenza

| Stato | Icona | Colore | Descrizione |
|-------|-------|--------|-------------|
| Scaduto | ⚠️ | Rosso | Prodotto già scaduto |
| Scade oggi | 🚨 | Arancione | Scadenza oggi |
| Scade presto | ⏰ | Arancione | Entro 3 giorni |
| Questa settimana | ⏳ | Giallo | Entro 7 giorni |
| OK | ✅ | Verde | Più di 7 giorni |

## 🔧 Sviluppo

### Aggiungere nuove funzionalità
1. Crea i componenti in `components/`
2. Aggiungi hook personalizzati in `hooks/`
3. Utility in `utils/`
4. Aggiorna i tipi TypeScript se necessario

### Struttura dati
```typescript
type Item = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  category?: string;
  expiryDate?: string;
};
```

## 📄 Licenza

Questo progetto è open source e disponibile sotto licenza MIT.

## 🤝 Contributi

I contributi sono benvenuti! Per favore:
1. Fai un fork del progetto
2. Crea un branch per la tua feature
3. Committa le modifiche
4. Apri una Pull Request

## 📞 Supporto

Per domande o problemi, apri una issue su GitHub.

---

**Sviluppato con ❤️ usando React Native ed Expo**
