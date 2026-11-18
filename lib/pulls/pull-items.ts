import "server-only";

import { z } from "zod";

import type { BarcodeFormat } from "@/app/generated/prisma/client";
import { AppError } from "@/lib/core/errors";
import { db } from "@/lib/db";
import { isAllowedImageUrl } from "@/lib/products/image-hosts";
import { emptyToNull, productDisplayName } from "@/lib/products/products";
import { dayToDbDate, dbDateToDay, todayIn } from "@/lib/pulls/pull-dates";
import {
  pullItemFieldsSchema,
  type CreatePullItemValues,
} from "@/lib/validations/scan.validation";

export type PendingPullItem = { id: string; expiryDate: string | null; pullDate: string };

export type PullItemActor = { storeId: string; userId: string; timezone: string };

export async function listPendingPullItems(
  storeId: string,
  gtin: string,
): Promise<PendingPullItem[]> {
  const rows = await db.pullItem.findMany({
    where: { storeId, gtin, status: "PENDING" },
    orderBy: [{ pullDate: "asc" }, { createdAt: "asc" }],
    select: { id: true, expiryDate: true, pullDate: true },
  });
  return rows.map((row) => ({
    id: row.id,
    expiryDate: row.expiryDate ? dbDateToDay(row.expiryDate) : null,
    pullDate: dbDateToDay(row.pullDate),
  }));
}

/** Saves a pending pull item and writes the location back to the store's product. */
export async function createPullItem(
  actor: PullItemActor,
  input: CreatePullItemValues,
): Promise<{ productName: string }> {
  const parsed = pullItemFieldsSchema(todayIn(actor.timezone)).safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION",
      "Check the highlighted fields.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }
  const values = parsed.data;
  const expiryDate = values.expiryDate === "" ? null : dayToDbDate(values.expiryDate);
  const pullDate = dayToDbDate(values.pullDate);

  return db.$transaction(async (tx) => {
    const storeProduct = await tx.storeProduct.findUnique({
      where: { storeId_gtin: { storeId: actor.storeId, gtin: input.gtin } },
      select: { id: true, name: true, product: { select: { name: true } } },
    });
    if (!storeProduct) {
      throw new AppError("NOT_FOUND", "We couldn't find this product. Scan it again.");
    }

    const duplicate = await tx.pullItem.findFirst({
      where: { storeId: actor.storeId, gtin: input.gtin, status: "PENDING", expiryDate, pullDate },
      select: { id: true },
    });
    if (duplicate) {
      throw new AppError("CONFLICT", "This product already has a pull item with these dates.", {
        pullDate: ["This product already has a pull item with these dates"],
      });
    }

    const productName = productDisplayName(storeProduct.name, storeProduct.product.name);
    await tx.pullItem.create({
      data: {
        storeId: actor.storeId,
        gtin: input.gtin,
        productName,
        expiryDate,
        pullDate,
        createdById: actor.userId,
        events: { create: { userId: actor.userId, action: "CREATED" } },
      },
    });
    await tx.storeProduct.update({
      where: { id: storeProduct.id },
      data: {
        aisle: emptyToNull(values.aisle),
        section: emptyToNull(values.section),
        shelf: emptyToNull(values.shelf),
      },
    });
    return { productName };
  });
}

export type PullBucket = "previous" | "today" | "upcoming";

export type PullBucketCounts = Record<PullBucket, number>;

export type PullItemCard = {
  id: string;
  name: string;
  brand: string | null;
  size: string | null;
  barcodeFormat: BarcodeFormat;
  barcodeValue: string;
  imageUrl: string | null;
  expiryDate: string | null;
  pullDate: string;
  aisle: string | null;
  section: string | null;
  shelf: string | null;
  category: string | null;
  itemNumber: string | null;
  addedBy: string;
  addedOn: string;
};

export type MarkPullStatus = "PULLED" | "SKIPPED";

