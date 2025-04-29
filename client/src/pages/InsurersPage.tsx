import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function InsurersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Property Risk Intelligence for Insurers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {/* Content will be added later */}
          </p>
        </div>

        {/* Content will be added later */}
      </div>

      <PublicFooter />
    </div>
  );
}