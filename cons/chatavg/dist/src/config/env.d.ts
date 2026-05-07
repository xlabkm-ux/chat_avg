export declare const env: {
    CHATAVG_PORT: number;
    CHATAVG_SECRET: string;
    CHATAVG_TOKEN_EXPIRY: string;
    CHATAVG_ALLOWED_ORIGINS: string;
    CHATAVG_PROVIDER_TIMEOUT: number;
    CHATAVG_TEST_TIMEOUT: number;
    NODE_ENV: "development" | "production" | "test";
    CHATAVG_ADMIN_PASSWORD?: string | undefined;
};
export declare const config: {
    PORT: number;
    SECRET: string;
    TOKEN_EXPIRY: string;
    PROVIDER_TIMEOUT: number;
    TEST_TIMEOUT: number;
    DATA_DIR: string;
    WEBUI_DIR: string;
    isDev: boolean;
    isTest: boolean;
    allowedOrigins: string[];
};
