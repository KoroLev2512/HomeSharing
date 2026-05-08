import { NextResponse, type NextRequest } from "next/server";
import { findAccessToken } from "@/shared/lib/mockEsiaStore";

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
        return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }
    const accessToken = auth.slice(7).trim();
    const entry = findAccessToken(accessToken);
    if (!entry) {
        return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    return NextResponse.json({
        sub: entry.user.sub,
        email: entry.user.email,
        fullname: entry.user.fullname,
    });
}
