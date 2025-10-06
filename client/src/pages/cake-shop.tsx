import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Star, MapPin, Clock, Award, Cake } from "lucide-react";

const cakeCategories = [
  { name: "All Cakes", active: true },
  { name: "Birthday" },
  { name: "Anniversary" },
  { name: "Wedding" },
  { name: "Custom" }
];

// Mock cake shop data
const mockCakeShops = [
  {
    id: "1",
    name: "Sweet Delights Bakery",
    rating: 4.9,
    reviews: 456,
    address: "Mall Road, City Center",
    distance: "0.8 km",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    cakes: [
      {
        name: "Chocolate Truffle",
        image: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        weightOptions: [
          { weight: "500g", price: 499 },
          { weight: "1kg", price: 899 },
          { weight: "2kg", price: 1699 }
        ]
      },
      {
        name: "Strawberry Delight",
        image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        weightOptions: [
          { weight: "500g", price: 549 },
          { weight: "1kg", price: 999 },
          { weight: "2kg", price: 1899 }
        ]
      },
      {
        name: "Red Velvet",
        image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        weightOptions: [
          { weight: "500g", price: 599 },
          { weight: "1kg", price: 1099 },
          { weight: "2kg", price: 1999 }
        ]
      },
      {
        name: "Custom Design",
        image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        isCustom: true,
        startingPrice: 2499
      }
    ]
  }
];

export default function CakeShop() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All Cakes");

  const { data: cakeShops, isLoading } = useQuery({
    queryKey: ["/api/service-providers", { category: "cake" }],
    // Mock data for now
    queryFn: () => Promise.resolve(mockCakeShops)
  });

  const handleOrderCake = (shopId: string, cakeName: string) => {
    // Handle cake ordering logic
    console.log(`Ordering ${cakeName} from ${shopId}`);
  };

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Services</span>
        </Button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Cake Shops</h2>
          <p className="text-muted-foreground">
            Order delicious custom cakes for every occasion
          </p>
        </div>

        {/* Cake Categories */}
        <div className="mb-6 flex flex-wrap gap-2">
          {cakeCategories.map((category) => (
            <Button
              key={category.name}
              variant={activeCategory === category.name ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.name)}
              data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Cake Shop Cards */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="w-20 h-20 bg-muted rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cakeShops?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Cake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cake shops found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your location or check back later for available shops.
                </p>
              </CardContent>
            </Card>
          ) : (
            cakeShops?.map((shop: any) => (
              <Card key={shop.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={shop.image} 
                          alt={shop.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{shop.name}</h3>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < Math.floor(shop.rating) 
                                    ? "text-yellow-500 fill-current" 
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{shop.rating}</span>
                          <span className="text-sm text-muted-foreground">({shop.reviews})</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{shop.address}</span>
                          <span>•</span>
                          <span>{shop.distance} away</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center">
                      <Award className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>

                  {/* Cake Gallery */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h4 className="font-semibold mb-3">Featured Cakes</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {shop.cakes.map((cake: any, index: number) => (
                        <div 
                          key={index}
                          className="group cursor-pointer"
                          onClick={() => handleOrderCake(shop.id, cake.name)}
                          data-testid={`cake-${cake.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden mb-2 relative">
                            <img 
                              src={cake.image} 
                              alt={cake.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition"></div>
                          </div>
                          <h5 className="font-medium text-sm mb-1">{cake.name}</h5>
                          <div className="flex items-center justify-between">
                            {cake.isCustom ? (
                              <span className="text-xs text-muted-foreground">
                                Starting ₹{cake.startingPrice}
                              </span>
                            ) : (
                              <Select>
                                <SelectTrigger className="text-xs h-8">
                                  <SelectValue placeholder="Select weight" />
                                </SelectTrigger>
                                <SelectContent>
                                  {cake.weightOptions.map((option: any, optionIndex: number) => (
                                    <SelectItem key={optionIndex} value={option.weight}>
                                      {option.weight} - ₹{option.price}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Order 24 hours in advance for custom cakes
                      </p>
                      <Button 
                        className="bg-primary hover:bg-primary/90"
                        data-testid={`button-view-all-${shop.id}`}
                      >
                        View All Cakes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
