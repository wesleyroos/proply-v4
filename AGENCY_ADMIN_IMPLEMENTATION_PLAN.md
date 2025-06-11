# Comprehensive Implementation Plan: Hybrid Agency Admin System

## Phase 1: Database Schema Evolution (Week 1)

### 1.1 Schema Updates
```sql
-- Add new role-based columns to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;
ALTER TABLE users ADD COLUMN franchise_id INTEGER REFERENCES agency_branches(id);
ALTER TABLE users ADD COLUMN branch_id INTEGER REFERENCES agency_branches(id);

-- Create role permissions table
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create admin invitations table
CREATE TABLE admin_invitations (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  franchise_id INTEGER REFERENCES agency_branches(id),
  branch_id INTEGER REFERENCES agency_branches(id),
  token TEXT UNIQUE NOT NULL,
  invited_by INTEGER REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 Data Migration
```sql
-- Migrate existing admin users
UPDATE users SET role = 'system_admin' WHERE is_admin = true;
UPDATE users SET role = 'user' WHERE is_admin = false;

-- Populate default permissions
INSERT INTO role_permissions VALUES
('system_admin', 'all', 'all', 'system'),
('franchise_admin', 'reports', 'view', 'franchise'),
('franchise_admin', 'analytics', 'view', 'franchise'),
('franchise_admin', 'users', 'view', 'franchise'),
('branch_admin', 'reports', 'view', 'branch'),
('branch_admin', 'analytics', 'view', 'branch'),
('branch_admin', 'users', 'view', 'branch');
```

## Phase 2: Authentication & Authorization Framework (Week 2)

### 2.1 Permission System
**New File:** `server/utils/permissions.ts`
```typescript
export interface PermissionCheck {
  role: string;
  resource: string;
  action: string;
  scope: string;
  franchiseId?: number;
  branchId?: number;
}

export function hasPermission(user: User, check: PermissionCheck): boolean
export function getUserScope(user: User): { franchiseId?: number; branchId?: number }
export function filterDataByPermissions(data: any[], user: User): any[]
```

### 2.2 Middleware Updates
**Update:** `server/middleware/auth.ts`
- Replace `isAdmin` checks with role-based permissions
- Add scope filtering for data access
- Create reusable permission middleware functions

### 2.3 Frontend Auth Hooks
**Update:** `client/src/hooks/use-user.ts`
```typescript
export function usePermissions() {
  return {
    canView: (resource: string, scope?: string) => boolean,
    canEdit: (resource: string, scope?: string) => boolean,
    getUserScope: () => { franchiseId?: number; branchId?: number }
  }
}
```

## Phase 3: Admin Invitation System (Week 3)

### 3.1 Backend API Routes
**New File:** `server/routes/admin-invitations.ts`
```typescript
POST /api/admin/invitations - Create invitation
GET /api/admin/invitations - List pending invitations
POST /api/admin/invitations/:token/accept - Accept invitation
DELETE /api/admin/invitations/:id - Cancel invitation
```

### 3.2 Email System
**New File:** `server/utils/admin-emails.ts`
- Welcome email templates for different admin roles
- Invitation email with secure setup link
- Role explanation and dashboard overview
- Support contact information

### 3.3 Invitation UI Components
**New File:** `client/src/components/AdminInvitationModal.tsx`
```typescript
interface InvitationForm {
  email: string;
  firstName: string;
  lastName: string;
  selectedAgency: number;
  role: 'franchise_admin' | 'branch_admin';
}
```

**New File:** `client/src/components/PendingInvitations.tsx`
- List of sent invitations
- Resend/cancel functionality
- Status tracking

## Phase 4: Admin Dashboards (Week 4-5)

### 4.1 Franchise Admin Dashboard
**New File:** `client/src/pages/FranchiseAdminDashboard.tsx`
```typescript
// Components:
- Multi-branch overview cards
- Comparative analytics charts
- Franchise-wide report statistics
- Branch performance comparison
- Agent engagement metrics
- Billing summary for franchise
```

### 4.2 Branch Admin Dashboard
**New File:** `client/src/pages/BranchAdminDashboard.tsx`
```typescript
// Components:
- Single branch metrics
- Individual agent tracking
- Recent report generations
- Property listing status
- Agent communication center
```

### 4.3 Shared Dashboard Components
**New Files:**
- `client/src/components/admin/AdminMetricsCard.tsx`
- `client/src/components/admin/ReportTrackingTable.tsx`
- `client/src/components/admin/AgentPerformanceChart.tsx`
- `client/src/components/admin/BillingInsights.tsx`

## Phase 5: Enhanced Agency Management (Week 6)

### 5.1 Agency Hierarchy Visualization
**Update:** `client/src/pages/ControlPanel.tsx`
```typescript
// Add hierarchy view:
- Tree structure showing franchise → branches
- Admin assignments per level
- Quick role assignment interface
- Bulk operations across branches
```

### 5.2 Admin Assignment Interface
**New Component:** `client/src/components/AdminAssignmentPanel.tsx`
```typescript
// Features:
- Drag-and-drop role assignments
- Agency hierarchy browser
- Permission preview
- Bulk invitation sending
```

## Phase 6: Communication & Notification System (Week 7)

### 6.1 Admin Notification Center
**New File:** `client/src/components/AdminNotifications.tsx`
```typescript
// Notification types:
- New report generations
- Agent engagement alerts
- Billing threshold warnings
- System status updates
```

### 6.2 Agent Communication Tools
**New Components:**
- Direct messaging to agents
- Bulk email functionality
- Report delivery status tracking
- Custom notification preferences

## Phase 7: Advanced Analytics & Reporting (Week 8)

### 7.1 Role-Specific Analytics
**Franchise Admin Analytics:**
- Cross-branch performance comparison
- Market share analysis per branch
- ROI tracking across franchise
- Agent productivity rankings

**Branch Admin Analytics:**
- Individual agent performance
- Property listing effectiveness
- Report engagement rates
- Local market insights

### 7.2 Custom Reporting
**New Feature:** `client/src/pages/CustomReports.tsx`
- White-label report generation
- Agency branding integration
- Automated report scheduling
- Export functionality (PDF, Excel)

## Phase 8: Security & Compliance (Week 9)

### 8.1 Audit Logging
**New Table:** `admin_audit_logs`
```sql
CREATE TABLE admin_audit_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.2 Access Control Validation
- Regular permission audits
- Inactive admin cleanup
- Session management improvements
- Two-factor authentication option

