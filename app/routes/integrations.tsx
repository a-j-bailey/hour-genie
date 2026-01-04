import type { Route } from "./+types/integrations";
import { Link, Outlet, useLocation } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import {
  CheckCircle2,
  Code,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Integrations - Hour Genie" },
    { name: "description", content: "Connect your business with third-party services" },
  ];
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon?: React.ElementType;
  logo?: string;
  status: "OFFICIAL" | "BETA" | "ALPHA" | "INSTALLED" | "COMING_SOON";
  category: "website" | "platform";
}

const integrations: Integration[] = [
  // Websites
  {
    id: "iframe",
    name: "iframe",
    description: "Embed business hours widget on any website using an iframe",
    icon: Code,
    status: "OFFICIAL",
    category: "website",
  },
  {
    id: "wix",
    name: "Wix",
    description: "Sync operating hours with your Wix website",
    logo: "/imgs/logos/wix.png",
    status: "COMING_SOON",
    category: "website",
  },
  {
    id: "framer",
    name: "Framer",
    description: "Display business hours on your Framer website",
    logo: "/imgs/logos/framer.png",
    status: "COMING_SOON",
    category: "website",
  },
  {
    id: "squarespace",
    name: "Squarespace",
    description: "Display business hours on your Squarespace website",
    logo: "/imgs/logos/squarespace.png",
    status: "COMING_SOON",
    category: "website",
  },
  {
    id: "wordpress",
    name: "WordPress",
    description: "Display business hours on your WordPress site",
    logo: "/imgs/logos/wordpress.png",
    status: "COMING_SOON",
    category: "website",
  },
  {
    id: "webflow",
    name: "Webflow",
    description: "Integrate business hours into your Webflow site",
    logo: "/imgs/logos/webflow.png",
    status: "COMING_SOON",
    category: "website",
  },
  // Platforms
  {
    id: "apple-maps",
    name: "Apple Maps",
    description: "Display business hours on Apple Maps",
    logo: "/imgs/logos/apple_maps.png",
    status: "COMING_SOON",
    category: "platform",
  },
  {
    id: "google-maps",
    name: "Google Maps",
    description: "Display business hours on Google Maps",
    logo: "/imgs/logos/google_maps.svg",
    status: "COMING_SOON",
    category: "platform",
  },
  {
    id: "yelp",
    name: "Yelp",
    description: "Display business hours on Yelp",
    logo: "/imgs/logos/yelp.png",
    status: "COMING_SOON",
    category: "platform",
  },
];

function IntegrationCard({ integration }: { integration: Integration }) {
  const Icon = integration.icon;
  const isInstalled = integration.status === "INSTALLED";
  const isComingSoon = integration.status === "COMING_SOON";
  const isClickable = !isComingSoon;

  const cardContent = (
    <Card
      className={`group transition-shadow ${
        isClickable
          ? "hover:shadow-lg cursor-pointer"
          : "cursor-not-allowed opacity-75"
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            {integration.logo ? (
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage
                  src={integration.logo}
                  alt={`${integration.name} logo`}
                  className="object-contain"
                />
                <AvatarFallback className="rounded-lg">
                  {integration.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : Icon ? (
              <Icon className="h-6 w-6 text-primary" />
            ) : null}
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
            </div>
          </div>
          {isInstalled && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
        </div>
        <CardDescription className="text-sm">{integration.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge
            variant={
              integration.status === "OFFICIAL" || integration.status === "INSTALLED"
                ? "default"
                : integration.status === "BETA"
                ? "secondary"
                : integration.status === "COMING_SOON"
                ? "secondary"
                : "outline"
            }
            className="text-xs"
          >
            {integration.status === "INSTALLED"
              ? "INSTALLED"
              : integration.status === "COMING_SOON"
              ? "COMING SOON"
              : integration.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  if (isClickable) {
    return (
      <Link to={`/integrations/${integration.id}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default function Integrations() {
  const location = useLocation();
  const isDetailPage = location.pathname !== "/integrations";
  const websites = integrations.filter((i) => i.category === "website");
  const platforms = integrations.filter((i) => i.category === "platform");

  return (
    <>
      {!isDetailPage && (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Integrations</h1>
            <p className="text-muted-foreground">
              Connect your business with third-party services and platforms
            </p>
          </div>

          {/* Websites Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Websites</h2>
              <p className="text-sm text-muted-foreground">
                Integrate with popular website platforms and services
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {websites.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>

          {/* Platforms Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Platforms</h2>
              <p className="text-sm text-muted-foreground">
                Connect with cloud platforms and infrastructure services
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platforms.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>
        </div>
      )}
      <Outlet />
    </>
  );
}


