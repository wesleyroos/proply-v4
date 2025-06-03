import { AxiosResponse } from 'axios';
import { BaseApiClient } from './baseClient';

interface FileDetails {
    id: number;
    file: string;
    image?: string;
    thumbnail?: string;
    order?: number;
    [key: string]: any;
}

export class FilesClient extends BaseApiClient {
    /**
     * Fetch file details by ID - tries multiple potential endpoints
     * @param fileId The file ID to fetch
     * @returns File details or null if not found
     */
    async fetchFileDetails(fileId: number): Promise<FileDetails | null> {
        // Use the correct PropData gallery endpoint for file details
        const endpoints = [
            `/gallery/api/v1/files/${fileId}/`,
            `/files/api/v1/files/${fileId}/`, // fallback
            `/media/api/v1/files/${fileId}/`, // fallback
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`Trying PropData file endpoint: ${endpoint}`);
                const response: AxiosResponse<FileDetails> = await this.axiosInstance.get(endpoint);
                console.log(`Success! File ${fileId} found at ${endpoint}`);
                return response.data;
            } catch (error: any) {
                if (error.response?.status === 404) {
                    console.log(`File ${fileId} not found at ${endpoint}`);
                    continue; // Try next endpoint
                } else {
                    console.error(`Error fetching file ${fileId} from ${endpoint}:`, error.message);
                    continue; // Try next endpoint
                }
            }
        }

        console.error(`File ${fileId} not found at any known endpoint`);
        return null;
    }

    /**
     * Fetch multiple file details by IDs
     * @param fileIds Array of file IDs to fetch
     * @returns Array of file details (excludes failed fetches)
     */
    async fetchMultipleFileDetails(fileIds: number[]): Promise<FileDetails[]> {
        const fileDetails: FileDetails[] = [];
        const successfulIds: number[] = [];
        const failedIds: number[] = [];
        
        // Fetch files in parallel but limit concurrency to avoid overwhelming the API
        const batchSize = 5;
        for (let i = 0; i < fileIds.length; i += batchSize) {
            const batch = fileIds.slice(i, i + batchSize);
            const batchPromises = batch.map(id => this.fetchFileDetails(id));
            
            try {
                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach((result, index) => {
                    const fileId = batch[index];
                    if (result.status === 'fulfilled' && result.value) {
                        fileDetails.push(result.value);
                        successfulIds.push(fileId);
                    } else {
                        failedIds.push(fileId);
                        if (result.status === 'rejected') {
                            console.error(`Failed to fetch file ${fileId}:`, result.reason);
                        } else {
                            console.log(`File ${fileId} not found in gallery service`);
                        }
                    }
                });
            } catch (error) {
                console.error('Batch file fetch error:', error);
            }
        }
        
        console.log(`File fetch summary: ${successfulIds.length} successful, ${failedIds.length} failed`);
        if (failedIds.length > 0) {
            console.log(`Failed file IDs:`, failedIds.slice(0, 10));
        }
        
        return fileDetails;
    }
}