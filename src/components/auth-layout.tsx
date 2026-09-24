import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type AuthLayoutProps = {
    children: ReactNode;
    title: string;
    description: string;
    mode: "sign-in" | "sign-up" | "account";
};

export function AuthLayout({ children, title, description, mode }: AuthLayoutProps) {
    const isSignIn = mode === "sign-in";
    const isAccount = mode === "account";

    return (
        <main className="min-h-dvh bg-[#fbfaf7] text-courier-ink lg:grid lg:grid-cols-[.94fr_1.06fr]">
            <aside className="relative isolate hidden min-h-dvh flex-col overflow-hidden bg-courier-green px-5 py-5 text-white lg:flex lg:px-[clamp(36px,6vw,92px)] lg:py-8">
                <div className="hero-orbit absolute -right-28 -top-36 size-[380px] rounded-full border border-white/10" aria-hidden="true" />
                <div className="hero-orbit hero-orbit-slower absolute -right-8 -top-16 size-[230px] rounded-full border border-white/10" aria-hidden="true" />
                <div className="relative z-10 flex items-center justify-between gap-4">
                    <BrandMark tone="light" />
                </div>

                <div className="animate-enter relative z-10 max-w-[590px] py-10 sm:py-12 lg:my-auto lg:py-16">
                    
                    <h1 className="max-w-[600px] font-display text-[clamp(2.9rem,5.8vw,5.3rem)] font-semibold leading-[.98] tracking-[-.06em]">
                        A little closer, <span className="text-[#f1d39a]">wherever life takes you.</span>
                    </h1>
                    <p className="mt-5 max-w-[440px] text-[14px] leading-6 text-white/75 sm:text-[15px] sm:leading-7">
                        Connect an item that needs a journey with someone already headed that way.
                    </p>
                </div>

                <div className="relative z-10 hidden max-w-[590px] items-center gap-5 rounded-[26px] border border-white/15 bg-white/6 p-4 sm:flex lg:mt-auto lg:p-5">
                    <svg viewBox="0 0 170 112" className="h-[88px] w-[134px] shrink-0 sm:h-[100px] sm:w-[152px]" fill="none" aria-hidden="true">
                        <path d="M18 83c30-2 33-54 68-54s33 51 66 50" stroke="#f1d39a" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 8" />
                        <circle cx="18" cy="83" r="8" fill="#f1d39a" stroke="#145b4c" strokeWidth="4" />
                        <circle cx="152" cy="79" r="8" fill="white" stroke="#145b4c" strokeWidth="4" />
                        <rect x="66" y="48" width="39" height="34" rx="8" fill="white" />
                        <path d="M85.5 48v34m-19.5-22 19.5 9 19.5-9m-27-9 15 8" stroke="#bd8845" strokeWidth="2.5" strokeLinejoin="round" />
                    </svg>
                    <div>
                        <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#f1d39a]">A route already planned</span>
                        <strong className="mt-2 block text-[16px] font-semibold">Lagos <span className="px-1 text-white/50">to</span> your destination</strong>
                        <span className="mt-1.5 block text-[12px] leading-5 text-white/65">You agree on the details before the handoff.</span>
                    </div>
                </div>
            </aside>

            <section className="flex min-h-[620px] flex-col px-5 py-8 sm:px-8 sm:py-10 lg:min-h-dvh lg:px-[clamp(40px,7vw,104px)] lg:py-8">

                <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
                    <BrandMark />
                    <Link className="inline-flex min-h-10 items-center gap-2 rounded-full border border-courier-line bg-white px-3.5 text-[11px] font-semibold text-courier-green transition-colors hover:border-courier-green sm:px-4 sm:text-[12px]" href="/">
                        <span aria-hidden="true">←</span> Home
                    </Link>
                </div>

                <div className="animate-enter-delayed my-auto w-full max-w-[480px] py-8 sm:py-12 lg:mx-auto lg:py-14">
                    <div className="rounded-[30px] border border-courier-line bg-white p-5 sm:rounded-[34px] sm:p-8 lg:p-9">
                        <div className="mb-7 flex items-center justify-between gap-4">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-courier-muted">Secure access</span>
                        </div>
                        <h2 className="font-display text-[clamp(2.35rem,4vw,3.5rem)] font-semibold leading-[1.02] tracking-[-.055em]">{title}</h2>
                        <p className="mt-3 max-w-[390px] text-[14px] leading-6 text-courier-muted">{description}</p>
                        {children}
                        <div className="mt-7 border-t border-courier-line pt-5 text-center text-[12px] text-courier-muted">
                            {isSignIn ? "New to Courier?" : isAccount ? "Returning to Courier?" : "Already have an account?"}{" "}
                            <Link className="font-semibold text-courier-green underline decoration-courier-gold/60 underline-offset-4 transition hover:decoration-courier-green" href={isSignIn ? "/sign-up" : "/sign-in"}>
                                {isSignIn ? "Create an account" : "Sign in"}
                            </Link>
                        </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between px-1 text-[10px] font-medium text-courier-muted">
                        <span></span><Link className="transition-colors hover:text-courier-green" href="/">Return to homepage</Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
