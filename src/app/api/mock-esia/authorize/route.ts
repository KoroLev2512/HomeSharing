import { NextResponse, type NextRequest } from "next/server";
import { MOCK_ESIA_CLIENT_ID } from "@/shared/lib/mockEsiaStore";

// OAuth 2.0 authorize endpoint — GET is required by RFC 6749 §3.1.
// No server state is mutated; redirect builds a URL only.
export async function GET(req: NextRequest) {
    const { searchParams, origin } = new URL(req.url);

    const clientId            = searchParams.get("client_id");
    const redirectUri         = searchParams.get("redirect_uri");
    const responseType        = searchParams.get("response_type");
    const state               = searchParams.get("state");
    const scope               = searchParams.get("scope") ?? "openid fullname email";
    const codeChallenge       = searchParams.get("code_challenge");
    const codeChallengeMethod = searchParams.get("code_challenge_method");

    if (clientId !== MOCK_ESIA_CLIENT_ID) {
        return NextResponse.json({ error: "invalid_client" }, { status: 400 });
    }
    if (!redirectUri) {
        return NextResponse.json({ error: "missing_redirect_uri" }, { status: 400 });
    }
    if (responseType !== "code") {
        return NextResponse.json({ error: "unsupported_response_type" }, { status: 400 });
    }

    const query = new URLSearchParams({
        client_id:     clientId,
        redirect_uri:  redirectUri,
        response_type: responseType,
        scope,
        ...(state               ? { state }                                           : {}),
        ...(codeChallenge       ? { code_challenge:        codeChallenge }            : {}),
        ...(codeChallengeMethod ? { code_challenge_method: codeChallengeMethod }      : {}),
    });

    return NextResponse.redirect(new URL(`/esia/login?${query}`, origin));
}
