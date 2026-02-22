import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";

// -------------------------------
// Domain Taxonomy (School OT)
// -------------------------------

const DOMAIN_TAXONOMY = [
  {
    domain: "Foundational Motor",
    subs: [
      "Postural control",
      "Bilateral coordination",
      "Motor planning/praxis",
      "Strength/endurance",
      "Range of motion",
      "Balance",
      "Functional mobility",
      "Gross motor coordination",
    ],
  },
  {
    domain: "Fine Motor",
    subs: [
      "Hand strength",
      "In-hand manipulation",
      "Dexterity/speed",
      "Tool use (pencil/scissors)",
      "Grasp patterns",
      "Finger isolation",
    ],
  },
  {
    domain: "Sensory–Motor",
    subs: [
      "Arousal/alertness modulation",
      "Tactile processing",
      "Proprioceptive processing",
      "Vestibular processing",
      "Sensory discrimination",
      "Reflex integration",
      "Body scheme",
    ],
  },
  {
    domain: "Perceptual–Motor",
    subs: [
      "Visual–motor integration",
      "Eye–hand coordination",
      "Oculomotor skills",
      "Motor output organization",
      "Crossing midline",
      "Right-left discrimination",
    ],
  },
  {
    domain: "Visual Perception",
    subs: [
      "Visual Discrimination",
      "Visual Memory",
      "Visual Sequential Memory",
      "Visual Spatial Relations",
      "Visual Form Constancy",
      "Visual Figure Ground",
      "Visual Closure",
    ],
  },
  {
    domain: "Cognitive/Executive",
    subs: [
      "Initiation",
      "Sustained attention",
      "Working memory",
      "Planning/organization",
      "Self-monitoring",
      "Cognitive flexibility",
      "Generalization",
    ],
  },
  {
    domain: "Regulation & Participation",
    subs: [
      "Frustration tolerance",
      "Task persistence",
      "Help-seeking",
      "Coping strategies",
      "Peer participation",
      "Social interaction skills",
    ],
  },
  {
    domain: "Activity Demands",
    subs: [
      "Pacing",
      "Material complexity",
      "Multi-step directions",
      "Novelty",
      "Accuracy",
    ],
  },
  {
    domain: "Context/Environment",
    subs: [
      "Noise level",
      "Visual clutter",
      "Seating/positioning",
      "Group size",
      "Adult support level",
      "Schedule/transition load",
      "Access to tools",
    ],
  },
];

const ECOLOGY_CATEGORIES = [
  "physical",
  "social",
  "temporal",
  "institutional",
  "material",
  "virtual",
] as const;

type EcologyCategory = (typeof ECOLOGY_CATEGORIES)[number];

type EvidenceType =
  | "observation"
  | "score"
  | "quote"
  | "context"
  | "support"
  | "barrier"
  | "demand";

type Confidence = "low" | "med" | "high";

type ExtractedFact = {
  factId: string;
  type: EvidenceType;
  text: string;
  span: { start: number; end: number };
  confidence: Confidence;
  tags: string[];
};

type TaskRoutine = {
  id: string;
  name: string;
  occupationalDomain:
    | "learning"
    | "school participation"
    | "self-care at school"
    | "play/leisure"
    | "transitions"
    | "other";
  complexityTier: "simple" | "complex";
  inferred: boolean;
};

type DomainLine = {
  domain: string;
  subskill: string;
  demandLevel: 0 | 1 | 2 | 3;
  capacityLevel: 0 | 1 | 2 | 3;
  status: "strength" | "need" | "inconsistent" | "unknown";
  evidenceFactIds: string[];
  accessLevers: string[];
};

type EcologyFactor = {
  id: string;
  category: EcologyCategory;
  factor: string;
  direction: "supports" | "interferes" | "variable";
  conditions?: string;
  evidenceFactIds: string[];
};

type Finding = {
  id: string;
  label: string;
  tier: "primary contributor" | "secondary contributor" | "contextual modifier";
  linkedDomains: string[];
  evidenceFactIds: string[];
  educationalImpact: string;
};

