import { lazy } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Shell from "./Shell";
const Overview = lazy(() => import("../features/overview/Overview"));
const Events = lazy(() => import("../features/events/Events"));
const Live = lazy(() => import("../features/live/Live"));
const Analytics = lazy(() => import("../features/analytics/Analytics"));
const Alerts = lazy(() => import("../features/alerts/Alerts"));
const Settings = lazy(() => import("../features/settings/Settings"));
const client = new QueryClient();
export default function App() {
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Overview />} />
            <Route path="events" element={<Events />} />
            <Route path="live" element={<Live />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="*"
              element={
                <div className="state">
                  <h1>Page not found</h1>
                  <Link className="button" to="/">
                    Return to overview
                  </Link>
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
