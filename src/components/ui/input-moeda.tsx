"use client";

import { useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { mascaraMoedaBR } from "@/lib/moeda-mascara";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type" | "inputMode"> & {
  defaultValue?: string;
};

/** Campo de valor em reais com mascara "1.234,56". Envia o texto mascarado (o servidor entende o formato BR). */
export function InputMoeda({ defaultValue, placeholder, ...resto }: Props) {
  const [valor, setValor] = useState(() => mascaraMoedaBR(defaultValue ?? ""));
  const ref = useRef<HTMLInputElement>(null);

  // form.reset() limpa o campo mascarado tambem
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const limpar = () => setValor(mascaraMoedaBR(defaultValue ?? ""));
    form.addEventListener("reset", limpar);
    return () => form.removeEventListener("reset", limpar);
  }, [defaultValue]);

  return (
    <input
      {...resto}
      ref={ref}
      type="text"
      inputMode="numeric"
      placeholder={placeholder ?? "0,00"}
      value={valor}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setValor(mascaraMoedaBR(e.target.value))}
    />
  );
}
