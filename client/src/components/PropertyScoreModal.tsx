import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Home, Users, Calculator, Target, ArrowRight, TrendingUp, Calendar, Banknote } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useRef } from 'react';

interface PropertyScoreModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  propertyAddress?: string;
  purchasePrice?: number;
  marketAvgPrice?: number;
  pricePerM2?: number;
  areaAvgPricePerM2?: number;
  propertyCondition?: 'excellent' | 'good' | 'fair' | 'poor';
  recentSalesRange?: { min: number; max: number };
  rentalData?: {
    shortTerm: number;
    longTerm: number;
    occupancyRate: number;
    yieldLongTerm: number;
    yieldShortTerm: number;
  };
}

const calculateDealScore = (props: PropertyScoreModalProps) => {
  let score = 0;

  // Price vs market (30 points)
  if (props.purchasePrice && props.marketAvgPrice) {
    const priceDiff = ((props.purchasePrice - props.marketAvgPrice) / props.marketAvgPrice) * 100;
    if (priceDiff <= -10) score += 30;
    else if (priceDiff <= -5) score += 25;
    else if (priceDiff <= 0) score += 20;
    else if (priceDiff <= 5) score += 15;
    else if (priceDiff <= 10) score += 10;
    else score += 5;
  }

  // Price per m² (20 points)
  if (props.pricePerM2 && props.areaAvgPricePerM2) {
    const m2Diff = ((props.pricePerM2 - props.areaAvgPricePerM2) / props.areaAvgPricePerM2) * 100;
    if (m2Diff <= -10) score += 20;
    else if (m2Diff <= -5) score += 15;
    else if (m2Diff <= 0) score += 12;
    else if (m2Diff <= 5) score += 8;
    else if (m2Diff <= 10) score += 5;
    else score += 2;
  }

  // Property condition (15 points)
  switch (props.propertyCondition) {
    case 'excellent': score += 15; break;
    case 'good': score += 12; break;
    case 'fair': score += 8; break;
    case 'poor': score += 4; break;
    default: score += 0;
  }

  // Recent sales range (15 points)
  if (props.recentSalesRange && props.purchasePrice) {
    if (props.purchasePrice >= props.recentSalesRange.min && 
        props.purchasePrice <= props.recentSalesRange.max) {
      score += 15;
    } else if (props.purchasePrice < props.recentSalesRange.min) {
      score += 12; // Below range could be good for investors
    } else {
      score += 5; // Above range is less favorable
    }
  }

  // Rental yields (20 points)
  if (props.rentalData) {
    // Short term yield (10 points)
    if (props.rentalData.yieldShortTerm >= 12) score += 10;
    else if (props.rentalData.yieldShortTerm >= 10) score += 8;
    else if (props.rentalData.yieldShortTerm >= 8) score += 6;
    else if (props.rentalData.yieldShortTerm >= 6) score += 4;
    else score += 2;

    // Long term yield (10 points)
    if (props.rentalData.yieldLongTerm >= 8) score += 10;
    else if (props.rentalData.yieldLongTerm >= 7) score += 8;
    else if (props.rentalData.yieldLongTerm >= 6) score += 6;
    else if (props.rentalData.yieldLongTerm >= 5) score += 4;
    else score += 2;
  }

  return Math.min(Math.round(score), 100);
};

