import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: string;
    originalPrice?: string;
    weight: string;
    imageUrl?: string;
    inStock: boolean;
  };
  onAddToCart: () => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <div className="aspect-square relative overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}
        {hasDiscount && (
          <Badge className="absolute top-2 left-2 bg-destructive">
            {Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)}% OFF
          </Badge>
        )}
      </div>
      <CardContent className="p-3">
        <h4 className="font-medium mb-1 line-clamp-2" title={product.name}>
          {product.name}
        </h4>
        <p className="text-xs text-muted-foreground mb-2">{product.weight}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold">₹{product.price}</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through ml-1">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
          <Button
            size="icon"
            className="h-8 w-8 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={onAddToCart}
            disabled={!product.inStock}
            data-testid={`button-add-${product.id}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {!product.inStock && (
          <Badge variant="outline" className="mt-2 text-xs">
            Out of Stock
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