type OutputBundle = {
  routines: TaskRoutine[];
  facts: ExtractedFact[];
  capacityDemandByRoutine: Record<string, DomainLine[]>;
  ecologyFactors: EcologyFactor[];
  prioritizedFindings: Record<string, Finding[]>;
  compliance: {
    prohibitedTerms: { term: string; replacement: string; locations: string[] }[];
    evidenceTraceIssues: { message: string; claim: string }[];
  };
};

// -------------------------------
// Prohibited terminology layer
// -------------------------------

const PROHIBITED_TERMS: { term: string; replacement: string }[] = [
  // Category 1: Vague Outcome Descriptors
  { term: "emerging", replacement: "developing" },
  { term: "enhance", replacement: "improve" },
  { term: "enhanced", replacement: "improved" },
  { term: "enhancing", replacement: "improving" },
  { term: "precise", replacement: "" },
  { term: "precisely", replacement: "" },
  { term: "significant", replacement: "" },
  { term: "significantly", replacement: "" },
  { term: "key", replacement: "required for" },
  { term: "essential", replacement: "required for" },
  { term: "essential for", replacement: "required for" },
  { term: "critical", replacement: "impacts ability to" },
  { term: "critically", replacement: "impacts ability to" },
  { term: "notable", replacement: "" },
  { term: "notably", replacement: "" },

  // Category 2: Non-Specific Descriptions of Abilities and Performance
  { term: "struggle", replacement: "difficulty with" },
  { term: "struggled", replacement: "had difficulty with" },
  { term: "struggling", replacement: "having difficulty with" },
  { term: "lack", replacement: "difficulty with" },
  { term: "lacks", replacement: "difficulty with" },
  { term: "lacked", replacement: "difficulty with" },
  { term: "lacking", replacement: "difficulty with" },
  { term: "issue", replacement: "difficulty" },
  { term: "issues", replacement: "difficulty" },
  { term: "trouble", replacement: "difficulty" },
  { term: "advanced", replacement: "" },
  { term: "more advanced", replacement: "" },
  { term: "optimal", replacement: "" },
  { term: "optimally", replacement: "" },
  { term: "exhibit", replacement: "demonstrates" },
  { term: "exhibits", replacement: "demonstrates" },
  { term: "exhibited", replacement: "demonstrated" },
  { term: "problem", replacement: "difficulty with" },
  { term: "problems", replacement: "difficulty with" },

  // Category 3: Non-Specific Process & Action Descriptors
  { term: "practice", replacement: "repeated trials" },
  { term: "practices", replacement: "repeated trials" },
  { term: "practiced", replacement: "repeated trials" },
  { term: "practicing", replacement: "repeated trials" },
  { term: "activation", replacement: "recruitment" },
  { term: "activate", replacement: "recruit" },
  { term: "activates", replacement: "recruits" },
  { term: "activated", replacement: "recruited" },
  { term: "link", replacement: "contributes to" },
  { term: "links", replacement: "contributes to" },
  { term: "linked", replacement: "contributed to" },
  { term: "linking", replacement: "contributing to" },
  { term: "utilizing", replacement: "using" },
  { term: "utilized", replacement: "used" },
  { term: "utilize", replacement: "use" },
  { term: "utilizes", replacement: "uses" },
  { term: "employ", replacement: "use" },
  { term: "employed", replacement: "used" },
  { term: "employing", replacement: "using" },
  { term: "employs", replacement: "uses" },
  { term: "showcase", replacement: "demonstrate" },
  { term: "showcased", replacement: "demonstrated" },
  { term: "showcasing", replacement: "demonstrating" },
  { term: "feature", replacement: "include" },
  { term: "featured", replacement: "included" },
  { term: "featuring", replacement: "including" },
  { term: "encompassing", replacement: "including" },
  { term: "encompass", replacement: "include" },
  { term: "encompassed", replacement: "included" },
  { term: "commence", replacement: "begin" },
  { term: "commenced", replacement: "began" },
  { term: "commencing", replacement: "beginning" },
  { term: "replicate", replacement: "copied" },
  { term: "replicated", replacement: "copied" },
  { term: "replicating", replacement: "copying" },
  { term: "replicates", replacement: "copies" },
  { term: "reproduce", replacement: "copy" },
  { term: "reproduced", replacement: "copied" },
  { term: "reproducing", replacement: "copying" },
  { term: "reproduces", replacement: "copies" },
  { term: "gain", replacement: "increase" },
  { term: "gains", replacement: "increases" },
  { term: "gained", replacement: "increased" },
  { term: "gaining", replacement: "increasing" },
  { term: "produce", replacement: "write" },
  { term: "produced", replacement: "wrote" },
  { term: "producing", replacement: "writing" },
  { term: "ensure", replacement: "requires" },

  // Category 4: Non-Occupational Therapy & Subjective/Emotional Language
  { term: "efficiency", replacement: "" },
  { term: "efficient", replacement: "" },
  { term: "efficiently", replacement: "" },
  { term: "marked", replacement: "" },
  { term: "markedly", replacement: "" },
  { term: "remarkable", replacement: "" },
  { term: "remarkably", replacement: "" },
  { term: "meticulous", replacement: "" },
  { term: "meticulously", replacement: "" },
  { term: "this marks", replacement: "" },

  // Category 5: Relational & Conditional Descriptors
  { term: "despite", replacement: "although" },
  { term: "at this stage", replacement: "currently" },
  { term: "hone", replacement: "" },
  { term: "honed", replacement: "" },
  { term: "honing", replacement: "" },
  { term: "strive", replacement: "" },
  { term: "strives", replacement: "" },
  { term: "strived", replacement: "" },
  { term: "striving", replacement: "" },
  { term: "noted", replacement: "" },
  { term: "noted as", replacement: "" },
  { term: "participate", replacement: "engage" },
  { term: "participated", replacement: "engaged" },
  { term: "participating", replacement: "engaging" },
  { term: "participates", replacement: "engages" },
  { term: "advance", replacement: "" },
  { term: "advances", replacement: "" },
  { term: "advancing", replacement: "" },
  { term: "advancement", replacement: "" },
  { term: "yielding", replacement: "" },
  { term: "confirm", replacement: "" },
  { term: "confirming", replacement: "" },

  // Original list
  { term: "noncompliant", replacement: "did not follow directions" },
  { term: "refused", replacement: "did not engage" },
  { term: "lazy", replacement: "demonstrated reduced task persistence" },
  { term: "manipulative", replacement: "used repeated help-seeking/avoidance behaviors" },
];

