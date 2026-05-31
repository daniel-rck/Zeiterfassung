export interface Env {
  ASSETS: Fetcher;
}

// Content-Security-Policy.
//
// `script-src` allows our own bundles ('self'), the vite-plugin-pwa
// registration script (/registerSW.js, also 'self') and the single inline
// theme-bootstrap script in index.html via its sha256 hash. The hash is taken
// over the exact text content of that <script> element; it only changes if the
// bootstrap snippet itself changes.
//
// `style-src` needs 'unsafe-inline' because several components render inline
// style={{…}} attributes (e.g. project colours in Combobox/Badge). `img-src`
// allows data: URIs for inline SVG/PNG. The app makes no cross-origin requests,
// so connect/font/manifest/worker all stay on 'self'.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'sha256-e3tJSdVAi42SMB/ewLy/YKXTzQjDws6fMSzZaWxkISc='",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join("; ");

// App-specific deviation from the canonical web-base worker: this app injects a
// strict CSP + security headers on every response (documented in docs/specs).
const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CSP,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

function withSecurityHeaders(response: Response): Response {
  const next = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    next.headers.set(name, value);
  }
  return next;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return withSecurityHeaders(Response.json({ ok: true }));
    }

    if (url.pathname.startsWith("/api/")) {
      return withSecurityHeaders(await handleApi(request, env, ctx));
    }

    // Fall through to Workers Assets (static SPA bundle), then attach security
    // headers (the assets binding returns immutable headers, so clone first).
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;

async function handleApi(_request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
  return Response.json({ error: "not_found" }, { status: 404 });
}
