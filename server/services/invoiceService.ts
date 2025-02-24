
import { db } from "@db/index";
import { invoices, users } from "@db/schema";
import { eq } from "drizzle-orm";

export async function generateMonthlyInvoice(userId: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.subscriptionStatus !== "pro") {
    return;
  }

  // Generate invoice number (format: INV-{userId}-{timestamp})
  const invoiceNumber = `INV-${userId}-${Date.now()}`;

  // Create invoice record
  await db.insert(invoices).values({
    userId,
    amount: 2000.00, // R2,000.00 subscription fee
    description: "Monthly Proply Pro Subscription",
    status: "paid",
    invoiceNumber,
    paidAt: new Date(),
    createdAt: new Date()
  });
}