export function scanProhibitedTerminology(text: string) {
  const hits: { term: string; replacement: string; locations: string[] }[] = [];
  // Sort by length descending to match longer phrases first
  const sortedTerms = [...PROHIBITED_TERMS].sort((a, b) => b.term.length - a.term.length);
  for (const t of sortedTerms) {
    const rx = new RegExp(`\\b${escapeRegExp(t.term)}\\b`, "gi");
    if (rx.test(text)) {
      const locations: string[] = [];
      const contextRx = new RegExp(`.{0,24}${escapeRegExp(t.term)}.{0,24}`, "gi");
      const m = text.match(contextRx);
      (m || []).slice(0, 5).forEach((s) => locations.push(s));
      hits.push({ term: t.term, replacement: t.replacement, locations });
    }
  }
  return hits;
}

export function applyProhibitedReplacements(text: string) {
  let out = text;
  // Sort by length descending to match longer phrases first
  const sortedTerms = [...PROHIBITED_TERMS].sort((a, b) => b.term.length - a.term.length);
  for (const t of sortedTerms) {
    const rx = new RegExp(`\\b${escapeRegExp(t.term)}\\b`, "gi");
    out = out.replace(rx, t.replacement || "");
  }
  // Grammar fix: a/an flip
  out = out.replace(/\b(a|A)\s+([aeiouAEIOU])/g, (_, a, next) => (a === 'A' ? 'An ' : 'an ') + next);
  out = out.replace(/\b(an|An)\s+([^aeiouAEIOU\s])/g, (_, an, next) => (an === 'An' ? 'A ' : 'a ') + next);

  // Clean up double spaces and dangling conjunctions
  out = out.replace(/\s+/g, ' ');
  out = out.replace(/\s+([,.!?;:])/g, '$1');
  out = out.replace(/\b(and|or)\s*([,.!?;:])/gi, '$2');
  out = out.replace(/\b(and|or)\b\s+\b(and|or)\b/gi, '$1');
  out = out.replace(/\b(with|in|to)\s+\1\b/gi, '$1');

  return out.trim();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// -------------------------------
// Heuristic parsing (replaceable)
// -------------------------------

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function extractFacts(raw: string): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  const lines = raw.split(/\n+/g);
  let idx = 0;
  for (const line of lines) {
    const start = raw.indexOf(line, idx);
    const end = start + line.length;
    idx = end;
    const trimmed = line.trim();
    if (!trimmed) continue;
    let type: EvidenceType = "observation";
    let confidence: Confidence = "med";
    const tags: string[] = [];

    if (/(score|standard score|percentile|scaled score|\bss\b|\b%\b)/i.test(trimmed)) {
      type = "score";
      confidence = "high";
      tags.push("assessment");
    } else if (/(teacher|parent|student) (reports|states|notes|says)/i.test(trimmed)) {
      type = "quote";
      confidence = "med";
      tags.push("report");
    } else if (/(noise|crowd|busy|transition|schedule|time|morning|afternoon|lunch|recess|whole group|small group)/i.test(trimmed)) {
      type = "context";
      confidence = "med";
      tags.push("context");
    }

    if (/(supports|visual schedule|checklist|timer|break|cue|prompt|model)/i.test(trimmed)) {
      tags.push("support");
    }
    if (/(difficulty|struggle|hard|can’t|cannot|unable|inconsistent|often|frequently|requires)/i.test(trimmed)) {
      tags.push("performance");
    }

    facts.push({
      factId: uid("fact"),
      type,
      text: trimmed,
      span: { start: Math.max(0, start), end: Math.max(0, end) },
      confidence,
      tags,
    });
  }
  return facts;
}

