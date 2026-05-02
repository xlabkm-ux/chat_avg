/**
 * Authentication — JWT middleware & helpers
 */
const jwt = require('jsonwebtoken');
const { SECRET, TOKEN_EXPIRY } = require('../../core/config');
const userRepository = require('./user.repository');
const { AppError, AuthError } = require('../../core/errors');

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
  return jwt.sign({ 
    sub: user.username, 
    category: user.category,
    tv: user.token_version || 0
  }, SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Express middleware: validate Bearer token, attach `req.user`.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AuthError('Требуется заголовок Authorization с типом Bearer'));
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, SECRET);
    const user = await userRepository.findByUsername(payload.sub);

    if (!user) {
      throw new AuthError('Пользователь не найден', 'user_not_found');
    }
    
    // Strict check for token version (tv must be present and must match)
    const currentTv = user.token_version || 0;
    if (payload.tv === undefined || payload.tv !== currentTv) {
      throw new AuthError('Сессия недействительна: требуется повторный вход', 'session_invalidated');
    }
    
    if (isExpired(user)) {
      throw new AuthError('Срок действия аккаунта истек', 'account_expired');
    }

    req.user = { ...user, username: payload.sub };
    next();
  } catch (err) {
    if (err instanceof AuthError) return next(err);
    
    const detail = err.name === 'TokenExpiredError' ? 'Срок действия токена истек' : 'Неверный токен';
    next(new AuthError(detail, err.name));
  }
}

/**
 * Express middleware: require Администратор category.
 */
function requireAdmin(req, res, next) {
  if (req.user.category !== 'Администратор') {
    return next(new AppError('Требуются права администратора', 403, 'forbidden'));
  }
  next();
}

module.exports = { authenticate, requireAdmin, signToken, isExpired };
