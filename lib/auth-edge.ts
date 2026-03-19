/**
 * Edge-compatible session validation using Web Crypto API.
 * Used in middleware (Edge Runtime).
 */

function getSecret(): string {
    return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "fallback-secret";
}

async function hmacSign(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

/**
 * Validate a session token in Edge Runtime.
 */
export async function isValidSessionTokenEdge(token: string): Promise<boolean> {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return false;

        const [nonce, timestamp, signature] = parts;
        if (!nonce || !timestamp || !signature) return false;

        // Check token age (max 8 hours)
        const tokenAge = Date.now() - parseInt(timestamp);
        if (isNaN(tokenAge) || tokenAge > 8 * 60 * 60 * 1000 || tokenAge < 0) {
            return false;
        }

        const payload = `${nonce}.${timestamp}`;
        const expectedSignature = await hmacSign(payload, getSecret());

        return timingSafeEqual(signature, expectedSignature);
    } catch {
        return false;
    }
}