function inferRoutines(raw: string): TaskRoutine[] {
  const lower = raw.toLowerCase();
  const routines: TaskRoutine[] = [];
  const push = (name: string, occupationalDomain: TaskRoutine["occupationalDomain"], complexityTier: TaskRoutine["complexityTier"], inferred: boolean) => {
    routines.push({ id: uid("routine"), name, occupationalDomain, complexityTier, inferred });
  };

  const hits: { rx: RegExp; name: string; dom: TaskRoutine["occupationalDomain"] }[] = [
    { rx: /(handwriting|writing|written work|paragraph|copying|note taking)/i, name: "Written work (handwriting/production)", dom: "learning" },
    { rx: /(cutting|scissors)/i, name: "Tool use (scissors/cutting)", dom: "learning" },
    { rx: /(typing|keyboard|chromebook|device)/i, name: "Written work (typing/assistive tech)", dom: "learning" },
    { rx: /(transition|arrival|dismissal|line up)/i, name: "Transitions (arrival/line-up/dismissal)", dom: "transitions" },
    { rx: /(lunch|cafeteria|opening containers|utensils)/i, name: "Self-care at school (lunch routines)", dom: "self-care at school" },
    { rx: /(recess|playground|play)/i, name: "Playground participation", dom: "play/leisure" },
  ];

  for (const h of hits) {
    if (h.rx.test(lower)) {
      push(h.name, h.dom, "complex", false);
    }
  }

  if (routines.length === 0) {
    push("Written work (classroom output)", "learning", "complex", true);
    push("Transitions (between activities)", "transitions", "complex", true);
  }
  return routines.slice(0, 5);
}

// -------------------------------
// Divergent → Convergent logic
// -------------------------------

