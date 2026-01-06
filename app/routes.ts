import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("embed/hours", "routes/embed.hours.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  layout("routes/_layout.tsx", [
    route("hours", "routes/hour_management.tsx"),
    route("account", "routes/account.tsx"),
    route("billing", "routes/billing.tsx"),
    route("integrations", "routes/integrations.tsx", [
      route(":id", "routes/integrations.$id.tsx"),
    ]),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
