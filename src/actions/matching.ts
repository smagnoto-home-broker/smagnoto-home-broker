"use server";

import { z } from "zod";
import { brl } from "@/lib/format";
import { requireCompany } from "@/lib/supabase/server";
import { anonimizarTexto } from "@/lib/anonimizar";

const TIPOS = ["casa", "apartamento", "terreno", "comercial", "rural"] as const;
const TRANSACOES = ["venda", "aluguel", "temporada"] as const;

type Prefs = {
  budgetMax: number | null;
  bedroomsMin: number | null;
  neighborhoods: string[];
  type: string | null;
  transaction: string | null;
  notes: string;
};

type ImovelRanking = {
  id: string;
  title: string;
  price: number;
  bedrooms: number | null;
  neighborhood: string | null;
  transaction: string;
  type: string;
  photos: string[] | null;
  code: string | null;
  slug: string | null;
};

type ItemRecomendado = {
  property: ImovelRanking;
  score: number;
  porque: string;
  fonte: "ia" | "regras";
};

type Resultado = {
  ok: boolean;
  erro?: string;
  itens: ItemRecomendado[];
  usadoIA: boolean;
};

type Entrada = {
  leadId: string;
  prefs: {
    budgetMax?: string;
    bedroomsMin?: string;
    neighborhoods?: string;
    type?: string;
    transaction?: string;
    notes?: string;
  };
};

const entradaSchema = z.object({
  leadId: z.string().trim().min(1, "Selecione um cliente."),
  prefs: z.object({
    budgetMax: z
      .string()
      .trim()
      .max(24)
      .default("")
      .refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0), "Orçamento máximo inválido."),
    bedroomsMin: z
      .string()
      .trim()
      .max(8)
      .default("")
      .refine(
        (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 30),
        "Quartos mínimos inválidos (0 a 30).",
      ),
    neighborhoods: z.string().trim().max(400).default(""),
    type: z.string().trim().max(30).default(""),
    transaction: z.string().trim().max(20).default(""),
    notes: z.string().trim().max(2000).default(""),
  }),
});

/** Normaliza bairros (sem acento/caixa) para comparar de forma previsível. */
function norm(s: string | null): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Score determinístico 0–100 (regras puras, sem aleatoriedade):
 * orçamento 40 · quartos 20 · bairros 20 · transação 10 · tipo 10.
 */
function pontuar(p: ImovelRanking, prefs: Prefs): number {
  let score = 0;

  // Orçamento (0–40): dentro do budget ganha pontuação cheia com leve prêmio por folga;
  // acima do budget perde linearmente e zera 50% acima.
  if (prefs.budgetMax == null || prefs.budgetMax <= 0) {
    score += 40;
  } else {
    const ratio = p.price / prefs.budgetMax;
    if (ratio <= 1) score += Math.round(34 + 6 * (1 - ratio));
    else score += Math.max(0, Math.round(40 * (1 - (ratio - 1) / 0.5)));
  }

  // Quartos (0–20)
  if (prefs.bedroomsMin == null || prefs.bedroomsMin <= 0) {
    score += 20;
  } else {
    const q = p.bedrooms ?? 0;
    score += q >= prefs.bedroomsMin ? 20 : Math.max(0, 20 - 8 * (prefs.bedroomsMin - q));
  }

  // Bairros (0–20): match exato 20, parcial 14, sem match 0.
  if (!prefs.neighborhoods.length) {
    score += 20;
  } else if (p.neighborhood) {
    const alvo = norm(p.neighborhood);
    if (prefs.neighborhoods.some((n) => norm(n) === alvo)) score += 20;
    else if (prefs.neighborhoods.some((n) => alvo.includes(norm(n)) || norm(n).includes(alvo))) score += 14;
  }

  // Transação (0–10) e tipo (0–10)
  if (!prefs.transaction) score += 10;
  else if (p.transaction === prefs.transaction) score += 10;

  if (!prefs.type) score += 10;
  else if (p.type === prefs.type) score += 10;

  return Math.max(0, Math.min(100, score));
}

