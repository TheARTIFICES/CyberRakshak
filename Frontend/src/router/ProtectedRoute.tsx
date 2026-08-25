import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Client-side route guard. Redirects to /login when no bearer token is
 * stored. This is the P1 "minimum viable" login workflow per
 * FRONTEND_ROADMAP.md §5 — role-based content gating is explicitly P2/P3.
 *
 * Not a security boundary by itself: backend/app/config.py::AUTH_DISABLED
 * is still True (Phase 1's auth-default-flip, not touched this session), so
 * the API accepts unauthenticated requests regardless of this guard. This
 * component only gives the frontend a real, honest login/redirect UX ahead
 * of that backend flip landing.
 */
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
