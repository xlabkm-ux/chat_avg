"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.env = void 0;
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
const ROOT_DIR = path_1.default.resolve(__dirname, '../../');
// Load environment variables
const envPath = path_1.default.join(ROOT_DIR, '.env');
dotenv_1.default.config({ path: envPath });
const envSchema = zod_1.z.object({
    CHATAVG_PORT: zod_1.z.string().transform(Number).default('8200'),
    CHATAVG_SECRET: zod_1.z.string().min(32, 'CHATAVG_SECRET must be at least 32 characters long'),
    CHATAVG_TOKEN_EXPIRY: zod_1.z.string().default('7d'),
    CHATAVG_ADMIN_PASSWORD: zod_1.z.string().optional(),
    CHATAVG_ALLOWED_ORIGINS: zod_1.z.string().optional().default(''),
    CHATAVG_PROVIDER_TIMEOUT: zod_1.z.string().transform(Number).default('60000'),
    CHATAVG_TEST_TIMEOUT: zod_1.z.string().transform(Number).default('5000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('production'),
});
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
    process.exit(1);
}
exports.env = parsedEnv.data;
exports.config = {
    PORT: exports.env.CHATAVG_PORT,
    SECRET: exports.env.CHATAVG_SECRET,
    TOKEN_EXPIRY: exports.env.CHATAVG_TOKEN_EXPIRY,
    PROVIDER_TIMEOUT: exports.env.CHATAVG_PROVIDER_TIMEOUT,
    TEST_TIMEOUT: exports.env.CHATAVG_TEST_TIMEOUT,
    DATA_DIR: exports.env.NODE_ENV === 'test'
        ? path_1.default.join(ROOT_DIR, 'data_test')
        : path_1.default.join(ROOT_DIR, 'data'),
    WEBUI_DIR: path_1.default.join(ROOT_DIR, 'webui_original'),
    isDev: exports.env.NODE_ENV === 'development',
    isTest: exports.env.NODE_ENV === 'test',
    allowedOrigins: exports.env.CHATAVG_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
};
//# sourceMappingURL=env.js.map