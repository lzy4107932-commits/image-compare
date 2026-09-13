const BASE_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "media-src 'none'",
];

export function getContentSecurityPolicy(isDevelopment: boolean) {
  const connectSource = isDevelopment
    ? "connect-src 'self' ws://127.0.0.1:5173"
    : "connect-src 'self'";

  return [...BASE_DIRECTIVES, connectSource].join("; ") + ";";
}
