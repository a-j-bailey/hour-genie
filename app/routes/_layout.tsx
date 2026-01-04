import React from "react";
import { Outlet, useLocation, Link } from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { ProtectedRoute } from "~/components/protected-route";

// Route to breadcrumb label mapping
const routeLabels: Record<string, string> = {
  "/hours": "Hour Management",
  "/account": "Account",
  "/billing": "Billing",
  "/integrations": "Integrations",
  "/settings": "Settings",
};

// Integration ID to name mapping
const integrationNames: Record<string, string> = {
  iframe: "iframe",
  wix: "Wix",
  framer: "Framer",
  squarespace: "Squarespace",
  wordpress: "WordPress",
  webflow: "Webflow",
  "apple-maps": "Apple Maps",
  "google-maps": "Google Maps",
  yelp: "Yelp",
};

export default function Layout() {
  const location = useLocation();
  const pathname = location.pathname;

  // Build breadcrumbs from URL path
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const isLast = index === pathSegments.length - 1;
    
    // Get label for this segment
    let label: string;
    if (index === 0) {
      // First segment - use route label mapping
      label = routeLabels[path] || segment;
    } else if (path.startsWith("/integrations/")) {
      // Integration detail page - use integration name mapping
      label = integrationNames[segment] || segment;
    } else {
      // Other nested segments - use segment as-is or capitalize
      label = segment;
    }

    return { path, label, isLast };
  });

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                      {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                      <BreadcrumbItem className={index < breadcrumbs.length - 1 ? "hidden md:block" : ""}>
                        {crumb.isLast ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.path}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

