import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Generate batch report
export const generateBatchReport = action({
  args: {
    batchId: v.id("batches"),
    reportType: v.union(v.literal("batch_summary"), v.literal("detailed_analysis")),
    format: v.union(v.literal("pdf"), v.literal("excel"), v.literal("json")),
  },
  handler: async (ctx, args): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get batch data
    const batch: any = await ctx.runQuery(api.potatoes.getBatch, { batchId: args.batchId });
    const predictions: any = await ctx.runQuery(api.potatoes.getBatchPredictions, { batchId: args.batchId });
    const analytics: any = await ctx.runQuery(api.potatoes.getAnalytics, { batchId: args.batchId });

    // Generate report data
    const reportData: any = {
      batch,
      analytics,
      predictions: args.reportType === "detailed_analysis" ? predictions : [],
      generatedAt: new Date().toISOString(),
      summary: {
        totalProcessed: batch.processedPotatoes,
        defectiveCount: batch.defectivePotatoes,
        defectRate: analytics.defectRate,
        estimatedLoss: batch.estimatedLoss || 0,
        topDefectType: Object.entries(analytics.defectTypes).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || "None",
      }
    };

    // Store report
    const reportId: any = await ctx.runMutation(api.reports.storeReport, {
      batchId: args.batchId,
      reportType: args.reportType,
      data: JSON.stringify(reportData),
      format: args.format,
    });

    return { reportId, data: reportData };
  },
});

// Store report
export const storeReport = mutation({
  args: {
    batchId: v.id("batches"),
    reportType: v.union(v.literal("batch_summary"), v.literal("detailed_analysis")),
    data: v.string(),
    format: v.union(v.literal("pdf"), v.literal("excel"), v.literal("json")),
    fileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("reports", {
      ...args,
      generatedBy: userId,
    });
  },
});

// Get user reports
export const getUserReports = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("generatedBy", userId))
      .order("desc")
      .collect();
  },
});

// Get report by ID
export const getReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const report = await ctx.db.get(args.reportId);
    if (!report || report.generatedBy !== userId) {
      throw new Error("Report not found or access denied");
    }

    return {
      ...report,
      data: JSON.parse(report.data),
    };
  },
});

// Generate QR code for batch
export const generateBatchQR = mutation({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.createdBy !== userId) {
      throw new Error("Batch not found or access denied");
    }

    // Generate QR code data (would be a URL in production)
    const qrCode = `https://potato-detector.app/batch/${args.batchId}`;

    await ctx.db.patch(args.batchId, { qrCode });

    return qrCode;
  },
});
