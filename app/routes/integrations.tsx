import type { Route } from "./+types/integrations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Globe,
  Calendar,
  CreditCard,
  Mail,
  MessageSquare,
  ShoppingCart,
  Cloud,
  Database,
  Zap,
  Lock,
  BarChart3,
  Settings,
  CheckCircle2,
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
  icon: React.ElementType;
  status: "OFFICIAL" | "BETA" | "ALPHA" | "INSTALLED";
  category: "website" | "platform";
}

const integrations: Integration[] = [
  // Websites
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync your business hours with Google Calendar events",
    icon: Calendar,
    status: "OFFICIAL",
    category: "website",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Sync payment processing hours and availability",
    icon: CreditCard,
    status: "OFFICIAL",
    category: "website",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Send automated emails based on business hours",
    icon: Mail,
    status: "BETA",
    category: "website",
  },
  {
    id: "intercom",
    name: "Intercom",
    description: "Update chat availability based on operating hours",
    icon: MessageSquare,
    status: "OFFICIAL",
    category: "website",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync store hours with your Shopify storefront",
    icon: ShoppingCart,
    status: "OFFICIAL",
    category: "website",
  },
  {
    id: "wordpress",
    name: "WordPress",
    description: "Display business hours on your WordPress site",
    icon: Globe,
    status: "OFFICIAL",
    category: "website",
  },
  // Platforms
  {
    id: "aws",
    name: "AWS",
    description: "Integrate with AWS services for automated scheduling",
    icon: Cloud,
    status: "OFFICIAL",
    category: "platform",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Store and query business hours data in PostgreSQL",
    icon: Database,
    status: "INSTALLED",
    category: "platform",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect with 5000+ apps through Zapier automation",
    icon: Zap,
    status: "OFFICIAL",
    category: "platform",
  },
  {
    id: "auth0",
    name: "Auth0",
    description: "Secure authentication and user management",
    icon: Lock,
    status: "OFFICIAL",
    category: "platform",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Track and analyze business hours performance",
    icon: BarChart3,
    status: "BETA",
    category: "platform",
  },
  {
    id: "api",
    name: "API Gateway",
    description: "RESTful API for programmatic access to hours data",
    icon: Settings,
    status: "OFFICIAL",
    category: "platform",
  },
];

function IntegrationCard({ integration }: { integration: Integration }) {
  const Icon = integration.icon;
  const isInstalled = integration.status === "INSTALLED";

  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
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
                : "outline"
            }
            className="text-xs"
          >
            {integration.status === "INSTALLED" ? "INSTALLED" : integration.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Integrations() {
  const websites = integrations.filter((i) => i.category === "website");
  const platforms = integrations.filter((i) => i.category === "platform");

  return (
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
  );
}

