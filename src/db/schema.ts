/**
 * Esquema de la base de datos de corte.
 * - Dinero siempre en centavos (integer).
 * - Fechas de calendario como date en modo texto ("AAAA-MM-DD").
 * - Las mensualidades NO se guardan: se calculan con src/lib/domain, así nunca
 *   se desincronizan si alguien edita un gasto.
 * - En los grupos el dinero se relaciona con "personas" (members), no con cuentas:
 *   Perla puede agregar a su mamá aunque su mamá nunca se registre.
 */
import { relations } from "drizzle-orm";
import { boolean, date, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  /** null si la persona solo entra con Google */
  passwordHash: text("password_hash"),
  /** "sub" de Google: identificador estable de la cuenta de Google */
  googleId: text("google_id").unique(),
  createdAt: createdAt(),
});

/** El id es el hash SHA-256 del token que va en la cookie (nunca se guarda el token). */
export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** Navegador y sistema, para que la persona reconozca sus sesiones */
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const groups = pgTable("groups", {
  id: id(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: createdAt(),
});

export const roleEnum = pgEnum("role", ["admin", "member"]);

/** Persona dentro de un grupo. Puede o no tener cuenta (userId). */
export const members = pgTable(
  "members",
  {
    id: id(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    role: roleEnum("role").notNull().default("member"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("members_group_user_idx").on(t.groupId, t.userId), index("members_group_idx").on(t.groupId)],
);

/** Tarjeta compartida. El titular es la persona a la que se le deposita. */
export const cards = pgTable(
  "cards",
  {
    id: id(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    holderId: text("holder_id")
      .notNull()
      .references(() => members.id),
    name: text("name").notNull(),
    /** Solo los últimos 4 dígitos, para identificarla. */
    last4: text("last4"),
    cutoffDay: integer("cutoff_day").notNull(),
    dueDays: integer("due_days").notNull().default(20),
    archived: boolean("archived").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("cards_group_idx").on(t.groupId)],
);

/** Total que dice el estado de cuenta del banco, para comparar contra lo registrado. */
export const cardStatements = pgTable(
  "card_statements",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    cutoff: date("cutoff", { mode: "string" }).notNull(),
    bankTotal: integer("bank_total").notNull(),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.cutoff] })],
);

export const expenseKindEnum = pgEnum("expense_kind", ["shared", "personal", "gift"]);
export const splitModeEnum = pgEnum("split_mode", ["equal", "exact", "percent"]);

export const expenses = pgTable(
  "expenses",
  {
    id: id(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: integer("amount").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    kind: expenseKindEnum("kind").notNull().default("shared"),
    splitMode: splitModeEnum("split_mode").notNull().default("equal"),
    /** Lo pagó una persona (efectivo, transferencia). Exclusivo con cardId. */
    paidById: text("paid_by_id").references(() => members.id),
    /** Se pagó con una tarjeta del grupo. Exclusivo con paidById. */
    cardId: text("card_id").references(() => cards.id),
    /** 1 = contado; más = meses sin intereses */
    installments: integer("installments").notNull().default(1),
    /** Para regalos: para quién fue (texto libre) */
    giftFor: text("gift_for"),
    createdById: text("created_by_id").references(() => members.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("expenses_group_date_idx").on(t.groupId, t.date), index("expenses_card_idx").on(t.cardId)],
);

export const expenseShares = pgTable(
  "expense_shares",
  {
    expenseId: text("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
    amount: integer("amount").notNull(),
    /** Solo para división por porcentaje: puntos base (100 % = 10000) */
    basisPoints: integer("basis_points"),
  },
  (t) => [primaryKey({ columns: [t.expenseId, t.memberId] })],
);

/** "Beto le dio $1,300 a Perla" */
export const payments = pgTable(
  "payments",
  {
    id: id(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    fromId: text("from_id")
      .notNull()
      .references(() => members.id),
    toId: text("to_id")
      .notNull()
      .references(() => members.id),
    amount: integer("amount").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    /** Si el pago cubre un corte de una tarjeta */
    cardId: text("card_id").references(() => cards.id, { onDelete: "set null" }),
    cutoff: date("cutoff", { mode: "string" }),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("payments_group_idx").on(t.groupId), index("payments_card_cutoff_idx").on(t.cardId, t.cutoff)],
);

export const expensesRelations = relations(expenses, ({ many }) => ({ shares: many(expenseShares) }));
export const expenseSharesRelations = relations(expenseShares, ({ one }) => ({
  expense: one(expenses, { fields: [expenseShares.expenseId], references: [expenses.id] }),
}));
