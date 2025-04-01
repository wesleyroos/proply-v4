import { AxiosResponse } from 'axios';
import { BaseApiClient } from './baseClient';
import { PaginatedResponse, PaginationOptions } from './types';

interface SyndicationLog {
    id: number;
    site: string;
    created: string;
    modified: string;
    deleted: string | null;
    uuid: string;
    source_ref: string;
    message: string;
    agent: number | null;
    residential: number | null;
    commercial: number | null;
    holiday: number | null;
    project: number | null;
    branch: number | null;
    status: string;
    portal: number;
}

export class SyndicationClient extends BaseApiClient {
    async fetchLogs(options: PaginationOptions = {}): Promise<PaginatedResponse<SyndicationLog>> {
        try {
            const params = new URLSearchParams();
            if (options.order_by) params.append('order_by', options.order_by);
            if (options.offset !== undefined) params.append('offset', options.offset.toString());
            if (options.limit !== undefined) params.append('limit', options.limit.toString());
            
            const url = `/syndication/api/v1/logs/${params.toString() ? `?${params.toString()}` : ''}`;
            const response: AxiosResponse<PaginatedResponse<SyndicationLog>> = await this.axiosInstance.get(url);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch syndication logs:', error);
            return {
                count: 0,
                next: null,
                previous: null,
                results: []
            };
        }
    }
} 