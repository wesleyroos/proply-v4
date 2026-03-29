import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { jwtDecode } from "jwt-decode";


interface JwtPayload {
    exp: number;
}

interface AuthResponse {
    clients: Array<{
        token: string;
    }>;
}

export class BaseApiClient {
    protected readonly API_BASE_URL: string;
    protected readonly USER_AGENT: string = 'proply';
    protected readonly USERNAME: string;
    protected readonly PASSWORD: string;
    protected readonly EXPIRY_BUFFER: number = 60 * 1000;

    protected accessToken: string | null = null;
    protected accessTokenExpiry: number = 0;
    protected pendingRefresh: boolean = false;
    protected axiosInstance: AxiosInstance;

    constructor() {
        // Use the correct environment variable names that match our secrets
        const serverUrl = process.env.PROPDATA_SERVER_URL || 'https://propdata.co.za';
        const username = process.env.PROPDATA_USERNAME;
        const password = process.env.PROPDATA_PASSWORD;
        
        if (!username) throw new Error('PROPDATA_USERNAME environment variable is required');
        if (!password) throw new Error('PROPDATA_PASSWORD environment variable is required');

        this.API_BASE_URL = serverUrl;
        this.USERNAME = username;
        this.PASSWORD = password;

        this.axiosInstance = axios.create({
            baseURL: this.API_BASE_URL,
            headers: {
                'User-Agent': this.USER_AGENT
            }
        });

        // Add request interceptor to handle token
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                await this.checkTokenValid();
                if (this.accessToken) {
                    config.headers.Authorization = `Bearer ${this.accessToken}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    protected applyNewToken(newAccessToken: string) {
        try {
            const decoded: JwtPayload = jwtDecode<JwtPayload>(newAccessToken);
            this.accessTokenExpiry = decoded.exp * 1000;
            this.accessToken = newAccessToken;
        } catch (error) {
            console.error('Failed to decode token:', error);
            return;
        }
    }

    protected async checkTokenValid() {
        if (!this.accessToken || !this.accessTokenExpiry) {
            await this.authenticate();
        }

        if (!this.pendingRefresh && this.accessTokenExpiry - Date.now() < this.EXPIRY_BUFFER) {
            await this.refreshAuthToken();
        }
    }

    protected async authenticate(): Promise<void> {
        try {
            const response: AxiosResponse<AuthResponse> = await axios.get(
                `${this.API_BASE_URL}/users/public-api/login/`,
                {
                    auth: {
                        username: this.USERNAME,
                        password: this.PASSWORD
                    },
                    headers: {
                        'User-Agent': this.USER_AGENT
                    }
                }
            );

            if (response.data && Array.isArray(response.data.clients) && response.data.clients.length >= 1) {
                this.applyNewToken(response.data.clients[0].token);
                console.log(`Authentication successful (${response.data.clients.length} client(s) on account)`);
            } else {
                console.log('Authentication failed due to unexpected response');
                console.log(response.data);
            }
        } catch (error) {
            console.error('Authentication failed:', error);
        }
    }

    protected async refreshAuthToken(): Promise<void> {
        try {
            this.pendingRefresh = true;
            const response: AxiosResponse<AuthResponse> = await axios.get(
                `${this.API_BASE_URL}/users/api/v1/renew-token/`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'User-Agent': this.USER_AGENT
                    }
                }
            );

            if (response.data && Array.isArray(response.data.clients) && response.data.clients.length >= 1) {
                this.applyNewToken(response.data.clients[0].token);
                console.log('Refresh authentication successful');
            } else {
                console.log('Refresh authentication failed due to unexpected response');
                console.log(response.data);
                throw new Error("Refresh authentication failed due to unexpected response");
            }
        } catch (error) {
            this.accessToken = null;
            console.error('Token refresh failed:', error);
            await this.authenticate();
        } finally {
            this.pendingRefresh = false;
        }
    }
} 