/** Explicação honesta por regras: só cita os fatos reais do imóvel e das preferências. */
function explicacaoRegras(item: ItemRecomendado, prefs: Prefs): string {
  const p = item.property;
  const partes: string[] = [];

  if (prefs.budgetMax != null && prefs.budgetMax > 0) {
    if (p.price <= prefs.budgetMax) {
      partes.push(`o valor de ${brl(p.price)} está dentro do orçamento de ${brl(prefs.budgetMax)}`);
    } else {
      const acima = Math.round((p.price / prefs.budgetMax - 1) * 100);
      partes.push(`o valor de ${brl(p.price)} fica cerca de ${acima}% acima do orçamento de ${brl(prefs.budgetMax)}`);
    }
  } else {
    partes.push(`o valor é ${brl(p.price)} (a busca não tinha limite de orçamento)`);
  }

  if (prefs.bedroomsMin != null && prefs.bedroomsMin > 0) {
    const q = p.bedrooms ?? 0;
    partes.push(
      q >= prefs.bedroomsMin
        ? `tem ${q} quarto${q === 1 ? "" : "s"}, atendendo ao mínimo de ${prefs.bedroomsMin}`
        : `tem ${q} quarto${q === 1 ? "" : "s"}, abaixo do mínimo de ${prefs.bedroomsMin}`,
    );
  }

  if (prefs.neighborhoods.length && p.neighborhood) {
    const alvo = norm(p.neighborhood);
    const bate = prefs.neighborhoods.find((n) => {
      const x = norm(n);
      return x === alvo || alvo.includes(x) || x.includes(alvo);
    });
    partes.push(
      bate
        ? `fica em ${p.neighborhood}, um dos bairros pedidos`
        : `fica em ${p.neighborhood}, que não está na lista de bairros pedida`,
    );
  }

  if (prefs.transaction) {
    partes.push(
      p.transaction === prefs.transaction
        ? `é de ${p.transaction}, igual ao interesse do cliente`
        : `é de ${p.transaction}, enquanto o cliente busca ${prefs.transaction}`,
    );
  }

  if (prefs.type) {
    partes.push(
      p.type === prefs.type
        ? `é um ${p.type}, igual ao tipo pedido`
        : `é um ${p.type}, enquanto o cliente pediu ${prefs.type}`,
    );
  }

  let texto = `Atende porque ${partes.join("; ")}.`;
  texto +=
    item.score >= 75
      ? " É um dos melhores ajustes encontrados para este perfil."
      : item.score >= 50
        ? " O ajuste é bom, mas vale conferir os detalhes."
        : " O ajuste é parcial — confira os pontos acima antes de apresentar.";
  if (prefs.notes) {
    texto += " As prioridades livres do cliente não entram nesta explicação por regras.";
  }
  return texto;
}

