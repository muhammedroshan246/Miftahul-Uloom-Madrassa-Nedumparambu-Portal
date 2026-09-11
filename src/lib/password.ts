import crypto from 'crypto';

const FORBIDDEN_PASSWORDS = new Set([
  '123456', '654321', '000000', '111111', '222222', '333333',
  '444444', '555555', '666666', '777777', '888888', '999999',
  '121212', '123123', '012345', '543210', '112233', '987654'
]);

/**
 * Generates a cryptographically strong, non-obvious 6-digit numeric password.
 * Guarantees exactly 6 digits between 100000 and 999999.
 */
export function generateSecure6DigitPassword(): string {
  let password = '';
  let attempts = 0;

  while (attempts < 100) {
    attempts++;
    const num = crypto.randomInt(100000, 1000000);
    password = String(num);

    if (FORBIDDEN_PASSWORDS.has(password)) continue;
    if (/^(\d)\1{5}$/.test(password)) continue;
    if ('0123456789'.includes(password.substring(0, 4)) || '9876543210'.includes(password.substring(0, 4))) continue;

    return password;
  }

  return String(crypto.randomInt(102847, 984729));
}
