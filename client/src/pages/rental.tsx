import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Home, 
  MapPin, 
  Square, 
  Bed, 
  Bath, 
  Sofa, 
  Heart,
  Phone,
  ImageIcon,
  User
} from "lucide-react";

export default function Rental() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    propertyType: "",
    minRent: "",
    maxRent: "",
    furnishing: "",
    locality: ""
  });

  const { data: properties, isLoading } = useQuery({
    queryKey: ["/api/rental-properties", filters],
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleContactOwner = (propertyId: string) => {
    // In real app, this would initiate contact with owner
    console.log(`Contacting owner for property ${propertyId}`);
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
          <h2 className="text-3xl font-bold mb-2">No Brokerage Rentals</h2>
          <p className="text-muted-foreground">
            Find rental properties directly from owners - Zero brokerage
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2">Property Type</Label>
                <Select 
                  value={filters.propertyType} 
                  onValueChange={(value) => handleFilterChange("propertyType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="1BHK">1 BHK</SelectItem>
                    <SelectItem value="2BHK">2 BHK</SelectItem>
                    <SelectItem value="3BHK">3 BHK</SelectItem>
                    <SelectItem value="4+BHK">4+ BHK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2">Budget Range</Label>
                <Select 
                  value={filters.maxRent} 
                  onValueChange={(value) => handleFilterChange("maxRent", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Budget</SelectItem>
                    <SelectItem value="10000">₹5k - ₹10k</SelectItem>
                    <SelectItem value="20000">₹10k - ₹20k</SelectItem>
                    <SelectItem value="30000">₹20k - ₹30k</SelectItem>
                    <SelectItem value="999999">₹30k+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2">Furnishing</Label>
                <Select 
                  value={filters.furnishing} 
                  onValueChange={(value) => handleFilterChange("furnishing", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="Furnished">Furnished</SelectItem>
                    <SelectItem value="Semi-Furnished">Semi-Furnished</SelectItem>
                    <SelectItem value="Unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2">Area/Locality</Label>
                <Input
                  placeholder="Enter locality"
                  value={filters.locality}
                  onChange={(e) => handleFilterChange("locality", e.target.value)}
                  data-testid="input-locality"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Listings */}
        <div className="space-y-6">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="md:flex">
                  <div className="md:w-2/5 h-64 bg-muted"></div>
                  <div className="md:w-3/5 p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : properties?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No properties found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later for new listings.
                </p>
              </CardContent>
            </Card>
          ) : (
            properties?.map((property: any) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <div className="md:flex">
                  {/* Property Images */}
                  <div className="md:w-2/5 relative">
                    <div className="aspect-video md:aspect-square">
                      {property.images && property.images.length > 0 ? (
                        <img 
                          src={property.images[0]} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-secondary text-secondary-foreground">
                        Owner
                      </Badge>
                      <Badge variant="outline" className="bg-card">
                        {property.propertyType}
                      </Badge>
                    </div>
                    <Button 
                      size="icon"
                      variant="ghost"
                      className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm hover:bg-card"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Property Details */}
                  <div className="md:w-3/5 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{property.title}</h3>
                        <p className="text-muted-foreground flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {property.locality || property.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ₹{parseInt(property.rent).toLocaleString()}/mo
                        </p>
                        <p className="text-sm text-muted-foreground">No Brokerage</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Square className="h-4 w-4 text-muted-foreground" />
                        <span>{property.area} sqft</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span>{property.bedrooms} Bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                        <span>{property.bathrooms} Bathroom{property.bathrooms !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Sofa className="h-4 w-4 text-muted-foreground" />
                        <span>{property.furnishing}</span>
                      </div>
                    </div>

                    {/* Amenities */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="border-t border-border pt-4 mb-4">
                        <h4 className="font-medium mb-2">Amenities</h4>
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.slice(0, 5).map((amenity: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {property.amenities.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{property.amenities.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{property.owner?.username || 'Property Owner'}</p>
                          <p className="text-sm text-muted-foreground">Property Owner</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          View Photos
                        </Button>
                        <Button 
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => handleContactOwner(property.id)}
                          data-testid={`button-contact-${property.id}`}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Contact Owner
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
