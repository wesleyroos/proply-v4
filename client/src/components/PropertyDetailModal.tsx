import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Download,
  ChevronDown,
  BarChart3,
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
  size: "thumbnail" | "medium" | "large" | "original" = "thumbnail",
) => {
  if (!originalUrl) return originalUrl;

  // For original size, use direct URL to avoid processing delay
  if (size === "original") {
    return originalUrl;
  }

  // Use server-side image optimization endpoint for better performance
  const sizeParams = {
    thumbnail: { width: 300, height: 200, quality: 75 },
    medium: { width: 800, height: 600, quality: 85 },
    large: { width: 1200, height: 900, quality: 90 },
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [showSendReportDialog, setShowSendReportDialog] = useState(false);
  const [sendToAgent, setSendToAgent] = useState(false);
  const [sendToCustomEmail, setSendToCustomEmail] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [imagesPerView, setImagesPerView] = useState(4);
  const [showAllImages, setShowAllImages] = useState(false);
  
  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressSteps, setProgressSteps] = useState([
    { id: 'analyze', label: 'Analyzing property details', status: 'pending' },
    { id: 'images', label: 'Processing property images', status: 'pending' },
    { id: 'valuation', label: 'Generating valuation estimates', status: 'pending' },
    { id: 'rental', label: 'Fetching rental performance data', status: 'pending' },
    { id: 'financial', label: 'Calculating financial analysis', status: 'pending' },
    { id: 'complete', label: 'Finalizing report', status: 'pending' }
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Progress modal helper functions
  const updateProgressStep = (stepId: string, status: 'pending' | 'processing' | 'completed' | 'error') => {
    setProgressSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const resetProgress = () => {
    setCurrentStepIndex(0);
    setProgressSteps([
      { id: 'analyze', label: 'Analyzing property details', status: 'pending' },
      { id: 'images', label: 'Processing property images', status: 'pending' },
      { id: 'valuation', label: 'Generating valuation estimates', status: 'pending' },
      { id: 'rental', label: 'Fetching rental performance data', status: 'pending' },
      { id: 'financial', label: 'Calculating financial analysis', status: 'pending' },
      { id: 'complete', label: 'Finalizing report', status: 'pending' }
    ]);
  };

  // Fetch report activity data
  const { data: reportActivity, refetch: refetchActivity } = useQuery({
    queryKey: ["/api/report-activity", property?.propdataId],
    queryFn: async () => {
      if (!property?.propdataId) return [];
      const response = await fetch(
        `/api/report-activity/${property.propdataId}?t=${Date.now()}`,
      );
      if (!response.ok) return [];
      const data = await response.json();
      console.log(`Activity data for property ${property.propdataId}:`, data);
      console.table(
        data.map((item) => ({
          id: item.id,
          type: item.activityType,
          email: item.recipientEmail,
          ip: item.ipAddress,
          timestamp: item.timestamp,
        })),
      );
      return data;
    },
    enabled: !!property?.propdataId,
    refetchOnWindowFocus: false,
  });

  // Refetch activity data when modal opens
  useEffect(() => {
    if (showActivityModal && property?.propdataId) {
      refetchActivity();
    }
  }, [showActivityModal, property?.propdataId, refetchActivity]);

  // Replace local state with React Query for database consistency
  const { data: valuationReport, refetch: refetchValuation } = useQuery({
    queryKey: ["/api/valuation-reports", property?.propdataId],
    queryFn: async () => {
      if (!property?.propdataId) return null;
      const response = await fetch(
        `/api/valuation-reports/${property.propdataId}`,
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.valuationData;
    },
    enabled: !!property?.propdataId && isOpen,
  });

  const { data: savedValuationData } = useQuery({
    queryKey: ["/api/valuation-reports-raw", property?.propdataId],
    queryFn: async () => {
      if (!property?.propdataId) return null;
      const response = await fetch(
        `/api/valuation-reports/${property.propdataId}`,
      );
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: !!property?.propdataId && isOpen,
  });

  const {
    data: rentalData,
    refetch: refetchRental,
    isLoading: isLoadingRental,
  } = useQuery({
    queryKey: ["/api/rental-performance", property?.propdataId],
    queryFn: async () => {
      if (!property?.propdataId) return null;
      const response = await fetch(
        `/api/rental-performance/${property.propdataId}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) return null;

      const rawRentalData = await response.json();

      // Transform database format to frontend format
      let shortTermData = null;
      if (rawRentalData.short_term_data) {
        const parsedData =
          typeof rawRentalData.short_term_data === "string"
            ? JSON.parse(rawRentalData.short_term_data)
            : rawRentalData.short_term_data;

        if (
          parsedData &&
          typeof parsedData.yield === "number" &&
          !isFinite(parsedData.yield)
        ) {
          parsedData.yield = null;
        }
        shortTermData = parsedData;
      }

      return {
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
    },
    enabled: !!property?.propdataId && isOpen,
  });
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
  const [lastAddressSaveTime, setLastAddressSaveTime] = useState<number | null>(
    null,
  );
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
  // FINANCING PARAMETERS - Database-backed single source of truth
  // These parameters are loaded from valuation_reports table and saved on update
  // This ensures PDF generation uses exact same data user sees in modal
  const [tempFinancingParams, setTempFinancingParams] = useState({
    depositPercentage: 20, // Default values until loaded from database
    interestRate: 11.75,
    loanTermYears: 20,
  });

  // Derive current financing parameters from database valuation data
  // This creates the single source of truth that both modal and PDF will use
  const financingParams = useMemo(() => {
    if (valuationReport?.currentDepositPercentage) {
      return {
        depositPercentage: parseFloat(valuationReport.currentDepositPercentage),
        interestRate: parseFloat(
          valuationReport.currentInterestRate || "11.75",
        ),
        loanTermYears: parseInt(valuationReport.currentLoanTerm || "20"),
      };
    }
    // Fallback to default values if no database data exists yet
    return {
      depositPercentage: 20,
      interestRate: 11.75,
      loanTermYears: 20,
    };
  }, [valuationReport]);

  // Initialize temp financing params from database when valuation data loads
  useEffect(() => {
    if (valuationReport?.currentDepositPercentage) {
      setTempFinancingParams({
        depositPercentage: parseFloat(valuationReport.currentDepositPercentage),
        interestRate: parseFloat(
          valuationReport.currentInterestRate || "11.75",
        ),
        loanTermYears: parseInt(valuationReport.currentLoanTerm || "20"),
      });
    }
  }, [valuationReport]);

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

  // Reset UI state when property changes or modal closes
  useEffect(() => {
    setSelectedPercentile("percentile50"); // Reset to default percentile
    setActiveTab("overview");
    setGenerationTimer(0);
    setIsChatOpen(false);
    setChatMessages([]);
    setHasNewEstimate(false);
    setIsEditingAddress(false);
    setEditedAddress(property?.address || "");
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
    if (!latestMessageWithEstimate?.newEstimate || !rentalData) return;

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
              ...(rentalData.longTerm || {}),
              minRental: latestMessageWithEstimate.newEstimate.min,
              maxRental: latestMessageWithEstimate.newEstimate.max,
              reasoning: `Updated based on user feedback: ${latestMessageWithEstimate.content}`,
            },
          }),
        },
      );

      if (response.ok) {
        // Reload data from database to ensure consistency
        await refetchRental();
        setIsChatOpen(false);
        setChatMessages([]);
        setHasNewEstimate(false);
      }
    } catch (error) {
      console.error("Error saving updated estimate:", error);
    }
  };

  // CALCULATE AND SAVE ALL FINANCIAL ANALYSIS DATA
  // This function generates all financial data shown in the Financials tab and saves it to database
  // Ensures single source of truth for PDF generation
  const calculateAndSaveFinancialData = async (
    updatedFinancingParams?: any,
  ) => {
    if (!property || !rentalData || !valuationReport) return;

    const financingToUse = updatedFinancingParams || financingParams;
    const propertyPrice = parseFloat(property.price.toString());

    // 1. ANNUAL PROPERTY APPRECIATION DATA
    const annualAppreciationData = {
      baseSuburbRate:
        valuationReport.propertyAppreciation?.suburbAppreciationRate || 8.0,
      propertyAdjustments:
        valuationReport.propertyAppreciation?.adjustments || {},
      finalAppreciationRate:
        valuationReport.propertyAppreciation?.annualAppreciationRate || 8.0,
      yearlyValues: (() => {
        const rate =
          (valuationReport.propertyAppreciation?.annualAppreciationRate ||
            8.0) / 100;
        return [1, 2, 3, 4, 5, 10, 20].reduce(
          (acc, year) => {
            acc[`year${year}`] = propertyPrice * Math.pow(1 + rate, year);
            return acc;
          },
          {} as Record<string, number>,
        );
      })(),
      reasoning:
        valuationReport.propertyAppreciation?.reasoning ||
        "Standard market appreciation",
    };

    // 2. CASHFLOW ANALYSIS DATA
    const cashflowAnalysisData = {
      revenueGrowthTrajectory: {
        shortTerm: rentalData.shortTerm
          ? (() => {
              const selectedData = rentalData.shortTerm[selectedPercentile];
              const baseAnnual = selectedData.annual;
              return [1, 2, 3, 4, 5].reduce(
                (acc, year) => {
                  const revenue = baseAnnual * Math.pow(1.08, year - 1);
                  const grossYield = (revenue / propertyPrice) * 100;
                  acc[`year${year}`] = { revenue, grossYield };
                  return acc;
                },
                {} as Record<string, { revenue: number; grossYield: number }>,
              );
            })()
          : null,
        longTerm: rentalData.longTerm
          ? (() => {
              const monthlyAvg =
                (rentalData.longTerm.minRental +
                  rentalData.longTerm.maxRental) /
                2;
              const baseAnnual = monthlyAvg * 12;
              return [1, 2, 3, 4, 5].reduce(
                (acc, year) => {
                  const revenue = baseAnnual * Math.pow(1.08, year - 1);
                  const grossYield = (revenue / propertyPrice) * 100;
                  acc[`year${year}`] = { revenue, grossYield };
                  return acc;
                },
                {} as Record<string, { revenue: number; grossYield: number }>,
              );
            })()
          : null,
      },
      recommendedStrategy: (() => {
        if (!rentalData.shortTerm || !rentalData.longTerm) return null;
        const shortTermYield =
          (rentalData.shortTerm[selectedPercentile].annual / propertyPrice) *
          100;
        const longTermYield =
          ((((rentalData.longTerm.minRental + rentalData.longTerm.maxRental) /
            2) *
            12) /
            propertyPrice) *
          100;
        return shortTermYield > longTermYield ? "shortTerm" : "longTerm";
      })(),
      strategyReasoning: "Based on gross rental yields comparison",
    };

    // 3. FINANCING ANALYSIS DATA
    const depositPercentage = financingToUse.depositPercentage / 100;
    const loanToValue = 1 - depositPercentage;
    const interestRate = financingToUse.interestRate / 100;
    const loanTermYears = financingToUse.loanTermYears;
    const loanTermMonths = loanTermYears * 12;

    const depositAmount = propertyPrice * depositPercentage;
    const loanAmount = propertyPrice * loanToValue;
    const monthlyInterestRate = interestRate / 12;

    const monthlyPayment =
      (loanAmount *
        (monthlyInterestRate *
          Math.pow(1 + monthlyInterestRate, loanTermMonths))) /
      (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);

    const financingAnalysisData = {
      financingParameters: {
        depositAmount,
        depositPercentage: financingToUse.depositPercentage,
        loanAmount,
        interestRate: financingToUse.interestRate,
        loanTerm: loanTermYears,
        monthlyPayment,
      },
      yearlyMetrics: [1, 2, 3, 4, 5, 10, 20].reduce(
        (acc, year) => {
          const monthsElapsed = year * 12;
          let remainingBalance = loanAmount;
          let totalPrincipalPaid = 0;

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

          acc[`year${year}`] = {
            monthlyPayment,
            equityBuildup: totalPrincipalPaid,
            remainingBalance: Math.max(0, remainingBalance),
          };
          return acc;
        },
        {} as Record<
          string,
          {
            monthlyPayment: number;
            equityBuildup: number;
            remainingBalance: number;
          }
        >,
      ),
    };

    // SAVE ALL FINANCIAL DATA TO DATABASE
    try {
      const response = await fetch(
        `/api/valuation-reports/${property.propdataId}/financial-data`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            annualPropertyAppreciationData: annualAppreciationData,
            cashflowAnalysisData,
            financingAnalysisData,
            // Also update financing parameters if provided
            ...(updatedFinancingParams && {
              depositPercentage: updatedFinancingParams.depositPercentage,
              interestRate: updatedFinancingParams.interestRate,
              loanTerm: updatedFinancingParams.loanTermYears,
              purchasePrice: propertyPrice,
            }),
          }),
        },
      );

      if (response.ok) {
        console.log(
          "Successfully saved all financial analysis data to database",
        );
        await refetchValuation();
        return true;
      } else {
        console.error("Failed to save financial analysis data");
        return false;
      }
    } catch (error) {
      console.error("Error saving financial analysis data:", error);
      return false;
    }
  };

  // FINANCING PARAMETERS - Save to database for single source of truth
  const saveFinancingParameters = async () => {
    if (!property?.propdataId || !valuationReport?.price) return;

    const success = await calculateAndSaveFinancialData(tempFinancingParams);
    if (success) {
      setIsFinancingModalOpen(false);
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

        // Update local property data immediately (optimistic update)
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

        // Track when address was successfully saved for data freshness validation
        setLastAddressSaveTime(Date.now());

        // Invalidate the property listings query in background (no UI blocking)
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ["/api/propdata/listings"],
          });
        }, 100);
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

    // Check for data freshness - prevent race conditions with recent address updates
    if (lastAddressSaveTime && Date.now() - lastAddressSaveTime < 5000) {
      alert(
        "Address was recently updated. Please wait 5 seconds before generating report to ensure data consistency.",
      );
      return;
    }

    // Reset and show progress modal
    resetProgress();
    setShowProgressModal(true);
    setIsGeneratingReport(true);
    
    try {
      // Step 1: Analyzing property details
      updateProgressStep('analyze', 'processing');
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
      
      updateProgressStep('analyze', 'completed');
      
      // Step 2: Processing images
      updateProgressStep('images', 'processing');
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateProgressStep('images', 'completed');
      
      // Step 3: Generating valuation estimates
      updateProgressStep('valuation', 'processing');

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
      updateProgressStep('valuation', 'completed');

      // Save the valuation report to database 
      // (Financial data is automatically saved during valuation generation)
      await saveValuationToDatabase(report);

      // Reload data from database to ensure consistency
      await refetchValuation();

      // Step 4: Fetching rental performance data
      updateProgressStep('rental', 'processing');
      
      // Force refresh rental data with cache invalidation
      console.log(
        "Invalidating and refetching rental data after valuation generation...",
      );
      queryClient.invalidateQueries({
        queryKey: ["/api/rental-performance", property.propdataId],
      });
      await refetchRental();
      
      updateProgressStep('rental', 'completed');

      // Step 5: Calculating financial analysis
      updateProgressStep('financial', 'processing');
      
      // AUTOMATICALLY SAVE ALL FINANCIAL ANALYSIS DATA
      // This ensures complete single source of truth for PDF generation
      // Financial data is calculated and saved immediately after valuation generation
      try {
        console.log("Auto-generating and saving financial analysis data...");
        await calculateAndSaveFinancialData();
        console.log(
          "Financial analysis data automatically saved to database",
        );
        updateProgressStep('financial', 'completed');
      } catch (error) {
        console.error("Error auto-saving financial data:", error);
        updateProgressStep('financial', 'error');
      }
      
      // Step 6: Finalizing report
      updateProgressStep('complete', 'processing');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProgressStep('complete', 'completed');
    } catch (error) {
      console.error("Error generating valuation report:", error);
      // Mark current step as error
      const currentStep = progressSteps.find(step => step.status === 'processing');
      if (currentStep) {
        updateProgressStep(currentStep.id, 'error');
      }
      alert("Failed to generate valuation report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
      // Close progress modal after a delay
      setTimeout(() => {
        setShowProgressModal(false);
      }, 2000);
    }
  };

  // PDF Report Generation Handlers
  const handleDownloadReport = async () => {
    if (!property) return;

    setIsGeneratingPdf(true);
    try {
      // Use the new working PDF endpoint with PropData property ID
      const response = await fetch(`/api/pdf-generate/${property.propdataId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF report");
      }

      // Download the PDF directly
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proply_Report_${property.address.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh activity data after downloading report
      setTimeout(() => refetchActivity(), 1000); // Small delay to ensure server processes the download
    } catch (error) {
      console.error("Error downloading PDF report:", error);
      alert("Failed to download PDF report. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendReport = () => {
    if (!property) return;
    setShowSendReportDialog(true);
  };

  const handleConfirmSendReport = async () => {
    if (!property) return;

    setIsSendingReport(true);
    setShowSendReportDialog(false);

    try {
      const recipients = ["wesley@proply.co.za"];
      if (sendToAgent && property.agentEmail) {
        recipients.push(property.agentEmail);
      }
      if (sendToCustomEmail && customEmail.trim()) {
        recipients.push(customEmail.trim());
      }

      const response = await fetch(
        `/api/propdata-reports/send/${property.propdataId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            recipients: recipients,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send PDF report");
      }

      const result = await response.json();
      
      // Build recipient text dynamically
      let recipientText = "wesley@proply.co.za";
      const additionalRecipients = [];
      if (sendToAgent && property.agentEmail) {
        additionalRecipients.push(property.agentEmail);
      }
      if (sendToCustomEmail && customEmail.trim()) {
        additionalRecipients.push(customEmail.trim());
      }
      
      if (additionalRecipients.length > 0) {
        recipientText += ` and ${additionalRecipients.join(', ')}`;
      }
      
      alert(
        `Report has been generated and sent to ${recipientText}. The download link will be available for 30 days.`,
      );

      // Refresh activity data after sending report
      refetchActivity();
    } catch (error) {
      console.error("Error sending PDF report:", error);
      alert("Failed to send PDF report. Please try again.");
    } finally {
      setIsSendingReport(false);
      setSendToAgent(false);
      setSendToCustomEmail(false);
      setCustomEmail("");
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

  // Display exactly 12 images initially

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

    const propertyPrice = parseFloat(property.price.toString());

    // Calculate metrics for long-term strategy
    const calculateLongTermMetrics = () => {
      if (!rentalData.longTerm) return null;
      
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
    };

    const longTermMetrics = calculateLongTermMetrics();

    // Calculate 5-year revenue growth (8% annual growth)
    const calculateRevenueGrowth = (baseAnnual: number) => {
      return [1, 2, 3, 4, 5].map((year) => ({
        year,
        revenue: baseAnnual * Math.pow(1.08, year - 1),
      }));
    };

    // Define percentile labels for display
    const percentileLabels = {
      percentile25: "25th Percentile (Conservative)",
      percentile50: "50th Percentile (Median)",
      percentile75: "75th Percentile (Optimistic)",
      percentile90: "90th Percentile (Premium)"
    };

    return (
      <div className="space-y-6">
        {/* Revenue Growth Projections Table */}
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
                {/* Short-term Revenue Rows - All Percentiles */}
                {rentalData.shortTerm && Object.entries(percentileLabels).map(([percentileKey, label]) => {
                  const percentileData = rentalData.shortTerm[percentileKey as keyof typeof rentalData.shortTerm];
                  if (!percentileData) return null;
                  
                  return (
                    <React.Fragment key={percentileKey}>
                      <tr className="border-b hover:bg-blue-50/50">
                        <td className="py-2 px-3 font-medium text-blue-600">
                          Short-term Revenue ({label})
                        </td>
                        {calculateRevenueGrowth(percentileData.annual).map(({ year, revenue }) => (
                          <td key={year} className="text-center py-2 px-3">
                            {formatCurrency(revenue)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-blue-50/50">
                        <td className="py-2 px-3 font-medium text-blue-600">
                          Short-term Gross Yield ({label})
                        </td>
                        {calculateRevenueGrowth(percentileData.annual).map(({ year, revenue }) => (
                          <td key={year} className="text-center py-2 px-3">
                            {((revenue / propertyPrice) * 100).toFixed(1)}%
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  );
                })}

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
                          {((revenue / propertyPrice) * 100).toFixed(1)}%
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={
                        isGeneratingReport ||
                        isGeneratingPdf ||
                        isSendingReport ||
                        isSavingAddress
                      }
                      variant="default"
                      size="sm"
                      className="gap-2"
                    >
                      {isGeneratingReport ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isGeneratingPdf || isSendingReport ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileBarChart className="h-4 w-4" />
                      )}
                      {isSavingAddress
                        ? "Saving address..."
                        : isGeneratingReport
                          ? `Generating... ${generationTimer}s`
                          : isGeneratingPdf
                            ? "Generating PDF..."
                            : isSendingReport
                              ? "Sending Report..."
                              : "Actions"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={generateValuationReport}
                      disabled={
                        isGeneratingReport ||
                        isGeneratingPdf ||
                        isSendingReport ||
                        isSavingAddress
                      }
                    >
                      <FileBarChart className="h-4 w-4 mr-2" />
                      Generate Report
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDownloadReport}
                      disabled={
                        isGeneratingReport ||
                        isGeneratingPdf ||
                        isSendingReport ||
                        isSavingAddress ||
                        !valuationReport
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSendReport}
                      disabled={
                        isGeneratingReport ||
                        isGeneratingPdf ||
                        isSendingReport ||
                        isSavingAddress ||
                        !valuationReport
                      }
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Report
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowActivityModal(true)}
                      disabled={
                        isGeneratingReport ||
                        isGeneratingPdf ||
                        isSendingReport ||
                        isSavingAddress
                      }
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Activity
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {!isGeneratingReport &&
                  !isGeneratingPdf &&
                  !isSendingReport && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Generate valuation first, then download or send PDF
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-hidden">
                {propertyImages.slice(0, showAllImages ? propertyImages.length : imagesPerView).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity group relative"
                    onClick={() => openFullScreen(index)}
                  >
                    <img
                      src={createOptimizedImageUrl(image, "thumbnail")}
                      alt={`Property ${property?.address} - Image ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                  </div>
                ))}
              </div>
              {propertyImages.length > imagesPerView && (
                <div className="flex items-center justify-center mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllImages(!showAllImages)}
                    className="text-sm"
                  >
                    {showAllImages ? (
                      <>Show Less Images</>
                    ) : (
                      <>Show All {propertyImages.length} Images</>
                    )}
                  </Button>
                </div>
              )}
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

                            {/* Extended Value Projection */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-xs">
                                Property Value Projection
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border rounded-lg">
                                  <thead>
                                    <tr className="bg-blue-50 border-b">
                                      <th className="py-2 px-3 text-left font-medium text-blue-700">
                                        Year
                                      </th>
                                      {valuationReport.propertyAppreciation.fiveYearProjection.map(
                                        (projection: any, index: number) => (
                                          <th
                                            key={projection.year}
                                            className="py-2 px-3 text-center font-medium text-blue-700"
                                          >
                                            Year {index + 1}
                                          </th>
                                        ),
                                      )}
                                      <th className="py-2 px-3 text-center font-medium text-blue-700">
                                        Year 10
                                      </th>
                                      <th className="py-2 px-3 text-center font-medium text-blue-700">
                                        Year 20
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b">
                                      <td className="py-2 px-3 font-medium text-blue-800">
                                        Property Value
                                      </td>
                                      {valuationReport.propertyAppreciation.fiveYearProjection.map(
                                        (projection: any) => (
                                          <td
                                            key={projection.year}
                                            className="py-2 px-3 text-center font-medium text-blue-800"
                                          >
                                            R
                                            {projection.estimatedValue.toLocaleString()}
                                          </td>
                                        ),
                                      )}
                                      <td className="py-2 px-3 text-center font-medium text-blue-800">
                                        R
                                        {(() => {
                                          const baseValue =
                                            property?.price || 0;
                                          const appreciationRate =
                                            valuationReport.propertyAppreciation
                                              .annualAppreciationRate / 100;
                                          const year10Value =
                                            baseValue *
                                            Math.pow(1 + appreciationRate, 10);
                                          return Math.round(
                                            year10Value,
                                          ).toLocaleString();
                                        })()}
                                      </td>
                                      <td className="py-2 px-3 text-center font-medium text-blue-800">
                                        R
                                        {(() => {
                                          const baseValue =
                                            property?.price || 0;
                                          const appreciationRate =
                                            valuationReport.propertyAppreciation
                                              .annualAppreciationRate / 100;
                                          const year20Value =
                                            baseValue *
                                            Math.pow(1 + appreciationRate, 20);
                                          return Math.round(
                                            year20Value,
                                          ).toLocaleString();
                                        })()}
                                      </td>
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
                        disabled={isGeneratingReport || isSavingAddress}
                        className="gap-2"
                      >
                        {isSavingAddress ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isGeneratingReport ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileBarChart className="h-4 w-4" />
                        )}
                        {isSavingAddress
                          ? "Saving address..."
                          : isGeneratingReport
                            ? `Generating... ${generationTimer}s`
                            : "Generate Report"}
                      </Button>
                      {!isGeneratingReport && !isSavingAddress && (
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
                    <div className="space-y-4">
                      {/* Compact Valuation Table */}
                      {valuationReport.valuations && (
                        <div className="space-y-2">
                          <table className="w-full text-xs border rounded-lg">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="py-2 px-3 text-left font-medium">
                                  Estimate Type
                                </th>
                                <th className="py-2 px-3 text-left font-medium">
                                  Formula Used
                                </th>
                                <th className="py-2 px-3 text-right font-medium">
                                  Outcome
                                </th>
                              </tr>
                            </thead>
                            <tbody>
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
                                      valuation.type ===
                                      "Midline (Proply est.)";
                                    return (
                                      <tr
                                        key={index}
                                        className={`border-b last:border-b-0 ${
                                          isMidline
                                            ? "bg-blue-50 border-blue-200"
                                            : "hover:bg-gray-50"
                                        }`}
                                      >
                                        <td
                                          className={`py-2 px-3 font-medium text-xs ${isMidline ? "text-blue-900" : ""}`}
                                        >
                                          {valuation.type}
                                        </td>
                                        <td
                                          className={`py-2 px-3 text-xs ${isMidline ? "text-blue-700" : "text-muted-foreground"}`}
                                        >
                                          {valuation.formula}
                                        </td>
                                        <td
                                          className={`py-2 px-3 text-right font-semibold text-xs ${isMidline ? "text-blue-900" : ""}`}
                                        >
                                          {formatCurrency(valuation.value)}
                                        </td>
                                      </tr>
                                    );
                                  },
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Compact Additional Information Table */}
                      {(valuationReport.summary ||
                        valuationReport.features ||
                        valuationReport.marketContext) && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-xs text-gray-700">
                            Additional Analysis
                          </h4>
                          <table className="w-full text-xs border rounded-lg">
                            <tbody>
                              {valuationReport.summary && (
                                <tr className="border-b hover:bg-gray-50">
                                  <td className="py-2 px-3 font-medium text-xs w-32">
                                    Analysis Summary
                                  </td>
                                  <td className="py-2 px-3 text-xs text-muted-foreground">
                                    {valuationReport.summary}
                                  </td>
                                </tr>
                              )}
                              {valuationReport.features && (
                                <tr className="border-b hover:bg-gray-50">
                                  <td className="py-2 px-3 font-medium text-xs w-32">
                                    Property Features
                                  </td>
                                  <td className="py-2 px-3 text-xs text-muted-foreground">
                                    {valuationReport.features}
                                  </td>
                                </tr>
                              )}
                              {valuationReport.marketContext && (
                                <tr className="hover:bg-gray-50">
                                  <td className="py-2 px-3 font-medium text-xs w-32">
                                    Market Context
                                  </td>
                                  <td className="py-2 px-3 text-xs text-muted-foreground">
                                    {valuationReport.marketContext}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
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
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black">
            <div className="relative w-full h-[90vh] bg-black flex items-center justify-center">
              <img
                src={createOptimizedImageUrl(
                  propertyImages[fullScreenImageIndex],
                  "original",
                )}
                alt={`Property ${property?.address} - Full screen ${fullScreenImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                loading="eager"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              
              {/* Preload adjacent images for faster navigation */}
              {propertyImages.length > 1 && (
                <>
                  {/* Preload previous image */}
                  {fullScreenImageIndex > 0 && (
                    <img
                      src={createOptimizedImageUrl(
                        propertyImages[fullScreenImageIndex - 1],
                        "original",
                      )}
                      alt=""
                      className="hidden"
                      loading="eager"
                    />
                  )}
                  {/* Preload next image */}
                  {fullScreenImageIndex < propertyImages.length - 1 && (
                    <img
                      src={createOptimizedImageUrl(
                        propertyImages[fullScreenImageIndex + 1],
                        "original",
                      )}
                      alt=""
                      className="hidden"
                      loading="eager"
                    />
                  )}
                </>
              )}

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
            <Button onClick={saveFinancingParameters}>Update</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Report Dialog */}
      <Dialog
        open={showSendReportDialog}
        onOpenChange={setShowSendReportDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Property Report</DialogTitle>
            <DialogDescription>
              Choose who should receive the property investment report for{" "}
              {property?.address}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-sm font-medium">wesley@proply.co.za</span>
                <span className="text-xs text-muted-foreground">
                  (Always included)
                </span>
              </div>

              {property?.agentEmail && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-to-agent"
                    checked={sendToAgent}
                    onCheckedChange={(checked) =>
                      setSendToAgent(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="send-to-agent"
                    className="text-sm font-medium cursor-pointer"
                  >
                    {property.agentEmail}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    ({property.agentName || "Property Agent"})
                  </span>
                </div>
              )}

              {!property?.agentEmail && (
                <div className="text-sm text-muted-foreground">
                  No agent email available for this property.
                </div>
              )}

              {/* Custom Email Option */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-to-custom"
                    checked={sendToCustomEmail}
                    onCheckedChange={(checked) =>
                      setSendToCustomEmail(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="send-to-custom"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Send to custom email
                  </Label>
                </div>
                {sendToCustomEmail && (
                  <div className="ml-6">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowSendReportDialog(false)}
              disabled={isSendingReport}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSendReport}
              disabled={isSendingReport}
              className="bg-[#1ba2ff] hover:bg-[#1ba2ff]/90"
            >
              {isSendingReport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Report
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Activity Modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Report Activity - {property?.address}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchActivity()}
                className="flex items-center gap-1"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </Button>
            </DialogTitle>
            <DialogDescription>
              Track all report sends and downloads for this property.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reportActivity && reportActivity.length > 0 ? (
              <>
                {/* Activity Summary */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {
                        reportActivity.filter(
                          (activity: any) => activity.activityType === "sent",
                        ).length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reports Sent
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        reportActivity.filter(
                          (activity: any) =>
                            activity.activityType === "downloaded",
                        ).length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Downloads
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {reportActivity.length > 0
                        ? new Date(
                            reportActivity[reportActivity.length - 1].timestamp,
                          ).toLocaleDateString()
                        : "Never"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last Activity
                    </div>
                  </div>
                </div>

                {/* Activity Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium text-xs">
                          Action
                        </th>
                        <th className="text-left p-2 font-medium text-xs">
                          Date & Time
                        </th>
                        <th className="text-left p-2 font-medium text-xs">
                          Recipient/Details
                        </th>
                        <th className="text-left p-2 font-medium text-xs">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportActivity.map((activity: any, index: number) => (
                        <tr key={index} className="border-t hover:bg-muted/30">
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              {activity.activityType === "sent" ? (
                                <Send className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Download className="h-3 w-3 text-green-500" />
                              )}
                              <span className="text-xs font-medium">
                                {activity.activityType === "sent"
                                  ? "Report Sent"
                                  : "Downloaded"}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )}
                            <br />
                            {new Date(activity.timestamp).toLocaleTimeString(
                              "en-GB",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                          <td className="p-2">
                            {activity.activityType === "sent" ? (
                              <div>
                                <div className="text-xs font-medium truncate">
                                  {activity.recipientEmail}
                                </div>
                                {activity.recipientName && (
                                  <div className="text-xs text-muted-foreground">
                                    {activity.recipientName}
                                  </div>
                                )}
                                {activity.ipAddress && (
                                  <div className="text-xs text-muted-foreground">
                                    IP: {activity.ipAddress}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="text-xs font-medium">
                                  Agent Download
                                </div>
                                {activity.ipAddress && (
                                  <div className="text-xs text-muted-foreground">
                                    IP: {activity.ipAddress}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 text-xs px-1 py-0"
                            >
                              ✓ Done
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
                <p className="text-muted-foreground">
                  Generate and send reports to see activity tracking here.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowActivityModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Report
            </DialogTitle>
            <DialogDescription>
              Please wait while we analyze your property and generate a comprehensive report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {progressSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : step.status === 'processing' ? (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                  ) : step.status === 'error' ? (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'processing' ? 'text-blue-700' :
                    step.status === 'error' ? 'text-red-700' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ 
                  width: `${(progressSteps.filter(s => s.status === 'completed').length / progressSteps.length) * 100}%` 
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {progressSteps.filter(s => s.status === 'completed').length} of {progressSteps.length} tasks completed
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
