@echo off
echo Starting LiteLLM Proxy Gateway...
echo Make sure you have installed litellm: pip install 'litellm[proxy]'
echo And set the necessary environment variables in .env (or run this from an env where they are set)

:: Load environment variables if a .env file exists in the parent chatavg directory
if exist "..\chatavg\.env" (
    for /f "usebackq tokens=1,* delims==" %%A in ("..\chatavg\.env") do (
        if not "%%A"=="" if not "%%A"==" " (
            set %%A=%%B
        )
    )
)

litellm --config litellm_config.yaml --port 4000
