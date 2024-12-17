import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PropertyForm from "../components/PropertyForm";
import ComparisonChart from "../components/ComparisonChart";
import { useUser } from "../hooks/use-user";

export default function ComparisonPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [comparisonData, setComparisonData] = useState(null);

  const handleCompare = (data) => {
    if (user?.subscriptionStatus === "free") {
      setLocation("/subscription");
      return;
    }
    setComparisonData(data);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <nav className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          Back
        </Button>
        <h1 className="text-xl font-bold text-[#262626] ml-4">
          Property Comparison
        </h1>
      </nav>

      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <PropertyForm onSubmit={handleCompare} />
          </CardContent>
        </Card>

        {comparisonData && (
          <Card>
            <CardContent className="pt-6">
              <ComparisonChart data={comparisonData} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
