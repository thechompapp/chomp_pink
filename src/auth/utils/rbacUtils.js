/**
 * Role-Based Access Control Utilities
 * 
 * Utility functions for role-based access control.
 */
import { logDebug } from '@/utils/logger';

/**
 * Default roles hierarchy
 * Higher roles include permissions of lower roles
 * @type {Object}
 */
export const DEFAULT_ROLES = {
  GUEST: 'guest',
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

/**
 * Role hierarchy mapping
 * Each role includes all permissions of roles listed in its array
 * @type {Object}
 */
export const ROLE_HIERARCHY = {
  [DEFAULT_ROLES.GUEST]: [],
  [DEFAULT_ROLES.USER]: [DEFAULT_ROLES.GUEST],
  [DEFAULT_ROLES.MODERATOR]: [DEFAULT_ROLES.USER],
  [DEFAULT_ROLES.ADMIN]: [DEFAULT_ROLES.MODERATOR],
  [DEFAULT_ROLES.SUPER_ADMIN]: [DEFAULT_ROLES.ADMIN]
};

/**
 * Get all roles included in a given role
 * @param {string} role - Role to check
 * @returns {string[]} Array of included roles
 */
export const getIncludedRoles = (role) => {
  if (!role || !ROLE_HIERARCHY[role]) {
    return [];
  }
  
  const includedRoles = [role];
  const directlyIncluded = ROLE_HIERARCHY[role];
  
  // Recursively add included roles
  directlyIncluded.forEach(includedRole => {
    includedRoles.push(...getIncludedRoles(includedRole));
  });
  
  // Remove duplicates
  return [...new Set(includedRoles)];
};

/**
 * Check if a role includes another role
 * @param {string} role - Role to check
 * @param {string} requiredRole - Required role
 * @returns {boolean} True if role includes the required role
 */
export const roleIncludes = (role, requiredRole) => {
  if (role === requiredRole) {
    return true;
  }
  
  const includedRoles = getIncludedRoles(role);
  return includedRoles.includes(requiredRole);
};

/**
 * Check if user has required role
 * @param {Object} user - User object
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {boolean} True if user has required role
 */
export const userHasRole = (user, requiredRoles) => {
  if (!user || !user.role) {
    return false;
  }
  
  const userRole = user.role;
  
  // Handle array of required roles
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.some(role => roleIncludes(userRole, role));
  }
  
  // Handle single required role
  return roleIncludes(userRole, requiredRoles);
};

/**
 * Check if user has required permission
 * @param {Object} user - User object
 * @param {string} permission - Required permission
 * @param {Object} permissionMap - Map of permissions to roles
 * @returns {boolean} True if user has required permission
 */
export const userHasPermission = (user, permission, permissionMap = {}) => {
  if (!user || !user.role || !permission) {
    return false;
  }
  
  // If no permission map provided, use role-based check
  if (!permissionMap[permission]) {
    logDebug(`[rbacUtils] No permission map for ${permission}, falling back to role check`);
    return userHasRole(user, DEFAULT_ROLES.ADMIN);
  }
  
  // Check if user's role has the required permission
  const rolesWithPermission = permissionMap[permission];
  return userHasRole(user, rolesWithPermission);
};

/**
 * Create a permission map
 * @param {Object} permissionDefinitions - Permission definitions
 * @returns {Object} Permission map
 * 
 * @example
 * const permissionMap = createPermissionMap({
 *   'create:item': [ROLES.USER, ROLES.ADMIN],
 *   'delete:item': [ROLES.ADMIN]
 * });
 */
export const createPermissionMap = (permissionDefinitions) => {
  return { ...permissionDefinitions };
};

export default {
  DEFAULT_ROLES,
  ROLE_HIERARCHY,
  getIncludedRoles,
  roleIncludes,
  userHasRole,
  userHasPermission,
  createPermissionMap
};
