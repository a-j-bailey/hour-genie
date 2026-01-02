import { Link } from "react-router";
import { useAuth } from "~/lib/use-auth";
import { Button } from "~/components/ui/button";
import { useNavigate } from "react-router";

export function Nav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-lg font-semibold">
              Hour Genie
            </Link>
            <div className="flex gap-4">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/account"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Account
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

