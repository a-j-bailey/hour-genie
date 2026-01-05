import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useAuth } from "~/lib/use-auth";
import { Sparkles, Clock, Shield, Cloud, Calendar, Users, Zap, CalendarClock, Gift, Code, MessageSquare, Check } from "lucide-react";

export function meta({ }: Route.MetaArgs) {
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
      <section className="flex-1 flex items-center justify-center px-4 py-4 h-screen">
        <div className="max-w-4xl w-full text-center space-y-4">
          <div className="flex justify-center mb-4 relative">
            <div className="relative inline-block">
              <img
                src="/imgs/phone_screenshot.png"
                alt="Phone screenshot"
                className="max-w-full h-auto mx-auto max-h-[60vh] relative z-10 animate-[fade_0.8s_ease-out_0.2s_both]"
              />
              {/* Blue tags clustered around the phone */}
              <div className="absolute -top-1/8 left-0 w-full h-full pointer-events-none z-20">
                <div className="absolute top-1/6 -right-12 bg-blue-500/20 backdrop-blur-md text-blue-700 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-300/30 animate-[fadeUp_0.6s_ease-out_0.8s_both]">
                  Did they close early for the storm?
                </div>
                <div className="absolute top-2/6 -left-12 bg-blue-500/20 backdrop-blur-md text-blue-700 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-300/30 animate-[fadeUp_0.6s_ease-out_1.0s_both]">
                  Are they open for the holiday?
                </div>
                <div className="absolute top-3/6 -right-12 bg-blue-500/20 backdrop-blur-md text-blue-700 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-300/30 animate-[fadeUp_0.6s_ease-out_1.2s_both]">
                  Do they have summer hours?
                </div>
                <div className="absolute top-4/6 -left-12 bg-blue-500/20 backdrop-blur-md text-blue-700 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-300/30 animate-[fadeUp_0.6s_ease-out_1.4s_both]">
                  Are these hours up to date?
                </div>
                <div className="absolute top-5/6 -right-12 bg-blue-500/20 backdrop-blur-md text-blue-700 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-300/30 animate-[fadeUp_0.6s_ease-out_1.6s_both]">
                  Should I check Instagram?
                </div>
                <div className="absolute top-6/6 -left-12 bg-blue-500/20 backdrop-blur-md text-blue-700 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-300/30 animate-[fadeUp_0.6s_ease-out_1.8s_both]">
                  Maybe they posted on Facebook?
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight animate-[fade_0.8s_ease-out_0.4s_both]">
            Business moves quickly.
            <span className="block text-3xl md:text-4xl text-primary mt-2">Your hours should too.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Keep your customers informed by updating your hours across all platforms instantly.
          </p>
          <div className="flex gap-4 justify-center pt-2">
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

      {/* Additional Selling Points */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <CalendarClock className="h-12 w-12 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">Flexible Hours</h2>
              <p className="text-lg text-muted-foreground">
                Temporarily change hours, seasonally, for vacation, or any other reason. Set overrides that automatically apply and expire.
              </p>
            </div>
            <div className="space-y-6">
              <Gift className="h-12 w-12 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">Holiday Reminders</h2>
              <p className="text-lg text-muted-foreground">
                Get convenient reminders for holidays so you never forget to update your hours. Stay ahead of special dates.
              </p>
            </div>
            <div className="space-y-6">
              <Code className="h-12 w-12 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">Website Embedding</h2>
              <p className="text-lg text-muted-foreground">
                Easily embed your hours on your website with a simple snippet. Your hours update automatically everywhere.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <MessageSquare className="h-12 w-12 text-primary" />
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Change Hours via SMS</h2>
              <p className="text-lg text-muted-foreground">
                Text to change hours when closing early due to weather or other emergencies. Update instantly from anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Integrate Everywhere</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sync your hours across all the platforms your customers use. One update, everywhere.
            </p>
          </div>
          
          {/* Website Integrations */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6 text-center">Website Platforms</h3>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="flex flex-col items-center justify-center p-6 hover:border-primary transition-colors">
                <Code className="h-12 w-12 mb-3 text-primary" />
                <CardTitle className="text-base text-center">iframe</CardTitle>
                <Badge variant="default" className="mt-2 text-xs">Available</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-primary transition-colors">
                <img src="/imgs/logos/wix.png" alt="Wix" className="h-12 w-12 mb-3 object-contain" />
                <CardTitle className="text-base text-center">Wix</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-primary transition-colors">
                <img src="/imgs/logos/framer.png" alt="Framer" className="h-12 w-12 mb-3 object-contain" />
                <CardTitle className="text-base text-center">Framer</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-primary transition-colors">
                <img src="/imgs/logos/squarespace.png" alt="Squarespace" className="h-12 w-12 mb-3 object-contain" />
                <CardTitle className="text-base text-center">Squarespace</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-primary transition-colors">
                <img src="/imgs/logos/wordpress.png" alt="WordPress" className="h-12 w-12 mb-3 object-contain" />
                <CardTitle className="text-base text-center">WordPress</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-primary transition-colors">
                <img src="/imgs/logos/webflow.png" alt="Webflow" className="h-12 w-12 mb-3 object-contain" />
                <CardTitle className="text-base text-center">Webflow</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
              </Card>
            </div>
          </div>

          {/* Platform Integrations */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-center">Maps & Directories</h3>
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Card className="flex flex-col items-center justify-center p-6 hover:border-primary transition-colors">
                <img src="/imgs/logos/google_maps.svg" alt="Google Maps" className="h-12 w-12 mb-3 object-contain" />
                <CardTitle className="text-base text-center">Google Maps</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-primary transition-colors">
                <img src="/imgs/logos/apple_maps.png" alt="Apple Maps" className="h-12 w-12 mb-3 object-contain" />
                <CardTitle className="text-base text-center">Apple Maps</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-primary transition-colors">
                <img src="/imgs/logos/yelp.png" alt="Yelp" className="h-12 w-12 mb-3 object-contain" />
                <CardTitle className="text-base text-center">Yelp</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works best for your business. No hidden fees, cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <Card className="border-2 hover:border-primary transition-colors flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">Monthly</CardTitle>
                <CardDescription>
                  Billed monthly, cancel anytime
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$5</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Unlimited hours updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Holiday reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Website embedding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Multi-business support</span>
                  </li>
                </ul>
                {!user ? (
                  <Button asChild size="lg" className="w-full mt-auto" variant="outline">
                    <Link to="/login">Get Started</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="w-full mt-auto" variant="outline">
                    <Link to="/billing">View Plans</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Annual Plan */}
            <Card className="border-2 hover:border-primary transition-colors border-primary/50 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Best Value</Badge>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Annual</CardTitle>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                    Save $10
                  </span>
                </div>
                <CardDescription>
                  Billed annually, best value
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$50</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="line-through">$60/year</span>
                  <span className="ml-2">Just $4.17/month</span>
                </div>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Everything in Monthly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Save $10 per year</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
                {!user ? (
                  <Button asChild size="lg" className="w-full mt-auto">
                    <Link to="/login">Get Started</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="w-full mt-auto">
                    <Link to="/billing">View Plans</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join other business owners managing their hours with Hour Genie.
          </p>
          {!user && (
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link to="/login">Create Your Account</Link>
            </Button>
          )}
          {user && (
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link to="/hours">Go to Dashboard</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5" />
            <span>Hour Genie</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Manage your business operating hours with ease.
          </p>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Hour Genie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
