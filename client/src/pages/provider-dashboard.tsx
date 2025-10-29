// client/src/pages/provider-dashboard.tsx (THE ULTIMATE FINAL FIX)

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ServiceProvider, ServiceCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import MenuItemForm from "@/components/forms/MenuItemForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type ProviderProfileWithCategory = ServiceProvider & {
  category: ServiceCategory;
};

const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: providerProfile, isLoading: isLoadingProfile, isError: isErrorProfile } = useQuery<ProviderProfileWithCategory>({
    queryKey: ['providerProfile', user?.id],
    queryFn: async () => {
      const res = await api.get('/api/provider/profile');
      return res.data;
    },
    enabled: !!user?.id,
    retry: false,
  });

  const providerCategorySlug = providerProfile?.category?.slug;

  const { data: menuItems, isLoading: isLoadingMenuItems, refetch: refetchMenuItems } = useQuery<any[]>({
    queryKey: ['providerMenuItems', providerProfile?.id],
    queryFn: async () => {
      if (!providerProfile?.id) return [];
      const res = await api.get(`/api/provider/menu`);
      return res.data;
    },
    enabled: !!providerProfile?.id,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const deleteMenuItemMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/api/menu-items/${itemId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Menu item deleted." });
      queryClient.invalidateQueries({ queryKey: ['providerMenuItems', providerProfile?.id] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to delete.", variant: "destructive" });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteMenuItemMutation.mutate(itemId);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    refetchMenuItems();
  };

  if (isLoadingProfile) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading your profile...</div>;
  }

  if (isErrorProfile || !providerProfile) {
    return (
      <div className="text-center mt-20 text-muted-foreground">
        <h2 className="text-2xl font-semibold text-foreground">Provider Profile Not Found</h2>
        <p className="mt-2">It seems you haven't completed your provider onboarding yet.</p>
        <Button asChild className="mt-4">
          <Link to="/provider-onboarding">Complete Your Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Provider Dashboard</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)} disabled={!providerCategorySlug}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
              <DialogDescription>
                Fill in the details for your service or product below.
              </DialogDescription>
            </DialogHeader>
            {providerCategorySlug && providerProfile ? (
              <MenuItemForm
                providerId={providerProfile.id}
                categorySlug={providerCategorySlug}
                initialData={editingItem}
                onSuccess={handleFormSuccess}
              />
            ) : (
                <div className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    <p className="mt-2">Loading form...</p>
                </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <h2 className="text-2xl font-semibold mb-4">My Menu: <span className="capitalize">{providerProfile?.category?.name || '...'}</span></h2>

      {isLoadingMenuItems ? (
        <div className="flex justify-center mt-10"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading menu...</div>
      ) : (
        <>
          {/* 💥 YEH HAI ASLI FIX 💥 */}
          {/* Hum `Array.isArray()` se check kar rahe hain ki `menuItems` sach me ek array hai ya nahi. */}
          {Array.isArray(menuItems) && menuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div key={item.id} className="border p-4 rounded-lg shadow-sm bg-card">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover rounded-md mb-3" />}
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground min-h-[40px]">{item.description}</p>
                  <p className="text-lg font-bold my-2">₹{item.price}</p>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)} disabled={deleteMenuItemMutation.isPending}>
                      {deleteMenuItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">Your Menu is Empty</h3>
                <p className="text-muted-foreground mt-2">Click "Add New Item" to start building your menu.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProviderDashboard;