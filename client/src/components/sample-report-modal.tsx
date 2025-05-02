"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronRight, Download, Star } from "lucide-react"

export function SampleReportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("financials")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Sample Investment Analysis Report</DialogTitle>
          <DialogDescription>
            This is a sample of the comprehensive investment analysis report generated for each property.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-6">
          {/* Property Details */}
          <div className="bg-gray-50 p-5 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">26 Beach Road, Mouille Point</h3>
                <p className="text-gray-600">2 Bedroom Apartment</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                  78
                </div>
                <span className="text-sm font-medium text-green-600">Good Investment</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Listing Price</div>
                <div className="text-lg font-semibold">R3,995,000</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Size</div>
                <div className="text-lg font-semibold">92 m²</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Rate per m²</div>
                <div className="text-lg font-semibold">R43,424/m²</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("financials")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "financials"
                  ? "text-proply-blue border-b-2 border-proply-blue"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Financial Analysis
            </button>
            <button
              onClick={() => setActiveTab("market")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "market"
                  ? "text-proply-blue border-b-2 border-proply-blue"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Market Analysis
            </button>
            <button
              onClick={() => setActiveTab("projections")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "projections"
                  ? "text-proply-blue border-b-2 border-proply-blue"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Projections
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-1">
            {activeTab === "financials" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-5 border">
                    <h4 className="font-semibold mb-4">Purchase Analysis</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchase Price</span>
                        <span className="font-medium">R3,995,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transfer Costs</span>
                        <span className="font-medium">R312,425</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bond Registration</span>
                        <span className="font-medium">R28,350</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-800 font-semibold">Total Investment</span>
                        <span className="font-semibold">R4,335,775</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-5 border">
                    <h4 className="font-semibold mb-4">Bond Repayment</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deposit (20%)</span>
                        <span className="font-medium">R799,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bond Amount</span>
                        <span className="font-medium">R3,196,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest Rate</span>
                        <span className="font-medium">11.75%</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-800 font-semibold">Monthly Repayment</span>
                        <span className="font-semibold text-proply-blue">R33,625</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-5 border">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold">Short-Term Rental</h4>
                      <div className="flex items-center text-amber-500 gap-1">
                        <Star className="h-4 w-4 fill-amber-500" />
                        <Star className="h-4 w-4 fill-amber-500" />
                        <Star className="h-4 w-4 fill-amber-500" />
                        <Star className="h-4 w-4 fill-amber-500" />
                        <Star className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nightly Rate</span>
                        <span className="font-medium">R2,800</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Occupancy</span>
                        <span className="font-medium">68%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Revenue</span>
                        <span className="font-medium">R58,072</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Expenses</span>
                        <span className="font-medium">R12,776</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-800 font-semibold">Net Monthly Income</span>
                        <span className="font-semibold text-green-600">R45,296</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-5 border">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold">Long-Term Rental</h4>
                      <div className="flex items-center text-amber-500 gap-1">
                        <Star className="h-4 w-4 fill-amber-500" />
                        <Star className="h-4 w-4 fill-amber-500" />
                        <Star className="h-4 w-4 fill-amber-500" />
                        <Star className="h-4 w-4" />
                        <Star className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Rent</span>
                        <span className="font-medium">R26,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vacancy Rate</span>
                        <span className="font-medium">3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Revenue</span>
                        <span className="font-medium">R25,705</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Expenses</span>
                        <span className="font-medium">R5,300</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-800 font-semibold">Net Monthly Income</span>
                        <span className="font-semibold text-green-600">R20,405</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "market" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-5 border">
                    <h4 className="font-semibold mb-4">Comparable Properties</h4>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <div className="flex justify-between font-medium pb-2 border-b">
                          <span>Property</span>
                          <span>Price</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span>24 Beach Road, 2 Bed</span>
                          <span>R4,250,000</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span>12 Beach Road, 2 Bed</span>
                          <span>R3,895,000</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span>8 Beach Road, 2 Bed</span>
                          <span>R4,100,000</span>
                        </div>
                        <div className="flex justify-between pt-2 font-medium text-proply-blue border-t">
                          <span>Average Price</span>
                          <span>R4,081,667</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-5 border">
                    <h4 className="font-semibold mb-4">Market Metrics</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Price vs. Market</span>
                          <span className="font-medium text-green-600">-2.1% Below</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: "48%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Rental Demand</span>
                          <span className="font-medium text-amber-600">High</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: "82%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Price Growth (5yr)</span>
                          <span className="font-medium text-proply-blue">35.4%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-proply-blue" style={{ width: "65%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border">
                  <h4 className="font-semibold mb-4">Investment Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Gross Rental Yield</div>
                      <div className="text-xl font-semibold text-gray-900">8.7%</div>
                      <div className="text-xs text-green-600">Above area average</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Cap Rate</div>
                      <div className="text-xl font-semibold text-gray-900">6.4%</div>
                      <div className="text-xs text-green-600">Good for this area</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Cash on Cash Return</div>
                      <div className="text-xl font-semibold text-gray-900">16.9%</div>
                      <div className="text-xs text-green-600">Excellent</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Break Even Ratio</div>
                      <div className="text-xl font-semibold text-gray-900">0.78</div>
                      <div className="text-xs text-green-600">Low risk</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "projections" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-5 border">
                  <h4 className="font-semibold mb-4">20-Year Projections</h4>
                  <p className="text-sm text-gray-600 mb-6">
                    These projections account for 6% annual property value growth, 5% annual rental income growth, and 4%
                    annual expense growth.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left font-medium py-2">Year</th>
                          <th className="text-right font-medium py-2">Property Value</th>
                          <th className="text-right font-medium py-2">Annual Income</th>
                          <th className="text-right font-medium py-2">ROI</th>
                          <th className="text-right font-medium py-2">Equity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-2">Year 1</td>
                          <td className="text-right py-2">R4,234,700</td>
                          <td className="text-right py-2">R543,552</td>
                          <td className="text-right py-2">12.5%</td>
                          <td className="text-right py-2">R1,038,700</td>
                        </tr>
                        <tr>
                          <td className="py-2">Year 5</td>
                          <td className="text-right py-2">R5,344,856</td>
                          <td className="text-right py-2">R658,298</td>
                          <td className="text-right py-2">15.3%</td>
                          <td className="text-right py-2">R2,148,856</td>
                        </tr>
                        <tr>
                          <td className="py-2">Year 10</td>
                          <td className="text-right py-2">R7,156,387</td>
                          <td className="text-right py-2">R839,917</td>
                          <td className="text-right py-2">19.4%</td>
                          <td className="text-right py-2">R3,960,387</td>
                        </tr>
                        <tr>
                          <td className="py-2">Year 20</td>
                          <td className="text-right py-2">R12,822,593</td>
                          <td className="text-right py-2">R1,367,688</td>
                          <td className="text-right py-2">31.6%</td>
                          <td className="text-right py-2">R9,626,593</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border">
                  <h4 className="font-semibold mb-4">Recommended Strategy</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <ChevronRight className="h-5 w-5 text-proply-blue shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Short-Term Rental Focus</p>
                        <p className="text-sm text-gray-600">
                          This property is ideally suited for the short-term rental market, with potentially 122% higher
                          returns than long-term rentals.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ChevronRight className="h-5 w-5 text-proply-blue shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Premium Positioning</p>
                        <p className="text-sm text-gray-600">
                          Invest in quality furnishings to command peak season rates of R3,200+ per night.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ChevronRight className="h-5 w-5 text-proply-blue shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Refinance in Year 5</p>
                        <p className="text-sm text-gray-600">
                          With projected equity of R2.15M by year 5, consider refinancing to extract capital for
                          additional property investments.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              This report was automatically generated by the Property Analyzer API™
            </p>
            <Button 
              className="bg-proply-blue hover:bg-proply-blue/90 text-white"
              onClick={() => {
                window.location.href = "/api/download-property-analysis-pdf";
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Download Full Sample
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}