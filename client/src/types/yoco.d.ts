declare global {
  interface Window {
    YocoSDK: new (config: { publicKey: string }) => YocoSDKInstance;
  }
}

interface YocoSDKInstance {
  tokenizeCard(cardData: {
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    name: string;
  }): Promise<{
    token?: string;
    error?: {
      message: string;
      code?: string;
    };
  }>;
}

export {};