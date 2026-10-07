import { json, routeRequest } from "./base.ts";

export interface Env {
  ASSETS: Fetcher;
}

// Security headers (CSP `script-src 'self'`, HSTS, X-Frame-Options, …) for the
// static assets live in public/_headers; worker/base.ts adds nosniff and
// no-store to the responses this Worker generates itself.
export default {
  fetch: (request, env, ctx) => routeRequest(request, env, ctx, handleApi),
} satisfies ExportedHandler<Env>;

/** Everything under `/api`. The app has no endpoints yet. */
async function handleApi(_request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
  return json({ error: "not_found" }, 404);
}
