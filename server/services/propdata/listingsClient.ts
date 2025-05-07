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
    /**
     * Fetch listings with pagination
     * @param options Pagination and filtering options
     * @returns Paginated response with listings
     */
    async fetchListings(options: PaginationOptions = {}): Promise<PaginatedResponse<Listing>> {
        try {
            const params = new URLSearchParams();
            if (options.order_by) params.append('order_by', options.order_by);
            if (options.offset !== undefined) params.append('offset', options.offset.toString());
            if (options.limit !== undefined) params.append('limit', options.limit.toString());
            if (options.modified_since) params.append('modified__gte', options.modified_since.toISOString());
            
            const url = `/listings/api/v1/residential/${params.toString() ? `?${params.toString()}` : ''}`;
            console.log(`Fetching PropData listings: ${url}`);
            const response: AxiosResponse<PaginatedResponse<Listing>> = await this.axiosInstance.get(url);
            
            // Debug the first listing to understand the structure
            if (response.data.results && response.data.results.length > 0) {
                const firstListing = response.data.results[0];
                console.log('First PropData listing structure:');
                console.log(JSON.stringify(firstListing, null, 2));
                
                // Extract possible price fields for easy viewing
                const priceFields = {};
                Object.keys(firstListing).forEach(key => {
                    if (key.toLowerCase().includes('price') || key.toLowerCase().includes('amount')) {
                        priceFields[key] = firstListing[key];
                    }
                });
                console.log('Price-related fields:', priceFields);
            }
            
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
    
    /**
     * Fetch multiple pages of listings and combine them
     * @param options Pagination and filtering options
     * @param maxPages Maximum number of pages to fetch (default: 5)
     * @returns Combined paginated response with all listings
     */
    async fetchMultiplePages(options: PaginationOptions = {}, maxPages: number = 5): Promise<PaginatedResponse<Listing>> {
        let currentPage = 1;
        let offset = options.offset || 0;
        const limit = options.limit || 100;
        let hasMorePages = true;
        
        const combinedResponse: PaginatedResponse<Listing> = {
            count: 0,
            next: null,
            previous: null,
            results: []
        };
        
        try {
            while (hasMorePages && currentPage <= maxPages) {
                console.log(`Fetching PropData listings page ${currentPage} of ${maxPages} (offset: ${offset}, limit: ${limit})`);
                
                const pageOptions = {
                    ...options,
                    offset,
                    limit
                };
                
                const pageResponse = await this.fetchListings(pageOptions);
                combinedResponse.results = [...combinedResponse.results, ...pageResponse.results];
                combinedResponse.count = pageResponse.count;
                
                if (pageResponse.next) {
                    offset += limit;
                    currentPage++;
                } else {
                    hasMorePages = false;
                }
            }
            
            return combinedResponse;
        } catch (error) {
            console.error('Failed to fetch multiple pages:', error);
            return combinedResponse;
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