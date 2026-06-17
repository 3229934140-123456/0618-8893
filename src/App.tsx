import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Members from "@/pages/Members";
import Activities from "@/pages/Activities";
import Warehouse from "@/pages/Warehouse";
import Contribution from "@/pages/Contribution";
import Announcements from "@/pages/Announcements";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/contribution" element={<Contribution />} />
          <Route path="/announcements" element={<Announcements />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
