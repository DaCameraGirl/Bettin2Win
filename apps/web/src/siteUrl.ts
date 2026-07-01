/** Canonical share URL for the page someone is viewing (GitHub Pages, local dev, etc.). */
export function getShareSiteUrl(href = typeof window !== "undefined" ? window.location.href : ""): string {
  const fallback = "https://dacameragirl.github.io/Bettin2Win/";
  if (!href) return fallback;

  try {
    const url = new URL(href);
    url.hash = "";
    url.search = "";
    const normalized = `${url.origin}${url.pathname}`.replace(/\/+$/, "");
    return normalized || fallback;
  } catch {
    return fallback;
  }
}