/**
 * Unit tests for Fraud Check API (doesn't require API key or network)
 * Tests phone number normalization and validation
 */

import { normalizeBDPhone, BD_PHONE_REGEX } from "../src/lib/fraud-check/common";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testPhoneNormalization() {
  log("\n=== Phone Number Normalization Tests ===\n", "cyan");

  const testCases = [
    { input: "01303463436", expected: "01303463436", shouldPass: true },
    { input: "1303463436", expected: "01303463436", shouldPass: true },
    { input: "+8801303463436", expected: "01303463436", shouldPass: true },
    { input: "8801303463436", expected: "01303463436", shouldPass: true },
    { input: "01712345678", expected: "01712345678", shouldPass: true },
    { input: "1712345678", expected: "01712345678", shouldPass: true },
    { input: "01987654321", expected: "01987654321", shouldPass: true },
    { input: "013-0346-3436", expected: "01303463436", shouldPass: true },
    { input: "013 0346 3436", expected: "01303463436", shouldPass: true },
    { input: "(013) 0346-3436", expected: "01303463436", shouldPass: true },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase) => {
    const normalized = normalizeBDPhone(testCase.input);
    const isValid = BD_PHONE_REGEX.test(normalized);
    const matchesExpected = normalized === testCase.expected;
    const testPassed = matchesExpected && isValid === testCase.shouldPass;

    if (testPassed) {
      log(`✓ ${testCase.input} → ${normalized}`, "green");
      passed++;
    } else {
      log(`❌ ${testCase.input} → ${normalized} (expected: ${testCase.expected})`, "red");
      failed++;
    }
  });

  log(`\nResults: ${passed} passed, ${failed} failed\n`, failed > 0 ? "red" : "green");
  return failed === 0;
}

function testPhoneValidation() {
  log("\n=== Phone Number Validation Tests ===\n", "cyan");

  const validPhones = [
    "01303463436",
    "01712345678",
    "01812345678",
    "01912345678",
    "01512345678",
    "01612345678",
    "01312345678",
    "01412345678",
  ];

  const invalidPhones = [
    "01234567890", // Invalid prefix (starts with 012)
    "1234567890", // Missing leading 0
    "0130346343", // Too short (10 digits instead of 11)
    "013034634361", // Too long (12 digits instead of 11)
    "abc12345678", // Contains letters
    "0130346343a", // Contains letter
    "", // Empty
  ];

  let passed = 0;
  let failed = 0;

  log("Testing valid phone numbers:", "blue");
  validPhones.forEach((phone) => {
    const normalized = normalizeBDPhone(phone);
    const isValid = BD_PHONE_REGEX.test(normalized);
    if (isValid) {
      log(`  ✓ ${phone} (normalized: ${normalized})`, "green");
      passed++;
    } else {
      log(`  ❌ ${phone} should be valid but validation failed`, "red");
      failed++;
    }
  });

  log("\nTesting invalid phone numbers:", "blue");
  invalidPhones.forEach((phone) => {
    if (!phone) {
      // Skip empty string test
      return;
    }
    const normalized = normalizeBDPhone(phone);
    const isValid = BD_PHONE_REGEX.test(normalized);
    if (!isValid) {
      log(`  ✓ ${phone} correctly rejected`, "green");
      passed++;
    } else {
      log(`  ❌ ${phone} should be invalid but validation passed`, "red");
      failed++;
    }
  });

  log(`\nResults: ${passed} passed, ${failed} failed\n`, failed > 0 ? "red" : "green");
  return failed === 0;
}

function testSpecificPhone() {
  log("\n=== Testing Specific Phone Number: 01303463436 ===\n", "cyan");

  const phone = "01303463436";
  const normalized = normalizeBDPhone(phone);
  const isValid = BD_PHONE_REGEX.test(normalized);

  log(`Original: ${phone}`, "reset");
  log(`Normalized: ${normalized}`, "reset");
  log(`Valid: ${isValid ? "YES" : "NO"}`, isValid ? "green" : "red");

  if (isValid) {
    log("\n✓ Phone number is valid and ready for API call", "green");
  } else {
    log("\n❌ Phone number is invalid", "red");
    log(`  Expected format: 01[3-9]XXXXXXXX (11 digits)`, "yellow");
  }

  log("");
  return isValid;
}

async function main() {
  log("=" .repeat(50), "cyan");
  log("Fraud Check API - Unit Tests", "cyan");
  log("=" .repeat(50), "cyan");

  const test1 = testPhoneNormalization();
  const test2 = testPhoneValidation();
  const test3 = testSpecificPhone();

  log("=" .repeat(50), "cyan");
  if (test1 && test2 && test3) {
    log("All unit tests PASSED ✓", "green");
    process.exit(0);
  } else {
    log("Some unit tests FAILED ❌", "red");
    process.exit(1);
  }
}

main();

