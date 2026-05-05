# MCP Gateway Service

This is a standalone MCP (Model Context Protocol) gateway service.
It acts as a proxy for multiple LLM providers (Llama.cpp, OpenAI, DeepSeek, etc.) and exposes them via the Model Context Protocol.

## Installation

1. Install Node.js
2. Run `npm install`
3. Configure `.env` file

## Usage

Run the service:
```bash
npm start
```

Default endpoint: `http://localhost:8202/mcp`

## Integration with Chat AVG

Update the `MCP_GATEWAY_URL` in Chat AVG's `.env` file to point to this service's address.
