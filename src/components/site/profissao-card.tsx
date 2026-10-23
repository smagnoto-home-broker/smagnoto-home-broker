import Image from "next/image";

/**
 * Card de profissão com foto real (Pexels, licença livre) no lugar do vídeo —
 * mesmo formato 3/4 e o mesmo gradiente de legenda do antigo VideoCardProfissao.
 * Cards de listagem ficam leves: nada de WebGL nem de decodificação de vídeo.
 */
export function ProfissaoCard({ nome, foto }: { nome: string; foto: string }) {
  return (
    <article className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/15">
      <Image
        src={foto}
        alt=""
        fill
        sizes="(min-width: 1024px) 210px, (min-width: 640px) 33vw, 45vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(1,36,57,0.18) 0%, rgba(1,36,57,0.05) 45%, rgba(1,36,57,0.88) 100%)",
        }}
      />
      <span className="absolute inset-x-0 bottom-0 p-3 text-xs font-bold uppercase tracking-wide text-white">
        {nome}
      </span>
    </article>
  );
}
