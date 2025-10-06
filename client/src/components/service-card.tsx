import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  service: {
    name: string;
    slug: string;
    icon: LucideIcon;
    description: string;
    badge: string;
    color: string;
  };
}

const colorClasses = {
  accent: "bg-accent/10 text-accent",
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  destructive: "bg-destructive/10 text-destructive"
};

export default function ServiceCard({ service }: ServiceCardProps) {
  const { name, slug, icon: Icon, description, badge, color } = service;
  const iconColorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.primary;

  return (
    <Link href={`/${slug}`}>
      <Card className="service-card cursor-pointer border border-border hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className={`w-16 h-16 ${iconColorClass} rounded-lg flex items-center justify-center mb-4`}>
            <Icon className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-card-foreground">{name}</h3>
          <p className="text-muted-foreground mb-4">{description}</p>
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className="text-secondary font-medium flex items-center"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {badge}
            </Badge>
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
