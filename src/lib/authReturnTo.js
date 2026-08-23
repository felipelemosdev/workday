// Usado pelas páginas de auth (Login, Register) para saber para onde mandar
// o usuário depois do login. Mantém a validação em um só lugar.

// Resolve ?returnTo= para um caminho seguro do mesmo domínio, senão "/".
export function safeReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  if (!raw) return "/";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    const path = url.pathname + url.search;
    // Evita redirect aberto via "//evil.com" ou barra invertida.
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
    return path;
  } catch {
    return "/";
  }
}
