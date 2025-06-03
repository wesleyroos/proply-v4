import { AxiosResponse } from 'axios';
import { BaseApiClient } from './baseClient';

interface Agent {
    id: number;
    full_name: string;
    username: string;
    email: string;
    mobile: string;
    designation?: string;
    [key: string]: any;
}

export class AgentsClient extends BaseApiClient {
    /**
     * Fetch a single agent by ID
     * @param agentId The agent ID to fetch
     * @returns Agent details or null if not found
     */
    async fetchAgent(agentId: number): Promise<Agent | null> {
        try {
            console.log(`Fetching agent details for ID: ${agentId}`);
            const url = `/users/api/v1/agents/${agentId}/`;
            const response: AxiosResponse<Agent> = await this.axiosInstance.get(url);
            
            console.log(`Agent ${agentId} details:`, {
                id: response.data.id,
                full_name: response.data.full_name,
                email: response.data.email,
                mobile: response.data.mobile,
                designation: response.data.designation
            });
            
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.log(`Agent ${agentId} not found`);
                return null;
            }
            console.error(`Failed to fetch agent ${agentId}:`, error.message);
            return null;
        }
    }

    /**
     * Fetch multiple agents by their IDs
     * @param agentIds Array of agent IDs to fetch
     * @returns Map of agent ID to agent details
     */
    async fetchAgents(agentIds: number[]): Promise<Map<number, Agent>> {
        const agentMap = new Map<number, Agent>();
        
        // Remove duplicates
        const seen = new Set<number>();
        const uniqueAgentIds = agentIds.filter(id => {
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
        
        console.log(`Fetching ${uniqueAgentIds.length} unique agents:`, uniqueAgentIds);
        
        // Fetch agents in parallel with some delay to avoid rate limiting
        const agentPromises = uniqueAgentIds.map(async (agentId, index) => {
            // Add small delay between requests to be respectful to the API
            if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const agent = await this.fetchAgent(agentId);
            if (agent) {
                agentMap.set(agentId, agent);
            }
        });
        
        await Promise.all(agentPromises);
        
        console.log(`Successfully fetched ${agentMap.size} out of ${uniqueAgentIds.length} agents`);
        return agentMap;
    }

    /**
     * List all agents with pagination
     * @param options Pagination options
     * @returns Paginated response with agents
     */
    async listAgents(options: { limit?: number; offset?: number } = {}): Promise<{
        count: number;
        next: string | null;
        previous: string | null;
        results: Agent[];
    }> {
        try {
            const params = new URLSearchParams();
            if (options.offset !== undefined) params.append('offset', options.offset.toString());
            if (options.limit !== undefined) params.append('limit', options.limit.toString());
            
            const url = `/users/api/v1/agents/${params.toString() ? `?${params.toString()}` : ''}`;
            console.log(`Fetching agents list: ${url}`);
            
            const response = await this.axiosInstance.get(url);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch agents list:', error);
            return {
                count: 0,
                next: null,
                previous: null,
                results: []
            };
        }
    }
}