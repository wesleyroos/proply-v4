
import { db } from "@db/index";
import { users } from "@db/schema";
import { generateMonthlyInvoice } from "./invoiceService";
import { lte } from "drizzle-orm";

export async function checkAndGenerateInvoices() {
  // Get all pro users whose next billing date is today or in the past
  const usersToInvoice = await db
    .select()
    .from(users)
    .where(
      lte(users.subscriptionNextBillingDate, new Date())
    );

  for (const user of usersToInvoice) {
    await generateMonthlyInvoice(user.id);
    
    // Update next billing date
    await db
      .update(users)
      .set({
        subscriptionNextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      .where(eq(users.id, user.id));
  }
}
