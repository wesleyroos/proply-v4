"use client";

import { PageTransition } from "../components/PageTransition";

export default function KingPriceRiskIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Proply Logo */}
      <div className="absolute top-8 left-8 z-20">
        <img
          src="/proply-logo-1.png"
          alt="Proply Logo"
          className="h-8 w-auto"
        />
      </div>

      <div className="container max-w-[1200px] mx-auto px-4 py-16">
        <div className="mb-12 text-center pt-8">
          <h1 className="text-6xl font-bold">King Price Risk Index™</h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto">
            This page is under development
          </p>
        </div>
      </div>
    </div>
  );
}