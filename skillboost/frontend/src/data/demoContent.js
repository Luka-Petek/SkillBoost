export const emptyPrompt = {
    skillKey: 'public-speaking',
    title: '',
    difficulty: 'ZAČETNIK',
    systemPrompt: 'Si interaktivni trener mehkih veščin. Ko je odgovor nejasen, postavi eno dodatno vprašanje, oceni strukturo, empatijo, jasnost in izvedljivost, nato vrni konkretne naslednje korake.',
    userPromptTemplate: 'Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nPodaj oceno, kratko pohvalo, točke za izboljšavo in eno vprašanje za nadaljevanje.',
    simulatedAiResponse: 'Strukturirana povratna informacija: ocena, kaj deluje, kaj izboljšati, predlagan popravek in eno nadaljnje vprašanje za uporabnika.',
    tags: []
};

export const demoUser = { id: 'demo-user', name: 'Demo uporabnik', role: 'STUDENT', points: 120, totalStars: 4, level: 2, currentLevelXp: 20, nextLevelXp: 150, streakDays: 1, badges: ['Prva simulacija', 'Učenec z več veščinami'], avatarConfig: { presentation: 'neutral', bodyStyle: 'balanced', skinTone: 'warm-medium', hairStyle: 'short-wave', hairColor: 'midnight', outfit: 'coach-hoodie', accent: 'violet', accessory: 'round-glasses' } };
export const demoRivals = [
    { id: 'demo-rival-ana', name: 'Ana Novak', role: 'STUDENT', points: 340, totalStars: 11, level: 3, currentLevelXp: 90, nextLevelXp: 200, streakDays: 4, badges: ['Močan odgovor', '3-dnevni niz'] },
    { id: 'demo-rival-luka', name: 'Luka Kovač', role: 'STUDENT', points: 275, totalStars: 8, level: 3, currentLevelXp: 25, nextLevelXp: 200, streakDays: 2, badges: ['Prva zvezdica', 'Miren reševalec'] },
    { id: 'demo-rival-eva', name: 'Eva Medved', role: 'STUDENT', points: 205, totalStars: 6, level: 2, currentLevelXp: 105, nextLevelXp: 150, streakDays: 1, badges: ['Komunikator pripravljen na AI'] }
];
export const demoSkills = [
    {
        "key": "public-speaking",
        "name": "Javno nastopanje",
        "category": "Komunikacija",
        "description": "Zgradi jasen nastop, prepričljivo strukturo in samozavesten zaključek.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 12,
        "outcomes": [
            "jasen uvod",
            "ključna poanta",
            "močan zaključek"
        ],
        "id": "s1"
    },
    {
        "key": "active-listening",
        "name": "Aktivno poslušanje",
        "category": "Komunikacija",
        "description": "Vadi poslušanje brez prekinjanja, povzemanje in boljša vprašanja.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 10,
        "outcomes": [
            "povzetek",
            "vprašanja",
            "razumevanje"
        ],
        "id": "s2"
    },
    {
        "key": "clear-writing",
        "name": "Jasno pisno izražanje",
        "category": "Komunikacija",
        "description": "Piši sporočila, ki so kratka, spoštljiva in imajo jasen naslednji korak.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 9,
        "outcomes": [
            "kratkost",
            "jasnost",
            "poziv k dejanju"
        ],
        "id": "s3"
    },
    {
        "key": "feedback-giving",
        "name": "Dajanje povratne informacije",
        "category": "Komunikacija",
        "description": "Podaj povratno informacijo brez napada: opazovanje, vpliv, predlog in dogovor.",
        "level": "SREDNJI",
        "estimatedMinutes": 14,
        "outcomes": [
            "opazovanje",
            "vpliv",
            "dogovor"
        ],
        "id": "s4"
    },
    {
        "key": "conflict-resolution",
        "name": "Reševanje konfliktov",
        "category": "Odnosi",
        "description": "Umiri napet pogovor, prepoznaj potrebe in vodi pogovor do dogovora.",
        "level": "SREDNJI",
        "estimatedMinutes": 15,
        "outcomes": [
            "miren ton",
            "potrebe",
            "dogovor"
        ],
        "id": "s5"
    },
    {
        "key": "empatija",
        "name": "Empatija",
        "category": "Odnosi",
        "description": "Prepoznaj čustva druge osebe in odgovori tako, da se počuti slišano.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 10,
        "outcomes": [
            "validacija",
            "spoštovanje",
            "topel ton"
        ],
        "id": "s6"
    },
    {
        "key": "boundaries",
        "name": "Postavljanje mej",
        "category": "Odnosi",
        "description": "Reci ne ali postavi mejo brez občutka krivde in brez nepotrebnega konflikta.",
        "level": "SREDNJI",
        "estimatedMinutes": 12,
        "outcomes": [
            "jasna meja",
            "spoštljiv ton",
            "alternativa"
        ],
        "id": "s7"
    },
    {
        "key": "networking",
        "name": "Grajenje poznanstev",
        "category": "Odnosi",
        "description": "Začni naraven pogovor, predstavi se in ohrani stik brez vsiljivosti.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 11,
        "outcomes": [
            "uvod",
            "interes",
            "nadaljnji stik"
        ],
        "id": "s8"
    },
    {
        "key": "job-interview",
        "name": "Zaposlitveni razgovor",
        "category": "Kariera in delo",
        "description": "Odgovarjaj na zahtevna vprašanja s konkretnimi primeri in mirno samozavestjo.",
        "level": "SREDNJI",
        "estimatedMinutes": 14,
        "outcomes": [
            "STAR odgovor",
            "primer",
            "refleksija"
        ],
        "id": "s9"
    },
    {
        "key": "negotiation",
        "name": "Pogajanje",
        "category": "Kariera in delo",
        "description": "Predstavi svoje interese, poslušaj drugo stran in poišči obojestransko koristen dogovor.",
        "level": "SREDNJI",
        "estimatedMinutes": 16,
        "outcomes": [
            "interesi",
            "ponudba",
            "kompromis"
        ],
        "id": "s10"
    },
    {
        "key": "leadership-basics",
        "name": "Osnove vodenja",
        "category": "Kariera in delo",
        "description": "Vodi pogovor z ekipo, razjasni odgovornosti in motiviraj brez mikromanagementa.",
        "level": "SREDNJI",
        "estimatedMinutes": 16,
        "outcomes": [
            "smer",
            "odgovornost",
            "motivacija"
        ],
        "id": "s11"
    },
    {
        "key": "meeting-facilitation",
        "name": "Vodenje sestankov",
        "category": "Kariera in delo",
        "description": "Naredi sestanke krajše, bolj jasne in usmerjene v odločitve.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 10,
        "outcomes": [
            "agenda",
            "odločitev",
            "akcije"
        ],
        "id": "s12"
    },
    {
        "key": "time-management",
        "name": "Upravljanje časa",
        "category": "Osebna učinkovitost",
        "description": "Razporedi čas, zaščiti fokus in pravočasno sporoči prioritete.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 10,
        "outcomes": [
            "prioritete",
            "blok časa",
            "realen rok"
        ],
        "id": "s13"
    },
    {
        "key": "prioritization",
        "name": "Prioritizacija",
        "category": "Osebna učinkovitost",
        "description": "Odloči, kaj je pomembno, kaj lahko počaka in kaj je treba delegirati.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 12,
        "outcomes": [
            "pomembnost",
            "nujnost",
            "odločitev"
        ],
        "id": "s14"
    },
    {
        "key": "decision-making",
        "name": "Sprejemanje odločitev",
        "category": "Osebna učinkovitost",
        "description": "Sprejemaj odločitve z manj odlašanja, jasnimi kriteriji in boljšim tveganjem.",
        "level": "SREDNJI",
        "estimatedMinutes": 14,
        "outcomes": [
            "kriteriji",
            "tveganja",
            "odločitev"
        ],
        "id": "s15"
    },
    {
        "key": "focus-discipline",
        "name": "Fokus in disciplina",
        "category": "Osebna učinkovitost",
        "description": "Zmanjšaj motnje, začni nalogo in vztrajaj tudi, ko motivacija pade.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 9,
        "outcomes": [
            "začetek",
            "okolje",
            "ritem"
        ],
        "id": "s16"
    },
    {
        "key": "stress-management",
        "name": "Obvladovanje stresa",
        "category": "Čustvena inteligenca",
        "description": "Prepoznaj pritisk, umiri odziv in izberi naslednji korak namesto panike.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 11,
        "outcomes": [
            "umiritev",
            "perspektiva",
            "korak"
        ],
        "id": "s17"
    },
    {
        "key": "emotional-regulation",
        "name": "Uravnavanje čustev",
        "category": "Čustvena inteligenca",
        "description": "Odgovori premišljeno tudi takrat, ko si jezen, razočaran ali pod pritiskom.",
        "level": "SREDNJI",
        "estimatedMinutes": 13,
        "outcomes": [
            "premor",
            "poimenovanje",
            "odziv"
        ],
        "id": "s18"
    },
    {
        "key": "self-confidence",
        "name": "Samozavest",
        "category": "Čustvena inteligenca",
        "description": "Predstavi svoje mnenje brez opravičevanja in z zdravim spoštovanjem do sebe.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 12,
        "outcomes": [
            "samozavesten ton",
            "argument",
            "mirnost"
        ],
        "id": "s19"
    },
    {
        "key": "resilience",
        "name": "Odpornost po neuspehu",
        "category": "Čustvena inteligenca",
        "description": "Po napaki ali zavrnitvi se hitro uči, popravi smer in nadaljuje.",
        "level": "SREDNJI",
        "estimatedMinutes": 13,
        "outcomes": [
            "učenje",
            "popravek",
            "vztrajnost"
        ],
        "id": "s20"
    },
    {
        "key": "personal-finance",
        "name": "Denarni pogovori",
        "category": "Vsakdanje življenje",
        "description": "Mirno govori o ceni, proračunu, stroških in pričakovanjih brez nelagodja.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 10,
        "outcomes": [
            "jasnost",
            "realen okvir",
            "dogovor"
        ],
        "id": "s21"
    },
    {
        "key": "asking-for-help",
        "name": "Prošnja za pomoč",
        "category": "Vsakdanje življenje",
        "description": "Jasno povej, kje si zataknjen, kaj si že poskusil in kakšno pomoč potrebuješ.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 8,
        "outcomes": [
            "kontekst",
            "poskus",
            "konkretna prošnja"
        ],
        "id": "s22"
    },
    {
        "key": "difficult-conversations",
        "name": "Težki pogovori",
        "category": "Vsakdanje življenje",
        "description": "Odpri občutljivo temo spoštljivo, neposredno in z namenom rešitve.",
        "level": "SREDNJI",
        "estimatedMinutes": 15,
        "outcomes": [
            "spoštljiv uvod",
            "dejstva",
            "rešitev"
        ],
        "id": "s23"
    },
    {
        "key": "digital-communication",
        "name": "Digitalna komunikacija",
        "category": "Vsakdanje življenje",
        "description": "Piši sporočila v chatu/mailu tako, da ni nesporazumov in nepotrebnega pritiska.",
        "level": "ZAČETNIK",
        "estimatedMinutes": 9,
        "outcomes": [
            "ton",
            "kontekst",
            "naslednji korak"
        ],
        "id": "s24"
    }
];
export const demoChallenges = [
    {
        "skillKey": "public-speaking",
        "title": "Predstavitev ideje v 2 minutah",
        "scenario": "Ekipo moraš prepričati, da podpre tvojo idejo za izboljšavo procesa.",
        "expectedOutcome": "Jasen problem, rešitev in poziv k akciji.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 8,
        "evaluationCriteria": [
            "jasnost",
            "struktura",
            "primer",
            "zaključek"
        ],
        "id": "c1"
    },
    {
        "skillKey": "active-listening",
        "title": "Sogovornik je razočaran",
        "scenario": "Prijatelj ali sodelavec ti razlaga, da se počuti preslišanega. Tvoja naloga je odgovoriti brez prekinjanja in svetovanja.",
        "expectedOutcome": "Povzetek občutka, validacija in eno odprto vprašanje.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 7,
        "evaluationCriteria": [
            "povzemanje",
            "empatija",
            "odprto vprašanje"
        ],
        "id": "c2"
    },
    {
        "skillKey": "clear-writing",
        "title": "Kratek mail z jasnim dogovorom",
        "scenario": "Napisati moraš sporočilo, kjer prosiš za potrditev roka in odgovornosti.",
        "expectedOutcome": "Kratko sporočilo z jasnim kontekstom in naslednjim korakom.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 7,
        "evaluationCriteria": [
            "kratkost",
            "kontekst",
            "jasen poziv k dejanju"
        ],
        "id": "c3"
    },
    {
        "skillKey": "feedback-giving",
        "title": "Povratna informacija brez napada",
        "scenario": "Sodelavec je oddal površno delo. Povej mu, kaj naj popravi, brez da zveniš napadalno.",
        "expectedOutcome": "Specifična povratna informacija z učinkom in predlogom izboljšave.",
        "difficulty": "SREDNJI",
        "estimatedMinutes": 9,
        "evaluationCriteria": [
            "specifičnost",
            "spoštovanje",
            "dogovor"
        ],
        "id": "c4"
    },
    {
        "skillKey": "conflict-resolution",
        "title": "Napet pogovor zaradi zamude",
        "scenario": "Sodelavec zamuja z nalogo, ti pa potrebuješ njegov del za svoj rok.",
        "expectedOutcome": "Mirno izražena potreba in konkreten dogovor.",
        "difficulty": "SREDNJI",
        "estimatedMinutes": 10,
        "evaluationCriteria": [
            "empatija",
            "meja",
            "naslednji korak"
        ],
        "id": "c5"
    },
    {
        "skillKey": "empatija",
        "title": "Oseba je pod stresom",
        "scenario": "Nekdo ti pove, da ne zmore več zaradi pritiska. Odgovori empatično in ne minimaliziraj problema.",
        "expectedOutcome": "Topel odziv, validacija in ponudba podpore.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 7,
        "evaluationCriteria": [
            "validacija",
            "ton",
            "podpora"
        ],
        "id": "c6"
    },
    {
        "skillKey": "boundaries",
        "title": "Reci ne dodatni nalogi",
        "scenario": "Nekdo te prosi za dodatno nalogo, ti pa si že preobremenjen. Postavi mejo.",
        "expectedOutcome": "Spoštljiv ne z razlogom in možno alternativo.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 8,
        "evaluationCriteria": [
            "jasna meja",
            "alternativa",
            "samozaupanje"
        ],
        "id": "c7"
    },
    {
        "skillKey": "networking",
        "title": "Prvi stik po dogodku",
        "scenario": "Po dogodku želiš osebi poslati LinkedIn/Email nadaljnji stik, da ohraniš stik.",
        "expectedOutcome": "Naraven uvod, konkreten razlog in lahek naslednji korak.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 8,
        "evaluationCriteria": [
            "osebni kontekst",
            "vrednost",
            "nadaljnji stik"
        ],
        "id": "c8"
    },
    {
        "skillKey": "job-interview",
        "title": "Vprašanje o slabosti",
        "scenario": "Na razgovoru te vprašajo, katero slabost trenutno izboljšuješ.",
        "expectedOutcome": "Iskren odgovor s primerom učenja in napredka.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 7,
        "evaluationCriteria": [
            "iskrenost",
            "primer",
            "refleksija"
        ],
        "id": "c9"
    },
    {
        "skillKey": "negotiation",
        "title": "Dogovor o višji ceni",
        "scenario": "Stranka želi nižjo ceno, ti pa moraš zaščititi vrednost svojega dela.",
        "expectedOutcome": "Mirna razlaga vrednosti in predlog kompromisa.",
        "difficulty": "SREDNJI",
        "estimatedMinutes": 10,
        "evaluationCriteria": [
            "vrednost",
            "interesi",
            "ponudba"
        ],
        "id": "c10"
    },
    {
        "skillKey": "leadership-basics",
        "title": "Ekipa izgublja motivacijo",
        "scenario": "V ekipi pada energija, rok pa se bliža. Kot vodja moraš dati smer brez pritiska.",
        "expectedOutcome": "Jasna smer, priznanje stanja in konkreten plan.",
        "difficulty": "SREDNJI",
        "estimatedMinutes": 11,
        "evaluationCriteria": [
            "smer",
            "motivacija",
            "odgovornosti"
        ],
        "id": "c11"
    },
    {
        "skillKey": "meeting-facilitation",
        "title": "Sestanek brez fokusa",
        "scenario": "Sestanek se oddaljuje od teme. Prevzemi vodenje in vrni skupino k odločitvi.",
        "expectedOutcome": "Vljuden prehod nazaj na agendo in zaključek z akcijami.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 8,
        "evaluationCriteria": [
            "agenda",
            "čas",
            "akcije"
        ],
        "id": "c12"
    },
    {
        "skillKey": "time-management",
        "title": "Preveč nalog v enem dnevu",
        "scenario": "Imaš preveč nalog in moraš realno sporočiti, kaj bo narejeno danes.",
        "expectedOutcome": "Prioritete, realen rok in proaktivna komunikacija.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 8,
        "evaluationCriteria": [
            "prioritete",
            "realnost",
            "komunikacija"
        ],
        "id": "c13"
    },
    {
        "skillKey": "prioritization",
        "title": "Kaj naj naredim najprej?",
        "scenario": "Dobiš tri nujne naloge hkrati. Razloži, kako boš izbral vrstni red.",
        "expectedOutcome": "Kriteriji za izbor in jasen plan izvedbe.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 8,
        "evaluationCriteria": [
            "kriteriji",
            "vpliv",
            "odločitev"
        ],
        "id": "c14"
    },
    {
        "skillKey": "decision-making",
        "title": "Odločitev z nepopolnimi podatki",
        "scenario": "Nimaš vseh informacij, a moraš predlagati odločitev do konca dneva.",
        "expectedOutcome": "Odločitev z razlogi, tveganji in načinom preverjanja.",
        "difficulty": "SREDNJI",
        "estimatedMinutes": 9,
        "evaluationCriteria": [
            "kriteriji",
            "tveganja",
            "preverjanje"
        ],
        "id": "c15"
    },
    {
        "skillKey": "focus-discipline",
        "title": "Telefon te stalno moti",
        "scenario": "Želiš zaključiti pomembno nalogo, a te ves čas zmoti telefon in chat.",
        "expectedOutcome": "Konkreten plan za okolje, časovni blok in začetek.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 7,
        "evaluationCriteria": [
            "okolje",
            "blok časa",
            "začetek"
        ],
        "id": "c16"
    },
    {
        "skillKey": "stress-management",
        "title": "Mirno pod pritiskom",
        "scenario": "Rok se bliža in čutiš paniko. Napiši, kako se boš umiril in organiziral naslednji korak.",
        "expectedOutcome": "Umiritev, razbitje naloge in prva akcija.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 7,
        "evaluationCriteria": [
            "umiritev",
            "prioriteta",
            "akcija"
        ],
        "id": "c17"
    },
    {
        "skillKey": "emotional-regulation",
        "title": "Jezen odgovor v chatu",
        "scenario": "Prejel si provokativno sporočilo. Odgovori tako, da ne eskaliraš konflikta.",
        "expectedOutcome": "Premor, miren ton in usmeritev v rešitev.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 8,
        "evaluationCriteria": [
            "premor",
            "ton",
            "rešitev"
        ],
        "id": "c18"
    },
    {
        "skillKey": "self-confidence",
        "title": "Predlagaj svoje mnenje",
        "scenario": "Na sestanku imaš drugačno mnenje, ampak te skrbi, da bo izpadlo neumno. Povej ga samozavestno.",
        "expectedOutcome": "Jasno mnenje, razlog in odprtost za odziv.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 8,
        "evaluationCriteria": [
            "mnenje",
            "argument",
            "mirnost"
        ],
        "id": "c19"
    },
    {
        "skillKey": "resilience",
        "title": "Po zavrnitvi nadaljuj",
        "scenario": "Tvoja ideja je bila zavrnjena. Odgovori tako, da pokažeš zrelost in pripravljenost na izboljšavo.",
        "expectedOutcome": "Sprejem povratne informacije, učenje in naslednji korak.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 8,
        "evaluationCriteria": [
            "sprejemanje",
            "učenje",
            "vztrajnost"
        ],
        "id": "c20"
    },
    {
        "skillKey": "personal-finance",
        "title": "Pogovor o strošku",
        "scenario": "S prijateljem ali partnerjem se moraš pogovoriti o delitvi stroškov brez napetosti.",
        "expectedOutcome": "Jasen okvir, spoštljiv ton in dogovor.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 7,
        "evaluationCriteria": [
            "jasnost",
            "spoštovanje",
            "dogovor"
        ],
        "id": "c21"
    },
    {
        "skillKey": "asking-for-help",
        "title": "Prosi za pomoč brez panike",
        "scenario": "Zataknil si se pri nalogi. Prosi za pomoč tako, da pokažeš, kaj si že poskusil.",
        "expectedOutcome": "Kontekst, poskusi in konkretno vprašanje.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 6,
        "evaluationCriteria": [
            "kontekst",
            "poskus",
            "vprašanje"
        ],
        "id": "c22"
    },
    {
        "skillKey": "difficult-conversations",
        "title": "Odpri občutljivo temo",
        "scenario": "Nekoga moraš opozoriti na navado, ki ti povzroča težavo.",
        "expectedOutcome": "Spoštljiv uvod, dejstvo, vpliv in predlog rešitve.",
        "difficulty": "SREDNJI",
        "estimatedMinutes": 10,
        "evaluationCriteria": [
            "uvod",
            "dejstva",
            "meja",
            "rešitev"
        ],
        "id": "c23"
    },
    {
        "skillKey": "digital-communication",
        "title": "Sporočilo brez napačnega tona",
        "scenario": "V chatu moraš opozoriti na napako, brez da zveniš pasivno agresivno.",
        "expectedOutcome": "Kratek, jasen in spoštljiv digitalni odziv.",
        "difficulty": "ZAČETNIK",
        "estimatedMinutes": 7,
        "evaluationCriteria": [
            "ton",
            "jasnost",
            "naslednji korak"
        ],
        "id": "c24"
    }
];
export const demoPrompts = [
    {
        "skillKey": "public-speaking",
        "title": "Trener za jasen nastop",
        "difficulty": "ZAČETNIK",
        "systemPrompt": "Si praktičen AI trener za življenjske in mehke veščine. Odgovarjaj v slovenščini, konkretno, spodbudno in kratko. Vedno pokaži: oceno, v čem je uporabnik dober, kaj izboljšati, boljšo verzijo in en mini izziv.",
        "userPromptTemplate": "Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nVrni strukturirano povratno informacijo z naslovnimi vrsticami Ocena, Dobro, Izboljšaj, Boljša verzija, Naslednji mini izziv.",
        "simulatedAiResponse": "Ocena: 78/100\nDobro: odgovor ima jasen namen.\nIzboljšaj: dodaj konkreten naslednji korak.\nBoljša verzija: predlagaj dogovor in preveri razumevanje.\nNaslednji mini izziv: povej isto v 30 sekundah.",
        "tags": [
            "struktura",
            "samozavest"
        ],
        "id": "p1"
    },
    {
        "skillKey": "active-listening",
        "title": "Trener za poslušanje",
        "difficulty": "ZAČETNIK",
        "systemPrompt": "Si praktičen AI trener za življenjske in mehke veščine. Odgovarjaj v slovenščini, konkretno, spodbudno in kratko. Vedno pokaži: oceno, v čem je uporabnik dober, kaj izboljšati, boljšo verzijo in en mini izziv.",
        "userPromptTemplate": "Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nVrni strukturirano povratno informacijo z naslovnimi vrsticami Ocena, Dobro, Izboljšaj, Boljša verzija, Naslednji mini izziv.",
        "simulatedAiResponse": "Ocena: 78/100\nDobro: odgovor ima jasen namen.\nIzboljšaj: dodaj konkreten naslednji korak.\nBoljša verzija: predlagaj dogovor in preveri razumevanje.\nNaslednji mini izziv: povej isto v 30 sekundah.",
        "tags": [
            "empatija",
            "vprašanja"
        ],
        "id": "p2"
    },
    {
        "skillKey": "conflict-resolution",
        "title": "Trener za konflikt",
        "difficulty": "SREDNJI",
        "systemPrompt": "Si praktičen AI trener za življenjske in mehke veščine. Odgovarjaj v slovenščini, konkretno, spodbudno in kratko. Vedno pokaži: oceno, v čem je uporabnik dober, kaj izboljšati, boljšo verzijo in en mini izziv.",
        "userPromptTemplate": "Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nVrni strukturirano povratno informacijo z naslovnimi vrsticami Ocena, Dobro, Izboljšaj, Boljša verzija, Naslednji mini izziv.",
        "simulatedAiResponse": "Ocena: 78/100\nDobro: odgovor ima jasen namen.\nIzboljšaj: dodaj konkreten naslednji korak.\nBoljša verzija: predlagaj dogovor in preveri razumevanje.\nNaslednji mini izziv: povej isto v 30 sekundah.",
        "tags": [
            "meje",
            "dogovor"
        ],
        "id": "p3"
    },
    {
        "skillKey": "feedback-giving",
        "title": "Trener za povratne informacije",
        "difficulty": "SREDNJI",
        "systemPrompt": "Si praktičen AI trener za življenjske in mehke veščine. Odgovarjaj v slovenščini, konkretno, spodbudno in kratko. Vedno pokaži: oceno, v čem je uporabnik dober, kaj izboljšati, boljšo verzijo in en mini izziv.",
        "userPromptTemplate": "Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nVrni strukturirano povratno informacijo z naslovnimi vrsticami Ocena, Dobro, Izboljšaj, Boljša verzija, Naslednji mini izziv.",
        "simulatedAiResponse": "Ocena: 78/100\nDobro: odgovor ima jasen namen.\nIzboljšaj: dodaj konkreten naslednji korak.\nBoljša verzija: predlagaj dogovor in preveri razumevanje.\nNaslednji mini izziv: povej isto v 30 sekundah.",
        "tags": [
            "povratna-informacija",
            "spoštovanje"
        ],
        "id": "p4"
    },
    {
        "skillKey": "job-interview",
        "title": "Trener za razgovor",
        "difficulty": "SREDNJI",
        "systemPrompt": "Si praktičen AI trener za življenjske in mehke veščine. Odgovarjaj v slovenščini, konkretno, spodbudno in kratko. Vedno pokaži: oceno, v čem je uporabnik dober, kaj izboljšati, boljšo verzijo in en mini izziv.",
        "userPromptTemplate": "Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nVrni strukturirano povratno informacijo z naslovnimi vrsticami Ocena, Dobro, Izboljšaj, Boljša verzija, Naslednji mini izziv.",
        "simulatedAiResponse": "Ocena: 78/100\nDobro: odgovor ima jasen namen.\nIzboljšaj: dodaj konkreten naslednji korak.\nBoljša verzija: predlagaj dogovor in preveri razumevanje.\nNaslednji mini izziv: povej isto v 30 sekundah.",
        "tags": [
            "STAR",
            "kariera"
        ],
        "id": "p5"
    },
    {
        "skillKey": "time-management",
        "title": "Trener za čas",
        "difficulty": "ZAČETNIK",
        "systemPrompt": "Si praktičen AI trener za življenjske in mehke veščine. Odgovarjaj v slovenščini, konkretno, spodbudno in kratko. Vedno pokaži: oceno, v čem je uporabnik dober, kaj izboljšati, boljšo verzijo in en mini izziv.",
        "userPromptTemplate": "Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nVrni strukturirano povratno informacijo z naslovnimi vrsticami Ocena, Dobro, Izboljšaj, Boljša verzija, Naslednji mini izziv.",
        "simulatedAiResponse": "Ocena: 78/100\nDobro: odgovor ima jasen namen.\nIzboljšaj: dodaj konkreten naslednji korak.\nBoljša verzija: predlagaj dogovor in preveri razumevanje.\nNaslednji mini izziv: povej isto v 30 sekundah.",
        "tags": [
            "prioritete",
            "fokus"
        ],
        "id": "p6"
    },
    {
        "skillKey": "stress-management",
        "title": "Trener za stres",
        "difficulty": "ZAČETNIK",
        "systemPrompt": "Si praktičen AI trener za življenjske in mehke veščine. Odgovarjaj v slovenščini, konkretno, spodbudno in kratko. Vedno pokaži: oceno, v čem je uporabnik dober, kaj izboljšati, boljšo verzijo in en mini izziv.",
        "userPromptTemplate": "Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nVrni strukturirano povratno informacijo z naslovnimi vrsticami Ocena, Dobro, Izboljšaj, Boljša verzija, Naslednji mini izziv.",
        "simulatedAiResponse": "Ocena: 78/100\nDobro: odgovor ima jasen namen.\nIzboljšaj: dodaj konkreten naslednji korak.\nBoljša verzija: predlagaj dogovor in preveri razumevanje.\nNaslednji mini izziv: povej isto v 30 sekundah.",
        "tags": [
            "umiritev",
            "akcija"
        ],
        "id": "p7"
    },
    {
        "skillKey": "boundaries",
        "title": "Trener za meje",
        "difficulty": "SREDNJI",
        "systemPrompt": "Si praktičen AI trener za življenjske in mehke veščine. Odgovarjaj v slovenščini, konkretno, spodbudno in kratko. Vedno pokaži: oceno, v čem je uporabnik dober, kaj izboljšati, boljšo verzijo in en mini izziv.",
        "userPromptTemplate": "Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nVrni strukturirano povratno informacijo z naslovnimi vrsticami Ocena, Dobro, Izboljšaj, Boljša verzija, Naslednji mini izziv.",
        "simulatedAiResponse": "Ocena: 78/100\nDobro: odgovor ima jasen namen.\nIzboljšaj: dodaj konkreten naslednji korak.\nBoljša verzija: predlagaj dogovor in preveri razumevanje.\nNaslednji mini izziv: povej isto v 30 sekundah.",
        "tags": [
            "meje",
            "samozaupanje"
        ],
        "id": "p8"
    },
    {
        "skillKey": "digital-communication",
        "title": "Trener za digitalni ton",
        "difficulty": "ZAČETNIK",
        "systemPrompt": "Si praktičen AI trener za življenjske in mehke veščine. Odgovarjaj v slovenščini, konkretno, spodbudno in kratko. Vedno pokaži: oceno, v čem je uporabnik dober, kaj izboljšati, boljšo verzijo in en mini izziv.",
        "userPromptTemplate": "Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nVrni strukturirano povratno informacijo z naslovnimi vrsticami Ocena, Dobro, Izboljšaj, Boljša verzija, Naslednji mini izziv.",
        "simulatedAiResponse": "Ocena: 78/100\nDobro: odgovor ima jasen namen.\nIzboljšaj: dodaj konkreten naslednji korak.\nBoljša verzija: predlagaj dogovor in preveri razumevanje.\nNaslednji mini izziv: povej isto v 30 sekundah.",
        "tags": [
            "chat",
            "mail"
        ],
        "id": "p9"
    },
    {
        "skillKey": "negotiation",
        "title": "Trener za pogajanje",
        "difficulty": "SREDNJI",
        "systemPrompt": "Si praktičen AI trener za življenjske in mehke veščine. Odgovarjaj v slovenščini, konkretno, spodbudno in kratko. Vedno pokaži: oceno, v čem je uporabnik dober, kaj izboljšati, boljšo verzijo in en mini izziv.",
        "userPromptTemplate": "Scenarij: {{scenario}}\nMerila: {{criteria}}\nOdgovor uporabnika: {{answer}}\nVrni strukturirano povratno informacijo z naslovnimi vrsticami Ocena, Dobro, Izboljšaj, Boljša verzija, Naslednji mini izziv.",
        "simulatedAiResponse": "Ocena: 78/100\nDobro: odgovor ima jasen namen.\nIzboljšaj: dodaj konkreten naslednji korak.\nBoljša verzija: predlagaj dogovor in preveri razumevanje.\nNaslednji mini izziv: povej isto v 30 sekundah.",
        "tags": [
            "vrednost",
            "kompromis"
        ],
        "id": "p10"
    }
];
