import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, Truck, Minus, Plus, Trash2, Loader2 } from "lucide-react";

// --- NAYE IMPORTS ---
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api"; // API client
import { useAuth } from "@/hooks/use-auth"; // User details ke liye
// --- IMPORTS KHATAM ---

// Delivery Address ke liye Schema
const checkoutSchema = z.object({
  deliveryAddress: z.string().min(10, {
    message: "Please enter a valid delivery address (min. 10 characters).",
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Yeh function Razorpay script load hone ka wait karega
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-checkout-js')) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};


export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth(); // Logged in user ko get karo
  const { items, removeItem, increaseQuantity, decreaseQuantity, getTotalPrice, clearCart } = useCartStore();
  const { toast } = useToast();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Fees calculation
  const subtotal = getTotalPrice();
  const platformFee = subtotal * 0.01; // 1%
  const deliveryFee = 24.50; // Mock delivery fee
  const total = subtotal + platformFee + deliveryFee;

  // Form setup
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryAddress: "",
    },
  });

  useEffect(() => {
    if (items.length === 0 && !isPlacingOrder) {
      setLocation('/street-food'); // Ya grocery, jahan se user aaya
    }
  }, [items.length, setLocation, isPlacingOrder]);


  // --- YEH FUNCTION POORA NAYA HAI ---
  const onSubmit = async (values: CheckoutFormValues) => {
    setIsPlacingOrder(true);

    // 1. Razorpay script load karo
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast({ title: "Error", description: "Payment gateway failed to load. Please try again.", variant: "destructive" });
      setIsPlacingOrder(false);
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "You must be logged in to place an order.", variant: "destructive" });
      setIsPlacingOrder(false);
      return;
    }

    try {
      // 2. Pehle apne database mein order create karo (status: 'pending')
      const orderPayload = {
        items: items.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
        subtotal,
        platformFee,
        deliveryFee,
        total,
        deliveryAddress: values.deliveryAddress,
      };

      const dbOrderResponse = await api.post("/api/grocery-orders", orderPayload);
      const dbOrder = await dbOrderResponse.data;
      const databaseOrderId = dbOrder.id;

      // 3. Ab Razorpay ka order create karo
      const rzpOrderResponse = await api.post("/api/payment/create-order", {
        orderId: databaseOrderId,
      });
      const rzpOrder = await rzpOrderResponse.data;

      // 4. Razorpay Popup Options
      const options = {
        key: rzpOrder.razorpayKeyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "Shirur Express",
        description: `Order ID: ${databaseOrderId}`,
        order_id: rzpOrder.razorpayOrderId,

        // Yeh function tab call hoga jab payment complete hogi
        handler: async (response: any) => {
          try {
            // 5. Payment ko server par verify karo
            const verificationResponse = await api.post("/api/payment/verify-signature", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              database_order_id: databaseOrderId, 
            });

            if (verificationResponse.data.status === 'success') {
              // 6. Success!
              toast({
                title: "✅ Order Placed!",
                description: "Your payment was successful.",
              });
              clearCart();
              setLocation("/order-success"); // Success page par bhejo
            } else {
              throw new Error("Payment verification failed");
            }

          } catch (verifyError) {
            toast({ title: "Payment Failed", description: "Signature verification failed. Please contact support.", variant: "destructive" });
            setIsPlacingOrder(false);
          }
        },
        prefill: {
          name: user.username,
          email: user.email,
          contact: user.phone,
        },
        notes: {
          address: values.deliveryAddress,
          databaseOrderId: databaseOrderId,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            toast({ title: "Payment Cancelled", description: "Your order was not placed.", variant: "destructive" });
            setIsPlacingOrder(false);
          },
        },
      };

      // 7. Razorpay Popup Kholo
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      toast({
        title: "Order Failed",
        description: error.response?.data?.message || "Could not create order. Please try again.",
        variant: "destructive",
      });
      setIsPlacingOrder(false);
    }
  };


  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/street-food")} // TODO: Isko dynamic bana sakte ho
          data-testid="button-back"
          disabled={isPlacingOrder}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Shopping</span>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* --- YEH POORA FORM ME WRAP KIYA HAI --- */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Left Column: Address + Cart */}
              <div>
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Truck className="h-5 w-5" />
                      <span>Delivery Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* --- YEH NAYA ADDRESS FORM FIELD HAI --- */}
                    <FormField
                      control={form.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your full address, including house number, street, and landmark..."
                              className="resize-none"
                              rows={4}
                              {...field}
                              data-testid="input-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShoppingCart className="h-5 w-5" />
                      <span>Your Cart Items</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} / item</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center space-x-2">
                            <Button
                              variant="outline" size="icon" className="h-7 w-7"
                              onClick={() => decreaseQuantity(item.id)}
                              disabled={item.quantity <= 1 || isPlacingOrder}
                              aria-label="Decrease quantity" type="button"
                            > <Minus className="h-4 w-4" /> </Button>

                            <Badge variant="secondary" className="h-7 w-7 flex items-center justify-center">
                                {item.quantity}
                            </Badge>

                            <Button
                              variant="outline" size="icon" className="h-7 w-7"
                              onClick={() => increaseQuantity(item.id)}
                              aria-label="Increase quantity" type="button"
                              disabled={isPlacingOrder}
                            > <Plus className="h-4 w-4" /> </Button>

                            <Button
                              variant="ghost" size="icon"
                              onClick={() => removeItem(item.id)}
                              aria-label="Remove item" type="button"
                              className="ml-2 text-destructive"
                              disabled={isPlacingOrder}
                            > <Trash2 className="h-5 w-5" /> </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Price Summary & Pay Button */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Price Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee (1%)</span>
                      <span>₹{platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Delivery Fee
                      </span>
                      <span>₹{deliveryFee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit" // <-- YEH CHANGE HUA
                      className="w-full"
                      disabled={items.length === 0 || isPlacingOrder}
                      data-testid="button-place-order"
                    >
                      {isPlacingOrder ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        `Pay Securely (₹${total.toFixed(2)})`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}