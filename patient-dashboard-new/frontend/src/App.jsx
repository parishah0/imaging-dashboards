App.jsx// src/App.jsx
import React, {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import VolumeBoxplotDashboard from "./components/VolumeBoxplotDashboard";
const DemographicDashboard = React.lazy(() =>
  import("./components/DemographicDashboard")
);
import Loader from "./components/Loader";

/* ────────────────── simple page wrapper for motion ────────────────── */
function Page({ children }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
style={{ padding: "0", width: "100%" }}    >
      {children}
    </motion.div>
  );
}

/* ────────────────── shell with nav + loaders ────────────────── */
function Shell() {
  const location = useLocation();
  const [splash, setSplash] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);

  /* splash once on first mount */
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);

  /* brief loader on every navigation */
  useEffect(() => {
    setRouteLoading(true);
    const t = setTimeout(() => setRouteLoading(false), 600);
    return () => clearTimeout(t);
  }, [location]);

  if (splash) return <Loader />;

  return (
    <>
      {routeLoading && <Loader />}

      {/* nav bar */}
      <nav className="navbar">
        <span style={{ color: "var(--primary-2)", fontWeight: 600 }}>
          <i className="ri-hospital-line icon" />
          Imaging Analytics
        </span>
        <NavLink
          to="/volume"
          className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
        >
          Volume Distribution
        </NavLink>
        <NavLink
          to="/demographics"
          className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
        >
          Demographic Distribution
        </NavLink>
      </nav>

      {/* push routed pages below the fixed navbar */}
      <div className="dashboard-container">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/volume"
              element={
                <Page>
                  <VolumeBoxplotDashboard />
                </Page>
              }
            />
            <Route
              path="/demographics"
              element={
                <Page>
                  <Suspense fallback={<Loader />}>
                    <DemographicDashboard />
                  </Suspense>
                </Page>
              }
            />
            <Route path="*" element={<Navigate to="/volume" />} />
          </Routes>
        </AnimatePresence>
      </div>
    </>
  );
}

/* ────────────────── root component ────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
