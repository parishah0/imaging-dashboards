// patient-dashboard-new/frontend/src/components/DemographicDashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Use the production backend URL from Vercel env, fallback to local dev
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000")
  .trim()
  .replace(/\/$/, "");

export default function DemographicDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    gender_description: [],
    race_description: [],
    stage_description: [],
    cigsmok_description: [],
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  // 1) Fetch data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/api/patient-data`)
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then((data) => { if (!cancelled) setRows(data); })
      .catch((e) => { if (!cancelled) { setError(e.message); setRows([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // 2) Filtering
  const matches = useCallback(
    (row) =>
      Object.entries(appliedFilters).every(
        ([k, vals]) => vals.length === 0 || vals.includes(row[k] || "")
      ),
    [appliedFilters]
  );
  const filteredRows = useMemo(() => rows.filter(matches), [rows, matches]);

  // 3) Helpers
  const counts = (src, key) =>
    src.reduce((acc, cur) => {
      const v = cur[key] || "Unknown";
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
  const unique = (key) =>
    [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort();

  // 4) Pie data
  const genderCounts = counts(filteredRows, "gender_description");
  const smokingCounts = counts(filteredRows, "cigsmok_description");

  const genderData = {
    labels: Object.keys(genderCounts),
    datasets: [
      {
        data: Object.values(genderCounts),
        backgroundColor: ["rgba(255,185,128,0.6)", "rgba(245,124,0,0.8)"],
        borderWidth: 0,
      },
    ],
  };
  const smokingData = {
    labels: Object.keys(smokingCounts),
    datasets: [
      {
        data: Object.values(smokingCounts),
        backgroundColor: ["rgba(255,185,128,0.6)", "rgba(245,124,0,0.8)"],
        borderWidth: 0,
      },
    ],
  };

  // 5) Bar chart configs
  const barConfigs = useMemo(() => {
    const makeBar = (key, label) => {
      const d = counts(filteredRows, key);
      return {
        key,
        label,
        data: {
          labels: Object.keys(d),
          datasets: [
            {
              label,
              data: Object.values(d),
              backgroundColor: "rgba(54,162,235,0.6)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: label }, ticks: { color: "#94a3b8" } },
            y: {
              title: { display: true, text: "Count" },
              beginAtZero: true,
              ticks: { color: "#94a3b8", maxTicksLimit: 6 },
              grid: { color: "rgba(0,0,0,0.06)" },
            },
          },
        },
      };
    };
    return [
      makeBar("stage_description", "Clinical Stage"),
      makeBar("race_description", "Race"),
    ];
  }, [filteredRows]);

  // 6) Filter handlers
  const toggle = (key, val, checked) =>
    setFilters((f) => ({
      ...f,
      [key]: checked ? [...f[key], val] : f[key].filter((x) => x !== val),
    }));
  const applyFilters = () => {
    setFilterLoading(true);
    setAppliedFilters(filters);
    setFilterLoading(false);
  };

  return (
    <div className="demo-dashboard-full">
      {/* ───── Header Card ───── */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "24px",
          padding: "32px",
          background: "rgba(255, 255, 255, 0.9)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: "0 0 16px 0",
            letterSpacing: "-0.02em",
          }}
        >
          <i className="ri-hotel-bed-line icon-lg" /> Demographic Distribution
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#64748b",
            margin: 0,
            fontWeight: "400",
          }}
        >
          Insights from <code>clinical_data_mapping</code>
        </p>
      </div>

      {/* ───── Body Card ───── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "2rem",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Filters */}
        <div className="filter-grid" style={{ marginBottom: "2rem" }}>
          {[
            ["gender_description", "Gender", "ri-user-line"],
            ["race_description", "Race", "ri-earth-line"],
            ["stage_description", "Clinical Stage", "ri-hospital-line"],
            ["cigsmok_description", "Smoking Status", "ri-smoking-line"],
          ].map(([k, label, icon]) => (
            <div key={k} className="white-card">
              <h4
                style={{
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className={`${icon} text-primary`} /> {label}
              </h4>
              {unique(k).map((val) => (
                <label
                  key={val}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters[k].includes(val)}
                    onChange={(e) => toggle(k, val, e.target.checked)}
                    style={{ accentColor: "var(--primary)", transform: "scale(1.1)" }}
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          ))}
        </div>

        <button
          className={`btn-main ${filterLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          onClick={applyFilters}
          disabled={filterLoading}
          style={{ marginBottom: "2rem" }}
        >
          {filterLoading ? "Loading…" : "Apply Filters"}
        </button>

        {/* Status */}
        {loading && <p>Fetching data…</p>}
        {error && <div className="banner error">{error}</div>}
        {!loading && !error && filteredRows.length === 0 && (
          <p style={{ color: "#64748b" }}>No data returned for these filters.</p>
        )}

        {/* Pie Charts */}
        {!loading && filteredRows.length > 0 && (
          <div className="pie-charts">
            <div className="white-card chart-card">
              <h4>Gender</h4>
              <Doughnut
                data={genderData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: { legend: { position: "bottom" } },
                }}
              />
            </div>
            <div className="white-card chart-card">
              <h4>Smoking Status</h4>
              <Doughnut
                data={smokingData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: { legend: { position: "bottom" } },
                }}
              />
            </div>
          </div>
        )}

        {/* Bar Charts */}
        {!loading && filteredRows.length > 0 && (
          <div className="bar-charts">
            {barConfigs.map((cfg) => (
              <div key={cfg.key} className="white-card chart-card">
                <h4>{cfg.label}</h4>
                <Bar data={cfg.data} options={cfg.options} />
              </div>
            ))}
          </div>
        )}

        {/* Patient ID list with dropdown */}
        {!loading && filteredRows.length > 0 && (
          <div className="white-card" style={{ marginTop: "2rem" }}>
            <h4>Patient IDs ({filteredRows.length})</h4>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {filteredRows.map((row, i) => (
                  <li key={i} style={{ marginBottom: "0.5rem" }}>
                    <details>
                      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                        {row.patient_id}
                      </summary>
                      <div style={{ paddingLeft: "1rem", marginTop: "0.25rem" }}>
                        <p>Age: <b>{row.age ?? "N/A"}</b></p>
                        <p>Gender: <b>{row.gender_description ?? "N/A"}</b></p>
                        <p>Race: <b>{row.race_description ?? "N/A"}</b></p>
                        <p>Stage: <b>{row.stage_description ?? "N/A"}</b></p>
                        <p>Smoking: <b>{row.cigsmok_description ?? "N/A"}</b></p>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
