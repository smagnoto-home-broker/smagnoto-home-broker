import { test } from "node:test";
import assert from "node:assert/strict";
import { OPCOES_CHAT, emAtendimento, linkWhatsChat, montarMensagemWhats, urlDoImovel } from "./whats-chat";

test("horário de atendimento em Brasília (UTC-3)", () => {
  assert.equal(emAtendimento(new Date("2026-11-03T15:00:00Z")), true); // ter 12h
  assert.equal(emAtendimento(new Date("2026-11-03T11:30:00Z")), false); // ter 8h30
  assert.equal(emAtendimento(new Date("2026-11-06T20:59:00Z")), true); // sex 17h59
  assert.equal(emAtendimento(new Date("2026-11-06T21:00:00Z")), false); // sex 18h
  assert.equal(emAtendimento(new Date("2026-11-07T13:00:00Z")), true); // sáb 10h
  assert.equal(emAtendimento(new Date("2026-11-07T16:00:00Z")), false); // sáb 13h
  assert.equal(emAtendimento(new Date("2026-11-08T15:00:00Z")), false); // dom
});

test("mensagem leva a página do imóvel, sem query nem hash", () => {
  const url = urlDoImovel("https://x.com", "/imovel/demo-terreno");
  assert.equal(url, "https://x.com/imovel/demo-terreno");
  assert.equal(urlDoImovel("https://x.com", "/imoveis"), undefined);
  assert.match(montarMensagemWhats("comprar um imóvel", url), /Estou vendo este imóvel: https:\/\/x\.com\/imovel\/demo-terreno$/);
  assert.doesNotMatch(montarMensagemWhats("alugar um imóvel"), /Estou vendo/);
});

test("link do WhatsApp usa o número oficial e codifica o texto", () => {
  const l = linkWhatsChat("comprar um imóvel");
  assert.ok(l.startsWith("https://wa.me/5519988540008?text="));
  assert.ok(!l.includes(" "));
  assert.ok(OPCOES_CHAT.length >= 2 && OPCOES_CHAT.length <= 5);
});
