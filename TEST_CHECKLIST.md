# 🧪 GAMMALAB - Test Plan & Checklist

## 📋 Test Completi da Eseguire

### ✅ 1. NAVIGAZIONE E STRUTTURA

#### Homepage (homepage.html)
- [ ] Titolo e sottotitolo visibili
- [ ] Menu navigazione con 10 link funzionanti
- [ ] Tabella parametri Hillas formattata correttamente
- [ ] CTA buttons (Introduzione, Simula Crab, Vai al Quiz) funzionanti
- [ ] Footer presente

#### Menu Navigazione (tutte le pagine)
- [ ] Link Home → homepage.html
- [ ] Link Introduzione → intro-cherenkov.html
- [ ] Link Crab Nebula → crab-nebula.html
- [ ] Link Resti di Supernova → supernova-remnants.html
- [ ] Link Blazar → blazars.html
- [ ] Link GRB → grb.html
- [ ] Link Centro Galattico → galactic-center.html
- [ ] Link Confronto → comparison.html
- [ ] Link Background Adronico → hadronic-background.html
- [ ] Link Quiz → quiz.html
- [ ] Highlight attivo sulla pagina corrente

---

### ✅ 2. PAGINE EDUCATIVE

#### Intro Cherenkov (intro-cherenkov.html)
- [ ] Contenuto educativo completo e leggibile
- [ ] Tabella osservatori IACT (H.E.S.S., MAGIC, VERITAS, CTA)
- [ ] Descrizione parametri Hillas chiara
- [ ] Links a altre pagine funzionanti

#### Comparison (comparison.html)
- [ ] Tabella comparativa principale con 6 sorgenti
- [ ] Parametri in gradi E pixel visibili
- [ ] Decision tree ben formattato
- [ ] 4 esempi pratici completi
- [ ] Firme chiave evidenziate

#### Hadronic Background (hadronic-background.html)
- [ ] Tabelle confronto gamma vs hadron
- [ ] Metodi di reiezione spiegati
- [ ] Performance metrics visualizzate
- [ ] Quality Factor descritto

---

### ✅ 3. SIMULATORI (6 Sorgenti)

#### Test per OGNI sorgente (Crab, PeVatron, Blazar, GRB, GC, Hadron):

**Generazione Evento:**
- [ ] Bottone "Genera Evento [Nome]" presente e cliccabile
- [ ] Click genera evento senza errori console
- [ ] 3 canvas camere si riempiono con tracce colorate
- [ ] Tracce visibili con gradiente colori (Blu → Bianco)
- [ ] Legenda energia presente su Camera 1
- [ ] Info Camera e Energia visibili

**Parametri Hillas:**
- [ ] Overlay con ellisse verde su ogni camera
- [ ] Assi principali (giallo) visibili
- [ ] Centro di gravità (rosso) marcato
- [ ] Linea Alpha (blu tratteggiata) verso centro
- [ ] Pannello parametri popolato con valori
- [ ] Valori Length, Width, Size, Alpha, L/W, Miss presenti
- [ ] Parametri in range corretto per la sorgente

**Ricostruzione Stereoscopica:**
- [ ] Canvas "stereo" mostra direzioni da 3 camere
- [ ] 3 linee colorate (rosso, verde, blu) visibili
- [ ] Punto di intersezione al centro
- [ ] Coerenza % calcolata e mostrata
- [ ] Info numero camere presente

**Analisi Stereoscopica:**
- [ ] Sezione con coerenza inter-camera
- [ ] Coerenza colorata (verde >90%, giallo >80%, rosso <80%)
- [ ] Tabella media parametri
- [ ] Tabella varianza parametri
- [ ] Messaggio interpretazione coerenza

**Bottone Clear:**
- [ ] Bottone "Pulisci Canvas" funzionante
- [ ] Clear rimuove tutte le tracce
- [ ] Clear azzera pannello parametri
- [ ] Messaggio placeholder appare

#### Test Parametri Specifici Sorgente:

**Crab Nebula:**
- [ ] Length ~ 20-30 px
- [ ] Width ~ 5-10 px
- [ ] Size ~ 800-1200 p.e.
- [ ] Alpha ~ 0-5°
- [ ] L/W ~ 2.5-4.0
- [ ] Coerenza > 90%

