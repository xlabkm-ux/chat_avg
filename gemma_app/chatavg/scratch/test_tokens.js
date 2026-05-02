const jwt = require('jsonwebtoken');
const { SECRET } = require('../src/core/config');

const payload = { sub: 'testuser', tv: 1 };
const token = jwt.sign(payload, SECRET);

console.log('Token with tv=1:', token);

function verify(t, currentTv) {
  try {
    const p = jwt.verify(t, SECRET);
    if (p.tv === undefined || p.tv !== currentTv) {
      console.log(`❌ Verification failed: tv mismatch (expected ${currentTv}, got ${p.tv})`);
      return false;
    }
    console.log(`✅ Verification success: tv matches ${currentTv}`);
    return true;
  } catch (err) {
    console.log('❌ JWT Error:', err.message);
    return false;
  }
}

verify(token, 1); // Should pass
verify(token, 2); // Should fail
verify(jwt.sign({ sub: 'testuser' }, SECRET), 1); // Should fail (no tv)
