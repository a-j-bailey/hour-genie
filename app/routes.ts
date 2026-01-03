import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  layout("routes/_layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("account", "routes/account.tsx"),
    route("integrations", "routes/integrations.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
