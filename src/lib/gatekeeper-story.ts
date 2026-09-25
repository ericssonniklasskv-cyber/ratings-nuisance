export type GatekeeperStep =
  | { kind: "line"; text: string; next: string }
  | { kind: "choice"; prompt: string; options: { id: string; label: string; next?: string; hiddenUntilAttempt?: boolean }[] }
  | { kind: "answer"; prompt: string; hint: string };

export const firstGatekeeperStep = "opening-hm";

// These are story beats, not access checks. Google Auth and profile approval still guard the app.
export const gatekeeperStory: Record<string, GatekeeperStep> = {
  "opening-hm": { kind: "line", text: "Hm…..", next: "opening-not-nille" },
  "opening-not-nille": { kind: "line", text: "Du är inte Nillebaebae…", next: "opening-choice" },
  "opening-choice": {
    kind: "choice",
    prompt: "Hur fan hittade du hit?",
    options: [
      { id: "0A", label: "Jag dödade honom och tog hans oskuld för att hitta hit.", next: "necro-1" },
      // Keep 0B visible; its own response can be written later.
      { id: "0B", label: "Han tog min oskuld och jag har spionerat på honom sedan dess.", next: "chapter-two-1" },
    ],
  },
  "necro-1": { kind: "line", text: "Ah, en necrofil alltså… Då måste ni vara Bohlin eller Elle.", next: "necro-2" },
  "necro-2": { kind: "line", text: "Han har berättat om er..", next: "necro-3" },
  "necro-3": { kind: "line", text: "Vem kunde tro att likt Jesus blev han till slut förråd av sin vän.", next: "necro-4" },
  "necro-4": { kind: "line", text: "Många likheter i övrigt nu när jag tänker efter.", next: "kill-choice" },
  "kill-choice": {
    kind: "choice",
    prompt: "Av ren nyfikenhet.. Hur dödade ni honom?",
    options: [
      { id: "1A", label: "Hans barmhärtighet dödade honom. Han begick seppaku för att jag skulle slippa skammen av… Jag vill helst inte berätta mer.", next: "kill-a-reply" },
      { id: "1B", label: "Jag tvingade honom att vänta på röd signal när vi cyklade ihop. Hans livsgnista försvann i samma sekund…", next: "kill-b-reply" },
      { id: "1C", label: "Hans penis krympte mer och mer, tills den till slut kollapsade in i sig själv som ett svart hål och slukade hela honom.", next: "kill-c-reply-1" },
    ],
  },
  "kill-a-reply": { kind: "line", text: "Inte förvånad.. Han älskade ju sina samurajer och svärd.", next: "chapter-two-1" },
  "kill-b-reply": { kind: "line", text: "Fan… jag visste att det där var farligare än att flyga fram som bara han kunde.. Så vacker han var i det tillståndet.", next: "chapter-two-1" },
  "kill-c-reply-1": { kind: "line", text: "Så hans Fibrodysplasia ossificans progressivitet tog honom till slut..", next: "kill-c-choice" },
  "kill-c-choice": {
    kind: "choice",
    prompt: "Hoppas han fick komma en sista gång.",
    options: [
      { id: "1CA", label: "Det såg jag till", next: "chapter-two-1" },
      { id: "1CB", label: "Flera gånger.", next: "chapter-two-1" },
    ],
  },
  "chapter-two-1": { kind: "line", text: "Nåja..", next: "chapter-two-2" },
  "chapter-two-2": { kind: "line", text: "Ingen kommer sakna honom.", next: "chapter-two-3" },
  "chapter-two-3": { kind: "line", text: "Men för att ta del av hans livsverk behöver ni komma förbi mig.", next: "chapter-two-4" },
  "chapter-two-4": { kind: "line", text: "Som ni säkert har listat ut behöver ni svara på några frågor som bara han visste.", next: "chapter-two-5" },
  "chapter-two-5": { kind: "line", text: "Men först behöver jag veta.", next: "size-choice" },
  "size-choice": {
    kind: "choice",
    prompt: "Hur stor är er penis?",
    options: [
      { id: "2A", label: "Humongås" },
      { id: "2B", label: "Väldigt stor" },
      { id: "2C", label: "Mikropenis :(", next: "size-reply", hiddenUntilAttempt: true },
    ],
  },
  "size-reply": { kind: "line", text: "Åhh… Tack.. Jag gillar att föreställa mig vad som finns under kläderna och nu vet jag med säkerhet att jag hade rätt.", next: "ready-choice" },
  "ready-choice": {
    kind: "choice",
    prompt: "Är ni redo att försöka ta er in?",
    options: [
      { id: "3A", label: "Ja!", next: "question-intro-1" },
      { id: "3B", label: "Hai!", next: "weeb-reply" },
    ],
  },
  "weeb-reply": { kind: "line", text: "Jävla weebs…", next: "question-intro-1" },
  "question-intro-1": { kind: "line", text: "Nåja.", next: "question-intro-2" },
  "question-intro-2": { kind: "line", text: "Vi börjar med något enkelt.", next: "question" },
  question: { kind: "answer", prompt: "Vem dansar Sir Nillebaebae allra helst med? Fullständigt namn, tack.", hint: "La La Land" },
};

export function isCorrectGatekeeperAnswer(value: string): boolean {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("sv") === "emma stone";
}
