import { useState, useEffect } from "react";
import type { Route } from "./+types/settings";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/lib/use-auth";
import { useBusiness } from "~/lib/business-context";
import { formatPhoneNumber } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - Hour Genie" },
    { name: "description", content: "Manage your business settings" },
  ];
}

export default function Settings() {
  const { session, user } = useAuth();
  const { selectedBusiness, refreshBusinesses } = useBusiness();
  const apiUrl = import.meta.env.VITE_API_URL || "";

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBusiness) {
      setName(selectedBusiness.name || "");
      setAddress(selectedBusiness.address || "");
      setEmail(selectedBusiness.email || "");
      setPhone(selectedBusiness.phone || "");
    }
  }, [selectedBusiness]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token || !selectedBusiness?.id) {
      setError("No business selected");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${apiUrl}/api/businesses/${selectedBusiness.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      if (response.ok) {
        await refreshBusinesses();
        setSuccess("Business settings updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update business settings");
      }
    } catch (err) {
      setError("Failed to update business settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedBusiness) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No business selected.</p>
          <p className="text-sm text-muted-foreground">
            Please select a business from the sidebar to manage its settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business information and preferences
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-md">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Update your business name and address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="My Business"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              You can change the contact email for this business here, if no email is provided, your account email will be used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={user?.email || "business@example.com"}
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setPhone(formatted);
                }}
                placeholder="+1 (555) 123-4567"
                maxLength={17}
              />
            </div> */}
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}

