import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";

export default function PropertyAnalyzerPage() {
  const { user } = useUser();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Property Analyzer</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Analysis Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Property analysis tools will be added here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
