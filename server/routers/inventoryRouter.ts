import { z } from "zod";
import { eq, desc, sql, and, lt, gte, lte, count, sum } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
    products,
    suppliers,
    stockMovements,
    inventory,
    alerts,
} from "../../drizzle/schema";

// ─────────────────────────────────────────────
//  Supplier Router
// ─────────────────────────────────────────────

export const supplierRouter = router({
    list: protectedProcedure.query(async () => {
        const db = await getDb();
        if (!db) return [];
        return await db
            .select()
            .from(suppliers)
            .orderBy(desc(suppliers.createdAt));
    }),

    get: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            const db = await getDb();
            if (!db) return null;
            const result = await db
                .select()
                .from(suppliers)
                .where(eq(suppliers.id, input.id))
                .limit(1);
            return result[0] ?? null;
        }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                email: z.string().email().optional(),
                phone: z.string().optional(),
                address: z.string().optional(),
                city: z.string().optional(),
                country: z.string().optional(),
                paymentTerms: z.string().optional(),
                rating: z.number().min(0).max(5).optional(),
            })
        )
        .mutation(async ({ input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");
            const result = await db.insert(suppliers).values({
                name: input.name,
                email: input.email,
                phone: input.phone,
                address: input.address,
                city: input.city,
                country: input.country,
                paymentTerms: input.paymentTerms,
                rating: input.rating?.toString(),
                isActive: true,
            });
            return result;
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                name: z.string().min(1).optional(),
                email: z.string().email().optional(),
                phone: z.string().optional(),
                address: z.string().optional(),
                city: z.string().optional(),
                country: z.string().optional(),
                paymentTerms: z.string().optional(),
                rating: z.number().min(0).max(5).optional(),
                isActive: z.boolean().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");
            const { id, rating, ...rest } = input;
            await db
                .update(suppliers)
                .set({ ...rest, rating: rating?.toString() })
                .where(eq(suppliers.id, id));
            return { success: true };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");
            await db
                .update(suppliers)
                .set({ isActive: false })
                .where(eq(suppliers.id, input.id));
            return { success: true };
        }),

    /** Products linked to a specific supplier */
    getProducts: protectedProcedure
        .input(z.object({ supplierId: z.number() }))
        .query(async ({ input }) => {
            const db = await getDb();
            if (!db) return [];
            return await db
                .select()
                .from(products)
                .where(eq(products.supplierId, input.supplierId));
        }),
});

// ─────────────────────────────────────────────
//  Stock Movement Router
// ─────────────────────────────────────────────

