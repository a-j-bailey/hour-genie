import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useBusiness } from "~/lib/business-context";
import { useAuth } from "~/lib/use-auth";
import { Copy, Check } from "lucide-react";

interface IntegrationConfig {
  css?: string;
  showSeparators?: boolean;
  style?: "expanded" | "condensed";
}

export function IframeConfig() {
  const { session } = useAuth();
  const { selectedBusiness, selectedBusinessId } = useBusiness();
  const apiUrl = import.meta.env.VITE_API_URL || "";
  
  const [css, setCss] = useState("");
  const [showSeparators, setShowSeparators] = useState(true);
  const [style, setStyle] = useState<"expanded" | "condensed">("expanded");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Load existing integration config
  useEffect(() => {
    if (!selectedBusinessId || !session?.access_token) {
      return;
    }

    const loadConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${apiUrl}/api/businesses/${selectedBusinessId}/integrations/iframe`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.config?.css !== undefined) {
            setCss(data.config.css);
          }
          if (data.config?.showSeparators !== undefined) {
            setShowSeparators(data.config.showSeparators);
          } else {
            setShowSeparators(true); // Default to true
          }
          if (data.config?.style) {
            setStyle(data.config.style);
          } else {
            setStyle("expanded"); // Default to expanded
          }
        }
      } catch (err) {
        if (err instanceof Response && err.status != 404) {
          console.error("Error loading config:", err);
          const errorMessage = "Failed to load integration configuration";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [selectedBusinessId, session, apiUrl]);

  const handleSave = async () => {
    if (!selectedBusinessId || !session?.access_token) {
      setError("No business selected");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${apiUrl}/api/businesses/${selectedBusinessId}/integrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            integration_type: "iframe",
            config: {
              css: css || "",
              showSeparators: showSeparators,
              style: style,
            },
          }),
        }
      );

      if (response.ok) {
        setSuccess("Configuration saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
        // Refresh the iframe preview
        setIframeKey((prev) => prev + 1);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to save configuration";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error saving config:", err);
      const errorMessage = "Failed to save configuration";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getEmbedCode = () => {
    if (!selectedBusinessId) {
      return "";
    }
    // Use API URL for the iframe src since the API serves the complete HTML document
    const embedUrl = apiUrl || window.location.origin;
    return `<iframe
  src="${embedUrl}/api/embed/hours?id=${selectedBusinessId}"
  width="560"
  height="315"
  frameborder="0">
</iframe>`;
  };

  const handleCopy = async () => {
    const embedCode = getEmbedCode();
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError("Failed to copy embed code");
    }
  };

  if (!selectedBusiness) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Iframe Embed Configuration</CardTitle>
          <CardDescription>Please select a business to configure the iframe embed.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Embed Code</CardTitle>
          <CardDescription>
            Copy this code and paste it into your website to display your business hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <textarea
              readOnly
              value={getEmbedCode()}
              className="w-full h-38 p-3 font-mono text-sm bg-muted rounded-md border resize-none"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Styling</CardTitle>
          <CardDescription>
            Customize the appearance of the embedded widget using CSS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Style</Label>
              <RadioGroup value={style} onValueChange={(value) => setStyle(value as "expanded" | "condensed")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expanded" id="style-expanded" />
                  <Label htmlFor="style-expanded" className="font-normal cursor-pointer">
                    Expanded (show all days)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="condensed" id="style-condensed" />
                  <Label htmlFor="style-condensed" className="font-normal cursor-pointer">
                    Condensed (group consecutive days)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-separators"
                  checked={showSeparators}
                  onCheckedChange={(checked) => setShowSeparators(checked === true)}
                />
                <Label htmlFor="show-separators">Show day separators</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="css-input">Custom CSS</Label>
            <textarea
              id="css-input"
              value={css}
              onChange={(e) => setCss(e.target.value)}
              placeholder=".hour-genie-widget {&#10;  font-family: 'Arial', sans-serif;&#10;  color: #333;&#10;}&#10;.hour-genie-widget td:last-child {&#10;  color: #666;&#10;}"
              className="w-full h-64 p-3 font-mono text-sm border rounded-md resize-y"
            />
            <p className="text-sm text-muted-foreground">
              Add custom CSS to style the widget. The widget uses the class <code className="px-1 py-0.5 bg-muted rounded">.hour-genie-widget</code>
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Preview</Label>
              <p className="text-sm text-muted-foreground">
                Save to see your changes reflected in the preview below.
              </p>
              <div className="border rounded-md p-4 bg-white dark:bg-gray-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px]">
                {selectedBusinessId && (
                  <iframe
                    key={iframeKey}
                    src={`${apiUrl}/api/embed/hours?id=${selectedBusinessId}`}
                    width="100%"
                    height="400"
                    style={{ border: "none", borderRadius: "4px" }}
                    title="Widget Preview"
                    allowTransparency={true}
                  />
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md dark:text-green-400 dark:bg-green-950 dark:border-green-800">
              {success}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

