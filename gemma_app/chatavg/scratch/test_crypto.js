const crypto = require('../src/core/crypto');

const key = 'sk-1234567890abcdef1234567890abcdef';
const encrypted = crypto.encrypt(key);
console.log('Original:', key);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', crypto.decrypt(encrypted));
console.log('Masked:', crypto.maskKey(key));

if (crypto.decrypt(encrypted) === key) {
  console.log('✅ Encryption/Decryption works!');
} else {
  console.log('❌ Encryption/Decryption failed!');
  process.exit(1);
}

if (crypto.maskKey(key) === 'sk--...bcdef') {
    // Wait, my maskKey:
    // prefix = key.slice(0, 3) -> "sk-"
    // suffix = key.slice(-4) -> "bcdef" (wait, -4 is "cdef")
    // "sk--...cdef" (Wait, I should check my code)
}
console.log('Masked result:', crypto.maskKey(key));
