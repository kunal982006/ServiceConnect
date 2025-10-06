import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, Clock, Scissors, Sparkles, Paintbrush, HandMetal, Info } from "lucide-react";

const serviceCategories = [
  { name: "All Services", active: true },
  { name: "Hair" },
  { name: "Facial" },
  { name: "Makeup" },
  { name: "Spa" },
  { name: "Bridal" }
];

// Mock beauty parlor data
const mockBeautyParlors = [
  {
    id: "1",
    name: "Glamour Beauty Lounge",
    rating: 4.7,
    reviews: 234,
    address: "Sector 22, Near Metro Station",
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    services: [
      {
        name: "Hair Cut & Styling",
        duration: 45,
        price: 599,
        icon: Scissors
      },
      {
        name: "Facial Treatment", 
        duration: 60,
        price: 899,
        icon: Sparkles
      },
      {
        name: "Bridal Makeup",
        duration: 120,
        price: 4999,
        icon: Paintbrush
      },
      {
        name: "Manicure & Pedicure",
        duration: 75,
        price: 799,
        icon: HandMetal
      }
    ]
  }
];

export default function Beauty() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All Services");

  const { data: beautyParlors, isLoading } = useQuery({
    queryKey: ["/api/service-providers", { category: "beauty" }],
    // Mock data for now since we don't have real providers
    queryFn: () => Promise.resolve(mockBeautyParlors)
  });

  const handleBookService = (parlorId: string, serviceName: string) => {
    // Handle booking logic
    console.log(`Booking ${serviceName} at ${parlorId}`);
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
          <h2 className="text-3xl font-bold mb-2">Beauty Parlor Services</h2>
          <p className="text-muted-foreground">
            Browse professional beauty services with transparent pricing
          </p>
        </div>

        {/* Service Categories Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {serviceCategories.map((category) => (
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

        {/* Beauty Parlor Cards */}
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
          ) : beautyParlors?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No beauty parlors found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your location or check back later for available services.
                </p>
              </CardContent>
            </Card>
          ) : (
            beautyParlors?.map((parlor: any) => (
              <Card key={parlor.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      {/* Parlor Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={parlor.image} 
                          alt={parlor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{parlor.name}</h3>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < Math.floor(parlor.rating) 
                                    ? "text-yellow-500 fill-current" 
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{parlor.rating}</span>
                          <span className="text-sm text-muted-foreground">({parlor.reviews})</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{parlor.address}</span>
                          <span>•</span>
                          <span>{parlor.distance} away</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>

                  {/* Service List with Prices */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h4 className="font-semibold mb-3">Available Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {parlor.services.map((service: any, index: number) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition cursor-pointer border border-transparent hover:border-border"
                          onClick={() => handleBookService(parlor.id, service.name)}
                          data-testid={`service-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <div className="flex items-center space-x-3">
                            <service.icon className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {service.duration} mins
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{service.price}</p>
                            <p className="text-xs text-muted-foreground">+10% fee</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>Platform fee of 10% will be added to all services</span>
                      </div>
                      <Button 
                        className="bg-primary hover:bg-primary/90"
                        data-testid={`button-book-${parlor.id}`}
                      >
                        Book Now
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
