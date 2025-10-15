# 🚀 Configurazione Google Drive Sync - Versione Reale

## 📋 Prerequisiti

1. **Account Google** con accesso a Google Cloud Console
2. **Progetto Expo** configurato
3. **Dispositivo Android/iOS** per test

## 🔧 Setup Google Cloud Console

### 1. Crea/Seleziona Progetto
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Annota il **Project ID**

### 2. Abilita API
1. Vai su "API e servizi" → "Libreria"
2. Cerca e abilita:
   - **Google Drive API**
   - **Google Sign-In API**

### 3. Configura OAuth 2.0

#### Per Applicazione Web (Obbligatorio):
1. Vai su "Credenziali" → "Crea credenziali" → "ID client OAuth 2.0"
2. Tipo: **Applicazione web**
3. Nome: "Freezer App Web Client"
4. URI di reindirizzamento autorizzati: `https://your-domain.com` (per web)
5. **Copia il "Client ID"** → Questo è il tuo `webClientId`

#### Per Android:
1. Tipo: **Applicazione Android**
2. Nome: "Freezer App Android"
3. Nome pacchetto: `com.elio.freezerapp` (dal tuo app.json)
4. Impronta SHA-1: 
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore
   # Password: android
   ```
5. **Copia il "Client ID"** → Questo è il tuo `androidClientId`

#### Per iOS:
1. Tipo: **Applicazione iOS**
2. Nome: "Freezer App iOS"
3. ID bundle: `com.elio.freezerapp`
4. **Copia il "Client ID"** → Questo è il tuo `iosClientId`

## 🔑 Configurazione App

### 1. Aggiorna Credenziali
Apri `config/googleCredentials.ts` e sostituisci:

```typescript
export const GOOGLE_CREDENTIALS = {
  webClientId: 'TUO_WEB_CLIENT_ID_QUI',
  androidClientId: 'TUO_ANDROID_CLIENT_ID_QUI',
  iosClientId: 'TUO_IOS_CLIENT_ID_QUI',
  hostedDomain: '', // Opzionale
};
```

### 2. Aggiorna app.json
Sostituisci `YOUR_IOS_CLIENT_ID` in `app.json` con il tuo iOS Client ID:

```json
[
  "@react-native-google-signin/google-signin",
  {
    "iosUrlScheme": "com.googleusercontent.apps.TUO_IOS_CLIENT_ID"
  }
]
```

### 3. Configurazione Android (se necessario)
Aggiungi in `android/app/src/main/res/values/strings.xml`:

```xml
<string name="server_client_id">TUO_WEB_CLIENT_ID</string>
```

## 🧪 Test della Configurazione

### 1. Build dell'App
```bash
# Per Android
npx expo run:android

# Per iOS
npx expo run:ios
```

### 2. Test Connessione
1. Apri l'app
2. Tocca "Sincronizza" nella home
3. Tocca "Connetti"
4. Autorizza l'app con Google
5. Verifica che appaia "Connesso"

### 3. Test Sincronizzazione
1. Aggiungi alcuni prodotti nel frigo
2. Tocca "Salva" per caricare su Google Drive
3. Su un altro dispositivo, tocca "Carica" per scaricare i dati
4. Verifica che i prodotti siano sincronizzati

## 🔒 Sicurezza e Privacy

### Dati Privati
- I dati sono salvati in `appDataFolder` (privato all'utente)
- Solo l'utente autorizzato può accedere ai dati
- Nessun server intermedio

### Permessi
- **Google Drive**: Solo accesso ai file dell'app
- **Nessun accesso** ai file personali dell'utente
- **Crittografia** in transito e a riposo

## 🚨 Risoluzione Problemi

### Errore "Invalid client"
- Verifica che il Web Client ID sia corretto
- Controlla che le API siano abilitate
- Assicurati che il progetto sia selezionato

### Errore "Access denied"
- Verifica che l'utente abbia autorizzato l'app
- Controlla che Google Drive API sia abilitata
- Prova a disconnettersi e riconnettersi

### Sincronizzazione non funziona
- Verifica la connessione internet
- Controlla che l'utente sia connesso a Google Drive
- Verifica i permessi dell'app

### Build fallisce
- Assicurati che tutte le credenziali siano configurate
- Controlla che app.json sia aggiornato
- Prova a pulire la cache: `npx expo start --clear`

## 📱 Utilizzo

### Prima Configurazione
1. **Apri l'app** e vai alla home
2. **Tocca "Sincronizza"** (tasto con icona cloud)
3. **Tocca "Connetti"** e autorizza Google Drive
4. **I dati si sincronizzano** automaticamente

### Sincronizzazione Automatica
- **File condiviso**: `freezer-app-sync.json` su Google Drive
- **Merge intelligente**: Combina frigo, freezer, credenza
- **Nessun duplicato**: Gestione automatica dei conflitti
- **Backup sicuro**: I dati locali vengono sempre preservati

### Condivisione Familiare
1. **Condividi il file** `freezer-app-sync.json` su Google Drive
2. **Ogni membro** autorizza l'app sul proprio dispositivo
3. **Sincronizzazione automatica** tra tutti i dispositivi

## 🎉 Funzionalità Complete

- ✅ **Autenticazione Google** reale
- ✅ **Upload/Download** da Google Drive
- ✅ **Sincronizzazione automatica**
- ✅ **Merge intelligente** dei dati
- ✅ **Gestione conflitti**
- ✅ **Backup sicuro**
- ✅ **Condivisione familiare**
- ✅ **UI completa** con stati e errori

Ora la tua app ha una sincronizzazione Google Drive completamente funzionale! 🚀✨
