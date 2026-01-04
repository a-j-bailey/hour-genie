import type { Route } from "./+types/embed.hours";
import { useSearchParams } from "react-router";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Business Hours Widget - Hour Genie" },
    { name: "description", content: "Business hours widget" },
  ];
}

/**
 * Public embed widget route
 * This route redirects to the API endpoint which serves the complete HTML document
 * The iframe src should point directly to the API endpoint: /api/embed/hours?id=123
 */
export default function EmbedWidget() {
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get("id");
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;

  useEffect(() => {
    if (businessId) {
      // Redirect to the API endpoint which serves the complete HTML document
      window.location.href = `${apiUrl}/api/embed/hours?id=${businessId}`;
    }
  }, [businessId, apiUrl]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Redirecting to widget...</div>
    </div>
  );
}

