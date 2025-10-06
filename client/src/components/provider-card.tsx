import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MapPin, 
  Clock, 
  Briefcase, 
  Phone, 
  Calendar,
  CheckCircle
} from "lucide-react";

interface ProviderCardProps {
  provider: {
    id: string;
    businessName: string;
    rating: string;
    reviewCount: number;
    experience: number;
    address: string;
    isVerified: boolean;
    isAvailable: boolean;
    specializations?: string[];
    user: {
      username: string;
      email: string;
    };
  };
  onCallRequest: () => void;
  onSchedule: () => void;
}

export default function ProviderCard({ 
  provider, 
  onCallRequest, 
  onSchedule 
}: ProviderCardProps) {
  const rating = parseFloat(provider.rating);
  const distance = "2.3 km"; // Mock distance - in real app this would be calculated

  return (
    <Card className="provider-card border border-border hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-4 flex-1">
            {/* Provider Image */}
            <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                {provider.user.username.charAt(0).toUpperCase()}
              </div>
            </div>
            
            {/* Provider Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-lg">{provider.businessName}</h4>
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="flex items-center rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(rating) 
                              ? "fill-current" 
                              : i === Math.floor(rating) && rating % 1 >= 0.5
                              ? "fill-current opacity-50"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({provider.reviewCount} reviews)
                    </span>
                  </div>
                </div>
                {provider.isVerified && (
                  <Badge variant="secondary" className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{provider.experience} years exp.</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{distance} away</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {provider.isAvailable ? "Available Now" : "Busy"}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-sm text-muted-foreground">{provider.address}</p>
              </div>

              {/* Specializations */}
              {provider.specializations && provider.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {provider.specializations.map((spec, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex md:flex-col gap-2 md:w-auto">
            <Button 
              className="flex-1 md:flex-none bg-primary hover:bg-primary/90 flex items-center justify-center space-x-2"
              onClick={onCallRequest}
              data-testid="button-call-provider"
              disabled={!provider.isAvailable}
            >
              <Phone className="h-4 w-4" />
              <span>Call Now</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none"
              onClick={onSchedule}
              data-testid="button-schedule-provider"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
