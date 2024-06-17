import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("jobs").order("desc").take(20);
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("jobs")
      .withIndex("by_status_kind", (q) => q.eq("status.kind", "pending"))
      .order("desc")
      .take(100);
  },
});
