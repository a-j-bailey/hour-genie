import { useParams, Link } from "react-router";
import type { Route } from "./+types/integrations.$id";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { ArrowLeft, Code } from "lucide-react";
import { IframeConfig } from "~/components/integrations/iframe-config";

// This should match the integrations list from integrations.tsx
const integrations: Record<
  string,
  {
    id: string;
    name: string;
    description: string;
    icon?: React.ElementType;
    logo?: string;
    status: "OFFICIAL" | "BETA" | "ALPHA" | "INSTALLED" | "COMING_SOON";
    category: "website" | "platform";
  }
> = {
  iframe: {
    id: "iframe",
    name: "iframe",
    description: "Embed business hours widget on any website using an iframe",
    icon: Code,
    status: "OFFICIAL",
    category: "website",
  },
  wix: {
    id: "wix",
    name: "Wix",
    description: "Sync operating hours with your Wix website",
    logo: "/imgs/logos/wix.png",
    status: "COMING_SOON",
    category: "website",
  },
  framer: {
    id: "framer",
    name: "Framer",
    description: "Display business hours on your Framer website",
    logo: "/imgs/logos/framer.png",
    status: "COMING_SOON",
    category: "website",
  },
  squarespace: {
    id: "squarespace",
    name: "Squarespace",
    description: "Display business hours on your Squarespace website",
    logo: "/imgs/logos/squarespace.png",
    status: "COMING_SOON",
    category: "website",
  },
  wordpress: {
    id: "wordpress",
    name: "WordPress",
    description: "Display business hours on your WordPress site",
    logo: "/imgs/logos/wordpress.png",
    status: "COMING_SOON",
    category: "website",
  },
  webflow: {
    id: "webflow",
    name: "Webflow",
    description: "Integrate business hours into your Webflow site",
    logo: "/imgs/logos/webflow.png",
    status: "COMING_SOON",
    category: "website",
  },
  "apple-maps": {
    id: "apple-maps",
    name: "Apple Maps",
    description: "Display business hours on Apple Maps",
    logo: "/imgs/logos/apple_maps.png",
    status: "COMING_SOON",
    category: "platform",
  },
  "google-maps": {
    id: "google-maps",
    name: "Google Maps",
    description: "Display business hours on Google Maps",
    logo: "/imgs/logos/google_maps.svg",
    status: "COMING_SOON",
    category: "platform",
  },
  yelp: {
    id: "yelp",
    name: "Yelp",
    description: "Display business hours on Yelp",
    logo: "/imgs/logos/yelp.png",
    status: "COMING_SOON",
    category: "platform",
  },
};

export function meta({ params }: Route.MetaArgs) {
  const integration = integrations[params.id || ""];
  return [
    { title: integration ? `${integration.name} - Integrations - Hour Genie` : "Integration - Hour Genie" },
    {
      name: "description",
      content: integration?.description || "Integration details",
    },
  ];
}

export default function IntegrationDetail() {
  const params = useParams();
  const integration = params.id ? integrations[params.id] : null;

  if (!integration) {
    return (
      <div className="space-y-6">
        <div>
          <Link to="/integrations">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Integrations
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Integration Not Found</h1>
          <p className="text-muted-foreground">
            The integration you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const Icon = integration.icon;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-4 mb-4">
          {integration.logo ? (
            <Avatar className="h-16 w-16 rounded-lg">
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
            <div className="p-4 rounded-lg bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          ) : null}
          <div>
            <h1 className="text-3xl font-bold">{integration.name}</h1>
            <p className="text-muted-foreground mt-1">{integration.description}</p>
          </div>
        </div>
      </div>

      {integration.id === "iframe" ? (
        <IframeConfig />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Integration Details</CardTitle>
            <CardDescription>
              Configure and manage your {integration.name} integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Integration setup and configuration will be available here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

