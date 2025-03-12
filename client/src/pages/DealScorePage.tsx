// Assuming necessary imports and component structure are present.  This is a partial solution due to missing original code.

function DealScorePage() {
  // ... other code ...

  const renderShortTermRentalCard = (formData) => {
    return (
      <div className="card">
        {/* ... other elements ... */}
        <div className="text-sm text-muted-foreground">
          Based on {formData.occupancy}% occupancy & R{formData.nightlyRate} avg nightly rate
        </div>
        {/* ... other elements ... */}
      </div>
    );
  };

  // ... rest of the component ...
}

export default DealScorePage;