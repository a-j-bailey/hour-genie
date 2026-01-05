import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./use-auth";

export interface Business {
  id: string;
  user_id?: string;
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  default_hours: any[];
  created_at?: string;
  updated_at?: string;
}

interface BusinessContextType {
  businesses: Business[];
  selectedBusiness: Business | null;
  selectedBusinessId: string | null;
  setSelectedBusinessId: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  refreshBusinesses: () => Promise<void>;
}

export const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || "";
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/businesses`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data || []);
        
        // Auto-select first business if none selected and businesses exist
        if (data && data.length > 0) {
          const currentId = localStorage.getItem("selectedBusinessId");
          const businessExists = currentId && data.find((b: Business) => b.id === currentId);
          
          if (!businessExists) {
            // Select first business if current selection doesn't exist
            const firstBusinessId = data[0].id;
            setSelectedBusinessId(firstBusinessId);
            localStorage.setItem("selectedBusinessId", firstBusinessId);
          } else if (currentId && currentId !== selectedBusinessId) {
            // Restore the stored selection if it exists
            setSelectedBusinessId(currentId);
          }
        } else {
          setSelectedBusinessId(null);
          localStorage.removeItem("selectedBusinessId");
        }
        setError(null);
      } else {
        const errorMsg = await response.text();
        setError(errorMsg || "Failed to load businesses");
      }
    } catch (err) {
      console.error("Error fetching businesses:", err);
      const errorMsg = "Failed to load businesses. Please check your connection.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchBusinesses();
    } else {
      setBusinesses([]);
      setSelectedBusinessId(null);
      setSelectedBusiness(null);
      setLoading(false);
    }
  }, [session]);

  // Fetch selected business details when ID changes
  useEffect(() => {
    if (selectedBusinessId && session?.access_token) {
      const fetchBusiness = async () => {
        try {
          const response = await fetch(`${apiUrl}/api/businesses/${selectedBusinessId}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setSelectedBusiness(data);
            localStorage.setItem("selectedBusinessId", selectedBusinessId);
          } else {
            const errorMsg = await response.text();
            setError(errorMsg || "Failed to load business details");
          }
        } catch (err) {
          console.error("Error fetching business:", err);
        }
      };

      fetchBusiness();
    } else {
      setSelectedBusiness(null);
    }
  }, [selectedBusinessId, session, apiUrl]);

  // Load selected business ID from localStorage on mount
  useEffect(() => {
    const storedId = localStorage.getItem("selectedBusinessId");
    if (storedId && businesses.find((b) => b.id === storedId)) {
      setSelectedBusinessId(storedId);
    }
  }, [businesses]);

  const handleSetSelectedBusinessId = (id: string | null) => {
    setSelectedBusinessId(id);
    if (id) {
      localStorage.setItem("selectedBusinessId", id);
    } else {
      localStorage.removeItem("selectedBusinessId");
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        selectedBusiness,
        selectedBusinessId,
        setSelectedBusinessId: handleSetSelectedBusinessId,
        loading,
        error,
        refreshBusinesses: fetchBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}

