// src/pages/PostProperty.tsx

import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PostProperty() {
    const [, setLocation] = useLocation();

    return (
        <div className="py-12 max-w-xl mx-auto">
            <Button variant="ghost" onClick={() => setLocation("/rental")} className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Rentals
            </Button>
            <h2 className="text-3xl font-bold mb-4">List Your Property for Free</h2>
            <p className="text-muted-foreground">This is the form where owners will input property details, rent, and photos.</p>
            {/* TO DO: Add your property submission form here */}
        </div>
    );
}    