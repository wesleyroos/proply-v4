import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

export default function PropertyForm({ onSubmit }) {
  const form = useForm({
    defaultValues: {
      address: "",
      bedrooms: "",
      bathrooms: "",
      longTermRental: "",
      annualEscalation: "",
      shortTermNightly: "",
      annualOccupancy: "",
      managementFee: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123 Main St" />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bedrooms</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bathrooms</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="longTermRental"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Long Term Monthly Rental</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="annualEscalation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Annual Escalation (%)</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" max="100" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shortTermNightly"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Term Nightly Rate</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="annualOccupancy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Annual Occupancy (%)</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" max="100" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="managementFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Management Fee (%)</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" max="100" />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]">
          Compare Options
        </Button>
      </form>
    </Form>
  );
}
