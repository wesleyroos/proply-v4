import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, ArrowLeft, Share2, Pencil, FileText, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import RentCompareReport from "@/components/RentCompareReport";
import { generateRentComparePDF } from "@/utils/rentComparePDF";

export default function RentCompareDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useUser();
  const [isSharing, setIsSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: property, isLoading, error } = useQuery({
    queryKey: ["/api/properties", id],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch property");
      return res.json();
    },
    enabled: !!id,
  });

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await fetch(`/api/properties/${id}/share`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      await navigator.clipboard.writeText(`${window.location.origin}/shared/rent-compare/${token}`);
      toast({ title: "Link copied!", description: "Share link copied to clipboard." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate share link." });
    } finally {
      setIsSharing(false);
    }
  };

  const handleOpenEdit = () => {
    setEditForm({
      title:           property?.title || "",
      address:         property?.address || "",
      bedrooms:        property?.bedrooms || "",
      bathrooms:       property?.bathrooms || "",
      longTermRental:  property?.longTermRental || "",
      annualEscalation:property?.annualEscalation || "",
      shortTermNightly:property?.shortTermNightly || "",
      annualOccupancy: property?.annualOccupancy || "",
      managementFee:   property?.managementFee
        ? String(Number(property.managementFee) * 100)
        : "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: ["/api/properties", id] });
      setIsEditing(false);
      toast({ title: "Saved", description: "Property updated successfully." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!property) return;
    setIsExporting(true);
    try {
      await generateRentComparePDF(property, user?.settings?.companyLogo || undefined);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">Loading analysis...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">Property not found or failed to load.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* ── Sticky action bar ── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/properties">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Properties
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/rent-compare">
              <Button variant="outline" size="sm" className="gap-1.5 hidden sm:inline-flex">
                <ArrowUpDown className="h-3.5 w-3.5" />
                New Comparison
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleOpenEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare} disabled={isSharing}>
              <Share2 className="h-3.5 w-3.5" />
              {isSharing ? "Copying…" : "Share"}
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-slate-800 hover:bg-slate-700 text-white"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              <FileText className="h-3.5 w-3.5" />
              {isExporting ? "Generating…" : "Export PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Report content ── */}
      <div className="px-4 sm:px-6 py-8">
        <RentCompareReport property={property} />
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Title</Label>
                <Input
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <Label>Bedrooms</Label>
                <Input
                  value={editForm.bedrooms || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, bedrooms: e.target.value }))}
                />
              </div>
              <div>
                <Label>Bathrooms</Label>
                <Input
                  value={editForm.bathrooms || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, bathrooms: e.target.value }))}
                />
              </div>
              <div>
                <Label>Long-Term Monthly Rent (R)</Label>
                <Input
                  type="number"
                  value={editForm.longTermRental || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, longTermRental: e.target.value }))}
                />
              </div>
              <div>
                <Label>Annual Escalation (%)</Label>
                <Input
                  type="number"
                  value={editForm.annualEscalation || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, annualEscalation: e.target.value }))}
                />
              </div>
              <div>
                <Label>Short-Term Nightly Rate (R)</Label>
                <Input
                  type="number"
                  value={editForm.shortTermNightly || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, shortTermNightly: e.target.value }))}
                />
              </div>
              <div>
                <Label>Annual Occupancy (%)</Label>
                <Input
                  type="number"
                  value={editForm.annualOccupancy || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, annualOccupancy: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <Label>Management Fee (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.managementFee || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, managementFee: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter 0 for no management fee. E.g. enter 20 for 20%. Platform fee (3% or 15%) is set automatically.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
