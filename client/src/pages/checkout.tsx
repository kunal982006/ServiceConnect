import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
// --- BADLAV: useCart ki jagah useCartStore import kiya ---
import { useCartStore } from "@/hooks/use-cart-store";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// --- NAYE ICONS IMPORT KIYE HAIN ---
import { ArrowLeft, ShoppingCart, Truck, CreditCard, Minus, Plus, Trash2 } from "lucide-react";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy');

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  // --- BADLAV: useCart ki jagah useCartStore se items aur clearCart liya ---
  const { items, clearCart } = useCartStore();
  const [, setLocation] = useLocation();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/order-success',
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your order! Your groceries will be delivered soon.",
      });
      clearCart(); // Cart ko clear kiya payment ke baad
      setLocation('/');
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentElement />
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
        disabled={!stripe || !elements || processing || items.length === 0}
        data-testid="button-place-order"
      >
        {processing ? "Processing..." : "Place Order"}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  // --- BADLAV: useCart ki jagah useCartStore se items, removeItem, increaseQuantity, decreaseQuantity liya ---
  const { items, removeItem, increaseQuantity, decreaseQuantity, getTotalPrice } = useCartStore();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  // --- BADLAV: subtotal calculation ab getTotalPrice() function se aayega ---
  const subtotal = getTotalPrice();
  const platformFee = subtotal * 0.01; // 1% platform fee
  const deliveryFee = 24.50; // Mock delivery fee
  const total = subtotal + platformFee + deliveryFee;

  useEffect(() => {
    if (items.length === 0) {
      setLocation('/street-food'); // Cart empty hone par street-food page par redirect
      return;
    }

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount: Math.round(total * 100), // Stripe expects amount in cents/paise
          currency: 'inr'
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        // Optionally show a toast error
        // toast({ title: "Error", description: "Could not initialize payment.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [items, total, setLocation]);

  if (loading || !clientSecret) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/street-food")} // --- BADLAV: Back to /street-food ---
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Street Food</span>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Your Cart Items</span> {/* --- BADLAV: Title changed to be more specific --- */}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items List */}
                <div className="space-y-3">
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
                          {/* item.weight removed as it's not in our cart item structure */}
                          {/* <p className="text-sm text-muted-foreground">{item.weight}</p> */}
                          <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} / item</p> {/* Individual item price */}
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-2"> {/* --- BADLAV: Quantity controls added --- */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => decreaseQuantity(item.id)}
                          disabled={item.quantity <= 1} // 1 se kam nahi hoga
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Badge variant="secondary" className="h-7 w-7 flex items-center justify-center">
                            {item.quantity}
                        </Badge>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => increaseQuantity(item.id)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                          className="ml-2 text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (1%)</span>
                    <span>₹{platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      Delivery Fee
                    </span>
                    <span>₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
}