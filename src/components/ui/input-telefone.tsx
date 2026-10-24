"use client";

import { useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { mascaraTelefoneBR } from "@/lib/telefone";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "type" | "inputMode" | "maxLength"
> & {
  /** Modo controlado: passe `value` e receba o texto ja mascarado em `onValor`. */
  value?: string;
  /** Modo livre (formularios com FormData): valor inicial, ja pode vir sem mascara. */
  defaultValue?: string | null;
  onValor?: (valor: string) => void;
};

/** Campo de telefone/WhatsApp com mascara "+55 19 99955-1205". */
export function InputTelefone({ value, defaultValue, onValor, placeholder, ...resto }: Props) {
  const [interno, setInterno] = useState(() => mascaraTelefoneBR(defaultValue ?? ""));
  const controlado = value !== undefined;
  const atual = controlado ? mascaraTelefoneBR(value) : interno;

  function aoMudar(e: ChangeEvent<HTMLInputElement>) {
    const v = mascaraTelefoneBR(e.target.value);
    if (!controlado) setInterno(v);
    onValor?.(v);
  }

  return (
    <input
      {...resto}
      type="tel"
      inputMode="tel"
      maxLength={20}
      placeholder={placeholder ?? "+55 19 99955-1205"}
      value={atual}
      onChange={aoMudar}
    />
  );
}
