Bygg nästa steg i ratingflödet i den befintliga `ratings-nuisance`-appen.

Målet är att användaren inte längre primärt ska välja decimalbetyget manuellt efter att referensfilmerna har hittat rätt heltalsintervall.

I stället ska appen använda användarens egna tidigare ratings i samma intervall som personliga ankare och fortsätta med samma enkla princip som resten av appen:

`Which is better?`

Användaren klickar på den film som är bäst.

## Grundprincip

Nuvarande flöde:

1. `Worth watching?`
2. Om Yes:
   - jämförelser mot referensfilmer
3. systemet hittar exempelvis intervallet 6–7
4. användaren väljer idag decimal manuellt

Ändra steg 4.

När intervallet har hittats ska appen först försöka placera filmen mer exakt genom jämförelser mot användarens egna tidigare ratings inom det intervallet.

Exempel:

Systemet har kommit fram till:

`6.0 < Inception < 7.0`

Med en decimals precision är de tillåtna slutbetygen i det här exemplet 6.1–6.9.

Användaren har tidigare:

- Film A — 6.2
- Film B — 6.4
- Film C — 6.6
- Film D — 6.8
- Film E — 6.9

Visa då en lämplig film nära mitten:

`Which is better?`

[Inception]

VS

[Film C · 6.6]

`About the same`

Användaren klickar på den bästa filmen.

Baserat på svaret smalnas spannet av och nästa lämpliga tidigare rating väljs.

## 1. Använd bara användarens egna ratings

Personal decimal placement ska använda den inloggade användarens egna tidigare ratings. Filtrera kandidater mot referensalgoritmens faktiska `minTenths` och `maxTenths`, inte mot ett antaget heltalsintervall eller andra användares betyg. Trusted-rater-status är irrelevant för personlig placering.

Exempel: Om referensalgoritmen ger 6.1–6.9 används bara egna ratings inom 6.1–6.9. Saknas en referenstitel kan det tillåtna spannet vara bredare än ett heltal; använd även då de faktiska gränserna. Den titel som nu betygsätts ska alltid uteslutas ur kandidatlistan.

## 2. Återanvänd samma interaktionsmodell

Använd samma UI-princip som det nya reference comparison-flödet:

- två posters
- `Which is better?`
- klicka direkt på den bästa postern
- `VS` mellan dem
- `About the same` som separat mindre val

Ingen Better/Worse-knapp.

Den nya filmen ska helst ligga på samma sida genom hela flödet så interaktionen känns konsekvent.

## 3. Välj ankare effektivt

Visa inte alla tidigare ratings.

Implementera en binärsökningsliknande strategi.

Utgå från de egna ratings som ligger inom intervallet och välj ett ankare nära mitten av det återstående rating-spannet.

Exempel:

Tillgängliga ratings:
6.1, 6.3, 6.4, 6.6, 6.8, 6.9

Första ankaret kan vara ungefär:
6.4 eller 6.6

Om nya filmen är bättre än 6.6:
sök vidare bland högre ratings.

Om den är sämre:
sök vidare bland lägre ratings.

Målet är att få fram en rimlig decimal med så få jämförelser som möjligt och inom gränsen på högst två personliga val i standardflödet.

## 4. Separera algoritmen från UI

Implementera den personliga placeringslogiken som en separat testbar modul.

Den ska inte vara hårdkodad i React-komponenten.

Den bör kunna hantera:

- candidate ratings
- current lower bound
- current upper bound
- selected comparison anchor
- comparison history
- next anchor
- final suggested rating

Återanvänd gärna mönstret från befintlig `rating-comparison.ts` om det passar, men håll referensplacering och personlig decimalplacering konceptuellt separerade.

## 5. Rating bounds

Referensalgoritmens `minTenths` och `maxTenths` är hårda gränser för både den personliga placeringen, förslaget och den slutliga manuella justeringen. När referensresultatet är strikt mellan 6 och 7 är dagens tillåtna värden normalt 6.1–6.9. Föreslå inte 6.0 eller 7.0 i det fallet.

Härled aldrig gränserna enbart från orden ”mellan 6 och 7”. Om referenstitlar saknas kan spannet vara bredare. Vid `About the same` mot en referens gäller referensalgoritmens separata equality-resultat och dess egna gränser.

## 6. Exact reference equality

Om användaren väljer `About the same` mot exempelvis referens 6.0 ska 6.0 föreslås direkt som stark default. Starta inte personliga jämförelser automatiskt. Visa `Save rating` och ett diskret frivilligt val att finjustera med egna ratings när relevanta ankare finns. Även frivillig finjustering måste hålla sig inom referensresultatets faktiska gränser.

