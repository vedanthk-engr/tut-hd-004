import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// AI Model Simulation
function simulateAIClassification(imageData?: string) {
  // Simulate processing time
  const processingTime = Math.random() * 500 + 200; // 200-700ms
  
  // Create deterministic simulation based on image characteristics
  
  // Stage 1: Binary classification (Defect vs No Defect) - Make it deterministic
  let isDefective = false;
  if (imageData) {
    // Use hash to make consistent decisions per image
    let hash = 0;
    for (let i = 0; i < Math.min(imageData.length, 50); i++) {
      hash = ((hash << 5) - hash) + imageData.charCodeAt(i);
    }
    const normalizedHash = Math.abs(hash % 1000) / 1000;
    isDefective = normalizedHash > 0.4; // 60% chance of detecting defects
  } else {
    isDefective = Math.random() < 0.4;
  }
  const defectConfidence = isDefective 
    ? Math.random() * 30 + 70  // 70-100% confidence for defects
    : Math.random() * 40 + 60; // 60-100% confidence for healthy
  
  let defectType: "hollow_heart" | "black_heart" | "internal_heat_necrosis" | undefined = undefined;
  let defectTypeConfidence: number | undefined = undefined;
  let severityLevel: "mild" | "moderate" | "severe" | undefined = undefined;
  let heatmapData: string | undefined = undefined;
  
  // Stage 2: Multi-class classification (if defective)
  if (isDefective) {
    const defectTypes: ("hollow_heart" | "black_heart" | "internal_heat_necrosis")[] = ["hollow_heart", "black_heart", "internal_heat_necrosis"];
    defectType = defectTypes[Math.floor(Math.random() * defectTypes.length)];
    defectTypeConfidence = Math.random() * 25 + 75; // 75-100% confidence
    
    const severityLevels: ("mild" | "moderate" | "severe")[] = ["mild", "moderate", "severe"];
    severityLevel = severityLevels[Math.floor(Math.random() * severityLevels.length)];
    
    // Generate mock heatmap data
    heatmapData = JSON.stringify({
      regions: [
        { x: Math.random() * 100, y: Math.random() * 100, intensity: Math.random() },
        { x: Math.random() * 100, y: Math.random() * 100, intensity: Math.random() },
      ]
    });
  }
  
  return {
    isDefective,
    defectConfidence: Math.round(defectConfidence),
    defectType,
    defectTypeConfidence: defectTypeConfidence ? Math.round(defectTypeConfidence) : undefined,
    severityLevel,
    processingTime: Math.round(processingTime),
    modelVersion: "v2.1.0",
    heatmapData,
  };
}

// Create a new batch
export const createBatch = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    estimatedValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const batchId = await ctx.db.insert("batches", {
      name: args.name,
      description: args.description,
      createdBy: userId,
      totalPotatoes: 0,
      processedPotatoes: 0,
      defectivePotatoes: 0,
      status: "active",
      estimatedValue: args.estimatedValue,
      estimatedLoss: 0,
    });

    return batchId;
  },
});

// Get user's batches
export const getUserBatches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("batches")
      .withIndex("by_user", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();
  },
});

// Get batch details
export const getBatch = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.createdBy !== userId) {
      throw new Error("Batch not found or access denied");
    }

    return batch;
  },
});

// Process potato image
export const processPotato = action({
  args: {
    imageId: v.id("_storage"),
    batchId: v.optional(v.id("batches")),
  },
  handler: async (ctx, args): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get image data for more realistic simulation
    const imageUrl = await ctx.storage.getUrl(args.imageId);
    const imageData = imageUrl ? args.imageId : undefined;

    // Simulate AI processing with image data
    const aiResult = simulateAIClassification(imageData);

    // Store prediction
    const predictionId: any = await ctx.runMutation(api.potatoes.storePrediction, {
      batchId: args.batchId,
      imageId: args.imageId,
      ...aiResult,
    });

    // Update batch statistics if batch is provided
    if (args.batchId) {
      await ctx.runMutation(api.potatoes.updateBatchStats, {
        batchId: args.batchId,
        isDefective: aiResult.isDefective,
      });
    }

    return { predictionId, ...aiResult };
  },
});

