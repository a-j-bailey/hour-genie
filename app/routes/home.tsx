import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hour Genie - Manage Your Business Hours" },
    { name: "description", content: "Easily manage and update your business operating hours" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full space-y-12">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              Hour Genie
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage your business operating hours with ease. Set, update, and share your hours in minutes.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild size="lg">
                <Link to="/login">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <Card>
              <CardHeader>
                <CardTitle>Easy Management</CardTitle>
                <CardDescription>
                  Set hours for each day of the week with an intuitive interface
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your business information is kept secure with enterprise-grade authentication
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Always Available</CardTitle>
                <CardDescription>
                  Update your hours anytime, anywhere with our cloud-based platform
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Hour Genie. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
