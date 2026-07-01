import { useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { getShareSiteUrl } from "./siteUrl";

export function ShareSiteQr() {
  const shareUrl = useMemo(() => getShareSiteUrl(), []);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked on http://localhost without focus */
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: "Bettin2Win",
        text: "Live odds guide — scan or tap to open",
        url: shareUrl,
      });
    } catch {
      /* user dismissed the sheet */
    }
  };

  return (
    <details className="share-qr">
      <summary className="share-qr-trigger" aria-label="Share Bettin2Win link">
        <span className="share-qr-icon" aria-hidden>
          ⧉
        </span>
        Share
      </summary>
      <div className="share-qr-panel">
        <p className="share-qr-lead">Scan with your phone camera — no typing.</p>
        <div className="share-qr-canvas" aria-hidden>
          <QRCode value={shareUrl} size={168} bgColor="#ffffff" fgColor="#070a12" level="M" />
        </div>
        <p className="share-qr-url" title={shareUrl}>
          {shareUrl}
        </p>
        <div className="share-qr-actions">
          <button type="button" className="share-qr-copy" onClick={() => void copyLink()}>
            {copied ? "Copied!" : "Copy link"}
          </button>
          {typeof navigator.share === "function" && (
            <button type="button" className="share-qr-native" onClick={() => void nativeShare()}>
              Share…
            </button>
          )}
        </div>
      </div>
    </details>
  );
}