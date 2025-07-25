// src/components/DemographicDashboard.jsx
import React, {
  useCallback, useEffect, useMemo, useState
} from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function DemographicDashboard() {
  /* ────────── state ────────── */
  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError]           = useState("");

  const [filters, setFilters] = useState({
    gender_description:  [],
    race_description:    [],
    stage_description:   [],
    cigsmok_description: [],
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  /* ────────── fetch once ────────── */
  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/patient-data`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      setRows(await res.json());
    } catch (e) {
      console.error(e);
      setRows([]);
      setError(e.message || "Fetch error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  /* ────────── client‑side filtering ────────── */
  const matches = useCallback(
    row => Object.entries(appliedFilters).every(
      ([k, vals]) => vals.length === 0 || vals.includes(row[k] || "")
    ),
    [appliedFilters]
  );

  const filteredRows = useMemo(
    () => rows.filter(matches),
    [rows, matches]
  );

  /* ────────── helpers ────────── */
  const unique = k =>
    [...new Set(rows.map(r => r[k]).filter(Boolean))].sort();

  const counts = (src, k) =>
    src.reduce((acc, cur) => {
      const v = cur[k] || "Unknown";
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});

  const barData = (src, key, label) => {
    const data = counts(src, key);
    return {
      labels: Object.keys(data),
      datasets: [
        {
          label,
          data: Object.values(data),
          backgroundColor: "rgba(54,162,235,.6)",
        },
      ],
    };
  };

  /* chart‑by‑chart data + options */
  const chartConfigs = useMemo(() => (
    [
      ["stage_description",  "Clinical Stage"],
      ["gender_description", "Gender"],
      ["race_description",   "Race"],
      ["cigsmok_description","Smoking Status"],
    ].map(([key, label]) => ({
      key,
      label,
      data: barData(filteredRows, key, label),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            title: { display: true, text: label },
            ticks: { color: "#94a3b8" },
          },
          y: {
            title: { display: true, text: "Population" },
            beginAtZero: true,
            ticks: { stepSize: 1, color: "#94a3b8" },
            grid: { color: "rgba(0,0,0,.06)" },
          },
        },
      },
    }))
  ), [filteredRows]);

  /* ────────── filter UI ────────── */
  const toggle = (k, v, checked) =>
    setFilters(f => ({
      ...f,
      [k]: checked ? [...f[k], v] : f[k].filter(x => x !== v),
    }));

  const applyFilters = () => {
    setFilterLoading(true);
    setAppliedFilters(filters);
    // no network call, so clear spinner immediately
    setFilterLoading(false);
  };

  /* ────────── render ────────── */
  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "2rem" }}>
      <div className="panel">
        {/* hero */}
        <div className="hero">
          <h1><i className="ri-hotel-bed-line icon-lg" /> Demographic Distribution</h1>
          <p>Insights from <code>clinical_data_mapping</code></p>
        </div>

        {/* filters */}
        <div className="filter-grid" style={{ marginBottom: "2rem" }}>
          {[
            ["gender_description", "Gender", "ri-user-line"],
            ["race_description", "Race", "ri-earth-line"],
            ["stage_description", "Clinical Stage", "ri-hospital-line"],
            ["cigsmok_description", "Smoking Status", "ri-smoking-line"],
          ].map(([key, label, icon]) => (
            <div key={key} className="white-card">
              <h4 style={{ margin: "0 0 1rem", display: "flex", alignItems: "center", gap: 6 }}>
                <i className={`${icon} text-primary`} /> {label}
              </h4>
              {unique(key).map(v => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 6,
                                         marginBottom: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={filters[key].includes(v)}
                    onChange={e => toggle(key, v, e.target.checked)}
                    style={{ accentColor: "var(--primary)", scale: "1.1" }}
                  />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          ))}
        </div>

        {/* apply button */}
        <button
          className={`btn-main ${filterLoading && "opacity-60 cursor-not-allowed"}`}
          onClick={applyFilters}
          disabled={filterLoading}
          style={{ marginBottom: "2rem" }}
        >
          {filterLoading ? <><span className="btn-spinner" /> Loading…</> : "Apply Filters"}
        </button>

        {/* messages */}
        {loading && <p>Fetching charts…</p>}
        {error && (
          <div className="banner error">
            <i className="ri-error-warning-line icon-lg" />
            {error}
          </div>
        )}
        {!loading && !error && filteredRows.length === 0 && (
          <p style={{ color: "#64748b" }}>No data returned for these filters.</p>
        )}

        {/* charts */}
        {!loading && filteredRows.length > 0 && (
          <div className="charts">
            {chartConfigs.map(cfg => (
              <div key={cfg.key} className="white-card" style={{ minHeight: 350 }}>
                <Bar data={cfg.data} options={cfg.options} height={340} width={420} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}