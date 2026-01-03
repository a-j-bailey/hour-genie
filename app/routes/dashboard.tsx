import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Route } from "./+types/dashboard";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useAuth } from "~/lib/use-auth";
import { useBusiness } from "~/lib/business-context";
import { formatPhoneNumber } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - Hour Genie" },
    { name: "description", content: "Manage your business operating hours" },
  ];
}

interface DayHours {
  day_of_week: number;
  is_open: boolean;
  is_open_24_7: boolean;
  open_time: string | null;
  close_time: string | null;
}

interface Business {
  id: string;
  user_id?: string;
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  default_hours: DayHours[];
  created_at?: string;
  updated_at?: string;
}

interface HoursOverride {
  id: string;
  business_id: string;
  start_date: string;
  end_date: string;
  day_of_week: number;
  is_open: boolean;
  is_open_24_7: boolean;
  open_time: string | null;
  close_time: string | null;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
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

function createDefaultHoursStructure(): DayHours[] {
  return DAYS_OF_WEEK.map((day) => ({
    day_of_week: day.value,
    is_open: false,
    is_open_24_7: false,
    open_time: null,
    close_time: null,
  }));
}

function DashboardContent() {
  const { user, session } = useAuth();
  const { businesses, selectedBusiness, selectedBusinessId, setSelectedBusinessId, refreshBusinesses, loading: businessLoading } = useBusiness();
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [defaultHours, setDefaultHours] = useState<DayHours[]>(createDefaultHoursStructure());
  const [overrides, setOverrides] = useState<HoursOverride[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [createBusinessDialogOpen, setCreateBusinessDialogOpen] = useState(false);
  const [createOverrideDialogOpen, setCreateOverrideDialogOpen] = useState(false);

  // Check if we should open the create business dialog from location state
  useEffect(() => {
    if (location.state?.openCreateBusiness) {
      setCreateBusinessDialogOpen(true);
      // Clear the state to prevent reopening on re-render
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newBusinessAddress, setNewBusinessAddress] = useState("");
  const [newBusinessEmail, setNewBusinessEmail] = useState("");
  const [newBusinessPhone, setNewBusinessPhone] = useState("");
  const [overrideStartDate, setOverrideStartDate] = useState("");
  const [overrideEndDate, setOverrideEndDate] = useState("");
  const [overrideDays, setOverrideDays] = useState<DayHours[]>(createDefaultHoursStructure());

  useEffect(() => {
    if (selectedBusiness) {
      if (selectedBusiness.default_hours && Array.isArray(selectedBusiness.default_hours)) {
        setDefaultHours(selectedBusiness.default_hours);
      } else {
        setDefaultHours(createDefaultHoursStructure());
      }
      if (selectedBusinessId) {
        fetchOverrides(selectedBusinessId);
      }
    }
  }, [selectedBusiness, selectedBusinessId]);

  const fetchOverrides = async (businessId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${apiUrl}/api/businesses/${businessId}/hours-overrides`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOverrides(data || []);
      }
    } catch (err) {
      console.error("Error fetching overrides:", err);
    }
  };

  const handleCreateBusiness = async () => {
    if (!session?.access_token || !newBusinessName.trim()) {
      setError("Business name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/businesses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: newBusinessName,
          address: newBusinessAddress || null,
          email: newBusinessEmail || null,
          phone: newBusinessPhone || null,
          default_hours: createDefaultHoursStructure(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await refreshBusinesses();
        setSelectedBusinessId(data.id);
        setCreateBusinessDialogOpen(false);
        setNewBusinessName("");
        setNewBusinessAddress("");
        setNewBusinessEmail("");
        setNewBusinessPhone("");
        setSuccess("Business created successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create business");
      }
    } catch (err) {
      setError("Failed to create business. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDefaultHours = async () => {
    if (!session?.access_token || !selectedBusinessId) {
      setError("No business selected");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${apiUrl}/api/businesses/${selectedBusinessId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          default_hours: defaultHours,
        }),
      });

      if (response.ok) {
        await refreshBusinesses();
        setSuccess("Default hours updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update default hours");
      }
    } catch (err) {
      setError("Failed to update default hours. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOverride = async () => {
    if (!session?.access_token || !selectedBusinessId) {
      setError("No business selected");
      return;
    }

    if (!overrideStartDate || !overrideEndDate) {
      setError("Start date and end date are required");
      return;
    }

    // Filter to only days that are configured (is_open = true)
    const daysToSave = overrideDays.filter((day) => day.is_open);

    if (daysToSave.length === 0) {
      setError("At least one day must be configured");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/businesses/${selectedBusinessId}/hours-overrides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          start_date: overrideStartDate,
          end_date: overrideEndDate,
          days: daysToSave,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOverrides([...overrides, ...data]);
        setCreateOverrideDialogOpen(false);
        setOverrideStartDate("");
        setOverrideEndDate("");
        setOverrideDays(createDefaultHoursStructure());
        setSuccess("Hours override created successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create override");
      }
    } catch (err) {
      setError("Failed to create override. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    if (!session?.access_token) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/hours-overrides/${overrideId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setOverrides(overrides.filter((o) => o.id !== overrideId));
        setSuccess("Override deleted successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete override");
      }
    } catch (err) {
      setError("Failed to delete override. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateDefaultDay = (dayIndex: number, updates: Partial<DayHours>) => {
    setDefaultHours((prev) =>
      prev.map((day) => (day.day_of_week === dayIndex ? { ...day, ...updates } : day))
    );
  };

  const updateOverrideDay = (dayIndex: number, updates: Partial<DayHours>) => {
    setOverrideDays((prev) =>
      prev.map((day) => (day.day_of_week === dayIndex ? { ...day, ...updates } : day))
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (businessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
            <Dialog 
              open={createBusinessDialogOpen} 
              onOpenChange={(open) => {
                setCreateBusinessDialogOpen(open);
                if (!open) {
                  // Reset form when dialog closes
                  setNewBusinessName("");
                  setNewBusinessAddress("");
                  setNewBusinessEmail("");
                  setNewBusinessPhone("");
                  setError(null);
                }
              }}
            >
              <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Business</DialogTitle>
                    <DialogDescription>
                      Add a new business to manage operating hours
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="business-name">Business Name *</Label>
                      <Input
                        id="business-name"
                        value={newBusinessName}
                        onChange={(e) => setNewBusinessName(e.target.value)}
                        placeholder="My Business"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-address">Address</Label>
                      <Input
                        id="business-address"
                        value={newBusinessAddress}
                        onChange={(e) => setNewBusinessAddress(e.target.value)}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-email">Email</Label>
                      <Input
                        id="business-email"
                        type="email"
                        value={newBusinessEmail}
                        onChange={(e) => setNewBusinessEmail(e.target.value)}
                        placeholder="business@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-phone">Phone</Label>
                      <Input
                        id="business-phone"
                        type="tel"
                        value={newBusinessPhone}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          setNewBusinessPhone(formatted);
                        }}
                        placeholder="+1 (555) 123-4567"
                        maxLength={17} // +1 (555) 123-4567
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateBusinessDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateBusiness} disabled={saving}>
                      {saving ? "Creating..." : "Create Business"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>
            )}

            {success && (
              <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-md">
                {success}
              </div>
            )}

            {businesses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No businesses yet.</p>
                  <Button onClick={() => setCreateBusinessDialogOpen(true)}>
                    Create Your First Business
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {selectedBusiness && (
                  <>
                    {/* Default Hours */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Default Operating Hours</CardTitle>
                        <CardDescription>
                          Configure default hours for {selectedBusiness.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {defaultHours.map((day) => {
                          const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day.day_of_week);
                          return (
                            <div
                              key={day.day_of_week}
                              className="flex items-center gap-4 p-4 border rounded-lg flex-wrap"
                            >
                              <div className="w-24 font-medium">{dayInfo?.name}</div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`default-open-${day.day_of_week}`}
                                  checked={day.is_open}
                                  onChange={(e) =>
                                    updateDefaultDay(day.day_of_week, {
                                      is_open: e.target.checked,
                                      is_open_24_7: e.target.checked ? day.is_open_24_7 : false,
                                    })
                                  }
                                  className="h-4 w-4"
                                />
                                <Label htmlFor={`default-open-${day.day_of_week}`}>Open</Label>
                              </div>
                              {day.is_open && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`default-24-7-${day.day_of_week}`}
                                      checked={day.is_open_24_7}
                                      onChange={(e) =>
                                        updateDefaultDay(day.day_of_week, {
                                          is_open_24_7: e.target.checked,
                                        })
                                      }
                                      className="h-4 w-4"
                                    />
                                    <Label htmlFor={`default-24-7-${day.day_of_week}`}>24/7</Label>
                                  </div>
                                  {!day.is_open_24_7 && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <Label htmlFor={`default-open-time-${day.day_of_week}`}>
                                          Open:
                                        </Label>
                                        <Input
                                          id={`default-open-time-${day.day_of_week}`}
                                          type="time"
                                          value={day.open_time || ""}
                                          onChange={(e) =>
                                            updateDefaultDay(day.day_of_week, {
                                              open_time: e.target.value || null,
                                            })
                                          }
                                          className="w-32"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label htmlFor={`default-close-time-${day.day_of_week}`}>
                                          Close:
                                        </Label>
                                        <Input
                                          id={`default-close-time-${day.day_of_week}`}
                                          type="time"
                                          value={day.close_time || ""}
                                          onChange={(e) =>
                                            updateDefaultDay(day.day_of_week, {
                                              close_time: e.target.value || null,
                                            })
                                          }
                                          className="w-32"
                                        />
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                      <CardContent>
                        <div className="flex justify-end">
                          <Button onClick={handleUpdateDefaultHours} disabled={saving}>
                            {saving ? "Saving..." : "Save Default Hours"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Hours Overrides */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Hours Overrides</CardTitle>
                          <CardDescription>
                            Temporary schedule changes that override default hours
                          </CardDescription>
                        </div>
                        <Dialog
                          open={createOverrideDialogOpen}
                          onOpenChange={setCreateOverrideDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button>Create Override</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Create Hours Override</DialogTitle>
                              <DialogDescription>
                                Set temporary hours for a date range
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="override-start-date">Start Date *</Label>
                                  <Input
                                    id="override-start-date"
                                    type="date"
                                    value={overrideStartDate}
                                    onChange={(e) => setOverrideStartDate(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="override-end-date">End Date *</Label>
                                  <Input
                                    id="override-end-date"
                                    type="date"
                                    value={overrideEndDate}
                                    onChange={(e) => setOverrideEndDate(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-4">
                                <Label>Configure Hours for Each Day:</Label>
                                {overrideDays.map((day) => {
                                  const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day.day_of_week);
                                  return (
                                    <div
                                      key={day.day_of_week}
                                      className="flex items-center gap-4 p-4 border rounded-lg flex-wrap"
                                    >
                                      <div className="w-24 font-medium">{dayInfo?.name}</div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id={`override-open-${day.day_of_week}`}
                                          checked={day.is_open}
                                          onChange={(e) =>
                                            updateOverrideDay(day.day_of_week, {
                                              is_open: e.target.checked,
                                              is_open_24_7: e.target.checked
                                                ? day.is_open_24_7
                                                : false,
                                            })
                                          }
                                          className="h-4 w-4"
                                        />
                                        <Label htmlFor={`override-open-${day.day_of_week}`}>
                                          Open
                                        </Label>
                                      </div>
                                      {day.is_open && (
                                        <>
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              id={`override-24-7-${day.day_of_week}`}
                                              checked={day.is_open_24_7}
                                              onChange={(e) =>
                                                updateOverrideDay(day.day_of_week, {
                                                  is_open_24_7: e.target.checked,
                                                })
                                              }
                                              className="h-4 w-4"
                                            />
                                            <Label htmlFor={`override-24-7-${day.day_of_week}`}>
                                              24/7
                                            </Label>
                                          </div>
                                          {!day.is_open_24_7 && (
                                            <>
                                              <div className="flex items-center gap-2">
                                                <Label htmlFor={`override-open-time-${day.day_of_week}`}>
                                                  Open:
                                                </Label>
                                                <Input
                                                  id={`override-open-time-${day.day_of_week}`}
                                                  type="time"
                                                  value={day.open_time || ""}
                                                  onChange={(e) =>
                                                    updateOverrideDay(day.day_of_week, {
                                                      open_time: e.target.value || null,
                                                    })
                                                  }
                                                  className="w-32"
                                                />
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Label htmlFor={`override-close-time-${day.day_of_week}`}>
                                                  Close:
                                                </Label>
                                                <Input
                                                  id={`override-close-time-${day.day_of_week}`}
                                                  type="time"
                                                  value={day.close_time || ""}
                                                  onChange={(e) =>
                                                    updateOverrideDay(day.day_of_week, {
                                                      close_time: e.target.value || null,
                                                    })
                                                  }
                                                  className="w-32"
                                                />
                                              </div>
                                            </>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setCreateOverrideDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleCreateOverride} disabled={saving}>
                                {saving ? "Creating..." : "Create Override"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardHeader>
                      <CardContent>
                        {overrides.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No overrides yet. Create one to override default hours for a specific date
                            range.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {overrides.map((override) => {
                              const dayInfo = DAYS_OF_WEEK.find((d) => d.value === override.day_of_week);
                              return (
                                <div
                                  key={override.id}
                                  className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {dayInfo?.name} ({formatDate(override.start_date)} -{" "}
                                      {formatDate(override.end_date)})
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {override.is_open ? (
                                        override.is_open_24_7 ? (
                                          "Open 24/7"
                                        ) : (
                                          `Open: ${override.open_time} - ${override.close_time}`
                                        )
                                      ) : (
                                        "Closed"
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteOverride(override.id)}
                                    disabled={saving}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
