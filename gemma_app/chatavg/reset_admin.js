const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function hashPw(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

if (fs.existsSync(USERS_FILE)) {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  if (users['admin']) {
    users['admin'].password_hash = hashPw('admin');
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 4), 'utf-8');
    console.log('SUCCESS: Admin password reset to "admin"');
  } else {
    console.log('ERROR: User "admin" not found');
  }
} else {
  console.log('ERROR: users.json not found');
}