const DealMeter = ({ score }: { score: number }) => {
  const meterRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (meterRef.current) {
      const needle = meterRef.current.querySelector('#needle');
      if (needle) {
        const rotation = -90 + (score / 100) * 180;
        needle.setAttribute('transform', `rotate(${rotation}, 150, 150)`);
      }
    }
  }, [score]);

  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      <svg ref={meterRef} viewBox="0 0 300 200" className="w-full">
        {/* Meter background */}
        <path
          d="M 50,150 A 100,100 0 0 1 250,150"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="30"
          strokeLinecap="round"
        />

        {/* Colored meter segments */}
        <path
          d="M 50,150 A 100,100 0 0 1 150,50"
          fill="none"
          stroke="#ef4444"
          strokeWidth="30"
          strokeLinecap="round"
          strokeDasharray="157"
          strokeDashoffset={157 * (1 - Math.min(score / 50, 1))}
        />
        <path
          d="M 150,50 A 100,100 0 0 1 250,150"
          fill="none"
          stroke="#22c55e"
          strokeWidth="30"
          strokeLinecap="round"
          strokeDasharray="157"
          strokeDashoffset={157 * (1 - Math.max((score - 50) / 50, 0))}
        />

        {/* Needle */}
        <line
          id="needle"
          x1="150"
          y1="150"
          x2="150"
          y2="70"
          stroke="#1e293b"
          strokeWidth="4"
          strokeLinecap="round"
          transform="rotate(-90, 150, 150)"
        />

        {/* Center point */}
        <circle cx="150" cy="150" r="10" fill="#1e293b" />

        {/* Score text */}
        <text
          x="150"
          y="185"
          textAnchor="middle"
          className="text-3xl font-bold"
          fill="#1e293b"
        >
          {score}
        </text>
      </svg>

      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 text-sm font-medium">
        <span className="text-red-500">Poor</span>
        <span className="text-green-500">Excellent</span>
      </div>
    </div>
  );
};