function bucketWhere(storeId: string, bucket: PullBucket, today: string) {
  const day = dayToDbDate(today);
  const pullDate = bucket === "previous" ? { lt: day } : bucket === "today" ? day : { gt: day };
  return { storeId, status: "PENDING" as const, pullDate };
}

export async function countPullBuckets(storeId: string, today: string): Promise<PullBucketCounts> {
  const [previous, todayCount, upcoming] = await Promise.all([
    db.pullItem.count({ where: bucketWhere(storeId, "previous", today) }),
    db.pullItem.count({ where: bucketWhere(storeId, "today", today) }),
    db.pullItem.count({ where: bucketWhere(storeId, "upcoming", today) }),
  ]);
  return { previous, today: todayCount, upcoming };
}

export async function listPullItems(
  storeId: string,
  timezone: string,
  bucket: PullBucket,
): Promise<PullItemCard[]> {
  const rows = await db.pullItem.findMany({
    where: bucketWhere(storeId, bucket, todayIn(timezone)),
    orderBy: [{ pullDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      gtin: true,
      productName: true,
      expiryDate: true,
      pullDate: true,
      createdAt: true,
      createdBy: { select: { name: true } },
      product: {
        select: {
          name: true,
          brand: true,
          size: true,
          category: true,
          imageUrl: true,
          barcodeFormat: true,
          barcodeValue: true,
        },
      },
    },
  });
  if (rows.length === 0) return [];

  const storeProducts = await db.storeProduct.findMany({
    where: { storeId, gtin: { in: [...new Set(rows.map((row) => row.gtin))] } },
    select: {
      gtin: true,
      aisle: true,
      section: true,
      shelf: true,
      categoryName: true,
      itemNumber: true,
    },
  });
  const locations = new Map(storeProducts.map((row) => [row.gtin, row]));

  return rows.map((row) => {
    const location = locations.get(row.gtin);
    return {
      id: row.id,
      name: row.productName ?? productDisplayName(null, row.product.name),
      brand: row.product.brand,
      size: row.product.size,
      barcodeFormat: row.product.barcodeFormat,
      barcodeValue: row.product.barcodeValue,
      // next/image only loads allowed hosts.
      imageUrl:
        row.product.imageUrl && isAllowedImageUrl(row.product.imageUrl)
          ? row.product.imageUrl
          : null,
      expiryDate: row.expiryDate ? dbDateToDay(row.expiryDate) : null,
      pullDate: dbDateToDay(row.pullDate),
      aisle: location?.aisle ?? null,
      section: location?.section ?? null,
      shelf: location?.shelf ?? null,
      category: location?.categoryName ?? row.product.category,
      itemNumber: location?.itemNumber ?? null,
      addedBy: row.createdBy.name,
      addedOn: todayIn(timezone, row.createdAt),
    };
  });
}

/** Marks a pending item due today or earlier; upcoming items can't be marked. */
export async function markPullItem(
  actor: PullItemActor,
  id: string,
  status: MarkPullStatus,
): Promise<void> {
  const today = dayToDbDate(todayIn(actor.timezone));
  await db.$transaction(async (tx) => {
    const { count } = await tx.pullItem.updateMany({
      where: { id, storeId: actor.storeId, status: "PENDING", pullDate: { lte: today } },
      data: { status, pulledAt: status === "PULLED" ? new Date() : null },
    });
    if (count === 0) throw new AppError("CONFLICT", "This item was already handled.");
    await tx.pullEvent.create({ data: { pullItemId: id, userId: actor.userId, action: status } });
  });
}

/** Puts a pulled or skipped item back on the list. */
export async function undoPullItem(actor: PullItemActor, id: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const { count } = await tx.pullItem.updateMany({
      where: { id, storeId: actor.storeId, status: { in: ["PULLED", "SKIPPED"] } },
      data: { status: "PENDING", pulledAt: null },
    });
    if (count === 0) throw new AppError("CONFLICT", "This item is already back on the list.");
    await tx.pullEvent.create({ data: { pullItemId: id, userId: actor.userId, action: "EDITED" } });
  });
}
