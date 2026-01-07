import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useBusiness } from "./business-context";

interface OnboardingStatus {
  needsOnboarding: boolean;
  hasBusiness: boolean;
  hasSubscription: boolean;
  loading: boolean;
}

/**
 * Hook to check if user needs onboarding
 * User needs onboarding if they have no business OR no active subscription
 */
export function useOnboardingStatus(): OnboardingStatus {
  const { session, loading: authLoading } = useAuth();
  const { businesses, loading: businessesLoading } = useBusiness();
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchSubscription = async () => {
      // Don't mark as done loading if auth is still loading
      if (authLoading) {
        return;
      }

      if (!session?.access_token) {
        setSubscriptionLoading(false);
        return;
      }

      try {
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

    fetchSubscription();
  }, [session?.access_token, authLoading, apiUrl]);

  const hasBusiness = businesses.length > 0;
  const hasSubscription = subscription && subscription.subscription_status === "active";
  const needsOnboarding = !hasBusiness || !hasSubscription;
  const loading = authLoading || businessesLoading || subscriptionLoading;

  return {
    needsOnboarding,
    hasBusiness,
    hasSubscription,
    loading,
  };
}

