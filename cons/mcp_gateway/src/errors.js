/**
 * MCP Gateway — Custom Errors
 * Standardized error classes for better error handling and reporting.
 */

export class GatewayError extends Error {
  constructor(message, statusCode = 500, code = 'GATEWAY_ERROR') {
    super(message);
    this.name = 'GatewayError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ProviderNotFoundError extends GatewayError {
  constructor(providerName) {
    super(`Provider "${providerName}" not found`, 404, 'PROVIDER_NOT_FOUND');
  }
}

export class ProviderRequestError extends GatewayError {
  constructor(message, originalError = null) {
    super(message, 502, 'PROVIDER_REQUEST_FAILED');
    this.originalError = originalError;
  }
}

export class ValidationError extends GatewayError {
  constructor(message) {
    super(message, 400, 'VALIDATION_FAILED');
  }
}
