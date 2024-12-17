import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <p className="text-muted-foreground">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Subscription Status</label>
              <p className="text-muted-foreground capitalize">{user?.subscriptionStatus}</p>
            </div>
            {user?.subscriptionExpiryDate && (
              <div>
                <label className="text-sm font-medium">Subscription Expiry</label>
                <p className="text-muted-foreground">
                  {new Date(user.subscriptionExpiryDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
