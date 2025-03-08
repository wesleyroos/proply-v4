import { useState } from "react";
// ... other imports

const DealScorePage: React.FC = ({ formData }) => {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [showPercentileDialog, setShowPercentileDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // ...other states

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const address = formData.address;
      const bedrooms = formData.bedrooms;

      if (!address || !bedrooms) {
        alert("Please enter the property address and number of bedrooms first.");
        return;
      }

      // Format bedrooms to handle both comma and period decimal separators
      const formattedBedrooms = bedrooms.replace(",", ".");

      // Validate the bedroom number
      const bedroomNumber = parseFloat(formattedBedrooms);
      if (isNaN(bedroomNumber) || bedroomNumber < 0) {
        alert("Please enter a valid number of bedrooms");
        return;
      }

      const response = await fetch(
        `/api/revenue-data?address=${encodeURIComponent(
          address,
        )}&bedrooms=${formattedBedrooms}`,
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.KPIsByBedroomCategory?.[formattedBedrooms]) {
        const result = data.KPIsByBedroomCategory[formattedBedrooms];
        const processedData = {
          "25": {
            adr: result.ADR25PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 25,
          },
          "50": {
            adr: result.ADR50PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 50,
          },
          "75": {
            adr: result.ADR75PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 75,
          },
          "90": {
            adr: result.ADR90PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 90,
          },
        };
        setRevenueData(processedData);
        setShowPercentileDialog(true);
      } else {
        throw new Error("No data available for this bedroom configuration");
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      alert("Failed to fetch revenue data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [formData]); // Fetch data when formData changes


  return (
    <PageTransition>
      <div>
        <Dialog open={showPercentileDialog} onClose={() => setShowPercentileDialog(false)}>
          <DialogTitle>Revenue Data</DialogTitle>
          <DialogContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4">Percentile</th>
                    <th className="text-right py-2 px-4">ADR (ZAR)</th>
                    <th className="text-right py-2 px-4">Occupancy (%)</th>
                    <th className="text-right py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData &&
                    Object.entries(revenueData).map(([percentile, data]) => (
                      <tr key={percentile} className="border-b">
                        <td className="py-2 px-4">{percentile}th Percentile</td>
                        <td className="text-right py-2 px-4">
                          {new Intl.NumberFormat("en-ZA", {
                            style: "currency",
                            currency: "ZAR",
                          }).format(data.adr)}
                        </td>
                        <td className="text-right py-2 px-4">
                          {Math.round(data.occupancy)}%
                        </td>
                        <td className="text-right py-2 px-4">
                          <Button
                            size="sm"
                            onClick={() =>
                              applyPercentileData(
                                percentile as "25" | "50" | "75" | "90",
                              )
                            }
                          >
                            Use This Data
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
        <PropertyScoreModal
          isOpen={showPropertyScoreModal}
          onOpenChange={setShowPropertyScoreModal}
        />
      </div>
    </PageTransition>
  );
};

export default DealScorePage;