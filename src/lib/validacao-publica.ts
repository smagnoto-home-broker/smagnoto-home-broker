import { z } from "zod";

/**
 * Validacao dos formularios publicos do site (visitante anonimo).
 * Fica fora de "use server" para poder ser testada e reutilizada.
 */

// Caracteres de controle (exceto \n e \t) nao tem lugar em nome, telefone ou mensagem.
const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const SEM_CONTROLE = (v: string) => !CONTROLE.test(v);

const texto = (max: number, rotulo: string) =>
  z
    .string()
    .trim()
    .max(max, `${rotulo} muito longo.`)
    .refine(SEM_CONTROLE, `${rotulo} contem caracteres invalidos.`);

/** Telefone BR com DDD: 10 a 13 digitos (aceita +55, parenteses, espacos e hifen). */
export const telefoneSchema = z
  .string()
  .trim()
  .max(30, "Telefone muito longo.")
  .refine(SEM_CONTROLE, "Informe um WhatsApp válido, com DDD.")
  .refine((v) => /^[0-9()+\-.\s]+$/.test(v), "Informe um WhatsApp válido, com DDD.")
  .refine((v) => {
    const digitos = v.replace(/\D/g, "").length;
    return digitos >= 10 && digitos <= 13;
  }, "Informe um WhatsApp válido, com DDD.");

const nomeSchema = texto(120, "Nome").pipe(z.string().min(2, "Informe seu nome."));

const emailSchema = z
  .string()
  .trim()
  .max(200, "E-mail muito longo.")
  .refine(
    (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Informe um e-mail válido ou deixe em branco.",
  );

export const leadSchema = z.object({
  nome: nomeSchema,
  telefone: telefoneSchema,
  email: emailSchema,
  procurando: z.enum(["venda", "aluguel", "temporada", "quero_vender"]).optional(),
  mensagem: texto(1000, "Mensagem").pipe(z.string().min(3, "Escreva uma breve mensagem.")),
  propertyId: z.string().trim().max(64).optional(),
});

/** HH:mm real (00:00 a 23:59). */
const horarioSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Escolha um horário válido.");

/** yyyy-MM-dd existente no calendario (rejeita 2026-02-31). */
const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma data válida.")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Escolha uma data válida.");

export const visitaSchema = z.object({
  nome: nomeSchema,
  telefone: telefoneSchema,
  data: dataSchema,
  horario: horarioSchema,
  observacao: texto(500, "Observação").optional(),
  propertyId: z.string().trim().max(64),
  propertyTitulo: z.string().trim().min(1).max(200).refine(SEM_CONTROLE, "Imóvel inválido."),
});

/** Maior antecedencia aceita para marcar visita pelo site. */
export const MAX_DIAS_VISITA = 180;

/** Soma dias a uma data yyyy-MM-dd (UTC puro, sem fuso). */
export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
