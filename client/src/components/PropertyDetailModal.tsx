import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  Bed,
  Bath,
  Car,
  Ruler,
  Map,
  DollarSign,
  Calendar,
  Phone,
  User,
  Image as ImageIcon,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  Loader2,
  MessageCircle,
  Send,
  Edit,
  Check,
  MapPin,
  TrendingUp,
  Calculator,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { initGoogleMaps } from "@/lib/maps";

// Utility function to create optimized image URLs for faster loading
const createOptimizedImageUrl = (
  originalUrl: string,
  size: "thumbnail" | "medium" | "large" = "thumbnail",
) => {
  if (!originalUrl) return originalUrl;

  // Use server-side image optimization endpoint for better performance
  const sizeParams = {
    thumbnail: { width: 200, height: 200, quality: 60 },
    medium: { width: 500, height: 500, quality: 75 },
    large: { width: 800, height: 800, quality: 85 },
  };

  const params = sizeParams[size];
  const encodedUrl = encodeURIComponent(originalUrl);
  return `/api/optimize-image?url=${encodedUrl}&width=${params.width}&height=${params.height}&quality=${params.quality}`;
};

interface PropertyLocation {
  latitude?: number;
  longitude?: number;
  suburb?: string;
  city?: string;
  province?: string;
}

// Define PropData listing type based on our database structure
export interface PropertyDetailListing {
  id: number;
  propdataId: string;
  agencyId: number;
  status: string;
  address: string;
  price: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number | null;
  floorSize: number | null;
  landSize: number | null;
  agentId: string | null;
  agentName: string | null;
  agentEmail: string | null;
  agentPhone: string | null;
  monthlyLevy: number | null;
  sectionalTitleLevy: number | null;
  specialLevy: number | null;
  homeOwnerLevy: number | null;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
  // Optional fields that might be nested in JSON
  images?: string[];
  location?: PropertyLocation;
  features?: string[];
  listingData?: any; // The raw PropData data
  // Agency branch information
  franchiseName?: string;
  branchName?: string;
}

interface PropertyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyDetailListing | null;
}

