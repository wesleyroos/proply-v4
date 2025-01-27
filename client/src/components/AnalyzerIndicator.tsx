import { Sparkles } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useProAccess } from "@/hooks/use-pro-access";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Link } from "wouter";

interface UseUserResult {
  user: {
    id: number;
    username: string;
    propertyAnalyzerUsage: number;
    subscriptionStatus: string;
  } | null;
  isLoading: boolean;
}

interface UseProAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
}

export default function AnalyzerIndicator() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user } = useUser() as UseUserResult;
  const { hasAccess } = useProAccess() as UseProAccessResult;

  if (hasAccess) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Analyses remaining: {3 - (user?.propertyAnalyzerUsage || 0)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUpgradeModal(true)}
          className="hover:bg-primary/90"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to Pro
        </Button>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Pro</DialogTitle>
            <DialogDescription>
              Get unlimited property analyses and advanced features
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pro users get access to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Unlimited property analyses</li>
              <li>Advanced market insights</li>
              <li>Detailed financial projections</li>
              <li>Portfolio management tools</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
              Cancel
            </Button>
            <Link href="/pricing">
              <Button>View Plans</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}