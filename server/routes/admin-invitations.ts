import { Router } from "express";
import { db } from "../../db";
import { adminInvitations, users, agencyBranches } from "../../db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { requireAdmin, requireRole } from "../auth";
import { createId } from '@paralleldrive/cuid2';
import { sendAdminInvitationEmail } from "../utils/admin-emails";

const router = Router();

// Create admin invitation
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { email, role, agencyId, firstName, lastName } = req.body;
    
    // Validate required fields
    if (!email || !role || !firstName || !lastName) {
      return res.status(400).json({ 
        error: "Email, role, firstName, and lastName are required" 
      });
    }

    // Validate role
    const validRoles = ['franchise_admin', 'branch_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: "Invalid role. Must be franchise_admin or branch_admin" 
      });
    }

    // For agency admins, agencyId is required
    if ((role === 'franchise_admin' || role === 'branch_admin') && !agencyId) {
      return res.status(400).json({ 
        error: "Agency ID required for agency admin roles" 
      });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ 
        error: "User with this email already exists" 
      });
    }

    // Check for existing pending invitation
    const existingInvitation = await db
      .select()
      .from(adminInvitations)
      .where(
        and(
          eq(adminInvitations.email, email),
          isNull(adminInvitations.usedAt),
          gt(adminInvitations.expiresAt, new Date())
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return res.status(400).json({ 
        error: "Pending invitation already exists for this email" 
      });
    }

    // Validate agency/branch associations
    if (role === 'franchise_admin' && !franchiseId) {
      return res.status(400).json({ 
        error: "Franchise ID required for franchise admin role" 
      });
    }

    if (role === 'branch_admin' && !branchId) {
      return res.status(400).json({ 
        error: "Branch ID required for branch admin role" 
      });
    }

    // Verify agency/branch exists
    if (franchiseId || branchId) {
      const agencyId = franchiseId || branchId;
      const agency = await db
        .select()
        .from(agencyBranches)
        .where(eq(agencyBranches.id, agencyId))
        .limit(1);

      if (agency.length === 0) {
        return res.status(400).json({ 
          error: "Invalid agency/branch ID" 
        });
      }
    }

    // Create invitation
    const token = createId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await db
      .insert(adminInvitations)
      .values({
        email,
        role,
        franchiseId: franchiseId || null,
        branchId: branchId || null,
        token,
        invitedBy: (req.user as any).id,
        expiresAt,
      })
      .returning();

    // Send invitation email
    try {
      await sendAdminInvitationEmail({
        email,
        firstName,
        lastName,
        role,
        token,
        agencyName: franchiseId || branchId ? 'Agency' : 'Platform', // TODO: Get actual agency name
        invitedBy: `${(req.user as any).firstName} ${(req.user as any).lastName}`,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    res.json({
      message: "Invitation sent successfully",
      invitation: invitation[0]
    });

  } catch (error) {
    console.error('Error creating admin invitation:', error);
    res.status(500).json({ error: "Failed to create invitation" });
  }
});

// Get pending invitations
router.get("/", requireAdmin, async (req, res) => {
  try {
    const invitations = await db
      .select({
        id: adminInvitations.id,
        email: adminInvitations.email,
        role: adminInvitations.role,
        franchiseId: adminInvitations.franchiseId,
        branchId: adminInvitations.branchId,
        expiresAt: adminInvitations.expiresAt,
        usedAt: adminInvitations.usedAt,
        createdAt: adminInvitations.createdAt,
        invitedBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(adminInvitations)
      .leftJoin(users, eq(adminInvitations.invitedBy, users.id))
      .where(isNull(adminInvitations.usedAt))
      .orderBy(adminInvitations.createdAt);

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

// Accept invitation (public endpoint)
router.post("/:token/accept", async (req, res) => {
  try {
    const { token } = req.params;
    const { password, firstName, lastName } = req.body;

    if (!password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: "Password, firstName, and lastName are required" 
      });
    }

    // Find valid invitation
    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(
        and(
          eq(adminInvitations.token, token),
          isNull(adminInvitations.usedAt),
          gt(adminInvitations.expiresAt, new Date())
        )
      )
      .limit(1);

    if (invitation.length === 0) {
      return res.status(400).json({ 
        error: "Invalid or expired invitation token" 
      });
    }

    const inv = invitation[0];

    // Check if user already exists (shouldn't happen, but double-check)
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, inv.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ 
        error: "User account already exists" 
      });
    }

    // Hash password (using same method as registration)
    const { crypto } = await import("../auth");
    const hashedPassword = await crypto.hash(password);

    // Create user account
    const newUser = await db
      .insert(users)
      .values({
        username: inv.email, // Use email as username
        email: inv.email,
        password: hashedPassword,
        userType: 'Business',
        role: inv.role,
        franchiseId: inv.franchiseId,
        branchId: inv.branchId,
        firstName,
        lastName,
        isAdmin: false, // They're admin via role, not legacy boolean
      })
      .returning();

    // Mark invitation as used
    await db
      .update(adminInvitations)
      .set({ 
        usedAt: new Date() 
      })
      .where(eq(adminInvitations.id, inv.id));

    res.json({
      message: "Account created successfully",
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        role: newUser[0].role,
        firstName: newUser[0].firstName,
        lastName: newUser[0].lastName,
      }
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

// Cancel invitation
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .delete(adminInvitations)
      .where(eq(adminInvitations.id, parseInt(id)));

    res.json({ message: "Invitation cancelled successfully" });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ error: "Failed to cancel invitation" });
  }
});

// Resend invitation
router.post("/:id/resend", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get invitation details
    const invitation = await db
      .select()
      .from(adminInvitations)
      .where(
        and(
          eq(adminInvitations.id, parseInt(id)),
          isNull(adminInvitations.usedAt)
        )
      )
      .limit(1);

    if (invitation.length === 0) {
      return res.status(400).json({ 
        error: "Invitation not found or already used" 
      });
    }

    const inv = invitation[0];

    // Update expiry date
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await db
      .update(adminInvitations)
      .set({ 
        expiresAt: newExpiresAt 
      })
      .where(eq(adminInvitations.id, parseInt(id)));

    // Resend email
    try {
      await sendAdminInvitationEmail({
        email: inv.email,
        firstName: 'Admin', // We don't store this in invitation
        lastName: 'User',
        role: inv.role,
        token: inv.token,
        agencyName: 'Agency',
        invitedBy: `${(req.user as any).firstName} ${(req.user as any).lastName}`,
      });

      res.json({ message: "Invitation resent successfully" });
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError);
      res.status(500).json({ error: "Failed to resend invitation email" });
    }

  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ error: "Failed to resend invitation" });
  }
});

export default router;