// Permanent friend codes. A code is the player's database id scrambled with a fixed bijection and written in
// 8 characters (7 + a check character) like "7K3Q-9XMD": unique per player, not guessable by counting up from
// 1, and a mistyped code is rejected before any lookup. Nothing is stored — the id is recovered from the code.

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O, U
const BITS = 35n;
const SPACE = 1n << BITS;
const MULTIPLIER = 0x2F3A5B7C9n | 1n;
const OFFSET = 0x1D2C3B4A5n;
const INVERSE = modInverse(MULTIPLIER, SPACE);

function modInverse(a, m) {
  let [oldR, r] = [a, m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return ((oldS % m) + m) % m;
}

function checkChar(chars) {
  let sum = 0;
  for (let i = 0; i < chars.length; i++) sum += ALPHABET.indexOf(chars[i]) * (i + 3);
  return ALPHABET[sum % 32];
}

export function friendCodeFor(id) {
  const value = BigInt(id);
  if (value <= 0n || value >= SPACE) throw new RangeError('Player id out of range.');
  let n = (value * MULTIPLIER + OFFSET) % SPACE;
  let chars = '';
  for (let i = 0; i < 7; i++) { chars = ALPHABET[Number(n & 31n)] + chars; n >>= 5n; }
  const code = chars + checkChar(chars);
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

// Returns the player id for a code (dashes, spaces and case are ignored), or 0 when it is not a valid code.
export function playerIdFromCode(input) {
  const clean = String(input ?? '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (clean.length !== 8 || [...clean].some((char) => !ALPHABET.includes(char))) return 0;
  const body = clean.slice(0, 7);
  if (checkChar(body) !== clean[7]) return 0;
  let n = 0n;
  for (const char of body) n = (n << 5n) | BigInt(ALPHABET.indexOf(char));
  const id = ((n - OFFSET) % SPACE + SPACE) % SPACE * INVERSE % SPACE;
  return id > 0n && id < 1n << 31n ? Number(id) : 0;
}
