import { db } from "../../db";
import { rolePermissions, users, agencyBranches } from "../../db/schema";
import { eq, and, or } from "drizzle-orm";

export interface PermissionCheck {
  role: string;
  resource: string;
  action: string;
  scope: string;
  franchiseId?: number;
  branchId?: number;
}

export interface User {
  id: number;
  email: string;
  role: string;
  franchiseId?: number | null;
  branchId?: number | null;
  isAdmin?: boolean; // For backward compatibility during transition
}

export interface UserScope {
  franchiseId?: number;
  branchId?: number;
  scope: 'system' | 'franchise' | 'branch' | 'own';
}

/**
 * Check if a user has permission to perform an action on a resource
 */
export async function hasPermission(user: User, check: PermissionCheck): Promise<boolean> {
  // System admins have access to everything
  if (user.role === 'system_admin') {
    return true;
  }

  // Get permissions for the user's role
  const permissions = await db
    .select()
    .from(rolePermissions)
    .where(eq(rolePermissions.role, user.role));

  // Check for exact permission match
  const exactMatch = permissions.find(p => 
    p.resource === check.resource && 
    p.action === check.action &&
    p.scope === check.scope
  );

  if (exactMatch) {
    return validateScope(user, check);
  }

  // Check for wildcard permissions
  const wildcardMatch = permissions.find(p => 
    (p.resource === 'all' || p.resource === check.resource) &&
    (p.action === 'all' || p.action === check.action) &&
    (p.scope === 'system' || p.scope === check.scope)
  );

  if (wildcardMatch) {
    return validateScope(user, check);
  }

  return false;
}

/**
 * Validate that the user has access to the requested scope
 */
function validateScope(user: User, check: PermissionCheck): boolean {
  switch (check.scope) {
    case 'system':
      return user.role === 'system_admin';
    
    case 'franchise':
      if (user.role === 'system_admin') return true;
      if (user.role === 'franchise_admin') {
        return !check.franchiseId || user.franchiseId === check.franchiseId;
      }
      return false;
    
    case 'branch':
      if (user.role === 'system_admin') return true;
      if (user.role === 'franchise_admin') {
        return !check.franchiseId || user.franchiseId === check.franchiseId;
      }
      if (user.role === 'branch_admin') {
        return !check.branchId || user.branchId === check.branchId;
      }
      return false;
    
    case 'own':
      return true; // User can always access their own data
    
    default:
      return false;
  }
}

/**
 * Get the scope of access for a user
 */
export function getUserScope(user: User): UserScope {
  switch (user.role) {
    case 'system_admin':
      return { scope: 'system' };
    
    case 'franchise_admin':
      return { 
        scope: 'franchise', 
        franchiseId: user.franchiseId || undefined 
      };
    
    case 'branch_admin':
      return { 
        scope: 'branch', 
        branchId: user.branchId || undefined,
        franchiseId: user.franchiseId || undefined 
      };
    
    default:
      return { scope: 'own' };
  }
}

/**
 * Filter data array based on user permissions and scope
 */
export function filterDataByPermissions<T extends { franchiseId?: number; branchId?: number; userId?: number }>(
  data: T[], 
  user: User
): T[] {
  const scope = getUserScope(user);
  
  switch (scope.scope) {
    case 'system':
      return data; // System admin sees everything
    
    case 'franchise':
      return data.filter(item => 
        !item.franchiseId || item.franchiseId === scope.franchiseId
      );
    
    case 'branch':
      return data.filter(item => 
        !item.branchId || item.branchId === scope.branchId
      );
    
    case 'own':
      return data.filter(item => 
        !item.userId || item.userId === user.id
      );
    
    default:
      return [];
  }
}

/**
 * Check if user can view resource (shorthand)
 */
export async function canView(user: User, resource: string, scope: string = 'own', contextId?: number): Promise<boolean> {
  return hasPermission(user, {
    role: user.role,
    resource,
    action: 'view',
    scope,
    franchiseId: scope === 'franchise' ? contextId : undefined,
    branchId: scope === 'branch' ? contextId : undefined,
  });
}

/**
 * Check if user can edit resource (shorthand)
 */
export async function canEdit(user: User, resource: string, scope: string = 'own', contextId?: number): Promise<boolean> {
  return hasPermission(user, {
    role: user.role,
    resource,
    action: 'edit',
    scope,
    franchiseId: scope === 'franchise' ? contextId : undefined,
    branchId: scope === 'branch' ? contextId : undefined,
  });
}

/**
 * Check if user can create resource (shorthand)
 */
export async function canCreate(user: User, resource: string, scope: string = 'own'): Promise<boolean> {
  return hasPermission(user, {
    role: user.role,
    resource,
    action: 'create',
    scope,
  });
}

/**
 * Check if user can delete resource (shorthand)
 */
export async function canDelete(user: User, resource: string, scope: string = 'own', contextId?: number): Promise<boolean> {
  return hasPermission(user, {
    role: user.role,
    resource,
    action: 'delete',
    scope,
    franchiseId: scope === 'franchise' ? contextId : undefined,
    branchId: scope === 'branch' ? contextId : undefined,
  });
}

/**
 * Middleware helper to check permissions
 */
export function requirePermission(resource: string, action: string, scope: string = 'own') {
  return async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasAccess = await hasPermission(req.user, {
      role: req.user.role,
      resource,
      action,
      scope,
      franchiseId: req.params.franchiseId ? parseInt(req.params.franchiseId) : undefined,
      branchId: req.params.branchId ? parseInt(req.params.branchId) : undefined,
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Get agency hierarchy for a user
 */
export async function getUserAgencyHierarchy(user: User) {
  if (user.role === 'system_admin') {
    // System admin can see all agencies
    return await db.select().from(agencyBranches);
  }

  if (user.role === 'franchise_admin' && user.franchiseId) {
    // Franchise admin sees all branches in their franchise
    return await db
      .select()
      .from(agencyBranches)
      .where(eq(agencyBranches.id, user.franchiseId));
  }

  if (user.role === 'branch_admin' && user.branchId) {
    // Branch admin sees only their branch
    return await db
      .select()
      .from(agencyBranches)
      .where(eq(agencyBranches.id, user.branchId));
  }

  return [];
}