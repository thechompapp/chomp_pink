/* src/services/adminService.ts */
import apiClient, { ApiResponse } from '@/services/apiClient';
import type { City, Neighborhood } from '@/types/Filters';
import type { Restaurant } from '@/types/Restaurant';
import type { Dish } from '@/types/Dish';
import type { List } from '@/types/List';
import type { User } from '@/types/User';
import type { Hashtag } from '@/doof-backend/models/hashtagModel';
import type { Submission } from '@/types/Submission';

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface AdminDataResponse<T> {
    data: T[];
    pagination: Pagination;
}

interface AdminResourceResponse<T> {
    data: T;
}

interface AdminGetParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    search?: string;
    status?: 'pending' | 'approved' | 'rejected';
    listType?: 'mixed' | 'restaurant' | 'dish';
    hashtagCategory?: string;
    cityId?: number;
}

type AdminResourceType = 'submissions' | 'restaurants' | 'dishes' | 'lists' | 'hashtags' | 'users' | 'neighborhoods';

const buildAdminQueryString = (params: AdminGetParams): string => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.sortBy && params.sortOrder) queryParams.append('sort', `${params.sortBy}_${params.sortOrder.toLowerCase()}`);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.listType) queryParams.append('list_type', params.listType);
    if (params.hashtagCategory) queryParams.append('hashtag_category', params.hashtagCategory);
    if (params.cityId) queryParams.append('cityId', String(params.cityId));
    return queryParams.toString();
};

const getAdminData = async <T = any>(type: AdminResourceType, params: AdminGetParams = {}): Promise<ApiResponse<T[]>> => {
    const queryString = buildAdminQueryString(params);
    const endpoint = `/api/admin/${type}${queryString ? `?${queryString}` : ''}`;
    const context = `AdminService Get ${type}`;
    const response = await apiClient<AdminDataResponse<T>>(endpoint, context);
    return {
        ...response,
        data: Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []),
        pagination: response.pagination || response.data?.pagination,
    };
};

const createResource = async <T = any>(type: AdminResourceType, resourceData: Partial<T>): Promise<ApiResponse<T>> => {
    const endpoint = `/api/admin/${type}`;
    const context = `AdminService Create ${type}`;
    const response = await apiClient<AdminResourceResponse<T>>(endpoint, context, {
        method: 'POST',
        body: JSON.stringify(resourceData),
    });
    return {
        ...response,
        data: response.data?.data ?? response.data ?? null
    };
};

const updateResource = async <T = any>(type: AdminResourceType, id: number | string, updateData: Partial<T>): Promise<ApiResponse<T>> => {
    const endpoint = `/api/admin/${type}/${encodeURIComponent(String(id))}`;
    const context = `AdminService Update ${type} ${id}`;
    const response = await apiClient<AdminResourceResponse<T>>(endpoint, context, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
    return {
        ...response,
        data: response.data?.data ?? response.data ?? null
    };
};

const deleteResource = async (type: AdminResourceType, id: number | string): Promise<ApiResponse<null>> => {
    const endpoint = `/api/admin/${type}/${encodeURIComponent(String(id))}`;
    const context = `AdminService Delete ${type} ${id}`;
    const response = await apiClient<null>(endpoint, context, { method: 'DELETE' });
    return { success: response?.success ?? true, error: response?.error };
};

const getAdminNeighborhoods = async (params: AdminGetParams = {}): Promise<ApiResponse<Neighborhood[]>> => {
    return getAdminData<Neighborhood>('neighborhoods', params);
};

const createAdminNeighborhood = async (data: { name: string; city_id: number }): Promise<ApiResponse<Neighborhood>> => {
    return createResource<Neighborhood>('neighborhoods', data);
};

const updateAdminNeighborhood = async (id: number | string, data: Partial<Omit<Neighborhood, 'id'>>): Promise<ApiResponse<Neighborhood>> => {
    return updateResource<Neighborhood>('neighborhoods', id, data);
};

const deleteAdminNeighborhood = async (id: number | string): Promise<ApiResponse<null>> => {
    return deleteResource('neighborhoods', id);
};

const getAdminCitiesSimple = async (): Promise<City[]> => {
    const endpoint = '/api/admin/lookup/cities';
    const context = 'AdminService Get Cities Lookup';
    try {
        const response = await apiClient<{ data: City[] }>(endpoint, context);
        const cities = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []);
        console.log(`[AdminService] Fetched cities:`, cities);
        return cities;
    } catch (error) {
        console.error(`[AdminService] Error fetching cities lookup:`, error);
        return [];
    }
};

export const adminService = {
    getAdminData,
    createResource,
    updateResource,
    deleteResource,
    getAdminNeighborhoods,
    createAdminNeighborhood,
    updateAdminNeighborhood,
    deleteAdminNeighborhood,
    getAdminCitiesSimple,
};