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
        // Try different file service endpoints that PropData tenants might use
        const endpoints = [
            `/files/api/v1/files/${fileId}/`,
            `/media/api/v1/files/${fileId}/`,
            `/cdn/api/v1/files/${fileId}/`,
            `/attachments/api/v1/files/${fileId}/`
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
        
        // Fetch files in parallel but limit concurrency to avoid overwhelming the API
        const batchSize = 5;
        for (let i = 0; i < fileIds.length; i += batchSize) {
            const batch = fileIds.slice(i, i + batchSize);
            const batchPromises = batch.map(id => this.fetchFileDetails(id));
            
            try {
                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value) {
                        fileDetails.push(result.value);
                    } else if (result.status === 'rejected') {
                        console.error(`Failed to fetch file ${batch[index]}:`, result.reason);
                    }
                });
            } catch (error) {
                console.error('Batch file fetch error:', error);
            }
        }
        
        return fileDetails;
    }
}