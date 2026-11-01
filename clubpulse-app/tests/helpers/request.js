export function makeRequest(path, { method = "GET", body, cookie, headers = {} } = {}) {
  const requestHeaders = new Headers(headers);
  if (body !== undefined) requestHeaders.set("content-type", "application/json");
  if (cookie) requestHeaders.set("cookie", cookie);

  return new Request(new URL(path, "http://localhost"), {
    method,
    headers: requestHeaders,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
