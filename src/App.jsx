import { Routes, Route, Link } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout.jsx";

import TrainerView from "./pages/TrainerView.jsx";
import AudienceView from "./pages/AudienceView.jsx";
import LiveRoomView from "./pages/LiveRoomView.jsx";
import ReflectionView from "./pages/ReflectionView.jsx";
import DebugTools from "./pages/DebugTools.jsx";

export default function App() {
  return (
    <AppLayout>

      {/* DEVELOPMENT NAVIGATION (optional, remove later) */}
      <nav className="dev-nav">
        <Link to="/">Trainer</Link>
        <Link to="/audience">Audience</Link>
        <Link to="/live">Live Room</Link>
        <Link to="/reflection">Reflection</Link>
        <Link to="/debug">Debug</Link>
      </nav>

      <Routes>
        <Route path="/" element={<TrainerView />} />
        <Route path="/audience" element={<AudienceView />} />
        <Route path="/live" element={<LiveRoomView />} />
        <Route path="/reflection" element={<ReflectionView />} />
        <Route path="/debug" element={<DebugTools />} />
      </Routes>

    </AppLayout>
  );
}
