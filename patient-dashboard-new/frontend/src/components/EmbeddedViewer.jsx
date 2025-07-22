import React, { useState, useEffect } from "react";

const viewerContainer = {
  width: "100%",
  height: "1000px",
  border: "2px solid #e0e0e0",
  borderRadius: "12px",
  background: "#f8f9fa",
  marginTop: "20px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  transition: "all 0.3s ease",
};

const viewerFrame = {
  width: "100%",
  height: "100%",
  border: "none",
  borderRadius: "10px",
};

const placeholderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "#666",
  fontSize: "18px",
  fontWeight: "500",
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
};

const headerStyle = {
  padding: "12px 16px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  fontWeight: "600",
  fontSize: "16px",
  borderRadius: "10px 10px 0 0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const closeButtonStyle = {
  background: "rgba(255,255,255,0.2)",
  border: "none",
  color: "white",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  transition: "background 0.2s ease",
};

export default function EmbeddedViewer({ url, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset states when URL changes
  useEffect(() => {
    if (url) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [url]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!url) {
    return (
      <div style={viewerContainer}>
        <div style={placeholderStyle}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔬</div>
            <div>Click on a data point above to view medical imagery</div>
            <div style={{ fontSize: "14px", color: "#888", marginTop: "8px" }}>
              IDC Viewer will appear here
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={viewerContainer}>
      <div style={headerStyle}>
        <span>🔬 IDC Medical Image Viewer</span>
        <button
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.3)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
        >
          ✕ Close
        </button>
      </div>
      
      {isLoading && (
        <div style={{
          ...placeholderStyle,
          background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
            <div>Loading medical imagery...</div>
          </div>
        </div>
      )}
      
      {hasError && (
        <div style={{
          ...placeholderStyle,
          background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
          color: "#c62828",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>⚠️</div>
            <div>Failed to load medical imagery</div>
            <div style={{ fontSize: "14px", marginTop: "8px" }}>
              Please try clicking on another data point
            </div>
          </div>
        </div>
      )}
      
      <iframe
        key={url} // Force re-render when URL changes for better reliability
        title="IDC Medical Image Viewer"
        src={url}
        style={{
          ...viewerFrame,
          display: isLoading || hasError ? "none" : "block",
        }}
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}

