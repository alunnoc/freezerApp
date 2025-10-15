# Configurazione Google Drive Sync

## 🚀 Setup Iniziale

### 1. Google Cloud Console
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita le seguenti API:
   - **Google Drive API**
   - **Google Sign-In API**

### 2. Configurazione OAuth 2.0

#### Per Android:
1. Vai su "Credenziali" → "Crea credenziali" → "ID client OAuth 2.0"
2. Tipo: **Applicazione Android**
3. Nome pacchetto: `com.yourcompany.freezerapp`
4. Impronta SHA-1: 
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore
   # Password: android
   ```

#### Per iOS:
1. Tipo: **Applicazione iOS**
2. Nome pacchetto: `com.yourcompany.freezerapp`
3. ID bundle: `com.yourcompany.freezerapp`

#### Per Web (necessario per React Native):
1. Tipo: **Applicazione web**
2. Nome: "Freezer App Web Client"
3. URI di reindirizzamento: `https://your-domain.com`

### 3. Configurazione App

1. Copia il **Web Client ID** dalle credenziali create
2. Apri `config/googleSignin.ts`
3. Sostituisci `YOUR_WEB_CLIENT_ID_HERE` con il tuo Web Client ID

### 4. Installazione Dipendenze

```bash
npm install @react-native-google-signin/google-signin @robinbobin/react-native-google-drive-api-wrapper
```

### 5. Configurazione Android

Aggiungi in `android/app/src/main/res/values/strings.xml`:
```xml
<string name="server_client_id">YOUR_WEB_CLIENT_ID</string>
```

### 6. Configurazione iOS

Aggiungi in `ios/YourApp/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>REVERSED_CLIENT_ID</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>YOUR_REVERSED_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

## 🔧 Funzionalità

### Sincronizzazione
- **Automatica**: I dati si sincronizzano quando l'app viene aperta
- **Manuale**: Tasto "Sincronizza" per forzare la sincronizzazione
- **Merge intelligente**: Combina i dati di più dispositivi senza perdere informazioni

### Condivisione
- **File condiviso**: Un file `freezer-app-sync.json` su Google Drive
- **Accesso**: Solo l'utente che ha autorizzato l'app
- **Sicurezza**: I dati sono privati e crittografati

### Conflitti
- **Risoluzione automatica**: L'ultima modifica vince
- **Merge**: I prodotti vengono combinati senza duplicati
- **Backup**: I dati locali vengono sempre preservati

## 📱 Utilizzo

1. **Prima configurazione**:
   - Apri l'app
   - Tocca "Sincronizza" nella home
   - Tocca "Connetti" e autorizza Google Drive

2. **Sincronizzazione**:
   - I dati si sincronizzano automaticamente
   - Usa "Sincronizza" per forzare l'aggiornamento
   - Usa "Salva" per caricare i dati locali su Drive
   - Usa "Carica" per scaricare i dati da Drive

3. **Condivisione con famiglia**:
   - Condividi il file `freezer-app-sync.json` su Google Drive
   - Ogni membro della famiglia autorizza l'app
   - I dati si sincronizzano automaticamente

## 🛠️ Risoluzione Problemi

### Errore "Invalid client"
- Verifica che il Web Client ID sia corretto
- Controlla che le API siano abilitate

### Errore "Access denied"
- Verifica che l'utente abbia autorizzato l'app
- Controlla che Google Drive API sia abilitata

### Sincronizzazione non funziona
- Verifica la connessione internet
- Controlla che l'utente sia connesso a Google Drive
- Prova a disconnettersi e riconnettersi

## 🔒 Sicurezza

- **Dati privati**: Solo l'utente autorizzato può accedere ai dati
- **Crittografia**: I dati sono crittografati in transito e a riposo
- **Nessun server**: I dati passano solo attraverso Google Drive
- **Controllo locale**: L'utente mantiene sempre il controllo dei propri dati