export function PropertyScoreModal({ 
  isOpen, 
  onOpenChange,
  propertyId = "PROP-1234",
  propertyAddress = "27 Leeuwen St, Cape Town City Centre, 8001",
  purchasePrice = 3500000,
  marketAvgPrice = 3250000,
  pricePerM2 = 32500,
  areaAvgPricePerM2 = 31000,
  propertyCondition = 'excellent',
  recentSalesRange = { min: 3400000, max: 3700000 },
  rentalData = {
    shortTerm: 50000,
    longTerm: 18000,
    occupancyRate: 75,
    yieldLongTerm: 6.2,
    yieldShortTerm: 12.9
  }
}: PropertyScoreModalProps) {
  const dealScore = calculateDealScore({
    purchasePrice,
    marketAvgPrice,
    pricePerM2,
    areaAvgPricePerM2,
    propertyCondition,
    recentSalesRange,
    rentalData
  });

  // Deal Assessment Logic
  const priceDiff = marketAvgPrice ? ((purchasePrice - marketAvgPrice) / marketAvgPrice) * 100 : 0;

  // Deal Badge logic
  const getDealBadge = () => {
    if (priceDiff <= -5) return { emoji: "🔥", text: "GREAT DEAL", color: "bg-green-500", textColor: "text-green-500" };
    if (priceDiff <= 5) return { emoji: "✅", text: "FAIR PRICE", color: "bg-blue-500", textColor: "text-blue-500" };
    return { emoji: "⚠️", text: "OVERPRICED", color: "bg-amber-500", textColor: "text-amber-500" };
  };

  const dealBadge = getDealBadge();

  // Sample Rental Data - moved inside component to avoid potential module scope issues
  //const rentalData = { ... }; //This is already defined in the props

  // Affordability Calculations
  const deposit = purchasePrice * 0.1; // 10% deposit
  const affordabilityData = {
    deposit: deposit,
    monthlyPayment: 34000,
    reducedRate: 31000, // If rates drop 1%
    transferCosts: 175000,
    monthlyIncome: 102000, // Required monthly income
    transferDuty: priceDiff > 0 ? 95000 : 85000
  };


  // Buyer Profile Suggestions
  const buyerProfiles = [
    {
      type: "Short-term rental investor",
      match: 95,
      reason: "High Airbnb potential with 12.9% yield"
    },
    {
      type: "Young professional couple",
      match: 80,
      reason: "Great central location, modern features"
    },
    {
      type: "Buy-to-let landlord",
      match: 75,
      reason: "Strong rental demand in this area"
    }
  ];

  // "Good Deal" Price Range
  const goodDealPriceMax = marketAvgPrice * 1.05;

  // Pre-calculate complex values to avoid re-computation in render
  const shortTermMonthlyIncome = rentalData.shortTerm * (rentalData.occupancyRate/100);
  const longTermMonthlyIncome = rentalData.longTerm;
  const activeMonthlyIncome = rentalData.yieldShortTerm > rentalData.yieldLongTerm ? shortTermMonthlyIncome : longTermMonthlyIncome;
  const monthlyCashFlow = activeMonthlyIncome - affordabilityData.monthlyPayment;
  const shortTermYearlyIncome = rentalData.shortTerm * 12 * (rentalData.occupancyRate/100);
  const longTermYearlyIncome = rentalData.longTerm * 12;
  const totalCashNeeded = affordabilityData.deposit + affordabilityData.transferDuty + affordabilityData.transferCosts;
  const totalMonthlyCost = affordabilityData.monthlyPayment + 4500;

  // Safely render text for agent tips
  const getAgentTipText = () => {
    if (priceDiff <= 0) {
      return `Say: "Proply's market analysis shows this is a ${dealBadge.text.toLowerCase()}. It's actually priced below the average for this area."`;
    } else {
      return `Say: "Proply's market analysis shows this is a ${dealBadge.text.toLowerCase()}. While slightly above market average, it offers exceptional value."`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <div>
              Property Deal Analyzer
              <div className="text-sm font-normal text-muted-foreground mt-1">
                {propertyAddress}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${dealBadge.color} text-white px-3 py-1.5 text-lg`}>
                {dealBadge.emoji} {dealBadge.text}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="deal-score" className="mt-4">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="deal-score">Deal Score</TabsTrigger>
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="rental">Rental</TabsTrigger>
            <TabsTrigger value="affordability">Affordability</TabsTrigger>
            <TabsTrigger value="buyer">Buyer Profile</TabsTrigger>
          </TabsList>

          {/* Updated Deal Score Tab */}
          <TabsContent value="deal-score">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle>Deal Score Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <DealMeter score={dealScore} />

                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Price vs Market</span>
                    <span className="font-semibold">
                      {((purchasePrice - marketAvgPrice) / marketAvgPrice * 100).toFixed(1)}%
                      {purchasePrice <= marketAvgPrice ? " below" : " above"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Price per m²</span>
                    <span className="font-semibold">
                      R{pricePerM2.toLocaleString()}/m²
                      {pricePerM2 <= areaAvgPricePerM2 ? " (Competitive)" : " (Premium)"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Property Condition</span>
                    <span className="font-semibold capitalize">{propertyCondition}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Recent Sales Range</span>
                    <span className="font-semibold">
                      R{recentSalesRange.min.toLocaleString()} - R{recentSalesRange.max.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Short-term Yield</span>
                    <span className="font-semibold">{rentalData.yieldShortTerm}%</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Long-term Yield</span>
                    <span className="font-semibold">{rentalData.yieldLongTerm}%</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Quick Summary</h3>
                  <p>
                    {dealScore >= 80 ? "Excellent deal! This property shows strong potential across all key metrics." :
                     dealScore >= 60 ? "Good opportunity with some positive indicators. Worth serious consideration." :
                     dealScore >= 40 ? "Fair deal with mixed indicators. May need negotiation." :
                     "Exercise caution. Multiple metrics suggest this deal needs careful evaluation."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2️⃣ PRICE JUSTIFICATION TAB */}
          <TabsContent value="price">
            <Card className="mb-4 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>Price Justification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg mb-6">
                  <div>
                    <div className="text-sm font-medium">Asking Price</div>
                    <div className="text-3xl font-bold">R{purchasePrice.toLocaleString()}</div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
                  <div>
                    <div className="text-sm font-medium">Market Average</div>
                    <div className="text-3xl font-bold">R{marketAvgPrice.toLocaleString()}</div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
                  <div>
                    <div className="text-sm font-medium">Difference</div>
                    <div className={`text-3xl font-bold ${priceDiff > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                      {priceDiff > 0 ? '+' : ''}{Math.round(priceDiff)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">Price per m²</div>
                    <div className="font-bold">R{pricePerM2.toLocaleString()}/m²</div>
                    <div className="text-muted-foreground">(vs. area avg R{areaAvgPricePerM2.toLocaleString()}/m²)</div>
                    <Badge variant="outline" className={priceDiff <= 5 ? 'text-green-500' : 'text-amber-500'}>
                      {priceDiff <= 5 ? 'COMPETITIVE' : 'PREMIUM'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="font-medium">Rental Demand</div>
                    <div className="font-bold">Very High</div>
                    <div className="text-muted-foreground">(+{rentalData.occupancyRate}% vs. average)</div>
                    <Badge className="bg-green-500 text-white">STRONG</Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="font-medium">Property Condition</div>
                    <div className="font-bold">{propertyCondition}</div>
                    <div className="text-muted-foreground">(minimal repairs needed)</div>
                    <Badge className="bg-green-500 text-white">MOVE-IN READY</Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="font-medium">Recent Area Sales</div>
                    <div className="font-bold">R{recentSalesRange.min.toLocaleString()} - R{recentSalesRange.max.toLocaleString()}</div>
                    <div className="text-muted-foreground">(last 3 months)</div>
                    <Badge variant="outline" className="text-blue-500">WITHIN RANGE</Badge>
                  </div>
                </div>

                {priceDiff > 5 && (
                  <div className="mt-6 p-4 border rounded-lg bg-muted">
                    <div className="font-medium mb-2">To make this a "Good Deal":</div>
                    <div className="flex items-center justify-between">
                      <div>Maximum recommended price:</div>
                      <div className="font-bold">R{goodDealPriceMax.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div>Suggested negotiation target:</div>
                      <div className="font-bold text-green-500">-R{(purchasePrice - goodDealPriceMax).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg border bg-yellow-50">
              <div className="flex gap-3">
                <div className="mt-0.5 text-amber-500">💡</div>
                <div>
                  <div className="font-semibold text-amber-800">Agent Tip</div>
                  <div className="text-amber-700">
                    When clients say "it's too expensive," show them the rental demand is {rentalData.occupancyRate}% higher than
                    average, and recent sales in this area ranged from R{recentSalesRange.min.toLocaleString()} to R{recentSalesRange.max.toLocaleString()}.
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 3️⃣ RENTAL POTENTIAL TAB */}
          <TabsContent value="rental">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle>Rental Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card className={`border-t-4 ${rentalData.yieldShortTerm > rentalData.yieldLongTerm ? 'border-t-green-500' : 'border-t-muted'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-500" />
                          <div className="font-medium">Short-Term (Airbnb)</div>
                        </div>
                        {rentalData.yieldShortTerm > rentalData.yieldLongTerm && (
                          <Badge className="bg-green-500 text-white">RECOMMENDED</Badge>
                        )}
                      </div>

                      <div className="text-3xl font-bold mb-1">
                        R{rentalData.shortTerm.toLocaleString()}/month
                      </div>
                      <div className="text-muted-foreground mb-3">
                        Based on {rentalData.occupancyRate}% occupancy rate
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <div>Annual yield:</div>
                        <div className="font-bold text-green-500">{rentalData.yieldShortTerm}%</div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <div>Yearly income:</div>
                        <div className="font-bold">R{shortTermYearlyIncome.toLocaleString()}</div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <div>Management fee:</div>
                        <div className="font-bold">15-20%</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`border-t-4 ${rentalData.yieldShortTerm < rentalData.yieldLongTerm ? 'border-t-green-500' : 'border-t-muted'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Home className="h-5 w-5 text-purple-500" />
                          <div className="font-medium">Long-Term Rental</div>
                        </div>
                        {rentalData.yieldShortTerm < rentalData.yieldLongTerm && (
                          <Badge className="bg-green-500 text-white">RECOMMENDED</Badge>
                        )}
                      </div>

                      <div className="text-3xl font-bold mb-1">
                        R{rentalData.longTerm.toLocaleString()}/month
                      </div>
                      <div className="text-muted-foreground mb-3">
                        Standard 12-month lease
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <div>Annual yield:</div>
                        <div className="font-bold">{rentalData.yieldLongTerm}%</div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <div>Yearly income:</div>
                        <div className="font-bold">R{longTermYearlyIncome.toLocaleString()}</div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <div>Management fee:</div>
                        <div className="font-bold">8-10%</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 border rounded-lg bg-muted/30 mb-4">
                  <div className="font-bold mb-2">Rental Demand Analysis</div>
                  <div className="flex items-center justify-between mb-3">
                    <div>Demand Level:</div>
                    <div className="font-bold">High (+{rentalData.occupancyRate}% vs. area average)</div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>Average Vacancy Period:</div>
                    <div className="font-bold">7 days (vs. area avg 21 days)</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>Tenant Profile:</div>
                    <div className="font-bold">Young professionals, Digital nomads</div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="font-bold mb-2">Income vs. Expenses</div>
                  <div className="flex justify-between mb-3">
                    <div>Monthly Income ({rentalData.yieldShortTerm > rentalData.yieldLongTerm ? 'Airbnb' : 'Rental'}):</div>
                    <div className="font-bold">
                      R{activeMonthlyIncome.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex justify-between mb-3">
                    <div>Monthly Bond Payment:</div>
                    <div className="font-bold">R{affordabilityData.monthlyPayment.toLocaleString()}</div>
                  </div>
                  <div className="flex justify-between mb-1">
                    <div>Monthly Cash Flow:</div>
                    <div className={`font-bold ${monthlyCashFlow > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {monthlyCashFlow > 0 ? '+' : ''}
                      R{monthlyCashFlow.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg border bg-yellow-50">
              <div className="flex gap-3">
                <div className="mt-0.5 text-amber-500">💡</div>
                <div>
                  <div className="font-semibold text-amber-800">Agent Tip</div>
                  <div className="text-amber-700">
                    For investor clients, highlight that this property can generate 
                    R{shortTermYearlyIncome.toLocaleString()} annually as an Airbnb, 
                    with a yield of {rentalData.yieldShortTerm}% that's well above market average.
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 4️⃣ AFFORDABILITY TAB */}
          <TabsContent value="affordability">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle>Affordability Cheat Sheet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card className="bg-muted/20">
                    <CardContent className="p-4">
                      <div className="font-medium mb-3">Upfront Costs</div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>Deposit (10%):</div>
                          <div className="font-bold">R{affordabilityData.deposit.toLocaleString()}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>Transfer duty:</div>
                          <div className="font-bold">R{affordabilityData.transferDuty.toLocaleString()}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>Transfer costs:</div>
                          <div className="font-bold">R{affordabilityData.transferCosts.toLocaleString()}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>Total cash needed:</div>
                          <div className="font-bold">
                            R{totalCashNeeded.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/20">
                    <CardContent className="p-4">
                      <div className="font-medium mb-3">Monthly Payments</div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>Bond payment:</div>
                          <div className="font-bold">R{affordabilityData.monthlyPayment.toLocaleString()}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>If rates drop 1%:</div>
                          <div className="font-bold text-green-500">R{affordabilityData.reducedRate.toLocaleString()}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>Levies/rates:</div>
                          <div className="font-bold">R4,500</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>Total monthly cost:</div>
                          <div className="font-bold">R{totalMonthlyCost.toLocaleString()}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 border rounded-lg bg-muted/30 mb-4">
                  <div className="font-bold mb-3">Income Requirements</div>
                  <div className="flex items-center justify-between">
                    <div>Required household income:</div>
                    <div className="font-bold">R{affordabilityData.monthlyIncome.toLocaleString()}/month</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Based on 30% debt-to-income ratio
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="font-bold mb-2">Different Deposit Options</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div>20% deposit:</div>
                        <div className="font-bold">R29,100/month</div>
                      </div>
                      <div className="flex justify-between">
                        <div>10% deposit:</div>
                        <div className="font-bold">R34,000/month</div>
                      </div>
                      <div className="flex justify-between">
                        <div>5% deposit:</div>
                        <div className="font-bold">R36,200/month</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="font-bold mb-2">Rate Changes</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div>Current rate:</div>
                        <div className="font-bold">R34,000/month</div>
                      </div>
                      <div className="flex justify-between">
                        <div>If rates drop 1%:</div>
                        <div className="font-bold text-green-500">R31,000/month</div>
                      </div>
                      <div className="flex justify-between">
                        <div>If rates rise 1%:</div>
                        <div className="font-bold text-red-500">R37,200/month</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </</Card>

            <div className="p-4 rounded-lg border bg-yellow-50">
              <div className="flex gap-3">
                <div className="mt-0.5 text-amber-500">💡</div>
                <div>
                  <div className="font-semibold text-amber-800">Agent Tip</div>
                  <div className="text-amber-700">
                    Tell clients: "At R3.5M with a 10% deposit, you'll need about R34K per month for the bond, 
                    which requires a household income of around R102K per month."
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 5️⃣ BUYER PROFILE TAB */}
          <TabsContent value="buyer">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle>Ideal Buyer Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {buyerProfiles.map((profile, i) => (
                    <div key={`profile-${i}`} className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-lg flex items-center gap-2">
                          {i === 0 ? 
                            <Users className="h-5 w-5 text-primary" /> : 
                            i === 1 ? <Home className="h-5 w-5 text-blue-500" /> : 
                            <Banknote className="h-5 w-5 text-green-500" />
                          }
                          {profile.type}
                        </div>
                        <Badge className={profile.match >= 90 ? "bg-green-500" : profile.match >= 80 ? "bg-blue-500" : "bg-muted"}>
                          {profile.match}% Match
                        </Badge>
                      </div>

                      <div className="mb-3 text-muted-foreground">
                        {profile.reason}
                      </div>

                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-4 flex rounded bg-muted">
                          <div 
                            className={`h-full ${
                              profile.match >= 90 ? "bg-green-500" : 
                              profile.match >= 80 ? "bg-blue-500" : 
                              profile.match >= 70 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${profile.match}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {i === 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <div>Short-term rental yield:</div>
                              <div className="font-bold text-green-500">{rentalData.yieldShortTerm}%</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>Airbnb occupancy rate:</div>
                              <div className="font-bold">{rentalData.occupancyRate}%</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>Monthly Airbnb income:</div>
                              <div className="font-bold">R{rentalData.shortTerm.toLocaleString()}</div>
                            </div>
                          </>
                        )}

                        {i === 1 && (
                          <>
                            <div className="flex justify-between items-center">
                              <div>Proximity to business district:</div>
                              <div className="font-bold">5 min walk</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>Transport links:</div>
                              <div className="font-bold">Excellent</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>Restaurants & amenities:</div>
                              <div className="font-bold">20+ within 500m</div>
                            </div>
                          </>
                        )}

                        {i === 2 && (
                          <>
                            <div className="flex justify-between items-center">
                              <div>Long-term rental yield:</div>
                              <div className="font-bold">{rentalData.yieldLongTerm}%</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>Tenant demand:</div>
                              <div className="font-bold">High (+{rentalData.occupancyRate}%)</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>Monthly rental income:</div>
                              <div className="font-bold">R{rentalData.longTerm.toLocaleString()}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 border rounded-lg bg-muted">
                  <div className="font-bold mb-2">How to Position This Property</div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center mt-0.5 text-xs">1</div>
                      <div>
                        <div className="font-medium">For investors:</div>
                        <div className="text-sm">Highlight the exceptional {rentalData.yieldShortTerm}% Airbnb yield and strong rental demand in the area.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center mt-0.5 text-xs">2</div>
                      <div>
                        <div className="font-medium">For young professionals:</div>
                        <div className="text-sm">Emphasize the prime location, walkability to Cape Town CBD, and modern amenities.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center mt-0.5 text-xs">3</div>
                      <div>
                        <div className="font-medium">For buy-to-let landlords:</div>
                        <div className="text-sm">Focus on consistent rental demand and competitive yield compared to other areas.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg border bg-yellow-50">
              <div className="flex gap-3">
                <div className="mt-0.5 text-amber-500">💡</div>
                <div>
                  <div className="font-semibold text-amber-800">Agent Tip</div>
                  <div className="text-amber-700">
                    Always qualify your buyer first. For investors, focus on the rental returns and yield.
                    For owner-occupiers, highlight the lifestyle benefits and proximity to amenities.
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-center text-muted-foreground mt-6">
          *Analysis based on Proply Tech (Pty) Ltd AI-Powered Market Analysis using real-time market data
        </div>
      </DialogContent>
    </Dialog>
  );
}