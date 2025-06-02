import * as AdminModel from '../../models/adminModel.js';
import * as SubmissionModel from '../../models/submissionModel.js';
import db from '../../db/index.js';
import { logInfo, logError } from '../../utils/logger.js';
import {
  validateSuperuserAccess,
  getFormatterForResourceType,
  sendSuccessResponse,
  sendErrorResponse,
  createPagination,
  parsePaginationParams
} from './adminBaseController.js';

/**
 * Get all submissions with admin privileges
 */
export const getSubmissions = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { page, limit, sort, order, filters } = parsePaginationParams(req.query);
    const { data, total } = await AdminModel.findAllResources('submissions', page, limit, sort, order, filters);
    
    const formatter = getFormatterForResourceType('submissions');
    const formattedData = Array.isArray(data) ? data.map(formatter) : [];
    const pagination = createPagination(page, limit, total);
    
    sendSuccessResponse(res, formattedData, 'Submissions fetched successfully', pagination);
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch submissions');
  }
};

/**
 * Get submission by ID with admin privileges
 */
export const getSubmissionById = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'fetch submission');
    }
    
    const item = await AdminModel.findResourceById('submissions', resourceId);
    if (!item) {
      return sendErrorResponse(res, `Submission with ID ${resourceId} not found.`, 404, 'fetch submission');
    }
    
    const formatter = getFormatterForResourceType('submissions');
    sendSuccessResponse(res, formatter(item), 'Submission fetched successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch submission');
  }
};

/**
 * Approve submission with admin privileges
 */
export const approveSubmission = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const submissionId = parseInt(req.params.id, 10);
    if (isNaN(submissionId)) {
      return sendErrorResponse(res, 'Invalid submission ID format. ID must be an integer.', 400, 'approve submission');
    }
    
    // Check if submission exists
    const submission = await SubmissionModel.findSubmissionById(submissionId);
    if (!submission) {
      return sendErrorResponse(res, `Submission with ID ${submissionId} not found.`, 404, 'approve submission');
    }
    
    // Check if submission is already processed
    if (submission.status !== 'pending') {
      return sendErrorResponse(res, `Submission is already ${submission.status}.`, 400, 'approve submission');
    }
    
    // Process the submission approval
    const result = await AdminModel.approveSubmission(submissionId);
    
    logInfo(`Submission ${submissionId} approved successfully`);
    sendSuccessResponse(res, result, 'Submission approved successfully');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'approve submission');
  }
};

/**
 * Reject submission with admin privileges
 */
export const rejectSubmission = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const submissionId = parseInt(req.params.id, 10);
    if (isNaN(submissionId)) {
      return sendErrorResponse(res, 'Invalid submission ID format. ID must be an integer.', 400, 'reject submission');
    }
    
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return sendErrorResponse(res, 'Rejection reason is required.', 400, 'reject submission');
    }
    
    // Check if submission exists
    const submission = await SubmissionModel.findSubmissionById(submissionId);
    if (!submission) {
      return sendErrorResponse(res, `Submission with ID ${submissionId} not found.`, 404, 'reject submission');
    }
    
    // Check if submission is already processed
    if (submission.status !== 'pending') {
      return sendErrorResponse(res, `Submission is already ${submission.status}.`, 400, 'reject submission');
    }
    
    // Process the submission rejection
    const result = await AdminModel.rejectSubmission(submissionId, reason.trim());
    
    logInfo(`Submission ${submissionId} rejected successfully with reason: ${reason.trim()}`);
    sendSuccessResponse(res, result, 'Submission rejected successfully');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'reject submission');
  }
};

/**
 * Bulk approve submissions
 */
