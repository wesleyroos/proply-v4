import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function YocoTestPage() {
  const { toast } = useToast();
  const [isTestMode, setIsTestMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [publicKey, setPublicKey] = useState('');
  const [testAmount, setTestAmount] = useState('10.00');

  const testCards = [
    { name: 'Visa Success', number: '4111111111111111', cvv: '123', expiry: '12/25' },
    { name: 'Mastercard Success', number: '5555555555554444', cvv: '123', expiry: '12/25' },
    { name: 'Visa Declined', number: '4000000000000002', cvv: '123', expiry: '12/25' },
    { name: 'Insufficient Funds', number: '4000000000009995', cvv: '123', expiry: '12/25' }
  ];

  const getPublicKey = async () => {
    try {
      const response = await fetch(`/api/yoco/public-key?test=${isTestMode}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to get public key');
      }
      
      const data = await response.json();
      setPublicKey(data.publicKey);
      
      toast({
        title: "Public key retrieved",
        description: `${isTestMode ? 'Test' : 'Live'} public key loaded successfully`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to get public key",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const testCard = async (card: typeof testCards[0]) => {
    if (!publicKey) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please get public key first"
      });
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // Check if Yoco SDK is loaded
      if (typeof window.YocoSDK === 'undefined') {
        throw new Error('Yoco SDK not loaded');
      }

      // Initialize Yoco SDK
      const yoco = new window.YocoSDK({
        publicKey: publicKey
      });

      // Tokenize card
      const [expiryMonth, expiryYear] = card.expiry.split('/');
      const tokenResult = await yoco.tokenizeCard({
        number: card.number,
        expiryMonth,
        expiryYear: `20${expiryYear}`,
        cvv: card.cvv,
        name: 'Test Cardholder'
      });

      if (tokenResult.error) {
        throw new Error(`Tokenization failed: ${tokenResult.error.message}`);
      }

      // Process charge
      const amountInCents = Math.round(parseFloat(testAmount) * 100);
      const chargeResponse = await fetch('/api/yoco/demo-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-yoco-test-mode': isTestMode.toString()
        },
        credentials: 'include',
        body: JSON.stringify({
          token: tokenResult.token,
          amountInCents,
          currency: 'ZAR',
          description: `Test charge - ${card.name}`
        })
      });

      const chargeData = await chargeResponse.json();
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        cardName: card.name,
        success: chargeResponse.ok,
        token: tokenResult.token,
        chargeId: chargeData.charge?.id,
        amount: testAmount,
        duration: `${duration}ms`,
        error: chargeResponse.ok ? null : chargeData.details || chargeData.message,
        timestamp: new Date().toLocaleTimeString()
      };

      setTestResults(prev => [result, ...prev]);

      if (chargeResponse.ok) {
        toast({
          title: "Test successful",
          description: `${card.name} - R${testAmount} charged successfully`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Test failed",
          description: result.error
        });
      }

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        cardName: card.name,
        success: false,
        token: null,
        chargeId: null,
        amount: testAmount,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      };

      setTestResults(prev => [result, ...prev]);

      toast({
        variant: "destructive",
        title: "Test failed",
        description: result.error
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const runAllTests = async () => {
    if (!publicKey) {
      await getPublicKey();
    }
    
    for (const card of testCards) {
      await testCard(card);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yoco Payment Integration Test</h1>
          <p className="text-gray-600 mt-2">Test the Yoco payment system with various card scenarios</p>
        </div>
        <Badge variant={isTestMode ? "secondary" : "destructive"}>
          {isTestMode ? "Test Mode" : "Live Mode"}
        </Badge>
      </div>

      {/* Environment Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Environment Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant={isTestMode ? "default" : "outline"}
              onClick={() => setIsTestMode(true)}
            >
              Test Mode
            </Button>
            <Button
              variant={!isTestMode ? "default" : "outline"}
              onClick={() => setIsTestMode(false)}
            >
              Live Mode
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Test Amount (ZAR)</label>
              <Input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="10.00"
                className="mt-1"
                min="1"
                max="100"
                step="0.01"
              />
            </div>
            <Button onClick={getPublicKey} className="mt-6">
              Get Public Key
            </Button>
          </div>

          {publicKey && (
            <div className="p-3 bg-gray-50 rounded text-sm">
              <strong>Public Key:</strong> {publicKey.substring(0, 20)}...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Test Cards
          </CardTitle>
          <CardDescription>
            Test different payment scenarios with various card types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {testCards.map((card, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{card.name}</h3>
                  <Button
                    size="sm"
                    onClick={() => testCard(card)}
                    disabled={isProcessing}
                  >
                    Test
                  </Button>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Card: {card.number}</div>
                  <div>Expiry: {card.expiry} | CVV: {card.cvv}</div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={runAllTests} disabled={isProcessing} className="w-full">
            {isProcessing ? "Running Tests..." : "Run All Tests"}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Latest test results - {testResults.length} tests completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.cardName}</span>
                      <Badge variant={result.success ? "secondary" : "destructive"}>
                        {result.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">{result.timestamp}</span>
                  </div>
                  
                  <div className="mt-2 text-sm space-y-1">
                    <div>Amount: R{result.amount} | Duration: {result.duration}</div>
                    {result.token && <div>Token: {result.token.substring(0, 20)}...</div>}
                    {result.chargeId && <div>Charge ID: {result.chargeId}</div>}
                    {result.error && (
                      <div className="text-red-600 font-medium">Error: {result.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}