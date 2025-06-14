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
    mountElement?: string | HTMLElement;
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
  amountInCents?: number;
  currency?: string;
  createdDate?: string;
  source?: {
    type: string;
    gatewayToken: string;
  };
}

interface YocoError {
  message: string;
  code?: string;
}

export {};