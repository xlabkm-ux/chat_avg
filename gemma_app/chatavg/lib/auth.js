/**
 * Authentication — JWT middleware & helpers
 */
const jwt = require('jsonwebtoken');
const { SECRET, TOKEN_EXPIRY } = require('../config');
const userRepository = require('../storage/userRepository');

/**
 * Check if user account has expired.
 * @returns {boolean} true if expired
 */
function isExpired(user) {
  if (!user.expiration_date) return false;
  return new Date() > new Date(user.expiration_date);
}

/**
 * Create a signed JWT for the given user.
 */
function signToken(user) {
  const pwPrefix = user.password_hash ? user.password_hash.substring(0, 10) : '';
  return jwt.sign({ 
    sub: user.username, 
    category: user.category,
    pw: pwPrefix 
  }, SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Express middleware: validate Bearer token, attach `req.user`.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Требуется авторизация' });
  }

  try {
    const payload = jwt.verify(header.split(' ')[1], SECRET);
    const user = await userRepository.findByUsername(payload.sub);

    if (!user) {
      return res.status(401).json({ detail: 'Пользователь не найден' });
    }
    
    const currentPwPrefix = user.password_hash ? user.password_hash.substring(0, 10) : '';
    if (payload.pw && payload.pw !== currentPwPrefix) {
      return res.status(401).json({ detail: 'Пароль был изменен. Требуется повторная авторизация.' });
    }
    
    if (isExpired(user)) {
      return res.status(403).json({ detail: 'Срок действия аккаунта истек' });
    }

    req.user = { ...user, username: payload.sub };
    next();
  } catch {
    return res.status(401).json({ detail: 'Неверный токен' });
  }
}

/**
 * Express middleware: require Администратор category.
 */
function requireAdmin(req, res, next) {
  if (req.user.category !== 'Администратор') {
    return res.status(403).json({ detail: 'Требуются права администратора' });
  }
  next();
}

module.exports = { authenticate, requireAdmin, signToken, isExpired };
