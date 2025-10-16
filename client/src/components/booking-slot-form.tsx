import { useState } from "react";
import { useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query"; // <-- ADDED QueryClient, QueryClientProvider
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter"; 
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { CalendarIcon, Clock } from "lucide-react";

// --- MOCK AND HELPER DEFINITIONS (To fix compilation errors) ---

// 1. Mock cn (from @/lib/utils)
const cn = (...classes) => classes.filter(Boolean).join(' ');

// 2. Mock useToast
const useToast = () => ({
  toast: (options) => {
    // This function will simulate the toast notification
    console.log(`[TOAST] ${options.title}: ${options.description} (Variant: ${options.variant || 'default'})`);
  },
});

// 3. Mock useAuth
// Production mein, yeh data tumhari asli AuthProvider se aayega.
const mockUser = { id: "user-abc-123", username: "Jackie_User", phone: "+919999988888" };
const useAuth = () => ({
  user: mockUser,
  isAuthenticated: true, // Testing ke liye, hum maan rahe hain ki user Logged In hai
  logout: () => console.log("MOCK LOGOUT"),
});

// 4. Mock apiRequest (from @/lib/queryClient)
const apiRequest = async (method, url, data) => {
    console.log(`MOCK API CALL: ${method} ${url}`, data);
    // Tumhare backend route (/api/bookings) ko simulate kar raha hai
    if (url === "/api/bookings") {
        return {
            json: async () => ({
                id: `booking-mock-${Date.now()}`, 
                status: 'pending', 
                ...data
            }),
        };
    }
    throw new Error("Mock API endpoint not found.");
};

// --- END MOCK DEFINITIONS ---


const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
];

const bookingSchema = z.object({
  userPhone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[+]?[\d\s()-]+$/, "Please enter a valid phone number with country code (e.g., +1234567890)"),
  userAddress: z.string().min(5, "Address is required"),
  scheduledDate: z.date({
    required_error: "Please select a date",
  }),
  preferredTimeSlot: z.string().min(1, "Please select a time slot"),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingSlotFormProps {
  providerId: string;
  problemId: string;
  problemName: string;
  onSuccess?: () => void;
}

// Global Query Client instance for local testing
const client = new QueryClient();

// Main logic component (renamed internally)
function BookingSlotFormLogic({
  providerId,
  problemId,
  problemName,
  onSuccess,
}: BookingSlotFormProps) {
  // Mocks ab yahan use ho rahe hain
  const { toast } = useToast();
  // useQueryClient() ab Provider ke andar hai
  const queryClient = useQueryClient(); 
  const { user, isAuthenticated } = useAuth(); 
  const [, setLocation] = useLocation(); 

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      userPhone: user?.phone || "", 
      userAddress: "",
      notes: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      // Data ko backend ke format mein structure karna
      const bookingData = {
        userId: user?.id || "",
        providerId,
        serviceType: "electrician", // Ya jo bhi service type ho
        problemId,
        scheduledAt: data.scheduledDate.toISOString(),
        preferredTimeSlots: [data.preferredTimeSlot],
        userPhone: data.userPhone,
        userAddress: data.userAddress,
        notes: data.notes,
        status: "pending",
      };

      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Submit Ho Gayi!",
        description: "Electrician ko notification mil gaya hai aur woh jald hi contact karenge.",
      });
      // Bookings list ko refresh karna
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Fail Ho Gayi",
        description: error.message || "Kuch gadbad ho gayi. Kripya phir se koshish karein.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    // LOGIN CHECK - Agar user authenticated nahi hai toh Login page pe bhejo
    if (!isAuthenticated) {
        toast({
            title: "Login Zaruri Hai",
            description: "Service book karne ke liye kripya pehle login karein.",
            variant: "destructive",
        });
        setLocation("/login"); // User ko login page par redirect karo
        return;
    }
    createBookingMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/10 p-4 rounded-lg">
        <p className="text-sm font-medium">Chuni Hui Problem:</p>
        <p className="text-lg font-semibold">{problemName}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Date Selection */}
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date Chunein</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-select-date"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Ek date chunein</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Slot Selection */}
          <FormField
            control={form.control}
            name="preferredTimeSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pasandida Time Slot
                </FormLabel>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={field.value === slot ? "default" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(slot)}
                      data-testid={`button-timeslot-${slot.replace(/\s/g, '-')}`}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="userPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aapka Phone Number (Country Code ke saath)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+91 98765 43210"
                    {...field}
                    data-testid="input-phone"
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  Country code zarur daalein (jaise: +91, +1)
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="userAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aapka Pura Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Apna pura address daalein..."
                    {...field}
                    data-testid="input-address"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Additional Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Problem ke baare mein koi aur jankari..."
                    {...field}
                    data-testid="input-notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={createBookingMutation.isPending}
            data-testid="button-submit-booking"
          >
            {createBookingMutation.isPending ? "Submit Ho Raha Hai..." : "Service Slot Book Karein"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

// Wrapper component jo QueryClientProvider deta hai
export default function BookingSlotForm(props: BookingSlotFormProps) {
    return (
        <QueryClientProvider client={client}>
            <BookingSlotFormLogic {...props} />
        </QueryClientProvider>
    );
}