## 7. När det finns många tidigare ratings

Även med exempelvis 30 egna filmer i samma spann ska standardflödet göra högst två personliga jämförelser. Ofta räcker en. Välj ankare nära mitten av återstående unika ratingnivåer och avsluta tidigare om ett ytterligare val inte kan ändra förslaget meningsfullt på en skala med steg om 0.1. Visa därefter förslaget och låt användaren justera själv. Ingen ska behöva jämföra med en lång rad egna filmer.

## 8. Duplicerade ratings

Användaren kan ha flera filmer med samma rating.

Exempel:

- Film A — 6.5
- Film B — 6.5
- Film C — 6.5

Behandla detta som samma ratingnivå i algoritmen.

Visa inte alla tre i följd.

Välj ett representativt ankare för 6.5.

Det är okej att välja:
- senaste
- första deterministiskt
- annan stabil deterministic rule

Dokumentera valet.

Algoritmen ska söka bland unika ratingvärden där det är lämpligt.

## 9. About the same

Om användaren väljer `About the same` mot en tidigare film med rating 6.6:

föreslå 6.6 direkt.

Användaren går sedan till bekräftelse/final adjustment.

## 10. Slutlig föreslagen rating

När algoritmen avslutar ska den ge ett deterministiskt förslag med en decimal inom referensalgoritmens hårda gränser. När det finns lediga tiondelar mellan personliga ankare, välj närmaste tiondel till mittpunkten och avrunda en exakt halva uppåt.

Exempel: bättre än 6.5 och sämre än 6.8 kan ge 6.7. Om två personliga ankare ligger på angränsande tiondelar, exempelvis 6.8 och 6.9, finns inget betyg strikt mellan dem. Välj då den av de två tiondelarna som mittpunktsregeln ger och tillåt att förslaget delar betyg med ett ankare. Förklara inte detta som ett fel: jämförelsen är mer precis än betygsskalans upplösning. Användaren kan alltid justera inom referensgränserna.

Personliga jämförelser vägleder förslaget; de är inte hårda spärrar för slutlig manuell justering. Referensgränserna är däremot alltid hårda.

## 11. Final adjustment

Efter personlig jämförelse visas `Suggested rating` och det föreslagna värdet, exempelvis `6.7`. Behåll `-0.1`, `+0.1` och gärna det befintliga reglaget. Begränsa alla justeringar till referensresultatets `minTenths` och `maxTenths`.

Exempel: strikt mellan referens 6 och 7 betyder normalt justering inom 6.1–6.9 i dagens app. Om `About the same` mot referens 7.0 var slutpunkten, använd equality-resultatets gränser. Primary CTA: `Save rating`.

## 12. Fallback: inga egna ratings

Om användaren inte har några tidigare ratings i intervallet:

använd dagens manuella decimalsteget.

Exempel:

`No previous ratings in this range yet.`

Visa sedan finjustering manuellt.

Det ska kännas normalt, inte som ett fel.

## 13. Fallback: bara en egen rating

Om det finns exakt en tidigare rating i intervallet:

jämför mot den.

Exempel:
enda tidigare är 6.4.

Nya filmen vs 6.4.

Om:
- About the same → 6.4
- bättre → föreslå ett högre tillåtet värde om det finns; annars närmaste tillåtna värde
- sämre → föreslå ett lägre tillåtet värde om det finns; annars närmaste tillåtna värde

Låt användaren sedan justera.

## 14. Fallback: två egna ratings

Om två relevanta ankare finns:

använd dem på ett enkelt sätt.

Undvik att bygga en komplex sekvens för två datapunkter.

## 15. Skip

Användaren ska alltid kunna välja:

`Set manually`

eller:
`Skip comparisons`

Det ska hoppa direkt till det befintliga manuella decimalsteget.

Detta ska vara sekundärt och diskret, men alltid tillgängligt.

## 16. Back

Back ska återställa föregående par och föregående beslut deterministiskt under personlig placering. Back från den första personliga jämförelsen ska visa det färdiga referensresultatet igen, utan att starta om referensflödet. Back från slutlig justering ska gå till senaste personliga jämförelsen, eller till referensresultatet om ingen personlig jämförelse gjordes. Behåll comparison history lokalt.

## 17. Rate again

När användaren ratear om en titel får dess befintliga rating aldrig användas som ankare mot sig själv. Uteslut den aktuella titeln med stabil identitet (`media_type` + `tmdb_id`, eller lagrat title-ID), inte bara genom att jämföra titeltext. Övriga egna ratings används normalt.

## 18. Resultat efter save

När ratingen sparats ska befintliga resultatsidan användas.

