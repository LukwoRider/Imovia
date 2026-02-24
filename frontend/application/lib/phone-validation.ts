export function isValidSignupPhone(phone: string) {
  const value = phone.trim();

  // Allow common phone separators only.
  if (!/^[+\d\s().-]+$/.test(value)) {
    return false;
  }

  const compact = value.replace(/[\s().-]/g, "");

  // Only one optional leading "+" is allowed.
  if (!/^\+?\d+$/.test(compact)) {
    return false;
  }

  const digits = compact.replace(/^\+/, "");

  // Accept French formats:
  // - 10 digits starting with 0 (e.g. 0612345678)
  // - 11 digits starting with 33 (e.g. 33612345678 or +33612345678)
  if (/^0\d{9}$/.test(digits)) {
    return true;
  }

  if (/^33\d{9}$/.test(digits)) {
    return true;
  }

  return false;
}

export function sanitizeSignupPhoneInput(input: string) {
  const trimmed = input.trimStart();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = input.replace(/\D/g, "");
  return `${hasLeadingPlus ? "+" : ""}${digitsOnly}`;
}

export const SIGNUP_PHONE_ERROR_MESSAGE =
  "Numéro de téléphone invalide. Utilisez 10 chiffres (ex: 0612345678) ou le format +33612345678.";
