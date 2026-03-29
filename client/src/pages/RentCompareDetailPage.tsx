import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  TrendingUp,
  ArrowUpDown,
  Share2,
  Pencil,
} from "lucide-react";
import ComparisonChart from "@/components/ComparisonChart";
import { formatter } from "@/utils/formatting";

export default function RentCompareDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useUser();
  const [isSharing, setIsSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: property, isLoading, error } = useQuery({
    queryKey: ["/api/properties", id],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}`, {
        credentials: "include",
      });
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
      if (!res.ok) throw new Error("Failed to generate share link");
      const { token } = await res.json();
      const url = `${window.location.origin}/shared/rent-compare/${token}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share link copied to clipboard." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate share link." });
    } finally {
      setIsSharing(false);
    }
  };

  const handleOpenEdit = () => {
    setEditForm({
      title: property?.title || "",
      address: property?.address || "",
      bedrooms: property?.bedrooms || "",
      bathrooms: property?.bathrooms || "",
      longTermRental: property?.longTermRental || "",
      annualEscalation: property?.annualEscalation || "",
      shortTermNightly: property?.shortTermNightly || "",
      annualOccupancy: property?.annualOccupancy || "",
      managementFee: property?.managementFee ? String(Number(property.managementFee) * 100) : "",
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
      if (!res.ok) throw new Error("Failed to save");
      await queryClient.invalidateQueries({ queryKey: ["/api/properties", id] });
      setIsEditing(false);
      toast({ title: "Saved", description: "Property updated successfully." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading rent compare analysis...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="px-4 py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">
                Property not found or failed to load.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shortTermNightly = Number(property.shortTermNightly || 0);
  const annualOccupancy = Number(property.annualOccupancy || 0);
  const managementFee = Number(property.managementFee || 0);
  const longTermMonthly = Number(property.longTermMonthly || 0);
  const longTermAnnual = Number(property.longTermAnnual || 0);
  const shortTermMonthly = Number(property.shortTermMonthly || 0);
  const shortTermAnnual = Number(property.shortTermAnnual || 0);
  const shortTermAfterFees = Number(property.shortTermAfterFees || 0);
  const breakEvenOccupancy = Number(property.breakEvenOccupancy || 0);

  const platformFee = managementFee > 0 ? 15 : 3;
  const platformFeeAmount = shortTermAnnual * (platformFee / 100);
  const managementFeeAmount = managementFee > 0
    ? (shortTermAnnual - platformFeeAmount) * (managementFee / 100)
    : 0;

  const comparisonData = {
    title: property.title,
    longTermMonthly,
    shortTermMonthly,
    longTermAnnual,
    shortTermAnnual,
    shortTermAfterFees,
    breakEvenOccupancy,
    shortTermNightly,
    managementFee,
    annualOccupancy,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/properties">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Rent Compare Results</h1>
            <p className="text-muted-foreground mt-1">{property.title} — {property.address}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/rent-compare">
            <Button variant="outline">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              New Comparison
            </Button>
          </Link>
          <Button variant="outline" onClick={handleOpenEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleShare} disabled={isSharing}>
            <Share2 className="w-4 h-4 mr-2" />
            {isSharing ? "Generating..." : "Share"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top 2-column grid: property details + key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Bedrooms</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Bathrooms</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{property.bathrooms}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Long-Term Monthly Rental</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{formatter.format(longTermMonthly)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Short-Term Nightly Rate</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{formatter.format(shortTermNightly)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Annual Occupancy</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{annualOccupancy}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Analyzed {new Date(property.createdAt).toLocaleDateString("en-ZA", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">Short-Term Annual (gross)</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{formatter.format(shortTermAnnual)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Short-Term Annual (after fees)</p>
                <p className="mt-1 text-2xl font-bold text-green-700">{formatter.format(shortTermAfterFees)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Long-Term Annual</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{formatter.format(longTermAnnual)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Break-Even Occupancy</p>
                <p className={`mt-1 text-2xl font-bold ${breakEvenOccupancy < annualOccupancy ? "text-green-700" : "text-orange-600"}`}>
                  {breakEvenOccupancy.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {breakEvenOccupancy < annualOccupancy
                    ? "Short-term is more profitable at current occupancy"
                    : "Long-term may be more stable at current occupancy"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Fees</p>
                <p className="mt-1 text-sm text-slate-700">
                  Platform: {platformFee}%
                  {managementFee > 0 && ` · Management: ${(managementFee * 100).toFixed(1)}%`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Short-Term vs Long-Term Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonChart data={comparisonData} address={property.address} />
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Rent Compare Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Title</Label>
                <Input value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={editForm.address || ""} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <Label>Bedrooms</Label>
                <Input value={editForm.bedrooms || ""} onChange={e => setEditForm(f => ({ ...f, bedrooms: e.target.value }))} />
              </div>
              <div>
                <Label>Bathrooms</Label>
                <Input value={editForm.bathrooms || ""} onChange={e => setEditForm(f => ({ ...f, bathrooms: e.target.value }))} />
              </div>
              <div>
                <Label>Long-Term Monthly Rent (R)</Label>
                <Input type="number" value={editForm.longTermRental || ""} onChange={e => setEditForm(f => ({ ...f, longTermRental: e.target.value }))} />
              </div>
              <div>
                <Label>Annual Escalation (%)</Label>
                <Input type="number" value={editForm.annualEscalation || ""} onChange={e => setEditForm(f => ({ ...f, annualEscalation: e.target.value }))} />
              </div>
              <div>
                <Label>Short-Term Nightly Rate (R)</Label>
                <Input type="number" value={editForm.shortTermNightly || ""} onChange={e => setEditForm(f => ({ ...f, shortTermNightly: e.target.value }))} />
              </div>
              <div>
                <Label>Annual Occupancy (%)</Label>
                <Input type="number" value={editForm.annualOccupancy || ""} onChange={e => setEditForm(f => ({ ...f, annualOccupancy: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Management Fee (%)</Label>
                <Input type="number" step="0.1" value={editForm.managementFee || ""} onChange={e => setEditForm(f => ({ ...f, managementFee: e.target.value }))} />
                <p className="text-xs text-muted-foreground mt-1">Enter 0 for no management fee. E.g. enter 20 for 20%. Platform fee (3% or 15%) is set automatically.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
