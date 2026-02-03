import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Helmet } from "react-helmet";
import { Calculator, TrendingUp, Home, Percent, DollarSign  } from "lucide-react";

interface FixedCosts {
  municipalRates: string;
  levies: string;
  electricity: string;
  water: string;
  internet: string;
  insurance: string;
  bond: string;
  security: string;
  streaming: string;
  otherFixed: string;
}

interface VariableCosts {
  avgLengthOfStay: string;
  cleaningFee: string;
  laundryFee: string;
  amenitiesFee: string;
  otherVariablePercent: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

function formatInputNumber(value: string): string {
  const num = parseNumber(value);
  if (num === 0 && value === '') return '';
  return num.toLocaleString('en-ZA');
}

export default function DealAnalyser() {
  const [nightlyRate, setNightlyRate] = useState("1500");
  const [occupancyRate, setOccupancyRate] = useState("65");
  
  const [fixedCosts, setFixedCosts] = useState<FixedCosts>({
    municipalRates: "800",
    levies: "1500",
    electricity: "800",
    water: "300",
    internet: "600",
    insurance: "400",
    bond: "8000",
    security: "500",
    streaming: "200",
    otherFixed: "0",
  });

  const [variableCosts, setVariableCosts] = useState<VariableCosts>({
    avgLengthOfStay: "3",
    cleaningFee: "350",
    laundryFee: "150",
    amenitiesFee: "100",
    otherVariablePercent: "2.5",
  });

  const [isProfessionallyManaged, setIsProfessionallyManaged] = useState(false);
  const [selfManagedFee, setSelfManagedFee] = useState("3");
  const [hostOnlyFee, setHostOnlyFee] = useState("15.5");
  const [managementFee, setManagementFee] = useState("20");

  const calculations = useMemo(() => {
    const rate = parseNumber(nightlyRate);
    const occupancy = parseNumber(occupancyRate) / 100;
    const daysPerMonth = 30.44;
    
    const occupiedNightsPerMonth = daysPerMonth * occupancy;
    const monthlyRevenue = rate * occupiedNightsPerMonth;
    const annualRevenue = monthlyRevenue * 12;

    const totalFixedCosts = 
      parseNumber(fixedCosts.municipalRates) +
      parseNumber(fixedCosts.levies) +
      parseNumber(fixedCosts.electricity) +
      parseNumber(fixedCosts.water) +
      parseNumber(fixedCosts.internet) +
      parseNumber(fixedCosts.insurance) +
      parseNumber(fixedCosts.bond) +
      parseNumber(fixedCosts.security) +
      parseNumber(fixedCosts.streaming) +
      parseNumber(fixedCosts.otherFixed);

    const avgStay = parseNumber(variableCosts.avgLengthOfStay) || 1;
    const turnoversPerMonth = occupiedNightsPerMonth / avgStay;
    const cleaningCost = parseNumber(variableCosts.cleaningFee) * turnoversPerMonth;
    const laundryCost = parseNumber(variableCosts.laundryFee) * turnoversPerMonth;
    const amenitiesCost = parseNumber(variableCosts.amenitiesFee) * turnoversPerMonth;
    const otherVariableCost = monthlyRevenue * (parseNumber(variableCosts.otherVariablePercent) / 100);
    const totalVariableCosts = cleaningCost + laundryCost + amenitiesCost + otherVariableCost;

    // Self-managed: 3% Airbnb fee from gross revenue
    // Professionally managed: 15.5% host-only fee + 15% VAT from gross, then management fee from remainder
    const SA_VAT_RATE = 0.15; // South African VAT rate
    let airbnbCommission: number;
    let managementCommission: number;
    let revenueAfterAirbnb: number;
    
    if (isProfessionallyManaged) {
      // Host-only fee model: 15.5% + VAT deducted first (as per Airbnb SA billing)
      const baseFee = monthlyRevenue * (parseNumber(hostOnlyFee) / 100);
      airbnbCommission = baseFee * (1 + SA_VAT_RATE); // Add 15% VAT on top
      revenueAfterAirbnb = monthlyRevenue - airbnbCommission;
      // Management fee applied to revenue after Airbnb takes their cut
      managementCommission = revenueAfterAirbnb * (parseNumber(managementFee) / 100);
    } else {
      // Split-fee model: only 3% host fee (no VAT as it's a different fee structure)
      airbnbCommission = monthlyRevenue * (parseNumber(selfManagedFee) / 100);
      managementCommission = 0;
    }
    const totalCommissions = airbnbCommission + managementCommission;

    const totalMonthlyCosts = totalFixedCosts + totalVariableCosts + totalCommissions;
    const monthlyProfit = monthlyRevenue - totalMonthlyCosts;
    const annualProfit = monthlyProfit * 12;

    return {
      monthlyRevenue,
      annualRevenue,
      totalFixedCosts,
      cleaningCost,
      laundryCost,
      amenitiesCost,
      otherVariableCost,
      totalVariableCosts,
      turnoversPerMonth,
      airbnbCommission,
      managementCommission,
      totalCommissions,
      totalMonthlyCosts,
      monthlyProfit,
      annualProfit,
    };
  }, [nightlyRate, occupancyRate, fixedCosts, variableCosts, isProfessionallyManaged, selfManagedFee, hostOnlyFee, managementFee]);

  const profitMatrix = useMemo(() => {
    const nightlyRates = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000];
    const occupancyRates = [30, 40, 50, 60, 70, 80, 90];
    const daysPerMonth = 30.44;
    
    const totalFixedCosts = 
      parseNumber(fixedCosts.municipalRates) +
      parseNumber(fixedCosts.levies) +
      parseNumber(fixedCosts.electricity) +
      parseNumber(fixedCosts.water) +
      parseNumber(fixedCosts.internet) +
      parseNumber(fixedCosts.insurance) +
      parseNumber(fixedCosts.bond) +
      parseNumber(fixedCosts.security) +
      parseNumber(fixedCosts.streaming) +
      parseNumber(fixedCosts.otherFixed);

    const matrix: { rate: number; profits: { occupancy: number; profit: number }[] }[] = [];
    
    for (const rate of nightlyRates) {
      const row: { occupancy: number; profit: number }[] = [];
      
      for (const occ of occupancyRates) {
        const occupancy = occ / 100;
        const occupiedNightsPerMonth = daysPerMonth * occupancy;
        const monthlyRevenue = rate * occupiedNightsPerMonth;
        
        const avgStay = parseNumber(variableCosts.avgLengthOfStay) || 1;
        const turnoversPerMonth = occupiedNightsPerMonth / avgStay;
        const cleaningCost = parseNumber(variableCosts.cleaningFee) * turnoversPerMonth;
        const laundryCost = parseNumber(variableCosts.laundryFee) * turnoversPerMonth;
        const amenitiesCost = parseNumber(variableCosts.amenitiesFee) * turnoversPerMonth;
        const otherVariableCost = monthlyRevenue * (parseNumber(variableCosts.otherVariablePercent) / 100);
        const totalVariableCosts = cleaningCost + laundryCost + amenitiesCost + otherVariableCost;

        const SA_VAT_RATE = 0.15;
        let airbnbCommission: number;
        let managementCommission: number;
        
        if (isProfessionallyManaged) {
          const baseFee = monthlyRevenue * (parseNumber(hostOnlyFee) / 100);
          airbnbCommission = baseFee * (1 + SA_VAT_RATE); // 15.5% + VAT
          const revenueAfterAirbnb = monthlyRevenue - airbnbCommission;
          managementCommission = revenueAfterAirbnb * (parseNumber(managementFee) / 100);
        } else {
          airbnbCommission = monthlyRevenue * (parseNumber(selfManagedFee) / 100);
          managementCommission = 0;
        }
        const totalCommissions = airbnbCommission + managementCommission;

        const totalMonthlyCosts = totalFixedCosts + totalVariableCosts + totalCommissions;
        const monthlyProfit = monthlyRevenue - totalMonthlyCosts;
        
        row.push({ occupancy: occ, profit: monthlyProfit });
      }
      
      matrix.push({ rate, profits: row });
    }
    
    return { matrix, occupancyRates };
  }, [fixedCosts, variableCosts, isProfessionallyManaged, selfManagedFee, hostOnlyFee, managementFee]);

