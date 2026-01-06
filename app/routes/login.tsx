import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/login";
import { useAuth } from "~/lib/use-auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Check } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Hour Genie" },
    { name: "description", content: "Sign in to your Hour Genie account" },
  ];
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // For existing users, check if they need onboarding
      // New signups will be redirected to onboarding in handleSubmit
      navigate("/hours");
    }
  }, [user, navigate]);

  // Validate form
  const isFormValid = useMemo(() => {
    if (isSignUp) {
      return (
        email.trim() !== "" &&
        password.length >= 6 &&
        confirmPassword.length >= 6 &&
        password === confirmPassword
      );
    } else {
      return email.trim() !== "" && password.length >= 6;
    }
  }, [email, password, confirmPassword, isSignUp]);

  const passwordsMatch = password.length >= 6 && confirmPassword.length >= 6 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate that passwords match
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const { error, session } = await signUp(email, password);
        
        if (error) {
          setError(error.message);
          setLoading(false);
        } else if (session) {
          // User is automatically authenticated (email confirmation disabled)
          // New users should go through onboarding
          navigate("/onboarding");
        } else {
          // Email confirmation required - show message
          setError("Please check your email to confirm your account before signing in.");
          setLoading(false);
        }
      } else {
        const { error } = await signIn(email, password);
        
        if (error) {
          setError(error.message);
          setLoading(false);
        } else {
          // Sign in successful - check if user needs onboarding
          // The useEffect will handle redirect, but we'll check onboarding status
          // For now, redirect to /hours and let the layout handle onboarding check
          navigate("/hours");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-950">
      <Card className="w-full max-w-md bg-gray-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Enter your email to create a new account"
              : "Enter your email to sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-100 border-gray-400 shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-gray-100 border-gray-400 shadow-none"
              />
            </div>
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className={passwordsMatch ? "pr-9 bg-gray-100 border-gray-400 shadow-none" : "bg-gray-100 border-gray-400 shadow-none"}
                  />
                  {passwordsMatch && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600 dark:text-green-500" />
                  )}
                </div>
              </div>
            )}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !isFormValid}>
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setConfirmPassword("");
              }}
              className="text-primary hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:underline">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

