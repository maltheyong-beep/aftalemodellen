/*
 * Aftalemodellen — ren JavaScript uden biblioteker.
 * Fagligt indhold følger de syv trin og begreber i opgavebeskrivelsen.
 * Filen bruges også som service worker, så der kun behøves tre webfiler.
 */
"use strict";

if (typeof ServiceWorkerGlobalScope !== "undefined" && self instanceof ServiceWorkerGlobalScope) {
  // Ved opdateringer: øg versionen, så den nye udgave får sin egen cache.
  const cachePrefix = "aftalemodellen:" + new URL(self.registration.scope).pathname + ":";
  const cacheName = cachePrefix + "v2";
  const offlineFiles = ["./", "./index.html", "./style.css", "./script.js"];

  self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(offlineFiles)).then(() => self.skipWaiting()));
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys
      .filter((key) => key.startsWith(cachePrefix) && key !== cacheName)
      .map((key) => caches.delete(key)))).then(() => self.clients.claim()));
  });
  self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
    // Netværk først: ændrede filer hentes online; gemte filer bruges offline.
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      try {
        const response = await fetch(event.request);
        if (response.ok && response.type === "basic") await cache.put(event.request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          const page = await cache.match(new URL("./index.html", self.registration.scope).href);
          if (page) return page;
        }
        return Response.error();
      }
    })());
  });
} else {
  (() => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const STORAGE_KEY = "aftalemodellen.v1";

    function element(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function shuffle(items) {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }

    // Faste betydninger. Samme farve og samme vektorikon bruges overalt.
    const TYPES = {
      giver: { label: "Tilbudsgiver", hint: "Sender tilbuddet", ink: "#1d4ed8", soft: "#eaf0ff" },
      recipient: { label: "Tilbudsmodtager", hint: "Modtager tilbuddet og sender accept", ink: "#b45309", soft: "#fff1e4" },
      received: { label: "Brevsprække", hint: "Modtaget", ink: "#7c3aed", soft: "#f2ebff" },
      read: { label: "Kundskab", hint: "Læst", ink: "#16724c", soft: "#e7f5ed" },
      time: { label: "Tid / frist", hint: "Betænkningstid og acceptfrist", ink: "#805600", soft: "#fff5cf" },
      declarative: { label: "Deklaratorisk", hint: "Fravigelig", ink: "#0b6b73", soft: "#e2f5f5" },
      mandatory: { label: "Præceptiv", hint: "Ufravigelig", ink: "#b42335", soft: "#fff0f2" },
      protective: { label: "Beskyttelsespræceptiv", hint: "Kun til den svage parts fordel", ink: "#9b2477", soft: "#fcebf7" }
    };
    const ICONS = {
      giver: '<path d="M4 14v6h16v-6M12 16V3m-4 4 4-4 4 4"/>',
      recipient: '<path d="M4 14v6h16v-6M12 3v12m-4-4 4 4 4-4"/>',
      received: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
      read: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      time: '<path d="M5 3h14M5 21h14M7 3v4l10 10v4M17 3v4L7 17v4M9 7h6m-6 10h6"/>',
      declarative: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M9 10V7a4 4 0 0 1 7-2M12 14v3"/>',
      mandatory: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
      protective: '<path d="M12 2 21 6v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
      speaker: '<path d="M3 9v6h4l5 4V5L7 9H3Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'
    };
    function iconMarkup(kind) {
      return '<svg class="semantic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[kind] || ICONS.speaker) + '</svg>';
    }
    function iconNode(kind) {
      const span = element("span", "semantic-symbol"); span.innerHTML = iconMarkup(kind); span.setAttribute("aria-hidden", "true"); return span;
    }
    function semanticTag(kind, short = false) {
      const tag = element("span", "semantic-tag"); tag.dataset.kind = kind;
      tag.append(iconNode(kind), element("span", "", TYPES[kind].label + (short ? "" : " · " + TYPES[kind].hint)));
      return tag;
    }
    function semanticKinds(text) {
      const value = text.toLowerCase(); const found = [];
      if (/tilbudsgiver/.test(value)) found.push("giver");
      if (/tilbudsmodtager|modtageren/.test(value)) found.push("recipient");
      if (/brevsprække|modtaget|kommer frem/.test(value)) found.push("received");
      if (/kundskab|læst|læser/.test(value)) found.push("read");
      if (/betænkning|acceptfrist/.test(value)) found.push("time");
      if (/deklaratorisk|(^|\s)fravigelig/.test(value)) found.push("declarative");
      if (/(^|\s)præceptiv|ufravigelig/.test(value)) found.push("mandatory");
      if (/beskyttelsespræceptiv|svage part/.test(value)) found.push("protective");
      return [...new Set(found)];
    }
    function updateSemanticTags(container, text) {
      container.replaceChildren(...semanticKinds(text).map((kind) => semanticTag(kind, true)));
    }
    function kindOfStep(index) { return ["giver", "received", "read", "time", "recipient", "received", "read"][index]; }
    function soundButton(label, action) {
      const button = element("button", "sound-button"); button.type = "button";
      button.setAttribute("aria-label", label); button.title = label; button.innerHTML = iconMarkup("speaker"); button.addEventListener("click", action);
      return button;
    }
    let studyToolsReady = false;

    // Én fælles model er kilde til tidslinje, facit, byggekort og tjekliste.
    const steps = [
      { id: "tilbud", title: "Tilbud", short: "Tilbud sendes", buildLabel: "Tilbudsgiver sender sit tilbud", description: "Tilbudsgiver sender et tilbud til tilbudsmodtager.", type: "action", lane: "left", direction: "right", symbol: "↗", category: "Tilbud", binding: "Tilbuddet er sendt. Følg det frem til modtageren.", checklist: "Tilbudsgiver sender et tilbud." },
      { id: "tilbud-modtaget", title: "Brevsprækkeøjeblikket", short: "Tilbud modtaget", buildLabel: "Tilbuddet kommer frem til modtageren", description: "Tilbuddet er kommet frem til modtagerens indbakke.", type: "received", lane: "right", symbol: "↓", category: "Modtaget", binding: "Brevsprække = modtaget. Tilbuddet er endnu ikke læst.", checklist: "Tilbuddet kommer frem — brevsprække." },
      { id: "tilbud-laest", title: "Kundskabsøjeblikket", short: "Tilbud læst", buildLabel: "Modtageren læser tilbuddet", description: "Modtageren læser tilbuddet, og tilbudsgiver bliver bundet.", type: "read", lane: "right", symbol: "✓", category: "Læst", binding: "Her bliver tilbudsgiver bundet. Kundskab = læst.", checklist: "Tilbuddet læses — kundskab. Tilbudsgiver er bundet." },
      { id: "betaenkningstid", title: "Betænkningstid", short: "Betænkningstid", buildLabel: "Modtageren overvejer sit svar", description: "Modtageren kan acceptere, afslå eller lade tilbuddet udløbe.", type: "action", lane: "right", symbol: "◷", category: "Tid til at tænke", binding: "Modtageren har tre muligheder: ja, nej eller at lade tilbuddet udløbe.", checklist: "Betænkningstid: acceptere, afslå eller lade udløbe." },
      { id: "accept", title: "Accept", short: "Accept sendes", buildLabel: "Modtageren siger ja og sender accepten", description: "Modtageren siger ja og sender en accept tilbage.", type: "action", lane: "right", direction: "left", symbol: "↙", category: "Accept", binding: "Accepten er på vej tilbage til tilbudsgiver.", checklist: "Modtageren sender en accept tilbage." },
      { id: "accept-modtaget", title: "Brevsprækkeøjeblikket", short: "Accept modtaget", buildLabel: "Accepten kommer frem inden fristen", description: "Accepten kommer frem inden fristen, og tilbudsgiver er bundet.", type: "received", lane: "left", symbol: "↓", category: "Modtaget", binding: "Accepten skal komme frem inden fristen. Tilbudsgiver er bundet.", checklist: "Accepten kommer frem inden fristen — brevsprække." },
      { id: "accept-laest", title: "Kundskabsøjeblikket", short: "Accept læst", buildLabel: "Tilbudsgiver læser accepten", description: "Tilbudsgiver læser accepten. Nu er begge parter bundet.", type: "read", lane: "left", symbol: "✓", category: "Begge er bundet", binding: "Nu er begge parter bundet. Modellen er gennemført.", checklist: "Tilbudsgiver læser accepten — kundskab. Begge er bundet." }
    ];
    const stepById = new Map(steps.map((step) => [step.id, step]));

    const flashcards = [
      { id: "f1", topic: "OVERBLIK", question: "Hvilket spørgsmål skal aftalemodellen hjælpe dig med at besvare?", answer: "Om der er indgået en bindende aftale mellem to parter." },
      { id: "f2", topic: "TO ØJEBLIKKE", question: "Hvad betyder brevsprækkeøjeblikket?", answer: "Meddelelsen er modtaget — fx kommet frem til indbakken." },
      { id: "f3", topic: "TO ØJEBLIKKE", question: "Hvad betyder kundskabsøjeblikket?", answer: "Meddelelsen er læst." },
      { id: "f4", topic: "BINDENDE AFTALE", question: "Hvornår bliver tilbudsgiver bundet i trin 3?", answer: "Når tilbudsmodtager læser tilbuddet — kundskabsøjeblikket." },
      { id: "f5", topic: "BETÆNKNINGSTID", question: "Hvilke tre muligheder har tilbudsmodtager?", answer: "Acceptere, afslå eller lade tilbuddet udløbe." },
      { id: "f6", topic: "ACCEPT", question: "Hvad gør modtageren, når tilbuddet accepteres?", answer: "Siger ja og sender en accept tilbage til tilbudsgiver." },
      { id: "f7", topic: "ACCEPTFRIST", question: "Hvad er en acceptfrist?", answer: "Den tid, man har til at acceptere tilbuddet." },
      { id: "f8", topic: "BINDENDE AFTALE", question: "Hvornår er begge parter bundet i modellen?", answer: "Når tilbudsgiver læser accepten i trin 7." },
      { id: "f9", topic: "VIGTIGT · REGLER", question: "Hvad betyder deklaratoriske regler?", answer: "Fravigelige regler. Parterne må gerne aftale noget andet, end loven siger." },
      { id: "f10", topic: "VIGTIGT · REGLER", question: "Hvad betyder præceptive regler?", answer: "Ufravigelige regler. Parterne må IKKE aftale andet, end loven siger." },
      { id: "f11", topic: "VIGTIGT · REGLER", question: "Hvad er beskyttelsespræceptive regler?", answer: "Parterne må gerne aftale andet, så længe det er til den svage parts fordel." },
      { id: "f12", topic: "AFTALEFORM", question: "Er både skriftlige og mundtlige aftaler bindende?", answer: "Ja, begge er bindende." },
      { id: "f13", topic: "LØFTE", question: "Hvad er et stiltiende løfte?", answer: "Man bliver bundet af en aftale uden at sige noget." },
      { id: "f14", topic: "FIRE CENTRALE ORD", question: "Hvilke fire ord er centrale i aftaleretten?", answer: "Løfte, tilbud, accept og påbud." },
      { id: "f15", topic: "LØFTE", question: "Hvornår binder et løfte?", answer: "Når det er læst — i kundskabsøjeblikket." },
      { id: "f16", topic: "PÅBUD", question: "Hvornår binder et påbud?", answer: "Når det er modtaget — i brevsprækkeøjeblikket." },
      { id: "f17", topic: "MODELLEN · TRIN 1", question: "Hvad sker der i trin 1?", answer: "Tilbudsgiver sender et tilbud til tilbudsmodtager." },
      { id: "f18", topic: "MODELLEN · TRIN 2", question: "Hvad sker der i trin 2?", answer: "Tilbuddet kommer frem til modtagerens indbakke. Det er brevsprækkeøjeblikket." },
      { id: "f19", topic: "MODELLEN · TRIN 3", question: "Hvad sker der i trin 3?", answer: "Modtageren læser tilbuddet. Det er kundskabsøjeblikket, og tilbudsgiver bliver bundet." },
      { id: "f20", topic: "MODELLEN · TRIN 4", question: "Hvad sker der i trin 4?", answer: "Betænkningstid: Modtageren kan acceptere, afslå eller lade tilbuddet udløbe." },
      { id: "f21", topic: "MODELLEN · TRIN 5", question: "Hvad sker der i trin 5?", answer: "Modtageren siger ja og sender en accept tilbage." },
      { id: "f22", topic: "MODELLEN · TRIN 6", question: "Hvad sker der i trin 6?", answer: "Accepten kommer frem inden fristen. Det er brevsprækkeøjeblikket, og tilbudsgiver er bundet." },
      { id: "f23", topic: "MODELLEN · TRIN 7", question: "Hvad sker der i trin 7?", answer: "Tilbudsgiver læser accepten. Det er kundskabsøjeblikket. Nu er begge parter bundet." },
      { id: "f24", topic: "RÆKKEFØLGE", question: "Hvad kommer først: brevsprække eller kundskab?", answer: "Brevsprække: Meddelelsen modtages først. Kundskab: Derefter læses den." },
      { id: "f25", topic: "TO PARTER", question: "Hvem sender tilbuddet, og hvem sender accepten?", answer: "Tilbudsgiver sender tilbuddet. Tilbudsmodtager sender accepten tilbage." },
      { id: "f26", topic: "REGLER", question: "Ved hvilken regeltype må man kun fravige til den svage parts fordel?", answer: "Beskyttelsespræceptive regler." },
      { id: "f27", topic: "ACCEPTFRIST", question: "Hvad skal der være sket med accepten inden fristen i trin 6?", answer: "Den skal være kommet frem til tilbudsgiver — være modtaget." },
      { id: "f28", topic: "HUSKEREGEL", question: "Breve i kassen. Viden i hovedet. Hvilke to øjeblikke?", answer: "Breve i kassen = brevsprække (modtaget). Viden i hovedet = kundskab (læst)." }
    ];
    const flashById = new Map(flashcards.map((card) => [card.id, card]));

    const questions = [
      { id: "q1", question: "Hvornår bliver tilbudsgiver bundet i trin 3?", options: ["Når tilbudsgiver skriver tilbuddet.", "Når modtageren læser tilbuddet.", "Når modtageren begynder at tænke over svaret."], correct: 1, explanation: "Tilbudsgiver bliver bundet, når tilbudsmodtager læser tilbuddet — i kundskabsøjeblikket." },
      { id: "q2", question: "Hvad betyder præceptiv?", options: ["Fravigelig.", "Kun mundtlig.", "Ufravigelig."], correct: 2, explanation: "Præceptive regler er ufravigelige. Parterne må IKKE aftale andet, end loven siger." },
      { id: "q3", question: "Hvad er forskellen på brevsprække og kundskab?", options: ["Brevsprække = modtaget. Kundskab = læst.", "Brevsprække = læst. Kundskab = modtaget.", "Der er ingen forskel."], correct: 0, explanation: "Brevsprækkeøjeblikket er modtagelsen. Kundskabsøjeblikket er, når meddelelsen læses." },
      { id: "q4", question: "Hvad betyder deklaratoriske regler?", options: ["Parterne må aldrig aftale andet.", "Parterne må gerne aftale noget andet, end loven siger.", "Reglerne gælder kun skriftlige aftaler."], correct: 1, explanation: "Deklaratoriske regler er fravigelige. Parterne må gerne aftale noget andet." },
      { id: "q5", question: "Hvornår må parterne fravige beskyttelsespræceptive regler?", options: ["Når det er til den stærke parts fordel.", "Kun når aftalen er mundtlig.", "Når det er til den svage parts fordel."], correct: 2, explanation: "Beskyttelsespræceptive regler må fraviges til den svage parts fordel." },
      { id: "q6", question: "Hvilke aftaleformer er bindende?", options: ["Kun skriftlige.", "Både skriftlige og mundtlige.", "Kun mundtlige."], correct: 1, explanation: "Både skriftlige og mundtlige aftaler er bindende." },
      { id: "q7", question: "Hvad er et stiltiende løfte?", options: ["Man bliver bundet uden at sige noget.", "Et tilbud, der er læst op.", "En aftale, der altid skal skrives ned."], correct: 0, explanation: "Et stiltiende løfte betyder, at man bliver bundet af en aftale uden at sige noget." },
      { id: "q8", question: "Hvornår binder et påbud?", options: ["Når det er læst.", "Når det er modtaget.", "Før det er sendt."], correct: 1, explanation: "Et påbud binder ved modtagelsen — i brevsprækkeøjeblikket." },
      { id: "q9", question: "Hvornår binder et løfte?", options: ["Når det er skrevet.", "Når det bliver tænkt.", "Når det er læst."], correct: 2, explanation: "Et løfte binder, når det er læst — i kundskabsøjeblikket." },
      { id: "q10", question: "Hvad er en acceptfrist?", options: ["Den tid, man har til at acceptere tilbuddet.", "Den tid, det tager at skrive et tilbud.", "Tidspunktet, hvor begge parter læser samme brev."], correct: 0, explanation: "Acceptfristen er den tid, man har til at acceptere tilbuddet." },
      { id: "q11", question: "Hvilke muligheder har modtageren i betænkningstiden?", options: ["Kun at acceptere.", "Acceptere eller sende et påbud.", "Acceptere, afslå eller lade tilbuddet udløbe."], correct: 2, explanation: "I trin 4 kan modtageren acceptere, afslå eller lade tilbuddet udløbe." },
      { id: "q12", question: "Hvad sker der i trin 6?", options: ["Tilbudsgiver sender det første tilbud.", "Accepten kommer frem inden fristen, og tilbudsgiver er bundet.", "Modtageren begynder sin betænkningstid."], correct: 1, explanation: "Trin 6 er acceptens brevsprækkeøjeblik. Accepten kommer frem inden fristen, og tilbudsgiver er bundet." },
      { id: "q13", question: "Hvornår er begge parter bundet ifølge modellen?", options: ["Når modtageren tænker på at sige ja.", "Når tilbudsgiver sender sit tilbud.", "Når tilbudsgiver læser accepten."], correct: 2, explanation: "I trin 7 læser tilbudsgiver accepten. Nu er begge parter bundet." },
      { id: "q14", question: "Hvilken rækkefølge er rigtig?", options: ["Tilbud → modtaget → læst → betænkningstid → accept → modtaget → læst.", "Tilbud → læst → modtaget → accept → betænkningstid → læst → modtaget.", "Accept → tilbud → betænkningstid → læst → modtaget → læst → modtaget."], correct: 0, explanation: "Først sendes tilbuddet, som modtages og læses. Efter betænkningstiden sendes accepten, som modtages og læses." },
      { id: "q15", question: "Hvilke fire ord er centrale i aftaleretten?", options: ["Brev, indbakke, frist og papir.", "Løfte, tilbud, accept og påbud.", "Skrift, tale, stilhed og tid."], correct: 1, explanation: "De fire centrale ord er løfte, tilbud, accept og påbud." }
    ];

    // Lagring er valgfri: øvelserne fortsætter i hukommelsen ved blokeret lager.
    let storageAvailable = true;
    let storageNoticeShown = false;
    const state = { theme: "system", known: [], difficulties: {}, results: [], best: { build: 0, draw: 0 } };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") {
        if (["system", "light", "dark"].includes(saved.theme)) state.theme = saved.theme;
        if (Array.isArray(saved.known)) state.known = [...new Set(saved.known.filter((id) => flashById.has(id)))];
        if (saved.difficulties && typeof saved.difficulties === "object") {
          for (const card of flashcards) {
            const weight = saved.difficulties[card.id];
            if (Number.isInteger(weight) && weight > 0 && weight <= 4) state.difficulties[card.id] = weight;
          }
        }
        if (Array.isArray(saved.results)) state.results = saved.results.filter((item) => item && ["build", "draw"].includes(item.mode) && Number.isInteger(item.score) && item.score >= 0 && item.score <= 100 && Number.isFinite(item.time) && item.time > 0 && item.time < 8640000000000000).slice(-20);
        for (const mode of ["build", "draw"]) {
          const best = saved.best && saved.best[mode];
          if (Number.isInteger(best) && best >= 0 && best <= 100) state.best[mode] = best;
          for (const result of state.results) if (result.mode === mode) state.best[mode] = Math.max(state.best[mode], result.score);
        }
      }
    } catch { storageAvailable = false; }

    let toastTimer;
    function toast(message) {
      $("#toast").textContent = message;
      $("#toast").hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { $("#toast").hidden = true; }, 4200);
    }
    function saveState() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
      catch {
        storageAvailable = false;
        if (!storageNoticeShown) {
          toast("Browseren kan ikke gemme her. Du kan stadig øve dig, men fremgangen forsvinder, når siden lukkes.");
          storageNoticeShown = true;
        }
      }
    }

    // Tema: automatisk som standard, derefter mørkt/lyst og tilbage til systemet.
    function applyTheme() {
      if (state.theme === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.dataset.theme = state.theme;
      const labels = { system: "Automatisk", light: "Lyst", dark: "Mørkt" };
      const dark = state.theme === "dark" || (state.theme === "system" && systemTheme.matches);
      $("#themeLabel").textContent = labels[state.theme];
      $("#themeToggle").setAttribute("aria-label", "Tema: " + labels[state.theme] + ". Skift tema");
      $("#themeToggle").title = "Tema: " + labels[state.theme] + ". Klik for at skifte; tre klik giver automatisk tema igen.";
      $("meta[name='theme-color']").content = dark ? "#11151f" : "#fafbfe";
      if (studyToolsReady) refreshGraphics();
    }
    $("#themeToggle").addEventListener("click", () => {
      if (state.theme === "system") state.theme = systemTheme.matches ? "light" : "dark";
      else if (state.theme === (systemTheme.matches ? "dark" : "light")) state.theme = "system";
      else state.theme = systemTheme.matches ? "dark" : "light";
      applyTheme(); saveState(); toast("Tema: " + $("#themeLabel").textContent);
    });
    systemTheme.addEventListener("change", applyTheme);
    applyTheme();

    // Interaktiv tidslinje. Klassen angiver spor, og teksten angiver altid øjeblikket.
    let currentStep = 0;
    let modelTimer = null;
    const timelineButtons = [];
    steps.forEach((step, index) => {
      const row = element("div", "timeline-row");
      const marker = element("span", "timeline-marker", String(index + 1));
      marker.setAttribute("aria-hidden", "true");
      const button = element("button", "step-card lane-" + step.lane + " " + step.type);
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "Trin " + (index + 1) + ": " + step.title + ". " + step.short);
      button.classList.add("kind-" + kindOfStep(index));
      const heading = element("strong"); heading.append(iconNode(kindOfStep(index)), document.createTextNode(step.title));
      button.append(heading, element("small", "", step.short));
      button.addEventListener("click", () => { stopModel(); selectStep(index); });
      button.addEventListener("keydown", (event) => {
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault(); stopModel();
        const delta = ["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1;
        const next = event.key === "Home" ? 0 : event.key === "End" ? 6 : Math.max(0, Math.min(6, index + delta));
        selectStep(next); timelineButtons[next].focus({ preventScroll: true });
      });
      row.append(marker, button);
      const listen = soundButton("Læs trin " + (index + 1) + " op", () => readOne("Trin " + (index + 1) + ": " + step.title, step.description + " " + step.binding, button));
      listen.classList.add("step-audio", "lane-" + step.lane); row.append(listen);
      if (step.direction) {
        const side = step.lane === "left" ? "right" : "left";
        const label = element("div", "timeline-direction " + side);
        label.setAttribute("aria-hidden", "true");
        label.append(document.createTextNode(step.direction === "right" ? "Tilbud " : "Accept "), element("span", "", step.direction === "right" ? "→" : "←"));
        row.append(label);
      }
      $("#timeline").append(row); timelineButtons.push(button);
    });
    function selectStep(index) {
      currentStep = index;
      const step = steps[index];
      timelineButtons.forEach((button, i) => {
        button.classList.toggle("is-active", i === index);
        button.setAttribute("aria-pressed", String(i === index));
        button.parentElement.classList.toggle("is-active", i === index);
        button.parentElement.classList.toggle("is-visited", i <= index);
      });
      const kind = kindOfStep(index);
      $("#stepCategory").replaceChildren(iconNode(kind), document.createTextNode(step.category));
      $("#stepCategory").className = "pill semantic-pill role-" + kind;
      $("#stepCounter").textContent = String(index + 1).padStart(2, "0") + " / 07";
      $("#stepIcon").innerHTML = iconMarkup(kind);
      $("#stepIcon").className = "detail-symbol role-" + kind;
      $("#stepRole").replaceChildren(semanticTag(step.lane === "left" ? "giver" : "recipient", true));
      $("#stepTitle").textContent = step.title;
      $("#stepExplanation").textContent = step.description;
      $("#stepBinding").textContent = step.binding;
      $("#previousStep").disabled = index === 0;
      $("#nextStep").textContent = index === 6 ? "Start forfra ↻" : "Næste trin →";
      $$("[data-graphic-step]").forEach((node) => node.classList.toggle("is-graphic-active", Number(node.dataset.graphicStep) === index));
    }
    function stopModel() {
      clearInterval(modelTimer); modelTimer = null;
      $("#playModel").textContent = "▷ Afspil hele modellen";
      $("#playModel").setAttribute("aria-pressed", "false");
    }
    $("#nextStep").addEventListener("click", () => { stopModel(); selectStep((currentStep + 1) % steps.length); });
    $("#previousStep").addEventListener("click", () => { stopModel(); selectStep(Math.max(0, currentStep - 1)); });
    $("#playModel").addEventListener("click", () => {
      if (modelTimer) { stopModel(); return; }
      selectStep(0);
      $("#playModel").textContent = "Ⅱ Sæt afspilning på pause";
      $("#playModel").setAttribute("aria-pressed", "true");
      modelTimer = setInterval(() => {
        if (currentStep >= 6) { stopModel(); return; }
        selectStep(currentStep + 1);
        if (currentStep === 6) stopModel();
      }, 2100);
    });
    document.addEventListener("visibilitychange", () => { if (document.hidden) stopModel(); });
    selectStep(0);

    // Flashcards: en kø sikrer alle kort; svære kort indsættes flere gange.
    const known = new Set(state.known);
    let flashQueue = [];
    let flashHistory = [];
    let flashPosition = -1;
    let flashFlipped = false;
    let flashTouchStart = null;
    let suppressFlashClickUntil = 0;
    const allFlashIds = flashcards.map((card) => card.id);
    function makeFlashQueue() {
      const ids = allFlashIds.filter((id) => !known.has(id));
      const base = ids.length ? ids : allFlashIds;
      let queue = shuffle(base);
      for (const id of shuffle(base)) {
        for (let i = 0; i < (state.difficulties[id] || 0); i++) {
          queue.splice(Math.min(queue.length, Math.floor(Math.random() * Math.max(queue.length, 1))), 0, id);
        }
      }
      // Undgå ens nabokort, når der er andre muligheder.
      for (let i = 1; i < queue.length; i++) {
        if (queue[i] === queue[i - 1]) {
          const later = queue.findIndex((id, j) => j > i && id !== queue[i]);
          if (later !== -1) [queue[i], queue[later]] = [queue[later], queue[i]];
        }
      }
      return queue;
    }
    function setFlipped(flipped) {
      flashFlipped = flipped;
      $("#flashCard").classList.toggle("is-flipped", flipped);
      $("#flashCard").setAttribute("aria-pressed", String(flipped));
      $("#flashCard").setAttribute("aria-label", flipped ? "Svar: " + $("#flashAnswer").textContent + ". Vend for at se spørgsmålet." : "Spørgsmål: " + $("#flashQuestion").textContent + ". Vend for at se svaret.");
      $(".flash-front").setAttribute("aria-hidden", String(flipped));
      $(".flash-back").setAttribute("aria-hidden", String(!flipped));
      $("#flashAgain").disabled = !flipped;
      $("#flashKnown").disabled = !flipped;
    }
    function renderFlash() {
      const card = flashById.get(flashHistory[flashPosition]);
      $("#flashTopic").textContent = card.topic;
      $("#flashQuestion").textContent = card.question;
      $("#flashAnswer").textContent = card.answer;
      updateSemanticTags($("#flashSemantics"), card.question + " " + card.answer);
      $("#previousFlash").disabled = flashPosition === 0;
      $("#flashMastered").textContent = String(known.size);
      $("#flashProgress").value = known.size;
      $("#flashStatus").textContent = known.size === flashcards.length ? "Alle klaret! Du kan stadig repetere." : known.has(card.id) ? "Et kort, du allerede kan" : "Ét kort ad gangen";
      setFlipped(false);
    }
    function nextFlash() {
      if (flashPosition < flashHistory.length - 1) flashPosition++;
      else {
        if (!flashQueue.length) flashQueue = makeFlashQueue();
        let id = flashQueue.shift();
        if (id === flashHistory[flashPosition] && flashQueue.some((item) => item !== id)) {
          const nextDifferent = flashQueue.findIndex((item) => item !== id);
          const replacement = flashQueue.splice(nextDifferent, 1)[0];
          flashQueue.push(id); id = replacement;
        }
        flashHistory.push(id); flashPosition++;
      }
      renderFlash();
    }
    function restartFlashDeck() {
      flashQueue = makeFlashQueue(); flashHistory = []; flashPosition = -1; nextFlash();
    }
    function rateFlash(isKnown) {
      if (!flashFlipped) return;
      const id = flashHistory[flashPosition];
      // Vurdering af et tidligere kort fortsætter i en ny gren af øvekøen.
      flashHistory = flashHistory.slice(0, flashPosition + 1);
      if (isKnown) {
        known.add(id); delete state.difficulties[id];
        flashQueue = flashQueue.filter((item) => item !== id);
      } else {
        known.delete(id); state.difficulties[id] = Math.min(4, (state.difficulties[id] || 0) + 1);
        // To konkrete genbesøg plus højere vægt ved næste blanding.
        flashQueue = flashQueue.filter((item) => item !== id);
        flashQueue.splice(Math.min(2, flashQueue.length), 0, id);
        flashQueue.splice(Math.min(6, flashQueue.length), 0, id);
      }
      state.known = [...known]; saveState(); nextFlash();
      $("#flashCard").focus({ preventScroll: true });
      toast(isKnown ? (known.size === flashcards.length ? "Alle 28 kort er klaret. Godt gået!" : "Klaret — videre til det næste kort.") : "Kortet kommer snart igen. Gentagelse hjælper.");
    }
    $("#flashCard").addEventListener("click", () => { if (Date.now() >= suppressFlashClickUntil) setFlipped(!flashFlipped); });
    $("#nextFlash").addEventListener("click", nextFlash);
    $("#previousFlash").addEventListener("click", () => { if (flashPosition > 0) { flashPosition--; renderFlash(); } });
    $("#flashKnown").addEventListener("click", () => rateFlash(true));
    $("#flashAgain").addEventListener("click", () => rateFlash(false));
    $("#shuffleFlash").addEventListener("click", () => { restartFlashDeck(); toast("Kortene er blandet. Din fremgang er gemt."); });
    $("#resetFlash").addEventListener("click", () => { known.clear(); state.known = []; state.difficulties = {}; saveState(); restartFlashDeck(); toast("Flashcard-fremgangen er nulstillet."); });
    $("#flashcards").addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") { event.preventDefault(); nextFlash(); }
      if (event.key === "ArrowLeft" && flashPosition > 0) { event.preventDefault(); flashPosition--; renderFlash(); }
    });
    $("#flashCard").addEventListener("pointerdown", (event) => { flashTouchStart = { x: event.clientX, y: event.clientY, id: event.pointerId }; });
    $("#flashCard").addEventListener("pointerup", (event) => {
      if (!flashTouchStart || flashTouchStart.id !== event.pointerId) return;
      const dx = event.clientX - flashTouchStart.x;
      const dy = event.clientY - flashTouchStart.y;
      flashTouchStart = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        suppressFlashClickUntil = Date.now() + 500;
        if (dx < 0) nextFlash();
        else if (flashPosition > 0) { flashPosition--; renderFlash(); }
      }
    });
    $("#flashCard").addEventListener("pointercancel", () => { flashTouchStart = null; });
    $$(".flash-total").forEach((node) => { node.textContent = String(flashcards.length); });
    $("#flashProgress").max = flashcards.length;
    restartFlashDeck();

    // Quiz: svar låses efter valget. Forkerte spørgsmål kan øves separat.
    let quizItems = [];
    let quizPosition = 0;
    let quizAnswers = [];
    let quizAnswered = false;
    let wrongQuestions = [];
    function beginQuiz(items, focus = false) {
      quizItems = [...items]; quizPosition = 0; quizAnswers = []; quizAnswered = false;
      $("#quizQuestionPanel").hidden = false; $("#quizResult").hidden = true;
      $("#quizProgress").max = quizItems.length;
      renderQuestion(focus);
    }
    function renderQuestion(focus) {
      const question = quizItems[quizPosition];
      quizAnswered = false;
      $("#quizCounter").textContent = "SPØRGSMÅL " + String(quizPosition + 1).padStart(2, "0") + " / " + String(quizItems.length).padStart(2, "0");
      $("#quizProgress").value = quizPosition;
      $("#quizRunningScore").textContent = quizAnswers.filter((answer) => answer.correct).length + " rigtige";
      $("#quizQuestion").textContent = question.question;
      updateSemanticTags($("#quizSemantics"), question.question);
      $("#quizOptions").replaceChildren();
      question.options.forEach((option, index) => {
        const button = element("button", "quiz-option"); button.type = "button";
        button.append(element("span", "option-letter", String.fromCharCode(65 + index)), element("span", "", option));
        button.addEventListener("click", () => answerQuestion(index));
        $("#quizOptions").append(button);
      });
      $("#quizFeedback").hidden = true;
      $("#nextQuestion").disabled = true;
      $("#nextQuestion").textContent = quizPosition === quizItems.length - 1 ? "Se mit resultat →" : "Næste spørgsmål →";
      $("#quizInstruction").textContent = "Vælg det svar, du mener er rigtigt.";
      if (focus) $("#quizQuestion").focus({ preventScroll: true });
    }
    function answerQuestion(index) {
      if (quizAnswered) return;
      quizAnswered = true;
      const question = quizItems[quizPosition];
      const correct = index === question.correct;
      quizAnswers.push({ question, selected: index, correct });
      $$(".quiz-option", $("#quizOptions")).forEach((button, i) => {
        button.disabled = true;
        if (i === question.correct) {
          button.classList.add("correct"); $(".option-letter", button).textContent = "✓";
          button.setAttribute("aria-label", "Rigtigt svar: " + question.options[i]);
        }
        if (i === index && !correct) {
          button.classList.add("incorrect"); $(".option-letter", button).textContent = "×";
          button.setAttribute("aria-label", "Dit svar, forkert: " + question.options[i]);
        }
      });
      const feedback = $("#quizFeedback");
      feedback.classList.toggle("is-wrong", !correct);
      feedback.replaceChildren(element("strong", "", correct ? "Rigtigt — godt set." : "Ikke helt. Her er forklaringen."), document.createTextNode(question.explanation));
      feedback.hidden = false;
      $("#quizProgress").value = quizPosition + 1;
      $("#quizRunningScore").textContent = quizAnswers.filter((answer) => answer.correct).length + " rigtige";
      $("#nextQuestion").disabled = false;
      $("#quizInstruction").textContent = "Læs forklaringen, og fortsæt, når du er klar.";
      // Valgte svar låses; fokus flyttes til den næste brugbare kontrol.
      $("#nextQuestion").focus({ preventScroll: true });
    }
    function finishQuiz() {
      const correct = quizAnswers.filter((answer) => answer.correct).length;
      wrongQuestions = quizAnswers.filter((answer) => !answer.correct).map((answer) => answer.question);
      $("#quizQuestionPanel").hidden = true; $("#quizResult").hidden = false;
      $("#quizResultTitle").textContent = correct + " af " + quizItems.length + " rigtige";
      $("#quizResultText").textContent = correct === quizItems.length ? "Du har styr på denne runde. Prøv at genskabe modellen uden hjælp." : "Du fik " + Math.round(correct / quizItems.length * 100) + " %. Giv de svære spørgsmål en tur mere.";
      $("#retryWrong").disabled = wrongQuestions.length === 0;
      $("#retryWrong").textContent = wrongQuestions.length ? "Øv kun de forkerte (" + wrongQuestions.length + ")" : "Ingen forkerte at øve";
      $("#quizReview").replaceChildren();
      quizAnswers.filter((answer) => !answer.correct).forEach((answer) => {
        const details = element("details");
        details.append(element("summary", "", answer.question.question), element("p", "", "Dit svar: " + answer.question.options[answer.selected]), element("p", "", "Rigtigt svar: " + answer.question.options[answer.question.correct]), element("p", "", answer.question.explanation));
        $("#quizReview").append(details);
      });
      $("#quizResultTitle").focus({ preventScroll: true });
    }
    $("#nextQuestion").addEventListener("click", () => {
      if (!quizAnswered) return;
      if (quizPosition === quizItems.length - 1) finishQuiz();
      else { quizPosition++; renderQuestion(true); }
    });
    $("#retryWrong").addEventListener("click", () => { if (wrongQuestions.length) beginQuiz(wrongQuestions, true); });
    $("#restartQuiz").addEventListener("click", () => beginQuiz(questions, true));
    beginQuiz(questions);

    // Fælles facit og valg mellem de to øvelsestilstande.
    let practiceMode = "draw";
    let answerVisible = false;
    steps.forEach((step, i) => {
      const item = element("li", step.type);
      item.classList.add("kind-" + kindOfStep(i));
      const heading = element("strong"); heading.append(iconNode(kindOfStep(i)), document.createTextNode(step.title));
      item.append(element("span", "step-number", String(i + 1)), heading, document.createTextNode(step.description));
      item.append(soundButton("Læs facit til trin " + (i + 1) + " op", () => readOne("Trin " + (i + 1), step.description, item)));
      $("#answerSteps").append(item);
      const label = element("label", "check-label");
      const input = element("input"); input.type = "checkbox"; input.value = step.id; input.dataset.stepCheck = String(i);
      const symbol = iconNode(kindOfStep(i)); symbol.classList.add("role-" + kindOfStep(i));
      label.append(input, symbol, document.createTextNode((i + 1) + ". " + step.checklist));
      $("#drawingChecklist").append(label);
    });
    function showAnswer(visible) {
      answerVisible = visible;
      $("#answerModel").hidden = !visible;
      $("#practiceColumns").classList.toggle("has-answer", visible);
      $("#toggleAnswer").setAttribute("aria-expanded", String(visible));
      $("#toggleAnswer").textContent = visible ? "Skjul facit ↗" : "Vis facit ↗";
    }
    function setMode(mode) {
      practiceMode = mode;
      for (const name of ["draw", "build"]) {
        const active = name === mode;
        $("#" + name + "Tab").setAttribute("aria-selected", String(active));
        $("#" + name + "Tab").tabIndex = active ? 0 : -1;
        $("#" + name + "Panel").hidden = !active;
      }
      $("#practiceModeNote").textContent = mode === "draw" ? "Din tegning + din tjekliste = din selvvurdering." : "Modellen tjekkes automatisk. Markér også modtaget og læst.";
      $("#practiceMessage").hidden = true;
      if (mode === "draw") requestAnimationFrame(resizeCanvas);
    }
    for (const mode of ["draw", "build"]) {
      $("#" + mode + "Tab").addEventListener("click", () => setMode(mode));
      $("#" + mode + "Tab").addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const targetMode = event.key === "Home" ? "draw" : event.key === "End" ? "build" : mode === "draw" ? "build" : "draw";
        setMode(targetMode); $("#" + targetMode + "Tab").focus();
      });
    }
    $("#toggleAnswer").addEventListener("click", () => showAnswer(!answerVisible));

    // Canvas: vektorstregers koordinater bevares ved resize og ændret tema.
    const canvas = $("#drawingCanvas");
    const context = canvas.getContext("2d");
    const LOGICAL_WIDTH = 1000;
    const LOGICAL_HEIGHT = 750;
    let strokes = [];
    let undoneStrokes = [];
    let currentStroke = null;
    let activePointerId = null;
    let penTool = "pen";
    let penColor = "#26324b";
    let penSize = 3;
    let drawingFrame = 0;
    function updateDrawingControls() {
      $("#undoDrawing").disabled = strokes.length === 0;
      $("#redoDrawing").disabled = undoneStrokes.length === 0;
      $("#clearDrawing").disabled = strokes.length === 0;
      $("#canvasEmpty").hidden = strokes.length > 0 || currentStroke !== null;
    }
    function drawStroke(stroke) {
      if (!stroke.points.length || !context) return;
      context.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
      context.strokeStyle = stroke.color;
      context.fillStyle = stroke.color;
      context.lineCap = "round"; context.lineJoin = "round";
      const points = stroke.points;
      if (points.length === 1) {
        context.beginPath(); context.arc(points[0].x, points[0].y, stroke.size * points[0].pressure / 2, 0, Math.PI * 2); context.fill();
        return;
      }
      for (let i = 1; i < points.length; i++) {
        const from = points[i - 1]; const to = points[i];
        context.lineWidth = stroke.size * (from.pressure + to.pressure) / 2;
        context.beginPath(); context.moveTo(from.x, from.y); context.lineTo(to.x, to.y); context.stroke();
      }
    }
    function renderDrawing() {
      drawingFrame = 0;
      if (!context) return;
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(canvas.width / LOGICAL_WIDTH, 0, 0, canvas.height / LOGICAL_HEIGHT, 0, 0);
      for (const stroke of strokes) drawStroke(stroke);
      if (currentStroke) drawStroke(currentStroke);
      context.restore();
    }
    function scheduleDrawing() { if (!drawingFrame) drawingFrame = requestAnimationFrame(renderDrawing); }
    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
      renderDrawing();
    }
    function pointFor(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: (event.clientX - rect.left) / rect.width * LOGICAL_WIDTH, y: (event.clientY - rect.top) / rect.height * LOGICAL_HEIGHT, pressure: event.pointerType === "pen" ? Math.max(.25, event.pressure || .5) * 1.6 : 1 };
    }
    canvas.addEventListener("pointerdown", (event) => {
      if (!context || activePointerId !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
      event.preventDefault(); canvas.focus({ preventScroll: true });
      activePointerId = event.pointerId; canvas.setPointerCapture(event.pointerId);
      const rect = canvas.getBoundingClientRect();
      currentStroke = { tool: penTool, color: penColor, size: (penTool === "eraser" ? 22 : penSize) * LOGICAL_WIDTH / rect.width, points: [pointFor(event)] };
      undoneStrokes = []; updateDrawingControls(); scheduleDrawing();
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!currentStroke || event.pointerId !== activePointerId) return;
      event.preventDefault();
      const events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
      for (const point of events.length ? events : [event]) currentStroke.points.push(pointFor(point));
      scheduleDrawing();
    });
    function finishStroke(event) {
      if (event.pointerId !== activePointerId || !currentStroke) return;
      strokes.push(currentStroke); currentStroke = null; activePointerId = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      updateDrawingControls(); renderDrawing();
    }
    canvas.addEventListener("pointerup", finishStroke);
    canvas.addEventListener("pointercancel", finishStroke);
    canvas.addEventListener("lostpointercapture", finishStroke);
    function chooseTool(tool) {
      penTool = tool;
      $("#penTool").classList.toggle("is-active", tool === "pen");
      $("#eraserTool").classList.toggle("is-active", tool === "eraser");
      $("#penTool").setAttribute("aria-pressed", String(tool === "pen"));
      $("#eraserTool").setAttribute("aria-pressed", String(tool === "eraser"));
      canvas.classList.toggle("is-eraser", tool === "eraser");
    }
    $("#penTool").addEventListener("click", () => chooseTool("pen"));
    $("#eraserTool").addEventListener("click", () => chooseTool("eraser"));
    $$("[data-color]").forEach((button) => button.addEventListener("click", () => {
      penColor = button.dataset.color; chooseTool("pen");
      $$("[data-color]").forEach((swatch) => { swatch.classList.toggle("is-active", swatch === button); swatch.setAttribute("aria-pressed", String(swatch === button)); });
    }));
    $("#customColor").addEventListener("input", (event) => {
      penColor = event.target.value; chooseTool("pen");
      $$("[data-color]").forEach((button) => { button.classList.remove("is-active"); button.setAttribute("aria-pressed", "false"); });
    });
    $("#penSize").addEventListener("input", (event) => { penSize = Number(event.target.value); $("#penSizeValue").value = String(penSize); });
    function undoDrawing() { if (strokes.length) { undoneStrokes.push(strokes.pop()); updateDrawingControls(); renderDrawing(); } }
    function redoDrawing() { if (undoneStrokes.length) { strokes.push(undoneStrokes.pop()); updateDrawingControls(); renderDrawing(); } }
    $("#undoDrawing").addEventListener("click", undoDrawing);
    $("#redoDrawing").addEventListener("click", redoDrawing);
    $("#clearDrawing").addEventListener("click", () => {
      // Rydning kan fortrydes streg for streg med Gendan.
      undoneStrokes = [...strokes].reverse(); strokes = []; updateDrawingControls(); renderDrawing();
      toast("Lærredet er ryddet. Gendan kan hente stregerne tilbage.");
    });
    $("#drawPanel").addEventListener("keydown", (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z" || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      event.preventDefault(); if (event.shiftKey) redoDrawing(); else undoDrawing();
    });
    if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(canvas);
    else window.addEventListener("resize", resizeCanvas);
    if (!context) { canvas.hidden = true; $("#canvasEmpty").textContent = "Canvas er ikke tilgængeligt. Vælg Byg modellen i stedet."; }
    updateDrawingControls(); requestAnimationFrame(resizeCanvas);

    // Byg: både træk med pointer events, tryk og almindelig tastaturbetjening.
    let buildOrder = shuffle(steps.map((step) => step.id));
    let buildSlots = Array(7).fill(null);
    let buildTypes = {};
    let selectedBuildId = null;
    let drag = null;
    let suppressBuildClickUntil = 0;
    let evaluatedBuild = false;
    function makeBuildCard(id) {
      const card = element("button", "build-card"); card.type = "button"; card.dataset.cardId = id;
      card.setAttribute("aria-pressed", String(selectedBuildId === id));
      card.setAttribute("aria-label", stepById.get(id).buildLabel + ". Vælg kortet, og tryk derefter på en plads, eller træk det.");
      const grip = element("span", "", "⋮⋮"); grip.setAttribute("aria-hidden", "true");
      const index = steps.findIndex((step) => step.id === id);
      card.classList.add("kind-" + kindOfStep(index));
      card.append(grip, iconNode(kindOfStep(index)), element("span", "", stepById.get(id).buildLabel));
      return card;
    }
    function renderBuild() {
      $("#buildTray").replaceChildren();
      for (const id of buildOrder) if (!buildSlots.includes(id)) $("#buildTray").append(makeBuildCard(id));
      $("#buildSlots").replaceChildren();
      buildSlots.forEach((id, index) => {
        const slot = element("div", "build-slot"); slot.dataset.slot = String(index);
        if (evaluatedBuild) slot.classList.add(id === steps[index].id ? "is-correct" : "is-incorrect");
        const target = element("button", "slot-target", String(index + 1)); target.type = "button"; target.dataset.placeSlot = String(index);
        target.setAttribute("aria-label", "Plads " + (index + 1) + ". " + (selectedBuildId ? "Placér det valgte trin her." : "Vælg først et kort, og tryk her for at placere det."));
        const content = element("div", "slot-content");
        if (id) {
          content.append(makeBuildCard(id));
          const remove = element("button", "slot-remove", "×"); remove.type = "button"; remove.dataset.removeSlot = String(index);
          remove.setAttribute("aria-label", "Fjern " + stepById.get(id).buildLabel + " fra plads " + (index + 1));
          content.append(remove);
        } else content.append(element("span", "empty-slot-label", "Placér et trin her"));
        slot.append(target, content);
        if (id && ["received", "read"].includes(stepById.get(id).type)) {
          const label = element("label", "slot-classification", "Hvilket øjeblik? ");
          const select = element("select"); select.dataset.typeCard = id; select.setAttribute("aria-label", "Øjeblik for " + stepById.get(id).buildLabel);
          for (const [value, text] of [["", "Vælg øjeblik"], ["received", "Brevsprække · modtaget"], ["read", "Kundskab · læst"]]) {
            const option = element("option", "", text); option.value = value; select.append(option);
          }
          select.value = buildTypes[id] || ""; label.append(select); slot.append(label);
        }
        $("#buildSlots").append(slot);
      });
      decorateBuildAudio();
    }
    function updateSelection() {
      $$("[data-card-id]", $("#buildPanel")).forEach((card) => card.setAttribute("aria-pressed", String(card.dataset.cardId === selectedBuildId)));
      $$("[data-place-slot]", $("#buildPanel")).forEach((button, i) => button.setAttribute("aria-label", "Plads " + (i + 1) + ". " + (selectedBuildId ? "Placér " + stepById.get(selectedBuildId).buildLabel + " her." : "Vælg først et kort.")));
    }
    function clearBuildFeedback() {
      evaluatedBuild = false;
      $$(".build-slot").forEach((slot) => slot.classList.remove("is-correct", "is-incorrect"));
    }
    function placeBuildCard(id, targetIndex, focus = false) {
      if (!stepById.has(id) || targetIndex < 0 || targetIndex > 6) return;
      const previousIndex = buildSlots.indexOf(id);
      const replaced = buildSlots[targetIndex];
      if (previousIndex === targetIndex) { selectedBuildId = null; updateSelection(); return; }
      if (previousIndex !== -1) buildSlots[previousIndex] = replaced;
      buildSlots[targetIndex] = id;
      selectedBuildId = null; evaluatedBuild = false; renderBuild();
      $("#buildStatus").textContent = "Placeret på plads " + (targetIndex + 1) + ": " + stepById.get(id).buildLabel + ".";
      if (focus) $("[data-place-slot='" + targetIndex + "']").focus({ preventScroll: true });
    }
    $("#buildPanel").addEventListener("click", (event) => {
      if (Date.now() < suppressBuildClickUntil) { event.preventDefault(); return; }
      const remove = event.target.closest("[data-remove-slot]");
      const target = event.target.closest("[data-place-slot]");
      const card = event.target.closest("[data-card-id]");
      if (remove) {
        const index = Number(remove.dataset.removeSlot); const id = buildSlots[index];
        buildSlots[index] = null; selectedBuildId = null; evaluatedBuild = false; renderBuild();
        $("#buildStatus").textContent = stepById.get(id).buildLabel + " er tilbage blandt kortene.";
        $("[data-card-id='" + id + "']", $("#buildTray")).focus({ preventScroll: true });
      } else if (target) {
        if (selectedBuildId) placeBuildCard(selectedBuildId, Number(target.dataset.placeSlot), true);
        else $("#buildStatus").textContent = "Vælg først et kort. Tryk derefter på nummeret på den ønskede plads.";
      } else if (card) {
        selectedBuildId = selectedBuildId === card.dataset.cardId ? null : card.dataset.cardId;
        updateSelection();
        $("#buildStatus").textContent = selectedBuildId ? "Valgt: " + stepById.get(selectedBuildId).buildLabel + ". Tryk på et pladsnummer for at placere kortet." : "Valget er fjernet. Vælg et nyt kort.";
      }
    });
    $("#buildPanel").addEventListener("change", (event) => {
      if (event.target.matches("[data-type-card]")) { buildTypes[event.target.dataset.typeCard] = event.target.value; clearBuildFeedback(); }
    });
    $("#buildPanel").addEventListener("keydown", (event) => {
      if (event.key === "Escape") { selectedBuildId = null; updateSelection(); $("#buildStatus").textContent = "Valget er fjernet."; }
    });
    $("#resetBuild").addEventListener("click", () => {
      buildSlots = Array(7).fill(null); buildTypes = {}; selectedBuildId = null; evaluatedBuild = false;
      buildOrder = shuffle(steps.map((step) => step.id)); renderBuild();
      $("#buildStatus").textContent = "Kortene er blandet. Byg modellen igen fra hukommelsen.";
    });
    $("#buildPanel").addEventListener("pointerdown", (event) => {
      const card = event.target.closest("[data-card-id]");
      if (!card || (event.pointerType === "mouse" && event.button !== 0)) return;
      drag = { id: card.dataset.cardId, x: event.clientX, y: event.clientY, pointerId: event.pointerId, source: card, active: false, ghost: null };
      card.setPointerCapture(event.pointerId);
    });
    $("#buildPanel").addEventListener("pointermove", (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (!drag.active && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 9) {
        drag.active = true; drag.source.classList.add("is-dragging");
        drag.ghost = makeBuildCard(drag.id); drag.ghost.classList.add("drag-ghost"); drag.ghost.setAttribute("aria-hidden", "true"); drag.ghost.tabIndex = -1; document.body.append(drag.ghost);
      }
      if (!drag.active) return;
      event.preventDefault();
      drag.ghost.style.left = Math.max(4, Math.min(window.innerWidth - 244, event.clientX - 80)) + "px";
      drag.ghost.style.top = event.clientY - 28 + "px";
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-slot]");
      $$(".build-slot").forEach((slot) => slot.classList.toggle("is-drop-target", slot === target));
      // Hjælp fingeren med at nå pladser længere nede i modellen.
      if (event.clientY > window.innerHeight - 85) window.scrollBy({ top: 13, behavior: "instant" });
      else if (event.clientY < 145) window.scrollBy({ top: -13, behavior: "instant" });
    });
    function finishDrag(event, cancelled = false) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const previous = drag;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-slot]");
      const tray = document.elementFromPoint(event.clientX, event.clientY)?.closest("#buildTray");
      drag = null;
      if (previous.source.hasPointerCapture(event.pointerId)) previous.source.releasePointerCapture(event.pointerId);
      previous.source.classList.remove("is-dragging"); previous.ghost?.remove();
      $$(".build-slot").forEach((slot) => slot.classList.remove("is-drop-target"));
      if (!previous.active) return;
      suppressBuildClickUntil = Date.now() + 500;
      if (cancelled) { $("#buildStatus").textContent = "Flytningen er annulleret."; return; }
      if (target) placeBuildCard(previous.id, Number(target.dataset.slot));
      else if (tray) {
        const index = buildSlots.indexOf(previous.id);
        if (index !== -1) buildSlots[index] = null;
        selectedBuildId = null; evaluatedBuild = false; renderBuild();
        $("#buildStatus").textContent = "Kortet er tilbage blandt de ledige kort.";
      } else $("#buildStatus").textContent = "Slip på en plads. Du kan også vælge kortet og trykke på pladsens nummer.";
    }
    $("#buildPanel").addEventListener("pointerup", (event) => finishDrag(event));
    $("#buildPanel").addEventListener("pointercancel", (event) => finishDrag(event, true));
    renderBuild();

    // Modelscore: gennemsigtige delpoint og mangelliste for begge tilstande.
    let scoreAnimation = 0;
    function evaluateBuild() {
      let correctlyPlaced = 0;
      let correctLinks = 0;
      let correctTypes = 0;
      const missing = [];
      buildSlots.forEach((id, index) => {
        if (id === steps[index].id) correctlyPlaced++;
        else missing.push("Plads " + (index + 1) + ": " + (id ? "Her skal være " : "Mangler ") + steps[index].buildLabel.toLowerCase() + ".");
      });
      for (let i = 0; i < 6; i++) {
        if (!buildSlots[i] || !buildSlots[i + 1]) continue;
        const firstIndex = steps.findIndex((step) => step.id === buildSlots[i]);
        const secondIndex = steps.findIndex((step) => step.id === buildSlots[i + 1]);
        if (secondIndex === firstIndex + 1) correctLinks++;
      }
      for (const step of steps.filter((item) => ["received", "read"].includes(item.type))) {
        if (buildSlots.includes(step.id) && buildTypes[step.id] === step.type) correctTypes++;
        else missing.push("Markér “" + step.buildLabel + "” som " + (step.type === "received" ? "brevsprække = modtaget." : "kundskab = læst."));
      }
      if (correctLinks < 6) missing.push("Rækkefølge: " + correctLinks + " af 6 overgange mellem nabotrin er rigtige.");
      const placementPoints = correctlyPlaced * 10;
      const orderPoints = Math.round(correctLinks / 6 * 20);
      const conceptPoints = Math.round(correctTypes / 4 * 10);
      evaluatedBuild = true; renderBuild();
      return { score: placementPoints + orderPoints + conceptPoints, missing, parts: ["Placering " + placementPoints + "/70", "Rækkefølge " + orderPoints + "/20", "Begreber " + conceptPoints + "/10"], description: "Automatisk tjek: " + correctlyPlaced + " af 7 trin er korrekt placeret. " + correctTypes + " af 4 øjeblikke er markeret rigtigt." };
    }
    function evaluateDrawing() {
      const checked = $$("[data-step-check]:checked").length;
      const orderValue = Number($("input[name='drawingOrder']:checked").value);
      const orderPoints = Math.round(orderValue * checked / 7);
      const conceptPoints = ($("#drawingMoments").checked ? 5 : 0) + ($("#drawingDeadline").checked ? 5 : 0);
      const missing = [];
      $$("[data-step-check]").forEach((input, index) => { if (!input.checked) missing.push("Trin " + (index + 1) + ": " + steps[index].checklist); });
      if (orderValue < 20) missing.push("Øv hele rækkefølgen fra tilbud til læst accept.");
      if (!$("#drawingMoments").checked) missing.push("Skeln mellem brevsprække = modtaget og kundskab = læst.");
      if (!$("#drawingDeadline").checked) missing.push("Tilføj acceptfristen: tiden til at acceptere tilbuddet.");
      return { score: checked * 10 + orderPoints + conceptPoints, missing, parts: ["Trin " + (checked * 10) + "/70", "Rækkefølge " + orderPoints + "/20", "Begreber " + conceptPoints + "/10"], description: "Din selvvurdering: " + checked + " af 7 trin er med. Scoren bygger på dine krydser og dit valg af rækkefølge — ikke billedgenkendelse." };
    }
    function animateScore(score) {
      cancelAnimationFrame(scoreAnimation);
      const circle = $("#scoreCircle");
      circle.style.transition = "none"; circle.style.strokeDashoffset = "314.159";
      $("#scoreValue").textContent = "0";
      // En layoutlæsning sikrer, at en ny vurdering også starter fra nul.
      circle.getBoundingClientRect();
      circle.style.transition = "";
      requestAnimationFrame(() => { circle.style.strokeDashoffset = String(314.159 * (1 - score / 100)); });
      if (reducedMotion.matches) { $("#scoreValue").textContent = String(score); return; }
      const start = performance.now();
      const tick = (time) => {
        const fraction = Math.min(1, (time - start) / 950);
        $("#scoreValue").textContent = String(Math.round(score * (1 - Math.pow(1 - fraction, 3))));
        if (fraction < 1) scoreAnimation = requestAnimationFrame(tick);
      };
      scoreAnimation = requestAnimationFrame(tick);
    }
    function renderHistory() {
      for (const mode of ["build", "draw"]) {
        const hasAttempt = state.results.some((result) => result.mode === mode) || state.best[mode] > 0;
        $(mode === "build" ? "#bestBuild" : "#bestDraw").textContent = hasAttempt ? state.best[mode] + "/100" : "—";
      }
      $("#scoreHistory").replaceChildren();
      $("#emptyHistory").hidden = state.results.length > 0;
      const dateFormat = new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      [...state.results].reverse().forEach((result) => {
        const item = element("li"); const date = new Date(result.time);
        const time = element("time", "", dateFormat.format(date)); time.dateTime = date.toISOString();
        item.append(element("span", "history-mode", result.mode === "build" ? "Byg · automatisk" : "Tegn · selvvurdering"), time, element("strong", "", result.score + "/100"));
        $("#scoreHistory").append(item);
      });
    }
    $("#checkModel").addEventListener("click", () => {
      if (practiceMode === "draw" && !strokes.some((stroke) => stroke.tool === "pen")) {
        $("#practiceMessage").textContent = "Tegn først din model på lærredet. Gennemgå derefter tjeklisten for at give din tegning en selvvurdering.";
        $("#practiceMessage").hidden = false; return;
      }
      $("#practiceMessage").hidden = true;
      const result = practiceMode === "build" ? evaluateBuild() : evaluateDrawing();
      showAnswer(true);
      $("#modelScore").hidden = false;
      $("#scoreMode").textContent = practiceMode === "build" ? "BYG · AUTOMATISK TJEK" : "TEGN · SELVVURDERING";
      $("#scoreAccessible").textContent = result.score + " af 100 point";
      $("#scoreTitle").textContent = result.score === 100 ? "Du har styr på modellen!" : result.score >= 75 ? "Du er der næsten!" : result.score >= 40 ? "Godt på vej." : "Et godt sted at starte.";
      $("#scoreDescription").textContent = result.description;
      $("#scoreBreakdown").replaceChildren(...result.parts.map((part) => element("span", "", part)));
      $("#scoreMissing").replaceChildren(...result.missing.map((item) => element("li", "", item)));
      if (result.missing.length === 0) $("#scoreMissing").append(element("li", "", "Alle syv trin, rækkefølgen og begreberne er med. Prøv igen med facit skjult."));
      state.results.push({ score: result.score, mode: practiceMode, time: Date.now() });
      state.results = state.results.slice(-20);
      state.best[practiceMode] = Math.max(state.best[practiceMode], result.score);
      saveState(); renderHistory(); animateScore(result.score);
      $("#scoreTitle").focus({ preventScroll: true });
      $("#modelScore").scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "center" });
    });
    renderHistory();

    // Fuld model som selvstændig SVG. Ingen fonte, billeder eller stilarter hentes.
    function escapeXml(value) {
      return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
    }
    function graphicPalette(forceLight) {
      const css = getComputedStyle(document.documentElement);
      const palette = { bg: "#ffffff", text: "#1c263b", muted: "#526078", line: "#a5afbf", number: "#ffffff" };
      const dark = !forceLight && (document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && systemTheme.matches));
      if (dark) Object.assign(palette, { bg: "#1a202d", text: "#edf0fa", muted: "#bbc5d6", line: "#8190aa", number: "#151b36" });
      for (const [kind, type] of Object.entries(TYPES)) palette[kind] = {
        ink: forceLight ? type.ink : css.getPropertyValue("--" + kind).trim() || type.ink,
        soft: forceLight ? type.soft : css.getPropertyValue("--" + kind + "-soft").trim() || type.soft
      };
      return palette;
    }
    function svgIcon(kind, x, y, color, size = 24) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + size / 24 + ')" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[kind] + '</g>';
    }
    function makeModelSvg(forceLight = false, prefix = "main", selected = -1) {
      const p = graphicPalette(forceLight);
      const lines = [
        ["Tilbudsgiver sender sit tilbud."],
        ["Tilbuddet er kommet frem til", "tilbudsmodtagerens indbakke."],
        ["Modtageren læser tilbuddet.", "Tilbudsgiver bliver bundet."],
        ["Acceptere, afslå eller lade", "tilbuddet udløbe."],
        ["Modtageren siger ja og", "sender en accept tilbage."],
        ["Accepten er fremme inden fristen.", "Tilbudsgiver er bundet."],
        ["Tilbudsgiver læser accepten.", "Nu er begge parter bundet."]
      ];
      const positions = [{ x: 40, y: 180 }, { x: 570, y: 295 }, { x: 570, y: 410 }, { x: 570, y: 525 }, { x: 570, y: 640 }, { x: 40, y: 755 }, { x: 40, y: 870 }];
      let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1100" viewBox="0 0 1100 1100" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc" font-family="Arial, Helvetica, sans-serif">';
      svg += '<title id="' + prefix + '-title">Aftalemodellens syv trin</title><desc id="' + prefix + '-desc">To spor: tilbudsgiver til venstre, tilbudsmodtager til højre. 1: tilbud sendes. 2: tilbud modtages. 3: tilbud læses og tilbudsgiver bliver bundet. 4: betænkningstid. 5: accept sendes retur. 6: accept kommer frem inden fristen. 7: accept læses; begge parter er bundet.</desc>';
      svg += '<rect width="1100" height="1100" rx="24" fill="' + p.bg + '"/><defs><marker id="' + prefix + '-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="' + p.line + '"/></marker></defs>';
      svg += '<text x="40" y="48" font-size="31" font-weight="700" fill="' + p.text + '">Aftalemodellen</text><text x="40" y="80" font-size="18" fill="' + p.muted + '">Følg tallene. Modtaget er ikke det samme som læst.</text>';
      for (const [kind, x] of [["giver", 40], ["recipient", 570]]) {
        svg += '<rect x="' + x + '" y="108" width="430" height="52" rx="12" fill="' + p[kind].soft + '"/>' + svgIcon(kind, x + 18, 121, p[kind].ink, 24) + '<text x="' + (x + 58) + '" y="141" font-size="21" font-weight="700" fill="' + p[kind].ink + '">' + TYPES[kind].label + '</text>';
      }
      svg += '<path d="M255 164v830M785 164v830" stroke="' + p.line + '" stroke-width="1.5" stroke-dasharray="5 8" opacity=".55"/>';
      const arrows = ["M470 226H785V288", "M785 387v16", "M785 502v16", "M785 617v16", "M570 686H255v62", "M255 847v16"];
      arrows.forEach((path) => { svg += '<path d="' + path + '" fill="none" stroke="' + p.line + '" stroke-width="2.5" marker-end="url(#' + prefix + '-arrow)"/>'; });
      svg += '<text x="505" y="211" font-size="18" fill="' + p.giver.ink + '">Tilbud →</text><text x="315" y="670" font-size="18" fill="' + p.recipient.ink + '">← Accept retur</text>';
      svg += '<rect x="1040" y="226" width="12" height="575" rx="6" fill="' + p.time.soft + '" stroke="' + p.time.ink + '" stroke-width="2"/><path d="M1032 226h28m-28 575h28" stroke="' + p.time.ink + '" stroke-width="2"/><text transform="translate(1080 700) rotate(-90)" font-size="19" font-weight="700" fill="' + p.time.ink + '">Acceptfrist · tid til at acceptere</text>';
      steps.forEach((step, i) => {
        const { x, y } = positions[i]; const kind = kindOfStep(i); const colors = p[kind];
        svg += '<g data-graphic-step="' + i + '" class="' + (i === selected ? "is-graphic-active" : "") + '"><rect class="svg-card" x="' + x + '" y="' + y + '" width="430" height="92" rx="13" fill="' + colors.soft + '" stroke="' + colors.ink + '" stroke-width="' + (i === selected ? 3 : 1) + '"/>';
        svg += '<circle cx="' + (x + 24) + '" cy="' + (y + 26) + '" r="15" fill="' + colors.ink + '"/><text x="' + (x + 24) + '" y="' + (y + 32) + '" font-size="17" text-anchor="middle" font-weight="700" fill="' + p.number + '">' + (i + 1) + '</text>';
        svg += svgIcon(kind, x + 49, y + 15, colors.ink, 23);
        svg += '<text x="' + (x + 83) + '" y="' + (y + 33) + '" font-size="20" font-weight="700" fill="' + colors.ink + '">' + escapeXml(step.title) + '</text>';
        lines[i].forEach((line, n) => { svg += '<text x="' + (x + 22) + '" y="' + (y + 58 + n * 22) + '" font-size="18" fill="' + p.text + '">' + escapeXml(line) + '</text>'; });
        svg += '</g>';
      });
      svg += '<rect x="40" y="1001" width="960" height="64" rx="12" fill="' + p.received.soft + '"/>' + svgIcon("received", 60, 1020, p.received.ink, 26) + '<text x="100" y="1039" font-size="20" font-weight="700" fill="' + p.received.ink + '">Brevsprække = modtaget</text>' + svgIcon("read", 550, 1020, p.read.ink, 26) + '<text x="590" y="1039" font-size="20" font-weight="700" fill="' + p.read.ink + '">Kundskab = læst</text></svg>';
      return svg;
    }
    let pictureZoom = 1;
    let pngUrl = null;
    function refreshGraphics() {
      $("#modelGraphic").innerHTML = makeModelSvg(false, "overview-graphic", currentStep);
      if ($("#graphicDialog").open) $("#zoomGraphicContent").innerHTML = makeModelSvg(false, "zoom-graphic", currentStep);
      if ($("#presentDialog").open) renderSlide();
    }
    function applyPictureZoom() {
      const viewport = $("#graphicViewport"); const style = getComputedStyle(viewport);
      const availableWidth = viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const availableHeight = viewport.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const fitSize = Math.max(180, Math.min(availableWidth, availableHeight));
      $("#zoomGraphicContent").style.width = Math.round(fitSize * pictureZoom) + "px";
      $("#graphicZoomValue").textContent = Math.round(pictureZoom * 100) + " %";
      $("#graphicZoomOut").disabled = pictureZoom <= 1;
      $("#graphicZoomIn").disabled = pictureZoom >= 4;
    }
    function openDialog(id) {
      const dialog = $("#" + id);
      if (!dialog.open) {
        stopModel(); stopSpeech(false);
        if (typeof dialog.showModal === "function") dialog.showModal();
        else { dialog.setAttribute("open", ""); dialog.setAttribute("aria-modal", "true"); }
      }
      document.body.classList.add("dialog-open");
    }
    function openGraphic() {
      openDialog("graphicDialog");
      $("#zoomGraphicContent").innerHTML = makeModelSvg(false, "zoom-graphic", currentStep);
      pictureZoom = window.innerWidth < 650 ? 2.5 : 1; applyPictureZoom();
      $("#graphicViewport").scrollTop = 0; $("#graphicViewport").scrollLeft = 0;
    }
    async function downloadPng() {
      const button = $("#downloadGraphic"); button.disabled = true;
      $("#graphicMessage").textContent = "Gør billedet klar…";
      const sourceUrl = URL.createObjectURL(new Blob([makeModelSvg(true, "png")], { type: "image/svg+xml;charset=utf-8" }));
      try {
        const picture = new Image();
        await new Promise((resolve, reject) => { picture.onload = resolve; picture.onerror = reject; picture.src = sourceUrl; });
        const output = document.createElement("canvas"); output.width = 2200; output.height = 2200;
        const ctx = output.getContext("2d"); if (!ctx) throw new Error("canvas-unavailable");
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, output.width, output.height); ctx.drawImage(picture, 0, 0, output.width, output.height);
        const blob = await new Promise((resolve) => output.toBlob(resolve, "image/png"));
        if (!blob) throw new Error("png-unavailable");
        if (pngUrl) URL.revokeObjectURL(pngUrl);
        pngUrl = URL.createObjectURL(blob);
        const link = $("#lastDownload"); link.href = pngUrl; link.download = "Aftalemodellen-model.png"; link.hidden = false;
        link.click();
        $("#graphicMessage").textContent = "Billedet er klar i 2200 × 2200 px. Brug linket her, hvis din browser ikke hentede det automatisk.";
      } catch {
        $("#graphicMessage").textContent = "Billedet kunne ikke gemmes her. Prøv igen, eller brug Print/gem som PDF.";
      } finally { URL.revokeObjectURL(sourceUrl); button.disabled = false; }
    }
    function printModel() {
      $("#printGraphicContent").innerHTML = makeModelSvg(true, "print");
      document.body.classList.add("is-print-model");
      try { window.print(); } catch { document.body.classList.remove("is-print-model"); toast("Print kunne ikke åbnes i denne browser."); }
    }

    const teacherQuestions = [
      { question: "Kan du forklare modellen kort?", answer: "Tilbudsgiver sender et tilbud. Det modtages og læses. Efter betænkningstid sender modtageren en accept, som kommer frem inden fristen og læses. Nu er begge bundet." },
      { question: "Hvad er forskellen på modtaget og læst?", answer: "Modtaget er brevsprækkeøjeblikket: meddelelsen er kommet frem. Læst er kundskabsøjeblikket: modtageren kender indholdet." },
      { question: "Hvornår bliver tilbudsgiver bundet?", answer: "I trin 3, når tilbudsmodtageren læser tilbuddet. Det er kundskabsøjeblikket." },
      { question: "Hvornår er begge parter bundet?", answer: "I trin 7, når tilbudsgiver læser accepten." },
      { question: "Hvad kan modtageren gøre i betænkningstiden?", answer: "Acceptere, afslå eller lade tilbuddet udløbe." },
      { question: "Hvad er en acceptfrist?", answer: "Den tid, man har til at acceptere tilbuddet. I trin 6 skal accepten være kommet frem inden fristen." },
      { question: "Hvordan skelner du mellem de tre slags regler?", answer: "Deklaratoriske regler kan fraviges. Præceptive regler kan ikke fraviges. Beskyttelsespræceptive regler må fraviges til den svage parts fordel." },
      { question: "Hvornår binder et løfte og et påbud?", answer: "Et løfte binder, når det er læst: kundskab. Et påbud binder, når det er modtaget: brevsprække." }
    ];
    function makeCheatSheet() {
      const wrap = element("div", "cheat-grid");
      const sequence = element("section", "cheat-sequence"); sequence.append(element("h3", "", "De syv trin"));
      const list = element("ol", "cheat-steps");
      const short = ["Tilbud sendes", "Tilbud modtages", "Tilbud læses · TG bundet", "Betænkningstid: ja, nej, udløb", "Accept sendes retur", "Accept fremme inden fristen", "Accept læses · begge bundet"];
      steps.forEach((step, i) => { const li = element("li", "role-" + kindOfStep(i)); li.append(element("span", "cheat-number", String(i + 1)), iconNode(kindOfStep(i)), element("span", "", short[i])); list.append(li); });
      sequence.append(list); wrap.append(sequence);
      const key = element("section", "cheat-key"); key.append(element("h3", "", "Det, du skal sige præcist"));
      for (const kind of ["received", "read"]) key.append(semanticTag(kind));
      key.append(element("p", "cheat-binding", "3: Tilbuddet læses → tilbudsgiver bundet."), element("p", "cheat-binding", "7: Accepten læses → begge bundet."));
      const rules = element("div", "cheat-rules");
      for (const kind of ["declarative", "mandatory", "protective"]) rules.append(semanticTag(kind));
      key.append(rules); wrap.append(key);
      const deadline = element("p", "cheat-deadline role-time"); deadline.append(iconNode("time"), document.createTextNode("Acceptfrist = den tid, man har til at acceptere tilbuddet."));
      const bottom = element("p", "cheat-bottom", "Løfte: læst (kundskab). Påbud: modtaget (brevsprække). Skriftlig og mundtlig aftale: begge bindende.");
      return [wrap, deadline, bottom];
    }
    function openCheat() { $("#cheatContent").replaceChildren(...makeCheatSheet()); openDialog("cheatDialog"); }
    let slideIndex = 0;
    const SLIDE_COUNT = 12;
    function renderSlide() {
      const content = $("#presentationContent"); content.replaceChildren();
      if (slideIndex === 0) {
        content.append(element("p", "eyebrow", "START HER"), element("h3", "slide-title", "Hvornår har vi en bindende aftale?"), element("p", "slide-lead", "Aftalemodellen følger et tilbud og en accept mellem to parter."));
        const tags = element("div", "semantic-tags slide-tags"); tags.append(semanticTag("giver"), semanticTag("recipient")); content.append(tags);
        content.append(element("p", "slide-keyline", "Syv trin. Modtaget og læst er to forskellige øjeblikke."));
      } else if (slideIndex === 1) {
        content.classList.add("slide-graphic-only");
        const graphic = element("div", "slide-whole-model"); graphic.innerHTML = makeModelSvg(false, "slide-full"); content.append(graphic);
      } else if (slideIndex >= 2 && slideIndex <= 8) {
        const index = slideIndex - 2; const step = steps[index];
        const split = element("div", "slide-split"); const copy = element("div", "slide-copy");
        copy.append(element("p", "eyebrow", "TRIN " + (index + 1) + " AF 7"), semanticTag(kindOfStep(index), true), element("h3", "slide-title", step.title), element("p", "slide-lead", step.description), element("p", "slide-binding", step.binding));
        const diagram = element("div", "slide-mini-model"); diagram.innerHTML = makeModelSvg(false, "slide-step", index);
        split.append(copy, diagram); content.append(split);
      } else if (slideIndex === 9) {
        content.append(element("p", "eyebrow", "DE TRE REGLER"), element("h3", "slide-title", "Ændr. Følg. Beskyt."));
        const rules = element("div", "slide-rule-grid");
        for (const kind of ["declarative", "mandatory", "protective"]) {
          const card = element("article", "slide-rule"); card.append(semanticTag(kind, true), element("p", "", TYPES[kind].hint + ".")); rules.append(card);
        }
        content.append(rules);
      } else if (slideIndex === 10) {
        content.append(element("p", "eyebrow", "HUSK FORSKELLEN"), element("h3", "slide-title", "Breve i kassen. Knuden i hovedet."));
        const tags = element("div", "semantic-tags slide-tags"); tags.append(semanticTag("received"), semanticTag("read")); content.append(tags);
        content.append(element("p", "slide-lead", "Send. Frem. Læs. Tænk. Ja. Frem. Læs."), element("p", "slide-keyline", "Tilbudsgiver bindes i trin 3. Begge parter er bundet i trin 7."));
      } else { content.append(...makeCheatSheet()); }
      content.classList.toggle("slide-graphic-only", slideIndex === 1);
      $("#slideCounter").textContent = (slideIndex + 1) + " / " + SLIDE_COUNT;
      $("#presentationProgress").value = slideIndex + 1;
      $("#previousSlide").disabled = slideIndex === 0;
      $("#nextSlide").textContent = slideIndex === SLIDE_COUNT - 1 ? "Afslut ✓" : "Næste →";
      content.scrollTop = 0;
    }
    function moveSlide(delta) {
      if (slideIndex === SLIDE_COUNT - 1 && delta > 0) { $("#presentDialog").close(); return; }
      slideIndex = Math.max(0, Math.min(SLIDE_COUNT - 1, slideIndex + delta)); renderSlide();
    }

    // Oplæsning: én kø, korte ytringer og et token, der afviser gamle callbacks.
    // Korte ytringer gør lange oplæsninger mere stabile på telefoner.
    const speechEngine = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function" ? window.speechSynthesis : null;
    const reader = { entries: [], index: 0, chunk: 0, parts: [], status: "idle", rate: 1, token: 0, utterance: null, boundary: 0, activeTarget: null };
    let danishVoice = null;
    let resumeTimer = null;
    function loadVoices() {
      if (!speechEngine) return;
      let voices = [];
      try { voices = speechEngine.getVoices(); } catch { /* Stemmeoversigten kan være forsinket. */ }
      const danish = voices.filter((voice) => /^da(?:[-_]|$)/i.test(voice.lang));
      danishVoice = danish.find((voice) => voice.localService && /^da[-_]DK$/i.test(voice.lang)) || danish.find((voice) => /^da[-_]DK$/i.test(voice.lang)) || danish[0] || null;
      $("#readerVoice").textContent = danishVoice ? "Stemme: " + danishVoice.name + " · dansk" + (danishVoice.localService ? " · lokal på enheden" : "") : "Ingen dansk stemme fundet endnu. Browseren forsøger med da-DK. Tilgængelige stemmer afhænger af din enhed.";
    }
    function readingParts(text) {
      const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
      const parts = []; let part = "";
      for (const sentence of sentences) {
        for (const word of sentence.trim().split(/\s+/)) {
          if (part.length + word.length > 180 && part) { parts.push(part.trim()); part = ""; }
          part += word + " ";
        }
        if (part.length >= 90) { parts.push(part.trim()); part = ""; }
      }
      if (part.trim()) parts.push(part.trim());
      return parts.length ? parts : ["Dette afsnit er tomt."];
    }
    function removeSpeechHighlight() {
      $$(".is-speaking").forEach((target) => target.classList.remove("is-speaking")); reader.activeTarget = null;
    }
    function openReader() {
      $("#readerDock").classList.remove("is-minimized"); $("#readerPanel").hidden = false;
      document.body.classList.add("reader-expanded");
    }
    function updateReader() {
      const entry = reader.entries[reader.index];
      $("#readerTitle").textContent = entry ? entry.title : "Læs det hele op";
      $("#readerCounter").textContent = (reader.entries.length ? reader.index + 1 : 0) + " / " + reader.entries.length;
      $("#readerPlay").textContent = reader.status === "paused" ? "Fortsæt" : reader.status === "ended" ? "Afspil igen" : "Afspil";
      $("#readerPlay").disabled = !speechEngine || reader.status === "speaking";
      $("#readerPause").disabled = !speechEngine || reader.status !== "speaking";
      $("#readerPause").setAttribute("aria-pressed", String(reader.status === "paused"));
      $("#readerStop").disabled = !speechEngine || ["idle", "ended"].includes(reader.status);
      $("#readerPrevious").disabled = !speechEngine || reader.index === 0;
      $("#readerNext").disabled = !speechEngine || reader.index >= reader.entries.length - 1;
      $("#readerRate").disabled = !speechEngine;
      if (!speechEngine) $("#readerStatus").textContent = "Din browser understøtter ikke oplæsning. Du kan stadig bruge alle øvelser, modelbilledet og fremlæggelsesvisningen.";
    }
    function cancelUtterance() {
      reader.token++; clearTimeout(resumeTimer); reader.utterance = null;
      if (speechEngine) { try { speechEngine.cancel(); } catch { /* En blokeret taleservice må ikke stoppe øvelserne. */ } }
    }
    function stopSpeech(announce = true) {
      cancelUtterance(); reader.status = "idle"; reader.chunk = 0; reader.parts = []; reader.boundary = 0;
      removeSpeechHighlight();
      if (studyToolsReady) {
        if (announce) $("#readerStatus").textContent = "Oplæsningen er stoppet.";
        updateReader();
      }
    }
    function markSpeechEntry(entry) {
      removeSpeechHighlight();
      const target = entry.target;
      if (target && target.isConnected) {
        if (target.tagName === "DETAILS") target.open = true;
        target.closest(".reveal")?.classList.add("is-visible"); target.classList.add("is-speaking"); reader.activeTarget = target;
        // Scroll aldrig bag en åben modal. I almindelig læsevisning følges teksten.
        if (!$$("dialog[open]").length) target.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "center" });
      }
      if (entry.activate) entry.activate();
    }
    function speakChunk() {
      if (!speechEngine || !reader.entries.length) { openReader(); updateReader(); return; }
      const entry = reader.entries[reader.index];
      if (!reader.parts.length) reader.parts = readingParts(entry.title + ". " + entry.text);
      cancelUtterance();
      const token = reader.token;
      const utterance = new SpeechSynthesisUtterance(reader.parts[reader.chunk]);
      // Behold referencen, så mobilbrowsere ikke mister den aktive ytring.
      reader.utterance = utterance; reader.boundary = 0;
      utterance.lang = "da-DK"; utterance.rate = reader.rate; utterance.pitch = 1; utterance.volume = 1;
      if (danishVoice) utterance.voice = danishVoice;
      utterance.onboundary = (event) => { if (token === reader.token && Number.isFinite(event.charIndex)) reader.boundary = event.charIndex; };
      utterance.onstart = () => { if (token === reader.token) { reader.status = "speaking"; $("#readerStatus").textContent = "Læser: " + entry.title; updateReader(); } };
      utterance.onend = () => {
        if (token !== reader.token || reader.status !== "speaking") return;
        reader.chunk++;
        if (reader.chunk < reader.parts.length) { speakChunk(); return; }
        if (reader.index < reader.entries.length - 1) {
          reader.index++; reader.chunk = 0; reader.parts = []; markSpeechEntry(reader.entries[reader.index]); speakChunk();
        } else {
          reader.status = "ended"; reader.utterance = null; removeSpeechHighlight();
          $("#readerStatus").textContent = "Færdig. Du kan afspille igen eller vælge et enkelt kort."; updateReader();
        }
      };
      utterance.onerror = (event) => {
        if (token !== reader.token || ["canceled", "interrupted"].includes(event.error)) return;
        reader.status = "idle"; reader.utterance = null; removeSpeechHighlight();
        $("#readerStatus").textContent = ["voice-unavailable", "language-unavailable", "synthesis-unavailable"].includes(event.error) ? "En talestemme er ikke tilgængelig her. Prøv en anden browser eller en dansk stemme på enheden." : "Browseren kunne ikke starte oplæsningen. Tryk Afspil for at prøve igen.";
        updateReader();
      };
      try {
        reader.status = "speaking"; updateReader();
        $("#readerStatus").textContent = "Starter: " + entry.title;
        if (speechEngine.paused) speechEngine.resume();
        speechEngine.speak(utterance);
      } catch {
        reader.status = "idle"; removeSpeechHighlight(); $("#readerStatus").textContent = "Oplæsningen kunne ikke startes. Tryk Afspil igen."; updateReader();
      }
    }
    function playReader() {
      openReader();
      if (!speechEngine) { updateReader(); return; }
      loadVoices();
      if (!reader.entries.length) reader.entries = allReadingEntries();
      if (reader.status === "paused" && reader.utterance) {
        reader.status = "speaking"; speechEngine.resume(); updateReader(); $("#readerStatus").textContent = "Fortsætter: " + reader.entries[reader.index].title;
        // Nogle mobilbrowsere afslutter i stedet for at pause. Genstart i så fald
        // kun resten af den korte ytring fra senest registrerede ord.
        resumeTimer = setTimeout(() => {
          if (reader.status === "speaking" && !speechEngine.speaking) {
            const rest = reader.parts[reader.chunk].slice(reader.boundary).trim();
            if (rest) reader.parts[reader.chunk] = rest; speakChunk();
          }
        }, 600);
        return;
      }
      if (reader.status === "ended") { reader.index = 0; reader.chunk = 0; reader.parts = []; }
      markSpeechEntry(reader.entries[reader.index]); speakChunk();
    }
    function readEntries(entries) {
      stopModel(); stopSpeech(false); reader.entries = entries; reader.index = 0; openReader(); playReader();
    }
    function readOne(title, text, target) { readEntries([{ title, text, target }]); }
    function allReadingEntries() {
      const entries = [{ title: "Kort fortalt", text: "Ved aftalers indgåelse ønskes et svar på, om der er indgået en bindende aftale mellem to parter. Brevsprække betyder modtaget. Kundskab betyder læst.", target: $("#overviewCard") }];
      steps.forEach((step, i) => entries.push({ title: "Trin " + (i + 1) + ": " + step.title, text: step.description + " " + step.binding, target: timelineButtons[i], activate: () => selectStep(i) }));
      $$(".accordion-list .concept").forEach((details) => entries.push({ title: $("summary > span", details).textContent.replace(/VIGTIGT.*/, "").trim(), text: $("p", details).textContent, target: details }));
      for (const id of ["memoryMoment", "memoryOrder", "memoryRules"]) {
        const card = $("#" + id); entries.push({ title: $("h3", card).textContent, text: $$("p", card).map((p) => p.textContent).join(" "), target: card });
      }
      entries.push({ title: "Fem ting du skal kunne", text: $$("li", $("#fiveThings")).map((li) => li.textContent).join(" "), target: $("#fiveThings") });
      teacherQuestions.forEach((item, i) => entries.push({ title: "Hvis læreren spørger: " + item.question, text: item.answer, target: $("#teacherQuestion-" + i) }));
      return entries;
    }
    function moveReading(delta) {
      if (!reader.entries.length) reader.entries = allReadingEntries();
      const next = Math.max(0, Math.min(reader.entries.length - 1, reader.index + delta));
      cancelUtterance(); reader.index = next; reader.chunk = 0; reader.parts = []; markSpeechEntry(reader.entries[next]); speakChunk();
    }
    function decorateBuildAudio() {
      $$(".build-card", $("#buildPanel")).forEach((card) => {
        if (card.parentElement.classList.contains("build-item")) return;
        const step = stepById.get(card.dataset.cardId); const wrap = element("span", "build-item"); card.before(wrap);
        wrap.append(card, soundButton("Læs byggekort: " + step.buildLabel, () => readOne(step.buildLabel, step.description, wrap)));
      });
    }
    function initializeStudyTools() {
      $$("[data-icon]").forEach((node) => { node.innerHTML = iconMarkup(node.dataset.icon); });
      $$("[data-tags]").forEach((node) => node.replaceChildren(...node.dataset.tags.split(" ").map((kind) => semanticTag(kind, true))));
      for (const kind of Object.keys(TYPES)) {
        const item = element("div", "legend-item"); item.append(semanticTag(kind, true), element("span", "", TYPES[kind].hint)); $("#semanticLegend").append(item);
      }
      const concepts = $$(".accordion-list .concept");
      const conceptKinds = ["declarative", "mandatory", "protective", null, null, null, "read", "received"];
      concepts.forEach((details, i) => {
        details.id = "concept-" + i; const kind = conceptKinds[i];
        if (kind) {
          details.classList.add("concept-" + kind); $("summary > span", details).prepend(iconNode(kind));
          const badge = $(".important-badge", details); if (badge) badge.textContent = "VIGTIGT · " + TYPES[kind].hint.toUpperCase();
        }
        const title = $("summary > span", details).textContent.replace(/VIGTIGT.*/, "").trim();
        details.append(soundButton("Læs begrebet " + title + " op", () => readOne(title, $("p", details).textContent, details)));
      });
      $$(".comparison-card tbody th").forEach((cell, i) => { const kind = i === 0 ? "received" : "read"; cell.classList.add("role-" + kind); cell.replaceChildren(iconNode(kind), document.createTextNode(TYPES[kind].label)); });
      for (const id of ["memoryMoment", "memoryOrder", "memoryRules", "fiveThings"]) {
        const card = $("#" + id); const title = $("h3", card).textContent;
        card.append(soundButton("Læs huskekortet op", () => readOne(title, $$("p:not(.eyebrow), li", card).map((node) => node.textContent).join(" "), card)));
      }
      $("#overviewCard").append(soundButton("Læs Kort fortalt op", () => readEntries([allReadingEntries()[0]])));
      const oldMemory = $(".memory-card");
      oldMemory.append(soundButton("Læs huskereglen op", () => readOne($("h3", oldMemory).textContent, $("p:last-of-type", oldMemory).textContent, oldMemory)));
      $(".comparison-card").append(soundButton("Læs sammenligningen op", () => readOne("Modtaget eller læst?", "Brevsprække: Meddelelsen er modtaget. Et påbud binder her. Kundskab: Meddelelsen er læst. Et løfte binder her.", $(".comparison-card"))));
      $(".graphic-actions").append(soundButton("Læs hele modellen op", () => readEntries(steps.map((step, i) => ({ title: "Trin " + (i + 1), text: step.description, target: $("#modelGraphic"), activate: () => selectStep(i) })))));
      teacherQuestions.forEach((item, i) => {
        const details = element("details", "teacher-question"); details.id = "teacherQuestion-" + i;
        details.append(element("summary", "", item.question), element("p", "", item.answer), soundButton("Læs spørgsmål og svar op", () => readOne(item.question, item.answer, details)));
        $("#teacherQuestions").append(details);
      });
      $("#listenCurrentStep").prepend(iconNode("speaker"));
      $("#listenCurrentStep").addEventListener("click", () => readOne("Trin " + (currentStep + 1) + ": " + steps[currentStep].title, steps[currentStep].description + " " + steps[currentStep].binding, timelineButtons[currentStep]));
      $("#listenFlash").addEventListener("click", () => { const card = flashById.get(flashHistory[flashPosition]); readOne(flashFlipped ? "Svar" : "Spørgsmål", flashFlipped ? card.answer : card.question, $("#flashCard")); });
      $("#listenQuiz").addEventListener("click", () => {
        const question = quizItems[quizPosition]; const text = question.question + " " + question.options.map((option, i) => String.fromCharCode(65 + i) + ": " + option).join(" ") + (quizAnswered ? " Forklaring: " + question.explanation : "");
        readOne("Quizspørgsmål", text, $("#quizCard"));
      });
      decorateBuildAudio();
      $("#scoreTitle").before(soundButton("Læs din modelvurdering op", () => readOne($("#scoreTitle").textContent, $("#scoreAccessible").textContent + ". " + $("#scoreDescription").textContent + " " + $$("li", $("#scoreMissing")).map((li) => li.textContent).join(" "), $("#modelScore"))));

      for (const id of ["graphicZoomTarget", "zoomGraphic"]) $("#" + id).addEventListener("click", openGraphic);
      $("#graphicZoomIn").addEventListener("click", () => { pictureZoom = Math.min(4, pictureZoom + .5); applyPictureZoom(); });
      $("#graphicZoomOut").addEventListener("click", () => { pictureZoom = Math.max(1, pictureZoom - .5); applyPictureZoom(); });
      $("#graphicFit").addEventListener("click", () => { pictureZoom = 1; applyPictureZoom(); $("#graphicViewport").scrollLeft = 0; });
      window.addEventListener("resize", () => { if ($("#graphicDialog").open) applyPictureZoom(); });
      $("#downloadGraphic").addEventListener("click", downloadPng);
      $("#printGraphic").addEventListener("click", printModel);
      window.addEventListener("afterprint", () => document.body.classList.remove("is-print-model"));
      for (const id of ["openCheat", "openCheatMemory", "presentCheat"]) $("#" + id).addEventListener("click", openCheat);
      $("#presentLaunch").addEventListener("click", () => { slideIndex = 0; openDialog("presentDialog"); renderSlide(); });
      $("#previousSlide").addEventListener("click", () => moveSlide(-1));
      $("#nextSlide").addEventListener("click", () => moveSlide(1));
      $("#presentDialog").addEventListener("keydown", (event) => {
        if (["ArrowLeft", "ArrowRight", "PageDown", "PageUp", "Home", "End"].includes(event.key) && !["INPUT", "SELECT"].includes(event.target.tagName)) {
          event.preventDefault();
          if (event.key === "Home" || event.key === "End") { slideIndex = event.key === "Home" ? 0 : SLIDE_COUNT - 1; renderSlide(); }
          else moveSlide(["ArrowLeft", "PageUp"].includes(event.key) ? -1 : 1);
        }
      });
      $$("[data-close]").forEach((button) => button.addEventListener("click", () => $("#" + button.dataset.close).close()));
      $$(".study-dialog").forEach((dialog) => dialog.addEventListener("close", () => {
        if (!$$(".study-dialog[open]").length) document.body.classList.remove("dialog-open");
        if (document.fullscreenElement === dialog && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }));
      $$("[data-fullscreen]").forEach((button) => {
        const target = $("#" + button.dataset.fullscreen);
        if (typeof target.requestFullscreen !== "function") { button.hidden = true; return; }
        button.addEventListener("click", async () => {
          try { if (document.fullscreenElement) await document.exitFullscreen(); else await target.requestFullscreen(); }
          catch { toast("Visningen fylder allerede siden. Browseren tillader ikke mere fuld skærm her."); }
        });
      });

      $("#readerLaunch").addEventListener("click", () => {
        if (["speaking", "paused"].includes(reader.status)) { openReader(); updateReader(); }
        else readEntries(allReadingEntries());
      });
      $("#readerAll").addEventListener("click", () => readEntries(allReadingEntries()));
      $("#readerPlay").addEventListener("click", playReader);
      $("#readerPause").addEventListener("click", () => {
        if (!speechEngine || reader.status !== "speaking") return;
        speechEngine.pause(); reader.status = "paused"; $("#readerStatus").textContent = "På pause. Tryk Fortsæt for at læse videre."; updateReader();
      });
      $("#readerStop").addEventListener("click", () => stopSpeech());
      $("#readerPrevious").addEventListener("click", () => moveReading(-1));
      $("#readerNext").addEventListener("click", () => moveReading(1));
      $("#readerRate").addEventListener("change", (event) => {
        reader.rate = Number(event.target.value);
        if (reader.status === "speaking") {
          const rest = (reader.parts[reader.chunk] || "").slice(reader.boundary).trim();
          if (rest) reader.parts[reader.chunk] = rest; speakChunk();
        } else if (reader.status === "paused") {
          const rest = (reader.parts[reader.chunk] || "").slice(reader.boundary).trim();
          if (rest) reader.parts[reader.chunk] = rest; cancelUtterance();
        }
      });
      $("#minimizeReader").addEventListener("click", () => {
        $("#readerDock").classList.add("is-minimized"); $("#readerPanel").hidden = true; document.body.classList.remove("reader-expanded");
        $("#readerLaunch").innerHTML = iconMarkup("speaker") + (["speaking", "paused"].includes(reader.status) ? " Vis oplæser" : " Læs det hele op");
      });
      if (speechEngine) {
        loadVoices();
        if (typeof speechEngine.addEventListener === "function") speechEngine.addEventListener("voiceschanged", loadVoices);
        else speechEngine.onvoiceschanged = loadVoices;
      } else $("#readerVoice").textContent = "Oplæsning kræver browserens Web Speech API. Resten af siden virker som normalt.";
      reader.entries = allReadingEntries();
      studyToolsReady = true; updateReader(); refreshGraphics();
      window.addEventListener("pagehide", () => { cancelUtterance(); if (pngUrl) URL.revokeObjectURL(pngUrl); });
    }

    initializeStudyTools();

    // Diskrete scroll-animationer og aktiv menumarkering.
    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); } });
      }, { threshold: .07 });
      if (!reducedMotion.matches) $$(".reveal").forEach((node) => { node.classList.add("will-reveal"); revealObserver.observe(node); });
      const navLinks = $$(".main-nav a");
      const navigationObserver = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        const id = visible[visible.length - 1].target.id;
        navLinks.forEach((link) => {
          if (link.getAttribute("href") === "#" + id) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }, { rootMargin: "-15% 0px -60% 0px", threshold: 0 });
      $$(".section-anchor").forEach((section) => navigationObserver.observe(section));
    }

    // Samme fil er service worker. Lokale file://-filer kræver ingen registrering.
    if ("serviceWorker" in navigator && ["https:", "http:"].includes(location.protocol)) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./script.js", { scope: "./" })
          .then(() => navigator.serviceWorker.ready)
          .then(() => {
            $("#offlineStatus").replaceChildren(element("i", "dot read-dot"), document.createTextNode("Offline klar · dine resultater bliver på enheden"));
            $("#offlineStatus i").setAttribute("aria-hidden", "true");
          })
          .catch(() => { /* Siden virker stadig uden service worker, når filerne er åbne. */ });
      });
    } else if (location.protocol === "file:") {
      $("#offlineStatus").textContent = "Offline klar · alle filer er lokale";
    }
    if (!storageAvailable) {
      $("#offlineStatus").textContent = "Øvelser virker her · browserens lagring er utilgængelig";
    }
  })();
}