Visa:
- Your rating
- Group rating om det finns
- Rate another
- My Ratings

Ingen ny tung resultatsida behövs.

## 19. Performance

Hämta kandidatfilmer för personlig placering effektivt.

Undvik:
- en query per comparison
- nya Supabase-queries varje gång användaren klickar

Hämta relevanta egna ratings för intervallet en gång och kör placeringsalgoritmen lokalt.

Hämta bara de titel-/posterdata som behövs.

Om ratings redan kommer med titeldata från befintlig query, återanvänd dem.

## 20. UI

Personal comparison ska visuellt kännas identisk med reference comparison.

Användaren ska inte behöva förstå att systemet tekniskt gått över till en annan algoritm.

Eventuellt kan en diskret etikett visas:

`Your ratings`

eller:
`Fine tuning`

Men undvik lång instruktion.

Flödet ska fortfarande bara kännas som:

`Which is better?`

## 21. Progress

Om det går att göra utan falsk precision:

visa diskret progress.

Exempel:
`Fine tuning · 2`

Undvik:
`Step 2 of 4`
om algoritmen inte vet exakt antal comparisons.

## 22. Data / schema

Försök göra detta utan databasändringar.

Befintliga ratings bör innehålla allt som behövs:
- user
- title
- rating

Skapa migration bara om det faktiskt krävs och motivera då varför.

Spara inte comparison history i databasen i denna version.

## 23. Tester för algoritmen

Skriv omfattande enhetstester för den personliga placeringsalgoritmen.

Minst:

### A
Ratings:
6.2, 6.4, 6.6, 6.8

Ny film:
bättre än 6.6
sämre än 6.8

→ föreslå rimligt värde mellan dem.

### B
Ny film sämre än alla egna 6.x-ratings.

→ föreslå nedre delen av intervallet utan att lämna intervallet.

### C
Ny film bättre än alla egna 6.x-ratings.

→ föreslå övre delen av intervallet utan att lämna intervallet.

### D
About the same som 6.4.

→ förslag 6.4.

### E
Duplicerade ratings:
6.5, 6.5, 6.5, 6.8

→ algoritmen ska inte behandla tre 6.5 som tre separata nivåer.

### F
Inga egna ratings.

→ manual fallback.

### G
En egen rating.

→ comparison + rimligt suggestion.

### H
Två egna ratings.

→ korrekt avgränsning.

### I
Current title finns redan som 6.6 vid Rate again.

→ exkluderas som anchor.

### J
Back.

→ previous state återställs deterministiskt.

### K
Bounds respekteras alltid.

Om referensresultatet är strikt mellan 6 och 7 får ingen output vara <6.1 eller >6.9 enligt dagens intervallregler. Använd alltid faktiska `minTenths` och `maxTenths`.

### L
Personliga ankare ligger på angränsande tiondelar, exempelvis 6.8 och 6.9. Algoritmen avslutar med ett giltigt, deterministiskt förslag även när ingen tiondel finns strikt mellan ankare.

### M
Många tidigare ratings: standardflödet gör högst två personliga jämförelser.

### N
`About the same` mot en referens föreslår referensbetyget direkt och startar inte personliga jämförelser automatiskt.

### O
Back från slutlig justering återställer senaste personliga par eller referensresultatet; Back från första personliga par återställer referensresultatet.

## 24. Viktigt: ändra inte detta

Ändra inte:
- Worth watching-steget
- 0/1-logiken
- referenstitlarna
- reference comparison engine mer än vad integrationen kräver
- trusted-rater-logik
- group rating
- RLS
- auth
- My Ratings
- title detail
- TMDb integration

Den här uppgiften gäller endast personlig finplacering inom redan hittat ratingintervall.

## 25. Workflow

1. Skapa separat feature branch.
2. Implementera algoritmen först med tester.
3. Integrera den i ratingflödet.
4. Kör lint.
5. Kör typecheck.
6. Kör tester.
7. Kör production build.
8. Deploya Vercel Preview.
9. Browser-verifiera på cirka 390 px och desktop.
10. Ändra inte production innan Preview godkänts.

## 26. Slutrapport

Rapportera:

### Algorithm
Hur ankare väljs och hur spannet smalnas av.

### Suggestion
Hur slutratingen beräknas mellan två ankare.

### Edge cases
Hur:
- 0 ratings
- 1 rating
- duplicates
- Rate again
hanteras.

### Performance
Hur kandidatratings hämtas utan query-per-comparison.

### UX
Hur reference comparison övergår till personal fine tuning.

### Preview
Ge Vercel Preview-URL.

### Manual review
Lista högst 5 saker som jag bör känna efter subjektivt när jag provar flödet.
