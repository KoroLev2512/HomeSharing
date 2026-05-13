import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/shared/configs/serverEnv";
import {
    MOCK_ESIA_CLIENT_ID,
    issueAuthCode,
    type MockEsiaUser,
} from "@/shared/lib/mockEsiaStore";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);

const effectivePort = (u: URL): string =>
    u.port || (u.protocol === "https:" ? "443" : "80");

/**
 * Разрешаем redirect_uri, если он на том же «логическом» origin, что и запрос к grant,
 * или что и NEXTAUTH_URL (appUrl). Иначе вход ломается при смеси localhost / 127.0.0.1
 * или при расхождении публичного URL и того, с которого открыта страница ЕСИА.
 */
const isAllowedRedirect = (requestOrigin: string, redirectUri: string): boolean => {
    try {
        const target = new URL(redirectUri);
        const candidates: string[] = [requestOrigin];
        try {
            candidates.push(new URL(serverEnv.appUrl.replace(/\/$/, "")).origin);
        } catch {
            /* ignore malformed NEXTAUTH_URL */
        }

        for (const base of candidates) {
            try {
                const ref = new URL(base);
                if (target.origin === ref.origin) return true;
                if (
                    LOOPBACK.has(target.hostname) &&
                    LOOPBACK.has(ref.hostname) &&
                    target.protocol === ref.protocol &&
                    effectivePort(target) === effectivePort(ref)
                ) {
                    return true;
                }
            } catch {
                continue;
            }
        }
        return false;
    } catch {
        return false;
    }
};

export async function POST(req: NextRequest) {
    let payload: Record<string, unknown>;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const clientId = String(payload.client_id ?? "");
    const redirectUri = String(payload.redirect_uri ?? "");
    const state = typeof payload.state === "string" ? payload.state : "";
    const scope = typeof payload.scope === "string" ? payload.scope : "openid fullname email";
    const codeChallenge =
        typeof payload.code_challenge === "string" ? payload.code_challenge : undefined;
    const codeChallengeMethod =
        typeof payload.code_challenge_method === "string" ? payload.code_challenge_method : undefined;

    const userInput = payload.user as Partial<MockEsiaUser> | undefined;
    if (!userInput || !userInput.sub || !userInput.email || !userInput.fullname) {
        return NextResponse.json({ error: "invalid_user" }, { status: 400 });
    }
    const user: MockEsiaUser = {
        sub: String(userInput.sub),
        email: String(userInput.email),
        fullname: String(userInput.fullname),
    };

    if (clientId !== MOCK_ESIA_CLIENT_ID) {
        return NextResponse.json({ error: "invalid_client" }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    if (!isAllowedRedirect(origin, redirectUri)) {
        return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 400 });
    }

    const code = issueAuthCode({
        user,
        clientId,
        redirectUri,
        scope,
        codeChallenge,
        codeChallengeMethod,
    });

    const target = new URL(redirectUri);
    target.searchParams.set("code", code);
    if (state) target.searchParams.set("state", state);

    return NextResponse.json({ redirectTo: target.toString() });
}
