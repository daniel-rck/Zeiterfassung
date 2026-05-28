interface Env {
  ASSETS: Fetcher
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
  "script-src 'self' 'sha256-nyMb31s7yvT8b/d98Zu3uGrzFnuNITIamia0wvAqK+A='",
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
].join('; ')

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/healthz') {
      return new Response('ok', {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-cache',
          ...SECURITY_HEADERS,
        },
      })
    }

    const assetResponse = await env.ASSETS.fetch(request)
    // Clone so we can attach security headers (the original headers are
    // immutable on the response returned by the assets binding).
    const response = new Response(assetResponse.body, assetResponse)
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(name, value)
    }
    return response
  },
} satisfies ExportedHandler<Env>
