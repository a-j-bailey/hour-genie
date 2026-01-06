import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { useAuth } from "~/lib/use-auth";
import { Sparkles, CalendarClock, Gift, Code, MessageSquare, Check } from "lucide-react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Hour Genie - Manage Your Business Hours" },
    { name: "description", content: "Easily manage and update your business operating hours" },
  ];
}

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-6 w-6" />
              <span>Hour Genie</span>
            </Link>
            <div className="ml-4">
              <Badge className="bg-yellow-900 border-yellow-600 text-white text-xs shadow-md shadow-yellow-200/20">Coming Soon</Badge>
            </div>
            {/* <div className="flex items-center gap-4">
              {user ? (
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link to="/hours">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" className="text-white hover:bg-gray-800">
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link to="/login">Get Started</Link>
                  </Button>
                </>
              )}
            </div> */}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-8 h-screen bg-black">
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
                <div className="absolute top-1/6 -right-12 bg-blue-900/40 backdrop-blur-md text-blue-100 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-400/30 animate-[fadeUp_0.6s_ease-out_0.8s_both]">
                  Did they close early for the storm?
                </div>
                <div className="absolute top-2/6 -left-12 bg-blue-900/40 backdrop-blur-md text-blue-100 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-400/30 animate-[fadeUp_0.6s_ease-out_1.0s_both]">
                  Are they open for the holiday?
                </div>
                <div className="absolute top-3/6 -right-12 bg-blue-900/40 backdrop-blur-md text-blue-100 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-400/30 animate-[fadeUp_0.6s_ease-out_1.2s_both]">
                  Do they have summer hours?
                </div>
                <div className="absolute top-4/6 -left-12 bg-blue-900/40 backdrop-blur-md text-blue-100 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-400/30 animate-[fadeUp_0.6s_ease-out_1.4s_both]">
                  Are these hours up to date?
                </div>
                <div className="absolute top-5/6 -right-12 bg-blue-900/40 backdrop-blur-md text-blue-100 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-400/30 animate-[fadeUp_0.6s_ease-out_1.6s_both]">
                  Should I check Instagram?
                </div>
                <div className="absolute top-6/6 -left-12 bg-blue-900/40 backdrop-blur-md text-blue-100 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-blue-400/30 animate-[fadeUp_0.6s_ease-out_1.8s_both]">
                  Maybe they posted on Facebook?
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white animate-[fade_0.8s_ease-out_0.4s_both]">
            Business moves quickly.
            <span className="block text-3xl md:text-4xl text-blue-500 mt-2">Your hours should too.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Keep your customers informed by updating your hours across all platforms instantly.
          </p>
          {/* <div className="flex gap-4 justify-center pt-2">
            {!user && (
              <>
                <Button asChild size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700 text-white">
                  <Link to="/login">Get Started Free</Link>
                </Button>
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>
            )}
            {user && (
              <Button asChild size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/hours">Go to Dashboard</Link>
              </Button>
            )}
          </div> */}
        </div>
      </section>

      {/* Additional Selling Points */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <CalendarClock className="h-12 w-12 text-blue-500" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">Flexible Hours</h2>
              <p className="text-lg text-gray-300">
                Temporarily change hours, seasonally, for vacation, or any other reason. Set overrides that automatically apply and expire.
              </p>
            </div>
            <div className="space-y-6">
              <Gift className="h-12 w-12 text-blue-500" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">Holiday Reminders</h2>
              <p className="text-lg text-gray-300">
                Get convenient reminders for holidays so you never forget to update your hours. Stay ahead of special dates.
              </p>
            </div>
            <div className="space-y-6">
              <Code className="h-12 w-12 text-blue-500" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">Website Embedding</h2>
              <p className="text-lg text-gray-300">
                Easily embed your hours on your website with a simple snippet. Your hours update automatically everywhere.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <MessageSquare className="h-12 w-12 text-blue-500" />
                <Badge variant="secondary" className="bg-gray-700 text-gray-200">Coming Soon</Badge>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Change Hours via SMS</h2>
              <p className="text-lg text-gray-300">
                Text to change hours when closing early due to weather or other emergencies. Update instantly from anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Integrate Everywhere</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Sync your hours across all the platforms your customers use. One update, everywhere.
            </p>
          </div>

          {/* Platform Integrations */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6 text-center text-white">Maps & Directories</h3>
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Card className="flex flex-col items-center justify-center p-6 hover:border-blue-500 transition-colors bg-gray-950 border-gray-800">
                <Avatar className="h-12 w-12 mb-3">
                  <AvatarImage src="/imgs/logos/google_maps.svg" alt="Google Maps" className="object-contain" />
                  <AvatarFallback className="bg-gray-700 text-gray-200">GM</AvatarFallback>
                </Avatar>
                <CardTitle className="text-base text-center text-white">Google Maps</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs bg-gray-700 text-gray-200">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-blue-500 transition-colors bg-gray-950 border-gray-800">
                <Avatar className="h-12 w-12 mb-3">
                  <AvatarImage src="/imgs/logos/apple_maps.png" alt="Apple Maps" className="object-contain" />
                  <AvatarFallback className="bg-gray-700 text-gray-200">AM</AvatarFallback>
                </Avatar>
                <CardTitle className="text-base text-center text-white">Apple Maps</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs bg-gray-700 text-gray-200">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-blue-500 transition-colors bg-gray-950 border-gray-800">
                <Avatar className="h-12 w-12 mb-3">
                  <AvatarImage src="/imgs/logos/yelp.png" alt="Yelp" className="object-contain" />
                  <AvatarFallback className="bg-gray-700 text-gray-200">Y</AvatarFallback>
                </Avatar>
                <CardTitle className="text-base text-center text-white">Yelp</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs bg-gray-700 text-gray-200">Coming Soon</Badge>
              </Card>
            </div>
          </div>

          {/* Website Integrations */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-center text-white">Website Platforms</h3>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="flex flex-col items-center justify-center p-6 hover:border-blue-500 transition-colors bg-gray-950 border-gray-800">
                <Code className="h-12 w-12 mb-3 text-blue-500" />
                <CardTitle className="text-base text-center text-white">iframe</CardTitle>
                <Badge variant="default" className="mt-2 text-xs">Available</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-blue-500 transition-colors bg-gray-950 border-gray-800">
                <Avatar className="h-12 w-12 mb-3">
                  <AvatarImage src="/imgs/logos/wix.png" alt="Wix" className="object-contain" />
                  <AvatarFallback className="bg-gray-700 text-gray-200">W</AvatarFallback>
                </Avatar>
                <CardTitle className="text-base text-center text-white">Wix</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs bg-gray-700 text-gray-200">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-blue-500 transition-colors bg-gray-950 border-gray-800">
                <Avatar className="h-12 w-12 mb-3">
                  <AvatarImage src="/imgs/logos/framer.png" alt="Framer" className="object-contain" />
                  <AvatarFallback className="bg-gray-700 text-gray-200">F</AvatarFallback>
                </Avatar>
                <CardTitle className="text-base text-center text-white">Framer</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs bg-gray-700 text-gray-200">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-blue-500 transition-colors bg-gray-950 border-gray-800">
                <Avatar className="h-12 w-12 mb-3">
                  <AvatarImage src="/imgs/logos/squarespace.png" alt="Squarespace" className="object-contain" />
                  <AvatarFallback className="bg-gray-700 text-gray-200">S</AvatarFallback>
                </Avatar>
                <CardTitle className="text-base text-center text-white">Squarespace</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs bg-gray-700 text-gray-200">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-blue-500 transition-colors bg-gray-950 border-gray-800">
                <Avatar className="h-12 w-12 mb-3">
                  <AvatarImage src="/imgs/logos/wordpress.png" alt="WordPress" className="object-contain" />
                  <AvatarFallback className="bg-gray-700 text-gray-200">WP</AvatarFallback>
                </Avatar>
                <CardTitle className="text-base text-center text-white">WordPress</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs bg-gray-700 text-gray-200">Coming Soon</Badge>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 hover:border-blue-500 transition-colors bg-gray-950 border-gray-800">
                <Avatar className="h-12 w-12 mb-3">
                  <AvatarImage src="/imgs/logos/webflow.png" alt="Webflow" className="object-contain" />
                  <AvatarFallback className="bg-gray-700 text-gray-200">WF</AvatarFallback>
                </Avatar>
                <CardTitle className="text-base text-center text-white">Webflow</CardTitle>
                <Badge variant="secondary" className="mt-2 text-xs bg-gray-700 text-gray-200">Coming Soon</Badge>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose the plan that works best for your business. No hidden fees, cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-2 hover:border-blue-500 transition-colors flex flex-col bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Monthly</CardTitle>
                <CardDescription className="text-gray-400">
                  Billed monthly, cancel anytime
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$5</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Unlimited hours updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Holiday reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Website embedding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Multi-business support</span>
                  </li>
                </ul>
                {!user ? (
                  <Button asChild size="lg" className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white border-gray-600" variant="outline">
                    <Link to="/login">Get Started</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white border-gray-600" variant="outline">
                    <Link to="/billing">View Plans</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-500 transition-colors border-blue-500/50 flex flex-col relative bg-gray-900 border-gray-700">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">Best Value</Badge>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-white">Annual</CardTitle>
                  <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full font-medium">
                    Save $10
                  </span>
                </div>
                <CardDescription className="text-gray-400">
                  Billed annually, best value
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$50</span>
                  <span className="text-gray-400">/year</span>
                </div>
                <div className="text-sm text-gray-400">
                  <span className="line-through">$60/year</span>
                  <span className="ml-2">Just $4.17/month</span>
                </div>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Everything in Monthly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Save $10 per year</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Priority support</span>
                  </li>
                </ul>
                {!user ? (
                  <Button asChild size="lg" className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white">
                    <Link to="/login">Get Started</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white">
                    <Link to="/billing">View Plans</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground relative h-[100vh] bg-cover bg-bottom bg-no-repeat"
        style={{ backgroundImage: 'url(/imgs/streetscape.jpg)' }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-gray-950 pointer-events-none"
        ></div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay'
          }}
        ></div>
        <div className="flex flex-col items-center justify-between h-full z-10">
          <div className="container mx-auto max-w-4xl text-center space-y-8 relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Get Started?</h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Join other business owners managing their hours with Hour Genie.
            </p>
            <div className="ml-4">
              <Badge className="bg-yellow-900 border-yellow-600 text-white text-xs shadow-md shadow-yellow-200/20">Coming Soon</Badge>
            </div>
            {/* {!user && (
              <Button asChild size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/login">Create Your Account</Link>
              </Button>
            )}
            {user && (
              <Button asChild size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/hours">Go to Dashboard</Link>
              </Button>
            )} */}
          </div>
          <div
            style={{
              backgroundImage: 'url(/imgs/are_you_open.jpg)',
              mixBlendMode: 'lighten'
            }}
            className="pointer-events-none bg-contain bg-center bg-no-repeat z-10 w-full max-w-4xl mx-auto aspect-video brightness-200"
          />
          <div className="pt-8 text-center text-sm text-gray-400 z-10">
            <p>&copy; {new Date().getFullYear()} Hour Genie. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
