  // Function to render the comprehensive report
  const renderComprehensiveReport = () => {
    if (!dealReport) return null;
    
    return (
      <div
        id="deal-score-report"
        ref={reportRef}
        className="max-w-[800px] mx-auto bg-white shadow-lg rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/proply-logo-auth.png" alt="Proply Logo" className="h-8 w-auto" />
            </div>
            <div className="text-sm opacity-80">Report generated: {new Date().toLocaleDateString('en-ZA', {day: '2-digit', month: 'long', year: 'numeric'})}</div>
          </div>
          <div className="mt-12 mb-6">
            <h1 className="text-3xl font-bold">Proply Deal Score™</h1>
            <p className="opacity-80 mt-2">{dealReport?.address}</p>
          </div>
        </div>

        {/* Deal Score Section */}
        <div className="p-8 border-b">
          <div className="text-center mb-8">
            <div className="flex justify-center mt-6">
              <div className="relative w-40 h-40">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  <div className="text-6xl font-bold text-primary">{dealReport.score}%</div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <span 
                className={`inline-block px-4 py-1 rounded-full text-white font-medium ${dealReport.color || 'bg-green-500'}`}
              >
                {dealReport.rating}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Asking Price</div>
              <div className="text-xl font-bold">R{formatPrice(dealReport.askingPrice)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Estimated Market Value</div>
              <div className="text-xl font-bold">R{formatPrice(dealReport.estimatedValue)}</div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-center mb-8">
            <span className="font-medium">This property is </span>
            <span className="text-green-600 font-bold">{dealReport.percentageDifference?.toFixed(1)}% below</span>
            <span className="font-medium"> the estimated market value</span>
          </div>

          <div className="relative h-4 mb-10 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full">
            <div
              className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-300 rounded-full transform -translate-x-1/2 shadow-md"
              style={{ left: `${dealReport.score}%` }}
            />
            <div className="absolute -bottom-6 left-0 text-xs">Poor</div>
            <div className="absolute -bottom-6 left-1/4 text-xs">Average</div>
            <div className="absolute -bottom-6 left-1/2 text-xs transform -translate-x-1/2">Good</div>
            <div className="absolute -bottom-6 left-3/4 text-xs">Great</div>
            <div className="absolute -bottom-6 right-0 text-xs">Excellent</div>
          </div>
        </div>

        {/* Key Deal Factors */}
        <div className="p-8 border-b">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Key Deal Factors</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                Price per m²:
              </span>
              <span className="font-medium">R{formatPrice(dealReport.pricePerSqM, 0)}/m²</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Area average:
              </span>
              <span className="font-medium">R{formatPrice(dealReport.areaRate, 0)}/m²</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Recent Area Sales:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{dealReport.recentSalesRange || "R3.4M - R3.7M (last 3 months)"}</span>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  WITHIN RANGE
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Property condition:
              </span>
              <span className="font-medium capitalize">{dealReport.propertyCondition}</span>
            </div>

            {reportUnlocked && (
              <>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Short-Term Yield:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealReport.shortTermYield?.toFixed(1)}%</span>
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      EXCELLENT
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Long-Term Yield:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealReport.longTermYield?.toFixed(1)}%</span>
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      EXCELLENT
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Best Investment Strategy:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealReport.bestInvestmentStrategy || "Short-Term"}</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                      RECOMMENDED
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Property Details */}
        <div className="p-8 border-b">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Property Details</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">General Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-medium">Apartment</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{dealReport.propertySize} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bedrooms:</span>
                  <span className="font-medium">{dealReport.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bathrooms:</span>
                  <span className="font-medium">{dealReport.bathrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Parking:</span>
                  <span className="font-medium">{dealReport.parking}</span>
                </div>
              </div>
            </div>

            {reportUnlocked && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Financial Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Municipal Value:</span>
                    <span className="font-medium">R{formatPrice(dealReport.municipalValue || 3600000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rates:</span>
                    <span className="font-medium">R{formatPrice(dealReport.monthlyRates || 2850)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Levy:</span>
                    <span className="font-medium">R{formatPrice(dealReport.levy || 1950)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Monthly Costs:</span>
                    <span className="font-medium">R{formatPrice(dealReport.estimatedMonthlyCosts || 4800)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Investment Analysis */}
        {reportUnlocked && (
          <div className="p-8 border-b">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Investment Analysis</h2>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-6">
              {/* Short-term Rental Analysis */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Short-term Rental Analysis</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Nightly Rate</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.nightlyRate || 2500)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Occupancy Rate</div>
                    <div className="text-xl font-bold">{dealReport.occupancyRate || 70}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Monthly Revenue</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.monthlyRevenue || 52500)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Annual Revenue</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.annualRevenueShortTerm || 630000)}</div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" />
                    Short-Term Yield:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealReport.shortTermYield?.toFixed(1)}%</span>
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      EXCELLENT
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Long-term Rental Analysis */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium">Long-term Rental Analysis</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Monthly Rental</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.monthlyLongTerm || 25000)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Annual Rental</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.annualRentalLongTerm || 300000)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Vacancy Rate</div>
                    <div className="text-xl font-bold">{dealReport.vacancyRate || 5}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Net Annual Income</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.netAnnualIncome || 285000)}</div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-purple-600" />
                    Long-Term Yield:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealReport.longTermYield?.toFixed(1)}%</span>
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      EXCELLENT
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Mortgage Analysis */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium">Mortgage Analysis</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Purchase Price</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.askingPrice)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Deposit ({dealReport.depositPercentage || 10}%)</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.depositAmount || 350000)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Loan Amount</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.loanAmount || 3150000)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Interest Rate</div>
                    <div className="text-xl font-bold">{dealReport.interestRate?.toFixed(2) || "11.75"}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Loan Term</div>
                    <div className="text-xl font-bold">{dealReport.loanTerm || 20} years</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Monthly Payment</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.monthlyPayment || 33850)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparable Properties Section (only when unlocked) */}
        {reportUnlocked && (
          <div className="p-8 border-b">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Comparable Properties</h2>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Similarity</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/m²</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beds</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(dealReport.comparableProperties || []).map((property, index) => (
                    <tr key={index}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          property.similarity === "MOST SIMILAR" 
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {property.similarity}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{property.address}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">R{formatPrice(property.salePrice)}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{property.size} m²</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">R{formatPrice(property.pricePerSqM)}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{property.bedrooms}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{property.saleDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-center">
              <button className="text-primary font-medium flex items-center gap-1 mx-auto">
                View all comparable properties
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-8 text-center pdf-section">
          <p className="text-sm text-gray-500 mt-6">Report generated by Proply Deal Score™ on {new Date().toLocaleDateString('en-ZA', {day: '2-digit', month: 'long', year: 'numeric'})}</p>
          <p className="text-xs text-gray-400 mt-2">
            The information in this report is based on market data and should be used for informational purposes only.
            Proply does not guarantee the accuracy of the information provided.
          </p>
        </div>
      </div>
    );
  };