export const bulkApproveSubmissions = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminSubmissionController] Starting bulk approve submissions');
    const { submissionIds } = req.body;
    
    if (!submissionIds || !Array.isArray(submissionIds)) {
      return sendErrorResponse(res, 'Invalid submission IDs provided', 400, 'bulk approve submissions');
    }
    
    const results = {
      success: 0,
      failed: 0,
      total: submissionIds.length,
      errors: []
    };
    
    for (const submissionId of submissionIds) {
      try {
        const id = parseInt(submissionId, 10);
        if (isNaN(id)) {
          results.failed++;
          results.errors.push(`Invalid submission ID: ${submissionId}`);
          continue;
        }
        
        // Check if submission exists and is pending
        const submission = await SubmissionModel.findSubmissionById(id);
        if (!submission) {
          results.failed++;
          results.errors.push(`Submission ${id} not found`);
          continue;
        }
        
        if (submission.status !== 'pending') {
          results.failed++;
          results.errors.push(`Submission ${id} is already ${submission.status}`);
          continue;
        }
        
        await AdminModel.approveSubmission(id);
        results.success++;
        
      } catch (error) {
        logError(`Error approving submission ${submissionId}:`, error);
        results.failed++;
        results.errors.push(`Failed to approve submission ${submissionId}: ${error.message}`);
      }
    }
    
    logInfo(`Bulk approve completed: ${results.success} success, ${results.failed} failed`);
    
    sendSuccessResponse(res, results, `Bulk approve completed: ${results.success} approved, ${results.failed} failed`);
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'bulk approve submissions');
  }
};

/**
 * Bulk reject submissions
 */
export const bulkRejectSubmissions = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminSubmissionController] Starting bulk reject submissions');
    const { submissionIds, reason } = req.body;
    
    if (!submissionIds || !Array.isArray(submissionIds)) {
      return sendErrorResponse(res, 'Invalid submission IDs provided', 400, 'bulk reject submissions');
    }
    
    if (!reason || !reason.trim()) {
      return sendErrorResponse(res, 'Rejection reason is required', 400, 'bulk reject submissions');
    }
    
    const results = {
      success: 0,
      failed: 0,
      total: submissionIds.length,
      errors: []
    };
    
    for (const submissionId of submissionIds) {
      try {
        const id = parseInt(submissionId, 10);
        if (isNaN(id)) {
          results.failed++;
          results.errors.push(`Invalid submission ID: ${submissionId}`);
          continue;
        }
        
        // Check if submission exists and is pending
        const submission = await SubmissionModel.findSubmissionById(id);
        if (!submission) {
          results.failed++;
          results.errors.push(`Submission ${id} not found`);
          continue;
        }
        
        if (submission.status !== 'pending') {
          results.failed++;
          results.errors.push(`Submission ${id} is already ${submission.status}`);
          continue;
        }
        
        await AdminModel.rejectSubmission(id, reason.trim());
        results.success++;
        
      } catch (error) {
        logError(`Error rejecting submission ${submissionId}:`, error);
        results.failed++;
        results.errors.push(`Failed to reject submission ${submissionId}: ${error.message}`);
      }
    }
    
    logInfo(`Bulk reject completed: ${results.success} success, ${results.failed} failed`);
    
    sendSuccessResponse(res, results, `Bulk reject completed: ${results.success} rejected, ${results.failed} failed`);
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'bulk reject submissions');
  }
};

/**
 * Get submission statistics
 */
export const getSubmissionStats = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminSubmissionController] Fetching submission statistics');
    
    // Get counts by status
    const statusCounts = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM submissions 
      GROUP BY status
    `);
    
    // Get recent submissions (last 7 days)
    const recentSubmissions = await db.query(`
      SELECT COUNT(*) as count 
      FROM submissions 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    
    // Get submissions by type
    const typeCounts = await db.query(`
      SELECT 
        submission_type,
        COUNT(*) as count
      FROM submissions 
      GROUP BY submission_type
    `);
    
    const stats = {
      byStatus: statusCounts.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      byType: typeCounts.rows.reduce((acc, row) => {
        acc[row.submission_type] = parseInt(row.count);
        return acc;
      }, {}),
      recentCount: parseInt(recentSubmissions.rows[0]?.count || 0),
      timestamp: new Date().toISOString()
    };
    
    sendSuccessResponse(res, stats, 'Submission statistics retrieved successfully');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch submission statistics');
  }
}; 