// server/storage.ts (THE COMPLETE, FULL, FINAL, AND 100% CORRECTED CODE)

import {
  users, serviceProviders, serviceCategories, serviceProblems,
  beautyServices, cakeProducts, groceryProducts, rentalProperties,
  bookings, groceryOrders, reviews, streetFoodItems, restaurantMenuItems, tableBookings,
  type User, type InsertUser, type ServiceProvider, type InsertServiceProvider,
  type Booking, type InsertBooking, type GroceryOrder, type InsertGroceryOrder,
  type RentalProperty, type InsertRentalProperty, type ServiceCategory,
  type ServiceProblem, type BeautyService, type CakeProduct, type GroceryProduct,
  type Review, type StreetFoodItem, type RestaurantMenuItem, type TableBooking, type InsertTableBooking
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: string, info: { customerId: string; subscriptionId: string }): Promise<User>;
  // Service provider operations
  getServiceProviders(categorySlug?: string, latitude?: number, longitude?: number, radius?: number): Promise<(ServiceProvider & { user: User; category: ServiceCategory })[]>;
  getServiceProvider(id: string): Promise<(ServiceProvider & { user: User; category: ServiceCategory }) | undefined>;
  getProviderByUserId(userId: string): Promise<ServiceProvider | undefined>;
  createServiceProvider(provider: InsertServiceProvider & { userId: string; categoryId: string }): Promise<ServiceProvider>;
  updateProviderRating(providerId: string, newRating: number, reviewCount: number): Promise<ServiceProvider>;
  // Service categories
  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(slug: string): Promise<ServiceCategory | undefined>;
  // Service problems
  getServiceProblems(categoryId: string, parentId?: string): Promise<ServiceProblem[]>;
  // Other services...
  getBeautyServices(providerId: string): Promise<BeautyService[]>;
  getCakeProducts(providerId: string): Promise<CakeProduct[]>;
  getGroceryProducts(category?: string, search?: string): Promise<GroceryProduct[]>;
  getGroceryProduct(id: string): Promise<GroceryProduct | undefined>;
  getRentalProperties(filters: any): Promise<(RentalProperty & { owner: User })[]>;
  getRentalProperty(id: string): Promise<(RentalProperty & { owner: User }) | undefined>;
  createRentalProperty(property: InsertRentalProperty & { ownerId: string }): Promise<RentalProperty>;
  // Bookings
  createBooking(booking: InsertBooking & { userId: string; providerId?: string }): Promise<Booking>;
  getBooking(id: string): Promise<(Booking & { user: User; provider?: ServiceProvider }) | undefined>;
  updateBookingStatus(id: string, status: string, providerId?: string): Promise<Booking & { provider?: ServiceProvider }>;
  getUserBookings(userId: string): Promise<(Booking & { provider?: ServiceProvider })[]>;
  getProviderBookings(providerId: string): Promise<(Booking & { user: User })[]>;
  // Orders
  createGroceryOrder(order: InsertGroceryOrder & { userId: string }): Promise<GroceryOrder>;
  getGroceryOrder(id: string): Promise<GroceryOrder | undefined>;
  updateOrderPaymentId(orderId: string, paymentIntentId: string): Promise<GroceryOrder>;
  // Reviews
  createReview(review: { userId: string; providerId: string; bookingId?: string; rating: number; comment?: string }): Promise<Review>;
  getProviderReviews(providerId: string): Promise<(Review & { user: User })[]>;
  // Menu items
  getStreetFoodItems(providerId?: string, search?: string): Promise<StreetFoodItem[]>;
  getRestaurantMenuItems(providerId?: string): Promise<RestaurantMenuItem[]>;
  // Table bookings
  createTableBooking(booking: InsertTableBooking & { userId: string; providerId: string }): Promise<TableBooking>;
  getTableBooking(id: string): Promise<TableBooking | undefined>;
  updateTableBookingStatus(id: string, status: string): Promise<TableBooking>;
  getUserTableBookings(userId: string): Promise<TableBooking[]>;
  // Menu Management
  createMenuItem(itemData: any, providerId: string, categorySlug: string): Promise<any>;
  updateMenuItem(itemId: string, providerId: string, categorySlug: string, updates: any): Promise<any | null>;
  deleteMenuItem(itemId: string, providerId: string, categorySlug: string): Promise<{ id: string } | null>;
  getProviderMenuItems(providerId: string, categorySlug: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // --- User Operations ---
  async getUser(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.username, username) });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.email, email) });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    const [user] = await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId)).returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, info: { customerId: string; subscriptionId: string; }): Promise<User> {
    const [user] = await db.update(users).set({ stripeCustomerId: info.customerId, stripeSubscriptionId: info.subscriptionId }).where(eq(users.id, userId)).returning();
    return user;
  }

  // --- Service Provider Operations (FIXED & UPGRADED) ---
  async getServiceProviders(categorySlug?: string, latitude?: number, longitude?: number, radius?: number) {
    const results = await db.query.serviceProviders.findMany({
      with: { user: true, category: true },
      orderBy: [desc(serviceProviders.rating)],
    });
    return results.filter(p => !categorySlug || p.category.slug === categorySlug) as any;
  }

  async getServiceProvider(id: string) {
    const result = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.id, id),
      with: {
        user: true,
        category: true,
      },
    });
    return result as any;
  }

  async getProviderByUserId(userId: string): Promise<ServiceProvider | undefined> {
    return db.query.serviceProviders.findFirst({ where: eq(serviceProviders.userId, userId) });
  }

  async createServiceProvider(provider: InsertServiceProvider & { userId: string; categoryId: string }): Promise<ServiceProvider> {
    // 💥 RED LINE FIX: Explicitly create a new plain object to satisfy Drizzle's strict type checking.
    const providerToInsert = {
      businessName: provider.businessName,
      description: provider.description,
      experience: provider.experience,
      address: provider.address,
      latitude: provider.latitude,
      longitude: provider.longitude,
      specializations: provider.specializations,
      userId: provider.userId,
      categoryId: provider.categoryId,
    };
    const [newProvider] = await db.insert(serviceProviders).values(providerToInsert).returning();
    return newProvider;
  }

  async updateProviderRating(providerId: string, newRating: number, reviewCount: number): Promise<ServiceProvider> {
    const [provider] = await db.update(serviceProviders)
      .set({ rating: newRating.toFixed(2), reviewCount })
      .where(eq(serviceProviders.id, providerId))
      .returning();
    return provider;
  }

  // --- Other Functions (Now using consistent query patterns) ---

  async getServiceCategories(): Promise<ServiceCategory[]> {
    return db.query.serviceCategories.findMany();
  }

  async getServiceCategory(slug: string): Promise<ServiceCategory | undefined> {
    return db.query.serviceCategories.findFirst({ where: eq(serviceCategories.slug, slug) });
  }

  async getServiceProblems(categoryId: string, parentId?: string): Promise<ServiceProblem[]> {
    const conditions = [eq(serviceProblems.categoryId, categoryId)];
    parentId ? conditions.push(eq(serviceProblems.parentId, parentId)) : conditions.push(sql`${serviceProblems.parentId} IS NULL`);
    return db.select().from(serviceProblems).where(and(...conditions));
  }

  async createBooking(booking: InsertBooking & { userId: string; providerId?: string; }): Promise<Booking> {
    // 💥 RED LINE FIX: Explicitly create a new plain object.
    const bookingToInsert = {
      serviceType: booking.serviceType,
      problemId: booking.problemId,
      scheduledAt: booking.scheduledAt,
      preferredTimeSlots: booking.preferredTimeSlots,
      userAddress: booking.userAddress,
      userPhone: booking.userPhone,
      notes: booking.notes,
      userId: booking.userId,
      providerId: booking.providerId,
    };
    const [newBooking] = await db.insert(bookings).values(bookingToInsert).returning();
    return newBooking;
  }

  async getBooking(id: string) {
    return db.query.bookings.findFirst({
      where: eq(bookings.id, id),
      with: {
        user: true,
        provider: { with: { user: true, category: true } },
      },
    }) as any;
  }

  async createGroceryOrder(order: InsertGroceryOrder & { userId: string; }): Promise<GroceryOrder> {
    // 💥 RED LINE FIX: Explicitly create a new plain object.
    const orderToInsert = {
      items: order.items,
      subtotal: order.subtotal,
      platformFee: order.platformFee,
      deliveryFee: order.deliveryFee,
      total: order.total,
      deliveryAddress: order.deliveryAddress,
      userId: order.userId,
    };
    const [newOrder] = await db.insert(groceryOrders).values(orderToInsert).returning();
    return newOrder;
  }

  async updateOrderPaymentId(orderId: string, paymentIntentId: string): Promise<GroceryOrder> {
    const [order] = await db.update(groceryOrders)
      .set({ stripePaymentIntentId: paymentIntentId })
      .where(eq(groceryOrders.id, orderId))
      .returning();
    return order;
  }

  async createRentalProperty(property: InsertRentalProperty & { ownerId: string; }): Promise<RentalProperty> {
    // 💥 RED LINE FIX: Explicitly create a new plain object.
    const propertyToInsert = {
        title: property.title,
        description: property.description,
        propertyType: property.propertyType,
        rent: property.rent,
        area: property.area,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        furnishing: property.furnishing,
        address: property.address,
        locality: property.locality,
        latitude: property.latitude,
        longitude: property.longitude,
        amenities: property.amenities,
        images: property.images,
        ownerId: property.ownerId,
    };
    const [newProperty] = await db.insert(rentalProperties).values(propertyToInsert).returning();
    return newProperty;
  }

  // --- ALL REMAINING FUNCTIONS (Included for completeness) ---

  async getBeautyServices(providerId: string): Promise<BeautyService[]> { return db.query.beautyServices.findMany({ where: eq(beautyServices.providerId, providerId) }); }
  async getCakeProducts(providerId: string): Promise<CakeProduct[]> { return db.query.cakeProducts.findMany({ where: eq(cakeProducts.providerId, providerId) }); }
  async getGroceryProducts(category?: string, search?: string): Promise<GroceryProduct[]> { const conditions = [eq(groceryProducts.inStock, true)]; if(category){conditions.push(eq(groceryProducts.category, category))}; if(search){conditions.push(sql`${groceryProducts.name} ILIKE ${`%${search}%`}`)}; return db.select().from(groceryProducts).where(and(...conditions)).orderBy(asc(groceryProducts.name)); }
  async getGroceryProduct(id: string): Promise<GroceryProduct | undefined> { const [product] = await db.select().from(groceryProducts).where(sql`${groceryProducts.id} = ${parseInt(id)}`); return product; }
  async getGroceryOrder(id: string): Promise<GroceryOrder | undefined> { return db.query.groceryOrders.findFirst({where: eq(groceryOrders.id, id)}); }
  async getStreetFoodItems(providerId?: string, search?: string): Promise<StreetFoodItem[]> { const conditions = [eq(streetFoodItems.isAvailable, true)]; if(providerId){conditions.push(eq(streetFoodItems.providerId, providerId))}; if(search){conditions.push(sql`${streetFoodItems.name} ILIKE ${`%${search}%`}`)}; return db.select().from(streetFoodItems).where(and(...conditions)); }
  async getRestaurantMenuItems(providerId?: string): Promise<RestaurantMenuItem[]> { if(providerId){return db.query.restaurantMenuItems.findMany({where: eq(restaurantMenuItems.providerId, providerId)})}; return db.query.restaurantMenuItems.findMany({where: eq(restaurantMenuItems.isAvailable, true)}); }
  async createTableBooking(booking: InsertTableBooking & { userId: string; providerId: string; }): Promise<TableBooking> { const [newBooking] = await db.insert(tableBookings).values(booking).returning(); return newBooking; }
  async getTableBooking(id: string): Promise<TableBooking | undefined> { return db.query.tableBookings.findFirst({where: eq(tableBookings.id, id)}); }
  async updateTableBookingStatus(id: string, status: string): Promise<TableBooking> { const [booking] = await db.update(tableBookings).set({ status }).where(eq(tableBookings.id, id)).returning(); return booking; }
  async getUserTableBookings(userId: string): Promise<TableBooking[]> { return db.query.tableBookings.findMany({ where: eq(tableBookings.userId, userId), orderBy: [desc(tableBookings.createdAt)]}); }

  async getRentalProperties(filters: { propertyType?: string; minRent?: number; maxRent?: number; furnishing?: string; locality?: string; }) {
      return db.query.rentalProperties.findMany({ with: { owner: true, }, orderBy: [desc(rentalProperties.createdAt)], }) as any;
  }
  async getRentalProperty(id: string) {
      return db.query.rentalProperties.findFirst({ where: eq(rentalProperties.id, id), with: { owner: true } }) as any;
  }
  async updateBookingStatus(id: string, status: string, providerId?: string): Promise<Booking & { provider?: ServiceProvider; }> {
      const updateData: any = { status }; if (providerId) { updateData.providerId = providerId; }
      await db.update(bookings).set(updateData).where(eq(bookings.id, id));
      return this.getBooking(id) as any;
  }
  async getUserBookings(userId: string) {
      return db.query.bookings.findMany({ where: eq(bookings.userId, userId), with: { provider: { with: { user: true, category: true } } }, orderBy: [desc(bookings.createdAt)] }) as any;
  }
  async getProviderBookings(providerId: string) {
      return db.query.bookings.findMany({ where: eq(bookings.providerId, providerId), with: { user: true }, orderBy: [desc(bookings.createdAt)] }) as any;
  }
  async createReview(review: { userId: string; providerId: string; bookingId?: string; rating: number; comment?: string; }): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    const providerReviews = await db.select().from(reviews).where(eq(reviews.providerId, review.providerId));
    const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
    await this.updateProviderRating(review.providerId, avgRating, providerReviews.length);
    return newReview;
  }
  async getProviderReviews(providerId: string) {
      return db.query.reviews.findMany({ where: eq(reviews.providerId, providerId), with: { user: true }, orderBy: [desc(reviews.createdAt)] }) as any;
  }

  private getMenuTableInfo(categorySlug: string) { switch (categorySlug) { case 'beauty': return { table: beautyServices, idField: beautyServices.id, providerIdField: beautyServices.providerId }; case 'cake-shop': return { table: cakeProducts, idField: cakeProducts.id, providerIdField: cakeProducts.providerId }; case 'street-food': return { table: streetFoodItems, idField: streetFoodItems.id, providerIdField: streetFoodItems.providerId }; case 'restaurants': return { table: restaurantMenuItems, idField: restaurantMenuItems.id, providerIdField: restaurantMenuItems.providerId }; default: throw new Error(`Unknown menu category: ${categorySlug}`); } }
  async createMenuItem(itemData: any, providerId: string, categorySlug: string): Promise<any> { const { table } = this.getMenuTableInfo(categorySlug); const [newItem] = await db.insert(table).values({ ...itemData, providerId }).returning(); return newItem; }
  async updateMenuItem(itemId: string, providerId: string, categorySlug: string, updates: any): Promise<any | null> { const { table, idField, providerIdField } = this.getMenuTableInfo(categorySlug); const [itemToUpdate] = await db.select().from(table).where(and(eq(idField, itemId), eq(providerIdField, providerId))); if (!itemToUpdate) return null; const [updatedItem] = await db.update(table).set(updates).where(eq(idField, itemId)).returning(); return updatedItem; }
  async deleteMenuItem(itemId: string, providerId: string, categorySlug: string): Promise<{ id: string; } | null> { const { table, idField, providerIdField } = this.getMenuTableInfo(categorySlug); const [itemToDelete] = await db.select().from(table).where(and(eq(idField, itemId), eq(providerIdField, providerId))); if (!itemToDelete) return null; const [deletedItem] = await db.delete(table).where(eq(idField, itemId)).returning({ id: idField }); return deletedItem; }
  async getProviderMenuItems(providerId: string, categorySlug: string): Promise<any[]> { const { table, providerIdField } = this.getMenuTableInfo(categorySlug); return db.select().from(table).where(eq(providerIdField, providerId)); }
}

export const storage = new DatabaseStorage();