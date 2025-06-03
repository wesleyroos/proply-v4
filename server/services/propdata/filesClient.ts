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
     * Fetch file details by ID
     * @param fileId The file ID to fetch
     * @returns File details or null if not found
     */
    async fetchFileDetails(fileId: number): Promise<FileDetails | null> {
        try {
            const url = `/files/api/v1/files/${fileId}/`;
            console.log(`Fetching PropData file details: ${url}`);
            const response: AxiosResponse<FileDetails> = await this.axiosInstance.get(url);
            
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.log(`File ${fileId} not found`);
                return null;
            }
            console.error(`Error fetching file ${fileId}:`, error.message);
            return null;
        }
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