function divergentDemandInventory(routine: TaskRoutine): { domain: string; subskill: string; demandLevel: 0 | 1 | 2 | 3 }[] {
  const base: { domain: string; subskill: string; demandLevel: 0 | 1 | 2 | 3 }[] = [];
  const boost = (domain: string, sub: string): 0 | 1 | 2 | 3 => {
    const r = routine.name.toLowerCase();
    const isWriting = r.includes("written") || r.includes("handwriting") || r.includes("typing");
    const isToolUse = r.includes("tool use") || r.includes("scissors") || r.includes("cutting");
    const isTransition = r.includes("transition");
    const isLunch = r.includes("lunch") || r.includes("self-care");
    let level: 0 | 1 | 2 | 3 = 1;
    if (domain === "Activity Demands") level = 2;
    if (domain === "Context/Environment") level = 2;
    if (isWriting) {
      if (domain === "Fine Motor" && /tool use|grasp|dexterity/i.test(sub)) level = 3;
      if (domain === "Perceptual–Motor" && /visual–motor|eye–hand/i.test(sub)) level = 3;
      if (domain === "Cognitive/Executive" && /(planning|sustained attention|working memory)/i.test(sub)) level = 3;
    }
    if (isToolUse) {
      if (domain === "Fine Motor") level = 3;
      if (domain === "Foundational Motor" && /bilateral|motor planning/i.test(sub)) level = 3;
      if (domain === "Perceptual–Motor") level = 2;
    }
    if (isTransition) {
      if (domain === "Regulation & Participation") level = 3;
      if (domain === "Sensory–Motor") level = 2;
      if (domain === "Cognitive/Executive" && /initiation|self-monitoring/i.test(sub)) level = 3;
    }
    if (isLunch) {
      if (domain === "Fine Motor" || domain === "Foundational Motor") level = 2;
      if (domain === "Regulation & Participation") level = 2;
    }
    return level;
  };

  for (const d of DOMAIN_TAXONOMY) {
    for (const sub of d.subs) {
      base.push({ domain: d.domain, subskill: sub, demandLevel: boost(d.domain, sub) });
    }
  }
  return base;
}