**PeVatron:**
- [ ] Length ~ 30-50 px
- [ ] Width ~ 10-20 px
- [ ] Size > 2000 p.e. (ALTO!)
- [ ] Alpha ~ 5-20° (disperso)
- [ ] L/W ~ 2.0-3.5
- [ ] Coerenza ~ 85-90%

**Blazar:**
- [ ] Length ~ 10-20 px (COMPATTO)
- [ ] Width ~ 4-7 px (STRETTO)
- [ ] Size ~ 1000-1500 p.e.
- [ ] Alpha ~ 0-3° (molto concentrato)
- [ ] L/W ~ 2.5-4.5 (ALTO)
- [ ] Coerenza > 90%

**GRB:**
- [ ] Length ~ 10-20 px
- [ ] Width ~ 5-10 px
- [ ] Size ~ 1200-2000 p.e.
- [ ] Alpha ~ 0-5°
- [ ] L/W ~ 1.5-2.5 (BASSO)
- [ ] Coerenza ~ 85-92%

**Centro Galattico:**
- [ ] Length ~ 20-40 px
- [ ] Width ~ 10-20 px
- [ ] Size ~ 1500-2200 p.e.
- [ ] Alpha ~ 3-15° (DISPERSO ~8°)
- [ ] L/W ~ 1.8-2.5
- [ ] Coerenza ~ 75-85% (PIÙ BASSA)

**Hadron Background:**
- [ ] Length ~ 25-45 px
- [ ] Width ~ 15-30 px (LARGO! ~22px)
- [ ] Size ~ 500-3000 p.e. (variabile)
- [ ] Alpha ~ 0-90° (UNIFORME)
- [ ] L/W ~ 1.2-2.5 (MINIMO ~1.6)
- [ ] Coerenza ~ 60-75% (BASSA)

---

### ✅ 4. QUIZ ENGINE

#### Start Screen:
- [ ] Titolo "Quiz: Identifica la Sorgente" presente
- [ ] Spiegazione regole completa
- [ ] Sistema punteggio descritto (100/70/40/20 pts)
- [ ] 6 card sorgenti preview visibili con emoji
- [ ] Bottone "Inizia Quiz" verde e cliccabile
- [ ] Link a pagina Comparison funzionante

#### Quiz Screen (al click "Inizia Quiz"):
- [ ] Start screen nascosto
- [ ] Quiz screen visibile
- [ ] Counter domanda mostra "1/10"
- [ ] Timer mostra "60"
- [ ] Score mostra "0"
- [ ] Streak mostra "0"

#### Generazione Domanda:
- [ ] 3 canvas si riempiono con evento random
- [ ] Tracce colorate visibili
- [ ] Overlay Hillas su ogni camera
- [ ] Pannello parametri Hillas popolato
- [ ] Parametri per ogni camera mostrati
- [ ] Media stereoscopica calcolata e mostrata
- [ ] Timer inizia countdown da 60

#### Timer:
- [ ] Countdown decrementa ogni secondo
- [ ] Timer diventa rosso sotto 10 secondi
- [ ] Timer si ferma al submit risposta
- [ ] Timeout automatico a 0 secondi
- [ ] Al timeout: risposta corretta evidenziata, bottoni disabilitati

#### Bottoni Risposta (6 opzioni):
- [ ] 6 bottoni visibili: Crab, PeVatron, Blazar, GRB, GC, Hadron
- [ ] Bottoni cliccabili durante domanda
- [ ] Click disabilita tutti i bottoni
- [ ] Risposta corretta → bottone verde
- [ ] Risposta sbagliata → bottone rosso + corretto verde
- [ ] Bottoni disabilitati dopo risposta

#### Sistema Hints (3 livelli):
- [ ] **Hint 1** abilitato all'inizio
- [ ] Click Hint 1: panel mostra info Size, penalità -30 pts
- [ ] Hint 1 disabilitato dopo click
- [ ] Hint 2 abilitato dopo Hint 1
- [ ] Click Hint 2: panel mostra info Alpha, penalità -30 pts
- [ ] Hint 2 disabilitato dopo click
- [ ] Hint 3 abilitato dopo Hint 2
- [ ] Click Hint 3: panel mostra info Length/Width, penalità -20 pts
- [ ] Hint 3 disabilitato dopo click
- [ ] Hints educativi e ben formattati

