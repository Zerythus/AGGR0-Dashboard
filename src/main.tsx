import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SettingsCallback from "./pages/SettingsCallback";

import AppLayout from "./layout/AppLayout";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";

import Home from "./pages/Home";
import CreateAccount from "./pages/CreateAccount";

import Dashboard from "./pages/Dashboard"; // This is displayed when the users first created an account/first use the app
import Settings from "./pages/Settings";

import DashboardFill from "./pages/DashboardFill"; //FOR SHOW ONLY TO FILL IN THE DASHBOARD WITH COMPONENTS

import "./index.css";



ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <BrowserRouter>
        <Routes>
          <Route>
            <Route path="" element={<Home />} />
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/settings-callback" element={<SettingsCallback />} />
          </Route>

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboardFill" element={<DashboardFill />} /> {/* TEST ONLY - DELETE LATER */}
        </Route>
      </Routes>
    </BrowserRouter>
    </AccessibilityProvider>
  </React.StrictMode>
);