import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { posts } from './posts';
import { users } from './users';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipientId: uuid('recipient_id')
    .notNull()
    .references(() => users.id),
  actorId: uuid('actor_id').references(() => users.id),
  type: text('type').notNull(),
  entityId: uuid('entity_id'),
  entityType: text('entity_type'),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityLog = pgTable('activity_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  action: text('action').notNull(),
  entityId: uuid('entity_id').notNull(),
  entityType: text('entity_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const hashtags = pgTable('hashtags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  postCount: integer('post_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const postHashtags = pgTable(
  'post_hashtags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id),
    hashtagId: uuid('hashtag_id')
      .notNull()
      .references(() => hashtags.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('post_hashtags_post_hashtag_idx').on(table.postId, table.hashtagId)],
);

export const memories = pgTable(
  'memories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id),
    originalDate: timestamp('original_date').notNull(),
    surfacedAt: timestamp('surfaced_at'),
  },
  (table) => [uniqueIndex('memories_user_post_idx').on(table.userId, table.postId)],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

export const hashtagsRelations = relations(hashtags, ({ many }) => ({
  postHashtags: many(postHashtags),
}));

export const postHashtagsRelations = relations(postHashtags, ({ one }) => ({
  post: one(posts, {
    fields: [postHashtags.postId],
    references: [posts.id],
  }),
  hashtag: one(hashtags, {
    fields: [postHashtags.hashtagId],
    references: [hashtags.id],
  }),
}));

export const memoriesRelations = relations(memories, ({ one }) => ({
  user: one(users, {
    fields: [memories.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [memories.postId],
    references: [posts.id],
  }),
}));