export default function PropertyDetailModal({
  isOpen,
  onClose,
  property,
}: PropertyDetailModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [valuationReport, setValuationReport] = useState<any>(null);
  const [savedValuationData, setSavedValuationData] = useState<any>(null);
  const [rentalData, setRentalData] = useState<any>(null);
  const [isLoadingRental, setIsLoadingRental] = useState(false);
  const [selectedPercentile, setSelectedPercentile] = useState<
    "percentile25" | "percentile50" | "percentile75" | "percentile90"
  >("percentile50");
  const [generationTimer, setGenerationTimer] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      newEstimate?: { min: number; max: number };
    }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [hasNewEstimate, setHasNewEstimate] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
  const [financingParams, setFinancingParams] = useState({
    depositPercentage: 10,
    interestRate: 10.75,
    loanTermYears: 20,
  });
  const [tempFinancingParams, setTempFinancingParams] = useState({
    depositPercentage: 10,
    interestRate: 10.75,
    loanTermYears: 20,
  });

  // Timer effect for generation counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGeneratingReport) {
      setGenerationTimer(0);
      interval = setInterval(() => {
        setGenerationTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGeneratingReport]);

  // Reset valuation report when property changes or modal closes, and load existing valuation
  useEffect(() => {
    setValuationReport(null);
    setSavedValuationData(null);
    setRentalData(null); // Clear rental data when switching properties
    setSelectedPercentile("percentile50"); // Reset to default percentile
    setActiveTab("overview");
    setGenerationTimer(0);
    setIsChatOpen(false);
    setChatMessages([]);
    setHasNewEstimate(false);
    setIsEditingAddress(false);
    setEditedAddress(property?.address || "");

    // Load existing valuation if property is available
    if (property?.propdataId && isOpen) {
      loadExistingValuation(property.propdataId);
      loadExistingRentalData(property.propdataId);
    }
  }, [property?.propdataId, isOpen]);

  // Google Maps initialization - using PropertyMap.tsx pattern
  useEffect(() => {
    if (!isOpen || !property?.address || activeTab !== "overview") return;

    let isMounted = true;

    const initializeMap = async () => {
      try {
        await initGoogleMaps();

        if (!isMounted || !mapRef.current) return;

        const geocoder = new window.google.maps.Geocoder();
        const defaultLocation = { lat: -33.918861, lng: 18.4233 };

        const map = new window.google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 15,
          mapTypeId: window.google.maps.MapTypeId.SATELLITE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        });

        geocoder.geocode(
          { address: property.address },
          (results: any, status: any) => {
            if (status === "OK" && results?.[0]) {
              const location = results[0].geometry.location;
              map.setCenter(location);
              map.setZoom(16);

              new window.google.maps.Marker({
                map,
                position: location,
                title: "Property Location",
              });
              setMapLoaded(true);
            } else {
              console.error("Geocoding failed:", status);
            }
          },
        );
      } catch (error) {
        console.error("Map initialization error:", error);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      setMapLoaded(false);
    };
  }, [isOpen, property?.address, activeTab]);

  // Load existing valuation from database
  const loadExistingValuation = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/valuation-reports/${propertyId}`);
      if (response.ok) {
        const savedValuation = await response.json();
        setValuationReport(savedValuation.valuationData);
        setSavedValuationData(savedValuation); // Store the complete saved data including calculated fields
      }
      // If 404, no existing valuation - that's fine
    } catch (error) {
      console.error("Error loading existing valuation:", error);
    }
  };

  // Load existing rental data from database
  const loadExistingRentalData = async (propertyId: string) => {
    console.log("Loading rental data for property ID:", propertyId);
    try {
      const response = await fetch(`/api/rental-performance/${propertyId}`, {
        credentials: "include",
      });

      console.log("Rental data response status:", response.status);

      if (response.ok) {
        const rawRentalData = await response.json();
        console.log("Raw rental data received:", rawRentalData);

        // Transform database format to frontend format
        let shortTermData = null;
        if (rawRentalData.short_term_data) {
          const parsedData =
            typeof rawRentalData.short_term_data === "string"
              ? JSON.parse(rawRentalData.short_term_data)
              : rawRentalData.short_term_data;

          // Clean up infinity values in short-term data
          if (
            parsedData &&
            typeof parsedData.yield === "number" &&
            !isFinite(parsedData.yield)
          ) {
            parsedData.yield = null;
          }
          shortTermData = parsedData;
        }

        const transformedData = {
          shortTerm: shortTermData,
          longTerm: rawRentalData.long_term_min_rental
            ? {
                minRental: parseFloat(rawRentalData.long_term_min_rental),
                maxRental: parseFloat(rawRentalData.long_term_max_rental),
                minYield:
                  rawRentalData.long_term_min_yield &&
                  rawRentalData.long_term_min_yield !== "Infinity"
                    ? parseFloat(rawRentalData.long_term_min_yield)
                    : null,
                maxYield:
                  rawRentalData.long_term_max_yield &&
                  rawRentalData.long_term_max_yield !== "Infinity"
                    ? parseFloat(rawRentalData.long_term_max_yield)
                    : null,
                managementFee: "8-10%",
                reasoning: rawRentalData.long_term_reasoning,
              }
            : null,
        };

        console.log("Transformed rental data:", transformedData);
        setRentalData(transformedData);
      } else {
        console.log("No rental data found for property:", propertyId);
      }
    } catch (error) {
      console.error("Error loading existing rental data:", error);
    }
  };

  // Save valuation to database
  const saveValuationToDatabase = async (valuationData: any) => {
    if (!property) return;

    try {
      const saveData = {
        propertyId: property.propdataId,
        address: property.address,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        floorSize: property.floorSize,
        landSize: property.landSize,
        propertyType: property.propertyType,
        parkingSpaces: property.parkingSpaces,
        valuationData,
        imagesAnalyzed: 10,
      };

      const response = await fetch("/api/valuation-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save valuation: ${response.statusText}`);
      }

      console.log("Valuation saved to database successfully");
    } catch (error) {
      console.error("Error saving valuation to database:", error);
    }
  };

  // Get property images
  const getPropertyImages = () => {
    if (!property) return [];

    const images: string[] = [];

    // First, try to get images from the stored images array (already processed)
    if (property.images) {
      // Handle both parsed arrays and JSON strings from database
      if (Array.isArray(property.images)) {
        return property.images;
      } else if (typeof property.images === "string") {
        try {
          const parsedImages = JSON.parse(property.images);
          if (Array.isArray(parsedImages)) {
            return parsedImages;
          }
        } catch (e) {
          console.error("Failed to parse images JSON:", e);
        }
      }
    }

    // If not available, extract from listingData
    if (property.listingData) {
      // Get header images (hero shots)
      if (
        property.listingData.header_images &&
        Array.isArray(property.listingData.header_images)
      ) {
        property.listingData.header_images.forEach((img: any) => {
          if (typeof img === "string") {
            images.push(img);
          } else if (img && img.image) {
            images.push(img.image);
          }
        });
      }

      // Get listing images (full gallery)
      if (
        property.listingData.listing_images &&
        Array.isArray(property.listingData.listing_images)
      ) {
        property.listingData.listing_images.forEach((img: any) => {
          if (typeof img === "string") {
            images.push(img);
          } else if (img && img.image) {
            images.push(img.image);
          }
        });
      }
    }

    return images;
  };

  const propertyImages = getPropertyImages();

  // Helper functions for dynamic calculations
  const getSelectedShortTermData = () => {
    if (!rentalData?.shortTerm) return null;
    return rentalData.shortTerm[selectedPercentile];
  };

  const calculateDynamicYield = () => {
    const selectedData = getSelectedShortTermData();
    if (!selectedData || !property?.price || property.price === 0) return null;
    return parseFloat(
      ((selectedData.annual / property.price) * 100).toFixed(1),
    );
  };

  // Calculate long-term yields dynamically based on current rental data
  const calculateLongTermYield = () => {
    if (!rentalData?.longTerm || !property?.price || property.price === 0)
      return { min: null, max: null };
    const propertyPrice = parseFloat(property.price.toString());
    const minAnnualRental = rentalData.longTerm.minRental * 12;
    const maxAnnualRental = rentalData.longTerm.maxRental * 12;

    return {
      min: parseFloat(((minAnnualRental / propertyPrice) * 100).toFixed(1)),
      max: parseFloat(((maxAnnualRental / propertyPrice) * 100).toFixed(1)),
    };
  };

  // Calculate which rental strategy is recommended based on dynamic yields
  const getRecommendedStrategy = () => {
    if (!rentalData?.shortTerm || !rentalData?.longTerm) return null;

    const shortTermYield = calculateDynamicYield();
    const longTermYield = calculateLongTermYield();

    // If yields can't be calculated (valuation property), don't recommend a strategy
    if (shortTermYield === null || longTermYield.max === null) return null;

    return shortTermYield > longTermYield.max ? "shortTerm" : "longTerm";
  };

  const recommendedStrategy = getRecommendedStrategy();

  // Chat functionality for contesting rental estimates
  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setIsChatLoading(true);

    // Add user message to chat
    const newMessages = [
      ...chatMessages,
      { role: "user" as const, content: userMessage },
    ];
    setChatMessages(newMessages);

    try {
      const response = await fetch("/api/contest-rental-estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          propertyId: property?.propdataId,
          currentEstimate: {
            min: rentalData?.longTerm?.minRental,
            max: rentalData?.longTerm?.maxRental,
            reasoning: rentalData?.longTerm?.reasoning,
          },
          propertyDetails: {
            address: property?.address,
            bedrooms: property?.bedrooms,
            bathrooms: property?.bathrooms,
            floorSize: property?.floorSize,
            propertyType: property?.propertyType,
            price: property?.price,
          },
          userFeedback: userMessage,
          conversationHistory: newMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const aiResponse = await response.json();

      const assistantMessage = {
        role: "assistant" as const,
        content: aiResponse.response,
        newEstimate: aiResponse.newEstimate
          ? {
              min: aiResponse.newEstimate.min,
              max: aiResponse.newEstimate.max,
            }
          : undefined,
      };

      setChatMessages([...newMessages, assistantMessage]);

      if (aiResponse.newEstimate) {
        setHasNewEstimate(true);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      setChatMessages([
        ...newMessages,
        {
          role: "assistant" as const,
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const saveUpdatedEstimate = async () => {
    const latestMessageWithEstimate = chatMessages
      .reverse()
      .find((msg) => msg.newEstimate);
    if (!latestMessageWithEstimate?.newEstimate) return;

    try {
      const response = await fetch(
        `/api/rental-performance/${property?.propdataId}/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            longTerm: {
              ...rentalData.longTerm,
              minRental: latestMessageWithEstimate.newEstimate.min,
              maxRental: latestMessageWithEstimate.newEstimate.max,
              reasoning: `Updated based on user feedback: ${latestMessageWithEstimate.content}`,
            },
          }),
        },
      );

      if (response.ok) {
        // Update local data
        setRentalData({
          ...rentalData,
          longTerm: {
            ...rentalData.longTerm,
            minRental: latestMessageWithEstimate.newEstimate.min,
            maxRental: latestMessageWithEstimate.newEstimate.max,
          },
        });
        setIsChatOpen(false);
        setChatMessages([]);
        setHasNewEstimate(false);
      }
    } catch (error) {
      console.error("Error saving updated estimate:", error);
    }
  };

  const saveAddressUpdate = async () => {
    if (!property?.propdataId || !editedAddress.trim()) return;

    setIsSavingAddress(true);
    try {
      const response = await fetch(
        `/api/properties/${property.propdataId}/address`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            address: editedAddress.trim(),
          }),
        },
      );

      if (response.ok) {
        const updatedProperty = await response.json();

        // Update local property data
        if (property) {
          property.address = editedAddress.trim();
        }
        setIsEditingAddress(false);

        // Reinitialize map with new address if needed
        if (mapRef.current && window.google) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ address: editedAddress }, (results, status) => {
            if (status === "OK" && results?.[0] && mapRef.current) {
              const map = new window.google.maps.Map(mapRef.current, {
                zoom: 15,
                center: results[0].geometry.location,
                mapTypeId: window.google.maps.MapTypeId.ROADMAP,
              });
              new window.google.maps.Marker({
                position: results[0].geometry.location,
                map: map,
              });
            }
          });
        }

        // Invalidate the property listings query to refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/propdata/listings"] });
      }
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Arrow key navigation for full-screen viewer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFullScreenOpen || propertyImages.length === 0) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setFullScreenImageIndex((prev) =>
          prev === 0 ? propertyImages.length - 1 : prev - 1,
        );
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setFullScreenImageIndex((prev) =>
          prev === propertyImages.length - 1 ? 0 : prev + 1,
        );
      } else if (event.key === "Escape") {
        event.preventDefault();
        setIsFullScreenOpen(false);
      }
    };

    if (isFullScreenOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isFullScreenOpen, propertyImages.length]);

  if (!property) return null;

  const openFullScreen = (index: number) => {
    setFullScreenImageIndex(index);
    setIsFullScreenOpen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreenOpen(false);
  };

  const nextFullScreenImage = () => {
    setFullScreenImageIndex((prev) =>
      prev === propertyImages.length - 1 ? 0 : prev + 1,
    );
  };

  const prevFullScreenImage = () => {
    setFullScreenImageIndex((prev) =>
      prev === 0 ? propertyImages.length - 1 : prev - 1,
    );
  };

  const generateValuationReport = async () => {
    if (!property) return;

    setIsGeneratingReport(true);
    try {
      const requestData = {
        address: property.address,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parkingSpaces,
        floorSize: property.floorSize,
        landSize: property.landSize,
        price: property.price,
        monthlyLevy:
          property.monthlyLevy ||
          property.sectionalTitleLevy ||
          property.homeOwnerLevy,
        images: propertyImages.slice(0, 10), // Analyze first 10 images for comprehensive coverage
        location: property.location,
        propertyId: property.propdataId, // Use PropData property ID for rental data persistence
      };

      const response = await fetch("/api/generate-valuation-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const report = await response.json();
      setValuationReport(report);

      // Set rental performance data if available
      if (report.rentalPerformance) {
        setRentalData(report.rentalPerformance);
      }

      // Save the valuation report to database
      await saveValuationToDatabase(report);
    } catch (error) {
      console.error("Error generating valuation report:", error);
      alert("Failed to generate valuation report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Display exactly 8 images
  const imagesPerView = 8;

  // Render Financing Analysis content
  const renderFinancingAnalysis = () => {
    if (!property) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            Property data required for financing analysis
          </p>
        </div>
      );
    }

    // Financing parameters - using dynamic state
    const propertyPrice = parseFloat(property.price.toString());
    const depositPercentage = financingParams.depositPercentage / 100;
    const loanToValue = 1 - depositPercentage;
    const interestRate = financingParams.interestRate / 100;
    const loanTermYears = financingParams.loanTermYears;
    const loanTermMonths = loanTermYears * 12;

    // Calculate loan amount and monthly payment
    const depositAmount = propertyPrice * depositPercentage;
    const loanAmount = propertyPrice * loanToValue;
    const monthlyInterestRate = interestRate / 12;

    // Monthly payment calculation using standard mortgage formula
    const monthlyPayment =
      (loanAmount *
        (monthlyInterestRate *
          Math.pow(1 + monthlyInterestRate, loanTermMonths))) /
      (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);

    // Calculate financing metrics for each year
    const calculateFinancingMetrics = (year: number) => {
      const monthsElapsed = year * 12;
      let remainingBalance = loanAmount;
      let totalPrincipalPaid = 0;

      // Calculate principal paid and remaining balance
      for (
        let month = 1;
        month <= monthsElapsed && month <= loanTermMonths;
        month++
      ) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        totalPrincipalPaid += principalPayment;
        remainingBalance -= principalPayment;
      }

      return {
        monthlyPayment,
        equityBuildup: totalPrincipalPaid,
        remainingBalance: Math.max(0, remainingBalance),
      };
    };

    const years = [1, 2, 3, 4, 5, 10, 20];

    return (
      <div className="space-y-4">
        {/* Financing Assumptions */}
        <div className="bg-gray-50 p-2 rounded-lg text-xs">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
            <div>
              <span className="text-muted-foreground">Deposit:</span>
              <div className="font-medium">
                {formatCurrency(depositAmount)} (
                {financingParams.depositPercentage}%)
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Loan Amount:</span>
              <div className="font-medium">{formatCurrency(loanAmount)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Interest Rate:</span>
              <div className="font-medium">{financingParams.interestRate}%</div>
            </div>
            <div>
              <span className="text-muted-foreground">Term:</span>
              <div className="font-medium">
                {financingParams.loanTermYears} years
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setTempFinancingParams(financingParams);
                  setIsFinancingModalOpen(true);
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Financing Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">
                  Financing Metric
                </th>
                {years.map((year) => (
                  <th key={year} className="text-center py-2 px-3 font-medium">
                    Year {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Monthly Bond Payment */}
              <tr className="border-b hover:bg-gray-50/50">
                <td className="py-2 px-3 font-medium">Monthly Bond Payment</td>
                {years.map((year) => {
                  const metrics = calculateFinancingMetrics(year);
                  return (
                    <td key={year} className="text-center py-2 px-3">
                      {formatCurrency(metrics.monthlyPayment)}
                    </td>
                  );
                })}
              </tr>

              {/* Equity Build-up */}
              <tr className="border-b hover:bg-green-50/50">
                <td className="py-2 px-3 font-medium text-green-600">
                  Equity Build-up
                </td>
                {years.map((year) => {
                  const metrics = calculateFinancingMetrics(year);
                  return (
                    <td key={year} className="text-center py-2 px-3">
                      {formatCurrency(metrics.equityBuildup)}
                    </td>
                  );
                })}
              </tr>

              {/* Remaining Loan Balance */}
              <tr className="border-b hover:bg-red-50/50">
                <td className="py-2 px-3 font-medium text-red-600">
                  Remaining Loan Balance
                </td>
                {years.map((year) => {
                  const metrics = calculateFinancingMetrics(year);
                  return (
                    <td key={year} className="text-center py-2 px-3">
                      {formatCurrency(metrics.remainingBalance)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financing Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Equity Build-up vs Loan Balance
            </CardTitle>
            <CardDescription>
              Visualization of loan paydown and equity accumulation over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={years.map((year) => {
                    const metrics = calculateFinancingMetrics(year);
                    return {
                      year: `Year ${year}`,
                      equityBuildup: metrics.equityBuildup,
                      remainingBalance: metrics.remainingBalance,
                      totalLoanAmount: loanAmount,
                    };
                  })}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis
                    tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "equityBuildup"
                        ? "Equity Built"
                        : "Remaining Balance",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="equityBuildup"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Equity Built"
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="remainingBalance"
                    stroke="#EF4444"
                    strokeWidth={3}
                    name="Remaining Balance"
                    dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render Cash Flow Analysis content
  const renderCashflowAnalysis = () => {
    if (!rentalData || !property) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            Generate rental performance data first to view cash flow analysis
          </p>
        </div>
      );
    }

    // Calculate metrics for both strategies
    const calculateMetrics = (isShortTerm: boolean) => {
      const propertyPrice = parseFloat(property.price.toString());

      if (isShortTerm && rentalData.shortTerm) {
        const selectedData = rentalData.shortTerm[selectedPercentile];
        const monthlyGrossIncome = selectedData.monthly;
        const annualGrossIncome = selectedData.annual;
        const grossRentalYield = (annualGrossIncome / propertyPrice) * 100;

        return {
          monthlyGrossIncome,
          annualGrossIncome,
          grossRentalYield,
          strategy: "Short-term Rental",
        };
      } else if (!isShortTerm && rentalData.longTerm) {
        const monthlyGrossIncome =
          (rentalData.longTerm.minRental + rentalData.longTerm.maxRental) / 2;
        const annualGrossIncome = monthlyGrossIncome * 12;
        const grossRentalYield = (annualGrossIncome / propertyPrice) * 100;

        return {
          monthlyGrossIncome,
          annualGrossIncome,
          grossRentalYield,
          strategy: "Long-term Rental",
        };
      }

      return null;
    };

    const shortTermMetrics = calculateMetrics(true);
    const longTermMetrics = calculateMetrics(false);

    // Calculate 5-year revenue growth (8% annual growth)
    const calculateRevenueGrowth = (baseAnnual: number) => {
      return [1, 2, 3, 4, 5].map((year) => ({
        year,
        revenue: baseAnnual * Math.pow(1.08, year - 1),
      }));
    };

    return (
      <div className="space-y-6">
        {/* Revenue Growth Projections Table */}
        {(shortTermMetrics || longTermMetrics) && (
          <div>
            <div className="mb-3">
              <h3 className="text-base font-semibold">
                5-Year Revenue Growth Trajectory
              </h3>
              <p className="text-xs text-muted-foreground">
                Projected annual revenue and yields with 8% market growth
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs border rounded-lg">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium">
                      Strategy
                    </th>
                    {[1, 2, 3, 4, 5].map((year) => (
                      <th
                        key={year}
                        className="text-center py-2 px-3 font-medium"
                      >
                        Year {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Short-term Revenue Row */}
                  {shortTermMetrics && (
                    <>
                      <tr className="border-b hover:bg-blue-50/50">
                        <td className="py-2 px-3 font-medium text-blue-600">
                          Short-term Revenue
                        </td>
                        {calculateRevenueGrowth(
                          shortTermMetrics.annualGrossIncome,
                        ).map(({ year, revenue }) => (
                          <td key={year} className="text-center py-2 px-3">
                            {formatCurrency(revenue)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-blue-50/50">
                        <td className="py-2 px-3 font-medium text-blue-600">
                          Short-term Gross Yield
                        </td>
                        {calculateRevenueGrowth(
                          shortTermMetrics.annualGrossIncome,
                        ).map(({ year, revenue }) => (
                          <td key={year} className="text-center py-2 px-3">
                            {(
                              (revenue /
                                parseFloat(property.price.toString())) *
                              100
                            ).toFixed(1)}
                            %
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {/* Long-term Revenue Row */}
                  {longTermMetrics && (
                    <>
                      <tr className="border-b hover:bg-green-50/50">
                        <td className="py-2 px-3 font-medium text-green-600">
                          Long-term Revenue
                        </td>
                        {calculateRevenueGrowth(
                          longTermMetrics.annualGrossIncome,
                        ).map(({ year, revenue }) => (
                          <td key={year} className="text-center py-2 px-3">
                            {formatCurrency(revenue)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-green-50/50">
                        <td className="py-2 px-3 font-medium text-green-600">
                          Long-term Gross Yield
                        </td>
                        {calculateRevenueGrowth(
                          longTermMetrics.annualGrossIncome,
                        ).map(({ year, revenue }) => (
                          <td key={year} className="text-center py-2 px-3">
                            {(
                              (revenue /
                                parseFloat(property.price.toString())) *
                              100
                            ).toFixed(1)}
                            %
                          </td>
                        ))}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommended Strategy */}
        {recommendedStrategy && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Recommended Strategy</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on gross rental yields,{" "}
              {recommendedStrategy === "shortTerm" ? "short-term" : "long-term"}{" "}
              rental appears to offer better returns for this property.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!isEditingAddress ? (
                  <span>{property?.address}</span>
                ) : (
                  <input
                    value={editedAddress}
                    onChange={(e) => setEditedAddress(e.target.value)}
                    className="text-xl font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                    placeholder="Enter complete address..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        saveAddressUpdate();
                      } else if (e.key === "Escape") {
                        setIsEditingAddress(false);
                        setEditedAddress(property?.address || "");
                      }
                    }}
                  />
                )}
                <Badge
                  variant="outline"
                  className="ml-2 bg-green-50 text-green-700 border-green-200"
                >
                  {property?.status}
                </Badge>
                {!isEditingAddress ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingAddress(true);
                      setEditedAddress(property?.address || "");
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={saveAddressUpdate}
                      disabled={isSavingAddress || !editedAddress.trim()}
                      className="h-6 w-6 p-0"
                    >
                      {isSavingAddress ? (
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditingAddress(false);
                        setEditedAddress(property?.address || "");
                      }}
                      disabled={isSavingAddress}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-right">
                <Button
                  onClick={generateValuationReport}
                  disabled={isGeneratingReport}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  {isGeneratingReport ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileBarChart className="h-4 w-4" />
                  )}
                  {isGeneratingReport
                    ? `Generating... ${generationTimer}s`
                    : "Generate Report"}
                </Button>
                {!isGeneratingReport && (
                  <p className="text-xs text-muted-foreground mt-1">
                    This should take about 20 seconds
                  </p>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              Property ID: {property?.propdataId} • Last Modified:{" "}
              {property?.lastModified && formatDate(property.lastModified)}
            </DialogDescription>
          </DialogHeader>

          {/* Property Image Gallery */}
          {propertyImages.length > 0 ? (
            <div className="mb-4">
              <div className="flex gap-2 overflow-hidden">
                {propertyImages.slice(0, imagesPerView).map((image, index) => (
                  <div
                    key={index}
                    className="w-24 h-24 rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                    onClick={() => openFullScreen(index)}
                  >
                    <img
                      src={createOptimizedImageUrl(image, "thumbnail")}
                      alt={`Property ${property?.address} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-md overflow-hidden h-[100px] bg-muted mb-4 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                <p className="text-sm">No images available</p>
              </div>
            </div>
          )}

          {/* Key Property Details */}
          <div className="flex flex-wrap gap-4 my-4 justify-start">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {property && formatCurrency(property.price)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Asking Price
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {property?.propertyType}
                </div>
                <div className="text-xs text-muted-foreground">
                  Property Type
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Bed className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {property?.bedrooms}
                </div>
                <div className="text-xs text-muted-foreground">Bedrooms</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Bath className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {property?.bathrooms}
                </div>
                <div className="text-xs text-muted-foreground">Bathrooms</div>
              </div>
            </div>

            {property?.parkingSpaces !== null && (
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {property?.parkingSpaces}
                  </div>
                  <div className="text-xs text-muted-foreground">Parking</div>
                </div>
              </div>
            )}

            {(property?.floorSize || property?.landSize) && (
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Ruler className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {property?.floorSize
                      ? `${property.floorSize}m²`
                      : property?.landSize
                        ? `${property.landSize}m²`
                        : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {property?.floorSize ? "Floor Size" : "Land Size"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Details in Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="valuation">Valuation</TabsTrigger>
              <TabsTrigger value="rental">Rental Performance</TabsTrigger>
              <TabsTrigger value="agent">Financials</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Property Specs Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Property Specs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Column 1 */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-muted-foreground text-sm">
                            Property Type
                          </span>
                          <div className="font-medium">
                            {property?.propertyType || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">
                            Bedrooms
                          </span>
                          <div className="font-medium">
                            {property?.bedrooms || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">
                            Bathrooms
                          </span>
                          <div className="font-medium">
                            {property?.bathrooms || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">
                            Parking
                          </span>
                          <div className="font-medium">
                            {property?.parkingSpaces !== null
                              ? property?.parkingSpaces
                              : "N/A"}
                          </div>
                        </div>
                      </div>

                      {/* Column 2 */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-muted-foreground text-sm">
                            Size
                          </span>
                          <div className="font-medium">
                            {(() => {
                              const propertyType =
                                property?.propertyType?.toLowerCase() || "";
                              const isVacantLand =
                                propertyType.includes("vacant") ||
                                propertyType.includes("land");
                              const isApartment =
                                propertyType.includes("apartment") ||
                                propertyType.includes("penthouse") ||
                                propertyType.includes("studio");
                              const isHouse =
                                propertyType.includes("house") ||
                                propertyType.includes("freestanding") ||
                                propertyType.includes("duplex");

                              if (isVacantLand) {
                                // Vacant land: show only land size
                                return property?.landSize
                                  ? `${property.landSize} m² (Land)`
                                  : "N/A";
                              } else if (isApartment) {
                                // Apartments: show only floor/building size
                                return property?.floorSize
                                  ? `${property.floorSize} m²`
                                  : "N/A";
                              } else if (isHouse) {
                                // Houses: show floor size primarily, land size as fallback
                                if (property?.floorSize && property?.landSize) {
                                  return `${property.floorSize} m² (Floor), ${property.landSize} m² (Land)`;
                                } else if (property?.floorSize) {
                                  return `${property.floorSize} m² (Floor)`;
                                } else if (property?.landSize) {
                                  return `${property.landSize} m² (Land)`;
                                } else {
                                  return "N/A";
                                }
                              } else {
                                // Default: show floor size primarily, land size if no floor size
                                return property?.floorSize
                                  ? `${property.floorSize} m²`
                                  : property?.landSize
                                    ? `${property.landSize} m² (Land)`
                                    : "N/A";
                              }
                            })()}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">
                            Price/m²
                          </span>
                          <div className="font-medium">
                            {(() => {
                              // Use saved calculated value if available, otherwise calculate live
                              if (savedValuationData?.pricePerSquareMeter) {
                                return `R ${Math.round(parseFloat(savedValuationData.pricePerSquareMeter)).toLocaleString()}`;
                              }
                              if (property?.price) {
                                // Use floorSize first, then landSize as fallback
                                const sizeToUse =
                                  property?.floorSize || property?.landSize;
                                if (sizeToUse) {
                                  return `R ${Math.round(property.price / sizeToUse).toLocaleString()}`;
                                }
                              }
                              return "N/A";
                            })()}
                          </div>
                        </div>

                        {/* Levy Information - Always show */}
                        <div>
                          <span className="text-muted-foreground text-sm">
                            Levies
                          </span>
                          <div className="font-medium">
                            {(() => {
                              const levies = [];

                              // Monthly Levy
                              const monthlyLevy =
                                property?.monthlyLevy &&
                                parseFloat(property.monthlyLevy.toString()) > 0
                                  ? `R ${parseFloat(property.monthlyLevy.toString()).toLocaleString()}`
                                  : "N/A";
                              levies.push(`Monthly: ${monthlyLevy}`);

                              // Sectional Title Levy
                              const sectionalLevy =
                                property?.sectionalTitleLevy &&
                                parseFloat(
                                  property.sectionalTitleLevy.toString(),
                                ) > 0
                                  ? `R ${parseFloat(property.sectionalTitleLevy.toString()).toLocaleString()}`
                                  : "N/A";
                              levies.push(`Sectional: ${sectionalLevy}`);

                              // Special Levy
                              const specialLevy =
                                property?.specialLevy &&
                                parseFloat(property.specialLevy.toString()) > 0
                                  ? `R ${parseFloat(property.specialLevy.toString()).toLocaleString()}`
                                  : "N/A";
                              levies.push(`Special: ${specialLevy}`);

                              // HOA Levy
                              const hoaLevy =
                                property?.homeOwnerLevy &&
                                parseFloat(property.homeOwnerLevy.toString()) >
                                  0
                                  ? `R ${parseFloat(property.homeOwnerLevy.toString()).toLocaleString()}`
                                  : "N/A";
                              levies.push(`HOA: ${hoaLevy}`);

                              return levies.join(", ");
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Card */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Map className="h-5 w-5" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {property?.address ? (
                      <div className="h-64 w-full rounded-lg overflow-hidden">
                        <div
                          ref={mapRef}
                          className="w-full h-full rounded-lg"
                          style={{
                            border: "1px solid var(--border)",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-64 w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Map className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Location not available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Property Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property ID:</span>
                    <span className="font-medium">{property?.propdataId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agency:</span>
                    <span className="font-medium">
                      {property?.franchiseName ||
                        "Sotheby's International Realty"}
                    </span>
                  </div>
                  {property?.branchName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Branch:</span>
                      <span className="font-medium">{property.branchName}</span>
                    </div>
                  )}
                  {property?.agentId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agent ID:</span>
                      <span className="font-medium">{property.agentId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent Name:</span>
                    <span className="font-medium">
                      {property?.agentName || "Not Available"}
                    </span>
                  </div>
                  {property?.agentEmail && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Agent Email:
                      </span>
                      <span className="font-medium">{property.agentEmail}</span>
                    </div>
                  )}
                  {property?.agentPhone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Agent Phone:
                      </span>
                      <span className="font-medium">{property.agentPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {property?.createdAt && formatDate(property.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">
                      {property?.updatedAt && formatDate(property.updatedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {property?.features &&
                Array.isArray(property.features) &&
                property.features.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {property.features.map((feature, index) => (
                          <Badge key={index} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>

            <TabsContent value="rental" className="space-y-4">
              {!rentalData ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      Rental Performance Analysis
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Generate a valuation report to see rental performance data
                      including PriceLabs short-term rental analysis and
                      long-term rental estimates.
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={generateValuationReport}
                        disabled={isGeneratingReport}
                        className="gap-2"
                      >
                        {isGeneratingReport ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileBarChart className="h-4 w-4" />
                        )}
                        {isGeneratingReport
                          ? `Generating... ${generationTimer}s`
                          : "Generate Report"}
                      </Button>
                      {!isGeneratingReport && (
                        <p className="text-xs text-muted-foreground">
                          This should take about 20 seconds
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Short-Term Rental Card */}
                  <Card
                    className={`${recommendedStrategy === "shortTerm" ? "border-blue-200 ring-2 ring-blue-100" : "border-gray-200"}`}
                  >
                    <CardHeader
                      className={`${recommendedStrategy === "shortTerm" ? "bg-blue-50" : "bg-gray-50"} pb-3`}
                    >
                      <CardTitle
                        className={`flex items-center gap-2 text-base ${recommendedStrategy === "shortTerm" ? "text-[#1e40af]" : "text-gray-700"}`}
                      >
                        <Calendar className="h-4 w-4" />
                        Short-Term (Airbnb)
                        {recommendedStrategy === "shortTerm" && (
                          <Badge className="bg-[#1e40af] text-white text-xs">
                            RECOMMENDED
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {rentalData?.shortTerm ? (
                          <>
                            <div className="text-xl font-bold text-[#1e40af]">
                              R
                              {getSelectedShortTermData()?.monthly.toLocaleString() ||
                                rentalData.shortTerm.percentile50.monthly.toLocaleString()}
                              <span className="text-sm font-normal">
                                /month
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Based on {rentalData.shortTerm.occupancy}%
                              occupancy & R
                              {getSelectedShortTermData()?.nightly.toLocaleString() ||
                                rentalData.shortTerm.percentile50.nightly.toLocaleString()}{" "}
                              avg nightly rate
                            </div>

                            <div className="border-t pt-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">
                                  Rate & Revenue Potential:
                                </span>
                                <span className="text-[#1e40af] font-bold text-sm">
                                  {rentalData.shortTerm.occupancy}% Occupancy
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <input
                                      type="radio"
                                      name="percentile"
                                      checked={
                                        selectedPercentile === "percentile25"
                                      }
                                      onChange={() =>
                                        setSelectedPercentile("percentile25")
                                      }
                                      className="w-3 h-3 text-blue-600"
                                    />
                                    <span className="font-medium text-muted-foreground">
                                      Conservative (25th)
                                    </span>
                                  </div>
                                  <div>
                                    Nightly: R
                                    {rentalData.shortTerm.percentile25.nightly.toLocaleString()}
                                  </div>
                                  <div>
                                    Monthly: R
                                    {rentalData.shortTerm.percentile25.monthly.toLocaleString()}
                                  </div>
                                  <div className="font-medium">
                                    Annual: R
                                    {rentalData.shortTerm.percentile25.annual.toLocaleString()}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <input
                                      type="radio"
                                      name="percentile"
                                      checked={
                                        selectedPercentile === "percentile50"
                                      }
                                      onChange={() =>
                                        setSelectedPercentile("percentile50")
                                      }
                                      className="w-3 h-3 text-blue-600"
                                    />
                                    <span className="font-medium text-muted-foreground">
                                      Average (50th)
                                    </span>
                                  </div>
                                  <div>
                                    Nightly: R
                                    {rentalData.shortTerm.percentile50.nightly.toLocaleString()}
                                  </div>
                                  <div>
                                    Monthly: R
                                    {rentalData.shortTerm.percentile50.monthly.toLocaleString()}
                                  </div>
                                  <div className="font-medium">
                                    Annual: R
                                    {rentalData.shortTerm.percentile50.annual.toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <input
                                      type="radio"
                                      name="percentile"
                                      checked={
                                        selectedPercentile === "percentile75"
                                      }
                                      onChange={() =>
                                        setSelectedPercentile("percentile75")
                                      }
                                      className="w-3 h-3 text-blue-600"
                                    />
                                    <span className="font-medium text-muted-foreground">
                                      Premium (75th)
                                    </span>
                                  </div>
                                  <div>
                                    Nightly: R
                                    {rentalData.shortTerm.percentile75.nightly.toLocaleString()}
                                  </div>
                                  <div>
                                    Monthly: R
                                    {rentalData.shortTerm.percentile75.monthly.toLocaleString()}
                                  </div>
                                  <div className="font-medium">
                                    Annual: R
                                    {rentalData.shortTerm.percentile75.annual.toLocaleString()}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <input
                                      type="radio"
                                      name="percentile"
                                      checked={
                                        selectedPercentile === "percentile90"
                                      }
                                      onChange={() =>
                                        setSelectedPercentile("percentile90")
                                      }
                                      className="w-3 h-3 text-blue-600"
                                    />
                                    <span className="font-medium text-muted-foreground">
                                      Luxury (90th)
                                    </span>
                                  </div>
                                  <div>
                                    Nightly: R
                                    {rentalData.shortTerm.percentile90.nightly.toLocaleString()}
                                  </div>
                                  <div>
                                    Monthly: R
                                    {rentalData.shortTerm.percentile90.monthly.toLocaleString()}
                                  </div>
                                  <div className="font-medium">
                                    Annual: R
                                    {rentalData.shortTerm.percentile90.annual.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border-t pt-3 space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Annual yield:</span>
                                <span className="font-bold text-[#1e40af]">
                                  {calculateDynamicYield() !== null
                                    ? `${calculateDynamicYield()}%`
                                    : "N/A (Valuation)"}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Yearly income:</span>
                                <span className="font-medium">
                                  R
                                  {getSelectedShortTermData()?.annual.toLocaleString() ||
                                    "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Management fee:</span>
                                <span className="font-medium">15-20%</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <p className="text-sm">
                              No short-term rental data available
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Long-Term Rental Card */}
                  <Card
                    className={`${recommendedStrategy === "longTerm" ? "border-blue-200 ring-2 ring-blue-100" : "border-gray-200"}`}
                  >
                    <CardHeader
                      className={`${recommendedStrategy === "longTerm" ? "bg-blue-50" : "bg-gray-50"} pb-3`}
                    >
                      <CardTitle
                        className={`flex items-center gap-2 text-base ${recommendedStrategy === "longTerm" ? "text-[#1e40af]" : "text-gray-700"}`}
                      >
                        <Home className="h-4 w-4" />
                        Long-Term Rental
                        {recommendedStrategy === "longTerm" && (
                          <Badge className="bg-[#1e40af] text-white text-xs">
                            RECOMMENDED
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {rentalData?.longTerm ? (
                          <>
                            <div className="text-xl font-bold text-gray-600">
                              R{rentalData.longTerm.minRental.toLocaleString()}
                              -R{rentalData.longTerm.maxRental.toLocaleString()}
                              <span className="text-sm font-normal">
                                /month
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Standard 12-month lease
                            </div>

                            <div className="border-t pt-3 space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Annual yield:</span>
                                <span className="font-bold text-gray-600">
                                  {calculateLongTermYield().min !== null &&
                                  calculateLongTermYield().max !== null
                                    ? `${calculateLongTermYield().min}%-${calculateLongTermYield().max}%`
                                    : "N/A (Valuation)"}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Yearly income:</span>
                                <span className="font-medium">
                                  R
                                  {(
                                    rentalData.longTerm.minRental * 12
                                  ).toLocaleString()}
                                  -R
                                  {(
                                    rentalData.longTerm.maxRental * 12
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Management fee:</span>
                                <span className="font-medium">
                                  {rentalData.longTerm.managementFee}
                                </span>
                              </div>
                            </div>

                            {/* AI Justification */}
                            {rentalData.longTerm.reasoning && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="text-xs text-muted-foreground font-medium">
                                    AI Analysis:
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsChatOpen(!isChatOpen)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Contest
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed italic">
                                  "{rentalData.longTerm.reasoning}"
                                </p>

                                {/* Chat Interface */}
                                {isChatOpen && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                    <div className="text-xs font-medium mb-2 text-gray-700">
                                      Contest this estimate:
                                    </div>

                                    {/* Chat Messages */}
                                    {chatMessages.length > 0 && (
                                      <div className="max-h-32 overflow-y-auto space-y-2 mb-3">
                                        {chatMessages.map((message, index) => (
                                          <div
                                            key={index}
                                            className={`text-xs p-2 rounded ${
                                              message.role === "user"
                                                ? "bg-blue-100 text-blue-800 ml-4"
                                                : "bg-white text-gray-700 mr-4"
                                            }`}
                                          >
                                            <div className="font-medium mb-1">
                                              {message.role === "user"
                                                ? "You:"
                                                : "AI:"}
                                            </div>
                                            <div>{message.content}</div>
                                            {message.newEstimate && (
                                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-800">
                                                <div className="flex justify-between items-start">
                                                  <div>
                                                    <div className="font-medium">
                                                      New Estimate:
                                                    </div>
                                                    <div>
                                                      R
                                                      {message.newEstimate.min.toLocaleString()}
                                                      -R
                                                      {message.newEstimate.max.toLocaleString()}
                                                      /month
                                                    </div>
                                                  </div>
                                                  <Button
                                                    size="sm"
                                                    onClick={
                                                      saveUpdatedEstimate
                                                    }
                                                    className="text-xs h-6 px-2 bg-green-600 hover:bg-green-700"
                                                  >
                                                    Save?
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Chat Input */}
                                    <div className="flex gap-2">
                                      <Input
                                        value={chatInput}
                                        onChange={(e) =>
                                          setChatInput(e.target.value)
                                        }
                                        placeholder="I think this estimate is too high because..."
                                        className="text-xs"
                                        onKeyPress={(e) =>
                                          e.key === "Enter" &&
                                          handleChatSubmit()
                                        }
                                        disabled={isChatLoading}
                                      />
                                      <Button
                                        size="sm"
                                        onClick={handleChatSubmit}
                                        disabled={
                                          isChatLoading || !chatInput.trim()
                                        }
                                        className="h-8 px-2"
                                      >
                                        {isChatLoading ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Send className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <p className="text-sm">
                              No long-term rental data available
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="agent" className="space-y-4">
              {/* Property Appreciation Analysis */}
              {valuationReport?.propertyAppreciation ? (
                <Card>
                  <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem
                        value="appreciation-analysis"
                        className="border-none"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:no-underline [&>svg]:hidden">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <FileBarChart className="h-5 w-5" />
                              <div className="font-semibold">
                                Annual Property Appreciation
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180"
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                              <Badge variant="secondary">
                                {valuationReport.propertyAppreciation.annualAppreciationRate.toFixed(
                                  1,
                                )}
                                %
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                          <div className="space-y-4">
                            {/* Component Breakdown */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-xs">
                                Components
                              </h4>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-1 px-2 font-medium">
                                        Component
                                      </th>
                                      <th className="text-left py-1 px-2 font-medium">
                                        Analysis
                                      </th>
                                      <th className="text-right py-1 px-2 font-medium">
                                        Impact
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    <tr className="hover:bg-gray-50">
                                      <td className="py-2 px-2 font-medium">
                                        Base Suburb Rate
                                      </td>
                                      <td className="py-2 px-2 text-muted-foreground">
                                        {
                                          valuationReport.propertyAppreciation
                                            .components.baseSuburbRate
                                            .justification
                                        }
                                      </td>
                                      <td className="py-2 px-2 text-right font-medium text-blue-600">
                                        {valuationReport.propertyAppreciation
                                          .components.baseSuburbRate.rate > 0
                                          ? "+"
                                          : ""}
                                        {valuationReport.propertyAppreciation.components.baseSuburbRate.rate.toFixed(
                                          1,
                                        )}
                                        %
                                      </td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                      <td className="py-2 px-2 font-medium">
                                        Property Type
                                      </td>
                                      <td className="py-2 px-2 text-muted-foreground">
                                        {
                                          valuationReport.propertyAppreciation
                                            .components.propertyTypeModifier
                                            .justification
                                        }
                                      </td>
                                      <td
                                        className={`py-2 px-2 text-right font-medium ${valuationReport.propertyAppreciation.components.propertyTypeModifier.adjustment >= 0 ? "text-green-600" : "text-red-600"}`}
                                      >
                                        {valuationReport.propertyAppreciation
                                          .components.propertyTypeModifier
                                          .adjustment > 0
                                          ? "+"
                                          : ""}
                                        {valuationReport.propertyAppreciation.components.propertyTypeModifier.adjustment.toFixed(
                                          1,
                                        )}
                                        %
                                      </td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                      <td className="py-2 px-2 font-medium">
                                        Levy (R
                                        {valuationReport.propertyAppreciation.components.levyImpact.levyPerSquareMeter.toFixed(
                                          0,
                                        )}
                                        /m²)
                                      </td>
                                      <td className="py-2 px-2 text-muted-foreground">
                                        {
                                          valuationReport.propertyAppreciation
                                            .components.levyImpact.justification
                                        }
                                      </td>
                                      <td
                                        className={`py-2 px-2 text-right font-medium ${valuationReport.propertyAppreciation.components.levyImpact.adjustment >= 0 ? "text-green-600" : "text-red-600"}`}
                                      >
                                        {valuationReport.propertyAppreciation
                                          .components.levyImpact.adjustment > 0
                                          ? "+"
                                          : ""}
                                        {valuationReport.propertyAppreciation.components.levyImpact.adjustment.toFixed(
                                          1,
                                        )}
                                        %
                                      </td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                      <td className="py-2 px-2 font-medium">
                                        Condition
                                      </td>
                                      <td className="py-2 px-2 text-muted-foreground">
                                        {
                                          valuationReport.propertyAppreciation
                                            .components
                                            .visualConditionAdjustment
                                            .justification
                                        }
                                      </td>
                                      <td
                                        className={`py-2 px-2 text-right font-medium ${valuationReport.propertyAppreciation.components.visualConditionAdjustment.adjustment >= 0 ? "text-green-600" : "text-red-600"}`}
                                      >
                                        {valuationReport.propertyAppreciation
                                          .components.visualConditionAdjustment
                                          .adjustment > 0
                                          ? "+"
                                          : ""}
                                        {valuationReport.propertyAppreciation.components.visualConditionAdjustment.adjustment.toFixed(
                                          1,
                                        )}
                                        %
                                      </td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                      <td className="py-2 px-2 font-medium">
                                        Location
                                      </td>
                                      <td className="py-2 px-2 text-muted-foreground">
                                        {
                                          valuationReport.propertyAppreciation
                                            .components.locationPremium
                                            .justification
                                        }
                                      </td>
                                      <td
                                        className={`py-2 px-2 text-right font-medium ${valuationReport.propertyAppreciation.components.locationPremium.adjustment >= 0 ? "text-green-600" : "text-red-600"}`}
                                      >
                                        {valuationReport.propertyAppreciation
                                          .components.locationPremium
                                          .adjustment > 0
                                          ? "+"
                                          : ""}
                                        {valuationReport.propertyAppreciation.components.locationPremium.adjustment.toFixed(
                                          1,
                                        )}
                                        %
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* 5-Year Value Projection */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-xs">
                                5-Year Projection
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-blue-50">
                                      {valuationReport.propertyAppreciation.fiveYearProjection.map(
                                        (projection: any) => (
                                          <th
                                            key={projection.year}
                                            className="py-1 px-2 text-center font-medium text-blue-700"
                                          >
                                            {projection.year}
                                          </th>
                                        ),
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      {valuationReport.propertyAppreciation.fiveYearProjection.map(
                                        (projection: any) => (
                                          <td
                                            key={projection.year}
                                            className="py-2 px-2 text-center font-medium text-blue-800"
                                          >
                                            R
                                            {projection.estimatedValue.toLocaleString()}
                                          </td>
                                        ),
                                      )}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileBarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      Property Appreciation Analysis
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Generate a valuation report to see detailed property
                      appreciation forecasts and component analysis.
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={generateValuationReport}
                        disabled={isGeneratingReport}
                        className="gap-2"
                      >
                        {isGeneratingReport ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileBarChart className="h-4 w-4" />
                        )}
                        {isGeneratingReport
                          ? `Generating... ${generationTimer}s`
                          : "Generate Report"}
                      </Button>
                      {!isGeneratingReport && (
                        <p className="text-xs text-muted-foreground">
                          This will include appreciation analysis with levy
                          impact assessment
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cash Flow Analysis */}
              <Card>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                      value="cashflow-analysis"
                      className="border-none"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline [&>svg]:hidden">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-5 w-5" />
                            <div className="font-semibold">
                              Cash Flow Analysis
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        {renderCashflowAnalysis()}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Financing Analysis */}
              <Card>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                      value="financing-analysis"
                      className="border-none"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline [&>svg]:hidden">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <Calculator className="h-5 w-5" />
                            <div className="font-semibold">
                              Financing Analysis
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        {renderFinancingAnalysis()}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="valuation" className="space-y-4">
              {valuationReport ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileBarChart className="h-5 w-5" />
                      Estimated Value Range
                    </CardTitle>
                    <CardDescription>
                      AI-powered property valuation based on specifications and
                      imagery
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Valuation Summary */}
                      {valuationReport.summary && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">
                            Analysis Summary
                          </h4>
                          <p className="text-blue-800 text-sm">
                            {valuationReport.summary}
                          </p>
                        </div>
                      )}

                      {/* Valuation Table */}
                      {valuationReport.valuations && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground">
                            <div>Estimate Type</div>
                            <div>Formula Used</div>
                            <div>Outcome</div>
                          </div>
                          {(() => {
                            // Reorder valuations to show Conservative, Midline, Optimistic
                            const reorderedValuations = [
                              ...valuationReport.valuations,
                            ].sort((a, b) => {
                              const order = {
                                Conservative: 1,
                                "Midline (Proply est.)": 2,
                                Optimistic: 3,
                              };
                              return (
                                (order[a.type] || 4) - (order[b.type] || 4)
                              );
                            });

                            return reorderedValuations.map(
                              (valuation: any, index: number) => {
                                const isMidline =
                                  valuation.type === "Midline (Proply est.)";
                                return (
                                  <div
                                    key={index}
                                    className={`grid grid-cols-3 gap-4 py-3 border-b last:border-b-0 ${
                                      isMidline
                                        ? "bg-blue-50 rounded-lg px-3 border border-blue-200"
                                        : ""
                                    }`}
                                  >
                                    <div
                                      className={`font-medium ${isMidline ? "text-blue-900" : ""}`}
                                    >
                                      {valuation.type}
                                    </div>
                                    <div
                                      className={`text-sm ${isMidline ? "text-blue-700" : "text-muted-foreground"}`}
                                    >
                                      {valuation.formula}
                                    </div>
                                    <div
                                      className={`font-semibold text-lg ${isMidline ? "text-blue-900" : ""}`}
                                    >
                                      {formatCurrency(valuation.value)}
                                    </div>
                                  </div>
                                );
                              },
                            );
                          })()}
                        </div>
                      )}

                      {/* Property Features Analysis */}
                      {valuationReport.features && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">
                            Property Features Analysis
                          </h4>
                          <p className="text-green-800 text-sm">
                            {valuationReport.features}
                          </p>
                        </div>
                      )}

                      {/* Market Context */}
                      {valuationReport.marketContext && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h4 className="font-medium text-yellow-900 mb-2">
                            Market Context
                          </h4>
                          <p className="text-yellow-800 text-sm">
                            {valuationReport.marketContext}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileBarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      Generate Valuation Report
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Generate Report" to get an AI-powered property
                      valuation analysis
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={generateValuationReport}
                        disabled={isGeneratingReport}
                        className="gap-2"
                      >
                        {isGeneratingReport ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileBarChart className="h-4 w-4" />
                        )}
                        {isGeneratingReport
                          ? `Generating... ${generationTimer}s`
                          : "Generate Report"}
                      </Button>
                      {!isGeneratingReport && (
                        <p className="text-xs text-muted-foreground">
                          This should take about 20 seconds
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Full Screen Image Viewer */}
      {isFullScreenOpen && propertyImages.length > 0 && (
        <Dialog open={isFullScreenOpen} onOpenChange={closeFullScreen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
            <div className="relative w-full h-[80vh] bg-black flex items-center justify-center">
              <img
                src={createOptimizedImageUrl(
                  propertyImages[fullScreenImageIndex],
                  "medium",
                )}
                alt={`Property ${property?.address} - Full screen ${fullScreenImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />

              {/* Navigation buttons */}
              {propertyImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0 h-12 w-12 p-0"
                    onClick={prevFullScreenImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0 h-12 w-12 p-0"
                    onClick={nextFullScreenImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Close button */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-0 h-8 w-8 p-0"
                onClick={closeFullScreen}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm">
                {fullScreenImageIndex + 1} / {propertyImages.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Financing Parameters Modal */}
      <Dialog
        open={isFinancingModalOpen}
        onOpenChange={setIsFinancingModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Financing Parameters</DialogTitle>
            <DialogDescription>
              Adjust the deposit, interest rate, and loan term to see how they
              affect your investment analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="depositPercentage"
                className="text-sm font-medium"
              >
                Deposit Percentage
              </label>
              <Input
                id="depositPercentage"
                type="text"
                value={tempFinancingParams.depositPercentage}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or valid numbers
                  if (
                    value === "" ||
                    (!isNaN(Number(value)) &&
                      Number(value) >= 0 &&
                      Number(value) <= 100)
                  ) {
                    setTempFinancingParams((prev) => ({
                      ...prev,
                      depositPercentage: value === "" ? 0 : Number(value),
                    }));
                  }
                }}
                placeholder="0"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                0% = 100% financing, 100% = cash purchase
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="interestRate" className="text-sm font-medium">
                Interest Rate (%)
              </label>
              <Input
                id="interestRate"
                type="text"
                value={tempFinancingParams.interestRate}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or valid numbers
                  if (
                    value === "" ||
                    (!isNaN(Number(value)) &&
                      Number(value) >= 0 &&
                      Number(value) <= 50)
                  ) {
                    setTempFinancingParams((prev) => ({
                      ...prev,
                      interestRate: value === "" ? 0 : Number(value),
                    }));
                  }
                }}
                placeholder="10.75"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Current market rates typically 8-15%
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="loanTermYears" className="text-sm font-medium">
                Loan Term (Years)
              </label>
              <Input
                id="loanTermYears"
                type="text"
                value={tempFinancingParams.loanTermYears}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or valid numbers
                  if (
                    value === "" ||
                    (!isNaN(Number(value)) &&
                      Number(value) >= 1 &&
                      Number(value) <= 40)
                  ) {
                    setTempFinancingParams((prev) => ({
                      ...prev,
                      loanTermYears: value === "" ? 1 : Number(value),
                    }));
                  }
                }}
                placeholder="20"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Between 1 and 40 years
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setTempFinancingParams(financingParams); // Reset temp values
                setIsFinancingModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFinancingParams(tempFinancingParams); // Apply temp values to actual state
                setIsFinancingModalOpen(false);
              }}
            >
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
