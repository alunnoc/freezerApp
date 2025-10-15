// Configurazione credenziali Google Drive
// IMPORTANTE: Sostituisci con le tue credenziali da Google Cloud Console

export const GOOGLE_CREDENTIALS = {
  // Web Client ID da Google Cloud Console
  webClientId: 'YOUR_WEB_CLIENT_ID_HERE',
  
  // Configurazione per Android (opzionale)
  androidClientId: 'YOUR_ANDROID_CLIENT_ID_HERE',
  
  // Configurazione per iOS (opzionale)
  iosClientId: 'YOUR_IOS_CLIENT_ID_HERE',
  
  // Dominio ospitato (opzionale)
  hostedDomain: '',
};

// Istruzioni per ottenere le credenziali:
/*
1. Vai su Google Cloud Console (https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita le API:
   - Google Drive API
   - Google Sign-In API
4. Vai su "Credenziali" → "Crea credenziali" → "ID client OAuth 2.0"
5. Crea credenziali per:
   - Applicazione web (per Web Client ID)
   - Applicazione Android (per Android Client ID)
   - Applicazione iOS (per iOS Client ID)
6. Copia gli ID e sostituisci i valori sopra
*/
