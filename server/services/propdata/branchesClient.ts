import { BaseApiClient } from './baseClient';

export interface PropDataFranchise {
  id: number;
  name: string;
  legal_name?: string;
  email?: string;
}

export interface PropDataBranch {
  id: number;
  name: string;
  address?: string;
  franchise?: number;
}

export class BranchesClient extends BaseApiClient {
  /**
   * Search franchises by name
   */
  async searchFranchises(name: string): Promise<PropDataFranchise[]> {
    const response = await this.axiosInstance.post('/branches/api/v1/franchises/search/', {
      filters: { name__icontains: name }
    });
    return response.data?.results ?? [];
  }

  /**
   * Get all branches belonging to a franchise
   */
  async getBranchesForFranchise(franchiseId: number): Promise<PropDataBranch[]> {
    const response = await this.axiosInstance.post('/branches/api/v1/branches/search/', {
      filters: { franchises: [franchiseId] }
    });
    return response.data?.results ?? [];
  }
}

export const branchesClient = new BranchesClient();
