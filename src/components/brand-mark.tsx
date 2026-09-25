import Link from "next/link";

export function BrandMark({ tone = "default" }: { tone?: "default" | "light" }) {
  const isLight = tone === "light";

  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="Courier home">
      <span className={`grid size-9 place-items-center rounded-xl border text-current transition-colors ${isLight ? "border-white/60 text-white group-hover:bg-white group-hover:text-courier-green" : "border-courier-green text-courier-green group-hover:bg-courier-green group-hover:text-white"}`}>
        <svg viewBox="0 0 36 36" className="size-5.5" fill="none" aria-hidden="true">
          <path d="M18 3.75c5.45 0 9.87 4.42 9.87 9.87 0 7.4-9.87 18.63-9.87 18.63S8.13 21.02 8.13 13.62c0-5.45 4.42-9.87 9.87-9.87Z" fill="currentColor" />
          <path d="M13 14.2h10m-10 4h7" stroke={isLight ? "#145b4c" : "white"} strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="10.8" r="1.1" fill={isLight ? "#145b4c" : "white"} />
        </svg>
      </span>
      <span className={`font-display text-[23px] leading-none tracking-[-.055em] sm:text-[25px] ${isLight ? "text-white" : "text-courier-ink"}`}>courier<span className={isLight ? "text-[#f1d39a]" : "text-courier-gold"}>.</span></span>
    </Link>
  );
}
