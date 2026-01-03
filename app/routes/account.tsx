import { useNavigate } from "react-router";
import type { Route } from "./+types/account";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useAuth } from "~/lib/use-auth";
import { useBusiness } from "~/lib/business-context";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Clock,
  Calendar,
  Plus,
  ArrowRight,
  Circle,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Account Dashboard - Hour Genie" },
    { name: "description", content: "Overview of all your businesses" },
  ];
}

function getBusinessInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function countOpenDays(hours: any[]): number {
  if (!Array.isArray(hours)) return 0;
  return hours.filter((day) => day.is_open).length;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isBusinessCurrentlyOpen(hours: any[]): boolean {
  if (!Array.isArray(hours) || hours.length === 0) return false;

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

  const todayHours = hours.find((day) => day.day_of_week === currentDay);
  
  if (!todayHours || !todayHours.is_open) {
    return false;
  }

  // If open 24/7, always open
  if (todayHours.is_open_24_7) {
    return true;
  }

  // If no times specified, consider it open if is_open is true
  if (!todayHours.open_time || !todayHours.close_time) {
    return todayHours.is_open;
  }

  // Parse time strings (HH:MM format)
  const [openHour, openMin] = todayHours.open_time.split(":").map(Number);
  const [closeHour, closeMin] = todayHours.close_time.split(":").map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // Handle case where close time is next day (e.g., 22:00 - 02:00)
  if (closeTime < openTime) {
    // Business closes after midnight
    return currentTime >= openTime || currentTime <= closeTime;
  } else {
    // Normal case: open and close on same day
    return currentTime >= openTime && currentTime <= closeTime;
  }
}

export default function Account() {
  const { user } = useAuth();
  const { businesses, loading, setSelectedBusinessId } = useBusiness();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleSelectBusiness = (businessId: string) => {
    setSelectedBusinessId(businessId);
    navigate("/dashboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all your businesses and their information
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard", { state: { openCreateBusiness: true } })}>
          <Plus className="h-4 w-4 mr-2" />
          Create Business
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businesses.length}</div>
            <p className="text-xs text-muted-foreground">
              {businesses.length === 1 ? "business" : "businesses"} managed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {businesses.filter((b) => countOpenDays(b.default_hours) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">with configured hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Account</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">{user?.email || "N/A"}</div>
            <p className="text-xs text-muted-foreground">logged in</p>
          </CardContent>
        </Card>
      </div>

      {/* Businesses List */}
      {businesses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No businesses yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first business
            </p>
            <Button onClick={() => navigate("/dashboard", { state: { openCreateBusiness: true } })}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Business
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => {
            const openDays = countOpenDays(business.default_hours);
            const hasContactInfo = business.email || business.phone || business.address;
            const isOpen = isBusinessCurrentlyOpen(business.default_hours);

            return (
              <Card key={business.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {getBusinessInitials(business.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{business.name}</CardTitle>
                      <div className="mt-1">
                        <Badge
                          variant={isOpen ? "default" : "secondary"}
                          className={`flex items-center gap-1.5 w-fit ${
                            isOpen
                              ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                              : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
                          }`}
                        >
                          <Circle
                            className={`h-2 w-2 fill-current ${
                              isOpen ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                            }`}
                          />
                          {isOpen ? "Currently Open" : "Currently Closed"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contact Information */}
                  {hasContactInfo && (
                    <div className="space-y-2 text-sm">
                      {business.address && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{business.address}</span>
                        </div>
                      )}
                      {business.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{business.email}</span>
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{business.phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hours Summary */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {openDays} {openDays === 1 ? "day" : "days"} open per week
                    </span>
                  </div>

                  {/* Created Date */}
                  {business.created_at && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(business.created_at)}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSelectBusiness(business.id)}
                    >
                      Manage Hours
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
