# GammaLab: Esplorazione Interattiva dell'Universo ai Raggi Gamma

## 1. Introduzione e Obiettivi del Progetto

**GammaLab** è una piattaforma web educativa progettata per introdurre studenti e appassionati al mondo dell'astrofisica delle alte energie, con un focus specifico sull'astronomia dei raggi gamma e sui telescopi Cherenkov (IACT - *Imaging Atmospheric Cherenkov Telescopes*).

L'obiettivo principale del progetto è rendere accessibili e comprensibili concetti fisici complessi – come l'effetto Cherenkov, gli sciami atmosferici e l'analisi dati astrofisica – attraverso l'uso di simulazioni interattive in tempo reale. A differenza dei tradizionali materiali didattici statici, GammaLab permette all'utente di "sperimentare" la fisica, osservando direttamente come i raggi gamma provenienti dalle profondità del cosmo vengono rilevati e analizzati dagli strumenti scientifici moderni.

Il progetto nasce dalla volontà di colmare il divario tra la ricerca scientifica di frontiera (come quella condotta dagli osservatori CTA, MAGIC, H.E.S.S.) e la didattica scolastica, offrendo uno strumento che sia scientificamente accurato ma intuitivo e coinvolgente.

## 2. Descrizione Funzionale del Prodotto

Il cuore di GammaLab è un motore di simulazione scritto in JavaScript che riproduce la fisica di rilevazione dei raggi gamma. L'esperienza utente è strutturata in diversi moduli tematici:

### 2.1 Il Simulatore IACT
Ogni pagina tematica ospita un simulatore che riproduce il funzionamento di un array di telescopi Cherenkov. Il sistema visualizza:
- **L'arrivo dei fotoni**: Simulazione visiva della luce Cherenkov prodotta dagli sciami di particelle in atmosfera.
- **Le Camere dei Telescopi**: Visualizzazione di tre telescopi in configurazione stereoscopica che catturano l'evento da diverse angolazioni.
- **Analisi in Tempo Reale**: Calcolo istantaneo dei **Parametri di Hillas** (Length, Width, Size, Alpha), fondamentali per distinguere i raggi gamma dal rumore di fondo (raggi cosmici adronici).
- **Ricostruzione Stereoscopica**: Un algoritmo geometrico ricostruisce la direzione di provenienza della sorgente incrociando i dati dei tre telescopi.

### 2.2 Percorsi Tematici e Sorgenti
Il sito guida l'utente attraverso sei scenari astrofisici distinti, ognuno con caratteristiche uniche simulate dal software:
1.  **Crab Nebula**: La "candela standard" dell'astronomia gamma, utilizzata per calibrare gli strumenti.
2.  **Resti di Supernova (SNR)**: Analisi dei "PeVatrons", gli acceleratori di particelle naturali della nostra galassia.
3.  **Blazars (AGN)**: Studio dei getti relativistici emessi da buchi neri supermassicci lontani.
4.  **Gamma Ray Bursts (GRB)**: Simulazione di eventi esplosivi transitori ed estremamente energetici.
5.  **Centro Galattico**: Osservazione di una regione complessa e densa di sorgenti.
6.  **Background Adronico**: Un modulo educativo cruciale per comprendere come gli scienziati filtrano il "rumore" causato dai protoni (raggi cosmici) per isolare il segnale gamma.

### 2.3 Gamification e Verifica
Per rafforzare l'apprendimento, è stato integrato un sistema di **Quiz Interattivo**. Questa sezione mette alla prova le conoscenze acquisite dall'utente sui parametri di Hillas e sulla fisica delle sorgenti, fornendo feedback immediati e punteggi, trasformando l'apprendimento in una sfida stimolante.

## 3. Aspetti Tecnici e Innovazione

GammaLab è stato sviluppato come una **Single Page Application (SPA)** progressiva, utilizzando tecnologie web standard per garantire la massima compatibilità e accessibilità.

- **Tecnologie Utilizzate**: HTML5 semantico, CSS3 avanzato (con variabili CSS per temi e layout responsive) e JavaScript ES6+.
- **Rendering Grafico**: L'uso delle **Canvas API** di HTML5 permette di gestire animazioni fluide di migliaia di particelle (fotoni) senza appesantire il browser, garantendo prestazioni elevate anche su dispositivi meno potenti.
- **Architettura Software**: Il codice è modulare, separando la logica di simulazione (`core-simulation.js`), la visualizzazione (`visualization.js`) e l'analisi dati (`hillas-analysis.js`). Questo approccio rende il progetto facilmente estendibile con nuove sorgenti o funzionalità.
- **Design Responsivo**: L'interfaccia si adatta automaticamente a schermi di diverse dimensioni, dai desktop agli smartphone, rendendo la scienza accessibile ovunque.

## 4. Valore Didattico

Il valore distintivo di GammaLab risiede nel suo approccio "learning by doing". Invece di leggere passivamente, gli studenti:
- **Visualizzano l'invisibile**: Vedono concetti astratti come gli sciami elettromagnetici prendere forma.
- **Analizzano dati**: Prendono confidenza con concetti statistici e geometrici reali usati nella ricerca.
- **Esplorano l'Universo**: Acquisiscono familiarità con gli oggetti più estremi del cosmo.

In conclusione, GammaLab non è solo un sito web, ma un laboratorio virtuale che porta la complessità della fisica delle astroparticelle direttamente nelle mani degli studenti, stimolando la curiosità scientifica e il pensiero critico.
