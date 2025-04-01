import { AxiosResponse } from 'axios';
import { BaseApiClient } from './baseClient';
import { PaginatedResponse, PaginationOptions } from './types';

interface Listing {
    id: string;
    street_number?: string;
    street_name?: string;
    lightstone_data?: {
        townName?: string;
        township?: string;
        province?: string;
    };
    [key: string]: any;
}

export class ListingsClient extends BaseApiClient {
    async fetchListings(options: PaginationOptions = {}): Promise<PaginatedResponse<Listing>> {
        try {
            const params = new URLSearchParams();
            if (options.order_by) params.append('order_by', options.order_by);
            if (options.offset !== undefined) params.append('offset', options.offset.toString());
            if (options.limit !== undefined) params.append('limit', options.limit.toString());
            if (options.modified_since) params.append('modified__gte', options.modified_since.toISOString());
            
            const url = `/listings/api/v1/residential/${params.toString() ? `?${params.toString()}` : ''}`;
            const response: AxiosResponse<PaginatedResponse<Listing>> = await this.axiosInstance.get(url);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch listings:', error);
            return {
                count: 0,
                next: null,
                previous: null,
                results: []
            };
        }
    }

    async fetchListingMetadata(): Promise<void> {
        try {
            const response: AxiosResponse = await this.axiosInstance.get(
                '/mashup/api/v1/residential/?meta_fields=listing_images,agent'
            );
            console.log('Listing metadata retrieved:', response.data);
        } catch (error) {
            console.error('Failed to fetch listing metadata:', error);
        }
    }
} 