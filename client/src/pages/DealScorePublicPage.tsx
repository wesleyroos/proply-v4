import { Helmet } from "react-helmet";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function DealScorePublicPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Deal Score - Proply</title>
        <meta name="description" content="Calculate and analyze property deal scores with Proply's advanced analytics tools." />
      </Helmet>
      
      <PublicHeader />

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Deal Score</h1>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
