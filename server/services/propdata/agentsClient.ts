import { AxiosResponse } from 'axios';
import { BaseApiClient } from './baseClient';
import { PaginatedResponse, PaginationOptions } from './types';

interface Agent {
    id: number;
    agent: string;
    site: number;
    active: boolean;
    username: string;
    title: string;
    first_name: string;
    last_name: string;
    preferred_name: string;
    full_name_slug: string;
    email: string;
    id_number: string;
    gender: string;
    user_website: string;
    cell_number: string;
    whatsapp_number: string;
}

export class AgentsClient extends BaseApiClient {
    async fetchAgents(options: PaginationOptions = {}): Promise<PaginatedResponse<Agent>> {
        try {
            const params = new URLSearchParams();
            if (options.order_by) params.append('order_by', options.order_by);
            if (options.offset !== undefined) params.append('offset', options.offset.toString());
            if (options.limit !== undefined) params.append('limit', options.limit.toString());
            
            const url = `/users/api/v1/agents/${params.toString() ? `?${params.toString()}` : ''}`;
            const response: AxiosResponse<PaginatedResponse<Agent>> = await this.axiosInstance.get(url);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch agents:', error);
            return {
                count: 0,
                next: null,
                previous: null,
                results: []
            };
        }
    }

    async fetchAgent(id: number): Promise<Agent | null> {
        try {
            const response: AxiosResponse<Agent> = await this.axiosInstance.get(`/users/api/v1/agents/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch agent with ID ${id}:`, error);
            return null;
        }
    }
} 