import { NextResponse, type NextRequest } from "next/server";
import { MOCK_ESIA_CLIENT_ID } from "@/shared/lib/mockEsiaStore";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const params = url.searchParams;

    const clientId = params.get("client_id");
    const redirectUri = params.get("redirect_uri");
    const responseType = params.get("response_type");
    const state = params.get("state");
    const scope = params.get("scope") ?? "openid fullname email";
    const codeChallenge = params.get("code_challenge");
    const codeChallengeMethod = params.get("code_challenge_method");

    if (clientId !== MOCK_ESIA_CLIENT_ID) {
        return NextResponse.json({ error: "invalid_client" }, { status: 400 });
    }

    if (!redirectUri) {
        return NextResponse.json({ error: "missing_redirect_uri" }, { status: 400 });
    }

    if (responseType !== "code") {
        return NextResponse.json({ error: "unsupported_response_type" }, { status: 400 });
    }

    const loginUrl = new URL("/esia/login", url.origin);
    loginUrl.searchParams.set("client_id", clientId);
    loginUrl.searchParams.set("redirect_uri", redirectUri);
    loginUrl.searchParams.set("response_type", responseType);
    loginUrl.searchParams.set("scope", scope);
    if (state) loginUrl.searchParams.set("state", state);
    if (codeChallenge) loginUrl.searchParams.set("code_challenge", codeChallenge);
    if (codeChallengeMethod) loginUrl.searchParams.set("code_challenge_method", codeChallengeMethod);

    return NextResponse.redirect(loginUrl);
}
