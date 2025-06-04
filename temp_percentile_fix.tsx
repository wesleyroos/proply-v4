// Backup of the correct structure for PropertyDetailModal with percentile functionality

// State for selected percentile (add to existing state)
const [selectedPercentile, setSelectedPercentile] = useState<'percentile25' | 'percentile50' | 'percentile75' | 'percentile90'>('percentile50');

// Helper functions for dynamic calculations (define once, early in component)
const getSelectedShortTermData = () => {
  if (!rentalData?.shortTerm) return null;
  return rentalData.shortTerm[selectedPercentile];
};

const calculateDynamicYield = () => {
  const selectedData = getSelectedShortTermData();
  if (!selectedData || !property?.price) return 0;
  return parseFloat(((selectedData.annual / property.price) * 100).toFixed(1));
};

// Updated recommendation function
const getRecommendedStrategy = () => {
  if (!rentalData?.shortTerm || !rentalData?.longTerm) return null;
  
  const shortTermYield = calculateDynamicYield();
  const longTermYield = rentalData.longTerm.maxYield || 0;
  
  return shortTermYield > longTermYield ? 'shortTerm' : 'longTerm';
};

// Reset logic (add to existing useEffect)
setSelectedPercentile('percentile50'); // Reset to default percentile

// Updated short-term rental card display values
<div className="text-xl font-bold text-[#1e40af]">
  R{getSelectedShortTermData()?.monthly.toLocaleString() || rentalData.shortTerm.percentile50.monthly.toLocaleString()}
  <span className="text-sm font-normal">/month</span>
</div>
<div className="text-xs text-muted-foreground">
  Based on {rentalData.shortTerm.occupancy}% occupancy & R{getSelectedShortTermData()?.nightly.toLocaleString() || rentalData.shortTerm.percentile50.nightly.toLocaleString()} avg nightly rate
</div>

// Radio buttons for each percentile
<div className="flex items-center gap-2 mb-1">
  <input 
    type="radio" 
    name="percentile" 
    checked={selectedPercentile === 'percentile25'}
    onChange={() => setSelectedPercentile('percentile25')}
    className="w-3 h-3 text-blue-600"
  />
  <span className="font-medium text-muted-foreground">Conservative (25th)</span>
</div>

// Dynamic yearly income and yield calculations
<div className="flex justify-between text-sm">
  <span>Annual yield:</span>
  <span className="font-bold text-[#1e40af]">
    {calculateDynamicYield()}%
  </span>
</div>
<div className="flex justify-between text-sm">
  <span>Yearly income:</span>
  <span className="font-medium">R{getSelectedShortTermData()?.annual.toLocaleString() || 'N/A'}</span>
</div>