function mapCapacityFromEvidence(inv: { domain: string; subskill: string; demandLevel: 0 | 1 | 2 | 3 }[], facts: ExtractedFact[], routine: TaskRoutine): DomainLine[] {
  const r = routine.name.toLowerCase();
  const lines: DomainLine[] = inv.map((x) => {
    const evidence: string[] = [];
    const routineHits = facts.filter((f) => {
      const t = f.text.toLowerCase();
      if (r.includes("written")) return /(write|handwriting|copy|paragraph|sentence|spelling|typing|keyboard)/i.test(t);
      if (r.includes("scissor") || r.includes("cutting")) return /(scissor|cut|cutting|snip)/i.test(t);
      if (r.includes("transition")) return /(transition|line|arrival|dismissal|between)/i.test(t);
      if (r.includes("lunch")) return /(lunch|cafeteria|container|open|utensil)/i.test(t);
      return false;
    });
    const pool = routineHits.length ? routineHits : facts;
    const matchers: { rx: RegExp; domain?: string; sub?: RegExp }[] = [
      { rx: /(grasp|pencil|hand strength|fatigue|presses hard|light pressure|writes slowly|illegible)/i, domain: "Fine Motor" },
      { rx: /(posture|slumps|leans|core|seated|falls out of chair)/i, domain: "Foundational Motor" },
      { rx: /(sensory|noise|busy|distract|seeks movement|fidgets|covers ears)/i, domain: "Sensory–Motor" },
      { rx: /(visual motor|copy|spacing|alignment|tracking|eye)/i, domain: "Perceptual–Motor" },
      { rx: /(figure ground|discrimination|spatial|visual memory)/i, domain: "Visual Perception" },
      { rx: /(initiate|attention|working memory|plan|organize|self monitor|impuls)/i, domain: "Cognitive/Executive" },
      { rx: /(frustrat|meltdown|persist|regulat|coping|break|help-seek)/i, domain: "Regulation & Participation" },
      { rx: /(time|timed|pace|multi-step|directions|novel)/i, domain: "Activity Demands" },
      { rx: /(noise|clutter|group|whole group|small group|seating|adult support|prompt|cue|schedule)/i, domain: "Context/Environment" },
    ];
    for (const f of pool) {
      for (const m of matchers) {
        if (m.domain === x.domain && m.rx.test(f.text)) {
          evidence.push(f.factId);
          break;
        }
      }
    }
    const evidenceTexts = evidence.map((id) => facts.find((ff) => ff.factId === id)?.text || "");
    const difficulty = evidenceTexts.some((t) => /(difficulty|struggle|hard|can't|cannot|unable|requires|frequently|often|inconsistent)/i.test(t));
    const success = evidenceTexts.some((t) => /(independent|accurate|successful|improved|met|completed)/i.test(t));
    const supported = evidenceTexts.some((t) => /(with (visual|verbal|gestural) (cue|prompt)|checklist|timer|break|model)/i.test(t));
    let capacityLevel: 0 | 1 | 2 | 3 = 2;
    let status: DomainLine["status"] = "unknown";
    if (evidence.length === 0) {
      capacityLevel = 0;
      status = "unknown";
    } else if (difficulty && !success) {
      capacityLevel = 1;
      status = "need";
    } else if (difficulty && success) {
      capacityLevel = 2;
      status = "inconsistent";
    } else if (!difficulty && (success || supported)) {
      capacityLevel = 3;
      status = "strength";
    } else {
      capacityLevel = 2;
      status = "inconsistent";
    }
    const accessLevers: string[] = suggestAccessLevers(x.domain, x.subskill, routine);
    return { domain: x.domain, subskill: x.subskill, demandLevel: x.demandLevel, capacityLevel, status, evidenceFactIds: Array.from(new Set(evidence)), accessLevers };
  });
  return lines;
}

function suggestAccessLevers(domain: string, _subskill: string, _routine: TaskRoutine): string[] {
  const levers: string[] = [];
  if (domain === "Context/Environment") { levers.push("Reduce visual clutter"); levers.push("Offer seating option"); levers.push("Visual schedule"); }
  if (domain === "Activity Demands") { levers.push("Chunk multi-step tasks"); levers.push("Provide exemplar"); levers.push("Adjust pacing"); }
  return levers.slice(0, 3);
}

function buildEcologyMap(facts: ExtractedFact[]): EcologyFactor[] {
  const factors: EcologyFactor[] = [];
  const rules = [
    { rx: /(noise|loud|cafeteria|busy)/i, category: "physical", factor: "Noise level", direction: "variable" },
  ] as const;
  for (const f of facts) {
    for (const r of rules) {
      if (r.rx.test(f.text)) {
        factors.push({ id: uid("eco"), category: r.category, factor: r.factor, direction: r.direction, evidenceFactIds: [f.factId] });
      }
    }
  }
  return factors;
}

function prioritizeFindings(lines: DomainLine[], routine: TaskRoutine): Finding[] {
  const gaps = lines.map((l) => ({ ...l, gap: (l.demandLevel - l.capacityLevel) as number })).filter((l) => l.status !== "unknown").sort((a, b) => b.gap - a.gap);
  return gaps.slice(0, 4).map((g) => ({
    id: uid("find"), label: `${g.domain}: ${g.subskill}`, tier: g.gap >= 2 ? "primary contributor" : "secondary contributor", linkedDomains: [g.domain], evidenceFactIds: g.evidenceFactIds, educationalImpact: `Impact on ${routine.name}`,
  }));
}

export function buildCapacityDemandBundle(raw: string): OutputBundle {
  const facts = extractFacts(raw);
  const routines = inferRoutines(raw);
  const capacityDemandByRoutine: Record<string, DomainLine[]> = {};
  const prioritizedFindings: Record<string, Finding[]> = {};
  for (const routine of routines) {
    const inv = divergentDemandInventory(routine);
    const lines = mapCapacityFromEvidence(inv, facts, routine);
    capacityDemandByRoutine[routine.id] = lines;
    prioritizedFindings[routine.id] = prioritizeFindings(lines, routine);
  }
  return { routines, facts, capacityDemandByRoutine, ecologyFactors: buildEcologyMap(facts), prioritizedFindings, compliance: { prohibitedTerms: scanProhibitedTerminology(raw), evidenceTraceIssues: [] } };
}

// -------------------------------
// Main Component
// -------------------------------

export default function App() {
  const [raw, setRaw] = useState("");
  const [bundle, setBundle] = useState<OutputBundle>(() => buildCapacityDemandBundle(""));
  const [selectedRoutineId, setSelectedRoutineId] = useState("");

  useEffect(() => {
    if (!selectedRoutineId && bundle.routines[0]?.id) {
      setSelectedRoutineId(bundle.routines[0].id);
    }
  }, [bundle.routines, selectedRoutineId]);

  const rebuild = () => {
    const b = buildCapacityDemandBundle(raw);
    setBundle(b);
    setSelectedRoutineId(b.routines[0]?.id || "");
  };

  const selectedLines = useMemo(() => bundle.capacityDemandByRoutine[selectedRoutineId] || [], [bundle.capacityDemandByRoutine, selectedRoutineId]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader><CardTitle>OT Capacity–Demand & Ecology Engine</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Paste student data here..." className="min-h-[200px]" />
          <Button onClick={rebuild}>Process Data</Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="snapshot">
        <TabsList>
          <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
          <TabsTrigger value="capacity">Capacity–Demand</TabsTrigger>
          <TabsTrigger value="taxonomy">Taxonomy</TabsTrigger>
        </TabsList>
        <TabsContent value="snapshot">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card>
               <CardHeader><CardTitle>Routines</CardTitle></CardHeader>
               <CardContent className="space-y-2">
                 {bundle.routines.map(r => (
                   <div key={r.id} onClick={() => setSelectedRoutineId(r.id)} className={`p-2 border rounded cursor-pointer ${selectedRoutineId === r.id ? 'bg-muted' : ''}`}>
                     {r.name}
                   </div>
                 ))}
               </CardContent>
             </Card>
             <Card className="md:col-span-2">
               <CardHeader><CardTitle>Evidence</CardTitle></CardHeader>
               <CardContent>
                 <ScrollArea className="h-[400px]">
                   {bundle.facts.map(f => {
                     const hits = scanProhibitedTerminology(f.text);
                     const cleaned = applyProhibitedReplacements(f.text);
                     return (
                       <div key={f.factId} className="p-4 border-b last:border-0 space-y-2">
                         <div className="flex items-center gap-2">
                           <Badge variant="outline">{f.type}</Badge>
                           {hits.length > 0 && (
                             <Badge variant="destructive" className="flex items-center gap-1">
                               <AlertTriangle className="h-3 w-3" />
                               Linguistic Issue
                             </Badge>
                           )}
                         </div>
                         <p className="text-sm">{f.text}</p>
                         {hits.length > 0 && (
                           <div className="bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                             <div className="font-semibold text-slate-700 mb-1">Cleaned suggestion:</div>
                             <div className="italic text-slate-600">"{cleaned}"</div>
                             <div className="mt-1 text-[10px] text-slate-400">
                               Detected: {hits.map(h => h.term).join(", ")}
                             </div>
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </ScrollArea>
               </CardContent>
             </Card>
          </div>
        </TabsContent>
        <TabsContent value="capacity">
           <Card>
             <CardHeader><CardTitle>Matrix</CardTitle></CardHeader>
             <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Domain</TableHead>
                     <TableHead>Subskill</TableHead>
                     <TableHead>Demand</TableHead>
                     <TableHead>Capacity</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {selectedLines.map((l, i) => (
                     <TableRow key={i}>
                       <TableCell>{l.domain}</TableCell>
                       <TableCell>{l.subskill}</TableCell>
                       <TableCell>{l.demandLevel}</TableCell>
                       <TableCell>{l.capacityLevel}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
        </TabsContent>
        <TabsContent value="taxonomy">
          <Card>
            <CardHeader>
              <CardTitle>Taxonomy Reference (Word-Ready)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table className="border-collapse border border-slate-400">
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead className="border border-slate-300 font-bold text-slate-900">Domain</TableHead>
                    <TableHead className="border border-slate-300 font-bold text-slate-900">Underlying Performance Skill / Component</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DOMAIN_TAXONOMY.map((d) => (
                    <React.Fragment key={d.domain}>
                      {d.subs.map((sub, idx) => (
                        <TableRow key={sub}>
                          {idx === 0 && (
                            <TableCell
                              rowSpan={d.subs.length}
                              className="border border-slate-300 align-top font-semibold bg-slate-50 w-[200px]"
                            >
                              {d.domain}
                            </TableCell>
                          )}
                          <TableCell className="border border-slate-300">{sub}</TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
