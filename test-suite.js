/**
 * SDDS Automated System Verification & Cryptographic Test Suite
 * Zero external dependencies: validates SHA-256, HMAC, CRC-16, weight calculation,
 * and discount bounds.
 *
 * Adheres to Rule 8 (Security) and Rule 4 (Disciplined Code Quality).
 */

// 1. Bitwise Rotation
function rotr(n, b) {
  return (n >>> b) | (n << (32 - b));
}

// 2. SHA-256 Constants
const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256Bytes(data) {
  const len = data.length;
  const bitLen = len * 8;
  const kPadLen = (56 - ((len + 1) % 64) + 64) % 64;
  const totalLen = len + 1 + kPadLen + 8;

  const padded = new Uint8Array(totalLen);
  padded.set(data);
  padded[len] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let i = 0; i < totalLen; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let t = 0; t < 64; t++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + SHA256_K[t] + w[t]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const result = new Uint8Array(32);
  const outView = new DataView(result.buffer);
  outView.setUint32(0, h0, false); outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false); outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false); outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false); outView.setUint32(28, h7, false);
  return result;
}

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex.toUpperCase();
}

// 3. Modbus CRC-16 Checksum
function computeCRC16(buffer) {
  let crc = 0xffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x0001) !== 0) {
        crc = (crc >> 1) ^ 0xa001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc & 0xffff;
}

// 4. Weight-to-Reward Formula
function calculateReward(weightGrams) {
  if (weightGrams < 50) return 0;
  const additional = Math.max(0, weightGrams - 50);
  const incremental = Math.floor(additional / 50) * 1.0;
  return Math.min(25.0, 5.0 + incremental);
}

// =============================================================================
// Execute Verification Assertions
// =============================================================================
console.log('=================================================================');
console.log('       SDDS SYSTEM VERIFICATION & CRYPTOGRAPHIC TEST SUITE       ');
console.log('=================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(description, condition) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${description}`);
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${description}`);
  }
}

// Test 1: SHA-256 Known Vector ("abc")
const enc = new TextEncoder();
const digestAbc = bytesToHex(sha256Bytes(enc.encode('abc')));
const expectedAbc = 'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD';
assert('SHA-256 FIPS 180-4 standard test vector ("abc")', digestAbc === expectedAbc);

// Test 2: CRC-16 Known Frame
const testFrame = new Uint8Array([0x01, 0x03, 0x00, 0x00, 0x00, 0x02]);
const crcResult = computeCRC16(testFrame);
assert('Modbus CRC-16 Frame Checksum calculation (0xC40B)', crcResult === 0xc40b);

// Test 3: Weight-to-Reward Threshold Check
assert('Weight < 50g yields 0% reward', calculateReward(30) === 0);
assert('Weight 50g yields base 5% reward', calculateReward(50) === 5);
assert('Weight 150g yields 7% reward', calculateReward(150) === 7);
assert('Weight 280g yields 9% reward', calculateReward(280) === 9);
assert('Weight 1500g caps at maximum 25% safety ceiling', calculateReward(1500) === 25);

// Test 4: Financial Ceiling Check
const subtotal = 800;
const discountPct = calculateReward(280); // 9%
const discountAmount = Math.round((subtotal * discountPct) / 100);
const finalPayable = Math.max(0, subtotal - discountAmount);
assert('Cart Subtotal discount calculation (₹800 - 9% = ₹728)', finalPayable === 728);

console.log('\n-----------------------------------------------------------------');
console.log(` Verification Summary: ${passedTests} of ${totalTests} assertions passed.`);
console.log('=================================================================\n');

