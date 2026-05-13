import { NextResponse, type NextRequest } from "next/server";
import {
    MOCK_ESIA_CLIENT_ID,
    MOCK_ESIA_CLIENT_SECRET,
    consumeAuthCode,
    issueAccessToken,
} from "@/shared/lib/mockEsiaStore";

const decodeBasicAuth = (header: string | null): { id: string; secret: string } | null => {
    if (!header || !header.startsWith("Basic ")) return null;
    try {
        const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
        const [id, secret] = decoded.split(":");
        if (!id || !secret) return null;
        return { id, secret };
    } catch {
        return null;
    }
};

export async function POST(req: NextRequest) {
    const contentType = req.headers.get("content-type") ?? "";

    let body: Record<string, string> = {};
    if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        body = Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes("application/json")) {
        try {
            const json = await req.json();
            body = Object.fromEntries(
                Object.entries(json).map(([k, v]) => [k, String(v)]),
            );
        } catch {
            return NextResponse.json({ error: "invalid_body" }, { status: 400 });
        }
    } else {
        const text = await req.text();
        body = Object.fromEntries(new URLSearchParams(text));
    }

    const grantType = body.grant_type;
    const code = body.code;
    const redirectUri = body.redirect_uri;

    const basic = decodeBasicAuth(req.headers.get("authorization"));
    const clientId = basic?.id ?? body.client_id;
    const clientSecret = basic?.secret ?? body.client_secret;

    if (grantType !== "authorization_code") {
        return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
    }
    if (clientId !== MOCK_ESIA_CLIENT_ID || clientSecret !== MOCK_ESIA_CLIENT_SECRET) {
        return NextResponse.json({ error: "invalid_client" }, { status: 401 });
    }
    if (!code) {
        return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const consumed = consumeAuthCode(code);
    if (!consumed) {
        return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }
    const normalizeRedirect = (uri: string): string => {
        try {
            const u = new URL(uri);
            u.hash = "";
            const path = u.pathname.endsWith("/") && u.pathname.length > 1 ? u.pathname.slice(0, -1) : u.pathname;
            return `${u.origin}${path}${u.search}`;
        } catch {
            return uri;
        }
    };
    if (normalizeRedirect(consumed.redirectUri) !== normalizeRedirect(String(redirectUri ?? ""))) {
        return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
    }

    const token = issueAccessToken(consumed.user, consumed.scope);

    return NextResponse.json({
        access_token: token.accessToken,
        token_type: "Bearer",
        expires_in: Math.max(0, Math.floor((token.expiresAt - Date.now()) / 1000)),
        scope: token.scope,
    });
}
