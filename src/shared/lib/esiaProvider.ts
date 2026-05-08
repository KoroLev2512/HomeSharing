import "server-only";
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";
import {
    MOCK_ESIA_CLIENT_ID,
    MOCK_ESIA_CLIENT_SECRET,
} from "@/shared/lib/mockEsiaStore";
import { serverEnv } from "@/shared/configs/serverEnv";

type EsiaProfile = {
    sub: string;
    email: string;
    fullname: string;
};

/**
 * Учебный mock-провайдер ЕСИА (Госуслуги).
 *
 * Реализует OAuth 2.0 Authorization Code flow с локальными эндпоинтами
 * /api/mock-esia/{authorize,token,userinfo}. В продакшене здесь должны быть
 * реальные URL ЕСИА, подписанные detached PKCS#7 (ГОСТ Р 34.10-2012).
 */
export const createEsiaMockProvider = (): OAuthConfig<EsiaProfile> => {
    const baseUrl = serverEnv.appUrl.replace(/\/$/, "");

    const config: OAuthUserConfig<EsiaProfile> & {
        id: string;
        name: string;
        type: "oauth";
        version: string;
        authorization: { url: string; params: Record<string, string> };
        token: string;
        userinfo: string;
        idToken: false;
        checks: Array<"state">;
        profile: (profile: EsiaProfile) => {
            id: string;
            name: string;
            email: string;
            image: null;
        };
    } = {
        id: "esia",
        name: "Госуслуги",
        type: "oauth",
        version: "2.0",
        clientId: MOCK_ESIA_CLIENT_ID,
        clientSecret: MOCK_ESIA_CLIENT_SECRET,
        authorization: {
            url: `${baseUrl}/api/mock-esia/authorize`,
            params: {
                scope: "openid fullname email",
                response_type: "code",
            },
        },
        token: `${baseUrl}/api/mock-esia/token`,
        userinfo: `${baseUrl}/api/mock-esia/userinfo`,
        idToken: false,
        checks: ["state"],
        profile(profile) {
            return {
                id: profile.sub,
                name: profile.fullname,
                email: profile.email,
                image: null,
            };
        },
    };

    return config as unknown as OAuthConfig<EsiaProfile>;
};
