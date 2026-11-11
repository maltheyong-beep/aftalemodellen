# Aftalemodellen – dit billede, trin for trin

Dansk øveside i ren HTML, CSS og JavaScript. Ingen frameworks, build, backend eller eksterne billeder og skrifttyper. Alle filer er færdige.

## Læg siden på GitHub Pages

1. Pak ZIP-filen ud. Læg **alle seks filer** i roden af repositoryet `maltheyong-beep/aftalemodellen`: `index.html`, `style.css`, `script.js`, `manifest.json`, `sw.js` og `README.md`.
2. Gå til **Settings → Pages → Deploy from a branch**.
3. Vælg **Branch: main → / (root)** og **Save**.
4. Vent på udgivelsen, og genindlæs siden online. Den nye worker erstatter den tidligere offlineversion.

Siden udgives fra roden af `main` på GitHub Pages. Upload alle seks filer sammen, og åbn siden online efter en opdatering.

## Præcis det vedhæftede billede

Modellen bruger selve dit vedhæftede whiteboardbillede, `image(20261111-202209).png`. Originalens PNG-bytes er indlejret i `index.html`; der mangler ingen billedfiler. SVG bruges kun som billedramme og til fokusmarkering. Billedets tekst, pile, farver og placeringer er ikke genskabt eller ændret.

Det samme billede vises i modeloversigten, zoom, facit, print, PNG-download og **alle 14 visninger i fremlæggelsen**. Ved gennemgang markeres det relevante område oven på billedet. PNG-download har størrelse 3840 × 2560 pixels og samme proportioner som originalen.

Modellens indhold følger billedet: fire hovedpunkter, tre tidsforløb, tilbagekaldelsesnoten, AFTL § 2 og § 3 samt forbindelserne fra § 4 og § 6 til § 40. Billedets noter er et undervisningsoverblik og opregner ikke alle betingelser og undtagelser i loven.

## Begreber forklaret bedre

Efter brugerens seneste ønske er de generelle begreber uddybet særskilt:

- Stiltiende løfte: handlinger kan udtrykke accept; tavshed alene er normalt ikke et ja.
- Skriftlig/mundtlig aftale: begge former kan som udgangspunkt bruges. Enighed, dokumentation og særlige formkrav holdes adskilt.
- De fire centrale ord: løfte, tilbud, accept og påbud har hver sin forklaring og funktion.
- Kortene har **forklaring → eksempel → det skal du huske**. Eksemplerne er øveeksempler, ikke ekstra tekst fra billedet.

De generelle begreber er kontrolleret mod primære kilder. Kilderne er læselinks; siden behøver ikke internet for at bruge det indlejrede indhold:

