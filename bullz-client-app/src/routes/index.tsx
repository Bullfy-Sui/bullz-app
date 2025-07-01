import { createBrowserRouter } from "react-router-dom";
import Home from "./home";
import LoginPage from "./login";
import RootProvider from "@/components/providers/root-provider";
import SessionPage from "./session";
import LiveSessions from "./live";
import LiveSessionPage from "./live/[session_id]/page";
import SquadPage from "./squad";
import NewSquadPage from "./squad/new/page";
import ProtectedRoute from "@/components/ui/hoc/protected-route";
import RedirectToLogin from "@/components/ui/hoc/redirect-to-login";

export const router = createBrowserRouter([
  {
    Component: RootProvider,
    children: [
      { 
        index: true, 
        Component: RedirectToLogin 
      },
      {
        path: "login",
        Component: LoginPage,
      },
      { 
        path: "home",
        Component: () => (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        )
      },
      { 
        path: "session", 
        Component: () => (
          <ProtectedRoute>
            <SessionPage />
          </ProtectedRoute>
        )
      },
      {
        path: "live",
        children: [
          {
            index: true,
            Component: () => (
              <ProtectedRoute>
                <LiveSessions />
              </ProtectedRoute>
            ),
          },
          {
            path: ":session_id",
            Component: () => (
              <ProtectedRoute>
                <LiveSessionPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "squad",
        children: [
          { 
            index: true, 
            Component: () => (
              <ProtectedRoute>
                <SquadPage />
              </ProtectedRoute>
            )
          },
          { 
            path: "new", 
            Component: () => (
              <ProtectedRoute>
                <NewSquadPage />
              </ProtectedRoute>
            )
          },
        ],
      },
    ],
  },
]);
