/**
 * Validate the browser Origin against the externally visible request origin.
 *
 * Behind a reverse proxy, request.url can contain an internal HTTP origin even
 * when the browser used the public HTTPS URL. Prefer the proxy's forwarded host
 * and protocol headers, falling back to the request URL/Host when unavailable.
 */
function firstHeaderValue(value: string | null): string | null {
  const first = value?.split(',')[0]?.trim();
  return first || null;
}

export function isSameOriginRequest(request: Request): boolean {
  const originHeader = request.headers.get('origin');
  // Keep compatibility with non-browser clients that do not send Origin.
  if (originHeader === null) return true;

  let origin: URL;
  let requestUrl: URL;
  try {
    origin = new URL(originHeader);
    requestUrl = new URL(request.url);
  } catch {
    return false;
  }

  if (origin.protocol !== 'https:' && origin.protocol !== 'http:') return false;

  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  const host = firstHeaderValue(request.headers.get('host'));
  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'))?.replace(/:$/, '');
  const effectiveHost = forwardedHost || host || requestUrl.host;
  const effectiveProto = forwardedProto || requestUrl.protocol.replace(/:$/, '');

  try {
    const publicOrigin = new URL(`${effectiveProto}://${effectiveHost}`).origin;
    return origin.origin === publicOrigin;
  } catch {
    return false;
  }
}
