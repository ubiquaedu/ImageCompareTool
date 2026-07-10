# Guida alla Conversione in EXE (Electron)

Poiché sei in un ambiente web protetto, non puoi creare l'EXE direttamente qui.
Ecco i passaggi passo-passo per farlo sul tuo computer.

## 1. Scarica il Progetto
1. Clicca sul nome del progetto in alto a sinistra su Replit.
2. Clicca sui tre puntini o sull'icona menu.
3. Seleziona **"Download as Zip"**.
4. Estrai lo zip in una cartella sul tuo PC (es. `C:\Progetti\ImageDiffPro`).

## 2. Installa Node.js
Se non lo hai già, scarica e installa **Node.js** (versione LTS) dal sito ufficiale: `https://nodejs.org/`.

## 3. Prepara l'Ambiente Locale
1. Apri il terminale (Prompt dei Comandi o PowerShell).
2. Entra nella cartella del progetto:
   ```bash
   cd C:\Progetti\ImageDiffPro
   ```
3. Installa le dipendenze base:
   ```bash
   npm install
   ```
4. Installa Electron e i tool per creare l'EXE:
   ```bash
   npm install --save-dev electron electron-builder
   ```

## 4. Configura Electron
Ho già creato per te due file essenziali nella root del progetto:
- `electron-main.cjs`: Il cervello dell'app desktop (gestisce le finestre e i file).
- `electron-preload.cjs`: Il ponte sicuro tra interfaccia e sistema.

Devi solo modificare il file `package.json` (che trovi nella cartella scaricata) aggiungendo queste righe:

Apri `package.json` con un editor di testo (come Blocco Note o VS Code) e:

1. Modifica la riga `"main"` (o aggiungila se manca):
   ```json
   "main": "electron-main.cjs",
   ```

2. Aggiungi questo comando nella sezione `"scripts"`:
   ```json
   "electron": "electron .",
   "dist": "electron-builder"
   ```

3. Aggiungi la configurazione per la build alla fine del file (prima dell'ultima parentesi graffa `}`):
   ```json
   "build": {
     "appId": "com.imagediff.pro",
     "win": {
       "target": "nsis"
     },
     "files": [
       "dist/**/*",
       "electron-main.cjs",
       "electron-preload.cjs"
     ]
   }
   ```

## 5. Collega l'Interfaccia (Modifica Importante)
In un'app desktop reale, l'interfaccia deve "parlare" con Electron.
Nel file `client/src/pages/home.tsx`, dovresti sostituire la logica di `handleDeleteExact` con:

```javascript
const handleDeleteExact = async () => {
  // Verifica se siamo in Electron
  if (window.electronAPI) {
    // Chiama la funzione "ponte" che abbiamo definito in preload.js
    await window.electronAPI.deleteFile(percorsoFile);
  } else {
    alert("Siamo sul web, impossibile cancellare");
  }
};
```
*(Nota: Questo richiede che tu abbia i percorsi reali dei file, cosa che ottieni solo usando `window.electronAPI.selectFolder()` invece del normale `<input type="file">`)*.

## 6. Crea l'EXE
Una volta pronto, esegui questi comandi nel terminale:

1. Compila l'interfaccia React:
   ```bash
   npm run build
   ```
2. Crea l'EXE:
   ```bash
   npm run dist
   ```

Troverai il tuo file `ImageDiffPro.exe` nella cartella `dist` appena creata!
