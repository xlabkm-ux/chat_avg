class ProviderError extends Error {
  constructor(message, status = 502, code = 'provider_error', isRetryable = false, details = null) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
    this.code = code;
    this.isRetryable = isRetryable;
    this.details = details;
  }
}

module.exports = { ProviderError };
