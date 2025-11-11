// client/src/pages/provider-dashboard.tsx (FINAL - With Image Uploads & Booking Logic)

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  ServiceProvider,
  ServiceCategory,
  ServiceProblem,
  Booking,
  Invoice,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Play,
  ClipboardCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  Home,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import MenuItemForm from "@/components/forms/MenuItemForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link, Redirect } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form"; // FIX: Added useFieldArray
import { z } from "zod";

// --- TYPE UPDATE KIYA GAYA ---
type ProviderProfileWithCategory = ServiceProvider & {
  category: ServiceCategory;
  profileImageUrl?: string | null;
  galleryImages?: string[] | null;
};

// --- NAYI TYPES ADD KI HAIN ---
// Booking type jo humein API se milegi (user details ke saath)
type FullBooking = Booking & {
  user: {
    id: string;
    username: string;
    phone: string;
  };
  invoice: Invoice | null; // Invoice bhi saath mein aa sakta hai
};

// Invoice bill create karne ka Zod schema
const billFormSchema = z.object({
  spareParts: z.array(
    z.object({
      name: z.string().min(1, "Part name is required"),
      price: z.preprocess(
        (val) => (val === "" ? 0 : parseFloat(z.string().parse(val))), // FIX: Handle empty string
        z.number().min(0, "Price must be positive")
      ),
    })
  ),
  serviceCharge: z.preprocess(
    (val) => (val === "" ? 0 : parseFloat(z.string().parse(val))), // FIX: Handle empty string
    z.number().min(0, "Service charge is required")
  ),
  notes: z.string().optional(),
});

type BillFormData = z.infer<typeof billFormSchema>;
// --- NAYI TYPES KHATAM ---

