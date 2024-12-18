import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AccessCode {
  id: number;
  code: string;
  isUsed: boolean;
  createdAt: string;
  usedAt: string | null;
  usedBy: number | null;
  expiresAt: string | null;
}

export default function AccessCodePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expiryDays, setExpiryDays] = useState("30");

  const { data: accessCodes, isLoading } = useQuery<AccessCode[]>({
    queryKey: ["/api/access-codes"],
  });

  const generateMutation = useMutation({
    mutationFn: async (expiryDays: string) => {
      const res = await fetch("/api/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiryDays: parseInt(expiryDays) }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-codes"] });
      toast({
        title: "Success",
        description: "Access code generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Access Code Management</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Access Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-2 block">
                  Expiry (days)
                </label>
                <Input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  min="1"
                  max="365"
                />
              </div>
              <Button 
                onClick={() => generateMutation.mutate(expiryDays)}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Code'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4">Code</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Created</th>
                      <th className="text-left p-4">Expires</th>
                      <th className="text-left p-4">Used By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessCodes?.map((code) => (
                      <tr key={code.id} className="border-b">
                        <td className="p-4 font-mono">{code.code}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            code.isUsed 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {code.isUsed ? 'Used' : 'Available'}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(code.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {code.expiresAt 
                            ? new Date(code.expiresAt).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {code.usedBy || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
