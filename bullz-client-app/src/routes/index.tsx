import { createBrowserRouter } from "react-router-dom";
import Home from "./home";
import LoginPage from "./login";
import RootProvider from "@/components/providers/root-provider";
import SessionPage from "./session";
import LiveSessions from "./live";
import LiveSessionPage from "./live/[session_id]/page";
import SquadPage from "./squad";
import NewSquadPage from "./squad/new/page";

export const router = createBrowserRouter([
  {
    Component: RootProvider,
    children: [
      { index: true, Component: Home },
      {
        path: "login",
        Component: LoginPage,
      },
      { path: "session", Component: SessionPage },
      {
        path: "live",
        children: [
          {
            index: true,
            Component: LiveSessions,
          },
          {
            path: ":session_id",
            Component: LiveSessionPage,
          },
        ],
      },
      {
        path: "squad",
        children: [
          { index: true, Component: SquadPage },
          { path: "new", Component: NewSquadPage },
        ],
      },
    ],
  },
]);
