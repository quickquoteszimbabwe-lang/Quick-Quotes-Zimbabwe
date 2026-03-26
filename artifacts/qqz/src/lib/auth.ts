import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "qqz_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

setAuthTokenGetter(() => getToken());
