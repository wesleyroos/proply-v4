import { Router } from "express";
import { db } from "@db";
import { agencyBranches, users } from "@db/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'agency-logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const branchId = req.body.branchId || req.user?.branchId;
    cb(null, `agency-${branchId}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// GET /api/agency-profile - Get agency information for current user
router.get("/agency-profile", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Only allow branch_admin and franchise_admin to access this
    if (req.user.role !== 'branch_admin' && req.user.role !== 'franchise_admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    let branchId = req.user.branchId;
    
    // For franchise admins, get the first branch of their franchise
    if (req.user.role === 'franchise_admin' && req.user.franchiseId) {
      const [firstBranch] = await db
        .select()
        .from(agencyBranches)
        .where(eq(agencyBranches.id, req.user.franchiseId))
        .limit(1);
      
      if (firstBranch) {
        branchId = firstBranch.id;
      }
    }

    if (!branchId) {
      return res.status(400).json({ error: "No branch associated with user" });
    }

    // Get agency branch information
    const [agency] = await db
      .select()
      .from(agencyBranches)
      .where(eq(agencyBranches.id, branchId))
      .limit(1);

    if (!agency) {
      return res.status(404).json({ error: "Agency branch not found" });
    }

    return res.json({
      id: agency.id,
      franchiseName: agency.franchiseName,
      branchName: agency.branchName,
      logoUrl: agency.logoUrl,
      companyName: agency.companyName,
      vatNumber: agency.vatNumber,
      registrationNumber: agency.registrationNumber,
      businessAddress: agency.businessAddress,
      userRole: req.user.role
    });

  } catch (error) {
    console.error("Error fetching agency profile:", error);
    return res.status(500).json({ error: "Failed to fetch agency profile" });
  }
});

// PUT /api/agency-profile - Update agency information
router.put("/agency-profile", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Only allow branch_admin and franchise_admin to update this
    if (req.user.role !== 'branch_admin' && req.user.role !== 'franchise_admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { companyName, vatNumber, registrationNumber, businessAddress } = req.body;

    let branchId = req.user.branchId;
    
    // For franchise admins, get the first branch of their franchise
    if (req.user.role === 'franchise_admin' && req.user.franchiseId) {
      const [firstBranch] = await db
        .select()
        .from(agencyBranches)
        .where(eq(agencyBranches.id, req.user.franchiseId))
        .limit(1);
      
      if (firstBranch) {
        branchId = firstBranch.id;
      }
    }

    if (!branchId) {
      return res.status(400).json({ error: "No branch associated with user" });
    }

    // Update agency branch information
    await db
      .update(agencyBranches)
      .set({
        companyName,
        vatNumber,
        registrationNumber,
        businessAddress,
        updatedAt: new Date()
      })
      .where(eq(agencyBranches.id, branchId));

    // Get updated agency data
    const [updatedAgency] = await db
      .select()
      .from(agencyBranches)
      .where(eq(agencyBranches.id, branchId))
      .limit(1);

    return res.json({
      id: updatedAgency.id,
      franchiseName: updatedAgency.franchiseName,
      branchName: updatedAgency.branchName,
      logoUrl: updatedAgency.logoUrl,
      companyName: updatedAgency.companyName,
      vatNumber: updatedAgency.vatNumber,
      registrationNumber: updatedAgency.registrationNumber,
      businessAddress: updatedAgency.businessAddress,
      userRole: req.user.role
    });

  } catch (error) {
    console.error("Error updating agency profile:", error);
    return res.status(500).json({ error: "Failed to update agency profile" });
  }
});

// POST /api/agency-profile/logo - Upload agency logo
router.post("/agency-profile/logo", upload.single('logo'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Only allow branch_admin and franchise_admin to upload logos
    if (req.user.role !== 'branch_admin' && req.user.role !== 'franchise_admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No logo file provided" });
    }

    let branchId = req.user.branchId;
    
    // For franchise admins, get the first branch of their franchise
    if (req.user.role === 'franchise_admin' && req.user.franchiseId) {
      const [firstBranch] = await db
        .select()
        .from(agencyBranches)
        .where(eq(agencyBranches.id, req.user.franchiseId))
        .limit(1);
      
      if (firstBranch) {
        branchId = firstBranch.id;
      }
    }

    if (!branchId) {
      // Delete uploaded file if no valid branch
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "No branch associated with user" });
    }

    // Check if agency exists
    const [existingAgency] = await db
      .select()
      .from(agencyBranches)
      .where(eq(agencyBranches.id, branchId))
      .limit(1);

    if (!existingAgency) {
      // Delete uploaded file if agency doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Agency not found" });
    }

    // Remove old logo if it exists
    if (existingAgency.logoUrl) {
      const logoPath = existingAgency.logoUrl.startsWith('/static-assets/') 
        ? existingAgency.logoUrl.replace('/static-assets/', '')
        : existingAgency.logoUrl.replace('/', '');
      const oldLogoPath = path.join(process.cwd(), 'public', logoPath);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Update agency with new logo URL
    const logoUrl = `/static-assets/agency-logos/${req.file.filename}`;
    await db
      .update(agencyBranches)
      .set({ 
        logoUrl,
        updatedAt: new Date()
      })
      .where(eq(agencyBranches.id, branchId));

    return res.json({
      logoUrl,
      message: "Logo uploaded successfully"
    });

  } catch (error) {
    console.error("Error uploading agency logo:", error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up uploaded file:", cleanupError);
      }
    }
    
    return res.status(500).json({ error: "Failed to upload logo" });
  }
});

export default router;