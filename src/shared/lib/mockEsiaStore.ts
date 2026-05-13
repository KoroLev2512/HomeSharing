import "server-only";
import { randomBytes } from "crypto";

export type MockEsiaUser = {
    sub: string;
    email: string;
    fullname: string;
};

export type MockEsiaCode = {
    code: string;
    user: MockEsiaUser;
    clientId: string;
    redirectUri: string;
    scope: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    expiresAt: number;
};

export type MockEsiaToken = {
    accessToken: string;
    user: MockEsiaUser;
    scope: string;
    expiresAt: number;
};

type Store = {
    codes: Map<string, MockEsiaCode>;
    tokens: Map<string, MockEsiaToken>;
};

const globalScope = globalThis as unknown as { __mockEsiaStore?: Store };

if (!globalScope.__mockEsiaStore) {
    globalScope.__mockEsiaStore = {
        codes: new Map(),
        tokens: new Map(),
    };
}

const store = globalScope.__mockEsiaStore;

const CODE_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_MS = 60 * 60 * 1000;

const purgeExpired = () => {
    const now = Date.now();
    for (const [key, value] of store.codes) {
        if (value.expiresAt <= now) store.codes.delete(key);
    }
    for (const [key, value] of store.tokens) {
        if (value.expiresAt <= now) store.tokens.delete(key);
    }
};

export const issueAuthCode = (params: Omit<MockEsiaCode, "code" | "expiresAt">): string => {
    purgeExpired();
    const code = randomBytes(24).toString("hex");
    store.codes.set(code, {
        ...params,
        code,
        expiresAt: Date.now() + CODE_TTL_MS,
    });
    return code;
};

export const consumeAuthCode = (code: string): MockEsiaCode | null => {
    purgeExpired();
    const entry = store.codes.get(code);
    if (!entry) return null;
    store.codes.delete(code);
    return entry;
};

export const issueAccessToken = (user: MockEsiaUser, scope: string): MockEsiaToken => {
    purgeExpired();
    const accessToken = randomBytes(32).toString("hex");
    const token: MockEsiaToken = {
        accessToken,
        user,
        scope,
        expiresAt: Date.now() + TOKEN_TTL_MS,
    };
    store.tokens.set(accessToken, token);
    return token;
};

export const findAccessToken = (accessToken: string): MockEsiaToken | null => {
    purgeExpired();
    return store.tokens.get(accessToken) ?? null;
};

export const MOCK_ESIA_CLIENT_ID = "mock-esia-client";
export const MOCK_ESIA_CLIENT_SECRET = "mock-esia-secret";

export const presetMockUsers: MockEsiaUser[] = [
    {
        sub: "1000000001",
        email: "ivanov.ivan@example.ru",
        fullname: "Иванов Иван Иванович",
    },
    {
        sub: "1000000002",
        email: "petrova.maria@example.ru",
        fullname: "Петрова Мария Сергеевна",
    },
    {
        sub: "1000000003",
        email: "smirnov.alex@example.ru",
        fullname: "Смирнов Александр Дмитриевич",
    },
];
