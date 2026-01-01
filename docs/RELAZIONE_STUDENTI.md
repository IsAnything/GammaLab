# GammaLab: Il Nostro Viaggio nell'Universo dei Raggi Gamma

**Progetto realizzato dalla Classe [Inserire Classe]**

## 1. L'Idea: Perché GammaLab?

Quando abbiamo deciso di partecipare a questo concorso, volevamo creare qualcosa che non fosse solo una semplice ricerca scolastica, ma uno strumento "vivo". A scuola studiamo la fisica sui libri, ma spesso ci manca il contatto con la scienza di frontiera, quella che si fa oggi nei grandi osservatori internazionali.

Così è nato **GammaLab**. Ci siamo chiesti: "Come fanno gli scienziati a 'vedere' i raggi gamma di altissima energia (VHE) se sono invisibili ai nostri occhi?". La risposta ci ha affascinato: usano l'atmosfera come un calorimetro naturale e telescopi che catturano lampi di luce bluastra (luce Cherenkov) che durano pochi nanosecondi.

Il nostro obiettivo era ambizioso: **costruire un laboratorio virtuale** che permettesse a chiunque, anche ai nostri compagni di altre classi, di sedersi alla console di controllo di un array di telescopi Cherenkov (IACT) e capire, provando con mano, come si fa astrofisica delle alte energie.

## 2. Cosa Abbiamo Realizzato

Il cuore del nostro progetto è un sito web interattivo che simula, in tempo reale, la risposta di un telescopio Cherenkov quando un raggio gamma colpisce l'atmosfera terrestre. Non volevamo usare video preregistrati, così abbiamo programmato un motore di simulazione procedurale (ispirato ai metodi Monte Carlo) che genera eventi casuali sempre diversi.

### Il Simulatore
Abbiamo lavorato sodo per ricreare l'esperienza di un vero osservatorio:
*   **Vedere l'invisibile**: Abbiamo programmato il sistema per simulare i fotoni ultravioletti (luce Cherenkov) che arrivano al rivelatore, riproducendo fedelmente l'immagine pixelizzata che questi formano sulla telecamera.
*   **Stereoscopia**: Abbiamo capito che un solo telescopio non basta. Nel nostro simulatore ce ne sono tre! Abbiamo implementato un algoritmo geometrico che calcola la direzione di arrivo (Sorgente) intersecando gli assi maggiori delle ellissi rilevate dai diversi telescopi.
*   **Analisi Dati**: Questa è la parte di cui andiamo più fieri. Il nostro codice calcola in tempo reale i "Parametri di Hillas" (Width, Length, Alpha). È stato difficile capire la matematica dei momenti statistici, ma ora vedere quelle ellissi che parametrizzano lo sciame ci dà grande soddisfazione.

### Le Nostre Tappe Spaziali
Abbiamo creato diverse pagine, ognuna dedicata a un oggetto celeste che ci ha colpito:
1.  La **Crab Nebula**, che abbiamo imparato essere il "faro" di riferimento per tutti gli astronomi.
2.  I **Resti di Supernova**, dove le particelle vengono accelerate a velocità incredibili.
3.  I **Blazar** e i **GRB**, i mostri energetici dell'universo.
4.  Il **Centro Galattico**, un posto caotico e affascinante.
5.  Infine, il **Background Adronico**: abbiamo voluto inserire anche il "rumore" di fondo, perché abbiamo imparato che la vera sfida per gli scienziati è distinguere il segnale utile dal caos dei raggi cosmici.

Per rendere tutto più divertente, abbiamo aggiunto un **Quiz Finale** per sfidare gli utenti a vedere quanto hanno imparato.

## 3. Come lo Abbiamo Costruito (La Parte Tecnica)

Per realizzare GammaLab ci siamo messi alla prova come programmatori web. Abbiamo scelto di non usare piattaforme già pronte, ma di scrivere il codice nativo usando **HTML5, CSS3 e JavaScript (ES6+)**.

La sfida più grande è stata la grafica. Volevamo che le animazioni fossero fluide, gestendo centinaia di particelle contemporaneamente. Abbiamo utilizzato le **Canvas API** per il rendering grafico. Sebbene le API stesse forniscano oggetti per disegnare, operano in "Immediate Mode" (disegnano pixel e non mantengono memoria degli oggetti). Per gestire la complessità, abbiamo quindi strutturato il nostro codice applicativo con la **Programmazione a Oggetti (OOP)**: abbiamo creato classi per le entità del simulatore (Telescopi, Fotoni, Sorgenti) che mantengono il proprio stato e si ridisegnano ad ogni ciclo di 
equestAnimationFrame.

Abbiamo anche curato molto il design (Responsive Design), assicurandoci che il sito fosse bello da vedere e facile da navigare sia da PC che da smartphone.

### 3.1 Sotto il Cofano: Algoritmi e Matematica
Volevamo che la simulazione fosse il più realistica possibile, quindi abbiamo implementato alcuni concetti avanzati:
*   **Image Cleaning**: Prima di analizzare le immagini, il nostro codice applica un filtro per rimuovere i pixel con pochi fotoni, simulando la pulizia del segnale dal rumore del cielo notturno, proprio come nei veri telescopi.
*   **Matematica Avanzata**: Per calcolare l'orientamento dello sciame, abbiamo utilizzato l'algebra lineare. Il codice costruisce la "matrice dei momenti" della distribuzione di luce e la diagonalizza per trovare gli assi principali dell'ellisse.
*   **Heatmap Energetica**: Abbiamo creato una palette di colori dinamica (tramite variabili CSS) che cambia in base all'energia dei fotoni: dal blu per le basse energie fino al bianco/rosso per quelle più intense, creando una vera mappa termica dello sciame.
*   **Parallasse Stereoscopica**: La visione 3D non è un trucco grafico. Abbiamo calcolato la posizione delle immagini su ogni telescopio applicando il corretto offset geometrico (parallasse) basato sulla posizione reale dei telescopi nell'array.

## 4. Cosa Abbiamo Imparato

Lavorare a GammaLab ci ha insegnato tantissimo.
Da un lato c'è la **fisica**: ora concetti come "sciame elettromagnetico" o "radiazione Cherenkov" non sono più parole astratte per noi, ma fenomeni che abbiamo visualizzato e modellato.
Dall'altro c'è il **lavoro di squadra e la tecnica**: abbiamo imparato a dividerci i compiti, a risolvere bug che sembravano impossibili e a trasformare formule matematiche in codice funzionante.

Speriamo che GammaLab possa trasmettere agli altri la stessa curiosità e meraviglia che abbiamo provato noi nel realizzarlo. Non è solo un sito web, è il nostro modo di guardare il cielo con occhi nuovi.
