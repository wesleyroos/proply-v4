import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ImageSyncTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/propdata/listings/2520145/fetch-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.text();
      setResult(data);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Button onClick={fetchImages} disabled={isLoading}>
        {isLoading ? "Fetching Images..." : "Fetch Images for 2520145"}
      </Button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm">
          {result}
        </pre>
      )}
    </div>
  );
}