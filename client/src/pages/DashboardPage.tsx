import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { Building2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Welcome to Proply!</h1>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Getting Started</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the Property Analyzer or Rental Comparison tools to analyze and compare investment properties.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
