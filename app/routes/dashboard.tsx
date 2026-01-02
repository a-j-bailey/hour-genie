import { useState, useEffect } from "react";
import type { Route } from "./+types/dashboard";
import { ProtectedRoute } from "~/components/protected-route";
import { Nav } from "~/components/nav";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAuth } from "~/lib/use-auth";
import { useSidebar } from "~/lib/sidebar-context";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - Hour Genie" },
    { name: "description", content: "Manage your business operating hours" },
  ];
}

interface OperatingHours {
  id?: string;
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

const DAYS_OF_WEEK = [
  { value: 0, name: "Sunday" },
  { value: 1, name: "Monday" },
  { value: 2, name: "Tuesday" },
  { value: 3, name: "Wednesday" },
  { value: 4, name: "Thursday" },
  { value: 5, name: "Friday" },
  { value: 6, name: "Saturday" },
];

function DashboardContent() {
  const { user, session } = useAuth();
  const { isCollapsed, isMobile } = useSidebar();
  const [hours, setHours] = useState<OperatingHours[]>(
    DAYS_OF_WEEK.map((day) => ({
      day_of_week: day.value,
      day_name: day.name,
      is_open: day.value !== 0 && day.value !== 6, // Default: closed on weekends
      open_time: "09:00",
      close_time: "17:00",
    }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/operating-hours`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // Merge fetched hours with default structure
          const fetchedHoursMap = new Map(
            data.map((h: OperatingHours) => [h.day_of_week, h])
          );
          const updatedHours: OperatingHours[] = DAYS_OF_WEEK.map((day) => {
            const fetched = fetchedHoursMap.get(day.value) as OperatingHours | undefined;
            if (fetched) {
              return {
                id: fetched.id,
                day_of_week: fetched.day_of_week,
                day_name: day.name,
                is_open: fetched.is_open,
                open_time: fetched.open_time,
                close_time: fetched.close_time,
              };
            }
            return {
              day_of_week: day.value,
              day_name: day.name,
              is_open: false,
              open_time: "09:00",
              close_time: "17:00",
            };
          });
          setHours(updatedHours);
        }
      }
    } catch (err) {
      console.error("Error fetching hours:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session?.access_token) {
      setError("Not authenticated");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${apiUrl}/api/operating-hours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ hours }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save operating hours");
      }
    } catch (err) {
      setError("Failed to save operating hours. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (dayIndex: number, updates: Partial<OperatingHours>) => {
    setHours((prev) =>
      prev.map((day) =>
        day.day_of_week === dayIndex ? { ...day, ...updates } : day
      )
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex">
          <Nav />
          <div
            className={cn(
              "flex-1 flex items-center justify-center transition-all duration-300",
              isMobile ? "ml-0 pt-20" : "",
              !isMobile && (isCollapsed ? "ml-16" : "ml-64")
            )}
          >
            <div>Loading...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">
        <Nav />
        <main
          className={cn(
            "flex-1 container mx-auto px-4 max-w-4xl transition-all duration-300",
            isMobile ? "ml-0 pt-20" : "py-8",
            !isMobile && (isCollapsed ? "ml-16" : "ml-64")
          )}
        >
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Operating Hours</h1>
              <p className="text-muted-foreground">
                Set your business hours for each day of the week
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-md">
                Operating hours saved successfully!
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  Configure your operating hours for each day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {hours.map((day) => (
                  <div
                    key={day.day_of_week}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-24 font-medium">{day.day_name}</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`day-${day.day_of_week}`}
                        checked={day.is_open}
                        onChange={(e) =>
                          updateDay(day.day_of_week, { is_open: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`day-${day.day_of_week}`}>Open</Label>
                    </div>
                    {day.is_open && (
                      <>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`open-${day.day_of_week}`}>Open:</Label>
                          <Input
                            id={`open-${day.day_of_week}`}
                            type="time"
                            value={day.open_time}
                            onChange={(e) =>
                              updateDay(day.day_of_week, { open_time: e.target.value })
                            }
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`close-${day.day_of_week}`}>Close:</Label>
                          <Input
                            id={`close-${day.day_of_week}`}
                            type="time"
                            value={day.close_time}
                            onChange={(e) =>
                              updateDay(day.day_of_week, { close_time: e.target.value })
                            }
                            className="w-32"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? "Saving..." : "Save Operating Hours"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}

