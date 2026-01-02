import { Link, useLocation } from "react-router";
import { useAuth } from "~/lib/use-auth";
import { Button } from "~/components/ui/button";
import { useNavigate } from "react-router";
import { LayoutDashboard, User, LogOut, Sparkles, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { useSidebar } from "~/lib/sidebar-context";

export function Nav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, isMobile, isMobileOpen, setIsCollapsed, setIsMobileOpen } = useSidebar();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Use window.location for a full page reload to ensure clean state
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      // Fallback navigation
      navigate("/");
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const navItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/account",
      icon: User,
      label: "Account",
    },
  ];

  const sidebarContent = (
    <>
      {/* Logo/Brand */}
      <div className={cn(
        "flex items-center gap-2 border-b transition-all",
        isCollapsed && !isMobile ? "px-2 py-4 justify-center" : "px-6 py-6"
      )}>
        <Sparkles className="h-6 w-6 flex-shrink-0" />
        {(!isCollapsed || isMobile) && (
          <Link to="/dashboard" className="text-lg font-semibold whitespace-nowrap">
            Hour Genie
          </Link>
        )}
      </div>

      {/* Navigation Items */}
      <nav className={cn(
        "flex-1 py-6 space-y-2 transition-all",
        isCollapsed && !isMobile ? "px-2" : "px-4"
      )}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => isMobile && setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                isCollapsed && !isMobile ? "px-2 py-3 justify-center" : "px-4 py-3",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Info and Sign Out */}
      <div className={cn(
        "border-t space-y-4 transition-all",
        isCollapsed && !isMobile ? "p-2" : "p-4"
      )}>
        {(!isCollapsed || isMobile) && (
          <div className="px-4">
            <p className="text-xs text-muted-foreground mb-1">Signed in as</p>
            <p className="text-sm font-medium truncate">{user?.email}</p>
          </div>
        )}
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-3 transition-all",
            isCollapsed && !isMobile ? "px-2 justify-center" : ""
          )}
          onClick={handleSignOut}
          title={isCollapsed && !isMobile ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {(!isCollapsed || isMobile) && <span>Sign Out</span>}
        </Button>
      </div>

      {/* Collapse Toggle Button (Desktop only) */}
      {!isMobile && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-center"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-background border shadow-md",
          "hover:bg-accent transition-colors"
        )}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen border-r bg-background flex flex-col z-40",
          "transition-all duration-300 ease-in-out",
          isMobile
            ? cn(
                "w-64",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
              )
            : cn(
                isCollapsed ? "w-16" : "w-64"
              )
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

