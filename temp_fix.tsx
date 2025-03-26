  return (
    <>
      <div className="flex min-h-screen flex-col relative overflow-hidden bg-background">
        {/* All the existing content here */}
      </div>
      
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        {/* Dialog content */}
      </Dialog>
      
      <AreaRateProgressDialog
        open={showAreaRateDialog}
        onOpenChange={setShowAreaRateDialog}
        status={areaRateStatus}
        error={areaRateError}
      />
      
      <RentalAmountProgressDialog />
    </>
  );