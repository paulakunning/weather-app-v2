// Preference cookies (unit, language) that the server reads on the next request.
export function setPreferenceCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}
