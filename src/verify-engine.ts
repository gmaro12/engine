import { applyProhibitedReplacements, scanProhibitedTerminology, buildCapacityDemandBundle } from './App';

function testReplacements() {
  console.log("Testing Replacements...");
  const tests = [
    { input: "The student is emerging in hand strength.", expected: "The student is developing in hand strength." },
    { input: "We need to enhance his motor planning.", expected: "We need to improve his motor planning." },
    { input: "It is an emerging skill.", expected: "It is a developing skill." }, // Test a/an flip
    { input: "A emerging problem.", expected: "A developing difficulty with." }, // problem -> difficulty with
    { input: "He is significant and notable.", expected: "He is ." }, // significant, notable -> empty
    { input: "He is noncompliant and manipulative.", expected: "He is did not follow directions and used repeated help-seeking/avoidance behaviors." }
  ];

  tests.forEach(({ input, expected }, i) => {
    const result = applyProhibitedReplacements(input);
    if (result.toLowerCase().trim() === expected.toLowerCase().trim()) {
      console.log(`✅ Test ${i + 1} passed`);
    } else {
      console.error(`❌ Test ${i + 1} failed: Expected "${expected}", got "${result}"`);
    }
  });
}

function testScanning() {
  console.log("\nTesting Scanning...");
  const text = "The student is struggling and has a problem with noncompliant behavior.";
  const hits = scanProhibitedTerminology(text);
  const terms = hits.map(h => h.term);

  const expected = ["struggling", "problem", "noncompliant"];
  expected.forEach(term => {
    if (terms.includes(term)) {
      console.log(`✅ Detected "${term}"`);
    } else {
      console.error(`❌ Failed to detect "${term}"`);
    }
  });
}

function testBundle() {
  console.log("\nTesting Bundle Generation...");
  const raw = "Student has difficulty with handwriting. SS is 75.\nNoise in cafeteria is loud.";
  const bundle = buildCapacityDemandBundle(raw);

  if (bundle.facts.length >= 2) {
    console.log("✅ Extracted facts");
  } else {
    console.error("❌ Failed to extract facts");
  }

  if (bundle.routines.length > 0) {
    console.log("✅ Inferred routines");
  } else {
    console.error("❌ Failed to infer routines");
  }
}

try {
  testReplacements();
  testScanning();
  testBundle();
} catch (e) {
  console.error("Script error:", e);
}
