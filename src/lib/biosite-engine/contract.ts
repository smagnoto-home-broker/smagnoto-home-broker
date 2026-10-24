import { z } from "zod";

/**
 * Contrato v1 da API do Biosite Engine (cópia mantida à mão neste repositório;
 * nada é importado do outro projeto). Fonte: docs/PLANO-INTEGRACAO-BIOSITE-ENGINE.md, seção 7.
 */
export const NICHOS = ["imobiliaria"] as const;
export type Nicho = (typeof NICHOS)[number];

export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const slugSchema = z.string().regex(SLUG_REGEX);

const urlSegura = z
  .url()
  .refine((u) => u.startsWith("https://") || /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(u), "URL insegura");

export const provisionRequestSchema = z.object({
  company_id_externo: z.uuid(),
  niche_key: z.enum(NICHOS),
  slug_hint: slugSchema.optional(),
  title: z.string().trim().min(2).max(120),
  owner: z.object({ email: z.email().max(160), name: z.string().trim().max(120) }),
});
export type ProvisionRequest = z.infer<typeof provisionRequestSchema>;

export const biositeSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
  niche_key: z.string().min(1).max(40),
  title: z.string().max(200),
  published: z.boolean(),
  public_url: urlSegura,
  created: z.boolean().optional(),
});
export type BiositeRemoto = z.infer<typeof biositeSchema>;

export const patchRequestSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  published: z.boolean().optional(),
});
export type PatchRequest = z.infer<typeof patchRequestSchema>;

export const handoffRequestSchema = z.object({
  actor: z.object({
    external_user_id: z.uuid(),
    email: z.email().max(160),
    role: z.enum(["owner", "admin"]),
  }),
});
export type HandoffRequest = z.infer<typeof handoffRequestSchema>;

export const handoffResponseSchema = z.object({
  url: urlSegura,
  expires_in: z.number().int().positive().max(300),
});

export const healthSchema = z.object({ status: z.literal("ok"), version: z.string().max(20) });

/** application/problem+json (RFC 9457): só usamos title/status; detail nunca é exibido cru. */
export const problemSchema = z
  .object({
    type: z.string().max(300).optional(),
    title: z.string().max(200).optional(),
    status: z.number().int().optional(),
    detail: z.string().max(500).optional(),
  })
  .loose();