// --- COMPONENT 1: MENU MANAGER (Waise ka waisa) ---
const MenuItemsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const providerCategorySlug = providerProfile.category.slug;

  const {
    data: menuItems,
    isLoading: isLoadingMenuItems,
    refetch: refetchMenuItems,
  } = useQuery<any[]>({
    queryKey: ["providerMenuItems", providerCategorySlug],
    queryFn: async () => {
      if (!providerCategorySlug) return [];
      const res = await api.get(
        `/api/provider/menu-items/${providerCategorySlug}`
      );
      return res.data;
    },
    enabled: !!providerCategorySlug,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const deleteMenuItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/api/provider/menu-items/${providerCategorySlug}/${itemId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Menu item deleted." });
      queryClient.invalidateQueries({
        queryKey: ["providerMenuItems", providerCategorySlug],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (itemId: string) => {
    // NOTE: window.confirm() Replit/iframe mein shayad na dikhe
    // Isko behtar UI modal se replace karna behtar hoga
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMenuItemMutation.mutate(itemId);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    refetchMenuItems();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Menu Items</CardTitle>
          <CardDescription>
            Manage the items for your '{providerProfile.category.name}' service.
          </CardDescription>
        </div>
        <Dialog
          open={isFormOpen}
          onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setEditingItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Item" : "Add New Item"}
              </DialogTitle>
              <DialogDescription>
                Fill in the details for your service or product.
              </DialogDescription>
            </DialogHeader>
            <MenuItemForm
              providerId={providerProfile.id}
              categorySlug={providerCategorySlug}
              initialData={editingItem}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoadingMenuItems ? (
          <div className="flex justify-center py-10">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading menu...
          </div>
        ) : !Array.isArray(menuItems) || menuItems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">Your Menu is Empty</h3>
            <p className="text-muted-foreground mt-2">
              Click "Add New Item" to start building your menu.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price (₹)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    {item.category ? (
                      <Badge variant="outline">{item.category}</Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={
                        deleteMenuItemMutation.isPending &&
                        deleteMenuItemMutation.variables === item.id
                      }
                    >
                      {deleteMenuItemMutation.isPending &&
                      deleteMenuItemMutation.variables === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// --- COMPONENT 2: BOOKING MANAGER (POORA NAYA LOGIC) ---
const BookingsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Bookings Fetch karne ka logic
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<
    FullBooking[]
  >({
    queryKey: ["providerBookings"],
    queryFn: async () => {
      const res = await api.get("/api/provider/bookings");
      return res.data;
    },
    // Har 30 second mein refresh karo (urgent bookings ke liye)
    refetchInterval: 30000,
  });

  // Action mutations
  const updateBookingStatus = useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: "accepted" | "declined" | "started" | "completed";
    }) => api.patch(`/api/bookings/${bookingId}/status`, { status }),
    onSuccess: (data) => {
      toast({
        title: `Booking ${data.data.status}`,
        description: `Booking ID ${data.data.id} has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update booking.",
        variant: "destructive",
      });
    },
  });

  const generateOtpMutation = useMutation({
    mutationFn: (bookingId: string) =>
      api.post(`/api/bookings/${bookingId}/generate-otp`),
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "OTP has been sent to the customer's phone.",
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "OTP Error",
        description: error.response?.data?.message || "Failed to send OTP.",
        variant: "destructive",
      });
    },
  });

  // --- NAYE ACTION HANDLERS ---
  const handleAccept = (booking: FullBooking) => {
    updateBookingStatus.mutate({ bookingId: booking.id, status: "accepted" });
  };

  const handleDecline = (booking: FullBooking) => {
    updateBookingStatus.mutate({ bookingId: booking.id, status: "declined" });
  };

  const handleStartJob = (booking: FullBooking) => {
    updateBookingStatus.mutate({ bookingId: booking.id, status: "started" });
  };

  const handleJobDone = (booking: FullBooking) => {
    generateOtpMutation.mutate(booking.id);
  };

  const getBadgeColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending": return "default";
      case "accepted": return "secondary";
      case "started": return "secondary"; // FIX: Use existing variants
      case "awaiting_otp": return "secondary"; // FIX: Use existing variants
      case "awaiting_bill": return "secondary"; // FIX: Use existing variants
      case "awaiting_payment": return "secondary"; // FIX: Use existing variants
      case "completed": return "default"; // FIX: Use existing variants (like success)
      case "declined":
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Bookings</CardTitle>
        <CardDescription>
          View and manage your upcoming bookings for '
          {providerProfile.category.name}'.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingBookings ? (
          <div className="flex justify-center py-10">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading
            bookings...
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Bookings Yet</h3>
            <p className="text-muted-foreground mt-2">
              When a customer books your service, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Booking ID: ...{booking.id.slice(-6)}</span>
                     <Badge variant={getBadgeColor(booking.status || 'pending')}>
                      {booking.status?.replace("_", " ").toUpperCase()}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Customer: {booking.user.username} | Phone:{" "}
                    {booking.user.phone}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    <strong>Address:</strong> {booking.userAddress}
                  </p>
                  <p>
                    <strong>Scheduled:</strong>{" "}
                    {booking.scheduledAt
                      ? new Date(booking.scheduledAt).toLocaleString("en-IN")
                      : "ASAP"}
                  </p>
                  {booking.notes && (
                    <p>
                      <strong>Notes:</strong> {booking.notes}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <ProviderBookingActions
                    booking={booking}
                    onAccept={() => handleAccept(booking)}
                    onDecline={() => handleDecline(booking)}
                    onStartJob={() => handleStartJob(booking)}
                    onJobDone={() => handleJobDone(booking)}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- NAYA HELPER COMPONENT: BOOKING ACTIONS ---
const ProviderBookingActions: React.FC<{
  booking: FullBooking;
  onAccept: () => void;
  onDecline: () => void;
  onStartJob: () => void;
  onJobDone: () => void;
}> = ({ booking, onAccept, onDecline, onStartJob, onJobDone }) => {
  const [otp, setOtp] = useState("");
  const [isBillOpen, setIsBillOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const verifyOtpMutation = useMutation({
    mutationFn: (otp: string) =>
      api.post(`/api/bookings/${booking.id}/verify-otp`, { otp }),
    onSuccess: () => {
      toast({
        title: "OTP Verified!",
        description: "Please create the final bill for the customer.",
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
      setIsBillOpen(true); // OTP Sahi hone par bill modal kholo
    },
    onError: (error: any) => {
      toast({
        title: "Invalid OTP",
        description: error.response?.data?.message || "That OTP is incorrect.",
        variant: "destructive",
      });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: BillFormData) =>
      api.post(`/api/bookings/${booking.id}/create-invoice`, data),
    onSuccess: () => {
      toast({
        title: "Bill Created!",
        description: "Waiting for customer to complete payment.",
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
      setIsBillOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Billing Error",
        description:
          error.response?.data?.message || "Failed to create bill.",
        variant: "destructive",
      });
    },
  });

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      verifyOtpMutation.mutate(otp);
    }
  };

  const handleBillSubmit = (data: BillFormData) => {
    createInvoiceMutation.mutate(data);
  };

  if (booking.status === "pending") {
    return (
      <>
        <Button variant="destructive" onClick={onDecline}>
          <X className="mr-2 h-4 w-4" /> Decline
        </Button>
        <Button onClick={onAccept} className="bg-green-600 hover:bg-green-700">
          <Check className="mr-2 h-4 w-4" /> Accept
        </Button>
      </>
    );
  }

  if (booking.status === "accepted") {
    return (
      <Button onClick={onStartJob} className="bg-blue-600 hover:bg-blue-700">
        <Play className="mr-2 h-4 w-4" /> Start Job
      </Button>
    );
  }

  if (booking.status === "started") {
    return (
      <Button onClick={onJobDone} className="bg-green-600 hover:bg-green-700">
        <ClipboardCheck className="mr-2 h-4 w-4" /> Job Done (Get OTP)
      </Button>
    );
  }

  if (booking.status === "awaiting_otp") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700">
            <ClipboardCheck className="mr-2 h-4 w-4" /> Verify OTP
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Service OTP</DialogTitle>
            <DialogDescription>
              Please ask the customer ({booking.user.username}) for the 6-digit
              OTP sent to their phone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <DialogFooter>
            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || verifyOtpMutation.isPending}
            >
              {verifyOtpMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (booking.status === "awaiting_bill") {
    return (
      <>
        <Button
          onClick={() => setIsBillOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <FileText className="mr-2 h-4 w-4" /> Create Final Bill
        </Button>
        <CreateBillDialog
          isOpen={isBillOpen}
          onOpenChange={setIsBillOpen}
          onSubmit={handleBillSubmit}
          isLoading={createInvoiceMutation.isPending}
        />
      </>
    );
  }

  if (booking.status === "awaiting_payment") {
    return (
       <Badge variant="secondary" className="p-2"> {/* FIX: Use existing variant */}
         <DollarSign className="mr-2 h-4 w-4" />
         Waiting for Customer Payment
       </Badge>
    )
  }

  if (booking.status === "completed") {
    return (
       <Badge variant="default" className="p-2 bg-green-600"> {/* FIX: Use existing variant */}
         <Check className="mr-2 h-4 w-4" />
         Job Completed
       </Badge>
    )
  }

  return null; // Declined ya cancelled state ke liye
};

// --- NAYA HELPER COMPONENT: CREATE BILL DIALOG ---
const CreateBillDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BillFormData) => void;
  isLoading: boolean;
}> = ({ isOpen, onOpenChange, onSubmit, isLoading }) => {
  const form = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      spareParts: [],
      serviceCharge: 0,
      notes: "",
    },
  });

  // FIX: useFieldArray import ko upar add kiya
  const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "spareParts"
  });

  const watchSpareParts = form.watch("spareParts");
  const watchServiceCharge = form.watch("serviceCharge");

  const total =
    (watchSpareParts?.reduce((acc, part) => acc + (Number(part.price) || 0), 0) || 0) + // FIX: Ensure price is number
    (Number(watchServiceCharge) || 0); // FIX: Ensure charge is number

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Final Bill</DialogTitle>
          <DialogDescription>
            Enter service charges and any spare parts used for this job.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-h-[60vh] overflow-y-auto p-1"
          >
            <FormField
              control={form.control}
              name="serviceCharge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Charge (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 350" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Spare Parts Used (Optional)</Label>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <FormField
                      control={form.control}
                      name={`spareParts.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Part Name" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`spareParts.${index}.price`}
                      render={({ field }) => (
                        <FormItem className="w-[120px]">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Price (₹)"
                              {...field}
                            />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ name: "", price: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Part
              </Button>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Replaced main switch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-xl font-bold text-right pt-4">
              Total Bill: ₹{total.toFixed(2)}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Bill & Request Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
// --- HELPER COMPONENTS KHATAM ---

// --- COMPONENT 3: SPECIALIZATIONS MANAGER (Waise ka waisa) ---
const SpecializationsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    () => providerProfile.specializations || []
  );

  const { data: allProblems, isLoading: isLoadingProblems } = useQuery<
    ServiceProblem[]
  >({
    queryKey: ["serviceProblems", providerProfile.category.slug],
    queryFn: async () => {
      const res = await api.get(
        `/api/service-problems?category=${providerProfile.category.slug}`
      );
      return res.data;
    },
    enabled: !!providerProfile.category.slug,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (specializations: string[]) =>
      api.patch("/api/provider/profile", { specializations }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your specializations have been updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["providerProfile", providerProfile.userId],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update.",
        variant: "destructive",
      });
    },
  });

  const handleCheckedChange = (
    checked: boolean | "indeterminate",
    specName: string
  ) => {
    setSelectedSpecs((prev) =>
      checked ? [...prev, specName] : prev.filter((s) => s !== specName)
    );
  };

  const handleSave = () => {
    updateProfileMutation.mutate(selectedSpecs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Specializations</CardTitle>
        <CardDescription>
          Select the devices and services you are an expert in. This will be
          shown to customers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingProblems ? (
          <div className="flex justify-center py-10">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading options...
          </div>
        ) : !allProblems || allProblems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Service Problems Found</h3>
            <p className="text-muted-foreground mt-2">
              (Admin needs to add problems for '{providerProfile.category.name}'
              category)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center space-x-2 p-3 border rounded-md"
                >
                  <Checkbox
                    id={problem.id}
                    checked={selectedSpecs.includes(problem.name)}
                    onCheckedChange={(checked) =>
                      handleCheckedChange(checked, problem.name)
                    }
                  />
                  <Label
                    htmlFor={problem.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {problem.name}
                  </Label>
                </div>
              ))}
            </div>
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Specializations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- COMPONENT 4: PROFILE SETTINGS (Waise ka waisa) ---
const ProfileSettingsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
  userId: string;
}> = ({ providerProfile, userId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);

  // Profile Pic Upload Mutation
  const profilePicMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("image", file); // 'image' field backend route se match karta hai
      return api.patch("/api/provider/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Profile picture updated." });
      queryClient.invalidateQueries({ queryKey: ["providerProfile", userId] });
      setProfileFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload.",
        variant: "destructive",
      });
    },
  });

  // Gallery Images Upload Mutation
  const galleryUploadMutation = useMutation({
    mutationFn: (files: FileList) => {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]); // 'images' field backend route se match karta hai
      }
      return api.post("/api/provider/profile/gallery", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Gallery images uploaded." });
      queryClient.invalidateQueries({ queryKey: ["providerProfile", userId] });
      setGalleryFiles(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload.",
        variant: "destructive",
      });
    },
  });

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProfileFile(e.target.files[0]);
    }
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGalleryFiles(e.target.files);
    }
  };

  const handleProfileUpload = () => {
    if (profileFile) {
      profilePicMutation.mutate(profileFile);
    }
  };

  const handleGalleryUpload = () => {
    if (galleryFiles) {
      galleryUploadMutation.mutate(galleryFiles);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card 1: Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a clear photo of yourself or your logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-muted mx-auto flex items-center justify-center">
            {providerProfile.profileImageUrl ? (
              <img
                src={providerProfile.profileImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleProfileFileChange}
            disabled={profilePicMutation.isPending}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleProfileUpload}
            disabled={!profileFile || profilePicMutation.isPending}
          >
            {profilePicMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Picture
          </Button>
        </CardFooter>
      </Card>

      {/* Card 2: Gallery Images */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
          <CardDescription>
            Showcase your work (e.g., past projects, food items).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 min-h-[80px]">
            {providerProfile.galleryImages?.map((url, index) => (
              <div
                key={index}
                className="relative aspect-square bg-muted rounded-md overflow-hidden"
              >
                <img
                  src={url}
                  alt={`Gallery item ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryFileChange}
            disabled={galleryUploadMutation.isPending}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGalleryUpload}
            disabled={!galleryFiles || galleryUploadMutation.isPending}
          >
            {galleryUploadMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Gallery
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
// --- COMPONENT KHATAM ---

// --- Category Lists (Waise ka waisa) ---
const menuBasedCategories = [
  "beauty",
  "cake-shop",
  "street-food",
  "restaurants",
  "grocery",
];
const bookingBasedCategories = ["electrician", "plumber"];

// --- MAIN DASHBOARD COMPONENT (TABS UPDATE KIYE GAYE) ---
const ProviderDashboard: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth(); // FIX: Auth loading state

  const {
    data: providerProfile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
  } = useQuery<ProviderProfileWithCategory>({
    queryKey: ["providerProfile", user?.id],
    queryFn: async () => {
      const res = await api.get("/api/provider/profile");
      return res.data;
    },
    enabled: !!user?.id,
    retry: false,
  });

  // --- LOADING/ERROR STATES FIX KIYE GAYE ---
  if (isAuthLoading || (!!user && isLoadingProfile)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading your
        profile...
      </div>
    );
  }

  // Auth check
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Role check
  if (user.role !== "provider") {
     return (
      <div className="container mx-auto py-10 text-center text-muted-foreground">
         <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground mt-4">Access Denied</h2>
        <p className="mt-2">You must be a provider to view this page.</p>
        <Button asChild className="mt-4">
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  // Profile check
  if (isErrorProfile || !providerProfile) {
    return (
      <div className="container mx-auto py-10 text-center text-muted-foreground">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground mt-4">
          Provider Profile Not Found
        </h2>
        <p className="mt-2">
          It seems you haven't completed your provider onboarding yet.
        </p>
        <Button asChild className="mt-4">
          <Link to="/provider-onboarding">Complete Your Profile</Link>
        </Button>
      </div>
    );
  }
  // --- LOADING/ERROR STATES KHATAM ---

  const providerType = () => {
    // Safety check
    if (!providerProfile || !providerProfile.category) {
        return 'unknown';
    }
    const slug = providerProfile.category.slug;
    if (menuBasedCategories.includes(slug)) return "menu";
    if (bookingBasedCategories.includes(slug)) return "booking";
    return "unknown";
  };

  const type = providerType();

  const getTabs = () => {
    const tabs = [
      { value: "bookings", label: "Bookings" },
      { value: "profile", label: "Profile Settings" },
    ];
    if (type === "menu") {
      tabs.unshift({ value: "menu", label: "Menu / Services" });
    }
    if (type === "booking") {
      tabs.push({ value: "specializations", label: "My Specializations" });
    }
    return tabs;
  };

  const tabs = getTabs();
  const defaultTab = type === "menu" ? "menu" : "bookings";

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {providerProfile.businessName}!
      </h1>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Saare TabsContent neeche hain */}
        <TabsContent value="menu" className="mt-6">
          {type === "menu" ? (
            <MenuItemsManager providerProfile={providerProfile} />
          ) : null}
        </TabsContent>
        <TabsContent value="bookings" className="mt-6">
          <BookingsManager providerProfile={providerProfile} />
        </TabsContent>
        <TabsContent value="specializations" className="mt-6">
          {type === "booking" ? (
            <SpecializationsManager providerProfile={providerProfile} />
          ) : null}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettingsManager
            providerProfile={providerProfile}
            userId={user!.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderDashboard;