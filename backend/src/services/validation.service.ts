import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// 1. Syntax check
export function isValidSyntax(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

// 2. Domain/MX check
export async function hasValidMX(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try {
    const addresses = await resolveMx(domain);
    return addresses && addresses.length > 0;
  } catch {
    return false;
  }
}

// 3. Main validation function
export async function validateEmailList(
  rawInput: string | string[]
): Promise<{
  valid: string[];
  invalid: string[];
  duplicates: string[];
  total: number;
}> {
  // --- Step A: Parse input ---
  let emailArray: string[] = [];
  if (Array.isArray(rawInput)) {
    emailArray = rawInput;
  } else if (typeof rawInput === 'string') {
    // Split by newline, comma, or semicolon
    emailArray = rawInput.split(/[\n,;]+/);
  }

  // --- Step B: Normalize (trim & lowercase) ---
  const normalized = emailArray
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  // --- Step C: Remove duplicates (preserve order) ---
  const seen = new Set<string>();
  const unique: string[] = [];
  const duplicates: string[] = [];

  for (const email of normalized) {
    if (seen.has(email)) {
      duplicates.push(email);
    } else {
      seen.add(email);
      unique.push(email);
    }
  }

  // --- Step D: Check syntax & MX ---
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of unique) {
    // Syntax check
    if (!isValidSyntax(email)) {
      invalid.push(email);
      continue;
    }

    // MX check (optional but good)
    const hasMx = await hasValidMX(email);
    if (hasMx) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return {
    valid,
    invalid,
    duplicates,
    total: normalized.length,
  };
}