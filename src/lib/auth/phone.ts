const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeIndianMobile(raw: string) {
  let digits = digitsOnly(raw);
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (!INDIAN_MOBILE.test(digits)) return null;
  return digits;
}

export function e164India(digits: string) {
  return `+91${digits}`;
}

export function phoneIdentityKey(digits: string) {
  return `phone:${e164India(digits)}`;
}

export function phoneLoginEmail(digits: string) {
  return `phone_91${digits}@tatvaops.local`;
}

export function phoneUsername(digits: string) {
  return `u91${digits}`;
}
