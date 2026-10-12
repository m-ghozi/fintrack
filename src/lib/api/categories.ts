import { apiClient } from './client';
import { Category, CreateCategoryDTO, UpdateCategoryDTO, CategoryType } from '@/src/types/category';

export const categoriesService = {
  async getCategories(type?: CategoryType): Promise<Category[]> {
    const query = type ? `?type=${type}` : '';
    const res = await apiClient<{ data: Category[] & { children?: Category[] }[] }>(`/categories${query}`);
    // Backend nests children under `children` (Prisma self-relation); the UI
    // reads `subcategories`. Map it so sub-categories render.
    return res.data.map((c) => ({ ...c, subcategories: c.children ?? [] }));
  },

  async createCategory(dto: CreateCategoryDTO): Promise<Category> {
    const res = await apiClient<{ data: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return res.data;
  },

  async updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
    const res = await apiClient<{ data: Category }>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return res.data;
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
