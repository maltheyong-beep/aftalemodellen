# Aftalemodellen — læring og fremlæggelse

En dansk, interaktiv øveside til erhvervsjura med fremlæggelsesvisning. Ren HTML, CSS og JavaScript — uden frameworks, build-step, eksterne billeder, skrifter eller backend.

## Filer

- `index.html`: semantisk struktur og undervisningsindhold.
- `style.css`: mobilvenligt design, lyst/mørkt tema og animationer.
- `script.js`: tidslinje, 28 flashcards, quiz med 15 spørgsmål, tegning, byggetilstand, oplæsning, SVG/PNG, fremlæggelse, lokal lagring og offline-cache.
- `README.md`: denne vejledning.

## Åbn lokalt og offline

Læg de fire filer i samme mappe. Åbn `index.html` i en moderne browser. Der skal ikke installeres noget. Filerne må ikke omdøbes, og de relative stier skal bevares.

Alle øvelser, SVG-grafikken, PNG-eksporten og fremlæggelsesvisningen kan bruges uden internet fra de downloadede filer. Oplæsning afhænger af enhedens stemmer; en lokal dansk stemme kan bruges offline, mens visse andre stemmer kræver internet. På GitHub Pages gemmer siden også de tre webfiler i browserens offline-cache efter det første onlinebesøg, hvis browseren tillader service workers. Vent på teksten **Offline klar** nederst. Derefter kan siden genåbnes offline i samme browser. Privat browsing og browserens rydning af webstedsdata kan begrænse både cache og gemt fremgang.

## Klar til at fremlægge

1. Åbn **Modellen på ét billede**, og følg tallene fra 1 til 7. Tryk på billedet for en stor visning. Brug +/− og rul på telefonen; **Tilpas** viser hele modellen.
2. **Download som billede (PNG)** laver et skarpt billede på 2200 × 2200 pixels med lys baggrund. Et ekstra downloadlink vises, hvis telefonen ikke henter automatisk.
3. **Print/gem som PDF** åbner browserens printdialog med kun den lyse model. Vælg **Gem som PDF** som destination. Der oprettes ikke en PDF på en server.
4. **Fremlæg** åbner 12 store punkter: indledning, hel model, de syv trin, regeltyper, huskeregler og snydeseddel. Brug knapperne, ←/→ eller Page Up/Page Down. Home/End går til første/sidste punkt. Escape afslutter. Ingen automatisk afspilning.
5. **Snydeseddel** samler rækkefølgen, de to øjeblikke, binding, regeltyper og acceptfrist. Visningen tilpasser sig skærmen; meget små skærme kan rulles.

På browsere, der understøtter det, kan de store visninger også bruge rigtig fuld skærm. Ellers fungerer de som en dialog, der fylder siden. Afsnittet **Husk det let** indeholder en remse, fem nøglepunkter og otte typiske lærerspørgsmål med korte svar.

## Faste farver og ikoner

Hver betydning har et tekstnavn og samme vektorikon overalt. Man behøver derfor ikke kunne skelne farverne for at bruge siden.

| Betydning | Farve | Ikon |
| --- | --- | --- |
| Tilbudsgiver | Blå | Pil op fra en bakke |
| Tilbudsmodtager | Orange | Pil ned i en bakke |
| Brevsprække / modtaget | Lilla | Lukket kuvert |
| Kundskab / læst | Grøn | Øje |
| Betænkningstid / acceptfrist | Gul/gulbrun | Timeglas |
| Deklaratorisk | Turkis | Åben lås |
| Præceptiv | Rød | Lukket lås |
| Beskyttelsespræceptiv | Pink | Skjold |

Mørk tilstand bruger lysere udgaver af de samme farver med kontrast mod mørke baggrunde. Tegnepapiret og eksportbilledet er lyse, så penfarverne er faste.

## Dansk oplæsning

Tryk **Læs det hele op** nederst, eller på højttalerknappen ved et trin eller kort. Lyd starter aldrig automatisk. Hele emnet læses i rækkefølgen: kort fortalt → syv trin → begreber → huskeregler og lærerens spørgsmål.

Afspilleren har **Afspil/Fortsæt**, **Pause**, **Stop**, forrige/næste afsnit og **0.8× / 1× / 1.2×**. Det aktuelle afsnit fremhæves. Enkeltkort læses uden at starte hele emnet. På flashcards læses kun den side, der er vendt frem; quizfacit læses først efter, at du har svaret.

Siden bruger `speechSynthesis` og `SpeechSynthesisUtterance` med `da-DK`. En lokal dansk stemme foretrækkes, hvis den findes. Stemmelisten indlæses også ved `voiceschanged`. Der bruges korte ytringer for at gøre afspilning mere stabil på mobil. Hvis pause/genoptagelse afslutter ytringen i en mobilbrowser, genoptager afspilleren den korte ytring fra senest registrerede ord. Ord kan derfor blive gentaget på nogle enheder.

Browseren og operativsystemet bestemmer, hvilke stemmer der findes, og om de virker offline. Hvis dansk stemme eller taleservice mangler, vises en besked. Resten af siden virker fortsat. Web Speech-API'et er beskrevet i [MDN's dokumentation](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).

