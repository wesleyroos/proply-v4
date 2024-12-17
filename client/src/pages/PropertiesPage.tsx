import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PropertiesPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">My Properties</h1>
      <Card>
        <CardHeader>
          <CardTitle>Property Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your analyzed properties will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
