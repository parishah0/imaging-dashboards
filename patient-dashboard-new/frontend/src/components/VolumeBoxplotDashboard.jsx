// patient-dashboard-new/frontend/src/components/VolumeBoxplotDashboard.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import Plot from "react-plotly.js";
import EmbeddedViewer from "./EmbeddedViewer";
import "../App.css";

// Use the Vercel env var; fall back to localhost for dev. Trim any trailing slash.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export default function VolumeBoxplotDashboard() {
  /* ───────── State ───────── */
  const [volumeData, setVolumeData]       = useState([]);
  const [structures, setStructures]       = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    smoking_status: [], gender: [], race: [], clinical_stage: [], age_range: { min: 0, max: 100 }
  });
  // const [filters, setFilters]             = useState({
  //   smoking_status: [], gender: [], race: [], clinical_stage: [], age_range: [0, 100]
  // });
  const [draftFilters, setDraftFilters]   = useState({
    structure: "Aorta",          // ⬅️ moved in here
    smoking_status: [],
    gender: [],
    race: [],
    clinical_stage: [],
    age_range: [0, 100],
  });

  const [appliedFilters, setAppliedFilters] = useState(draftFilters);

  const [selectedStructure, setSelectedStructure] = useState("Aorta");
  const [loading, setLoading]               = useState(false); // overall chart loading
  const [filterLoading, setFilterLoading]   = useState(false); // only for Apply Filters button
  const [error, setError]                   = useState("");
  const abortRef = useRef(null);
  const [patientInfo, setPatientInfo] = useState(null);
  // embedded IDC viewer URL
  const [viewerUrl, setViewerUrl]           = useState(null);

  // Color palette from the provided dashboard image
  const palette = {
    bgGradient: "linear-gradient(135deg, #f8fafc 0%, #fdf6f0 100%)", // background
    cardBg: "#fff",
    cardBorder: "#e2e8f0",
    accent: "#ffb980", // orange accent
    accentDark: "#f57c00", // deeper orange
    accentLight: "#ffe0b2", // light orange
    textMain: "#2d3748",
    textSubtle: "#64748b",
    textAccent: "#f57c00",
    statGray: "#bfc9d1",
    statBlack: "#22292f",
    statOrange: "#ffb980",
    statOrangeDark: "#f57c00",
    statOrangeLight: "#ffe0b2",
    statBlue: "#5b9bd5",
    statBlueLight: "#e0f2fe",
    statBlueDark: "#0277bd",
    statBorder: "#cbd5e1",
  };

  /* ───────── Load filter-options & structures once ───────── */
  useEffect(() => {
    (async () => {
      try {
        const res1 = await fetch(`${API_BASE}/api/filter-options`);
        const opts = await res1.json();
        setFilterOptions(opts);
        setDraftFilters(f => ({
          ...f,
          age_range: [opts.age_range.min, opts.age_range.max]
        }));
        setAppliedFilters(f => ({
          ...f,
          age_range: [opts.age_range.min, opts.age_range.max]
        }));
      } catch (e) {
        console.error("Failed to load filter-options", e);
      }
      try {
        const res2 = await fetch(`${API_BASE}/api/structures`);
        const arr  = await res2.json();
        setStructures(arr);
        if (arr.length && !arr.includes(selectedStructure)) {
          setSelectedStructure(arr[0]);
        }
      } catch (e) {
        console.error("Failed to load structures", e);
      }
    })();
  }, []);

  /* ───────── Fetch volume data ───────── */
  // const fetchVolumeData = useCallback(async () => {
  //   if (abortRef.current) abortRef.current.abort();
  //   const ctrl = new AbortController();
  //   abortRef.current = ctrl;

  //   setLoading(true);
  //   setError("");
  //   try {
  //     const qs = new URLSearchParams();
  //     qs.append("structure", selectedStructure);
  //     const addArr = (k, arr) => arr.forEach(v => qs.append(k, v));
  //     addArr("smoking_status", appliedFilters.smoking_status);
  //     addArr("gender",          appliedFilters.gender);
  //     addArr("race",            appliedFilters.race);
  //     addArr("clinical_stage",  appliedFilters.clinical_stage);

  //     const [minA, maxA] = appliedFilters.age_range;
  //     if (minA > filterOptions.age_range.min) qs.append("min_age", minA);
  //     if (maxA < filterOptions.age_range.max) qs.append("max_age", maxA);

  //     const res = await fetch(
  //       `${API_BASE}/api/volume-data?${qs.toString()}`,
  //       { signal: ctrl.signal }
  //     );
  //     if (!res.ok) throw new Error(res.statusText);
  //     setVolumeData(await res.json());
  //   } catch (e) {
  //     if (e.name !== "AbortError") {
  //       console.error("Volume fetch error", e);
  //       setVolumeData([]);
  //       setError(e.message || "Failed to fetch volume data");
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [selectedStructure, appliedFilters, filterOptions.age_range]);
  const fetchVolumeData = async (filtersObj) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true); setError("");
    try {
      const qs = new URLSearchParams();
      qs.append("structure", filtersObj.structure);

      const addArr = (k, arr) => arr.forEach(v => qs.append(k, v));
      addArr("smoking_status", filtersObj.smoking_status);
      addArr("gender",         filtersObj.gender);
      addArr("race",           filtersObj.race);
      addArr("clinical_stage", filtersObj.clinical_stage);

      const [minA, maxA] = filtersObj.age_range;
      if (minA > filterOptions.age_range.min) qs.append("min_age", minA);
      if (maxA < filterOptions.age_range.max) qs.append("max_age", maxA);

      const res = await fetch(`${API_BASE}/api/volume-data?${qs}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(res.statusText);
      setVolumeData(await res.json());
    } catch (e) {
      if (e.name !== "AbortError") { setError(e.message); setVolumeData([]); }
    } finally {
      setLoading(false);
    }
  };

  /* ───────── On mount & whenever appliedFilters change ───────── */
  useEffect(() => { fetchVolumeData(draftFilters); }, []);

  /* ───────── Filter handlers ───────── */
  // const toggleCheckbox = (key, val, checked) =>
  //   setFilters(p => ({
  //     ...p,
  //     [key]: checked ? [...p[key], val] : p[key].filter(x => x !== val),
  //   }));
  const toggleCheckbox = (key, val, checked) =>
    setDraftFilters(f => ({
      ...f,
      [key]: checked
        ? [...f[key], val]
        : f[key].filter(x => x !== val),
    }));

  // const setAge = (i, v) =>
  //   setFilters(p => {
  //     const r = [...p.age_range]; r[i] = v;
  //     return { ...p, age_range: r };
  //   });
  const setAge = (i, v) =>
    setDraftFilters(f => {
      const r = [...f.age_range]; r[i] = v;
      return { ...f, age_range: r };
    });

  // const applyFilters = () => {
  //   setFilterLoading(true);
  //   setAppliedFilters(filters);
  // };
  const applyFilters = () => {
    setAppliedFilters(draftFilters);   // for later inspection / UI badges
    fetchVolumeData(draftFilters);     // <-- only place the query is ever fired
  };

  /* ───────── Build traces + invisible scatter overlay ───────── */
  const createBoxplotData = () => {
    if (!volumeData.length) return [];

    const timePoints = ["T0", "T1", "T2"];
    const groups     = [...new Set(volumeData.map(d => d.smoking_status))].filter(Boolean);

    // Box traces
    const boxTraces = groups.flatMap((status, idx) => {
      const subset = volumeData.filter(d => d.smoking_status === status);
      const light = idx === 0 ? "rgba(54,162,235,0.55)" : "rgba(255,99,132,0.55)";
      const dark  = idx === 0 ? "rgba(25,118,210,1)"   : "rgba(183,28,28,1)";

      return timePoints.map(tp => {
        const pts = subset.filter(d => d.ClinicalTrialTimePointID === tp);
        if (!pts.length) return null;
        const colors = pts.map(d => d.viewer_url ? dark : light);
        return {
          x: pts.map(() => tp),
          y: pts.map(d => d.volume_ml),
          name: status,
          type: "box",
          hoverinfo: "none",
          boxpoints: "all",
          jitter: 0.3,
          pointpos: -1.8,
          marker: { color: colors, size: 6 },
          line:   { color: dark },
          customdata: pts.map(d => ({
            viewer_url: d.viewer_url,
            age:        d.age,
            gender:     d.gender_description,
            race:       d.race_description,
            stage:      d.clinical_stage,
   volume:     d.volume_ml
 })),
          showlegend: tp === "T0",
        };
      });
    }).filter(Boolean);

    // Invisible scatter on top (guaranteed click target, now larger)
    const scatterTraces = groups.flatMap(() => {
      return timePoints.map(tp => {
        const pts = volumeData.filter(d => d.ClinicalTrialTimePointID === tp);
        if (!pts.length) return null;
        return {
          x: pts.map(() => tp),
          y: pts.map(d => d.volume_ml),
          mode: "markers",
          marker: { size: 40, opacity: 0 }, // <-- bumped size from 20 → 40
          //customdata: pts.map(d => d.viewer_url),
          customdata: pts.map(d => ({
   viewer_url: d.viewer_url,
   age:        d.age,
   gender:     d.gender_description,
   race:       d.race_description,
   stage:      d.clinical_stage,
   volume:     d.volume_ml
 })),
          hoverinfo: "none",
          showlegend: false,
        };
      });
    }).filter(Boolean);

    return [...boxTraces, ...scatterTraces];
  };

  const layout = {
    title: `Distribution of ${draftFilters.structure} Volume`,
    xaxis: {
      title: {
        text: 'Clinical Time Points',
        font: { size: 16, color: '#2d3748', family: 'Inter, Segoe UI, system-ui, sans-serif' },
        standoff: 12
      },
      categoryorder: "array",
      categoryarray: ["T0","T1","T2"],
      tickfont: { size: 14, color: '#475569' },
      tickvals: ["T0","T1","T2"],
      ticktext: ["T0", "T1", "T2"],
    },
    yaxis: {
      title: {
        text: `Volume of Structure (mm³)`,
        font: { size: 16, color: '#2d3748', family: 'Inter, Segoe UI, system-ui, sans-serif' },
        standoff: 16
      },
      tickfont: { size: 14, color: '#475569' }
    },
    boxmode: "group",
    height: 550,
    hovermode: "closest",
    showlegend: true,
    legend: { x:1, y:1, xanchor:"left", yanchor:"top" },
    clickmode: "event+select",
  };

  const uniqueSegs = new Set(volumeData.map(d => d.segmentationSeriesUID)).size;

  /* ───────── onClick handler ───────── */
const handleClick = (data) => {
  console.log("🔥 onClick eventData:", data);

  if (!data.points?.length) {
    console.log("❌ No points in click data");
    return;
  }

  const pt = data.points[0];
  if (!pt.data?.customdata || pt.pointNumber === undefined) {
    console.log("❌ Invalid point data structure");
    return;
  }

  /* full object for panel & viewer */
  const cd  = pt.data.customdata[pt.pointNumber];
  setPatientInfo(cd);                       // ← show Patient Details panel

  const url = cd.viewer_url;
  console.log("→ viewer_url:", url);

  if (url && url.trim()) {
    // Clear previous URL first to force re-render
    setViewerUrl(null);
    // Set new URL after a brief delay to ensure component re‑renders
    setTimeout(() => setViewerUrl(url.trim()), 100);
  } else {
    console.log("❌ No valid viewer URL found for this point");
    setError("No medical imagery available for this data point");
    setTimeout(() => setError(""), 3000);
  }
};



  return (
   <div className="dashboard-container">
      {/* Header */}
      <div style={{
        textAlign: "center",
        marginBottom: "40px",
        padding: "32px",
        background: "rgba(255, 255, 255, 0.9)",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.2)"
      }}>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          margin: "0 0 16px 0",
          letterSpacing: "-0.02em"
        }}>
          🧠 Anatomical Structure Volume Distribution
        </h1>
        <p style={{
          fontSize: "1.1rem",
          color: "#64748b",
          margin: "0",
          fontWeight: "400"
        }}>
          Interactive analysis of medical imaging data over time
        </p>
      </div>

      {/* Main Content Card */}
      <div className="main-card" style={{
        background: palette.cardBg,
        borderRadius: "20px",
        padding: "32px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        border: `1px solid ${palette.cardBorder}`,
        marginBottom: "24px"
      }}>

        {/* Structure Selector */}
        <div className="card" style={{ 
          marginBottom: "32px",
          padding: "20px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "16px",
          color: "white"
        }}>
          <label style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            marginBottom: "12px",
            display: "block"
          }}>
            📊 Select Anatomical Structure
          </label>
          <select
            value={draftFilters.structure}
            onChange={e => setDraftFilters(f => ({ ...f, structure: e.target.value }))}
            style={{ 
              padding: "12px 16px",
              fontSize: "16px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(255, 255, 255, 0.95)",
              color: "#2d3748",
              fontWeight: "500",
              cursor: "pointer",
              minWidth: "200px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
            }}
          >
            {structures.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Filters */}
        <div className="card" style={{
          marginBottom: "32px"
        }}>
          <h3 style={{
            fontSize: "1.3rem",
            fontWeight: "600",
            marginBottom: "20px",
            color: "#2d3748",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            🔍 Filter Options
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            padding: "24px",
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            borderRadius: "16px",
            border: "1px solid #e2e8f0"
          }}>
            {/* Smoking Status */}
            <div style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              border: "1px solid #f1f5f9"
            }}>
              <h4 style={{
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                🚬 Smoking Status
              </h4>
              {filterOptions.smoking_status.map(st => (
                <label key={st} style={{ 
                  display: "flex", 
                  alignItems: "center",
                  fontSize: "14px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  padding: "4px 0",
                  transition: "color 0.2s ease"
                }}>
                  <input
                    type="checkbox"
                    checked={draftFilters.smoking_status.includes(st)}
                    onChange={e => toggleCheckbox("smoking_status", st, e.target.checked)}
                    style={{ 
                      marginRight: "8px",
                      transform: "scale(1.1)",
                      accentColor: "#667eea"
                    }}
                  />
                  <span style={{ color: "#64748b" }}>{st}</span>
                </label>
              ))}
            </div>
            {/* Gender */}
            <div style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              border: "1px solid #f1f5f9"
            }}>
              <h4 style={{
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                👤 Gender
              </h4>
              {filterOptions.gender.map(g => (
                <label key={g} style={{ 
                  display: "flex", 
                  alignItems: "center",
                  fontSize: "14px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  padding: "4px 0",
                  transition: "color 0.2s ease"
                }}>
                  <input
                    type="checkbox"
                    checked={draftFilters.gender.includes(g)}
                    onChange={e => toggleCheckbox("gender", g, e.target.checked)}
                    style={{ 
                      marginRight: "8px",
                      transform: "scale(1.1)",
                      accentColor: "#667eea"
                    }}
                  />
                  <span style={{ color: "#64748b" }}>{g}</span>
                </label>
              ))}
            </div>
            {/* Race */}
            <div style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              border: "1px solid #f1f5f9"
            }}>
              <h4 style={{
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                🌍 Race
              </h4>
              {filterOptions.race.map(r => (
                <label key={r} style={{ 
                  display: "flex", 
                  alignItems: "center",
                  fontSize: "14px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  padding: "4px 0",
                  transition: "color 0.2s ease"
                }}>
                  <input
                    type="checkbox"
                    checked={draftFilters.race.includes(r)}
                    onChange={e => toggleCheckbox("race", r, e.target.checked)}
                    style={{ 
                      marginRight: "8px",
                      transform: "scale(1.1)",
                      accentColor: "#667eea"
                    }}
                  />
                  <span style={{ color: "#64748b" }}>{r}</span>
                </label>
              ))}
            </div>
            {/* Clinical Stage */}
            <div style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              border: "1px solid #f1f5f9"
            }}>
              <h4 style={{
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                🏥 Clinical Stage
              </h4>
              {filterOptions.clinical_stage.map(cs => (
                <label key={cs} style={{ 
                  display: "flex", 
                  alignItems: "center",
                  fontSize: "14px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  padding: "4px 0",
                  transition: "color 0.2s ease"
                }}>
                  <input
                    type="checkbox"
                    checked={draftFilters.clinical_stage.includes(cs)}
                    onChange={e => toggleCheckbox("clinical_stage", cs, e.target.checked)}
                    style={{ 
                      marginRight: "8px",
                      transform: "scale(1.1)",
                      accentColor: "#667eea"
                    }}
                  />
                  <span style={{ color: "#64748b" }}>{cs}</span>
                </label>
              ))}
            </div>
            
            {/* Age */}
            <div style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              border: "1px solid #f1f5f9"
            }}>
              <h4 style={{
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                📅 Age Range: {draftFilters.age_range[0]}–{draftFilters.age_range[1]}
              </h4>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ 
                  fontSize: "12px", 
                  color: "#64748b", 
                  marginBottom: "4px", 
                  display: "block" 
                }}>
                  Minimum Age: {draftFilters.age_range[0]}
                </label>
                <input
                  type="range"
                  min={filterOptions.age_range.min}
                  max={filterOptions.age_range.max}
                  value={draftFilters.age_range[0]}
                  onChange={e => setAge(0, +e.target.value)}
                  style={{ 
                    width: "100%", 
                    height: "6px",
                    borderRadius: "3px",
                    background: "linear-gradient(to right, #667eea, #764ba2)",
                    outline: "none",
                    cursor: "pointer"
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  fontSize: "12px", 
                  color: "#64748b", 
                  marginBottom: "4px", 
                  display: "block" 
                }}>
                  Maximum Age: {draftFilters.age_range[1]}
                </label>
                <input
                  type="range"
                  min={filterOptions.age_range.min}
                  max={filterOptions.age_range.max}
                  value={draftFilters.age_range[1]}
                  onChange={e => setAge(1, +e.target.value)}
                  style={{ 
                    width: "100%", 
                    height: "6px",
                    borderRadius: "3px",
                    background: "linear-gradient(to right, #667eea, #764ba2)",
                    outline: "none",
                    cursor: "pointer"
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={applyFilters} 
          disabled={filterLoading} 
          style={{ 
            padding: "14px 32px",
            fontSize: "16px",
            fontWeight: "600",
            background: filterLoading 
              ? palette.statGray
              : `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accentDark} 100%)`,
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            cursor: filterLoading ? "not-allowed" : "pointer",
            marginBottom: "24px",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            transition: "all 0.3s ease",
            transform: filterLoading ? "none" : "translateY(0)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
          onMouseEnter={(e) => {
            if (!filterLoading) {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!filterLoading) {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
            }
          }}
        >
          {filterLoading ? "⏳ Loading…" : "🔍 Apply Filters"}
        </button>

        <div className="card" style={{ 
          padding: "16px 24px",
          background: "linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)",
          borderRadius: "12px",
          marginBottom: "24px",
          border: "1px solid #81d4fa",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{ fontSize: "24px" }}>📊</span>
          <div>
            <div style={{ 
              fontWeight: "600", 
              fontSize: "16px", 
              color: "#0277bd",
              marginBottom: "4px"
            }}>
              Dataset Statistics
            </div>
            <div style={{ 
              fontSize: "14px", 
              color: "#0288d1" 
            }}>
              📦 Unique Segmentations: {uniqueSegs.toLocaleString()}
            </div>
          </div>
        </div>

        {error && (
          <div className="card" style={{ 
            padding: "16px 24px",
            background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid #ef5350",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#c62828"
          }}>
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div>
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>Error</div>
              <div style={{ fontSize: "14px" }}>{error}</div>
            </div>
          </div>
        )}

        {!loading && volumeData.length > 0 && (
          <div className="card" style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
            marginBottom: "24px"
          }}>
            <Plot
              data={createBoxplotData()}
              layout={layout}
              config={{ responsive:true, displayModeBar:true }}
              style={{ width:"100%", height:550, cursor:"pointer" }}
              onClick={handleClick}
            />
            {patientInfo && (
  <div className="hover-panel" style={{
    background: palette.statOrangeLight,
    border: `1px solid ${palette.statOrange}`,
    borderRadius: "12px",
    padding: "16px 20px",
    marginTop: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    color: palette.textMain,
    fontSize: "15px",
    maxWidth: "320px"
  }}>
    <strong style={{ fontSize: "17px", color: "#4f46e5" }}>Patient Details</strong><br/>
    <span>Age: <b>{patientInfo.age ?? "N/A"}</b></span><br/>
    <span>Gender: <b>{patientInfo.gender ?? patientInfo.Gender ?? "N/A"}</b></span><br/>
    <span>Race: <b>{patientInfo.race ?? patientInfo.Race ?? "N/A"}</b></span><br/>
    <span>Stage: <b>{patientInfo.stage ?? patientInfo.Stage ?? "N/A"}</b></span><br/>
    <span>Volume: <b>{patientInfo.volume != null ? patientInfo.volume.toLocaleString() : (patientInfo.Volume != null ? patientInfo.Volume.toLocaleString() : "N/A")} mm³</b></span>
  </div>
            )}
          </div>
          
        )}

        {!loading && volumeData.length === 0 && !error && (
          <div className="card" style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            borderRadius: "16px",
            padding: "48px 24px",
            textAlign: "center",
            border: "2px dashed #cbd5e1",
            marginBottom: "24px"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
            <div style={{ 
              fontSize: "18px", 
              color: "#64748b", 
              fontWeight: "500",
              marginBottom: "8px"
            }}>
              No data available
            </div>
            <div style={{ 
              fontSize: "14px", 
              color: "#94a3b8" 
            }}>
              Try adjusting your filter criteria to see results
            </div>
          </div>
        )}
      </div>

      {/* Embedded IDC viewer */}
      <EmbeddedViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
    </div>
  );
}