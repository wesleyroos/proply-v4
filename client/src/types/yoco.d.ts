declare global {
  interface Window {
    YocoSDK: new (config: { publicKey: string }) => YocoSDKInstance;
  }
}

interface YocoSDKInstance {
  popup(config: {
    amountInCents: number;
    currency: string;
    name?: string;
    description?: string;
    callback?: (result: YocoResult) => void;
  }): void;
}

interface YocoResult {
  id?: string;
  token?: string;
  error?: {
    message: string;
    code?: string;
  };
  status?: string;
}

export {};