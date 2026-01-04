import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/lib/use-auth";
import { Sparkles, Clock, Shield, Cloud, Calendar, Users, Zap } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hour Genie - Manage Your Business Hours" },
    { name: "description", content: "Easily manage and update your business operating hours" },
  ];
}

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-6 w-6" />
              <span>Hour Genie</span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Button asChild>
                  <Link to="/hours">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/login">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 md:py-32">
        <div className="max-w-4xl w-full text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Manage Your Business Hours
            <span className="block text-4xl md:text-5xl text-primary mt-2">With Ease</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Set, update, and share your operating hours in minutes. No hassle, no complications.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            {!user && (
              <>
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to="/login">Get Started Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>
            )}
            {user && (
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/hours">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose Hour Genie?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your business hours efficiently
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Easy Management</CardTitle>
                <CardDescription>
                  Set hours for each day of the week with an intuitive interface. Make changes in seconds, not minutes.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your business information is kept secure with enterprise-grade authentication and encryption.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Cloud className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Always Available</CardTitle>
                <CardDescription>
                  Update your hours anytime, anywhere with our cloud-based platform. Access from any device.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Selling Points */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Calendar className="h-12 w-12 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">Flexible Scheduling</h2>
              <p className="text-lg text-muted-foreground">
                Set different hours for each day, add special overrides for holidays, and handle exceptions with ease. 
                Your schedule, your way.
              </p>
            </div>
            <div className="space-y-6">
              <Users className="h-12 w-12 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">Multi-Business Support</h2>
              <p className="text-lg text-muted-foreground">
                Manage multiple businesses from one account. Perfect for business owners with multiple locations 
                or franchises.
              </p>
            </div>
            <div className="space-y-6">
              <Zap className="h-12 w-12 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">Lightning Fast</h2>
              <p className="text-lg text-muted-foreground">
                Built for speed. Update hours instantly, share them immediately. No waiting, no delays.
              </p>
            </div>
            <div className="space-y-6">
              <Shield className="h-12 w-12 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">Reliable & Trusted</h2>
              <p className="text-lg text-muted-foreground">
                Built on modern, reliable infrastructure. Your hours are always available when your customers need them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of businesses managing their hours with Hour Genie. It's free to get started.
          </p>
          {!user && (
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link to="/login">Create Your Account</Link>
            </Button>
          )}
          {user && (
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-5 w-5" />
                <span>Hour Genie</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Manage your business operating hours with ease.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Hour Genie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
