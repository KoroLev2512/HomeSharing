import { NextResponse, type NextRequest } from "next/server";
import {
    MOCK_ESIA_CLIENT_ID,
    issueAuthCode,
    type MockEsiaUser,
} from "@/shared/lib/mockEsiaStore";

const isAllowedRedirect = (origin: string, redirectUri: string): boolean => {
    try {
        const target = new URL(redirectUri);
        return target.origin === origin;
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