// Store prediction result
export const storePrediction = mutation({
  args: {
    batchId: v.optional(v.id("batches")),
    imageId: v.id("_storage"),
    isDefective: v.boolean(),
    defectConfidence: v.number(),
    defectType: v.optional(v.union(
      v.literal("hollow_heart"),
      v.literal("black_heart"),
      v.literal("internal_heat_necrosis")
    )),
    defectTypeConfidence: v.optional(v.number()),
    severityLevel: v.optional(v.union(
      v.literal("mild"),
      v.literal("moderate"),
      v.literal("severe")
    )),
    processingTime: v.number(),
    modelVersion: v.string(),
    heatmapData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("predictions", {
      ...args,
      userId,
    });
  },
});

// Update batch statistics
export const updateBatchStats = mutation({
  args: {
    batchId: v.id("batches"),
    isDefective: v.boolean(),
  },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error("Batch not found");

    const newProcessedCount = batch.processedPotatoes + 1;
    const newDefectiveCount = batch.defectivePotatoes + (args.isDefective ? 1 : 0);
    const estimatedLoss = batch.estimatedValue 
      ? (newDefectiveCount / newProcessedCount) * batch.estimatedValue
      : 0;

    await ctx.db.patch(args.batchId, {
      totalPotatoes: Math.max(batch.totalPotatoes, newProcessedCount),
      processedPotatoes: newProcessedCount,
      defectivePotatoes: newDefectiveCount,
      estimatedLoss,
    });
  },
});

// Get batch predictions
export const getBatchPredictions = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const predictions = await ctx.db
      .query("predictions")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .order("desc")
      .collect();

    // Get image URLs
    const predictionsWithUrls = await Promise.all(
      predictions.map(async (prediction) => ({
        ...prediction,
        imageUrl: await ctx.storage.getUrl(prediction.imageId),
      }))
    );

    return predictionsWithUrls;
  },
});

// Submit user feedback
export const submitFeedback = mutation({
  args: {
    predictionId: v.id("predictions"),
    feedback: v.union(v.literal("correct"), v.literal("incorrect"), v.literal("uncertain")),
    actualLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const prediction = await ctx.db.get(args.predictionId);
    if (!prediction || prediction.userId !== userId) {
      throw new Error("Prediction not found or access denied");
    }

    await ctx.db.patch(args.predictionId, {
      userFeedback: args.feedback,
      actualLabel: args.actualLabel,
    });
  },
});

// Generate upload URL for potato images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get analytics data
export const getAnalytics = query({
  args: { 
    batchId: v.optional(v.id("batches")),
    timeRange: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("year"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let predictions;
    
    if (args.batchId) {
      predictions = await ctx.db
        .query("predictions")
        .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
        .collect();
    } else {
      predictions = await ctx.db
        .query("predictions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    }

    const totalPredictions = predictions.length;
    const defectivePredictions = predictions.filter(p => p.isDefective).length;
    const defectRate = totalPredictions > 0 ? (defectivePredictions / totalPredictions) * 100 : 0;

    // Defect type distribution
    const defectTypes = predictions
      .filter(p => p.isDefective && p.defectType)
      .reduce((acc, p) => {
        acc[p.defectType!] = (acc[p.defectType!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // Confidence distribution
    const avgConfidence = totalPredictions > 0 
      ? predictions.reduce((sum, p) => sum + p.defectConfidence, 0) / totalPredictions
      : 0;

    return {
      totalPredictions,
      defectivePredictions,
      healthyPredictions: totalPredictions - defectivePredictions,
      defectRate: Math.round(defectRate * 100) / 100,
      defectTypes,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      avgProcessingTime: totalPredictions > 0 
        ? Math.round(predictions.reduce((sum, p) => sum + p.processingTime, 0) / totalPredictions)
        : 0,
    };
  },
});

// Get sustainability metrics
export const getSustainabilityMetrics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { totals: { potatoesSaved: 0, wasteReduced: 0, co2Saved: 0, economicImpact: 0 }, dailyMetrics: [] };

    const metrics = await ctx.db
      .query("sustainabilityMetrics")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    const totals = metrics.reduce(
      (acc, metric) => ({
        potatoesSaved: acc.potatoesSaved + metric.potatoesSaved,
        wasteReduced: acc.wasteReduced + metric.wasteReduced,
        co2Saved: acc.co2Saved + metric.co2Saved,
        economicImpact: acc.economicImpact + metric.economicImpact,
      }),
      { potatoesSaved: 0, wasteReduced: 0, co2Saved: 0, economicImpact: 0 }
    );

    return { totals, dailyMetrics: metrics };
  },
});