## Phase 9: Migration & Testing (Week 10)

### 9.1 Backward Compatibility Testing
- Verify all existing admin functionality works
- Test permission edge cases
- Validate data access restrictions
- Performance impact assessment

### 9.2 User Acceptance Testing
- Create test agency accounts
- Simulate real-world workflows
- Gather feedback on UI/UX
- Stress test invitation system

### 9.3 Production Migration
```sql
-- Final cleanup after successful migration
ALTER TABLE users DROP COLUMN is_admin;
```

## Phase 10: Documentation & Training (Week 11)

### 10.1 Technical Documentation
- API documentation updates
- Permission matrix reference
- Database schema documentation
- Deployment procedures

### 10.2 User Documentation
- Admin onboarding guide
- Feature walkthrough videos
- FAQ section for common tasks
- Support escalation procedures

### 10.3 Training Materials
- Demo environment setup
- Sample agency scenarios
- Common workflow examples
- Troubleshooting guides

## Implementation Dependencies

**Critical Path:**
1. Database schema → Authentication system → Admin dashboards
2. Invitation system can be built in parallel with dashboards
3. Advanced features depend on core admin functionality

**Resource Requirements:**
- Database migrations during low-traffic periods
- Email service configuration for invitations
- Testing environment with sample agency data
- Staging deployment for user acceptance testing

**Risk Mitigation:**
- Feature flags for gradual rollout
- Rollback procedures for each phase
- Comprehensive testing at each milestone
- Regular stakeholder check-ins

## Role Hierarchy Overview

```
System Admin (You)
├── Franchise Admin (All Sotheby's Branches)
│   ├── Branch Admin (Atlantic Seaboard)
│   └── Branch Admin (Constantia)
└── Independent Branch Admin (Boutique Agency XYZ)
```

## Permission Matrix

| Role | Reports | Analytics | Users | Settings | Billing |
|------|---------|-----------|-------|----------|---------|
| System Admin | All | All | All | All | All |
| Franchise Admin | Franchise | Franchise | Franchise | Franchise | Franchise |
| Branch Admin | Branch | Branch | Branch | Branch | Read-only |
| Agent | Own | Limited | None | Own Profile | None |

## Key Benefits

**For Agencies:**
- Clear oversight without overwhelming detail
- Flexibility to manage at branch or franchise level
- Direct control over agent communication preferences
- Transparent billing and usage tracking

**For Proply:**
- Scalable permission system for future growth
- Reduced support burden through self-service admin features
- Better relationship management with agency decision-makers
- Clear upgrade path from branch to franchise admin as agencies grow

This plan provides a structured approach to implementing the hybrid agency admin system while maintaining platform stability and ensuring smooth user adoption.