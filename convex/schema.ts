import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Dataset management
  datasets: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    totalImages: v.number(),
    createdBy: v.id("users"),
    isActive: v.boolean(),
  }).index("by_user", ["createdBy"]),

  datasetImages: defineTable({
    datasetId: v.id("datasets"),
    imageId: v.id("_storage"),
    label: v.union(
      v.literal("healthy"),
      v.literal("hollow_heart"),
      v.literal("black_heart"),
      v.literal("internal_heat_necrosis")
    ),
    isDefective: v.boolean(),
    uploadedBy: v.id("users"),
  }).index("by_dataset", ["datasetId"])
    .index("by_label", ["label"]),

  // Batch management
  batches: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    totalPotatoes: v.number(),
    processedPotatoes: v.number(),
    defectivePotatoes: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("archived")),
    qrCode: v.optional(v.string()),
    estimatedValue: v.optional(v.number()),
    estimatedLoss: v.optional(v.number()),
  }).index("by_user", ["createdBy"])
    .index("by_status", ["status"]),

  // Individual potato predictions
  predictions: defineTable({
    batchId: v.optional(v.id("batches")),
    imageId: v.id("_storage"),
    userId: v.id("users"),
    
    // Stage 1: Binary classification
    isDefective: v.boolean(),
    defectConfidence: v.number(), // 0-100
    
    // Stage 2: Multi-class classification (if defective)
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
    
    // Additional metadata
    processingTime: v.number(), // milliseconds
    modelVersion: v.string(),
    heatmapData: v.optional(v.string()), // JSON string of heatmap coordinates
    
    // User feedback for continuous learning
    userFeedback: v.optional(v.union(
      v.literal("correct"),
      v.literal("incorrect"),
      v.literal("uncertain")
    )),
    actualLabel: v.optional(v.string()),
  }).index("by_batch", ["batchId"])
    .index("by_user", ["userId"])
    .index("by_defect_type", ["defectType"]),

  // Reports
  reports: defineTable({
    batchId: v.id("batches"),
    generatedBy: v.id("users"),
    reportType: v.union(v.literal("batch_summary"), v.literal("detailed_analysis")),
    data: v.string(), // JSON string containing report data
    format: v.union(v.literal("pdf"), v.literal("excel"), v.literal("json")),
    fileId: v.optional(v.id("_storage")),
  }).index("by_batch", ["batchId"])
    .index("by_user", ["generatedBy"]),

  // System settings and model configuration
  systemSettings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedBy: v.id("users"),
  }).index("by_key", ["key"]),

  // Sustainability metrics
  sustainabilityMetrics: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    potatoesSaved: v.number(),
    wasteReduced: v.number(), // in kg
    co2Saved: v.number(), // in kg CO2 equivalent
    economicImpact: v.number(), // in currency units
  }).index("by_user_date", ["userId", "date"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
