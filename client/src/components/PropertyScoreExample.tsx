import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PropertyScoreModal } from "./PropertyScoreModal";

export function PropertyScoreExample() {
  const [isOpen, setIsOpen] = useState(false);

  // Example scores - in a real application, these would come from your data
  const exampleScores = {
    priceVsMarket: 85,
    rentalYield: 75,
    affordability: 90,
    liquidity: 70,
    riskFactors: 80,
    amenities: 95,
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        View Property Score
      </Button>
      
      <PropertyScoreModal 
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        scores={exampleScores}
      />
    </div>
  );
}
