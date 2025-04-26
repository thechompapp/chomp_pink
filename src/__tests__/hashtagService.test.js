/* src/__tests__/hashtagService.test.js */
import { describe, it, expect, jest } from 'vitest';
import hashtagService from '@/services/hashtagService';
import apiClient from '@/services/apiClient';

jest.mock('@/services/apiClient');

describe('hashtagService', () => {
  it('fetches top hashtags successfully', async () => {
    const mockResponse = {
      success: true,
      data: [
        { name: 'italian', usage_count: 100 },
        { name: 'pizza', usage_count: 80 },
      ],
    };
    apiClient.mockResolvedValue(mockResponse);

    const result = await hashtagService.getTopHashtags(2);
    expect(result).toEqual([
      { name: 'italian', usage_count: 100 },
      { name: 'pizza', usage_count: 80 },
    ]);
    expect(apiClient).toHaveBeenCalledWith('/api/hashtags/top?limit=2', expect.any(String));
  });

  it('handles API errors', async () => {
    const mockError = { success: false, error: 'Failed to fetch hashtags' };
    apiClient.mockRejectedValue(mockError);

    await expect(hashtagService.getTopHashtags()).rejects.toThrow('Failed to fetch hashtags');
  });
});