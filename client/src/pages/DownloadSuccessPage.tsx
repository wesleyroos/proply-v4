import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ArrowLeft } from 'lucide-react';

export default function DownloadSuccessPage() {
  const [location] = useLocation();
  const [reportId, setReportId] = useState<string>('');
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    // Extract report ID from URL path
    const pathParts = location.split('/');
    const id = pathParts[pathParts.length - 1];
    setReportId(id);

    // Auto-start download after a brief delay
    const timer = setTimeout(() => {
      if (id) {
        startDownload(id);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  const startDownload = async (id: string) => {
    try {
      setDownloadStarted(true);
      
      // Create download link with direct parameter to bypass redirect
      const downloadUrl = `/api/propdata-reports/download/${id}?direct=true`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Proply_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleManualDownload = () => {
    if (reportId) {
      startDownload(reportId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Report Ready!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your Proply property investment report has been generated successfully.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {downloadStarted ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Your download should start automatically. If it doesn't start, click the button below.
              </p>
              <Button 
                onClick={handleManualDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Preparing your download...
              </p>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <h4 className="font-medium text-gray-900 mb-2">Your report includes:</h4>
            <ul className="space-y-1">
              <li>• Property overview and specifications</li>
              <li>• AI-powered valuation analysis</li>
              <li>• Rental performance metrics</li>
              <li>• Financial projections and yield calculations</li>
              <li>• Investment recommendations</li>
            </ul>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.close()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Close Window
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}