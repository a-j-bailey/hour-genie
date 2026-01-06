import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/onboarding";
import { useAuth } from "~/lib/use-auth";
import { useBusiness } from "~/lib/business-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { formatPhoneNumber } from "~/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Loader2,
  Check,
} from "lucide-react";

interface Subscription {
  id?: string;
  user_id?: string;
  stripe_customer_id: string;
  subscription_status: string;
  plan_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

function createDefaultHoursStructure() {
  const DAYS_OF_WEEK = [
    { value: 0, name: "Sunday" },
    { value: 1, name: "Monday" },
    { value: 2, name: "Tuesday" },
    { value: 3, name: "Wednesday" },
    { value: 4, name: "Thursday" },
    { value: 5, name: "Friday" },
    { value: 6, name: "Saturday" },
  ];

  return DAYS_OF_WEEK.map((day) => ({
    day_of_week: day.value,
    is_open: false,
    is_open_24_7: false,
    open_time: null,
    close_time: null,
  }));
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Onboarding - Hour Genie" },
    { name: "description", content: "Set up your business and choose a plan" },
  ];
}

export default function Onboarding() {
  const { user, session } = useAuth();
  const { businesses, refreshBusinesses, setSelectedBusinessId, loading: businessesLoading } = useBusiness();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apiUrl = import.meta.env.VITE_API_URL || "";

  // Step state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Business form state
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || !session?.access_token || businessesLoading) {
        if (!businessesLoading) {
          setCheckingOnboarding(false);
        }
        return;
      }

      try {
        // Check subscription
        const subResponse = await fetch(`${apiUrl}/api/subscriptions`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        let hasSubscription = false;
        if (subResponse.ok) {
          const subData = await subResponse.json();
          if (subData.subscription && subData.subscription.subscription_status === "active") {
            hasSubscription = true;
            setSubscription(subData.subscription);
          }
        }

        // Check businesses (already loaded via BusinessContext)
        const hasBusiness = businesses.length > 0;

        // Determine which step to show
        if (hasBusiness && hasSubscription) {
          // User is fully onboarded, redirect to hours
          navigate("/hours");
          return;
        } else if (hasBusiness && !hasSubscription) {
          // Has business but no subscription, go to billing step
          setCurrentStep(2);
        } else if (!hasBusiness && hasSubscription) {
          // Has subscription but no business, go to business step
          setCurrentStep(1);
        } else {
          // No business and no subscription, start at step 1
          setCurrentStep(1);
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
      } finally {
        setCheckingOnboarding(false);
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, session, businesses, businessesLoading, navigate, apiUrl]);

  // Handle Stripe return
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setSuccess("Payment successful! Your subscription is now active.");
      // Refresh subscription data
      fetchSubscription();
      // Redirect to hours after a short delay
      setTimeout(() => {
        navigate("/hours");
      }, 2000);
    } else if (searchParams.get("canceled") === "true") {
      setSubscriptionError("Payment was canceled. Please try again when you're ready.");
      setTimeout(() => setSubscriptionError(null), 5000);
    }
  }, [searchParams, navigate]);

  const fetchSubscription = async () => {
    if (!session?.access_token) return;

    try {
      setSubscriptionLoading(true);
      const response = await fetch(`${apiUrl}/api/subscriptions`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleCreateBusiness = async () => {
    if (!session?.access_token || !businessName.trim()) {
      setBusinessError("Business name is required");
      return;
    }

    setCreatingBusiness(true);
    setBusinessError(null);

    try {
      const response = await fetch(`${apiUrl}/api/businesses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: businessName,
          address: businessAddress || null,
          email: businessEmail || null,
          phone: businessPhone || null,
          default_hours: createDefaultHoursStructure(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await refreshBusinesses();
        setSelectedBusinessId(data.id);
        setBusinessName("");
        setBusinessAddress("");
        setBusinessEmail("");
        setBusinessPhone("");
        // Move to next step
        setCurrentStep(2);
        toast.success("Business created successfully!");
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to create business";
        setBusinessError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = "Failed to create business. Please try again.";
      setBusinessError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreatingBusiness(false);
    }
  };

  const handleCreatePaymentLink = async (billingInterval: "monthly" | "annual") => {
    if (!session?.access_token) {
      setSubscriptionError("You must be logged in to create a payment link");
      return;
    }

    try {
      setActionLoading(true);
      setSubscriptionError(null);
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
          setSubscriptionError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to create payment link";
        setSubscriptionError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error creating payment link:", err);
      const errorMessage = "Failed to create payment link. Please try again.";
      setSubscriptionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (checkingOnboarding || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-950">
      <Card className="w-full max-w-2xl bg-gray-200">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Welcome to Hour Genie</CardTitle>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of 2
            </div>
          </div>
          <CardDescription>
            {currentStep === 1
              ? "Let's start by setting up your business"
              : "Choose a subscription plan to get started"}
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 1 ? "bg-primary" : "bg-gray-300"}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 2 ? "bg-primary" : "bg-gray-300"}`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {success && (
            <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Step 1: Business Setup */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Business Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tell us about your business so we can help you manage your hours.
                </p>
              </div>

              {businessError && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{businessError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name *</Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="My Business"
                    className="bg-gray-100 border-gray-400 shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-address">Address</Label>
                  <Input
                    id="business-address"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="123 Main St"
                    className="bg-gray-100 border-gray-400 shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="business@example.com"
                    className="bg-gray-100 border-gray-400 shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-phone">Phone</Label>
                  <Input
                    id="business-phone"
                    type="tel"
                    value={businessPhone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setBusinessPhone(formatted);
                    }}
                    placeholder="+1 (555) 123-4567"
                    maxLength={17}
                    className="bg-gray-100 border-gray-400 shadow-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleCreateBusiness}
                  disabled={creatingBusiness || !businessName.trim()}
                  className="min-w-32"
                >
                  {creatingBusiness ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Billing Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Choose Your Plan</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a subscription plan that works best for your business.
                </p>
              </div>

              {subscriptionError && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{subscriptionError}</span>
                </div>
              )}

              {subscription && subscription.subscription_status === "active" ? (
                <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-md flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>You already have an active subscription! Redirecting...</span>
                </div>
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
                      <ul className="space-y-2 flex-1 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Unlimited hours updates</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Holiday reminders</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Website embedding</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Multi-business support</span>
                        </li>
                      </ul>
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
                  <Card className="border-2 hover:border-primary transition-colors border-primary/50 flex flex-col relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Best Value</Badge>
                    </div>
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
                      <div className="text-sm text-muted-foreground">
                        <span className="line-through">$60/year</span>
                        <span className="ml-2">Just $4.17/month</span>
                      </div>
                      <ul className="space-y-2 flex-1 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Everything in Monthly</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Save $10 per year</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Priority support</span>
                        </li>
                      </ul>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