#### Feedback (dopo risposta):
- [ ] Panel feedback appare
- [ ] **Se corretto**: Titolo verde "✅ Corretto!", breakdown punti
- [ ] **Se sbagliato**: Titolo rosso "❌ Sbagliato", confronto risposte
- [ ] **Se timeout**: Titolo arancione "⏰ Tempo Scaduto!"
- [ ] Note educative sulla sorgente corretta
- [ ] Parametri osservati mostrati
- [ ] Spiegazione firma distintiva
- [ ] Bottone "Prossima Domanda" visibile e funzionante

#### Scoring:
- [ ] **Risposta corretta senza hints**: +100 pts
- [ ] **Con 1 hint**: +70 pts
- [ ] **Con 2 hints**: +40 pts
- [ ] **Con 3 hints**: +20 pts
- [ ] **Streak bonus**: +10 per risposta consecutiva (max +50)
- [ ] Score aggiornato dopo ogni risposta
- [ ] Streak incrementa su corretto, reset su sbagliato
- [ ] Display score e streak aggiornati in real-time

#### Progressione Quiz:
- [ ] Click "Prossima Domanda" genera domanda 2
- [ ] Counter aggiornato "2/10"
- [ ] Hints resettati (solo 1 abilitato)
- [ ] Timer resettato a 60
- [ ] Nuova sorgente random generata
- [ ] Processo ripetuto per tutte 10 domande

#### Results Screen (dopo domanda 10):
- [ ] Quiz screen nascosto
- [ ] Results screen visibile
- [ ] **Score finale** grande e centrato
- [ ] **Performance rating** con emoji e colore:
  - [ ] ≥900: 🏆 Eccellente (oro)
  - [ ] ≥700: 🌟 Ottimo (verde)
  - [ ] ≥500: 👍 Buono (blu)
  - [ ] ≥300: 📚 Sufficiente (arancione)
  - [ ] <300: 💪 Riprova (rosso)
- [ ] Messaggio rating appropriato

#### Statistiche Finali:
- [ ] **Risposte corrette**: N/10
- [ ] **Accuracy**: percentuale corretta
- [ ] **Max streak**: valore corretto
- [ ] **Hints usati**: conteggio totale
- [ ] **Tempo medio**: secondi per risposta

#### Breakdown per Sorgente:
- [ ] Lista 6 sorgenti con statistiche individuali
- [ ] Per ogni sorgente: tentativi e correct/attempts
- [ ] Barra progresso colorata (verde/giallo/rosso)
- [ ] Solo sorgenti con tentativi >0 mostrate con dati

#### Bottoni Finali:
- [ ] **Riprova Quiz**: reload pagina, quiz ricomincia
- [ ] **Rivedi Confronto**: redirect a comparison.html

---

### ✅ 5. PALETTE COLORI ENERGETICA

#### Verifica Gradiente (su ogni simulatore):
- [ ] Fotoni bassi energia (~50-200 GeV): BLU scuro
- [ ] Fotoni medi energia (~1-5 TeV): CYAN/VERDE
- [ ] Fotoni alti energia (~10-30 TeV): GIALLO/ARANCIONE
- [ ] Fotoni altissimi energia (~50 TeV): ROSSO/BIANCO
- [ ] Gradiente fluido senza salti di colore
- [ ] Legenda energia mostra gradiente corretto
- [ ] Etichette legenda: 50 GeV, 1 TeV, 10 TeV, 50 TeV

---

### ✅ 6. RESPONSIVE DESIGN

#### Test su diverse risoluzioni:
- [ ] **Desktop (>1024px)**: Layout a 3 colonne, tutto visibile
- [ ] **Tablet (768-1024px)**: Layout adattato, menu leggibile
- [ ] **Mobile (375-768px)**: Layout singola colonna, canvas ridotti
- [ ] Canvas non overflow orizzontalmente
- [ ] Testo leggibile su tutte le risoluzioni
- [ ] Bottoni accessibili e cliccabili
- [ ] Menu navigazione collassabile o scrollabile

---

### ✅ 7. PERFORMANCE

#### Caricamento Pagine:
- [ ] Homepage carica <2 secondi
- [ ] Pagine simulatori caricano <3 secondi
- [ ] Quiz carica <3 secondi
- [ ] Nessun flash of unstyled content (FOUC)

#### Simulatori:
- [ ] Generazione evento <1 secondo
- [ ] Rendering canvas fluido (no lag)
- [ ] Multipli eventi consecutivi senza rallentamenti
- [ ] Clear canvas istantaneo

#### Quiz:
- [ ] Generazione domanda <1.5 secondi
- [ ] Timer countdown fluido (esattamente 1s per step)
- [ ] Transizione domande fluida
- [ ] Nessun memory leak (10 domande senza rallentamenti)

