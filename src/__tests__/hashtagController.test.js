// Filename: /root/doof-backend/__tests__/hashtagController.test.js
import { describe, it, expect, jest } from 'vitest';
import { getTopHashtags } from '../controllers/hashtagController';
import * as HashtagModel from '../models/hashtagModel';

jest.mock('../models/hashtagModel');

describe('hashtagController', () => {
  it('returns top hashtags successfully', async () => {
    const mockHashtags = [
      { name: 'italian', usage_count: 100 },
      { name: 'pizza', usage_count: 80 },
    ];
    HashtagModel.getTopHashtags.mockResolvedValue(mockHashtags);

    const req = { query: { limit: '2' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await getTopHashtags(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Top 2 hashtags retrieved successfully.',
      data: mockHashtags,
    });
    expect(HashtagModel.getTopHashtags).toHaveBeenCalledWith(2);
  });

  it('handles validation errors', async () => {
    const req = { query: { limit: '0' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await getTopHashtags(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errors: expect.any(Array),
    });
  });

  it('handles model errors', async () => {
    HashtagModel.getTopHashtags.mockRejectedValue(new Error('Database error'));

    const req = { query: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await getTopHashtags(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database error',
    });
  });
});