export const stockMovementRouter = router({
    /** List all movements, optionally filtered by product */
    list: protectedProcedure
        .input(
            z.object({
                productId: z.number().optional(),
                limit: z.number().default(50),
            })
        )
        .query(async ({ input }) => {
            const db = await getDb();
            if (!db) return [];
            const baseQuery = db
                .select({
                    id: stockMovements.id,
                    productId: stockMovements.productId,
                    movementType: stockMovements.movementType,
                    quantity: stockMovements.quantity,
                    reference: stockMovements.reference,
                    notes: stockMovements.notes,
                    createdAt: stockMovements.createdAt,
                    productName: products.name,
                    productSku: products.sku,
                })
                .from(stockMovements)
                .leftJoin(products, eq(stockMovements.productId, products.id))
                .orderBy(desc(stockMovements.createdAt))
                .limit(input.limit);

            if (input.productId) {
                return await db
                    .select({
                        id: stockMovements.id,
                        productId: stockMovements.productId,
                        movementType: stockMovements.movementType,
                        quantity: stockMovements.quantity,
                        reference: stockMovements.reference,
                        notes: stockMovements.notes,
                        createdAt: stockMovements.createdAt,
                        productName: products.name,
                        productSku: products.sku,
                    })
                    .from(stockMovements)
                    .leftJoin(products, eq(stockMovements.productId, products.id))
                    .where(eq(stockMovements.productId, input.productId))
                    .orderBy(desc(stockMovements.createdAt))
                    .limit(input.limit);
            }

            return await baseQuery;
        }),

    /** Record a stock movement (in / out / adjustment) and update product stock */
    record: protectedProcedure
        .input(
            z.object({
                productId: z.number(),
                movementType: z.enum(["in", "out", "adjustment"]),
                quantity: z.number().min(1),
                reference: z.string().optional(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            // Insert movement record
            await db.insert(stockMovements).values({
                productId: input.productId,
                movementType: input.movementType,
                quantity: input.quantity,
                reference: input.reference,
                notes: input.notes,
            });

            // Update product stock level
            if (input.movementType === "in") {
                await db
                    .update(products)
                    .set({
                        currentStock: sql`${products.currentStock} + ${input.quantity}`,
                    })
                    .where(eq(products.id, input.productId));
            } else if (input.movementType === "out") {
                await db
                    .update(products)
                    .set({
                        currentStock: sql`GREATEST(0, ${products.currentStock} - ${input.quantity})`,
                    })
                    .where(eq(products.id, input.productId));
            } else {
                // adjustment = set directly (quantity can be absolute value)
                await db
                    .update(products)
                    .set({ currentStock: input.quantity })
                    .where(eq(products.id, input.productId));
            }

            // Check if product is now below reorder point → create alert
            const [product] = await db
                .select()
                .from(products)
                .where(eq(products.id, input.productId))
                .limit(1);

            if (product && product.currentStock <= product.reorderPoint) {
                await db.insert(alerts).values({
                    userId: 1, // system alert
                    alertType: "low_stock",
                    title: `Low Stock Alert: ${product.name}`,
                    message: `${product.name} (${product.sku}) stock is at ${product.currentStock} units, below reorder point of ${product.reorderPoint}.`,
                    severity: product.currentStock === 0 ? "critical" : "warning",
                    status: "unread",
                    relatedModule: "inventory",
                    relatedId: product.id,
                    actionUrl: "/inventory",
                });
            }

            return { success: true };
        }),

    /** Summary stats per product (total in, total out) */
    summary: protectedProcedure.query(async () => {
        const db = await getDb();
        if (!db) return [];

        const rows = await db
            .select({
                productId: stockMovements.productId,
                movementType: stockMovements.movementType,
                totalQty: sum(stockMovements.quantity),
                txCount: count(),
                productName: products.name,
                productSku: products.sku,
            })
            .from(stockMovements)
            .leftJoin(products, eq(stockMovements.productId, products.id))
            .groupBy(stockMovements.productId, stockMovements.movementType, products.name, products.sku);

        // Pivot into one object per product
        const byProduct: Record<
            number,
            { productId: number; productName: string; productSku: string; totalIn: number; totalOut: number; adjustments: number }
        > = {};

        for (const row of rows) {
            const pid = row.productId;
            if (!byProduct[pid]) {
                byProduct[pid] = {
                    productId: pid,
                    productName: row.productName ?? "",
                    productSku: row.productSku ?? "",
                    totalIn: 0,
                    totalOut: 0,
                    adjustments: 0,
                };
            }
            const qty = parseInt(String(row.totalQty || 0));
            if (row.movementType === "in") byProduct[pid].totalIn += qty;
            else if (row.movementType === "out") byProduct[pid].totalOut += qty;
            else byProduct[pid].adjustments += qty;
        }

        return Object.values(byProduct);
    }),
});

// ─────────────────────────────────────────────
//  Warehouse Router
// ─────────────────────────────────────────────

export const warehouseRouter = router({
    /** All inventory location records (product → warehouse location) */
    list: protectedProcedure.query(async () => {
        const db = await getDb();
        if (!db) return [];
        return await db
            .select({
                id: inventory.id,
                productId: inventory.productId,
                warehouseLocation: inventory.warehouseLocation,
                quantity: inventory.quantity,
                lastCountDate: inventory.lastCountDate,
                updatedAt: inventory.updatedAt,
                productName: products.name,
                productSku: products.sku,
                productCategory: products.category,
            })
            .from(inventory)
            .leftJoin(products, eq(inventory.productId, products.id))
            .orderBy(inventory.warehouseLocation);
    }),

    /** Add or update a warehouse location record */
    upsert: protectedProcedure
        .input(
            z.object({
                productId: z.number(),
                warehouseLocation: z.string().min(1),
                quantity: z.number().min(0),
            })
        )
        .mutation(async ({ input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            // Check if a record already exists
            const existing = await db
                .select()
                .from(inventory)
                .where(
                    and(
                        eq(inventory.productId, input.productId),
                        eq(inventory.warehouseLocation, input.warehouseLocation)
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                await db
                    .update(inventory)
                    .set({
                        quantity: input.quantity,
                        lastCountDate: new Date(),
                    })
                    .where(eq(inventory.id, existing[0].id));
            } else {
                await db.insert(inventory).values({
                    productId: input.productId,
                    warehouseLocation: input.warehouseLocation,
                    quantity: input.quantity,
                    lastCountDate: new Date(),
                });
            }

            return { success: true };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");
            await db.delete(inventory).where(eq(inventory.id, input.id));
            return { success: true };
        }),

    /** Warehouse summary: how many locations, total quantity per location */
    locationSummary: protectedProcedure.query(async () => {
        const db = await getDb();
        if (!db) return [];
        return await db
            .select({
                location: inventory.warehouseLocation,
                totalItems: count(),
                totalQuantity: sum(inventory.quantity),
            })
            .from(inventory)
            .groupBy(inventory.warehouseLocation)
            .orderBy(inventory.warehouseLocation);
    }),
});

// ─────────────────────────────────────────────
//  Inventory Analytics Router
// ─────────────────────────────────────────────

export const inventoryAnalyticsRouter = router({
    /** Overall stats */
    overview: protectedProcedure.query(async () => {
        const db = await getDb();
        if (!db) {
            return {
                totalProducts: 0,
                totalValue: 0,
                lowStockCount: 0,
                outOfStockCount: 0,
                categoryBreakdown: [] as { category: string; count: number; value: number }[],
            };
        }

        const allProducts = await db.select().from(products);

        const totalProducts = allProducts.length;
        const totalValue = allProducts.reduce(
            (s, p) => s + parseFloat(p.unitPrice || "0") * p.currentStock,
            0
        );
        const lowStockCount = allProducts.filter(
            (p) => p.currentStock > 0 && p.currentStock <= p.reorderPoint
        ).length;
        const outOfStockCount = allProducts.filter((p) => p.currentStock === 0).length;

        // Category breakdown
        const catMap: Record<string, { count: number; value: number }> = {};
        for (const p of allProducts) {
            const cat = p.category || "Uncategorised";
            if (!catMap[cat]) catMap[cat] = { count: 0, value: 0 };
            catMap[cat].count += 1;
            catMap[cat].value += parseFloat(p.unitPrice || "0") * p.currentStock;
        }
        const categoryBreakdown = Object.entries(catMap)
            .map(([category, data]) => ({ category, ...data }))
            .sort((a, b) => b.value - a.value);

        return { totalProducts, totalValue, lowStockCount, outOfStockCount, categoryBreakdown };
    }),

    /** Products below reorder point (sorted by urgency = stock/reorderPoint ratio) */
    reorderAlerts: protectedProcedure.query(async () => {
        const db = await getDb();
        if (!db) return [];
        const rows = await db
            .select()
            .from(products)
            .where(sql`${products.currentStock} <= ${products.reorderPoint}`);

        return rows
            .map((p) => ({
                ...p,
                urgencyRatio: p.reorderPoint > 0 ? p.currentStock / p.reorderPoint : 0,
                shortage: p.reorderPoint - p.currentStock,
            }))
            .sort((a, b) => a.urgencyRatio - b.urgencyRatio);
    }),

    /** Top 10 most valuable stock items */
    topByValue: protectedProcedure.query(async () => {
        const db = await getDb();
        if (!db) return [];
        const rows = await db.select().from(products);
        return rows
            .map((p) => ({
                ...p,
                totalValue: parseFloat(p.unitPrice || "0") * p.currentStock,
            }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 10);
    }),

    /** Stock movement trend: last 30 days totals (in vs out) by date */
    movementTrend: protectedProcedure.query(async () => {
        const db = await getDb();
        if (!db) return [];

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const rows = await db
            .select({
                date: sql<string>`DATE(${stockMovements.createdAt})`,
                movementType: stockMovements.movementType,
                total: sum(stockMovements.quantity),
            })
            .from(stockMovements)
            .where(gte(stockMovements.createdAt, thirtyDaysAgo))
            .groupBy(sql`DATE(${stockMovements.createdAt})`, stockMovements.movementType)
            .orderBy(sql`DATE(${stockMovements.createdAt})`);

        // Pivot into date → { in, out }
        const dateMap: Record<string, { date: string; in: number; out: number }> = {};
        for (const row of rows) {
            if (!dateMap[row.date]) dateMap[row.date] = { date: row.date, in: 0, out: 0 };
            if (row.movementType === "in") dateMap[row.date].in += parseInt(String(row.total || 0));
            if (row.movementType === "out") dateMap[row.date].out += parseInt(String(row.total || 0));
        }

        return Object.values(dateMap);
    }),

    /** Turnover rate per product = total out / avg stock */
    turnoverRates: protectedProcedure.query(async () => {
        const db = await getDb();
        if (!db) return [];

        const outRows = await db
            .select({
                productId: stockMovements.productId,
                totalOut: sum(stockMovements.quantity),
                productName: products.name,
                productSku: products.sku,
                currentStock: products.currentStock,
                unitPrice: products.unitPrice,
            })
            .from(stockMovements)
            .leftJoin(products, eq(stockMovements.productId, products.id))
            .where(eq(stockMovements.movementType, "out"))
            .groupBy(
                stockMovements.productId,
                products.name,
                products.sku,
                products.currentStock,
                products.unitPrice
            );

        return outRows
            .map((r) => {
                const totalOut = parseInt(String(r.totalOut || 0));
                const stock = r.currentStock ?? 0;
                const avgStock = (stock + totalOut / 2) || 1;
                return {
                    productId: r.productId,
                    productName: r.productName ?? "",
                    productSku: r.productSku ?? "",
                    totalSold: totalOut,
                    currentStock: stock,
                    turnoverRate: parseFloat((totalOut / avgStock).toFixed(2)),
                    unitPrice: r.unitPrice,
                };
            })
            .sort((a, b) => b.turnoverRate - a.turnoverRate)
            .slice(0, 10);
    }),
});
