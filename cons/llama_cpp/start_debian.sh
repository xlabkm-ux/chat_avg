#!/bin/bash

echo "========================================"
echo "  Llama.cpp Backend - Startup (Debian 12)"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# 1. Detect CPU Cores
CORES=$(nproc)
echo "[INFO] Detected $CORES logical cores."

# 2. Set optimized threads based on core count
if [ "$CORES" -gt 8 ]; then
    THREADS=8
    MODE="SERVER (Performance)"
else
    THREADS=4
    MODE="LAPTOP (Balanced)"
fi

echo "[MODE] $MODE"
echo "[INFO] Using $THREADS threads for Llama."

# 3. Find Model File
MODEL_PATH=$(find models_cache -name "gemma-4-E2B-it-Q8_0.gguf" 2>/dev/null | head -n 1)

if [ -z "$MODEL_PATH" ]; then
    echo "[ERROR] Model gemma-4-E2B-it-Q8_0.gguf not found in models_cache!"
    exit 1
fi

# 4. Start Llama Backend (Port 8081)
echo "[INFO] Starting Llama Backend on port 8081..."
echo ""
echo "========================================"
echo "  Llama Backend is LIVE. Press Ctrl+C to stop."
echo "========================================"
echo ""

# Assuming llama-server is either in PATH or compiled locally. Adjust if using a pre-built linux binary.
if [ -f "./llama-server" ]; then
    SERVER_BIN="./llama-server"
else
    SERVER_BIN="llama-server"
fi

$SERVER_BIN -m "$MODEL_PATH" -c 8192 -t $THREADS -b 512 --mlock --host 127.0.0.1 --port 8081
