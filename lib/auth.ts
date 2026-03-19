import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "admin-session";

function getSecret(): string {
    return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "fallback-secret";
}

/**
 * Generate a signed session token using HMAC.
 * The token contains a random nonce + timestamp + signature.
 * For use in API routes (Node.js runtime).
 */
export function generateSessionToken(): string {
    const nonce = crypto.randomBytes(32).toString("hex");
    const timestamp = Date.now().toString();
    const payload = `${nonce}.${timestamp}`;
    const signature = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
    return `${payload}.${signature}`;
}

/**
 * Validate a session token by verifying its HMAC signature.
 * Works in Node.js runtime (API routes).
 */
export function isValidSessionToken(token: string): boolean {
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
        const expectedSignature = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");

        // Constant-time comparison to prevent timing attacks
        if (signature.length !== expectedSignature.length) return false;
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch {
        return false;
    }
}

/**
 * Compare passwords using constant-time comparison to prevent timing attacks.
 */
export function verifyPassword(input: string, expected: string): boolean {
    // Pad both to same length to avoid length leak
    const maxLen = Math.max(input.length, expected.length, 1);
    const inputBuf = Buffer.alloc(maxLen, 0);
    const expectedBuf = Buffer.alloc(maxLen, 0);
    Buffer.from(input).copy(inputBuf);
    Buffer.from(expected).copy(expectedBuf);

    const match = crypto.timingSafeEqual(inputBuf, expectedBuf);
    return match && input.length === expected.length;
}

/**
 * Check if the current request is authenticated (for use in API routes).
 * Reads the session cookie from the request headers.
 */
export async function isAuthenticated(): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get(SESSION_COOKIE);
        if (!session || !session.value) return false;
        return isValidSessionToken(session.value);
    } catch {
        return false;
    }
}

/**
 * Returns a 401 JSON response for unauthorized requests.
 */
export function unauthorizedResponse() {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
}