- [Forbrugerombudsmanden: Aftaleindgåelse](https://forbrugerombudsmanden.dk/alle-emner/forbrugeraftaler/aftaleindgaaelse) – aftaleformer, tilbud/accept og aftaler gennem handlinger.
- [Forbrugerombudsmanden: Webshop guide](https://forbrugerombudsmanden.dk/publikationer/retningslinjer-og-vejledninger/vejledninger-longreads/webshop-guide-nettjek) – aktiv accept.
- [Forbrug.dk: Før du klager](https://forbrug.dk/klagemuligheder/saadan-klager-du/foer-du-klager) – dokumentation for mundtlige aftaler.
- [Mads Bryde Andersen: Grundlæggende aftaleret, 4. udgave](https://jura.ku.dk/jurabog/pdf/juridiske-monografier/grundlaeggende_aftaleret-4-udg-2013.pdf), afsnit 2.1.c – løfte og påbud. Forklaringer og eksempler på siden er skrevet selvstændigt.

## Vælg det, du vil øve

I både flashcards og quiz kan du vælge **Modellen**, **Begreber** eller **Begge dele**. Valget holdes synkront og gemmes på enheden.

| Valg | Flashcards | Quizspørgsmål |
| --- | ---: | ---: |
| Modellen | 28 | 24 |
| Begreber | 12 | 18 |
| Begge dele | 40 | 42 |

Quizzen blander både spørgsmål og svarmuligheder ved hver ny runde. Den låser svaret og viser eget svar, korrekt svar, en forklaring på den valgte fejl og en huskeregel. Ved modelspørgsmål kan det relevante område åbnes direkte på billedet. Efter runden kan kun de forkerte gentages, igen med blandet rækkefølge. Der er også en knap til en ny blandet quiz.

Flashcards vender med klik/mellemrum, skifter med piletaster/swipe og gentager svære kort efter to andre. Fremgangstælleren gælder den valgte kategori; kategoriskift sletter ikke fremgang i andre kategorier.

## Tegning og byggetilstand

Bevaret: mus/touch/pen, penfarver, viskelæder, fortryd, gendan, ryd, facit, score 0–100, bedste score og de seneste 20 forsøg.

Byggetilstanden deler modellen i syv forløbsdele (fire hovedpunkter og tre tidsforløb) plus seks noter. Rigtige pladser giver `80 × antal korrekte / 13` point. Kuvert = modtaget og øje = læst giver hver 10 point. Det er en opdeling til øvelsen, ikke 13 nye trin på billedet.

Tegning aflæses ikke automatisk. Eleven selvvurderer: tjeklisten giver op til 70 point, rækkefølgen op til 20 point vægtet efter de forløbsdele, der er med, og symbolerne 5 point hver. Scoren afrundes til et helt tal.

## Betjening og offline

- Fremlæg: ←/→ skifter, Home/End går til første/sidste visning, Escape lukker. Billedet er med hele vejen.
- Tema: automatisk efter systemet, lys eller mørk. Originalbilledet beholder sin hvide baggrund.
- Oplæsning: dansk Web Speech API, afspil/pause/stop, afsnitsskift og tre hastigheder. Hele begrebsforklaringen inklusive eksempel og huskeregel læses op.
- Tegning: Ctrl/⌘ + Z fortryder; Ctrl/⌘ + Shift + Z eller Ctrl + Y gendanner.
- Byg: træk et kort, eller vælg kort + plads med klik eller Tab/Enter.

Siden kan åbnes direkte som `index.html`. PWA/offlineinstallation kræver HTTPS eller localhost og et første onlinebesøg. På iPhone/iPad bruges Safari → Del → Føj til hjemmeskærm. Dansk talestemme skal være tilgængelig på enheden; nogle stemmer kræver internet. En manglende stemme eller manglende talestøtte vises som en besked.

`sw.js` har versionsmærket `tavle-2026-11-11-v3`. Cachen omfatter kun eget scope. Tema, kategori, kort og historik gemmes lokalt under `aftalemodellen.tavle-2026-11-11`; tidligere resultater for den samme tavlemodel bevares. Tegningen og den aktuelle quiz/byggeopstilling lever kun i den åbne side. Ingen konto, tracking eller backend.

## Ændringer i denne udgave

- Selve whiteboardbilledet erstatter det tidligere genskabte diagram.
- Alle fremlæggelsestrin viser billedet med fokusmarkering og korte talepunkter.
- Begreber har forklaring, eksempel og huskehjælp.
- Quizzen har 42 spørgsmål, kategorivalg, blandede svar og konkret fejlfeedback.
- Flashcards har samme kategorivalg; alle øvrige øvefunktioner er bevaret.

## Mobiludgave

Mobilen har fast bundmenu, større trykflader, læselig quiz og en kompakt oplæser. Quizzen fører videre til forklaringen efter et svar. Flashcards kan swipes og skifter uden at vise næste korts svar. Tegnefladen kan åbnes i stor visning med de samme streger og fortryd/gendan. Byggetilstanden understøtter kortvalg efterfulgt af tryk på en plads. Dialoger bruger skærmens tilgængelige højde og tager højde for skærmkanter. Animationer respekterer reduceret bevægelse. Det faglige indhold, modelbilledet og gemte resultater er uændrede.
