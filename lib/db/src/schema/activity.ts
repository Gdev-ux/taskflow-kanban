import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  taskId: integer("task_id").notNull(),
  taskTitle: text("task_title").notNull(),
  actorName: text("actor_name").notNull(),
  actorColor: text("actor_color").notNull().default("#6c63ff"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Activity = typeof activityTable.$inferSelect;
export type InsertActivity = typeof activityTable.$inferInsert;
