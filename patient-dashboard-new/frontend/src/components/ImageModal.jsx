import React, { useEffect } from "react";

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1300,
};

const frame = {
  width: "80vw",
  height: "80vh",
  border: "none",
  borderRadius: 8,
  background: "#fff",
  boxShadow: "0 0 12px rgba(0,0,0,0.4)",
};

export default function ImageModal({ url, onClose }) {
  // close on Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!url) return null;

  return (
    <div
      style={backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <iframe
        title="IDC viewer"
        src={url}
        style={frame}
        allowFullScreen
        onClick={(e) => e.stopPropagation()}  // prevent backdrop-close
      />
    </div>
  );
}
