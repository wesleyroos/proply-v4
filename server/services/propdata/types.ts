export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface PaginationOptions {
    offset?: number;
    limit?: number;
    order_by?: string;
    modified_since?: Date;
} 