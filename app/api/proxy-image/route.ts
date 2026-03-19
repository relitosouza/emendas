import { NextResponse } from "next/server";

const ALLOWED_HOSTS = [
    "lh3.googleusercontent.com",
    "drive.google.com",
    "docs.google.com",
    "storage.googleapis.com",
    "i.imgur.com",
    "images.unsplash.com",
    "upload.wikimedia.org",
];

const BLOCKED_IP_RANGES = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
    /^fd/,
    /^localhost$/i,
];

function isBlockedUrl(urlString: string): boolean {
    try {
        const parsed = new URL(urlString);

        // Only allow HTTPS
        if (parsed.protocol !== "https:") {
            return true;
        }

        const hostname = parsed.hostname;

        // Block private/internal IPs
        for (const pattern of BLOCKED_IP_RANGES) {
            if (pattern.test(hostname)) {
                return true;
            }
        }

        // Only allow known image hosts
        if (!ALLOWED_HOSTS.some((host) => hostname === host || hostname.endsWith("." + host))) {
            return true;
        }

        return false;
    } catch {
        return true;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing URL", { status: 400 });
    }

    if (isBlockedUrl(url)) {
        return new NextResponse("URL not allowed", { status: 403 });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal,
            redirect: "error", // Do not follow redirects (prevents SSRF via redirect)
        });
        clearTimeout(timeout);

        if (!response.ok) {
            return new NextResponse("Failed to fetch image", { status: 502 });
        }

        // Validate content type is actually an image
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.startsWith("image/")) {
            return new NextResponse("Response is not an image", { status: 400 });
        }

        // Limit response size to 10MB
        const contentLength = response.headers.get("Content-Length");
        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
            return new NextResponse("Image too large", { status: 413 });
        }

        const arrayBuffer = await response.arrayBuffer();

        // Double check size after download
        if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
            return new NextResponse("Image too large", { status: 413 });
        }

        const buffer = Buffer.from(arrayBuffer);

        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Cache-Control", "public, max-age=86400");
        headers.set("X-Content-Type-Options", "nosniff");

        return new NextResponse(buffer, { headers });
    } catch {
        return new NextResponse("Error proxying image", { status: 500 });
    }
}
