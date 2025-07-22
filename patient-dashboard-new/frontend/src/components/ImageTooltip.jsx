import React, { useEffect, useState } from "react";

export default function ImageTooltip({
  visible,          // boolean
  position,         // { x, y }
  pointInfo,        // { name, time, volume }
  studyUID,         // string
  seriesUID,        // string
}) {
  const [viewerUrl, setViewerUrl] = useState(null);

  useEffect(() => {
    if (visible && studyUID && seriesUID) {
      // IDC viewer URL
      setViewerUrl(
        `https://viewer.imaging.datacommons.cancer.gov/viewer/${studyUID}` +
        `?seriesInstanceUID=${seriesUID}`
      );
    } else {
      setViewerUrl(null);
    }
  }, [visible, studyUID, seriesUID]);

  if (!visible || !pointInfo) return null;

  const { name, time, volume } = pointInfo;

  return (
    <div
      style={{
        position: "fixed",
        left: position.x + 10,
        top:  position.y - 120,
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 10,
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        pointerEvents: "none",
        zIndex: 1000,
        maxWidth: 260,
      }}
    >
      <div style={{ 
        fontWeight: "bold", 
        marginBottom: 6, 
        textAlign: "center" 
      }}>
        {name}
      </div>
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        Time: {time}<br/>
        Volume: {volume.toFixed(2)} mm³
      </div>
      <div style={{ textAlign: "center", pointerEvents: "auto" }}>
        <a
          href={viewerUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: "#007bff",
            textDecoration: "none",
            padding: "4px 8px",
            border: "1px solid #007bff",
            borderRadius: 4,
            display: "inline-block",
          }}
        >
          Open in IDC Viewer
        </a>
      </div>
    </div>
  );
}
