import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Route } from "./+types/billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { useAuth } from "~/lib/use-auth";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "react-router";

interface Subscription {
  id?: string;
  user_id?: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  subscription_status: string;
  plan_name?: string | null;
  price_amount?: number | null;
  price_currency?: string;
  billing_interval?: string | null;
  current_period_end?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Billing - Hour Genie" },
    { name: "description", content: "Manage your subscription and billing" },
  ];
}

export default function Billing() {
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    // Check for success/canceled params from Stripe redirect
    if (searchParams.get("success") === "true") {
      setSuccess("Payment successful! Your subscription is now active.");
      setTimeout(() => setSuccess(null), 5000);
      // Refresh subscription data
      fetchSubscription();
    } else if (searchParams.get("canceled") === "true") {
      setError("Payment was canceled. Please try again when you're ready.");
      setTimeout(() => setError(null), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && session) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user, session]);

  const fetchSubscription = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${apiUrl}/api/subscriptions`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to load subscription";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      const errorMessage = "Failed to load subscription. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaymentLink = async (billingInterval: "monthly" | "annual") => {
    if (!session?.access_token) {
      setError("You must be logged in to create a payment link");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const response = await fetch(`${apiUrl}/api/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ billing_interval: billingInterval }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Redirect to Stripe payment link
          window.location.href = data.url;
        } else {
          const errorMessage = "No payment link received";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to create payment link";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error creating payment link:", err);
      const errorMessage = "Failed to create payment link. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    if (!session?.access_token) {
      setError("You must be logged in to access the customer portal");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const response = await fetch(`${apiUrl}/api/subscriptions/portal`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Redirect to Stripe Customer Portal
          window.location.href = data.url;
        } else {
          const errorMessage = "No portal URL received";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to access customer portal";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error opening customer portal:", err);
      const errorMessage = "Failed to open customer portal. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (amount?: number | null, currency?: string) => {
    if (!amount) return null;
    const formatted = (amount / 100).toFixed(2);
    const currencySymbol = currency?.toUpperCase() === "USD" ? "$" : currency?.toUpperCase() || "";
    return `${currencySymbol}${formatted}`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
      active: { label: "Active", variant: "default" },
      canceled: { label: "Canceled", variant: "secondary" },
      past_due: { label: "Past Due", variant: "destructive" },
      unpaid: { label: "Unpaid", variant: "destructive" },
      trialing: { label: "Trialing", variant: "default" },
      incomplete: { label: "Incomplete", variant: "secondary" },
      incomplete_expired: { label: "Expired", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.variant === "default"
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : config.variant === "destructive"
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          }`}
      >
        {config.label}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your billing information.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-md flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Subscription Status */}
      {subscription ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </div>
              {getStatusBadge(subscription.subscription_status)}
            </CardTitle>
            <CardDescription>
              View and manage your current subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {subscription.price_amount && (
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Price</Label>
                  <span className="text-sm font-medium">
                    {formatPrice(subscription.price_amount, subscription.price_currency)}
                    {subscription.billing_interval && ` / ${subscription.billing_interval}`}
                  </span>
                </div>
              )}
              {subscription.current_period_end && subscription.subscription_status === "active" && (
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Next Billing Date</Label>
                  <span className="text-sm">{formatDate(subscription.current_period_end)}</span>
                </div>
              )}
              {subscription.created_at && (
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Subscribed Since</Label>
                  <span className="text-sm">
                    {new Date(subscription.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
            {subscription.subscription_status === "active" && (
              <Button
                onClick={handleOpenCustomerPortal}
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monthly Subscription */}
          <Card className="border-2 hover:border-primary transition-colors flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">Monthly</CardTitle>
              <CardDescription>
                Billed monthly, cancel anytime
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$</span>
                <span className="text-4xl font-bold">5</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Button
                onClick={() => handleCreatePaymentLink("monthly")}
                disabled={actionLoading}
                className="w-full mt-auto"
                size="lg"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscribe Monthly
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Annual Subscription */}
          <Card className="border-2 hover:border-primary transition-colors border-primary/50 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Annual</CardTitle>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  Save $10
                </span>
              </div>
              <CardDescription>
                Billed annually, best value
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$</span>
                <span className="text-4xl font-bold">50</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <Button
                onClick={() => handleCreatePaymentLink("annual")}
                disabled={actionLoading}
                className="w-full mt-auto"
                size="lg"
                variant="default"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscribe Annually
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment History - Placeholder for future implementation */}
      {subscription && subscription.subscription_status === "active" && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              View your payment history in the Stripe Customer Portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleOpenCustomerPortal}
              disabled={actionLoading}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Payment History
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

