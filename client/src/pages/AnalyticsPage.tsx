import React from "react";
import { AgencyIntegrationsTable } from "@/components/AgencyIntegrationsTable";

const AnalyticsDashboard = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#262626]">
          Control Panel
        </h1>
      </div>
      
      <AgencyIntegrationsTable />
    </div>
  );
};

export default AnalyticsDashboard;