---

### ✅ 8. CONSOLE ERRORS

#### Verifica Console Browser (F12):
- [ ] Nessun errore JavaScript
- [ ] Nessun warning critico
- [ ] Tutti i moduli caricano correttamente
- [ ] Nessun 404 su risorse (CSS, JS, immagini)
- [ ] Log informativi presenti (✅ inizializzazioni)

#### Test su ogni pagina:
- [ ] homepage.html: 0 errori
- [ ] intro-cherenkov.html: 0 errori
- [ ] crab-nebula.html: 0 errori
- [ ] supernova-remnants.html: 0 errori
- [ ] blazars.html: 0 errori
- [ ] grb.html: 0 errori
- [ ] galactic-center.html: 0 errori
- [ ] comparison.html: 0 errori
- [ ] hadronic-background.html: 0 errori
- [ ] quiz.html: 0 errori

---

### ✅ 9. FISICA E ACCURATEZZA

#### Parametri Hillas:
- [ ] Conversione 1° = 100 pixel corretta
- [ ] Length/Width in range fisico (0.05-1.0°)
- [ ] Size in range realistico (100-5000 p.e.)
- [ ] Alpha in range [0, 90°]
- [ ] L/W ratio > 1 (sempre)
- [ ] Coerenza stereoscopica [0, 100%]

#### Spettro Energetico:
- [ ] Distribuzione energie segue legge di potenza E^-Γ
- [ ] Gamma spettrale corretto per sorgente (2.2-2.7)
- [ ] Range energetico 50 GeV - 50 TeV
- [ ] PeVatron raggiunge energie >10 TeV più spesso

#### Morfologia Tracce:
- [ ] Tracce ellittiche (non circolari)
- [ ] Orientazione random
- [ ] Asimmetria presente (shift lungo asse maggiore)
- [ ] Numero fotoni proporzionale a Size
- [ ] Distribuzione gaussiana 2D

---

### ✅ 10. CONTENUTI EDUCATIVI

#### Testi Italiani:
- [ ] Nessun testo in inglese nelle UI
- [ ] Terminologia tecnica corretta
- [ ] Grammatica e punteggiatura corrette
- [ ] Acronimi spiegati (IACT, PWN, AGN, SNR, GRB, etc.)

#### Informazioni Scientifiche:
- [ ] Dati astrofisici accurati (distanze, età, luminosità)
- [ ] Osservatori reali citati (H.E.S.S., MAGIC, VERITAS, CTA)
- [ ] Eventi storici corretti (GRB 190114C, GRB 221009A)
- [ ] Riferimenti a missioni (Fermi-LAT, IceCube, EHT)

---

## 🎯 PRIORITÀ TEST

### 🔴 ALTA PRIORITÀ (Blockers):
1. Simulatori generano eventi senza errori
2. Quiz engine si inizializza correttamente
3. Timer countdown funziona
4. Scoring calcola punti correttamente
5. Navigazione tra pagine funzionante

### 🟡 MEDIA PRIORITÀ (Important):
1. Parametri Hillas in range corretto
2. Hints educativi ben formattati
3. Feedback dettagliato e accurato
4. Palette colori energetica corretta
5. Coerenza stereoscopica calcolata

### 🟢 BASSA PRIORITÀ (Nice to have):
1. Performance ottimali (<1s)
2. Responsive perfetto su tutte risoluzioni
3. Animazioni fluide
4. Testi privi di typo
5. Polish UI/UX

---

## 📝 RISULTATI TEST

### Test Eseguito: [DATA]
**Tester**: _____________________

**Browser**: Chrome / Firefox / Edge / Safari (circonda)
**Risoluzione**: _____________________
**Sistema Operativo**: _____________________

### Issues Trovati:

#### Issue 1:
- **Pagina**: _____________________
- **Descrizione**: _____________________
- **Gravità**: Alta / Media / Bassa
- **Riproducibile**: Sì / No

#### Issue 2:
[... aggiungi altri issues ...]

---

## ✅ SIGN-OFF

Tutti i test critici sono passati e l'applicazione è pronta per il rilascio:

**Firma Tester**: _____________________
**Data**: _____________________

---

**Note**: Questa checklist copre tutte le funzionalità implementate nelle Settimane 1-6. 
Usa questo documento per test sistematici prima del rilascio finale.
