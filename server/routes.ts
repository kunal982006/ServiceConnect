// server/routes.ts (FINAL & COMPLETE CODE)

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import { uploadToCloudinary } from './cloudinary';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

import { storage } from "./storage";
import {
  insertBookingSchema,
  insertGroceryOrderSchema,
  insertRentalPropertySchema,
  insertTableBookingSchema,
  insertServiceProviderSchema,
} from "@shared/schema";

// Initialize Stripe (only if API key is available)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // FIX: Using the exact version string your editor requires
    apiVersion: "2025-09-30.clover",
  });
}

// Twilio for call routing (if available)
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Custom Request type for middleware
interface CustomRequest extends Request {
  provider?: {
    id: string;
    userId: string;
    categoryId: string;
  };
}

// Middleware to check if user is a provider
const isProvider = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ message: "Aap logged in nahi hain." });
  }

  const provider = await storage.getProviderByUserId(userId);
  if (!provider) {
    return res.status(403).json({ message: "Aap ek service provider nahi hain." });
  }

  req.provider = provider;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {

  // --- AUTHENTICATION ROUTES ---
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, email, password, role, phone } = req.body;

      if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "Username, email, password, and role are required." });
      }

      const existingUser = await storage.getUserByUsername(username.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        username: username.toLowerCase(),
        email,
        password: hashedPassword,
        role: role || "customer",
        phone,
      });

      req.session.userId = user.id;
      // FIX: Ensure a string is always assigned to prevent type mismatch
      req.session.userRole = user.role || 'customer';

      req.session.save((err) => {
        if (err) {
          console.error("Session save error after signup:", err);
          return res.status(500).json({ message: "Signup successful, but session could not be established." });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword, message: "Signed up and logged in successfully!" });
      });

    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: error.message || "Error during signup" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    console.log("LOGIN ATTEMPT RECEIVED BODY:", req.body);
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
      }

      const user = await storage.getUserByUsername(username.toLowerCase());

      if (!user) {
        await bcrypt.compare("dummyPassword", "$2b$10$abcdefghijklmnopqrstuv");
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role || 'customer';

      req.session.save((err) => {
        if (err) {
          console.error("Session save error after login:", err);
          return res.status(500).json({ message: "Login successful, but session could not be established." });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, message: "Logged in successfully!" });
      });

    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message || "Error during login" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ user: null, message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        req.session.destroy(() => {
          res.clearCookie("connect.sid");
          return res.status(404).json({ user: null, message: "Authenticated user not found, session cleared." });
        });
        return;
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("GET /api/auth/me error:", error);
      res.status(500).json({ user: null, message: error.message || "Error fetching user data" });
    }
  });

  // --- PROVIDER PROFILE ROUTES ---
  app.post("/api/provider/profile", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const providerData = insertServiceProviderSchema.parse(req.body);
      const { categoryId } = req.body;
      const provider = await storage.createServiceProvider({ ...providerData, userId, categoryId });
      res.status(201).json(provider);
    } catch (error: any) {
      console.error("Create provider profile error:", error);
      res.status(400).json({ message: error.message || "Error creating provider profile" });
    }
  });

  // ✅ YEH NAYA, FINAL CODE PASTE KARNA HAI ✅
  app.get("/api/provider/profile", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Hum ab direct 'getServiceProvider' function use karenge,
      // jo humein user ki ID se poori profile (category ke saath) laakar dega.
      // Iske liye humein pehle user object laana padega.
      const provider = await storage.getProviderByUserId(userId);

      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }

      // provider.id ka use karke poori details laao
      const fullProfile = await storage.getServiceProvider(provider.id);

      if (!fullProfile) {
        return res.status(404).json({ message: "Could not retrieve full provider profile." });
      }

      res.json(fullProfile);

    } catch (error: any) {
      console.error("Get provider profile error:", error);
      res.status(500).json({ message: error.message || "Error fetching provider profile" });
    }
  });

  // --- GENERAL SERVICE ROUTES ---
  app.get("/api/service-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error: any) {
      console.error("Get service categories error:", error);
      res.status(500).json({ message: error.message || "Error fetching service categories" });
    }
  });

  app.get("/api/service-providers", async (req: Request, res: Response) => {
    try {
      const { category, lat, lng, radius } = req.query;
      const latitude = lat ? parseFloat(lat as string) : undefined;
      const longitude = lng ? parseFloat(lng as string) : undefined;
      const searchRadius = radius ? parseInt(radius as string) : 10;
      const providers = await storage.getServiceProviders(category as string, latitude, longitude, searchRadius);
      res.json(providers);
    } catch (error: any) {
      console.error("Get service providers error:", error);
      res.status(500).json({ message: error.message || "Error fetching service providers" });
    }
  });

  app.get("/api/service-providers/:id", async (req: Request, res: Response) => {
    try {
      const provider = await storage.getServiceProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      res.json(provider);
    } catch (error: any) {
      console.error("Get service provider by ID error:", error);
      res.status(500).json({ message: error.message || "Error fetching service provider" });
    }
  });

  // --- BOOKING & ORDER ROUTES ---
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated for booking." });
      }
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking({ ...bookingData, userId });
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Create booking error:", error);
      res.status(400).json({ message: error.message || "Error creating booking" });
    }
  });

  app.post("/api/grocery-orders", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated for ordering." });
      }
      const orderData = insertGroceryOrderSchema.parse(req.body);
      const order = await storage.createGroceryOrder({ ...orderData, userId });
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Create grocery order error:", error);
      res.status(400).json({ message: error.message || "Error creating grocery order" });
    }
  });

  // --- NAYA GROCERY PRODUCTS ROUTE ---
  app.get("/api/grocery-products", async (req: Request, res: Response) => {
    try {
      const { category, search } = req.query;
      const products = await storage.getGroceryProducts(category as string, search as string);
      res.json(products);
    } catch (error: any) {
      console.error("Get grocery products error:", error);
      res.status(500).json({ message: error.message || "Error fetching grocery products" });
    }
  });

  app.post("/api/table-bookings", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated for table booking." });
      }
      const validatedData = insertTableBookingSchema.parse(req.body);
      const booking = await storage.createTableBooking({
        ...validatedData,
        userId,
        providerId: req.body.providerId,
      });
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Create table booking error:", error);
      res.status(400).json({ message: error.message || "Error creating table booking" });
    }
  });
  
  app.get("/api/street-food-items", async (req: Request, res: Response) => {
    try {
      // search aur providerId 'query parameters' se nikaalo
      const { search, providerId } = req.query;

      const items = await storage.getStreetFoodItems(providerId as string, search as string);
      res.json(items);
    } catch (error: any) {
      console.error("Get street food items error:", error);
      res.status(500).json({ message: error.message || "Error fetching street food items" });
    }
  });

  // --- NAYE MENU MANAGEMENT ROUTES ---

  // Naya menu item add karne ke liye (POST request)
  app.post("/api/provider/menu-items/:categorySlug", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id; // isProvider middleware se ID mil jayegi
      const categorySlug = req.params.categorySlug;
      const itemData = req.body;

      // storage function ko call karke item create karo
      const newItem = await storage.createMenuItem(itemData, providerId, categorySlug);

      res.status(201).json(newItem);
    } catch (error: any) {
      console.error(`Error creating menu item in ${req.params.categorySlug}:`, error);
      res.status(400).json({ message: error.message || "Error creating menu item" });
    }
  });

  // Provider ke saare menu items dekhne ke liye (GET request)
  app.get("/api/provider/menu-items/:categorySlug", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const categorySlug = req.params.categorySlug;

      const items = await storage.getProviderMenuItems(providerId, categorySlug);

      res.json(items);
    } catch (error: any) {
      console.error(`Error fetching menu items from ${req.params.categorySlug}:`, error);
      res.status(500).json({ message: error.message || "Error fetching menu items" });
    }
  });

  // --- Fallback Routes & Server Creation ---
  const httpServer = createServer(app);
  return httpServer;
}
