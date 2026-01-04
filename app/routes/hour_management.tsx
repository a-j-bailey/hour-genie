import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Route } from "./+types/hour_management";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
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
import { DatePicker } from "~/components/ui/date-picker";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Hour Management - Hour Genie" },
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
    title?: string | null; // Optional title for the override (e.g., "Christmas", "Thanksgiving")
    hours: DayHours[]; // Complete week schedule (7 days, matching default_hours format)
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

function HourManagementContent() {
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
    const [isEditingDefaultHours, setIsEditingDefaultHours] = useState(false);
    const [originalDefaultHours, setOriginalDefaultHours] = useState<DayHours[]>(createDefaultHoursStructure());

    // Dialog states
    const [createBusinessDialogOpen, setCreateBusinessDialogOpen] = useState(false);
    const [createOverrideDialogOpen, setCreateOverrideDialogOpen] = useState(false);
    const [editOverrideDialogOpen, setEditOverrideDialogOpen] = useState(false);
    const [editingOverride, setEditingOverride] = useState<HoursOverride | null>(null);

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
    const [overrideStartDate, setOverrideStartDate] = useState<Date | undefined>(undefined);
    const [overrideEndDate, setOverrideEndDate] = useState<Date | undefined>(undefined);
    const [overrideTitle, setOverrideTitle] = useState<string>("");
    const [overrideDays, setOverrideDays] = useState<DayHours[]>(createDefaultHoursStructure());

    useEffect(() => {
        if (selectedBusiness) {
            const hours = selectedBusiness.default_hours && Array.isArray(selectedBusiness.default_hours)
                ? selectedBusiness.default_hours
                : createDefaultHoursStructure();
            setDefaultHours(hours);
            setOriginalDefaultHours(hours);
            setIsEditingDefaultHours(false);
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
                // Parse hours if they're JSON strings
                const parsedOverrides = (data || []).map((override: HoursOverride) => {
                    if (override.hours && typeof override.hours === 'string') {
                        try {
                            override.hours = JSON.parse(override.hours);
                        } catch (e) {
                            console.error("Error parsing hours:", e);
                        }
                    }
                    return override;
                });
                setOverrides(parsedOverrides);
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
                setOriginalDefaultHours(defaultHours);
                setIsEditingDefaultHours(false);
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

    const handleCancelEditDefaultHours = () => {
        setDefaultHours(originalDefaultHours);
        setIsEditingDefaultHours(false);
    };

    const handleStartEditDefaultHours = () => {
        setOriginalDefaultHours(defaultHours);
        setIsEditingDefaultHours(true);
    };

    const formatHoursDisplay = (day: DayHours) => {
        if (!day.is_open) {
            return "Closed";
        }
        if (day.is_open_24_7) {
            return "Open 24/7";
        }
        if (day.open_time && day.close_time) {
            return `${day.open_time} - ${day.close_time}`;
        }
        return "Hours not set";
    };

    // Initialize override days with default hours when create dialog opens
    useEffect(() => {
        if (createOverrideDialogOpen && defaultHours.length === 7) {
            // Deep copy default hours to avoid reference issues
            setOverrideDays(defaultHours.map(day => ({ ...day })));
        }
    }, [createOverrideDialogOpen, defaultHours]);

    // Initialize override days with editing override data when edit dialog opens
    useEffect(() => {
        if (editOverrideDialogOpen && editingOverride) {
            // Parse hours if it's a JSON string
            let hours = editingOverride.hours;
            if (hours && typeof hours === 'string') {
                try {
                    hours = JSON.parse(hours);
                } catch (e) {
                    console.error("Error parsing hours:", e);
                }
            }

            setOverrideTitle(editingOverride.title || "");
            setOverrideStartDate(editingOverride.start_date ? new Date(editingOverride.start_date) : undefined);
            setOverrideEndDate(editingOverride.end_date ? new Date(editingOverride.end_date) : undefined);
            setOverrideDays(Array.isArray(hours) && hours.length === 7 ? hours.map(day => ({ ...day })) : createDefaultHoursStructure());
        }
    }, [editOverrideDialogOpen, editingOverride]);

    const handleCreateOverride = async () => {
        if (!session?.access_token || !selectedBusinessId) {
            setError("No business selected");
            return;
        }

        if (!overrideStartDate || !overrideEndDate) {
            setError("Start date and end date are required");
            return;
        }

        // Validate that we have a complete week schedule (7 days)
        if (overrideDays.length !== 7) {
            setError("Override must include all 7 days of the week");
            return;
        }

        // Convert Date objects to YYYY-MM-DD format
        const startDateStr = overrideStartDate.toISOString().split('T')[0];
        const endDateStr = overrideEndDate.toISOString().split('T')[0];

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
                    start_date: startDateStr,
                    end_date: endDateStr,
                    title: overrideTitle.trim() || null,
                    hours: overrideDays, // Send complete week schedule
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Handle both array and single object responses
                const newOverride = Array.isArray(data) ? data[0] : data;

                // Parse hours if it's a JSON string
                if (newOverride.hours && typeof newOverride.hours === 'string') {
                    try {
                        newOverride.hours = JSON.parse(newOverride.hours);
                    } catch (e) {
                        console.error("Error parsing hours:", e);
                    }
                }

                setOverrides([...overrides, newOverride]);
                setCreateOverrideDialogOpen(false);
                setOverrideStartDate(undefined);
                setOverrideEndDate(undefined);
                setOverrideTitle("");
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

    const handleEditOverride = (override: HoursOverride) => {
        setEditingOverride(override);
        setEditOverrideDialogOpen(true);
    };

    const handleUpdateOverride = async () => {
        if (!session?.access_token || !selectedBusinessId || !editingOverride) {
            setError("No business selected or override to update");
            return;
        }

        if (!overrideStartDate || !overrideEndDate) {
            setError("Start date and end date are required");
            return;
        }

        // Validate that we have a complete week schedule (7 days)
        if (overrideDays.length !== 7) {
            setError("Override must include all 7 days of the week");
            return;
        }

        // Convert Date objects to YYYY-MM-DD format
        const startDateStr = overrideStartDate.toISOString().split('T')[0];
        const endDateStr = overrideEndDate.toISOString().split('T')[0];

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/api/hours-overrides/${editingOverride.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    start_date: startDateStr,
                    end_date: endDateStr,
                    title: overrideTitle.trim() || null,
                    hours: overrideDays, // Send complete week schedule
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Parse hours if it's a JSON string
                let updatedOverride = data;
                if (updatedOverride.hours && typeof updatedOverride.hours === 'string') {
                    try {
                        updatedOverride.hours = JSON.parse(updatedOverride.hours);
                    } catch (e) {
                        console.error("Error parsing hours:", e);
                    }
                }

                setOverrides(overrides.map((o) => o.id === editingOverride.id ? updatedOverride : o));
                setEditOverrideDialogOpen(false);
                setEditingOverride(null);
                setOverrideStartDate(undefined);
                setOverrideEndDate(undefined);
                setOverrideTitle("");
                setOverrideDays(createDefaultHoursStructure());
                setSuccess("Hours override updated successfully!");
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Failed to update override");
            }
        } catch (err) {
            setError("Failed to update override. Please try again.");
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
        if (!dateString) return "Invalid date";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid date";
            return date.toLocaleDateString();
        } catch (e) {
            return "Invalid date";
        }
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
            <div>
                <h1 className="text-3xl font-bold mb-2">Hour Management</h1>
                <p className="text-muted-foreground">
                    Manage your business operating hours and schedule overrides
                </p>
            </div>

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
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Default Operating Hours</CardTitle>
                                        <CardDescription>
                                            Configure default hours for {selectedBusiness.name}
                                        </CardDescription>
                                    </div>
                                    {!isEditingDefaultHours && (
                                        <Button onClick={handleStartEditDefaultHours}>
                                            Edit Hours
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {isEditingDefaultHours ? (
                                        // Edit mode
                                        <div>
                                            {defaultHours.map((day, index) => {
                                                const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day.day_of_week);
                                                return (
                                                    <div key={day.day_of_week}>
                                                        <div className="flex items-center gap-4 py-4 flex-wrap">
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
                                                                                    className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
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
                                                                                    className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                                                                />
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        // Read-only mode
                                        <div>
                                            {defaultHours.map((day) => {
                                                const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day.day_of_week);
                                                return (
                                                    <div key={day.day_of_week}>
                                                        <div className="flex items-center justify-between py-2">
                                                            <div className="w-24 font-medium">{dayInfo?.name}</div>
                                                            <div className="text-muted-foreground">
                                                                {formatHoursDisplay(day)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {selectedBusiness?.updated_at && (
                                        <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                                            Last updated: {new Date(selectedBusiness.updated_at).toLocaleString()}
                                        </div>
                                    )}
                                </CardContent>
                                {isEditingDefaultHours && (
                                    <CardContent>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={handleCancelEditDefaultHours}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </Button>
                                            <Button onClick={handleUpdateDefaultHours} disabled={saving}>
                                                {saving ? "Saving..." : "Save Default Hours"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            <Separator className="my-6" />

                            {/* Upcoming Overrides */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-semibold">Upcoming Overrides</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Temporary schedule changes that override default hours
                                        </p>
                                    </div>
                                    <Dialog
                                        open={createOverrideDialogOpen}
                                        onOpenChange={(open) => {
                                            setCreateOverrideDialogOpen(open);
                                            if (!open) {
                                                // Reset form when dialog closes
                                                setOverrideStartDate(undefined);
                                                setOverrideEndDate(undefined);
                                                setOverrideTitle("");
                                                setOverrideDays(createDefaultHoursStructure());
                                                setError(null);
                                            }
                                        }}
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
                                                <div className="space-y-2">
                                                    <Label htmlFor="override-title">Title (optional)</Label>
                                                    <Input
                                                        id="override-title"
                                                        type="text"
                                                        value={overrideTitle}
                                                        onChange={(e) => setOverrideTitle(e.target.value)}
                                                        placeholder="e.g., Christmas, Thanksgiving"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="override-start-date">Start Date *</Label>
                                                        <DatePicker
                                                            id="override-start-date"
                                                            date={overrideStartDate}
                                                            onDateChange={setOverrideStartDate}
                                                            placeholder="Select start date"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="override-end-date">End Date *</Label>
                                                        <DatePicker
                                                            id="override-end-date"
                                                            date={overrideEndDate}
                                                            onDateChange={setOverrideEndDate}
                                                            placeholder="Select end date"
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
                                                                                        className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
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
                                                                                        className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
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

                                    {/* Edit Override Dialog */}
                                    <Dialog
                                        open={editOverrideDialogOpen}
                                        onOpenChange={(open) => {
                                            setEditOverrideDialogOpen(open);
                                            if (!open) {
                                                // Reset form when dialog closes
                                                setEditingOverride(null);
                                                setOverrideStartDate(undefined);
                                                setOverrideEndDate(undefined);
                                                setOverrideTitle("");
                                                setOverrideDays(createDefaultHoursStructure());
                                                setError(null);
                                            }
                                        }}
                                    >
                                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Edit Hours Override</DialogTitle>
                                                <DialogDescription>
                                                    Update temporary hours for a date range
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-override-title">Title (optional)</Label>
                                                    <Input
                                                        id="edit-override-title"
                                                        type="text"
                                                        value={overrideTitle}
                                                        onChange={(e) => setOverrideTitle(e.target.value)}
                                                        placeholder="e.g., Christmas, Thanksgiving"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="edit-override-start-date">Start Date *</Label>
                                                        <DatePicker
                                                            id="edit-override-start-date"
                                                            date={overrideStartDate}
                                                            onDateChange={setOverrideStartDate}
                                                            placeholder="Select start date"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="edit-override-end-date">End Date *</Label>
                                                        <DatePicker
                                                            id="edit-override-end-date"
                                                            date={overrideEndDate}
                                                            onDateChange={setOverrideEndDate}
                                                            placeholder="Select end date"
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
                                                                        id={`edit-override-open-${day.day_of_week}`}
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
                                                                    <Label htmlFor={`edit-override-open-${day.day_of_week}`}>
                                                                        Open
                                                                    </Label>
                                                                </div>
                                                                {day.is_open && (
                                                                    <>
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                id={`edit-override-24-7-${day.day_of_week}`}
                                                                                checked={day.is_open_24_7}
                                                                                onChange={(e) =>
                                                                                    updateOverrideDay(day.day_of_week, {
                                                                                        is_open_24_7: e.target.checked,
                                                                                    })
                                                                                }
                                                                                className="h-4 w-4"
                                                                            />
                                                                            <Label htmlFor={`edit-override-24-7-${day.day_of_week}`}>
                                                                                24/7
                                                                            </Label>
                                                                        </div>
                                                                        {!day.is_open_24_7 && (
                                                                            <>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Label htmlFor={`edit-override-open-time-${day.day_of_week}`}>
                                                                                        Open:
                                                                                    </Label>
                                                                                    <Input
                                                                                        id={`edit-override-open-time-${day.day_of_week}`}
                                                                                        type="time"
                                                                                        value={day.open_time || ""}
                                                                                        onChange={(e) =>
                                                                                            updateOverrideDay(day.day_of_week, {
                                                                                                open_time: e.target.value || null,
                                                                                            })
                                                                                        }
                                                                                        className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                                                                    />
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Label htmlFor={`edit-override-close-time-${day.day_of_week}`}>
                                                                                        Close:
                                                                                    </Label>
                                                                                    <Input
                                                                                        id={`edit-override-close-time-${day.day_of_week}`}
                                                                                        type="time"
                                                                                        value={day.close_time || ""}
                                                                                        onChange={(e) =>
                                                                                            updateOverrideDay(day.day_of_week, {
                                                                                                close_time: e.target.value || null,
                                                                                            })
                                                                                        }
                                                                                        className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
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
                                                    onClick={() => setEditOverrideDialogOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleUpdateOverride} disabled={saving}>
                                                    {saving ? "Updating..." : "Update Override"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                {overrides.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No overrides yet. Create one to override default hours for a specific date
                                        range.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {overrides.map((override) => {
                                            return (
                                                <div
                                                    key={override.id}
                                                    className="p-4 border rounded-lg space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            {override.title && (
                                                                <div className="font-semibold text-base mb-1">{override.title}</div>
                                                            )}
                                                            <div className="font-medium text-sm text-muted-foreground">
                                                                {formatDate(override.start_date)} - {formatDate(override.end_date)}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteOverride(override.id)}
                                                                disabled={saving}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                Delete
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEditOverride(override)}
                                                                disabled={saving}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {override.hours && Array.isArray(override.hours) && override.hours.length === 7 ? (
                                                            override.hours.map((day: DayHours) => {
                                                                if (!day || typeof day.day_of_week !== 'number') {
                                                                    return null;
                                                                }
                                                                const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day.day_of_week);
                                                                return (
                                                                    <div
                                                                        key={day.day_of_week}
                                                                        className="flex items-center justify-between text-sm"
                                                                    >
                                                                        <div className="w-24 font-medium">{dayInfo?.name}</div>
                                                                        <div className="text-muted-foreground">
                                                                            {formatHoursDisplay(day)}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }).filter(Boolean)
                                                        ) : (
                                                            <div className="text-sm text-muted-foreground">
                                                                Invalid hours data
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default function HourManagement() {
    return <HourManagementContent />;
}

