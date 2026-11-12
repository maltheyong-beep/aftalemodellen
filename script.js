/* Aftalemodellen. Modellen følger brugerens whiteboardbillede.
 * Grundbegreber er uddybet med forklaringer og øveeksempler; se README.
 * Ingen eksterne biblioteker. Alle læringsvisninger deler samme indhold.
 * Hovedpunkter, tidsforløb og sidetavlens noter holdes adskilt.
 */
"use strict";

(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const system = matchMedia("(prefers-color-scheme: dark)");
  const mobileLayout = matchMedia("(max-width: 700px), (max-width: 1000px) and (max-height: 500px)");
  const MODEL_VERSION = "tavle-2026-11-11";
  const MODEL_IMAGE = $("#modelSourceImage").getAttribute("src");
  const STORAGE_KEY = "aftalemodellen." + MODEL_VERSION;
  const TYPES = {
    giver: {
      label: "TG · Tilbudsgiver",
      hint: "Sender tilbuddet"
    },
    recipient: {
      label: "TM · Tilbudsmodtager",
      hint: "Modtager tilbuddet / acceptant"
    },
    received: {
      label: "Brevsprækkeøjeblikket",
      hint: "Modtaget · kuvertsymbolet"
    },
    read: {
      label: "Kundskabsøjeblikket",
      hint: "Læst · øjesymbolet"
    },
    time: {
      label: "Tid og frister",
      hint: "Tidsforløb · § 2 og § 3"
    },
    withdraw: {
      label: "Tilbagekaldelse",
      hint: "Inden kundskabsøjeblikket"
    },
    exception: {
      label: "Afvigelser",
      hint: "Forsinkelse · uoverensstemmende"
    },
    claim: {
      label: "Reklamation",
      hint: "Pligtmæssig reklamation · § 40"
    }
  };
  const ICONS = {
    giver: '<path d="M4 14v6h16v-6M12 16V3m-4 4 4-4 4 4"/>',
    recipient: '<path d="M4 14v6h16v-6M12 3v12m-4-4 4 4 4-4"/>',
    received: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    read: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    time: '<path d="M5 3h14M5 21h14M7 3v4l10 10v4M17 3v4L7 17v4"/>',
    withdraw: '<path d="m8 4-5 5 5 5M3 9h11a7 7 0 0 1 0 14"/>',
    exception: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.1"/>',
    claim: '<path d="M21 11a8 8 0 0 1-8 8H8l-5 3v-7a8 8 0 1 1 18-4Z"/><path d="M7 10h10M7 14h6"/>',
    speaker: '<path d="M3 9v6h4l5 4V5L7 9H3Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'
  };
  const points = [{
    id: "send",
    title: "TG sender tilbud",
    short: "Sender tilbud",
    kind: "giver",
    text: "TG er tilbudsgiver. TG sender tilbuddet til TM.",
    note: "Her begynder fremsendelsestiden.",
    location: "Øverst til venstre"
  }, {
    id: "receive",
    title: "TM modtager tilbud",
    short: "Modtager tilbud",
    kind: "recipient",
    text: "TM er tilbudsmodtager. TM modtager tilbuddet. Ved dette hovedpunkt ses både kuvert- og øjesymbolet.",
    note: "Kuverten viser brevsprækkeøjeblikket: meddelelsen er modtaget. Øjet viser kundskabsøjeblikket: meddelelsen er læst.",
    location: "Øverst til højre"
  }, {
    id: "accept",
    title: "TM = acceptant",
    short: "Sender accept",
    kind: "recipient",
    text: "TM står som acceptant og sender accept.",
    note: "Accepten går tilbage gennem tilbagesendelsestiden.",
    location: "Nederst til højre"
  }, {
    id: "binding",
    title: "Bindende aftale",
    short: "Bindende aftale",
    kind: "read",
    text: "Nederst til venstre står bindende aftale ved øjesymbolet. Her ses også en kuvert.",
    note: "Modellens returforløb ender i denne del af tavlen.",
    location: "Nederst til venstre"
  }];
  const times = [{
    id: "outbound",
    title: "Fremsendelsestid",
    kind: "time",
    text: "Tidsforløbet fra TG sender tilbud til TM modtager tilbud."
  }, {
    id: "thinking",
    title: "Betænkningstid",
    kind: "time",
    text: "Det lodrette tidsforløb hos TM mellem modtagelsen af tilbuddet og afsendelsen af accepten."
  }, {
    id: "return",
    title: "Tilbagesendelsestid",
    kind: "time",
    text: "Tidsforløbet tilbage fra TM, som sender accept, til modellens venstre side."
  }];
  const notes = [{
    id: "withdraw",
    title: "Tilbagekaldelse",
    kind: "withdraw",
    text: "Tilbagekaldelse af tilbud/accept skal ske inden kundskabsøjeblikket.",
    build: "Tilbagekaldelse inden kundskabsøjeblikket",
    slot: "Tilbagekaldelsesnoten"
  }, {
    id: "fixed",
    title: "AFTL § 2 · Fast frist",
    kind: "time",
    text: "På tavlen står AFTL § 2 sammen med fast frist.",
    build: "§ 2 · Fast frist",
    slot: "Fast frist"
  }, {
    id: "legal",
    title: "AFTL § 3 · Den legale acceptfrist",
    kind: "time",
    text: "Den legale acceptfrist står ved AFTL § 3. Herunder står rimelig betænkningstid samt frem- og tilbagesendelsestid.",
    build: "§ 3 · Rimelig betænkningstid + frem- og tilbagesendelsestid",
    slot: "Den legale acceptfrist"
  }, {
    id: "late",
    title: "Forsinkelse · § 4",
    kind: "exception",
    text: "Forsinkelse står ved § 4 og noten nyt tilbud.",
    build: "§ 4 · Forsinkelse (nyt tilbud)",
    slot: "Forsinkelse"
  }, {
    id: "different",
    title: "Uoverensstemmende · § 6",
    kind: "exception",
    text: "Uoverensstemmende står ved § 6 og noten modbud.",
    build: "§ 6 · Uoverensstemmende (modbud)",
    slot: "Uoverensstemmende"
  }, {
    id: "claim",
    title: "Pligtmæssig reklamation · § 40",
    kind: "claim",
    text: "Tavlen forbinder både forsinkelse (§ 4) og uoverensstemmende (§ 6) med pligtmæssig reklamation, § 40.",
    build: "§ 40 · Pligtmæssig reklamation",
    slot: "Fælles note til § 4 og § 6"
  }];
  // Øvelsen har syv forløbsdele: fire hovedpunkter og tre tidsforløb.
  const parts = [{
    ...points[0],
    label: "TG sender tilbud",
    slot: "Start · øverst til venstre",
    flow: true
  }, {
    ...times[0],
    label: "Fremsendelsestid",
    slot: "Fra venstre mod højre",
    flow: true
  }, {
    ...points[1],
    label: "TM modtager tilbud",
    slot: "Øverst til højre",
    flow: true
  }, {
    ...times[1],
    label: "Betænkningstid",
    slot: "Lodret hos TM",
    flow: true
  }, {
    ...points[2],
    label: "TM = acceptant · sender accept",
    slot: "Nederst til højre",
    flow: true
  }, {
    ...times[2],
    label: "Tilbagesendelsestid",
    slot: "Tilbage mod venstre",
    flow: true
  }, {
    ...points[3],
    label: "Bindende aftale",
    slot: "Afslutning · nederst til venstre",
    flow: true
  }, ...notes.map(n => ({
    ...n,
    label: n.build,
    flow: false
  }))];
  const partById = new Map(parts.map(p => [p.id, p]));
  const basicConcepts = [
  {
    "id": "silent",
    "title": "Stiltiende løfte",
    "kind": "read",
    "text": "Du kan vise, at du vil indgå en aftale, gennem dine handlinger uden at sige ja højt. Det kaldes også konkludent adfærd.",
    "example": "Du lægger en bolle på butikkens kassebånd og betaler. Dine handlinger viser, at du køber den, selv om du ikke siger noget.",
    "remember": "Det er handlingen, der viser accepten. Tavshed alene betyder normalt ikke ja."
  },
  {
    "id": "form",
    "title": "Skriftlig eller mundtlig aftale",
    "kind": "giver",
    "text": "En aftale kan som udgangspunkt indgås både på skrift og ved tale. Parterne skal være enige om det aftalte; man bliver ikke bundet af enhver besked eller samtale.",
    "example": "Sælger: \"Du kan købe min cykel for 500 kr.\" Køber: \"Ja, jeg køber den for 500 kr.\" De kan aftale det ansigt til ansigt eller skrive det til hinanden.",
    "remember": "En underskrift er ikke altid nødvendig. Skrift gør det ofte lettere at bevise aftalen. Visse aftaletyper har særlige formkrav."
  },
  {
    "id": "four-words",
    "title": "De fire centrale ord",
    "kind": "time",
    "text": "Ordene har forskellige opgaver. Lær betydningen af hvert ord, så du kan forklare, hvad parterne faktisk gør.",
    "items": [
      [
        "Løfte",
        "Jeg påtager mig en pligt."
      ],
      [
        "Tilbud",
        "Mit konkrete forslag til en aftale."
      ],
      [
        "Accept",
        "Mit ja til tilbuddet, som det er."
      ],
      [
        "Påbud",
        "Jeg giver en meddelelse, der kan få retsvirkning for modtageren."
      ]
    ],
    "example": "Tilbud: \"Cyklen koster 500 kr.\" Accept: \"Ja, jeg køber den for 500 kr.\" Sælger lover at levere; køber lover at betale.",
    "remember": "Tilbud og accept er ikke synonymer. Et påbud er heller ikke bare et andet ord for et tilbud."
  },
  {
    "id": "promise",
    "title": "Løfte",
    "kind": "giver",
    "text": "Et juridisk løfte er en erklæring om, at du påtager dig en pligt over for en anden.",
    "example": "Som sælger lover du at levere den aftalte cykel. Som køber lover du at betale den aftalte pris.",
    "remember": "Spørg: Hvem påtager sig en pligt, og hvad lover personen at gøre?"
  },
  {
    "id": "offer",
    "title": "Tilbud",
    "kind": "giver",
    "text": "Et tilbud er et konkret forslag til en aftale på bestemte vilkår. Tilbudsgiver erklærer sig villig til at indgå aftalen, hvis tilbuddet accepteres rettidigt og på de samme vilkår.",
    "example": "\"Du kan købe min cykel for 500 kr.\" Her kan den anden sige ja til et bestemt køb til en bestemt pris.",
    "remember": "Et spørgsmål som \"Hvad koster cyklen?\" er en forespørgsel. Det er ikke i sig selv et ja til at købe."
  },
  {
    "id": "accept-word",
    "title": "Accept",
    "kind": "recipient",
    "text": "Accept betyder, at du siger ja til tilbuddet, som det er. Du accepterer altså de vilkår, der er tilbudt.",
    "example": "Tilbud: \"Cyklen koster 500 kr.\" Accept: \"Ja, jeg køber den for 500 kr.\" Svaret \"Kun hvis jeg får den for 400 kr.\" ændrer prisen.",
    "remember": "Et ja med ændrede vilkår er ikke en ren accept. På modellen står uoverensstemmende ved § 6 og modbud."
  },
  {
    "id": "order-word",
    "title": "Påbud",
    "kind": "claim",
    "text": "Et påbud er en meddelelse, som kan få retsvirkning for modtageren uden et nyt ja fra modtageren. Afsenderen skal have ret til at give meddelelsen.",
    "example": "Du opsiger et abonnement efter aftalens opsigelsesregler. Virksomheden skal ikke først sige ja til en gyldig opsigelse.",
    "remember": "Et påbud får som udgangspunkt virkning, når det kommer frem. Det betyder ikke, at du frit kan bestemme over andre."
  }
];
  const modelConceptExtras = {
  "tg": {
    "example": "Den, der foreslår aftalen, er TG. Den, der får tilbuddet, er TM.",
    "remember": "TM skifter rolle til acceptant, når TM sender accepten."
  },
  "acceptant": {
    "example": "Følg billedet ned ad højre side: TM modtager først tilbuddet og sender senere accepten som acceptant.",
    "remember": "Acceptant er navnet på den, der accepterer."
  },
  "symbols": {
    "example": "En mail kan være kommet til indbakken, uden at den er åbnet. Først når den bliver læst, er der kundskab.",
    "remember": "Modtaget og læst er to forskellige hændelser."
  },
  "outbound": {
    "example": "Følg den blå pil fra TG mod TM øverst på billedet.",
    "remember": "Frem = tilbuddet ud til modtageren."
  },
  "thinking": {
    "example": "Følg den grønne pil ned ad højre side, inden TM sender accept.",
    "remember": "Tænk = tiden hos TM; det er ikke transporttid."
  },
  "return": {
    "example": "Følg den orange pil fra TM tilbage mod TG nederst på billedet.",
    "remember": "Tilbage = acceptens vej tilbage."
  },
  "withdraw": {
    "example": "Find den lilla boks og pilene til øjesymbolerne. Billedets note knytter tilbagekaldelse til kundskabsøjeblikket.",
    "remember": "Billedet siger: Tilbagekaldelse af tilbud/accept skal ske inden kundskabsøjeblikket."
  },
  "fixed": {
    "text": "Fast frist er modellens betegnelse for en fastsat acceptfrist. Den står ud for AFTL § 2.",
    "example": "I et øveeksempel kan en fast frist være angivet som en bestemt dato.",
    "remember": "Knyt fast frist til § 2."
  },
  "legal": {
    "text": "Den legale acceptfrist vises som en kombination af tid til at sende tilbuddet frem, rimelig tid til at tænke og tid til at sende accepten tilbage.",
    "example": "Læs de to punkter under § 3: rimelig betænkningstid samt frem- og tilbagesendelsestid.",
    "remember": "§ 3 er ikke kun betænkningstid. Transporten i begge retninger er også nævnt."
  },
  "late": {
    "text": "På billedet kobles forsinkelse med § 4 og ordene nyt tilbud.",
    "example": "Sammenlign de to nederste linjer: forsinkelse står på den øverste, uoverensstemmende på den nederste.",
    "remember": "Forsinkelse handler om tid. Hold § 4 adskilt fra § 6."
  },
  "different": {
    "text": "Uoverensstemmende betyder, at svaret ændrer noget i forhold til tilbuddet. Billedet kobler det med § 6 og modbud.",
    "example": "Et tilbud nævner 500 kr., men svaret foreslår 400 kr. Prisen stemmer ikke overens.",
    "remember": "Uoverensstemmende handler om indholdet, fx en ændret pris."
  },
  "claim": {
    "text": "Pligtmæssig reklamation står ved § 40. På billedet går forbindelsen fra både § 4 og § 6 til denne fælles boks.",
    "example": "Følg de to grønne streger nederst: de samles ved boksen med § 40.",
    "remember": "Husk forbindelsen fra begge afvigelser. Billedet opregner ikke de nærmere betingelser."
  }
};
  const modelConcepts = [
    {id:"tg",title:"TG og TM",kind:"giver",text:"TG er tilbudsgiver. TM er tilbudsmodtager."},
    {id:"acceptant",title:"TM = acceptant",kind:"recipient",text:"TM står som acceptant, når TM sender accept."},
    {id:"symbols",title:"Kuvert og øje",kind:"received",text:"Kuverten viser brevsprækkeøjeblikket: meddelelsen er modtaget. Øjet viser kundskabsøjeblikket: meddelelsen er læst."},
    ...times, ...notes
  ].map(c => ({...c,...modelConceptExtras[c.id],category:"model"}));
  const concepts = [...basicConcepts.map(c=>({...c,category:"concepts"})), ...modelConcepts];
  function conceptSpeech(c) {
    return [c.title,c.text,...(c.items||[]).map(([word,meaning])=>word+": "+meaning),c.example?"Eksempel: "+c.example:"",c.remember?"Husk: "+c.remember:""].filter(Boolean).join(" ");
  }
  const memories = [{
    id: "symbols",
    kind: "received",
    title: "Kuvert: modtaget. Øje: læst.",
    text: "Kuvert = brevsprækkeøjeblikket (modtaget). Øje = kundskabsøjeblikket (læst). Hold de to øjeblikke adskilt."
  }, {
    id: "route",
    kind: "time",
    title: "Frem. Tænk. Tilbage.",
    text: "Fremsendelsestid. Betænkningstid. Tilbagesendelsestid. Knyt de tre navne til pilene på tavlen."
  }, {
    id: "numbers",
    kind: "exception",
    title: "2, 3, 4, 6 – og 40.",
    text: "2: fast frist. 3: den legale acceptfrist. 4: forsinkelse. 6: uoverensstemmende. 40: pligtmæssig reklamation."
  }, {
    id: "five",
    kind: "read",
    title: "5 ting du skal kunne.",
    list: ["Kuverten viser brevsprækkeøjeblikket: meddelelsen er modtaget. Øjet viser kundskabsøjeblikket: meddelelsen er læst.", "De tre tidsforløb: frem, betænkning og tilbage.", "§ 2: fast frist. § 3: den legale acceptfrist.", "Tilbagekaldelse skal ske inden kundskabsøjeblikket.", "§ 4: nyt tilbud. § 6: modbud. Begge forbindes med § 40."]
  }];
  const teacherQuestions = [["Kan du forklare hovedforløbet?", "TG sender tilbud til TM. Hos TM følger betænkningstid. TM står som acceptant og sender accept tilbage. Nederst til venstre står bindende aftale."], ["Hvad betyder TG og TM?", "TG betyder tilbudsgiver. TM betyder tilbudsmodtager."], ["Hvad betyder kuverten og øjet?", "Kuverten viser brevsprækkeøjeblikket: meddelelsen er modtaget. Øjet viser kundskabsøjeblikket: meddelelsen er læst."], ["Hvad hedder de tre tidsforløb?", "Fremsendelsestid, betænkningstid og tilbagesendelsestid."], ["Hvad står ved § 2 og § 3?", "§ 2: fast frist. § 3: den legale acceptfrist med rimelig betænkningstid samt frem- og tilbagesendelsestid."], ["Hvad står der om tilbagekaldelse?", notes[0].text], ["Hvad står ved § 4 og § 6?", "§ 4: forsinkelse, nyt tilbud. § 6: uoverensstemmende, modbud."], ["Hvad er § 4 og § 6 forbundet med?", "Pligtmæssig reklamation, § 40."]];
  teacherQuestions.push(
    ["Bliver jeg bundet, bare fordi jeg er stille?","Nej, tavshed er normalt ikke i sig selv accept. Ved stiltiende løfte kan handlingerne vise accepten, fx når du køber og betaler ved kassen uden at sige ja."],
    ["Skal en aftale altid skrives under?","Nej, som udgangspunkt kan den også indgås mundtligt. Skrift gør det ofte lettere at bevise aftalen; visse aftaletyper har særlige formkrav."],
    ["Kan du forklare de fire ord?","Løfte: Jeg påtager mig en pligt. Tilbud: Mit forslag til aftalen. Accept: Mit ja til forslaget. Påbud: En meddelelse med retsvirkning for modtageren, fx en gyldig opsigelse."]
  );
  const modelFlashcards = [["ROLLER", "Hvad betyder TG?", "Tilbudsgiver.", "giver"], ["ROLLER", "Hvad betyder TM?", "Tilbudsmodtager.", "recipient"], ["TILBUD", "Hvem sender tilbuddet?", "TG, tilbudsgiver.", "giver"], ["TILBUD", "Hvem modtager tilbuddet?", "TM, tilbudsmodtager.", "recipient"], ["SYMBOLER", "Hvad betyder kuvertsymbolet?", "Brevsprækkeøjeblikket: meddelelsen er modtaget.", "received"], ["SYMBOLER", "Hvad betyder øjesymbolet?", "Kundskabsøjeblikket: meddelelsen er læst.", "read"], ["TIDSFORLØB", "Hvad hedder strækningen fra TG til TM øverst?", "Fremsendelsestid.", "time"], ["TIDSFORLØB", "Hvad hedder det lodrette tidsforløb hos TM?", "Betænkningstid.", "time"], ["TIDSFORLØB", "Hvad hedder tidsforløbet tilbage mod TG?", "Tilbagesendelsestid.", "time"], ["ACCEPT", "Hvad kaldes TM, når TM sender accept?", "Acceptant.", "recipient"], ["ACCEPT", "Hvem sender accepten?", "TM, der står som acceptant.", "recipient"], ["AFSLUTNING", "Hvad står nederst til venstre?", "Bindende aftale.", "read"], ["FRISTER", "Hvad står ved AFTL § 2?", "Fast frist.", "time"], ["FRISTER", "Hvad står ved AFTL § 3?", "Den legale acceptfrist.", "time"], ["FRISTER", "Hvilke tider nævnes under den legale acceptfrist?", "Rimelig betænkningstid samt frem- og tilbagesendelsestid.", "time"], ["TILBAGEKALDELSE", "Hvad kan tilbagekaldes ifølge noten?", "Tilbud/accept.", "withdraw"], ["TILBAGEKALDELSE", "Hvornår skal tilbagekaldelse af tilbud/accept ske?", "Inden kundskabsøjeblikket.", "withdraw"], ["AFVIGELSER", "Hvilken paragraf står ved forsinkelse?", "§ 4.", "exception"], ["AFVIGELSER", "Hvilken note står ved forsinkelse?", "Nyt tilbud.", "exception"], ["AFVIGELSER", "Hvilken paragraf står ved uoverensstemmende?", "§ 6.", "exception"], ["AFVIGELSER", "Hvilken note står ved uoverensstemmende?", "Modbud.", "exception"], ["REKLAMATION", "Hvilken paragraf står ved pligtmæssig reklamation?", "§ 40.", "claim"], ["REKLAMATION", "Hvilke to paragraffer forbindes med pligtmæssig reklamation?", "§ 4 og § 6.", "claim"], ["RÆKKEFØLGE", "Hvad følger efter fremsendelsestiden?", "TM modtager tilbuddet.", "recipient"], ["RÆKKEFØLGE", "Hvilket hovedpunkt følger efter betænkningstiden?", "TM = acceptant, sender accept.", "recipient"], ["RÆKKEFØLGE", "Hvad følger efter TM sender accept?", "Tilbagesendelsestid tilbage mod venstre.", "time"], ["FRISTER", "Hvilken paragraf forbindes med rimelig betænkningstid?", "§ 3, den legale acceptfrist.", "time"], ["OVERBLIK", "Nævn de fire hovedpunkter i rækkefølge.", "TG sender tilbud. TM modtager tilbud. TM = acceptant, sender accept. Bindende aftale.", "giver"]].map((c, i) => ({
    id: "board-f" + i,
    topic: c[0],
    question: c[1],
    answer: c[2],
    kind: c[3],
    category: "model"
  }));
  const conceptFlashData = [
  [
    "Stiltiende løfte",
    "Hvad er et stiltiende løfte?",
    "Du kan vise accept gennem handlinger uden at sige ja højt. Tavshed alene betyder normalt ikke ja.",
    "read"
  ],
  [
    "Stiltiende løfte",
    "Hvorfor kan et køb ske uden ord ved kassen?",
    "Du viser gennem dine handlinger og betalingen, at du vil købe varen.",
    "read"
  ],
  [
    "Tavshed",
    "Er det automatisk accept, hvis du ikke svarer?",
    "Nej. At du ikke svarer, er normalt ikke i sig selv et ja.",
    "read"
  ],
  [
    "Aftaleform",
    "Kan en mundtlig aftale være bindende?",
    "Ja, som udgangspunkt. Det afgørende er, at parterne indgår en aftale; der er dog aftaletyper med særlige formkrav.",
    "giver"
  ],
  [
    "Aftaleform",
    "Hvorfor er det ofte en fordel at skrive aftalen ned?",
    "Det gør det lettere at bevise, hvad parterne aftalte.",
    "giver"
  ],
  [
    "Løfte",
    "Hvad er et juridisk løfte?",
    "En erklæring om, at du påtager dig en pligt over for en anden.",
    "giver"
  ],
  [
    "Tilbud",
    "Hvad gør tilbudsgiveren?",
    "Fremsætter et konkret forslag til en aftale på bestemte vilkår.",
    "giver"
  ],
  [
    "Accept",
    "Hvad betyder accept?",
    "Et ja til tilbuddet, som det er. Et svar med ændrede vilkår er ikke en ren accept.",
    "recipient"
  ],
  [
    "Påbud",
    "Hvad er et påbud?",
    "En meddelelse, der kan få retsvirkning for modtageren uden et nyt ja, hvis afsenderen har ret til at give den.",
    "claim"
  ],
  [
    "Påbud",
    "Nævn et eksempel på et påbud.",
    "En gyldig opsigelse af et abonnement efter aftalens opsigelsesregler.",
    "claim"
  ],
  [
    "Fire ord",
    "Hvad er forskellen på tilbud og accept?",
    "Tilbud er forslaget. Accept er et ja til det forslag på de tilbudte vilkår.",
    "time"
  ],
  [
    "Fire ord",
    "Hvilke fire ord skal du kunne forklare?",
    "Løfte: en pligt. Tilbud: et forslag. Accept: ja til forslaget. Påbud: en meddelelse med retsvirkning for modtageren.",
    "time"
  ]
];
  const conceptFlashcards = conceptFlashData.map((c,i)=>({id:"concept-f"+i,topic:c[0],question:c[1],answer:c[2],kind:c[3],category:"concepts"}));
  const flashcards = [...modelFlashcards,...conceptFlashcards];
  const flashById = new Map(flashcards.map(c => [c.id, c]));
  const questions = [
  {
    "id": "m01",
    "category": "model",
    "kind": "giver",
    "text": "Hvem starter med at sende tilbuddet på modellen?",
    "options": [
      "TG – tilbudsgiver",
      "TM – tilbudsmodtager",
      "TM som acceptant"
    ],
    "correct": 0,
    "why": "TG står øverst til venstre og sender tilbuddet mod TM.",
    "feedback": [
      "Rigtigt.",
      "TM modtager tilbuddet i den første del af forløbet.",
      "Acceptantrollen ses senere, når TM sender accepten."
    ],
    "remember": "Start ved TG øverst til venstre.",
    "region": "send"
  },
  {
    "id": "m02",
    "category": "model",
    "kind": "recipient",
    "text": "Hvad gør TM øverst til højre?",
    "options": [
      "Modtager tilbuddet",
      "Sender tilbuddet til TG",
      "Sender straks en reklamation"
    ],
    "correct": 0,
    "why": "Tilbuddet sendes fra TG og kommer frem til TM øverst til højre.",
    "feedback": [
      "Rigtigt.",
      "Det er TG, der sender tilbuddet ud. TM sender senere accept tilbage.",
      "Reklamationsnoten står nederst og er ikke første hændelse hos TM."
    ],
    "remember": "Tilbuddet går fra TG til TM.",
    "region": "receive"
  },
  {
    "id": "m03",
    "category": "model",
    "kind": "time",
    "text": "Tilbuddet er på vej fra TG til TM. Hvilken tid er det?",
    "options": [
      "Fremsendelsestid",
      "Betænkningstid",
      "Tilbagesendelsestid"
    ],
    "correct": 0,
    "why": "Fremsendelsestiden er tilbuddets vej ud til modtageren.",
    "feedback": [
      "Rigtigt.",
      "Betænkningstiden er hos TM og er ikke tilbuddets transport.",
      "Tilbagesendelsestiden gælder vejen tilbage med accepten."
    ],
    "remember": "Frem = tilbuddet ud.",
    "region": "outbound"
  },
  {
    "id": "m04",
    "category": "model",
    "kind": "time",
    "text": "TM har modtaget tilbuddet, men har endnu ikke sendt accept. Hvilket tidsforløb vises her?",
    "options": [
      "Betænkningstid",
      "Fremsendelsestid",
      "Tilbagesendelsestid"
    ],
    "correct": 0,
    "why": "Den lodrette grønne pil forbinder modtagelsen af tilbuddet med TM som acceptant.",
    "feedback": [
      "Rigtigt.",
      "Den øverste blå pil er transporten frem til TM.",
      "Returtransporten ligger efter afsendelsen af accepten."
    ],
    "remember": "Tænk = tiden hos TM.",
    "region": "thinking"
  },
  {
    "id": "m05",
    "category": "model",
    "kind": "recipient",
    "text": "Hvilket hovedpunkt kommer efter betænkningstiden?",
    "options": [
      "TM = acceptant, sender accept",
      "TG sender tilbud",
      "Bindende aftale nederst til venstre"
    ],
    "correct": 0,
    "why": "Følg højre side ned: efter betænkningstid står TM som acceptant og sender accept.",
    "feedback": [
      "Rigtigt.",
      "Det er startpunktet, før fremsendelsestiden.",
      "Du skal først følge acceptens vej tilbage."
    ],
    "remember": "Ned til acceptanten, så tilbage mod venstre.",
    "region": "accept"
  },
  {
    "id": "m06",
    "category": "model",
    "kind": "time",
    "text": "Accepten sendes fra TM tilbage mod TG. Hvilken tid er det?",
    "options": [
      "Tilbagesendelsestid",
      "Fremsendelsestid",
      "Betænkningstid"
    ],
    "correct": 0,
    "why": "Den nederste orange pil viser acceptens vej tilbage.",
    "feedback": [
      "Rigtigt.",
      "Fremsendelsestiden er tilbuddets vej ud.",
      "Betænkningstiden ligger hos TM før afsendelsen af accepten."
    ],
    "remember": "Tilbage = accepten hjem.",
    "region": "return"
  },
  {
    "id": "m07",
    "category": "model",
    "kind": "read",
    "text": "Hvad står ved modellens afslutning nederst til venstre?",
    "options": [
      "Bindende aftale",
      "TM sender accept",
      "Fast frist"
    ],
    "correct": 0,
    "why": "Den nederste venstre cirkel er mærket bindende aftale og har kuvert- og øjesymbol.",
    "feedback": [
      "Rigtigt.",
      "Det står nederst til højre, hvor returforløbet begynder.",
      "Fast frist står i noten ved § 2 til højre."
    ],
    "remember": "Følg returpilen til bindende aftale.",
    "region": "binding"
  },
  {
    "id": "m08",
    "category": "model",
    "kind": "received",
    "text": "En mail ligger i indbakken, men er ikke åbnet. Hvilket symbol passer til det?",
    "options": [
      "Kuverten – modtaget",
      "Øjet – læst",
      "Betænkningstidspilen"
    ],
    "correct": 0,
    "why": "Kuverten viser, at meddelelsen er modtaget. Det siger ikke i sig selv, at den er læst.",
    "feedback": [
      "Rigtigt.",
      "Øjet bruges om læsning; her er mailen endnu ikke åbnet.",
      "Pilen viser et tidsforløb, ikke selve modtagelsessymbolet."
    ],
    "remember": "Modtaget er ikke det samme som læst.",
    "region": "receive"
  },
  {
    "id": "m09",
    "category": "model",
    "kind": "read",
    "text": "Modtageren åbner og læser meddelelsen. Hvilket symbol passer?",
    "options": [
      "Øjet – læst",
      "Kuverten – modtaget",
      "Den orange returpil"
    ],
    "correct": 0,
    "why": "Øjet markerer kundskab: meddelelsen er læst.",
    "feedback": [
      "Rigtigt.",
      "Kuverten fortæller kun, at meddelelsen er kommet frem.",
      "Returpilen viser transport af accepten, ikke læsning."
    ],
    "remember": "Øje = læst.",
    "region": "receive"
  },
  {
    "id": "m10",
    "category": "model",
    "kind": "received",
    "text": "Hvilken forskel skal du kunne forklare mellem kuvert og øje?",
    "options": [
      "Kuvert er modtaget; øje er læst",
      "Begge betyder læst",
      "Kuvert er accept; øje er et nyt tilbud"
    ],
    "correct": 0,
    "why": "De to symboler skelner mellem fremkomst og læsning.",
    "feedback": [
      "Rigtigt.",
      "Så forsvinder forskellen mellem, at en besked ligger der, og at den bliver læst.",
      "Symbolerne viser modtaget/læst, ikke disse to aftaletyper."
    ],
    "remember": "Først kan beskeden være modtaget, senere læst.",
    "region": "receive"
  },
  {
    "id": "m11",
    "category": "model",
    "kind": "recipient",
    "text": "Hvad betyder betegnelsen acceptant på billedet?",
    "options": [
      "Den, der accepterer tilbuddet",
      "Den, der først sendte tilbuddet",
      "Navnet på fremsendelsestiden"
    ],
    "correct": 0,
    "why": "TM betegnes acceptant ved afsendelsen af accepten.",
    "feedback": [
      "Rigtigt.",
      "Det er TG, tilbudsgiveren.",
      "Acceptant er en rolle, ikke et tidsrum."
    ],
    "remember": "TM bliver vist som acceptant.",
    "region": "accept"
  },
  {
    "id": "m12",
    "category": "model",
    "kind": "time",
    "text": "Hvilken kombination svarer til modellens tre tidsforløb i rækkefølge?",
    "options": [
      "Fremsendelsestid → betænkningstid → tilbagesendelsestid",
      "Betænkningstid → tilbagesendelsestid → fremsendelsestid",
      "Tilbagesendelsestid → fremsendelsestid → betænkningstid"
    ],
    "correct": 0,
    "why": "Tilbuddet skal først frem, så vises tiden hos TM, og derefter acceptens vej tilbage.",
    "feedback": [
      "Rigtigt.",
      "Den rækkefølge springer tilbuddets vej ud over i begyndelsen.",
      "Returtransporten kan ikke være startpunktet i det viste forløb."
    ],
    "remember": "Frem. Tænk. Tilbage.",
    "region": "all"
  },
  {
    "id": "m13",
    "category": "model",
    "kind": "time",
    "text": "Hvad er § 2 koblet sammen med på billedet?",
    "options": [
      "Fast frist",
      "Den legale acceptfrist",
      "Forsinkelse"
    ],
    "correct": 0,
    "why": "§ 2 står lige ved teksten fast frist.",
    "feedback": [
      "Rigtigt.",
      "Den står ved § 3, ikke § 2.",
      "Den nederste forsinkelsesnote er knyttet til § 4."
    ],
    "remember": "2 = fast frist.",
    "region": "fixed"
  },
  {
    "id": "m14",
    "category": "model",
    "kind": "time",
    "text": "Hvad er § 3 koblet sammen med på billedet?",
    "options": [
      "Den legale acceptfrist",
      "Fast frist",
      "Pligtmæssig reklamation"
    ],
    "correct": 0,
    "why": "Under § 3 står både rimelig betænkningstid og transporttiderne.",
    "feedback": [
      "Rigtigt.",
      "Fast frist er placeret ved § 2.",
      "Det står i boksen med § 40 nederst."
    ],
    "remember": "3 = den legale acceptfrist.",
    "region": "legal"
  },
  {
    "id": "m15",
    "category": "model",
    "kind": "time",
    "text": "Er betænkningstid alene hele den legale acceptfrist på billedet?",
    "options": [
      "Nej, frem- og tilbagesendelsestid er også nævnt",
      "Ja, transport er ikke nævnt",
      "Nej, kun tilbagesendelsestiden tæller"
    ],
    "correct": 0,
    "why": "Under § 3 skal du huske rimelig betænkningstid sammen med transporten begge veje.",
    "feedback": [
      "Rigtigt.",
      "Det andet punkt under § 3 nævner netop frem- og tilbagesendelsestid.",
      "Så mangler både fremsendelsestid og rimelig betænkningstid fra billedets opremsning."
    ],
    "remember": "§ 3: frem + rimelig tænkning + tilbage.",
    "region": "legal"
  },
  {
    "id": "m16",
    "category": "model",
    "kind": "time",
    "text": "Du forklarer § 3 og nævner frem- og tilbagesendelsestid. Hvad mangler?",
    "options": [
      "Rimelig betænkningstid",
      "Fast frist",
      "Et nyt tilbud"
    ],
    "correct": 0,
    "why": "Modellen nævner også tiden til at tænke hos TM.",
    "feedback": [
      "Rigtigt.",
      "Fast frist hører til § 2 og erstatter ikke punktet under § 3.",
      "Det står ved forsinkelse i noten om § 4."
    ],
    "remember": "Husk begge punkter under § 3.",
    "region": "legal"
  },
  {
    "id": "m17",
    "category": "model",
    "kind": "withdraw",
    "text": "Hvilke meddelelser nævner den lilla tilbagekaldelsesboks?",
    "options": [
      "Tilbud og accept",
      "Kun tilbud",
      "Kun reklamation"
    ],
    "correct": 0,
    "why": "Boksen siger udtrykkeligt tilbagekaldelse af tilbud/accept.",
    "feedback": [
      "Rigtigt.",
      "Så mangler accept, som også står i boksen.",
      "Boksen handler om tilbud og accept; reklamation er en anden note."
    ],
    "remember": "Boksen omfatter både ud- og returforløbet.",
    "region": "withdraw"
  },
  {
    "id": "m18",
    "category": "model",
    "kind": "withdraw",
    "text": "Hvilket tidspunkt fremhæver tilbagekaldelsesnoten på billedet?",
    "options": [
      "Inden kundskabsøjeblikket",
      "Efter kundskabsøjeblikket",
      "Når man engang får lyst"
    ],
    "correct": 0,
    "why": "Billedets tekst knytter tilbagekaldelse af tilbud/accept til tidspunktet før kundskab.",
    "feedback": [
      "Rigtigt.",
      "Boksen siger inden, ikke efter.",
      "Noten har netop en tidsmæssig grænse."
    ],
    "remember": "Find ordet inden og pilene til øjnene.",
    "region": "withdraw"
  },
  {
    "id": "m19",
    "category": "model",
    "kind": "exception",
    "text": "Hvilken paragraf skal du forbinde med forsinkelse?",
    "options": [
      "§ 4",
      "§ 6",
      "§ 40"
    ],
    "correct": 0,
    "why": "Forsinkelse og nyt tilbud står sammen ved § 4 nederst.",
    "feedback": [
      "Rigtigt.",
      "§ 6 er knyttet til uoverensstemmende og modbud.",
      "§ 40 er den fælles reklamationsnote, ikke nummeret ved forsinkelse."
    ],
    "remember": "Forsinkelse = tid = § 4.",
    "region": "late"
  },
  {
    "id": "m20",
    "category": "model",
    "kind": "exception",
    "text": "Hvilke ord står i parentes ved forsinkelse?",
    "options": [
      "Nyt tilbud",
      "Modbud",
      "Rimelig betænkningstid"
    ],
    "correct": 0,
    "why": "Det er den note, billedet viser ved § 4.",
    "feedback": [
      "Rigtigt.",
      "Modbud er noten ved uoverensstemmende, § 6.",
      "Den formulering står under § 3."
    ],
    "remember": "4: forsinkelse – nyt tilbud.",
    "region": "late"
  },
  {
    "id": "m21",
    "category": "model",
    "kind": "exception",
    "text": "Svaret foreslår en anden pris end tilbuddet. Hvilken note passer til forskellen i indhold?",
    "options": [
      "Uoverensstemmende – § 6 – modbud",
      "Forsinkelse – § 4",
      "Fast frist – § 2"
    ],
    "correct": 0,
    "why": "En anden pris ændrer tilbuddets vilkår. Billedets note om uoverensstemmende passer til forskellen i indhold.",
    "feedback": [
      "Rigtigt.",
      "En ændret pris handler om indholdet. Den oplyser ikke i sig selv noget om tid.",
      "En fast frist handler om tidspunktet for accept, ikke en ændring af prisen."
    ],
    "remember": "Andet indhold = uoverensstemmende.",
    "region": "different"
  },
  {
    "id": "m22",
    "category": "model",
    "kind": "exception",
    "text": "Hvilken forskel hjælper dig med at huske § 4 og § 6?",
    "options": [
      "§ 4 handler om forsinkelse; § 6 om uoverensstemmende indhold",
      "Begge handler kun om tiden",
      "§ 4 er modbud; § 6 er fast frist"
    ],
    "correct": 0,
    "why": "De to nederste linjer skelner mellem tid og indhold.",
    "feedback": [
      "Rigtigt.",
      "§ 6 er knyttet til uoverensstemmende og modbud.",
      "Modbud står ved § 6; fast frist står ved § 2."
    ],
    "remember": "4 = tid. 6 = indhold.",
    "region": "exceptions"
  },
  {
    "id": "m23",
    "category": "model",
    "kind": "claim",
    "text": "Hvilke to noter forbindes med pligtmæssig reklamation, § 40?",
    "options": [
      "Både forsinkelse (§ 4) og uoverensstemmende (§ 6)",
      "Kun fast frist (§ 2)",
      "Kun forsinkelse (§ 4)"
    ],
    "correct": 0,
    "why": "De to grønne forbindelser samles i den fælles boks med § 40.",
    "feedback": [
      "Rigtigt.",
      "§ 2 er ikke den note, der forbindes med boksen nederst.",
      "Du skal også have forbindelsen fra § 6 med."
    ],
    "remember": "To forbindelser, én fælles boks.",
    "region": "claim"
  },
  {
    "id": "m24",
    "category": "model",
    "kind": "claim",
    "text": "Du har tegnet § 4 og § 6, men mangler den fælles boks nederst til højre. Hvad skal du tilføje?",
    "options": [
      "Pligtmæssig reklamation – § 40",
      "TG sender tilbud",
      "Den legale acceptfrist – § 3"
    ],
    "correct": 0,
    "why": "Boksen afslutter de to forbindelser fra forsinkelse og uoverensstemmende.",
    "feedback": [
      "Rigtigt.",
      "TG hører til startpunktet øverst til venstre.",
      "§ 3 står til højre i fristafsnittet, ikke i den nederste fælles boks."
    ],
    "remember": "Slut sidens noter med forbindelsen til § 40.",
    "region": "claim"
  },
  {
    "id": "b01",
    "category": "concepts",
    "kind": "read",
    "text": "Hvad er den bedste forklaring på et stiltiende løfte?",
    "options": [
      "Accept kan vises gennem handlinger uden et ja højt",
      "Man er bundet, så snart man er stille",
      "Man må aldrig tale, når man indgår en aftale"
    ],
    "correct": 0,
    "why": "Det er adfærden, der viser viljen til at indgå aftalen.",
    "feedback": [
      "Rigtigt.",
      "Tavshed alene er normalt ikke et ja. Der skal være noget, som viser accepten.",
      "Stiltiende beskriver én måde at vise accept på; man må selvfølgelig også tale."
    ],
    "remember": "Uden ord kan stadig være med en tydelig handling.",
    "example": "Du betaler for en vare ved kassen uden at sige ja."
  },
  {
    "id": "b02",
    "category": "concepts",
    "kind": "read",
    "text": "Du køber og betaler for en bolle uden at sige noget. Hvorfor kan der alligevel være en aftale?",
    "options": [
      "Dine handlinger viser, at du vil købe",
      "Fordi alle stille mennesker er bundet",
      "Fordi butikken frit kan binde dig"
    ],
    "correct": 0,
    "why": "Du udtrykker accept ved det, du gør.",
    "feedback": [
      "Rigtigt.",
      "Det er din købshandling og betaling, ikke stilheden, der viser accept.",
      "Butikken kan ikke alene bestemme, at enhver tavshed er et køb."
    ],
    "remember": "Se på handlingen, ikke kun på ordene."
  },
  {
    "id": "b03",
    "category": "concepts",
    "kind": "read",
    "text": "En sælger skriver: \"Hvis du ikke svarer, har du sagt ja.\" Du foretager dig intet. Er tavsheden normalt nok?",
    "options": [
      "Nej, manglende svar er normalt ikke i sig selv accept",
      "Ja, sælgerens besked er nok",
      "Ja, men kun hvis beskeden er skriftlig"
    ],
    "correct": 0,
    "why": "Man kan normalt ikke gøre en anden til køber alene ved at erklære personens tavshed for et ja.",
    "feedback": [
      "Rigtigt.",
      "Sælgerens eget udsagn skaber ikke i sig selv din accept.",
      "Skrift ændrer ikke manglende accept til et ja."
    ],
    "remember": "Stiltiende adfærd og ren passivitet skal holdes adskilt."
  },
  {
    "id": "b04",
    "category": "concepts",
    "kind": "giver",
    "text": "Kan en aftale være bindende, selv om den kun er mundtlig?",
    "options": [
      "Ja, som udgangspunkt",
      "Nej, der skal altid være en underskrift",
      "Nej, kun en mail kan være bindende"
    ],
    "correct": 0,
    "why": "Parter kan indgå en aftale ved tale. Der kan dog gælde særlige formkrav for bestemte aftaler.",
    "feedback": [
      "Rigtigt.",
      "En underskrift er ikke et generelt krav til alle aftaler.",
      "Aftaler er ikke generelt begrænset til mail eller andre skriftlige former."
    ],
    "remember": "Aftalens indhold og aftaleindgåelsen er afgørende; papir er ikke altid et krav."
  },
  {
    "id": "b05",
    "category": "concepts",
    "kind": "giver",
    "text": "Hvorfor er det ofte klogt at skrive en aftale ned?",
    "options": [
      "Det gør det lettere at bevise, hvad der er aftalt",
      "Fordi enhver mundtlig aftale er ugyldig",
      "Fordi enhver skrevet besked automatisk er en aftale"
    ],
    "correct": 0,
    "why": "Skrift kan dokumentere fx pris og andre vilkår.",
    "feedback": [
      "Rigtigt.",
      "Mundtlige aftaler kan være bindende, men beviset kan være sværere.",
      "En besked kan også være et spørgsmål eller en forhandling."
    ],
    "remember": "Bindende og let at bevise er to forskellige ting."
  },
  {
    "id": "b06",
    "category": "concepts",
    "kind": "giver",
    "text": "En køber spørger på skrift: \"Hvad koster cyklen?\" Er det i sig selv en købsaftale?",
    "options": [
      "Nej, det er en forespørgsel",
      "Ja, fordi det er skrevet ned",
      "Ja, fordi ordet cykel er nævnt"
    ],
    "correct": 0,
    "why": "At spørge om prisen viser ikke i sig selv, at køberen accepterer et køb.",
    "feedback": [
      "Rigtigt.",
      "Skriftlig form gør ikke enhver besked til en aftale.",
      "Man kan tale om en vare uden at forpligte sig til at købe den."
    ],
    "remember": "Spørgsmål er ikke det samme som accept."
  },
  {
    "id": "b07",
    "category": "concepts",
    "kind": "giver",
    "text": "Hvad er et juridisk løfte?",
    "options": [
      "En erklæring om, at man påtager sig en pligt",
      "Kun et spørgsmål om, hvad noget koster",
      "Et navn på transporttiden"
    ],
    "correct": 0,
    "why": "Løftet handler om, at afgiveren forpligter sig over for en anden.",
    "feedback": [
      "Rigtigt.",
      "Et spørgsmål er ikke i sig selv en påtaget pligt.",
      "Løfte er et begreb om en erklæring, ikke et tidsforløb."
    ],
    "remember": "Løfte: Hvad forpligter jeg mig til?"
  },
  {
    "id": "b08",
    "category": "concepts",
    "kind": "giver",
    "text": "Hvilken besked er et konkret tilbud i cykeleksemplet?",
    "options": [
      "\"Du kan købe min cykel for 500 kr.\"",
      "\"Hvad koster cyklen?\"",
      "\"Jeg kigger måske på cykler.\""
    ],
    "correct": 0,
    "why": "Beskeden fremsætter et bestemt forslag, som den anden kan acceptere.",
    "feedback": [
      "Rigtigt.",
      "Det er et spørgsmål om prisen, ikke et salgsforslag.",
      "Det udtrykker interesse, men ikke et konkret forslag til en aftale."
    ],
    "remember": "Tilbud = et bestemt forslag på bestemte vilkår."
  },
  {
    "id": "b09",
    "category": "concepts",
    "kind": "recipient",
    "text": "Tilbuddet lyder på en cykel til 500 kr. Hvilket svar er en ren accept?",
    "options": [
      "\"Ja, jeg køber den for 500 kr.\"",
      "\"Ja, hvis du sænker prisen til 400 kr.\"",
      "\"Hvilken farve har den?\""
    ],
    "correct": 0,
    "why": "Svaret siger ja til den tilbudte pris.",
    "feedback": [
      "Rigtigt.",
      "Prisen ændres. Det er derfor ikke et ja til tilbuddet, som det er.",
      "Det er et spørgsmål, ikke et ja til købet."
    ],
    "remember": "Accept = ja til de tilbudte vilkår."
  },
  {
    "id": "b10",
    "category": "concepts",
    "kind": "recipient",
    "text": "Hvad er forskellen på tilbud og accept?",
    "options": [
      "Tilbud er forslaget; accept er et ja til forslaget",
      "De betyder præcis det samme",
      "Accept er kun et andet ord for en kvittering"
    ],
    "correct": 0,
    "why": "Begreberne beskriver hver sin del af aftaleindgåelsen.",
    "feedback": [
      "Rigtigt.",
      "Så overser du forskellen på at foreslå og at sige ja.",
      "Accept handler om tilslutning til tilbuddet, ikke blot om en kvittering."
    ],
    "remember": "Forslag → ja til forslaget."
  },
  {
    "id": "b11",
    "category": "concepts",
    "kind": "claim",
    "text": "Hvad er et påbud i aftaleretten?",
    "options": [
      "En meddelelse, der kan få retsvirkning for modtageren uden et nyt ja",
      "En besked, som altid kræver modtagerens nye accept",
      "En ret til at bestemme alt over enhver"
    ],
    "correct": 0,
    "why": "Afsenderen skal have ret til at give meddelelsen; et gyldigt påbud afhænger ikke af et nyt ja fra modtageren.",
    "feedback": [
      "Rigtigt.",
      "Det ville overse, at et gyldigt påbud netop kan virke uden et nyt ja.",
      "Et påbud kræver et retligt grundlag; ordet giver ikke ubegrænset magt."
    ],
    "remember": "Påbud er en aftaleretlig meddelelse, ikke fri magt over andre."
  },
  {
    "id": "b12",
    "category": "concepts",
    "kind": "claim",
    "text": "Hvilket eksempel illustrerer et påbud?",
    "options": [
      "En gyldig opsigelse efter et abonnements opsigelsesregler",
      "En forespørgsel om butikkens åbningstid",
      "Et forslag om at købe en cykel"
    ],
    "correct": 0,
    "why": "En sådan opsigelse kan få betydning uden, at virksomheden først accepterer den.",
    "feedback": [
      "Rigtigt.",
      "Det er blot en forespørgsel, ikke en meddelelse med denne retsvirkning.",
      "Det er et tilbud, som den anden kan tage stilling til."
    ],
    "remember": "Opsigelse er et eksempel, når reglerne for den er opfyldt."
  },
  {
    "id": "b13",
    "category": "concepts",
    "kind": "claim",
    "text": "Hvornår får et påbud som udgangspunkt virkning?",
    "options": [
      "Når det er kommet frem til modtageren",
      "Kun når modtageren siger ja",
      "Så snart afsenderen tænker på det"
    ],
    "correct": 0,
    "why": "For påbud er fremkomsten det centrale tidspunkt.",
    "feedback": [
      "Rigtigt.",
      "Et gyldigt påbud kræver ikke et nyt ja fra modtageren.",
      "En uudtrykt tanke er ikke en meddelelse, der er kommet frem."
    ],
    "remember": "Påbud → kommet frem."
  },
  {
    "id": "b14",
    "category": "concepts",
    "kind": "time",
    "text": "Hvilken kobling mellem de fire ord er rigtig?",
    "options": [
      "Løfte: pligt · tilbud: forslag · accept: ja · påbud: meddelelse med retsvirkning",
      "Løfte: spørgsmål · tilbud: ja · accept: transport",
      "Alle fire ord betyder blot aftale"
    ],
    "correct": 0,
    "why": "Hvert ord hjælper dig med at beskrive en bestemt handling eller erklæring.",
    "feedback": [
      "Rigtigt.",
      "Her er ordenes forskellige funktioner byttet rundt.",
      "Du skal kunne skelne ordene og forklare deres funktioner."
    ],
    "remember": "Forklar ordene – nøjes ikke med at remse dem op."
  },
  {
    "id": "b15",
    "category": "concepts",
    "kind": "giver",
    "text": "Sælger lover at levere cyklen; køber lover at betale. Hvad viser det?",
    "options": [
      "Begge kan påtage sig pligter i aftalen",
      "Kun sælgeren kan afgive et løfte",
      "Ingen behøver at gøre det aftalte"
    ],
    "correct": 0,
    "why": "Et løfte handler om, hvad den pågældende part forpligter sig til.",
    "feedback": [
      "Rigtigt.",
      "Køberen kan også love at opfylde sin del, fx at betale.",
      "At påtage sig en pligt er netop mere end løs snak."
    ],
    "remember": "Spørg efter hver parts pligt."
  },
  {
    "id": "b16",
    "category": "concepts",
    "kind": "giver",
    "text": "Hvilken forklaring undgår misforståelsen om mundtlige aftaler?",
    "options": [
      "De kan være bindende, selv om de kan være sværere at bevise",
      "De kan aldrig bruges, fordi de ikke kan ses",
      "Alt, der bliver sagt, er automatisk en aftale"
    ],
    "correct": 0,
    "why": "Gyldig aftale og dokumentation er forskellige spørgsmål.",
    "feedback": [
      "Rigtigt.",
      "At en aftale ikke er skrevet, gør den ikke automatisk ugyldig.",
      "En samtale kan også være spørgsmål, overvejelser eller forhandling."
    ],
    "remember": "Mundtligt betyder ikke automatisk ubindende."
  },
  {
    "id": "b17",
    "category": "concepts",
    "kind": "recipient",
    "text": "Sælger tilbyder 500 kr. Køber svarer 400 kr. Hvorfor er det ikke en ren accept?",
    "options": [
      "Svaret ændrer et vilkår, nemlig prisen",
      "Fordi svaret er mundtligt",
      "Fordi accept altid skal være en underskrift"
    ],
    "correct": 0,
    "why": "Køberen har foreslået noget andet end tilbuddet.",
    "feedback": [
      "Rigtigt.",
      "Mundtlig form forhindrer ikke i sig selv accept.",
      "Accept er ikke generelt begrænset til en underskrift."
    ],
    "remember": "Se på vilkårene, ikke kun formen."
  },
  {
    "id": "b18",
    "category": "concepts",
    "kind": "read",
    "text": "Hvad skal du først se efter, når nogen siger: \"Der blev ikke sagt noget\"?",
    "options": [
      "Om handlingerne alligevel tydeligt viste accept",
      "Kun om personen var helt stille",
      "Om der fandtes en printer"
    ],
    "correct": 0,
    "why": "Fravær af ord fortæller ikke alene, om en aftale blev indgået.",
    "feedback": [
      "Rigtigt.",
      "Stilheden alene afgør ikke, om adfærden udtrykte accept.",
      "En printer siger ikke noget om parternes handlinger eller enighed."
    ],
    "remember": "Se efter ord, handlinger og det, parterne blev enige om."
  }
];
  const overviewText = "Tilbudsgiver sender tilbuddet. Tilbudsmodtager modtager det og sender senere en accept tilbage som acceptant. Nederst til venstre på tavlen står bindende aftale. Tavlen viser også tidsforløb, frister, tilbagekaldelse og afvigelser.";
  function el(tag, className = "", text) {
    const n = document.createElement(tag);
    n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function shuffled(a) {
    const out = [...a];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function iconMarkup(kind) {
    return '<svg class="semantic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[kind] || ICONS.speaker) + '</svg>';
  }
  function iconNode(kind) {
    const n = el("span", "semantic-symbol");
    n.innerHTML = iconMarkup(kind);
    n.setAttribute("aria-hidden", "true");
    return n;
  }
  function tag(kind) {
    const n = el("span", "semantic-tag");
    n.dataset.kind = kind;
    n.append(iconNode(kind), document.createTextNode(TYPES[kind].label));
    return n;
  }
  function audioButton(title, callback) {
    const b = el("button", "sound-button");
    b.type = "button";
    b.setAttribute("aria-label", "Læs " + title + " op");
    b.innerHTML = iconMarkup("speaker");
    b.addEventListener("click", callback);
    return b;
  }
  function escapeXml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;"
    })[c]);
  }
  let toastTimer;
  function toast(message) {
    $("#toast").textContent = message;
    $("#toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#toast").hidden = true, 4200);
  }

  // Nye opgaver får ny fremgang. Den gamle versions data overskrives ikke.
  const state = {
    version: MODEL_VERSION,
    theme: "system",
    practiceScope: "both",
    known: [],
    difficulties: {},
    results: [],
    best: {
      build: 0,
      draw: 0
    }
  };
  let storageWarning = false;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && saved.version === MODEL_VERSION) {
      if (["system", "light", "dark"].includes(saved.theme)) state.theme = saved.theme;
      if (["model","concepts","both"].includes(saved.practiceScope)) state.practiceScope = saved.practiceScope;
      if (Array.isArray(saved.known)) state.known = saved.known.filter(id => flashById.has(id));
      if (saved.difficulties && typeof saved.difficulties === "object") for (const c of flashcards) {
        const v = saved.difficulties[c.id];
        if (Number.isFinite(v)) state.difficulties[c.id] = Math.min(6, Math.max(1, v));
      }
      if (Array.isArray(saved.results)) state.results = saved.results.filter(r => r && r.version === MODEL_VERSION && ["build", "draw"].includes(r.mode) && Number.isInteger(r.score) && r.score >= 0 && r.score <= 100 && Number.isFinite(r.time)).slice(-20);
      for (const r of state.results) state.best[r.mode] = Math.max(state.best[r.mode], r.score);
      if (saved.best) for (const k of ["build", "draw"]) {
        if (Number.isInteger(saved.best[k]) && saved.best[k] >= 0 && saved.best[k] <= 100) state.best[k] = Math.max(state.best[k], saved.best[k]);
      }
    } else {
      const old = JSON.parse(localStorage.getItem("aftalemodellen.v1") || "null");
      if (old && ["system", "light", "dark"].includes(old.theme)) state.theme = old.theme;
    }
  } catch {
    storageWarning = true;
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      if (!storageWarning) {
        storageWarning = true;
        toast("Browseren kan ikke gemme lige nu. Du kan fortsætte med at øve.");
      }
    }
  }
  let currentPoint = 0,
    modelTimer = 0,
    playRunning = false,
    pictureZoom = 1,
    pngUrl = "";
  function themeIsDark() {
    return state.theme === "dark" || state.theme === "system" && system.matches;
  }
  function applyTheme() {
    document.documentElement.dataset.theme = themeIsDark() ? "dark" : "light";
    const name = {
      system: "Automatisk",
      light: "Lys",
      dark: "Mørk"
    }[state.theme];
    $("#themeToggle").setAttribute("aria-label", "Tema: " + name + ". Skift tema");
    $("#themeToggle").title = "Tema: " + name;
    refreshGraphics();
  }
  $("#themeToggle").addEventListener("click", () => {
    state.theme = {
      system: "light",
      light: "dark",
      dark: "system"
    }[state.theme];
    save();
    applyTheme();
  });
  system.addEventListener?.("change", () => {
    if (state.theme === "system") applyTheme();
  });

  // Originalbilledet vises uændret. SVG bruges kun til ramme og fokusmarkering.
  const MODEL_REGIONS = {
  "send": [
    32,
    104,
    250,
    236
  ],
  "outbound": [
    276,
    150,
    496,
    104
  ],
  "receive": [
    770,
    112,
    370,
    220
  ],
  "thinking": [
    862,
    317,
    141,
    286
  ],
  "accept": [
    800,
    596,
    280,
    241
  ],
  "return": [
    287,
    648,
    520,
    115
  ],
  "binding": [
    30,
    587,
    270,
    252
  ],
  "withdraw": [
    85,
    381,
    751,
    150
  ],
  "fixed": [
    1020,
    366,
    453,
    67
  ],
  "legal": [
    1012,
    437,
    502,
    158
  ],
  "late": [
    70,
    854,
    661,
    73
  ],
  "different": [
    68,
    929,
    720,
    66
  ],
  "claim": [
    909,
    867,
    573,
    126
  ],
  "exceptions": [
    65,
    846,
    741,
    150
  ]
};
  function modelSvg(forceLight = false, prefix = "model", selected = -1, animate = false) {
    const key = typeof selected === "string" ? selected : ["send","receive","accept","binding"][selected];
    const region = MODEL_REGIONS[key];
    const description = "TG sender tilbud til TM gennem fremsendelsestiden. Hos TM følger betænkningstid. TM er acceptant og sender accept tilbage gennem tilbagesendelsestiden til bindende aftale. Kuverten viser brevsprækkeøjeblikket: meddelelsen er modtaget. Øjet viser kundskabsøjeblikket: meddelelsen er læst. Tilbagekaldelse af tilbud/accept skal ske inden kundskabsøjeblikket. AFTL paragraf 2: fast frist. Paragraf 3: den legale acceptfrist med rimelig betænkningstid samt frem- og tilbagesendelsestid. Forsinkelse: paragraf 4, nyt tilbud. Uoverensstemmende: paragraf 6, modbud. Begge forbindes med pligtmæssig reklamation, paragraf 40.";
    let svg = `<svg class="model-svg original-model" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1024" role="img" aria-labelledby="${prefix}-title ${prefix}-desc"><title id="${prefix}-title">Dit whiteboardbillede af aftalemodellen</title><desc id="${prefix}-desc">${escapeXml(description)}</desc><image href="${MODEL_IMAGE}" x="0" y="0" width="1536" height="1024"/>`;
    if (region) {
      const [x,y,w,h]=region;
      svg += `<defs><mask id="${prefix}-spotlight"><rect width="1536" height="1024" fill="white"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="black"/></mask></defs><rect width="1536" height="1024" fill="#13203b" opacity="0.2" mask="url(#${prefix}-spotlight)"/><rect class="photo-focus${animate?" is-playing":""}" x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="none" stroke="#6547d8" stroke-width="7"/>`;
    }
    return svg+"</svg>";
  }
  function refreshGraphics() {
    $("#modelGraphic").innerHTML = modelSvg(false, "main", playRunning ? currentPoint : -1, playRunning && !motion.matches);
    $("#answerGraphic").innerHTML = modelSvg(false, "answer");
    if ($("#graphicDialog").open) $("#zoomGraphicContent").innerHTML = modelSvg(false, "zoom");
    if ($("#presentDialog").open) renderSlide();
  }

  // Kort, begreber og huskehjælp dannes af de samme kildetekster.
  function renderLearningContent() {
    const symbolRows = $$("#symbolComparison tbody tr");
    for (const [index, kind] of ["received", "read"].entries()) {
      const cell = symbolRows[index]?.querySelector("td");
      if (cell) cell.replaceChildren(
        el("strong", "", TYPES[kind].label),
        el("p", "quiet", kind === "received" ? "Modtaget" : "Læst")
      );
    }
    for (const [kind, type] of Object.entries(TYPES)) {
      const item = el("div", "legend-item");
      item.dataset.kind = kind;
      const copy = el("div");
      copy.append(el("strong", "", type.label), el("small", "", type.hint));
      item.append(iconNode(kind), copy);
      $("#semanticLegend").append(item);
    }
    for (const t of times) {
      const card = el("article", "time-card reveal");
      card.id = "time-" + t.id;
      card.dataset.kind = t.kind;
      card.append(tag(t.kind), el("h3", "", t.title), el("p", "", t.text), audioButton(t.title, () => readOne(t.title, t.text, card)));
      $("#timeCards").append(card);
    }
    for (const c of concepts) {
      const details = el("details", "concept");
      details.id = "concept-" + c.id;
      details.dataset.kind = c.kind;
      const summary = el("summary");
      summary.append(iconNode(c.kind), document.createTextNode(c.title));
      const body = el("div", "concept-body");
      body.append(el("span","concept-source",c.category==="concepts"?"GRUNDBEGREB":"FRA MODELLEN"),el("p","concept-definition",c.text));
      if (c.items) {
        const words=el("dl","word-grid");
        for (const [word,meaning] of c.items) { const group=el("div"); group.append(el("dt","",word),el("dd","",meaning)); words.append(group); }
        body.append(words);
      }
      if (c.example) { const example=el("div","concept-example"); example.append(el("strong","","Et eksempel"),el("p","",c.example)); body.append(example); }
      if (c.remember) { const remember=el("div","concept-remember"); remember.append(el("strong","","Det skal du huske"),el("p","",c.remember)); body.append(remember); }
      body.append(audioButton(c.title,()=>readOne(c.title,conceptSpeech(c),details)));
      details.open=c.id==="silent";
      details.append(summary, body);
      $("#concepts").append(details);
    }
    for (const m of memories) {
      const card = el("article", "memory-card reveal");
      card.id = "memory-" + m.id;
      card.dataset.kind = m.kind;
      card.append(tag(m.kind), el("h3", "", m.title));
      if (m.list) {
        const list = el("ol");
        m.list.forEach(x => list.append(el("li", "", x)));
        card.append(list);
      } else card.append(el("p", "", m.text));
      card.append(audioButton(m.title, () => readOne(m.title, m.text || m.list.join(" "), card)));
      $("#memoryCards").append(card);
    }
    teacherQuestions.forEach(([q, a], i) => {
      const details = el("details", "concept");
      details.id = "teacher-" + i;
      const summary = el("summary", "", q);
      const body = el("div", "concept-body");
      body.append(el("p", "", a), audioButton(q, () => readOne(q, a, details)));
      details.append(summary, body);
      $("#teacherQuestions").append(details);
    });
    notes.forEach(n => $("#answerNotes").append(el("p", "", n.title + ": " + n.text)));
    parts.forEach((p, i) => {
      const label = el("label", "check-row");
      const input = el("input");
      input.type = "checkbox";
      input.dataset.partCheck = p.id;
      label.append(input, document.createTextNode((i < 7 ? "Forløb " + (i + 1) : "Note " + (i - 6)) + ": " + p.label));
      $("#drawingChecklist").append(label);
    });
    $$("[data-icon]").forEach(n => {
      n.innerHTML = iconMarkup(n.dataset.icon);
      n.setAttribute("aria-hidden", "true");
    });
    $$(".sound-button[data-read]").forEach(b => b.innerHTML = iconMarkup("speaker"));
  }
  function selectPoint(i, focus = false) {
    currentPoint = Math.max(0, Math.min(points.length - 1, i));
    const p = points[currentPoint];
    $$(".timeline-card").forEach((b, n) => b.setAttribute("aria-pressed", String(n === currentPoint)));
    $("#stepCategory").textContent = TYPES[p.kind].label;
    $("#stepCategory").dataset.kind = p.kind;
    $("#stepCounter").textContent = currentPoint + 1 + " / " + points.length;
    $("#stepTitle").textContent = p.title;
    $("#stepExplanation").textContent = p.text;
    $("#stepNote").textContent = p.note;
    $("#stepIcon").innerHTML = iconMarkup(p.kind);
    $("#modelDetail").dataset.kind = p.kind;
    $("#previousStep").disabled = currentPoint === 0;
    refreshGraphics();
    if (focus) $$(".timeline-card")[currentPoint].focus();
  }
  function stopModel() {
    const wasRunning = playRunning;
    clearInterval(modelTimer);
    modelTimer = 0;
    playRunning = false;
    $("#playModel").setAttribute("aria-pressed", "false");
    $("#playModel").textContent = "▷ Afspil modellen";
    if (wasRunning) refreshGraphics();
  }
  function startModel() {
    stopModel();
    playRunning = true;
    selectPoint(0);
    $("#playModel").textContent = "Ⅱ Stop afspilning";
    $("#playModel").setAttribute("aria-pressed", "true");
    modelTimer = setInterval(() => {
      if (currentPoint < points.length - 1) selectPoint(currentPoint + 1);else stopModel();
    }, 2600);
  }
  points.forEach((p, i) => {
    const b = el("button", "timeline-card");
    b.type = "button";
    b.dataset.kind = p.kind;
    b.setAttribute("aria-label", p.title + ". " + p.location);
    b.append(el("span", "step-number", String(i + 1)));
    const label = el("span");
    label.append(el("strong", "", p.title), el("small", "", p.location));
    b.append(label);
    b.addEventListener("click", () => {
      stopModel();
      selectPoint(i);
    });
    b.addEventListener("keydown", e => {
      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        stopModel();
        selectPoint(e.key === "Home" ? 0 : e.key === "End" ? 3 : (i + (["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : 3)) % 4, true);
      }
    });
    $("#timeline").append(b);
  });
  $("#previousStep").addEventListener("click", () => {
    stopModel();
    selectPoint(currentPoint - 1);
  });
  $("#nextStep").addEventListener("click", () => {
    stopModel();
    selectPoint((currentPoint + 1) % 4);
  });
  $("#playModel").addEventListener("click", () => playRunning ? stopModel() : startModel());
  $("#listenCurrentStep").innerHTML = iconMarkup("speaker");
  $("#listenCurrentStep").addEventListener("click", () => {
    stopModel();
    const p = points[currentPoint];
    readOne(p.title, p.text + " " + p.note, $("#modelDetail"));
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopModel();
  });

  // Flashcards: forkert besvarede kort indsættes igen efter to andre kort.
  const known = new Set(state.known);
  let flashQueue = [],
    flashHistory = [],
    flashPosition = 0,
    flipped = false,
    swipeStart = null,
    suppressFlashClick = 0;
  function refillFlash() {
    const cards = selectedCards();
    const remaining = cards.filter(c => !known.has(c.id));
    const pool = remaining.length ? remaining : cards;
    flashQueue = shuffled(pool.flatMap(c => Array.from({
      length: Math.min(3, state.difficulties[c.id] || 1)
    }, () => c.id)));
  }
  function pickFlash() {
    if (!flashQueue.length) refillFlash();
    let candidate = flashQueue.shift();
    const current = flashHistory[flashPosition];
    if (candidate === current && flashQueue.length) {
      flashQueue.push(candidate);
      candidate = flashQueue.shift();
    }
    return candidate;
  }
  function setFlipped(value) {
    flipped = value;
    $("#flashCard").classList.toggle("is-flipped", value);
    $("#flashCard").setAttribute("aria-pressed", String(value));
    $(".flash-front").setAttribute("aria-hidden", String(value));
    $(".flash-back").setAttribute("aria-hidden", String(!value));
    $("#flashAgain").disabled = !value;
    $("#flashKnown").disabled = !value;
    const c = flashById.get(flashHistory[flashPosition]);
    if (c) $("#flashCard").setAttribute("aria-label", (value ? "Svar: " + c.answer : "Spørgsmål: " + c.question) + " Tryk for at vende.");
  }
  function renderFlash() {
    $("#flashCard").classList.add("is-switching");
    const c = flashById.get(flashHistory[flashPosition]);
    $("#flashTopic").textContent = c.topic;
    $("#flashQuestion").textContent = c.question;
    $("#flashAnswer").textContent = c.answer;
    $("#flashSemantics").replaceChildren(tag(c.kind));
    const cards = selectedCards(), done = cards.filter(c=>known.has(c.id)).length;
    $("#flashKnownCount").textContent = String(done);
    $("#flashTotal").textContent = String(cards.length);
    $("#flashProgress").max = cards.length;
    $("#flashProgress").value = done;
    $("#flashQueueLabel").textContent = done === cards.length ? "Alle kort klaret · klar til repetition" : "Ét kort ad gangen";
    $("#previousFlash").disabled = flashPosition === 0;
    setFlipped(false);
    // Anvend forsiden før nyt indhold fades ind, så svaret ikke blinker frem.
    void $("#flashCard").offsetWidth;
    requestAnimationFrame(()=>{$("#flashCard").classList.remove("is-switching");animatePanel($("#flashCard"),7);});
  }
  function nextFlash() {
    if (flashPosition < flashHistory.length - 1) flashPosition++;else {
      flashHistory.push(pickFlash());
      flashPosition = flashHistory.length - 1;
    }
    renderFlash();
  }
  function restartFlash() {
    refillFlash();
    flashHistory = [flashQueue.shift()];
    flashPosition = 0;
    renderFlash();
  }
  function rateFlash(could) {
    if (!flipped) return;
    const id = flashHistory[flashPosition];
    flashQueue = flashQueue.filter(x => x !== id);
    if (could) {
      known.add(id);
      delete state.difficulties[id];
    } else {
      known.delete(id);
      state.difficulties[id] = Math.min(6, (state.difficulties[id] || 1) + 1);
      flashQueue.splice(Math.min(2, flashQueue.length), 0, id);
    }
    state.known = [...known];
    save();
    nextFlash();
  }
  $("#flashCard").addEventListener("click", () => {
    if (Date.now() > suppressFlashClick) setFlipped(!flipped);
  });
  $("#previousFlash").addEventListener("click", () => {
    if (flashPosition > 0) {
      flashPosition--;
      renderFlash();
    }
  });
  $("#nextFlash").addEventListener("click", nextFlash);
  $("#flashAgain").addEventListener("click", () => rateFlash(false));
  $("#flashKnown").addEventListener("click", () => rateFlash(true));
  $("#shuffleFlash").addEventListener("click", () => {
    restartFlash();
    toast("Kortene er blandet. Din fremgang er gemt.");
  });
  $("#resetFlash").addEventListener("click", () => {
    for (const card of selectedCards()) { known.delete(card.id); delete state.difficulties[card.id]; }
    state.known = [...known];
    save();
    restartFlash();
    toast("Flashcard-fremgangen er nulstillet.");
  });
  $("#flashcards").addEventListener("keydown", e => {
    if (e.target.closest("[data-practice-scope]")) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextFlash();
    }
    if (e.key === "ArrowLeft" && flashPosition > 0) {
      e.preventDefault();
      flashPosition--;
      renderFlash();
    }
  });
  $("#flashCard").addEventListener("pointerdown", e => {
    if(e.pointerType!=="mouse")try{$("#flashCard").setPointerCapture(e.pointerId);}catch{}
    swipeStart = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId
    };
  });
  $("#flashCard").addEventListener("pointerup", e => {
    if (!swipeStart || swipeStart.id !== e.pointerId) return;
    const dx = e.clientX - swipeStart.x,
      dy = e.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      suppressFlashClick = Date.now() + 400;
      if (dx < 0) nextFlash();else if (flashPosition > 0) {
        flashPosition--;
        renderFlash();
      }
    }
  });
  $("#flashCard").addEventListener("pointercancel", () => swipeStart = null);
  $("#listenFlash").innerHTML = iconMarkup("speaker");
  $("#listenFlash").addEventListener("click", () => {
    const c = flashById.get(flashHistory[flashPosition]);
    readOne(flipped ? "Svaret" : c.question, flipped ? c.answer : c.question, $("#flashCard"));
  });

  // Quizzen låser hvert svar. Gennemgangen viser både eget og korrekt svar.
  let quizSet = [],
    questionIndex = 0,
    quizAnswers = [],
    questionLocked = false,
    wrongQuestions = [];
  // Skift nulstiller kun den aktuelle runde. Gemte kort og modelresultater bevares.
  function inScope(item) { return state.practiceScope === "both" || item.category === state.practiceScope; }
  function selectedCards() { return flashcards.filter(inScope); }
  function selectedQuestions() { return questions.filter(inScope); }
  function renderScope() {
    $$("[data-practice-scope]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.practiceScope===state.practiceScope)));
    const name = {model:"Modellen",concepts:"Begreber",both:"Begge dele"}[state.practiceScope];
    $$("[data-scope-summary]").forEach(n=>n.textContent=name+" · "+selectedCards().length+" kort · "+selectedQuestions().length+" spørgsmål");
    $("#quizTotal").textContent=String(selectedQuestions().length);
  }
  $$("[data-practice-scope]").forEach(button=>button.addEventListener("click",()=>{
    if (state.practiceScope===button.dataset.practiceScope) return;
    if (reader.playing||reader.paused) stopSpeech(false);
    state.practiceScope=button.dataset.practiceScope; save(); renderScope(); restartFlash(); beginQuiz(selectedQuestions());
    toast("Kategorien er skiftet. En ny, blandet runde er klar.");
  }));
  // Både spørgsmålsrækkefølge og svarrækkefølge blandes ved hver ny runde.
  function shuffleQuestion(question) {
    const order = shuffled(question.options.map((_,i)=>i));
    return {...question,options:order.map(i=>question.options[i]),feedback:order.map(i=>question.feedback[i]),correct:order.indexOf(question.correct)};
  }
  function beginQuiz(items, focus = false) {
    quizSet = shuffled(items).map(shuffleQuestion);
    questionIndex = 0;
    quizAnswers = [];
    questionLocked = false;
    $("#quizResult").hidden = true;
    $("#quizQuestionPanel").hidden = false;
    renderQuestion(focus);
  }
  function renderQuestion(focus = false) {
    const q = quizSet[questionIndex];
    questionLocked = false;
    $("#questionCounter").textContent = "SPØRGSMÅL " + (questionIndex + 1) + " / " + quizSet.length;
    $("#liveScore").textContent = quizAnswers.filter(a => a.correct).length + " rigtige";
    $("#quizProgress").max = quizSet.length;
    $("#quizProgress").value = questionIndex;
    $("#quizQuestion").textContent = q.text;
    $("#quizSemantics").replaceChildren(tag(q.kind),el("span","quiz-category",q.category==="model"?"MODELLEN":"BEGREBER"));
    $("#quizOptions").replaceChildren();
    q.options.forEach((option, i) => {
      const b = el("button", "quiz-option");
      b.type = "button";
      b.append(el("span", "option-letter", String.fromCharCode(65 + i)), el("span", "", option));
      b.addEventListener("click", () => answerQuestion(i));
      $("#quizOptions").append(b);
    });
    $("#quizFeedback").className = "quiz-feedback";
    $("#quizFeedback").textContent = "Vælg et svar. Du får både begrundelse og huskehjælp.";
    $("#nextQuestion").disabled = true;
    $("#nextQuestion").textContent = questionIndex === quizSet.length - 1 ? "Se resultat →" : "Næste spørgsmål →";
    animatePanel($("#quizQuestionPanel"));
    if (focus) {
      $("#quizQuestion").focus({preventScroll:true});
      mobileScroll($("#quizQuestionPanel"));
    }
  }
  function answerQuestion(index) {
    if (questionLocked) return;
    questionLocked = true;
    const q = quizSet[questionIndex],
      correct = index === q.correct;
    quizAnswers.push({
      q,
      index,
      correct
    });
    $("#quizProgress").value = questionIndex + 1;
    $("#liveScore").textContent = quizAnswers.filter(a => a.correct).length + " rigtige";
    $$(".quiz-option").forEach((b, i) => {
      b.disabled = true;
      if (i === q.correct) {
        b.classList.add("is-correct");
        b.append(el("span", "answer-mark", i === index ? "✓ Dit svar" : "✓ Rigtigt"));
      } else if (i === index) {
        b.classList.add("is-wrong");
        b.append(el("span", "answer-mark", "✕ Dit svar"));
      }
    });
    $("#quizFeedback").className = "quiz-feedback " + (correct ? "is-correct" : "is-wrong");
    const feedback = $("#quizFeedback");
    feedback.replaceChildren(el("strong","",correct?"✓ Rigtigt – sådan hænger det sammen":"✕ Lad os skille det ad"));
    if (!correct) {
      feedback.append(el("p","answer-context","Dit svar: "+q.options[index]));
      feedback.append(el("p","",q.feedback[index]));
    }
    feedback.append(el("p","correct-answer","Det rigtige svar: "+q.options[q.correct]));
    feedback.append(el("p","",q.why));
    if (q.example) feedback.append(el("p","feedback-example","Eksempel: "+q.example));
    feedback.append(el("p","feedback-memory","Husk: "+q.remember));
    if (q.category==="model") {
      const modelButton=el("button","button secondary small","Se det på billedet");
      modelButton.type="button";
      modelButton.addEventListener("click",()=>openGraphic(q.region));
      feedback.append(modelButton);
    } else {
      const explanation=el("a","button secondary small","Læs begrebet igen");
      const conceptMap={b01:"silent",b02:"silent",b03:"silent",b04:"form",b05:"form",b06:"offer",b07:"promise",b08:"offer",b09:"accept-word",b10:"four-words",b11:"order-word",b12:"order-word",b13:"order-word",b14:"four-words",b15:"promise",b16:"form",b17:"accept-word",b18:"silent"};
      explanation.href="#concept-"+conceptMap[q.id];
      explanation.addEventListener("click",()=>{$(explanation.hash).open=true;});
      feedback.append(explanation);
    }
    $("#nextQuestion").disabled = false;
    animatePanel(feedback,7);
    mobileScroll(feedback);
  }
  function countUp(node, goal, duration = 800) {
    const token = String(Math.random());
    node.dataset.animation = token;
    const start = performance.now();
    function tick(now) {
      if (node.dataset.animation !== token) return;
      const f = motion.matches ? 1 : Math.min(1, (now - start) / duration);
      node.textContent = String(Math.round(goal * (1 - Math.pow(1 - f, 3))));
      if (f < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function finishQuiz() {
    const score = quizAnswers.filter(a => a.correct).length;
    wrongQuestions = quizAnswers.filter(a => !a.correct).map(a => a.q);
    $("#quizQuestionPanel").hidden = true;
    $("#quizResult").hidden = false;
    countUp($("#quizResultNumber"), score);
    $("#quizResultText").textContent = "Du svarede rigtigt på " + score + " af " + quizSet.length + " spørgsmål. " + (wrongQuestions.length ? "Øv de forkerte igen, eller tag hele quizzen." : "Alle sammenhænge sad rigtigt denne gang.");
    $("#retryWrong").disabled = !wrongQuestions.length;
    $("#quizReview").replaceChildren();
    quizAnswers.forEach(a => {
      const item = el("article", "review-item");
      item.append(el("strong", "", (a.correct ? "✓ " : "✕ ") + a.q.text), el("p", "", "Dit svar: " + a.q.options[a.index]));
      if (!a.correct) item.append(el("p", "", "Rigtigt svar: " + a.q.options[a.q.correct]));
      item.append(el("p", "", a.q.why),el("p","","Husk: "+a.q.remember));
      if (!a.correct) item.append(el("p","",a.q.feedback[a.index]));
      $("#quizReview").append(item);
    });
  }
  $("#nextQuestion").addEventListener("click", () => {
    if (!questionLocked) return;
    if (questionIndex + 1 < quizSet.length) {
      questionIndex++;
      renderQuestion(true);
    } else finishQuiz();
  });
  $("#retryWrong").addEventListener("click", () => {
    if (wrongQuestions.length) beginQuiz(wrongQuestions, true);
  });
  $("#restartQuiz").addEventListener("click", () => beginQuiz(selectedQuestions(), true));
  $("#shuffleQuiz").addEventListener("click",()=>{beginQuiz(selectedQuestions(),true);toast("Spørgsmål og svar er blandet på ny.");});
  $("#listenQuiz").innerHTML = iconMarkup("speaker");
  $("#listenQuiz").addEventListener("click", () => {
    const q = quizSet[questionIndex];
    readOne(q.text, q.text + " " + q.options.map((o, i) => "Mulighed " + String.fromCharCode(65 + i) + ": " + o).join(". ") + (questionLocked ? ". " + q.why : ""), $("#quizQuestionPanel"));
  });
  renderScope();

  // Frihåndstegning gemmes som streger, så både fortryd og gendan virker.
  const canvas = $("#drawingCanvas"),
    ctx = canvas.getContext("2d");
  const CANVAS_W = 1200,
    CANVAS_H = 850;
  let strokes = [],
    undone = [],
    activeStroke = null,
    canvasFrame = 0,
    tool = "pen",
    penColor = "#1c263b",
    penSize = 3;
  function drawingControls() {
    $("#undoDrawing").disabled = !strokes.length;
    $("#redoDrawing").disabled = !undone.length;
    $("#clearDrawing").disabled = !strokes.length;
  }
  function renderCanvas() {
    canvasFrame = 0;
    const sx = canvas.width / CANVAS_W,
      sy = canvas.height / CANVAS_H;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    for (const s of strokes) {
      ctx.save();
      ctx.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const first = s.points[0];
      if (s.points.length === 1) {
        ctx.beginPath();
        ctx.arc(first.x, first.y, s.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  function scheduleCanvas() {
    if (!canvasFrame) canvasFrame = requestAnimationFrame(renderCanvas);
  }
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 3);
    const w = Math.round(rect.width * dpr),
      h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      renderCanvas();
    }
  }
  function pointFor(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * CANVAS_W,
      y: (e.clientY - r.top) / r.height * CANVAS_H
    };
  }
  canvas.addEventListener("pointerdown", e => {
    if (e.button !== 0 || activeStroke) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    activeStroke = {
      id: e.pointerId,
      tool,
      color: penColor,
      size: tool === "eraser" ? Math.max(22, penSize * 5) : penSize,
      points: [pointFor(e)]
    };
    strokes.push(activeStroke);
    undone = [];
    drawingControls();
    scheduleCanvas();
  });
  canvas.addEventListener("pointermove", e => {
    if (!activeStroke || activeStroke.id !== e.pointerId) return;
    e.preventDefault();
    const samples = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
    for (const sample of samples.length ? samples : [e]) activeStroke.points.push(pointFor(sample));
    scheduleCanvas();
  });
  function finishStroke(e) {
    if (!activeStroke || activeStroke.id !== e.pointerId) return;
    activeStroke = null;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    drawingControls();
    scheduleCanvas();
  }
  canvas.addEventListener("pointerup", finishStroke);
  canvas.addEventListener("pointercancel", finishStroke);
  canvas.addEventListener("lostpointercapture", () => {
    activeStroke = null;
    drawingControls();
  });
  function chooseTool(value) {
    tool = value;
    $("#penTool").setAttribute("aria-pressed", String(tool === "pen"));
    $("#eraserTool").setAttribute("aria-pressed", String(tool === "eraser"));
    canvas.style.cursor = tool === "pen" ? "crosshair" : "cell";
  }
  $("#penTool").addEventListener("click", () => chooseTool("pen"));
  $("#eraserTool").addEventListener("click", () => chooseTool("eraser"));
  const penChoices = [["Mørk pen", "#1c263b"], ["Tilbudsgiver", "#1d4ed8"], ["Tilbudsmodtager", "#a74b06"], ["Modtaget, kuvert", "#7331ce"], ["Læst, øje", "#16724c"], ["Tid og frister", "#795200"], ["Tilbagekaldelse", "#aa245d"]];
  penChoices.forEach(([name, color], i) => {
    const b = el("button", "color-swatch");
    b.type = "button";
    b.style.backgroundColor = color;
    b.dataset.penColor = color;
    b.setAttribute("aria-label", name);
    b.setAttribute("aria-pressed", String(i === 0));
    b.addEventListener("click", () => {
      penColor = color;
      chooseTool("pen");
      $$("[data-pen-color]").forEach(n => n.setAttribute("aria-pressed", String(n === b)));
      $("#customColor").value = color;
    });
    $("#penColors").append(b);
  });
  $("#customColor").addEventListener("input", e => {
    penColor = e.target.value;
    chooseTool("pen");
    $$("[data-pen-color]").forEach(b => b.setAttribute("aria-pressed", "false"));
  });
  $("#penSize").addEventListener("input", e => {
    penSize = Number(e.target.value);
    $("#penSizeValue").value = String(penSize);
  });
  function undoDrawing() {
    if (activeStroke) return;
    if (strokes.length) {
      undone.push(strokes.pop());
      drawingControls();
      scheduleCanvas();
    }
  }
  function redoDrawing() {
    if (activeStroke) return;
    if (undone.length) {
      strokes.push(undone.pop());
      drawingControls();
      scheduleCanvas();
    }
  }
  $("#undoDrawing").addEventListener("click", undoDrawing);
  $("#redoDrawing").addEventListener("click", redoDrawing);
  $("#clearDrawing").addEventListener("click", () => {
    if (strokes.length && confirm("Vil du rydde din tegning?")) {
      strokes = [];
      undone = [];
      activeStroke = null;
      drawingControls();
      scheduleCanvas();
    }
  });
  $("#drawPanel").addEventListener("keydown", e => {
    if (!(e.ctrlKey || e.metaKey) || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
    if (e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.shiftKey ? redoDrawing() : undoDrawing();
    } else if (e.key.toLowerCase() === "y") {
      e.preventDefault();
      redoDrawing();
    }
  });
  if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(canvas);else window.addEventListener("resize", resizeCanvas);

  // Byggetilstand: de første syv pladser er et forløb. Resten er sidetavlens noter.
  let mode = "draw",
    answerVisible = false,
    buildSlots = Array(parts.length).fill(null),
    selectedCard = null,
    bankOrder = shuffled(parts.map(p => p.id)),
    buildFeedback = false,
    drag = null,
    dragFrame = 0,
    buildClickSuppressed = 0;
  function showAnswer(value) {
    answerVisible = value;
    $("#answerPanel").hidden = !value;
    $(".exercise-layout").classList.toggle("has-answer", value);
    $("#toggleAnswer").textContent = value ? "Skjul facit" : "Vis facit";
    $("#toggleAnswer").setAttribute("aria-expanded", String(value));
    requestAnimationFrame(resizeCanvas);
  }
  function setMode(value, focus = false) {
    mode = value;
    for (const k of ["draw", "build"]) {
      $("#" + k + "Tab").setAttribute("aria-selected", String(value === k));
      $("#" + k + "Tab").tabIndex = value === k ? 0 : -1;
      $("#" + k + "Panel").hidden = value !== k;
    }
    $("#exerciseHint").textContent = value === "draw" ? "Din tegning og din tjekliste giver din selvvurdering." : "Placering, rækkefølge og symboler afgør din score.";
    $("#scorePanel").hidden = true;
    if (focus) $("#" + value + "Tab").focus();
    if (value === "draw") requestAnimationFrame(resizeCanvas);
  }
  $("#toggleAnswer").addEventListener("click", () => showAnswer(!answerVisible));
  for (const k of ["draw", "build"]) {
    $("#" + k + "Tab").addEventListener("click", () => setMode(k));
    $("#" + k + "Tab").addEventListener("keydown", e => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        setMode(e.key === "Home" ? "draw" : e.key === "End" ? "build" : k === "draw" ? "build" : "draw", true);
      }
    });
  }
  function makeBuildCard(id) {
    const p = partById.get(id);
    const wrap = el("div", "build-card-wrap");
    const b = el("button", "build-card");
    b.type = "button";
    b.dataset.part = id;
    b.dataset.kind = p.kind;
    b.setAttribute("aria-pressed", String(selectedCard === id));
    b.setAttribute("aria-label", p.label + ". Vælg kortet og derefter en plads.");
    b.append(iconNode(p.kind), el("span", "", p.label));
    wrap.append(b, audioButton(p.label, () => readOne(p.label, p.text, wrap)));
    return wrap;
  }
  function renderBuild() {
    const used = new Set(buildSlots.filter(Boolean));
    $("#buildBank").replaceChildren(...bankOrder.filter(id => !used.has(id)).map(makeBuildCard));
    if (used.size === parts.length) $("#buildBank").append(el("p", "quiet", "Alle kort er placeret. Du kan flytte dem igen."));
    $("#buildFlow").replaceChildren();
    $("#buildNotes").replaceChildren();
    parts.forEach((p, i) => {
      const slot = el("div", "build-slot");
      slot.dataset.index = String(i);
      const target = el("button", "slot-target");
      target.type = "button";
      target.dataset.slot = String(i);
      target.setAttribute("aria-label", (p.flow ? "Forløbsplads " + (i + 1) : "Noteplads " + (i - 6)) + ": " + p.slot + (buildSlots[i] ? ". Indeholder " + partById.get(buildSlots[i]).label : ". Tom plads"));
      target.append(el("strong", "", p.flow ? "PLADS " + (i + 1) : "NOTE " + (i - 6)), document.createTextNode(p.slot));
      slot.append(target);
      if (buildSlots[i]) {
        slot.append(makeBuildCard(buildSlots[i]));
        const remove = el("button", "remove-card", "Til kortbanken");
        remove.type = "button";
        remove.dataset.remove = String(i);
        remove.setAttribute("aria-label", "Flyt " + partById.get(buildSlots[i]).label + " til kortbanken");
        slot.append(remove);
      }
      if (buildFeedback) {
        const right = buildSlots[i] === p.id;
        slot.classList.add(right ? "is-correct" : "is-wrong");
        slot.append(el("span", "slot-feedback", right ? "✓ Rigtig plads" : buildSlots[i] ? "✕ Forkert plads" : "✕ Mangler"));
      }
      (p.flow ? $("#buildFlow") : $("#buildNotes")).append(slot);
    });
    updateSelection();
  }
  function updateSelection() {
    $$(".build-card").forEach(b => {
      const active = b.dataset.part === selectedCard;
      b.classList.toggle("is-selected", active);
      b.setAttribute("aria-pressed", String(active));
    });
    updateBuildSelectionHint();
  }
  function clearBuildFeedback() {
    buildFeedback = false;
    $("#scorePanel").hidden = true;
    $$(".build-slot").forEach(s => s.classList.remove("is-correct", "is-wrong"));
    $$(".slot-feedback").forEach(s => s.remove());
  }
  function placeCard(id, index, focus = false) {
    if (!partById.has(id) || index < 0 || index >= parts.length) return;
    const old = buildSlots.indexOf(id),
      displaced = buildSlots[index];
    if (old === index) return;
    if (old >= 0) buildSlots[old] = displaced;
    buildSlots[index] = id;
    selectedCard = null;
    clearBuildFeedback();
    renderBuild();
    $("#buildAnnouncement").textContent = partById.get(id).label + " er flyttet til " + (index < 7 ? "forløbsplads " + (index + 1) : "noteplads " + (index - 6)) + ".";
    if (focus) $('[data-slot="' + index + '"]').focus();
  }
  $("#buildPanel").addEventListener("click", e => {
    if (Date.now() < buildClickSuppressed) return;
    const c = e.target.closest("[data-part]");
    if (c) {
      selectedCard = selectedCard === c.dataset.part ? null : c.dataset.part;
      updateSelection();
      if(selectedCard)mobileScroll($("#mobileBuildSelection"));
      $("#buildAnnouncement").textContent = selectedCard ? "Valgt: " + partById.get(selectedCard).label + ". Vælg nu en plads." : "Valget er ophævet.";
      return;
    }
    const remove = e.target.closest("[data-remove]");
    if (remove) {
      const i = Number(remove.dataset.remove);
      buildSlots[i] = null;
      selectedCard = null;
      clearBuildFeedback();
      renderBuild();
      $("#buildAnnouncement").textContent = "Kortet er tilbage i kortbanken.";
      return;
    }
    const s = e.target.closest("[data-slot]");
    if (s) {
      if (selectedCard) placeCard(selectedCard, Number(s.dataset.slot), true);else $("#buildAnnouncement").textContent = "Vælg først et kort i kortbanken eller modellen.";
    }
  });
  $("#buildPanel").addEventListener("keydown", e => {
    if (e.key === "Escape") {
      selectedCard = null;
      updateSelection();
    }
  });
  $("#buildPanel").addEventListener("change", clearBuildFeedback);
  $("#resetBuild").addEventListener("click", () => {
    buildSlots.fill(null);
    selectedCard = null;
    bankOrder = shuffled(parts.map(p => p.id));
    $("#buildReceived").value = "";
    $("#buildRead").value = "";
    clearBuildFeedback();
    renderBuild();
    $("#buildAnnouncement").textContent = "Modellen er tømt, og kortene er blandet.";
  });

  // Pointer-drag virker med mus, touch og pen. Klik + plads er altid et alternativ.
  $("#buildPanel").addEventListener("pointerdown", e => {
    const b = e.target.closest(".build-card[data-part]");
    if (!b || e.button !== 0) return;
    drag = {
      id: b.dataset.part,
      pointer: e.pointerId,
      source: b,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      active: false,
      ghost: null
    };
  });
  function updateDrag() {
    if (!drag || !drag.active) {
      dragFrame = 0;
      return;
    }
    const edge = 65,
      h = innerHeight;
    if (drag.y < edge) scrollBy(0, -Math.min(14, (edge - drag.y) / 4));else if (drag.y > h - edge) scrollBy(0, Math.min(14, (drag.y - h + edge) / 4));
    const target = document.elementFromPoint(drag.x, drag.y)?.closest(".build-slot");
    $$(".build-slot.is-target").forEach(s => s.classList.remove("is-target"));
    if (target) target.classList.add("is-target");
    dragFrame = requestAnimationFrame(updateDrag);
  }
  document.addEventListener("pointermove", e => {
    if (!drag || drag.pointer !== e.pointerId) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (!drag.active && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 9) {
      drag.active = true;
      drag.source.classList.add("is-dragging");
      drag.ghost = drag.source.cloneNode(true);
      drag.ghost.classList.remove("is-dragging");
      drag.ghost.classList.add("drag-ghost");
      drag.ghost.removeAttribute("data-part");
      drag.ghost.setAttribute("aria-hidden", "true");
      drag.ghost.tabIndex = -1;
      document.body.append(drag.ghost);
      try {
        drag.source.setPointerCapture(e.pointerId);
      } catch {}
      dragFrame = requestAnimationFrame(updateDrag);
    }
    if (drag.active) {
      e.preventDefault();
      drag.ghost.style.left = e.clientX + 12 + "px";
      drag.ghost.style.top = e.clientY + 12 + "px";
    }
  }, {
    passive: false
  });
  function finishDrag(e, cancelled = false) {
    if (!drag || drag.pointer !== e.pointerId) return;
    const d = drag;
    drag = null;
    if (dragFrame) cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    d.source.classList.remove("is-dragging");
    d.ghost?.remove();
    $$(".build-slot.is-target").forEach(s => s.classList.remove("is-target"));
    if (!d.active) return;
    buildClickSuppressed = Date.now() + 400;
    if (cancelled) return;
    const target = document.elementFromPoint(e.clientX, e.clientY),
      slot = target?.closest(".build-slot");
    if (slot) {
      placeCard(d.id, Number(slot.dataset.index));
    } else if (target?.closest("#buildBank")) {
      const i = buildSlots.indexOf(d.id);
      if (i >= 0) {
        buildSlots[i] = null;
        selectedCard = null;
        clearBuildFeedback();
        renderBuild();
        $("#buildAnnouncement").textContent = "Kortet er tilbage i kortbanken.";
      }
    }
  }
  document.addEventListener("pointerup", e => finishDrag(e));
  document.addEventListener("pointercancel", e => finishDrag(e, true));
  function evaluateBuild() {
    const right = parts.filter((p, i) => buildSlots[i] === p.id).length;
    const symbolPoints = ($("#buildReceived").value === "received" ? 10 : 0) + ($("#buildRead").value === "read" ? 10 : 0);
    const missing = parts.flatMap((p, i) => buildSlots[i] === p.id ? [] : [(i < 7 ? "Forløbsplads " + (i + 1) : "Noteplads " + (i - 6)) + ": " + p.label]);
    if ($("#buildReceived").value !== "received") missing.push("Kuvert = modtaget.");
    if ($("#buildRead").value !== "read") missing.push("Øje = læst.");
    return {
      score: Math.round(80 * right / parts.length + symbolPoints),
      missing,
      description: right + " af " + parts.length + " dele står på rette plads. Symbolerne giver " + symbolPoints + " af 20 point."
    };
  }
  function evaluateDrawing() {
    const checked = $$("[data-part-check]").map(n => n.checked);
    const total = checked.filter(Boolean).length,
      flowCount = checked.slice(0, 7).filter(Boolean).length;
    const order = Number($("input[name=drawingOrder]:checked").value);
    const symbols = ($("#drawReceived").checked ? 5 : 0) + ($("#drawRead").checked ? 5 : 0);
    const score = Math.round(70 * total / parts.length + 20 * order * flowCount / 7 + symbols);
    const missing = parts.flatMap((p, i) => checked[i] ? [] : [p.label]);
    if (order < 1 || flowCount < 7) missing.push("Hele forløbet i rigtig rækkefølge.");
    if (!$("#drawReceived").checked) missing.push("Kuvert = modtaget.");
    if (!$("#drawRead").checked) missing.push("Øje = læst.");
    return {
      score,
      missing,
      description: "Selvvurdering: " + total + " af " + parts.length + " dele er markeret. Rækkefølgen er vægtet efter de forløbsdele, du har med."
    };
  }
  function renderHistory() {
    for (const k of ["build", "draw"]) $("#best" + (k === "build" ? "Build" : "Draw")).textContent = state.results.some(r => r.mode === k) || state.best[k] > 0 ? state.best[k] + " / 100" : "—";
    $("#scoreHistory").replaceChildren();
    $("#historyEmpty").hidden = state.results.length > 0;
    for (const r of [...state.results].reverse()) {
      const li = el("li");
      const time = el("time", "", new Intl.DateTimeFormat("da-DK", {
        dateStyle: "short",
        timeStyle: "short"
      }).format(new Date(r.time)));
      time.dateTime = new Date(r.time).toISOString();
      li.append(el("span", "", r.mode === "build" ? "Byg modellen" : "Tegning · selvvurdering"), time, el("strong", "", r.score + " / 100"));
      $("#scoreHistory").append(li);
    }
  }
  $("#checkModel").addEventListener("click", () => {
    const result = mode === "build" ? evaluateBuild() : evaluateDrawing();
    if (mode === "build") {
      buildFeedback = true;
      renderBuild();
    }
    showAnswer(true);
    $("#scorePanel").hidden = false;
    $("#scoreMode").textContent = mode === "build" ? "BYGGETILSTAND" : "TEGNING · SELVVURDERING";
    $("#scoreTitle").textContent = result.score === 100 ? "Hele modellen er med!" : result.score >= 75 ? "Du er der næsten!" : result.score >= 40 ? "Godt på vej." : "Byg videre – én del ad gangen.";
    $("#scoreDescription").textContent = result.description;
    $("#missingParts").replaceChildren(...result.missing.map(x => el("li", "", x)));
    countUp($("#modelScore"), result.score, 1000);
    $("#scoreCircle").style.transition = "none";
    $("#scoreCircle").style.strokeDashoffset = "314.159";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $("#scoreCircle").style.transition = motion.matches ? "none" : "stroke-dashoffset 1s cubic-bezier(.2,.75,.2,1)";
      $("#scoreCircle").style.strokeDashoffset = String(314.159 * (1 - result.score / 100));
    }));
    state.results.push({
      mode,
      score: result.score,
      time: Date.now(),
      version: MODEL_VERSION
    });
    state.results = state.results.slice(-20);
    state.best[mode] = Math.max(state.best[mode], result.score);
    save();
    renderHistory();
    $("#scoreTitle").focus({
      preventScroll: true
    });
    $("#scorePanel").scrollIntoView({
      behavior: motion.matches ? "auto" : "smooth",
      block: "nearest"
    });
  });

  // Store visninger og eksport. SVG'en er selvstændig uden eksterne ressourcer.
  function openDialog(id) {
    const d = $("#" + id);
    if (!d.open) d.showModal();
    document.body.classList.add("dialog-open");
  }
  function openGraphic(region = "all") {
    pictureZoom = 1;
    $("#zoomGraphicContent").innerHTML = modelSvg(false, "zoom",typeof region==="string"?region:"all");
    openDialog("graphicDialog");
    fitGraphic();
  }
  function applyZoom() {
    $("#zoomGraphicContent").style.width = pictureZoom * 100 + "%";
    $("#graphicZoomValue").textContent = Math.round(pictureZoom * 100) + " %";
    $("#graphicZoomOut").disabled = pictureZoom <= .5;
    $("#graphicZoomIn").disabled = pictureZoom >= 4;
  }
  $("#graphicZoomTarget").addEventListener("click", openGraphic);
  $("#zoomGraphic").addEventListener("click", openGraphic);
  function fitGraphic() {
    const viewport = $("#graphicViewport");
    const css = getComputedStyle(viewport);
    const width = viewport.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
    const height = parseFloat(css.maxHeight) - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - 4;
    const ratio = height / (width * 1024 / 1536);
    pictureZoom = Math.max(.5, Math.min(1, Math.floor(ratio * 4) / 4));
    applyZoom();
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }
  $("#graphicZoomOut").addEventListener("click", () => {
    pictureZoom = Math.max(.5, pictureZoom - .25);
    applyZoom();
  });
  $("#graphicZoomIn").addEventListener("click", () => {
    pictureZoom = Math.min(4, pictureZoom + .25);
    applyZoom();
  });
  $("#graphicFit").addEventListener("click", () => {
    fitGraphic();
  });
  async function downloadPng() {
    const button = $("#downloadGraphic");
    button.disabled = true;
    $("#graphicStatus").textContent = "Gør billedet klar…";
    let sourceUrl = "";
    try {
      const source = new Blob([modelSvg(true, "png")], {
        type: "image/svg+xml;charset=utf-8"
      });
      sourceUrl = URL.createObjectURL(source);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = sourceUrl;
      });
      const out = document.createElement("canvas");
      out.width = 3840;
      out.height = 2560;
      const context = out.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, out.width, out.height);
      context.drawImage(img, 0, 0, out.width, out.height);
      const blob = await new Promise((resolve, reject) => out.toBlob(b => b ? resolve(b) : reject(new Error("PNG")), "image/png"));
      if (pngUrl) URL.revokeObjectURL(pngUrl);
      pngUrl = URL.createObjectURL(blob);
      const a = $("#pngFallback");
      a.href = pngUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.download = "aftalemodellen-whiteboard.png";
      a.hidden = false;
      a.click();
      $("#graphicStatus").textContent = "PNG-billedet er klar. Brug linket nedenunder, hvis download ikke starter.";
    } catch {
      $("#graphicStatus").textContent = "Billedet kunne ikke eksporteres i denne browser. Prøv Print / gem som PDF.";
    } finally {
      button.disabled = false;
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    }
  }
  $("#downloadGraphic").addEventListener("click", downloadPng);
  $("#printGraphic").addEventListener("click", () => {
    $("#printGraphicContent").innerHTML = modelSvg(true, "print");
    window.print();
  });
  function openCheat() {
    const route = el("section");
    route.append(el("h3", "", "Frem. Tænk. Tilbage."));
    const picture = el("button", "cheat-picture");
    picture.type = "button";
    picture.setAttribute("aria-label", "Åbn whiteboardbilledet i stor visning");
    picture.innerHTML = modelSvg(false, "cheat");
    picture.addEventListener("click", () => openGraphic());
    route.append(picture, el("p", "source-note", "TG = tilbudsgiver. TM = tilbudsmodtager. Kuvert = brevsprækkeøjeblikket (modtaget). Øje = kundskabsøjeblikket (læst). Tryk på billedet for at zoome."));
    const side = el("section");
    side.append(el("h3", "", "Tavlens noter"));
    const n = el("div", "cheat-notes");
    for (const note of notes) {
      const card = el("div", "cheat-note");
      card.dataset.kind = note.kind;
      card.append(el("strong", "", note.title), el("span", "", note.id === "legal" ? "Rimelig betænkningstid + frem- og tilbagesendelsestid." : note.id === "withdraw" ? "Tilbud/accept: inden kundskabsøjeblikket." : note.id === "late" ? "Nyt tilbud." : note.id === "different" ? "Modbud." : note.id === "claim" ? "Forbundet med § 4 og § 6." : "Fast frist."));
      n.append(card);
    }
    side.append(n);
    $("#cheatContent").replaceChildren(route, side);
    openDialog("cheatDialog");
  }
  $("#openCheat").addEventListener("click", openCheat);
  $("#openCheatMemory").addEventListener("click", openCheat);
  $("#presentCheat").addEventListener("click", openCheat);
  const slides = [
  {
    "title": "Hele modellen",
    "region": "all",
    "kind": "giver",
    "text": "Dette er dit whiteboardbillede. Følg tilbuddet ud, tiden hos TM og accepten tilbage.",
    "items": [
      "Frem. Tænk. Tilbage.",
      "Slut med frister og noter."
    ]
  },
  {
    "title": "1. TG sender tilbud",
    "region": "send",
    "kind": "giver",
    "text": "Start øverst til venstre. TG er tilbudsgiver og sender tilbuddet.",
    "items": [
      "Peg på TG.",
      "Fortæl, hvem tilbuddet skal til: TM."
    ]
  },
  {
    "title": "2. Fremsendelsestid",
    "region": "outbound",
    "kind": "time",
    "text": "Følg den blå pil mod højre. Den viser tilbuddets vej fra TG til TM.",
    "items": [
      "Frem = tilbuddet ud."
    ]
  },
  {
    "title": "3. TM modtager tilbud",
    "region": "receive",
    "kind": "received",
    "text": "Nu er du hos TM øverst til højre. Skeln mellem, at tilbuddet er modtaget, og at det er læst.",
    "items": [
      "Kuvert = brevsprækkeøjeblikket: tilbuddet er modtaget.",
      "Øje = kundskabsøjeblikket: tilbuddet er læst."
    ]
  },
  {
    "title": "4. Betænkningstid",
    "region": "thinking",
    "kind": "time",
    "text": "Følg den grønne pil ned ad højre side. Den viser tiden hos TM inden accepten sendes.",
    "items": [
      "Tænk = tiden hos modtageren."
    ]
  },
  {
    "title": "5. TM = acceptant",
    "region": "accept",
    "kind": "recipient",
    "text": "Nederst til højre står TM som acceptant og sender accept.",
    "items": [
      "Acceptant = den, der accepterer.",
      "Nu følger du accepten tilbage."
    ]
  },
  {
    "title": "6. Tilbagesendelsestid",
    "region": "return",
    "kind": "time",
    "text": "Følg den orange pil mod venstre. Det er acceptens vej tilbage.",
    "items": [
      "Tilbage = accepten hjem."
    ]
  },
  {
    "title": "7. Bindende aftale",
    "region": "binding",
    "kind": "read",
    "text": "Returforløbet ender nederst til venstre ved bindende aftale.",
    "items": [
      "Kuvert = brevsprækkeøjeblikket: accepten er modtaget.",
      "Øje = kundskabsøjeblikket: accepten er læst."
    ]
  },
  {
    "title": "8. Fast frist · § 2",
    "region": "fixed",
    "kind": "time",
    "text": "Gå til fristafsnittet til højre. Her står § 2 sammen med fast frist.",
    "items": [
      "2 = fast frist."
    ]
  },
  {
    "title": "9. Den legale acceptfrist · § 3",
    "region": "legal",
    "kind": "time",
    "text": "Læs begge punkter under § 3. Betænkningstiden står ikke alene.",
    "items": [
      "Rimelig betænkningstid.",
      "Frem- og tilbagesendelsestid."
    ]
  },
  {
    "title": "10. Tilbagekaldelse",
    "region": "withdraw",
    "kind": "withdraw",
    "text": "Boksens ordlyd: Tilbagekaldelse af tilbud/accept skal ske inden kundskabsøjeblikket.",
    "items": [
      "Både tilbud og accept er nævnt.",
      "Pilene peger på øjet: kundskabsøjeblikket (læst)."
    ]
  },
  {
    "title": "11. Forsinkelse · § 4",
    "region": "late",
    "kind": "exception",
    "text": "Nederst på billedet står forsinkelse sammen med § 4 og nyt tilbud.",
    "items": [
      "Forsinkelse handler om tid."
    ]
  },
  {
    "title": "12. Uoverensstemmende · § 6",
    "region": "different",
    "kind": "exception",
    "text": "Den næste linje viser uoverensstemmende sammen med § 6 og modbud.",
    "items": [
      "Tænk på indhold, der ændres.",
      "Fx en anden pris end tilbuddet."
    ]
  },
  {
    "title": "13. Pligtmæssig reklamation · § 40",
    "region": "claim",
    "kind": "claim",
    "text": "Slut ved den fælles boks. Begge forbindelser fra § 4 og § 6 ender her.",
    "items": [
      "To forbindelser, én boks.",
      "Pligtmæssig reklamation · § 40."
    ]
  }
];
  let slideIndex = 0;
  function renderSlide() {
    const slide=slides[slideIndex],host=$("#presentationContent");
    const layout=el("div","presentation-grid");
    const picture=el("div","presentation-picture");
    picture.innerHTML=modelSvg(false,"present",slide.region);
    const copy=el("div","presentation-copy");
    copy.append(tag(slide.kind),el("h3","",slide.title),el("p","slide-lead",slide.text));
    const items=el("ul","slide-points");
    slide.items.forEach(text=>items.append(el("li","",text)));
    copy.append(items);
    const zoom=el("button","button secondary small","Se billedet stort ↗");
    zoom.type="button";zoom.addEventListener("click",()=>openGraphic(slide.region));
    const controls=el("div","button-row");
    controls.append(zoom,audioButton(slide.title,()=>readOne(slide.title,[slide.text,...slide.items].join(" "),copy)));
    copy.append(controls);layout.append(picture,copy);host.replaceChildren(layout);
    $("#slideCounter").textContent=(slideIndex+1)+" / "+slides.length;
    $("#presentationProgress").max=slides.length;
    $("#presentationProgress").value=slideIndex+1;
    $("#previousSlide").disabled=slideIndex===0;
    $("#nextSlide").disabled=slideIndex===slides.length-1;
    animatePanel(host);
    if(mobileLayout.matches && $("#presentDialog").open)requestAnimationFrame(()=>$("#presentDialog").scrollTo({top:0,behavior:motion.matches?"auto":"smooth"}));
  }
  function moveSlide(delta) {
    slideIndex = Math.max(0, Math.min(slides.length - 1, slideIndex + delta));
    if (reader.playing || reader.paused) stopSpeech(false);
    renderSlide();
  }
  $("#presentLaunch").addEventListener("click", () => {
    stopModel();
    slideIndex = 0;
    renderSlide();
    openDialog("presentDialog");
  });
  $("#previousSlide").addEventListener("click", () => moveSlide(-1));
  $("#nextSlide").addEventListener("click", () => moveSlide(1));
  $("#presentDialog").addEventListener("keydown", e => {
    if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      if (e.key === "Home") slideIndex = 0;else if (e.key === "End") slideIndex = slides.length - 1;else {
        moveSlide(e.key === "ArrowRight" ? 1 : -1);
        return;
      }
      renderSlide();
    }
  });
  $$("[data-close]").forEach(b => b.addEventListener("click", () => $("#" + b.dataset.close).close()));
  $$(".study-dialog").forEach(d => {
    d.addEventListener("close", () => {
      document.body.classList.toggle("dialog-open", $$(".study-dialog").some(x => x.open));
      const target = reader.entries[reader.index]?.target;
      if (target && d.contains(target)) stopSpeech(false);
      if(d.contains($("#readerDock"))){minimizeReaderPanel();document.body.append($("#readerDock"));}
      if (document.fullscreenElement === d) document.exitFullscreen?.().catch(() => {});
    });
    d.addEventListener("click", e => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  });
  $$("[data-fullscreen]").forEach(b => {
    if (!document.fullscreenEnabled || !$("#" + b.dataset.fullscreen).requestFullscreen) {
      b.hidden = true;
      return;
    }
    b.addEventListener("click", async () => {
      try {
        const d = $("#" + b.dataset.fullscreen);
        if (document.fullscreenElement) await document.exitFullscreen();else await d.requestFullscreen();
      } catch {
        toast("Browseren kunne ikke åbne fuld skærm. Den store visning virker stadig.");
      }
    });
  });

  // Oplæsning er frivillig og starter kun gennem en af elevens knapper.
  const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const reader = {
    entries: [],
    index: 0,
    chunks: [],
    chunkIndex: 0,
    offset: 0,
    boundary: 0,
    token: 0,
    playing: false,
    paused: false,
    voice: null,
    marked: null
  };
  let utterance = null;
  function loadVoices() {
    if (!speechSupported) return;
    const voices = speechSynthesis.getVoices();
    reader.voice = voices.find(v => /^da(?:-|_|$)/i.test(v.lang) && v.localService) || voices.find(v => /^da(?:-|_|$)/i.test(v.lang)) || null;
    $("#readerVoice").textContent = reader.voice ? "Dansk stemme: " + reader.voice.name + (reader.voice.localService ? " · på enheden" : " · kan kræve internet") : "Ingen dansk stemme fundet. Enhedens standardstemme kan blive brugt.";
  }
  function normalizeSpeech(text) {
    return text.replace(/§/g, " paragraf ").replace(/\bAFTL\b/g, "A F T L").replace(/\bTG\b/g, "tilbudsgiver").replace(/\bTM\b/g, "tilbudsmodtager").replace(/\//g, ", ").replace(/\s+/g, " ").trim();
  }
  function chunksFor(text) {
    const words = normalizeSpeech(text).split(/\s+/);
    const out = [];
    let chunk = "";
    for (const word of words) {
      if (chunk.length + word.length > 230 && chunk) {
        out.push(chunk);
        chunk = "";
      }
      chunk += (chunk ? " " : "") + word;
    }
    if (chunk) out.push(chunk);
    return out;
  }
  function allReadingEntries() {
    return [{
      title: "Kort fortalt",
      text: overviewText,
      target: $("#overviewCard")
    }, ...parts.slice(0, 7).map(p => {
      const pi = points.findIndex(x => x.id === p.id);
      return {
        title: p.label,
        text: p.text,
        target: pi >= 0 ? $("#modelDetail") : $("#time-" + p.id),
        point: pi
      };
    }), ...concepts.map(c => ({
      title: c.title,
      text: conceptSpeech(c),
      target: $("#concept-" + c.id)
    })), ...memories.map(m => ({
      title: m.title,
      text: m.text || m.list.join(" "),
      target: $("#memory-" + m.id)
    }))];
  }
  function modelReadingEntries() {
    return parts.map(p => ({
      title: p.label,
      text: p.text,
      target: $("#modelGraphic")
    }));
  }
  function showReader() {
    const host=reader.entries[reader.index]?.target?.closest("dialog[open]");
    if($("#readerDock").parentElement!==(host||document.body)){
      $("#readerDock").closest("dialog")?.classList.remove("has-reader");
      (host||document.body).append($("#readerDock"));
    }
    $("#readerLaunch").hidden = true;
    $("#readerPanel").hidden = false;
    document.body.classList.add("reader-open");
    if (!speechSupported) {
      $("#readerStatus").textContent = "Din browser understøtter ikke oplæsning. Du kan stadig bruge alle tekster og øvelser.";
      $$("#readerPanel button:not(#minimizeReader),#readerPanel select").forEach(b => b.disabled = true);
    }
    syncReaderChrome();
  }
  function updateReader() {
    const entry = reader.entries[reader.index];
    $("#readerTitle").textContent = entry?.title || "Læs det hele op";
    $("#readerCounter").textContent = reader.entries.length ? reader.index + 1 + " / " + reader.entries.length : "";
    $("#readerPlay").disabled = !speechSupported || reader.playing;
    $("#readerPause").disabled = !speechSupported || !reader.playing;
    $("#readerPause").setAttribute("aria-pressed", String(reader.paused));
    $("#readerPlay").textContent = reader.paused ? "Fortsæt" : "Afspil";
    $("#readerPrevious").disabled = !speechSupported || reader.index === 0;
    $("#readerNext").disabled = !speechSupported || reader.index >= reader.entries.length - 1;
    updateReaderLaunch();
  }
  function clearSpeechMark() {
    reader.marked?.classList.remove("is-reading");
    reader.marked = null;
  }
  function markEntry(entry) {
    clearSpeechMark();
    if (entry.point >= 0) selectPoint(entry.point);
    const target = entry.target;
    if (!target) return;
    if (target.tagName === "DETAILS") target.open = true;
    target.classList.add("is-reading");
    reader.marked = target;
    const r = target.getBoundingClientRect();
    if (r.bottom < 130 || r.top > innerHeight - 180) target.scrollIntoView({
      behavior: motion.matches ? "auto" : "smooth",
      block: mobileLayout.matches ? "start" : "center"
    });
  }
  function cancelSpeech() {
    reader.token++;
    if (speechSupported) speechSynthesis.cancel();
    utterance = null;
  }
  function stopSpeech(announce = true) {
    cancelSpeech();
    reader.playing = false;
    reader.paused = false;
    reader.index = 0;
    reader.chunks = [];
    reader.chunkIndex = 0;
    reader.offset = 0;
    reader.boundary = 0;
    clearSpeechMark();
    if (announce) $("#readerStatus").textContent = "Oplæsningen er stoppet.";
    updateReader();
  }
  function speakChunk() {
    if (!speechSupported || !reader.playing) return;
    const entry = reader.entries[reader.index];
    if (!entry) {
      reader.playing = false;
      reader.paused = false;
      clearSpeechMark();
      $("#readerStatus").textContent = "Oplæsningen er færdig.";
      reader.index = Math.max(0, reader.entries.length - 1);
      updateReader();
      return;
    }
    if (!reader.chunks.length) {
      reader.chunks = chunksFor(entry.text);
      reader.chunkIndex = 0;
      reader.offset = 0;
      markEntry(entry);
    }
    if (reader.chunkIndex >= reader.chunks.length) {
      reader.index++;
      reader.chunks = [];
      reader.chunkIndex = 0;
      reader.offset = 0;
      updateReader();
      speakChunk();
      return;
    }
    const text = reader.chunks[reader.chunkIndex].slice(reader.offset);
    if (!text.trim()) {
      reader.chunkIndex++;
      reader.offset = 0;
      speakChunk();
      return;
    }
    const token = ++reader.token;
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "da-DK";
    utterance.rate = Number($("#readerRate").value);
    if (reader.voice) utterance.voice = reader.voice;
    reader.boundary = 0;
    utterance.onboundary = e => {
      if (token === reader.token && Number.isFinite(e.charIndex)) reader.boundary = e.charIndex;
    };
    utterance.onstart = () => {
      if (token !== reader.token) return;
      $("#readerStatus").textContent = "Læser: " + entry.title;
      updateReader();
    };
    utterance.onend = () => {
      if (token !== reader.token || !reader.playing) return;
      reader.chunkIndex++;
      reader.offset = 0;
      reader.boundary = 0;
      speakChunk();
    };
    utterance.onerror = e => {
      if (token !== reader.token) return;
      if (["canceled", "interrupted"].includes(e.error)) return;
      reader.playing = false;
      reader.paused = false;
      $("#readerStatus").textContent = "Oplæsningen kunne ikke fortsætte. Prøv Afspil, eller vælg en stemme i enhedens indstillinger.";
      updateReader();
    };
    speechSynthesis.speak(utterance);
    updateReader();
  }
  function playReader() {
    showReader();
    if (!speechSupported || reader.playing) return;
    if (!reader.entries.length) reader.entries = allReadingEntries();
    if (reader.index >= reader.entries.length) reader.index = 0;
    reader.playing = true;
    reader.paused = false;
    loadVoices();
    speakChunk();
  }
  function readEntries(entries) {
    stopModel();
    cancelSpeech();
    clearSpeechMark();
    reader.entries = entries;
    reader.index = 0;
    reader.chunks = [];
    reader.chunkIndex = 0;
    reader.offset = 0;
    reader.boundary = 0;
    reader.playing = false;
    reader.paused = false;
    showReader();
    playReader();
  }
  function readOne(title, text, target) {
    readEntries([{
      title,
      text,
      target
    }]);
  }
  function moveReading(delta) {
    if (!reader.entries.length) reader.entries = allReadingEntries();
    cancelSpeech();
    reader.index = Math.max(0, Math.min(reader.entries.length - 1, reader.index + delta));
    reader.chunks = [];
    reader.chunkIndex = 0;
    reader.offset = 0;
    reader.boundary = 0;
    reader.playing = false;
    reader.paused = false;
    playReader();
  }
  $("#readerLaunch").addEventListener("click", () => {
    if (reader.playing || reader.paused) {
      showReader();
      updateReader();
    } else if($("#readerDock").closest("dialog[open]")&&reader.entries.length){showReader();playReader();}
    else readEntries(allReadingEntries());
  });
  $("#readerAll").addEventListener("click", () => readEntries(allReadingEntries()));
  $("#readerPlay").addEventListener("click", playReader);
  $("#readerStop").addEventListener("click", () => stopSpeech());
  $("#readerPause").addEventListener("click", () => {
    if (!reader.playing) return;
    reader.offset += reader.boundary;
    cancelSpeech();
    reader.playing = false;
    reader.paused = true;
    reader.boundary = 0;
    $("#readerStatus").textContent = "Sat på pause. Tryk Fortsæt.";
    updateReader();
  });
  $("#readerPrevious").addEventListener("click", () => moveReading(-1));
  $("#readerNext").addEventListener("click", () => moveReading(1));
  $("#readerRate").addEventListener("change", () => {
    if (reader.playing) {
      reader.offset += reader.boundary;
      cancelSpeech();
      reader.boundary = 0;
      speakChunk();
    }
  });
  $("#minimizeReader").addEventListener("click", minimizeReaderPanel);
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-read]");
    if (!b) return;
    if (b.dataset.read === "overview") readOne("Kort fortalt", overviewText, $("#overviewCard"));else if (b.dataset.read === "symbols") readOne("Symbolerne", "Kuverten viser brevsprækkeøjeblikket: meddelelsen er modtaget. Øjet viser kundskabsøjeblikket: meddelelsen er læst.", $("#symbolComparison"));else if (b.dataset.read === "whole-model") readEntries(modelReadingEntries());
  });
  if (speechSupported) {
    loadVoices();
    speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  }
  window.addEventListener("pagehide", () => {
    cancelSpeech();
    if (pngUrl) URL.revokeObjectURL(pngUrl);
  });

  // PWA: den nye, separate service worker erstatter også den tidligere worker.
  let installPrompt = null,
    offlineReady = false;
  function updateOfflineStatus() {
    $("#offlineStatus").textContent = offlineReady ? navigator.onLine ? "Offline klar · resultater gemmes på enheden" : "Offline · resultater gemmes på enheden" : "Dine resultater bliver på enheden";
  }
  window.addEventListener("online", updateOfflineStatus);
  window.addEventListener("offline", updateOfflineStatus);
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    installPrompt = e;
    $("#installApp").textContent = "Installér app";
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    $("#installApp").textContent = "Appen er installeret";
    $("#installApp").disabled = true;
  });
  $("#installApp").addEventListener("click", async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        await installPrompt.userChoice;
      } catch {
        openDialog("installDialog");
      } finally {
        installPrompt = null;
      }
    } else openDialog("installDialog");
  });
  async function activateOffline() {
    if (!("serviceWorker" in navigator) || !["http:", "https:"].includes(location.protocol)) return;
    try {
      const reg = await navigator.serviceWorker.register("./sw.js", {
        scope: "./",
        updateViaCache: "none"
      });
      const worker = reg.installing || reg.waiting || reg.active;
      if (worker && worker.state !== "activated") await new Promise(resolve => worker.addEventListener("statechange", () => {
        if (["activated", "redundant"].includes(worker.state)) resolve();
      }));
      offlineReady = !!reg.active;
      updateOfflineStatus();
    } catch {
      $("#offlineStatus").textContent = "Browseren kunne ikke aktivere offlinebrug. Øvelserne virker stadig.";
    }
  }

  // Indhold er synligt uden animationsstøtte, og reduceret bevægelse respekteres.
  function initializeObservers() {
    if (!("IntersectionObserver" in window)) return;
    if (!motion.matches) {
      const observer = new IntersectionObserver(entries => {
        for (const e of entries) if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          observer.unobserve(e.target);
        }
      }, {
        threshold: .07
      });
      $$(".reveal").forEach(n => {
        n.classList.add("will-reveal");
        observer.observe(n);
      });
    }
    const navLinks = $$(".header-inner nav a, .mobile-nav a");
    const active = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!visible.length) return;
      for (const a of navLinks) {
        if (a.hash === "#" + visible[0].target.id) a.setAttribute("aria-current", "location");else a.removeAttribute("aria-current");
      }
    }, {
      rootMargin: "-12% 0px -50% 0px"
    });
    for (const a of navLinks) {
      const n = $(a.hash);
      if (n) active.observe(n);
    }
  }
  // Mobilbetjening deles med desktop: samme data, læringsindhold og canvas.
  function animatePanel(node, distance = 9) {
    if (motion.matches || !node?.animate) return;
    node.getAnimations?.().forEach(animation => animation.cancel());
    node.animate([{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:"translateY(0)"}],{duration:230,easing:"cubic-bezier(.2,.7,.2,1)"});
  }
  function mobileScroll(node) {
    if (!mobileLayout.matches || !node) return;
    requestAnimationFrame(() => node.scrollIntoView({behavior:motion.matches?"auto":"smooth",block:"start"}));
  }
  function updateReaderLaunch() {
    const button = $("#readerLaunch");
    const label = reader.playing || reader.paused ? "Åbn oplæseren" : "Læs det hele op";
    button.replaceChildren(iconNode("speaker"),el("span","reader-launch-text",label));
    button.setAttribute("aria-label",label);
    button.title=label;
  }
  function syncReaderChrome() {
    const dock=$("#readerDock"), panel=$("#readerPanel"), host=dock.closest("dialog");
    host?.classList.toggle("has-reader",!panel.hidden);
    $("#readerAll").hidden=!!host;
    const height=panel.hidden?0:Math.ceil(panel.getBoundingClientRect().height)+20;
    document.documentElement.style.setProperty("--reader-height",height+"px");
  }
  function minimizeReaderPanel() {
    $("#readerPanel").hidden=true;
    $("#readerLaunch").hidden=false;
    document.body.classList.remove("reader-open");
    updateReaderLaunch();
    syncReaderChrome();
  }
  function updateBuildSelectionHint() {
    const hint=$("#mobileBuildSelection");
    if(!hint)return;
    hint.hidden=!selectedCard;
    if(selectedCard)$("#selectedBuildLabel").textContent=partById.get(selectedCard).label;
  }
  function installMobileUI() {
    const navigation=el("nav","mobile-nav");
    navigation.setAttribute("aria-label","Mobilmenu");
    const menu=[
      ["overblik","Overblik","Overblik",'<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"/>'],
      ["model","Model","Model",'<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M9 6h9v9M6 9v9h9"/>'],
      ["begreber","Begreber","Begreber",'<path d="M12 5v16M3 3c4-1 7 0 9 2 2-2 5-3 9-2v16c-4-1-7 0-9 2-2-2-5-3-9-2Z"/>'],
      ["flashcards","Kort","Flashcards",'<rect x="5" y="6" width="16" height="15" rx="3"/><path d="M17 3H6a3 3 0 0 0-3 3v10M10 12h6M10 16h4"/>'],
      ["quiz","Quiz","Quiz",'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'],
      ["tegn-selv","Tegn","Tegn selv",'<path d="m14 5 5 5M3 21l5-1L21 7a2 2 0 0 0-4-4L4 16Z"/>']
    ];
    for(const [id,label,accessible,path] of menu){
      const link=el("a","mobile-nav-link");link.href="#"+id;link.setAttribute("aria-label",accessible);
      link.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
      link.append(el("span","",label));
      link.addEventListener("click",()=>{navigation.querySelectorAll("a").forEach(a=>a.removeAttribute("aria-current"));link.setAttribute("aria-current","location");});
      navigation.append(link);
    }
    document.body.append(navigation);
    // Safe areas og værktøjslinjer følger den faktisk synlige mobilskærm.
    const viewport=$("meta[name=viewport]");
    if(viewport&&!viewport.content.includes("viewport-fit"))viewport.content+=", viewport-fit=cover";
    let viewportFrame=0;
    const measure=()=>{
      viewportFrame=0;
      document.documentElement.style.setProperty("--app-height",Math.round(window.visualViewport?.height||innerHeight)+"px");
      document.documentElement.style.setProperty("--header-height",Math.ceil($(".site-header").getBoundingClientRect().height)+"px");
      syncReaderChrome();
    };
    const schedule=()=>{if(!viewportFrame)viewportFrame=requestAnimationFrame(measure);};
    window.addEventListener("resize",schedule,{passive:true});
    window.visualViewport?.addEventListener("resize",schedule,{passive:true});
    if("ResizeObserver" in window){new ResizeObserver(schedule).observe($(".site-header"));new ResizeObserver(schedule).observe($("#readerPanel"));}
    measure();

    // En lille tegneflade kan åbnes i en fuld visning uden at miste streger.
    const panel=$("#drawPanel"), tools=$(".drawing-tools"), surface=el("div","drawing-surface");
    panel.insertBefore(surface,tools);surface.append(tools,canvas);
    const primary=el("div","draw-primary-tools");
    const definitions=[
      ["penTool","Pen",'<path d="m14 5 5 5M3 21l5-1L21 7a2 2 0 0 0-4-4L4 16Z"/>'],
      ["eraserTool","Viskelæder",'<path d="m14 3 7 7-10 11H7l-5-5L14 3ZM7 11l8 8M11 21h10"/>'],
      ["undoDrawing","Fortryd",'<path d="m8 4-5 5 5 5M3 9h11a7 7 0 0 1 0 14"/>'],
      ["redoDrawing","Gendan",'<path d="m16 4 5 5-5 5M21 9H10a7 7 0 0 0 0 14"/>'],
      ["clearDrawing","Ryd",'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>']
    ];
    for(const [id,label,path] of definitions){const button=$("#"+id);button.innerHTML='<svg class="mobile-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';button.append(el("span","tool-label",label));if(!button.hasAttribute("aria-label"))button.setAttribute("aria-label",label);primary.append(button);}
    const palette=el("div","drawing-palette");palette.append($("#penColors"),$(".custom-color"));
    palette.querySelector("#penColors").setAttribute("aria-label","Penfarver. Rul vandret for at se flere farver.");
    const size=$(".size-control");tools.replaceChildren(primary,palette,size);
    const expand=el("button","button secondary drawing-expand","Åbn tegnefladen ↗");expand.id="expandDrawing";expand.type="button";panel.insertBefore(expand,surface);
    const drawingDialog=el("dialog","study-dialog drawing-dialog");drawingDialog.id="drawingDialog";drawingDialog.setAttribute("aria-labelledby","drawingDialogTitle");
    const header=el("div","dialog-toolbar"), title=el("div");title.append(el("p","eyebrow","TEGN MED FINGER, PEN ELLER MUS"),el("h2","","Tegn din model"));title.querySelector("h2").id="drawingDialogTitle";
    const close=el("button","icon-button","×");close.type="button";close.setAttribute("aria-label","Luk tegnefladen");close.addEventListener("click",()=>drawingDialog.close());header.append(title,close);
    const drawingHost=el("div","drawing-dialog-host");
    const footer=el("div","drawing-dialog-footer");const answer=el("button","button secondary","Vis modelbilledet"),done=el("button","button primary","Færdig");answer.type=done.type="button";answer.addEventListener("click",()=>openGraphic());done.addEventListener("click",()=>drawingDialog.close());footer.append(answer,done);
    drawingDialog.append(header,drawingHost,footer);document.body.append(drawingDialog);
    let restorePoint=null;
    expand.addEventListener("click",()=>{restorePoint=document.createComment("tegneflade");surface.before(restorePoint);drawingHost.append(surface);openDialog("drawingDialog");requestAnimationFrame(resizeCanvas);});
    drawingDialog.addEventListener("close",()=>{restorePoint?.replaceWith(surface);restorePoint=null;document.body.classList.toggle("dialog-open",$$("dialog[open]").length>0);requestAnimationFrame(resizeCanvas);expand.focus({preventScroll:true});});

    // Valgt byggekort bliver fulgt af pladsvalg; der kræves intet langt træk.
    const hint=el("div","build-selection-hint");hint.id="mobileBuildSelection";hint.hidden=true;hint.setAttribute("role","status");
    const copy=el("div");copy.append(el("small","","VALGT KORT"));const chosen=el("strong");chosen.id="selectedBuildLabel";copy.append(chosen,el("span","","Tryk nu på en plads."));
    const cancel=el("button","button secondary small","Annuller");cancel.type="button";cancel.addEventListener("click",()=>{selectedCard=null;updateSelection();});hint.append(copy,cancel);$("#buildFlow").before(hint);
    updateBuildSelectionHint();updateReaderLaunch();
  }

  renderLearningContent();
  installMobileUI();
  selectPoint(0);
  applyTheme();
  restartFlash();
  beginQuiz(selectedQuestions());
  renderBuild();
  renderHistory();
  $("#printGraphicContent").innerHTML = modelSvg(true, "print");
  updateReader();
  initializeObservers();
  requestAnimationFrame(resizeCanvas);
  activateOffline();
  if (storageWarning) toast("Browserlagring er ikke tilgængelig. Du kan stadig øve dig på siden.");
})();
