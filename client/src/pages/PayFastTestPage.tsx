import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PayFastTestPage() {
  const [testForm, setTestForm] = useState({
    merchant_id: '10036450',
    merchant_key: '8dafsqrcr99g5',
    amount: '0.00',
    item_name: 'Card-on-file',
    item_description: 'Setup payment method for agency billing',
    subscription_type: '2',
    return_url: 'http://localhost:5000/payment-setup-success',
    cancel_url: 'http://localhost:5000/payment-setup-cancel',
    notify_url: 'http://localhost:5000/api/payfast/notify'
  });

  const handleSubmit = () => {
    // Create form and submit to PayFast directly
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://sandbox.payfast.co.za/eng/process';
    
    // Add all form fields
    Object.entries(testForm).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    
    // Add signature field - we'll calculate this manually
    const signatureInput = document.createElement('input');
    signatureInput.type = 'hidden';
    signatureInput.name = 'signature';
    signatureInput.value = ''; // We'll need to calculate this
    form.appendChild(signatureInput);
    
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>PayFast Direct Test Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="merchant_id">Merchant ID</Label>
              <Input
                id="merchant_id"
                value={testForm.merchant_id}
                onChange={(e) => setTestForm({...testForm, merchant_id: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="merchant_key">Merchant Key</Label>
              <Input
                id="merchant_key"
                value={testForm.merchant_key}
                onChange={(e) => setTestForm({...testForm, merchant_key: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                value={testForm.amount}
                onChange={(e) => setTestForm({...testForm, amount: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="subscription_type">Subscription Type</Label>
              <Input
                id="subscription_type"
                value={testForm.subscription_type}
                onChange={(e) => setTestForm({...testForm, subscription_type: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="item_name">Item Name</Label>
            <Input
              id="item_name"
              value={testForm.item_name}
              onChange={(e) => setTestForm({...testForm, item_name: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="item_description">Item Description</Label>
            <Input
              id="item_description"
              value={testForm.item_description}
              onChange={(e) => setTestForm({...testForm, item_description: e.target.value})}
            />
          </div>
          
          <div className="pt-4">
            <Button onClick={handleSubmit} className="w-full">
              Submit Direct to PayFast (No Signature)
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>This form submits directly to PayFast without a signature to test if the issue is signature-related or account configuration.</p>
            <p>PayFast should show a different error if the merchant account is valid but signature is missing/invalid.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}