  const handleFixedCostChange = (field: keyof FixedCosts, value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    setFixedCosts(prev => ({ ...prev, [field]: cleaned }));
  };

  const handleVariableCostChange = (field: keyof VariableCosts, value: string) => {
    if (field === 'otherVariablePercent') {
      const cleaned = value.replace(/[^\d.]/g, '');
      setVariableCosts(prev => ({ ...prev, [field]: cleaned }));
    } else {
      const cleaned = value.replace(/[^\d]/g, '');
      setVariableCosts(prev => ({ ...prev, [field]: cleaned }));
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col overflow-x-hidden w-full">
      <Helmet>
        <title>Airbnb Deal Analyser | Calculate Your Short-Term Rental Profit | Proply</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="Free Airbnb deal analyser for South African property investors. Calculate monthly profit, operating costs, and commissions for short-term rental properties." />
        <meta name="keywords" content="airbnb calculator, deal analyser, short term rental calculator, airbnb profit calculator, south africa airbnb, rental property calculator, airbnb investment, property investment south africa" />
        <meta property="og:title" content="Free Airbnb Deal Analyser | Calculate Your Rental Profit" />
        <meta property="og:description" content="Free Airbnb deal analyser for South African investors. Calculate monthly profit with our comprehensive short-term rental calculator." />
        <link rel="canonical" href="https://app.proply.co.za/deal-analyser" />
      </Helmet>

      <PublicHeader />

      <main className="w-full pt-16 lg:pt-20 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              Airbnb Deal Analyser
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Calculate your short-term rental investment potential, estimate net profit, 
              and develop a comprehensive cash flow analysis for South African properties.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nightlyRate">Nightly Rate (R)</Label>
                      <Input
                        id="nightlyRate"
                        placeholder="e.g. 1,500"
                        value={formatInputNumber(nightlyRate)}
                        onChange={(e) => setNightlyRate(e.target.value.replace(/[^\d]/g, ''))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="occupancyRate">Occupancy Rate (%)</Label>
                      <Input
                        id="occupancyRate"
                        placeholder="e.g. 65"
                        value={occupancyRate}
                        onChange={(e) => setOccupancyRate(e.target.value.replace(/[^\d.]/g, ''))}
                        type="text"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Monthly Revenue</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(calculations.monthlyRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Annual Revenue</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(calculations.annualRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Home className="h-5 w-5 text-blue-600" />
                    Fixed Monthly Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="municipalRates">Municipal Rates & Taxes (R) *</Label>
                      <Input
                        id="municipalRates"
                        placeholder="e.g. 800"
                        value={formatInputNumber(fixedCosts.municipalRates)}
                        onChange={(e) => handleFixedCostChange('municipalRates', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="levies">Levies / Body Corporate (R) *</Label>
                      <Input
                        id="levies"
                        placeholder="e.g. 1,500"
                        value={formatInputNumber(fixedCosts.levies)}
                        onChange={(e) => handleFixedCostChange('levies', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="electricity">Electricity (R)</Label>
                      <Input
                        id="electricity"
                        placeholder="e.g. 800"
                        value={formatInputNumber(fixedCosts.electricity)}
                        onChange={(e) => handleFixedCostChange('electricity', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="water">Water (R)</Label>
                      <Input
                        id="water"
                        placeholder="e.g. 300"
                        value={formatInputNumber(fixedCosts.water)}
                        onChange={(e) => handleFixedCostChange('water', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="internet">Internet / WiFi (R)</Label>
                      <Input
                        id="internet"
                        placeholder="e.g. 600"
                        value={formatInputNumber(fixedCosts.internet)}
                        onChange={(e) => handleFixedCostChange('internet', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance">Insurance (R)</Label>
                      <Input
                        id="insurance"
                        placeholder="e.g. 400"
                        value={formatInputNumber(fixedCosts.insurance)}
                        onChange={(e) => handleFixedCostChange('insurance', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bond">Bond / Mortgage (R)</Label>
                      <Input
                        id="bond"
                        placeholder="e.g. 8,000"
                        value={formatInputNumber(fixedCosts.bond)}
                        onChange={(e) => handleFixedCostChange('bond', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="security">Security (R)</Label>
                      <Input
                        id="security"
                        placeholder="e.g. 500"
                        value={formatInputNumber(fixedCosts.security)}
                        onChange={(e) => handleFixedCostChange('security', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="streaming">Streaming / DStv (R)</Label>
                      <Input
                        id="streaming"
                        placeholder="e.g. 200"
                        value={formatInputNumber(fixedCosts.streaming)}
                        onChange={(e) => handleFixedCostChange('streaming', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="otherFixed">Other Fixed Costs (R)</Label>
                      <Input
                        id="otherFixed"
                        placeholder="e.g. 0"
                        value={formatInputNumber(fixedCosts.otherFixed)}
                        onChange={(e) => handleFixedCostChange('otherFixed', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Fixed Costs</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(calculations.totalFixedCosts)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    Variable Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="avgLengthOfStay">Average Length of Stay (nights)</Label>
                      <Input
                        id="avgLengthOfStay"
                        placeholder="e.g. 3"
                        value={variableCosts.avgLengthOfStay}
                        onChange={(e) => handleVariableCostChange('avgLengthOfStay', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cleaningFee">Cleaning Fee per Turnover (R)</Label>
                      <Input
                        id="cleaningFee"
                        placeholder="e.g. 350"
                        value={formatInputNumber(variableCosts.cleaningFee)}
                        onChange={(e) => handleVariableCostChange('cleaningFee', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="laundryFee">Laundry Fee per Turnover (R)</Label>
                      <Input
                        id="laundryFee"
                        placeholder="e.g. 150"
                        value={formatInputNumber(variableCosts.laundryFee)}
                        onChange={(e) => handleVariableCostChange('laundryFee', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amenitiesFee">Guest Amenities per Turnover (R)</Label>
                      <Input
                        id="amenitiesFee"
                        placeholder="e.g. 100"
                        value={formatInputNumber(variableCosts.amenitiesFee)}
                        onChange={(e) => handleVariableCostChange('amenitiesFee', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="otherVariablePercent">Other Expenses (% of revenue)</Label>
                      <Input
                        id="otherVariablePercent"
                        placeholder="e.g. 2.5"
                        value={variableCosts.otherVariablePercent}
                        onChange={(e) => handleVariableCostChange('otherVariablePercent', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-sm text-gray-500">Est. turnovers/month: <span className="font-medium text-gray-700">{calculations.turnoversPerMonth.toFixed(1)}</span></p>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium text-gray-700">Total Variable Costs</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(calculations.totalVariableCosts)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Percent className="h-5 w-5 text-blue-600" />
                    Commissions & Fees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                    <div>
                      <Label htmlFor="managementToggle" className="text-base font-medium">Property Management</Label>
                      <p className="text-sm text-gray-500">
                        {isProfessionallyManaged ? "Professionally managed" : "Self-managed"}
                      </p>
                    </div>
                    <Switch
                      id="managementToggle"
                      checked={isProfessionallyManaged}
                      onCheckedChange={setIsProfessionallyManaged}
                    />
                  </div>

                  {!isProfessionallyManaged ? (
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="selfManagedFee">Airbnb Host Fee (%) <span className="text-gray-400 font-normal">split-fee model</span></Label>
                        <Input
                          id="selfManagedFee"
                          placeholder="e.g. 3"
                          value={selfManagedFee}
                          onChange={(e) => setSelfManagedFee(e.target.value.replace(/[^\d.]/g, ''))}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Platform fee: {formatCurrency(calculations.airbnbCommission)}/month</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hostOnlyFee">Airbnb Host Service Fee (%) <span className="text-gray-400 font-normal">+ 15% VAT</span></Label>
                        <Input
                          id="hostOnlyFee"
                          placeholder="e.g. 15.5"
                          value={hostOnlyFee}
                          onChange={(e) => setHostOnlyFee(e.target.value.replace(/[^\d.]/g, ''))}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Platform fee: {formatCurrency(calculations.airbnbCommission)}/month</p>
                      </div>
                      <div>
                        <Label htmlFor="managementFee">Management Fee (%) <span className="text-gray-400 font-normal">typically 15-25%</span></Label>
                        <Input
                          id="managementFee"
                          placeholder="e.g. 20"
                          value={managementFee}
                          onChange={(e) => setManagementFee(e.target.value.replace(/[^\d.]/g, ''))}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Commission: {formatCurrency(calculations.managementCommission)}/month (applied after Airbnb fee)</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Commissions</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(calculations.totalCommissions)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className={`shadow-xl border-0 sticky top-24 ${calculations.monthlyProfit >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-red-50 to-orange-50'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <DollarSign className={`h-5 w-5 ${calculations.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    Profit Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-4 rounded-lg ${calculations.monthlyProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p className="text-sm text-gray-600 mb-1">Monthly Profit</p>
                    <p className={`text-3xl font-bold ${calculations.monthlyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(calculations.monthlyProfit)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${calculations.annualProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p className="text-sm text-gray-600 mb-1">Annual Profit</p>
                    <p className={`text-3xl font-bold ${calculations.annualProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(calculations.annualProfit)}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-semibold text-gray-700">Monthly Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue</span>
                        <span className="font-medium text-green-600">+{formatCurrency(calculations.monthlyRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fixed Costs</span>
                        <span className="font-medium text-red-600">-{formatCurrency(calculations.totalFixedCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Variable Costs</span>
                        <span className="font-medium text-red-600">-{formatCurrency(calculations.totalVariableCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commissions</span>
                        <span className="font-medium text-red-600">-{formatCurrency(calculations.totalCommissions)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-700 font-medium">Total Costs</span>
                        <span className="font-bold text-red-600">-{formatCurrency(calculations.totalMonthlyCosts)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="shadow-lg border-0 mt-8">
            <CardHeader>
              <CardTitle className="text-xl">
                Monthly Profit vs Occupancy and Nightly Rates
              </CardTitle>
              <p className="text-sm text-gray-500">
                See how your profit changes at different rate and occupancy combinations
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-medium text-gray-600 bg-gray-50">Rate / Occ.</th>
                      {profitMatrix.occupancyRates.map(occ => (
                        <th key={occ} className="p-2 text-center font-medium text-gray-600 bg-gray-50">{occ}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {profitMatrix.matrix.map(row => (
                      <tr key={row.rate} className="border-t">
                        <td className="p-2 font-medium text-gray-700 bg-gray-50">R{row.rate.toLocaleString()}</td>
                        {row.profits.map(cell => (
                          <td 
                            key={cell.occupancy} 
                            className={`p-2 text-center font-medium ${
                              cell.profit >= 0 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {cell.profit >= 0 ? '' : '-'}R{Math.abs(cell.profit).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span className="text-gray-600">Profit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 rounded"></div>
                  <span className="text-gray-600">Loss</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 bg-blue-50 rounded-lg p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              Need a More Comprehensive Analysis?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              This calculator provides quick estimates for operating profit. For full investment analysis 
              including purchase costs, ROI calculations, and market comparisons, check out our Property Analyser.
            </p>
            <a 
              href="/property-analyzer" 
              className="inline-flex items-center px-6 py-3 bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 text-white font-medium rounded-lg transition-colors"
            >
              Learn More About Property Analyser
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
