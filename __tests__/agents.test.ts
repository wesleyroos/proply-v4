import { AgentsClient } from '../server/services/propdata/agentsClient';

describe('AgentsClient Integration Tests', () => {
    let client: AgentsClient;
    let testAgentId: number;

    beforeAll(async () => {
        client = new AgentsClient();
        // Get a valid agent ID that we can use throughout our tests
        const agents = await client.fetchAgents({ limit: 1 });
        if (agents.results.length > 0) {
            testAgentId = agents.results[0].id;
        }
    });


    describe('fetchAgents', () => {
        it('should fetch a list of agents', async () => {
            const agents = await client.fetchAgents();
            
            expect(Array.isArray(agents.results)).toBe(true);
            if (agents.results.length > 0) {
                const agent = agents.results[0];
                expect(agent).toHaveProperty('id');
                expect(agent).toHaveProperty('cell_number');
                expect(agent).toHaveProperty('email');
            }
        }, 10000); // Increase timeout for API call


        it('should handle pagination correctly', async () => {
            const firstPage = await client.fetchAgents({ limit: 5 });
            expect(firstPage.results.length).toBeLessThanOrEqual(5);
        }, 10000);

        it('should handle offset correctly', async () => {
            const firstPage = await client.fetchAgents({ 
                limit: 2,
                offset: 0
            });
            
            const secondPage = await client.fetchAgents({
                limit: 2,
                offset: 2
            });

            if (firstPage.results.length === 2 && secondPage.results.length > 0) {
                expect(firstPage.results[0].id).not.toBe(secondPage.results[0].id);
            }
        }, 10000);
    });

    describe('fetchAgent', () => {
        it('should fetch a single agent by ID', async () => {
            if (!testAgentId) {
                expect('No test agent ID available').toBeFalsy();
                return;
            }

            const agent = await client.fetchAgent(testAgentId);
            expect(agent).not.toBeNull();
            expect(agent?.id).toBe(testAgentId);
            expect(agent).toHaveProperty('id');
            expect(agent).toHaveProperty('cell_number');
            expect(agent).toHaveProperty('email');
        }, 10000);

        it('should return null for non-existent agent ID', async () => {
            const agent = await client.fetchAgent(-1);
            expect(agent).toBeNull();
        }, 10000);

    });
}); 