/** Extrai o array JSON da resposta do modelo (tolerante a cercas de código e texto ao redor). */
function extrairArray(texto: string): unknown[] | null {
  const limpo = texto.replace(/```(?:json)?/gi, "").trim();
  const ini = limpo.indexOf("[");
  const fim = limpo.lastIndexOf("]");
  if (ini === -1 || fim === -1 || fim < ini) return null;
  try {
    const parsed: unknown = JSON.parse(limpo.slice(ini, fim + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Chama o AI Gateway (endpoint OpenAI-compatível) para gerar as explicações dos top 5.
 * Sem chave configurada, erro ou timeout de 8s → retorna null e tudo cai no fallback por regras.
 * A chave só é lida de process.env aqui dentro da action — nunca chega ao cliente.
 */
async function explicacoesIA(
  leadName: string,
  prefs: Prefs,
  itens: ItemRecomendado[],
): Promise<Map<string, string> | null> {
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key || itens.length === 0) return null;

  const base = process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1";
  const model = process.env.AI_GATEWAY_MODEL ?? "openai/gpt-4o-mini";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Você é um corretor Smagnoto atendendo um cliente. Escreva em pt-BR, com 2 a 3 frases POR imóvel, " +
              "explicando por que aquele imóvel atende ao cliente, usando apenas fatos do JSON fornecido — " +
              "sem inventar dados fora do JSON. Responda SOMENTE com um array JSON, sem markdown, " +
              'no formato: [{"id":"<id do imóvel>","porque":"<explicação>"}]',
          },
          {
            role: "user",
            content: JSON.stringify({
              // LGPD: o nome e o contato do lead NAO vao ao servico externo; so as preferencias.
              cliente: { ...prefs, notes: anonimizarTexto(prefs.notes, [leadName]) },
              imoveis: itens.map((i) => ({
                id: i.property.id,
                titulo: i.property.title,
                preco: i.property.price,
                quartos: i.property.bedrooms,
                bairro: i.property.neighborhood,
                transacao: i.property.transaction,
                tipo: i.property.type,
                score_regras: i.score,
              })),
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      console.warn("[matching] AI Gateway respondeu", res.status, "- usando regras.");
      return null;
    }

    const data: unknown = await res.json();
    const choices = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices;
    const content = choices?.[0]?.message?.content;
    let texto = "";
    if (typeof content === "string") texto = content;
    else if (Array.isArray(content)) {
      texto = content
        .map((part) => (typeof part === "object" && part && "text" in part ? String((part as { text: unknown }).text) : ""))
        .join("");
    }
    if (!texto) return null;

    const arr = extrairArray(texto);
    if (!arr) return null;

    const mapa = new Map<string, string>();
    for (const raw of arr) {
      if (typeof raw !== "object" || raw === null) continue;
      const { id, porque } = raw as { id?: unknown; porque?: unknown };
      if (typeof id === "string" && typeof porque === "string" && porque.trim().length > 10) {
        mapa.set(id, porque.trim());
      }
    }
    return mapa.size > 0 ? mapa : null;
  } catch (err) {
    console.warn("[matching] falha/timeout no AI Gateway, usando regras:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Recomenda imóveis para um lead: ranking determinístico por regras + explicações
 * (IA quando há chave de gateway; senão/falha → template honesto por regras).
 * A UI nunca deve afirmar "IA" para itens com fonte "regras".
 */
export async function recomendar(entrada: Entrada): Promise<Resultado> {
  const { supabase, companyId } = await requireCompany();

  const parsed = entradaSchema.safeParse(entrada);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      erro: issue?.message ?? "Preferências inválidas.",
      itens: [],
      usadoIA: false,
    };
  }

  const d = parsed.data;
  if (d.prefs.type && !(TIPOS as readonly string[]).includes(d.prefs.type)) {
    return { ok: false, erro: "Tipo de imóvel inválido.", itens: [], usadoIA: false };
  }
  if (d.prefs.transaction && !(TRANSACOES as readonly string[]).includes(d.prefs.transaction)) {
    return { ok: false, erro: "Transação inválida.", itens: [], usadoIA: false };
  }

  const prefs: Prefs = {
    budgetMax: d.prefs.budgetMax === "" ? null : Number(d.prefs.budgetMax),
    bedroomsMin: d.prefs.bedroomsMin === "" ? null : Number(d.prefs.bedroomsMin),
    neighborhoods: d.prefs.neighborhoods
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20),
    type: d.prefs.type || null,
    transaction: d.prefs.transaction || null,
    notes: d.prefs.notes,
  };

  const { data: lead } = await supabase
    .from("lead")
    .select("id, name")
    .eq("id", d.leadId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!lead) {
    return { ok: false, erro: "Cliente não encontrado nesta empresa.", itens: [], usadoIA: false };
  }

  const { data: imoveis, error } = await supabase
    .from("property")
    .select("id, title, price, bedrooms, neighborhood, transaction, type, photos, code, slug")
    .eq("company_id", companyId)
    .eq("status", "disponivel")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    return { ok: false, erro: `Não foi possível buscar os imóveis: ${error.message}`, itens: [], usadoIA: false };
  }

  const todos: ImovelRanking[] = (imoveis ?? []) as ImovelRanking[];
  if (todos.length === 0) {
    return { ok: true, itens: [], usadoIA: false };
  }

  const comScore = todos
    .map((p) => ({ property: p, score: pontuar(p, prefs) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.property.price - b.property.price ||
        a.property.id.localeCompare(b.property.id),
    )
    .slice(0, 5)
    .map((r) => ({ ...r, porque: "", fonte: "regras" as const }));

  const mapa = await explicacoesIA(lead.name as string, prefs, comScore);

  const itens: ItemRecomendado[] = comScore.map((item) => {
    const porqueIA = mapa?.get(item.property.id);
    return {
      property: item.property,
      score: item.score,
      porque: porqueIA ?? explicacaoRegras(item, prefs),
      fonte: porqueIA ? "ia" : "regras",
    };
  });

  return { ok: true, itens, usadoIA: itens.some((i) => i.fonte === "ia") };
}
