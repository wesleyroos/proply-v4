import { ListingsClient } from '../listingsClient';
import { BaseApiClient } from '../baseClient';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('ListingsClient', () => {
    let client: ListingsClient;
    let mockAxios: MockAdapter;

    beforeEach(() => {
        client = new ListingsClient();
        mockAxios = new MockAdapter(axios);
    });

    afterEach(() => {
        mockAxios.reset();
    });

    describe('fetchListings', () => {
        const mockListingsResponse = {
            count: 2,
            next: null,
            previous: null,
            results: [
                {
                    id: '1',
                    street_number: '123',
                    street_name: 'Test Street',
                    lightstone_data: {
                        townName: 'Test Town',
                        township: 'Test Township',
                        province: 'Test Province'
                    }
                },
                {
                    id: '2',
                    street_number: '456',
                    street_name: 'Another Street',
                    lightstone_data: {
                        townName: 'Another Town',
                        township: 'Another Township',
                        province: 'Another Province'
                    }
                }
            ]
        };

        it('should fetch listings without parameters', async () => {
            mockAxios.onGet('/listings/api/v1/residential/').reply(200, mockListingsResponse);

            const response = await client.fetchListings();
            expect(response).toEqual(mockListingsResponse);
        });

        it('should handle pagination parameters', async () => {
            mockAxios.onGet('/listings/api/v1/residential/?offset=10&limit=5').reply(200, {
                ...mockListingsResponse,
                previous: '/listings/api/v1/residential/?offset=5&limit=5',
                next: '/listings/api/v1/residential/?offset=15&limit=5'
            });

            const response = await client.fetchListings({ offset: 10, limit: 5 });
            expect(response.previous).toBeTruthy();
            expect(response.next).toBeTruthy();
        });

        it('should handle modified_since parameter', async () => {
            const testDate = new Date('2024-03-09T12:00:00Z');
            mockAxios.onGet(`/listings/api/v1/residential/?modified__gte=${testDate.toISOString()}`).reply(200, mockListingsResponse);

            const response = await client.fetchListings({ modified_since: testDate });
            expect(response).toEqual(mockListingsResponse);
        });

        it('should handle error responses', async () => {
            mockAxios.onGet('/listings/api/v1/residential/').reply(500);

            const response = await client.fetchListings();
            expect(response).toEqual({
                count: 0,
                next: null,
                previous: null,
                results: []
            });
        });
    });

    describe('fetchListingMetadata', () => {
        const mockMetadataResponse = {
            listing_images: ['image1.jpg', 'image2.jpg'],
            agent: {
                id: 1,
                name: 'Test Agent'
            }
        };

        it('should fetch listing metadata', async () => {
            mockAxios.onGet('/mashup/api/v1/residential/?meta_fields=listing_images,agent').reply(200, mockMetadataResponse);

            const consoleSpy = jest.spyOn(console, 'log');
            await client.fetchListingMetadata();
            
            expect(consoleSpy).toHaveBeenCalledWith('Listing metadata retrieved:', mockMetadataResponse);
            consoleSpy.mockRestore();
        });

        it('should handle metadata fetch errors', async () => {
            mockAxios.onGet('/mashup/api/v1/residential/?meta_fields=listing_images,agent').reply(500);

            const consoleSpy = jest.spyOn(console, 'error');
            await client.fetchListingMetadata();
            
            expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch listing metadata:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
}); 