## Læg siden på GitHub Pages

1. Opret et repository på GitHub, eller åbn det repository, du vil bruge.
2. Upload `index.html`, `style.css`, `script.js` og `README.md` direkte til roden af branchen **main**. Pak ZIP-filen ud først — upload filerne, ikke selve ZIP-filen eller en ekstra mappe.
3. Gem ændringerne med **Commit changes**.
4. Åbn **Settings → Pages**.
5. Vælg **Deploy from a branch** under Source.
6. Vælg **Branch: main → / (root)**, og tryk **Save**.
7. Vent på GitHubs publicering. Det færdige link vises under Pages.

Siden bruger kun relative stier og virker derfor både på et almindeligt projektrepository og et repository til brugerens hovedside. Repositoryets synlighed og din GitHub-plan skal understøtte Pages.

## Betjening

- **Tema:** Knappen øverst skifter mellem systemets tema, det modsatte tema og det andet faste tema. Efter tre klik følger den systemet igen.
- **Model:** Klik på et af de syv trin, brug næste/forrige, eller afspil hele modellen. Piletaster virker på trin-knapperne.
- **Flashcards:** Vend med klik eller mellemrum. Brug piletaster eller swipe til at skifte. Efter vending kan du vælge **Jeg kunne den** eller **Øv igen**. Svære kort sættes ind to gange i øvekøen og får større vægt ved blanding. Fremgang tæller unikke kort, du har markeret som klaret.
- **Quiz:** Du får feedback og en forklaring efter hvert svar. Til sidst kan du tage hele quizzen eller kun de spørgsmål, du svarede forkert på i den afsluttede runde.
- **Tegn i hånden:** Tegn med mus, finger eller pen. Vælg pen, viskelæder, farve og stregtykkelse. Fortryd med knappen eller Ctrl/⌘ + Z, når fokus er i tegnepanelet. Gendan med knappen eller Ctrl/⌘ + Shift + Z. **Ryd** kan gendannes streg for streg. Tegningen bevares, når du skifter tilstand eller ændrer skærmstørrelse, men ikke ved genindlæsning.
- **Byg modellen:** Træk kortene til pladserne, eller vælg et kort og tryk på pladsens nummer. Sidstnævnte virker også med Tab og Enter/mellemrum. Kort kan bytte plads. Markér de fire relevante øjeblikke som brevsprække eller kundskab. Med × sendes et kort tilbage til kortbanken. Escape fjerner et kortvalg.
- **Facit:** Kan vises/skjules. Når du tjekker en model, åbnes facit til sammenligning.

## Sådan beregnes modelscoren

**Byggetilstand — automatisk tjek, 0–100 point:**

- Placering: 10 point for hvert trin på den rigtige plads, højst 70.
- Rækkefølge: Antallet af korrekt sammenhængende nabotrin divideret med 6 og ganget med 20, afrundet. En korrekt overgang kræver, at to placerede kort står lige efter hinanden i modellens faglige rækkefølge.
- Begreber: Antallet af korrekt markerede, placerede modtaget/læst-kort divideret med 4 og ganget med 10, afrundet.

**Tegnetilstand — selvvurdering, 0–100 point:**

- Trin: 10 point pr. afkrydset trin, højst 70.
- Rækkefølge: 0, 10 eller 20 point efter dit valg, ganget med andelen af de syv trin, du har afkrydset, og afrundet.
- Begreber: 5 point for skelnen mellem modtaget/læst og 5 for acceptfristen.

Tegningen aflæses ikke automatisk. En streg skal være tegnet, før selvvurderingen kan gemmes. Du vurderer selv indholdet ud fra tjekliste og facit. Historikken mærker tydeligt selvvurderinger og automatiske tjek.

## Gemte data og tilgængelighed

Tema, flashcard-fremgang, bedste score for hver tilstand og de seneste 20 modelforsøg gemmes i `localStorage` under nøglen `aftalemodellen.v1`. Ingen resultater eller tegninger sendes til en server. Tegnestreger og byggekort gemmes kun i hukommelsen under det aktuelle besøg. Siden virker videre uden vedvarende lagring, hvis browseren blokerer den.

Siden har tastaturbetjening, synlige fokusmarkeringer, danske labels, skærmlæserbeskeder, tekst sammen med farver og respekt for `prefers-reduced-motion`. Frihåndstegning kræver en pointer; byggetilstanden er det tastaturbetjente alternativ.

## Opdateringer

Redigér filerne, og commit til **main**. Den aktuelle offline-cache er **v2**. Ved næste ændring i webfilerne skal du også ændre versionen fra `v2` til `v3` osv. øverst i `script.js`, så en ny cache installeres. Bevar localStorage-nøglen `aftalemodellen.v1`, så elevens gemte fremgang fortsætter. Den nye udgave bruger samme scoreberegning, flashcard-ID'er og gemte resultater som den første.

## Faglig kilde

Indholdet følger opgavebeskrivelsens undervisningsnoter og den angivne syvtrinsmodel. Der anvendes ingen eksterne faglige kilder. Quiz og flashcards er formuleret ud fra dette indhold.
