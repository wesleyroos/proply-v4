import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "../hooks/use-user";

export default function HomePage() {
  const { user, logout } = useUser();

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <nav className="flex justify-between items-center mb-8">
        <img src="/proply-logo.png" alt="Proply" className="h-8" />
        <Button variant="ghost" onClick={() => logout()}>
          Logout
        </Button>
      </nav>

      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-[#262626]">
          Welcome back, {user?.username}
        </h1>
        
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Property Investment Tools</h2>
            <div className="space-y-4">
              <Link href="/compare">
                <Button className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]">
                  Compare Properties
                </Button>
              </Link>
              
              <Link href="/subscription">
                <Button variant="outline" className="w-full">
                  Manage Subscription
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
