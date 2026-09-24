import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const steps = [
    { number: "1", title: "Post an item or a trip", text: "Add the route and the date. A traveler's existing journey is the starting point." },
    { number: "2", title: "Check the match", text: "Review routes that line up and decide whether the item and timing work for you." },
    { number: "3", title: "Agree and meet", text: "Set the fee and handoff details together. The requester confirms when it arrives." },
];

function Arrow({ className = "size-4" }: { className?: string }) {
    return <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none"><path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ParcelIcon({ className = "size-5" }: { className?: string }) {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none"><path d="m4 8 8-4 8 4v9l-8 4-8-4V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="m4.5 8.2 7.5 4 7.5-4M12 12.5V21M8 6l8 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}

function RouteIcon({ className = "size-5" }: { className?: string }) {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none"><circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.7" /><circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.7" /><path d="M8.5 18H11a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

function RouteIllustration() {
    return (
        <div className="relative mx-auto aspect-[1.1/1] w-full max-w-[540px] overflow-hidden rounded-[34px] bg-[#f6f0e5] p-5 sm:p-7" aria-label="Illustration of a parcel joining a travel route">
            <div className="hero-orbit absolute -right-16 -top-20 size-64 rounded-full bg-[#e7d8bb]" aria-hidden="true" />
            <div className="hero-orbit hero-orbit-slower absolute -bottom-24 -left-16 size-64 rounded-full border-38 border-[#e9ddc6]" aria-hidden="true" />
            <svg viewBox="0 0 520 440" className="relative z-10 h-full w-full" fill="none" role="img" aria-labelledby="route-art-title route-art-description">
                <title id="route-art-title">A parcel travelling along a shared route</title>
                <desc id="route-art-description">A simple map shows a traveler route between Lagos and Abuja, with a parcel joining the journey.</desc>
                <path d="M64 93c61 42 56 111 123 120 58 8 66-50 121-33s51 95 124 108" stroke="#d5c9b2" strokeWidth="2" strokeDasharray="5 10" />
                <path className="route-line-trace" d="M74 100c61 42 56 111 123 120 58 8 66-50 121-33s51 95 124 108" pathLength="1" stroke="#145b4c" strokeWidth="5" strokeLinecap="round" strokeDasharray="1" strokeDashoffset="1" />
                <circle className="route-point-pulse" cx="74" cy="100" r="15" fill="#145b4c" stroke="#fff" strokeWidth="6" />
                <circle className="route-point-pulse route-point-pulse-delayed" cx="442" cy="295" r="15" fill="#bd8845" stroke="#fff" strokeWidth="6" />
                <g className="parcel-float" transform="translate(276 194) rotate(-8)">
                    <rect x="-60" y="-54" width="120" height="108" rx="30" fill="#fff" />
                    <path d="m-31-9 31-16 31 16v37L0 45l-31-17V-9Z" fill="#e4c994" stroke="#9d6c2c" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M0 9v36M-31-9 0 9l31-18M-12-34l31 16" stroke="#9d6c2c" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M-6-21 6-27" stroke="#fff8e8" strokeWidth="8" strokeLinecap="round" />
                </g>
                <g transform="translate(72 42)">
                    <rect width="108" height="34" rx="17" fill="#fff" />
                    <circle cx="17" cy="17" r="5" fill="#145b4c" />
                    <text x="30" y="21" fill="#193d35" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700">LAGOS</text>
                </g>
                <g transform="translate(348 329)">
                    <rect width="112" height="34" rx="17" fill="#fff" />
                    <circle cx="17" cy="17" r="5" fill="#bd8845" />
                    <text x="30" y="21" fill="#193d35" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700">ABUJA</text>
                </g>
                <g transform="translate(175 314)">
                    <rect width="171" height="66" rx="18" fill="#145b4c" />
                    <circle cx="34" cy="33" r="18" fill="#f3d9aa" />
                    <path d="m28 32 5 5 9-10" stroke="#145b4c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="62" y="29" fill="#fff" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700">ROUTE FOUND</text>
                    <text x="62" y="46" fill="#dbe9df" fontFamily="Arial, sans-serif" fontSize="10">A trip already planned</text>
                </g>
                <path d="M90 386h94m180 0h73" stroke="#d5c9b2" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[10px] font-semibold text-courier-green sm:bottom-7 sm:right-7 sm:text-[11px]">
                <span className="size-2 rounded-full bg-courier-gold" /> One shared journey
            </div>
        </div>
    );
}

function ShieldIcon({ className = "size-5" }: { className?: string }) {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none"><path d="M12 3 19 6v5c0 4.7-2.9 8.1-7 10-4.1-1.9-7-5.3-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CheckIcon() {
    return <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function RouteMatchPreview() {
    return (
        <div className="rounded-[32px] bg-courier-green p-4 sm:p-7" role="img" aria-label="Example route match between a Lagos item request and an Abuja trip">
            <div className="mb-5 flex items-center justify-between px-1 text-white">
                <span className="text-[11px] font-bold uppercase tracking-[.13em]">A route match, at a glance</span>
        <span className="rounded-full border border-white/25 px-3 py-1.5 text-[10px] font-medium text-white/75">Example</span>
            </div>
            <div className="rounded-[24px] bg-white p-5 sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.12em] text-courier-muted">Item request</p><p className="mb-0 text-[16px] font-semibold">Lagos</p></div>
                    <span className="h-px flex-1 border-t border-dashed border-courier-green/50" aria-hidden="true" />
                    <div className="text-right"><p className="mb-1 text-[10px] font-bold uppercase tracking-[.12em] text-courier-muted">Trip destination</p><p className="mb-0 text-[16px] font-semibold">Abuja</p></div>
                </div>
                <div className="relative mb-5 flex items-center justify-between px-2" aria-hidden="true">
                    <span className="z-10 grid size-9 place-items-center rounded-full bg-[#e9f0eb] text-courier-green"><ParcelIcon /></span>
                    <span className="absolute left-[13%] right-[13%] h-px bg-[#dfe8e1]" />
          <span className="route-match-pulse z-10 grid size-11 place-items-center rounded-full bg-[#f3e8d3] text-courier-gold"><RouteIcon /></span>
                    <span className="z-10 grid size-9 place-items-center rounded-full bg-[#e9f0eb] text-courier-green"><ShieldIcon /></span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8f6] px-4 py-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-courier-green text-white"><CheckIcon /></span>
                    <span><span className="block text-[12px] font-semibold">The journey could fit</span><span className="mt-0.5 block text-[11px] text-courier-muted">Both people review timing and details.</span></span>
                </div>
            </div>
        </div>
    );
}

function ParcelScene() {
    return (
        <svg viewBox="0 0 210 175" className="parcel-scene-graphic h-[120px] w-[145px] shrink-0 sm:h-[174px] sm:w-[205px]" fill="none" role="img" aria-label="A wrapped parcel ready to travel">
            <circle cx="119" cy="88" r="69" fill="#e8d8b9" />
            <path d="M30 148h151" stroke="#cdbb99" strokeWidth="2" strokeLinecap="round" />
            <g transform="translate(108 89) rotate(-7)">
                <rect x="-46" y="-38" width="92" height="78" rx="12" fill="#fffdf8" stroke="#d3bc8e" strokeWidth="2" />
                <path d="M0-38v78M-46-11 0 9l46-20M-17-33l34 16" stroke="#bd8845" strokeWidth="5" strokeLinejoin="round" />
                <path d="M-7-38c0-17 20-17 20 0" stroke="#bd8845" strokeWidth="5" strokeLinecap="round" />
            </g>
            <circle cx="43" cy="52" r="18" fill="#145b4c" />
            <path d="M39 52h8m-4-4 4 4-4 4" stroke="#f1d39a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="173" cy="132" r="8" fill="#145b4c" />
        </svg>
    );
}

function TravelerScene() {
    return (
        <svg viewBox="0 0 210 175" className="traveler-scene-graphic h-[120px] w-[145px] shrink-0 sm:h-[174px] sm:w-[205px]" fill="none" role="img" aria-label="A traveler following a planned route">
            <circle cx="116" cy="89" r="69" fill="#d9e6dc" />
            <path d="M28 147h151" stroke="#bfd2c4" strokeWidth="2" strokeLinecap="round" />
            <path d="M42 120c29-3 33-39 65-39 27 0 32 31 62 25" stroke="#145b4c" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
            <circle cx="42" cy="120" r="8" fill="#bd8845" stroke="#fff" strokeWidth="4" />
            <circle cx="169" cy="106" r="8" fill="#145b4c" stroke="#fff" strokeWidth="4" />
            <g transform="translate(107 83)">
                <circle cy="-29" r="15" fill="#d9a875" />
                <path d="M-25 35c1-23 9-38 25-38s24 15 25 38H-25Z" fill="#145b4c" />
                <path d="M-12 4 0 20 12 4" stroke="#f1d39a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m12 17 21 7v22H11V25" fill="#f8f4eb" stroke="#bd8845" strokeWidth="2" strokeLinejoin="round" />
            </g>
        </svg>
    );
}

function HandoffScene() {
    return (
        <div className="relative z-10 overflow-hidden rounded-[32px] bg-[#f3e8d3] p-4 sm:p-7" role="img" aria-label="Illustration of two people meeting to hand over a parcel">
            <svg viewBox="0 0 560 390" className="h-auto w-full" fill="none" aria-hidden="true">
                <circle cx="280" cy="196" r="155" fill="#e8d8b9" />
                <path d="M30 339h500" stroke="#ccb993" strokeWidth="2" strokeLinecap="round" />
                <path d="M73 339c4-71 30-115 82-115 51 0 79 44 83 115H73Z" fill="#145b4c" />
                <circle cx="155" cy="166" r="43" fill="#bd875e" />
                <path d="M111 165c0-43 19-66 47-66 31 0 45 22 44 55-17-4-31-13-40-26-10 19-28 30-51 37Z" fill="#263d35" />
                <path d="M405 339c4-71 30-115 82-115 23 0 42 10 56 28v87H405Z" fill="#bd8845" />
                <circle cx="449" cy="166" r="43" fill="#8d5c42" />
                <path d="M407 162c3-40 19-63 47-63 29 0 44 21 44 55-27-2-48-11-63-27-6 14-16 26-28 35Z" fill="#243d35" />
                <path d="M208 251c24-14 48-23 72-23s48 9 72 23" stroke="#f6f0e5" strokeWidth="20" strokeLinecap="round" />
                <path d="M196 246c27 1 48 18 61 39m107-39c-27 1-48 18-61 39" stroke="#d6a37a" strokeWidth="17" strokeLinecap="round" />
                <g className="handoff-parcel" transform="translate(280 282)">
                    <rect x="-39" y="-31" width="78" height="62" rx="10" fill="#fffdf8" stroke="#bd8845" strokeWidth="2" />
                    <path d="M0-31v62M-39-10 0 7l39-17M-12-27l24 12" stroke="#bd8845" strokeWidth="4" strokeLinejoin="round" />
                </g>
                <path d="M223 199h30m54 0h30" stroke="#145b4c" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 7" />
            </svg>
            <div className="mt-1 flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3.5 text-courier-ink sm:px-5">
                <span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#e8f0ea] text-courier-green"><ShieldIcon /></span><span><span className="block text-[12px] font-semibold">A clear handoff</span><span className="mt-0.5 block text-[11px] text-courier-muted">Confirmed by the requester</span></span></span>
                <span className="hidden rounded-full bg-[#f3e8d3] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-courier-gold sm:inline-flex">Together</span>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <main id="top" className="min-h-screen overflow-hidden bg-white text-courier-ink">
            <header className="sticky top-0 z-40 border-b border-courier-line bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex min-h-[76px] w-full max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-12">
                    <BrandMark />
                    <nav className="hidden items-center gap-9 text-[13px] font-medium text-courier-ink md:flex" aria-label="Main navigation">
                        <a className="transition-colors hover:text-courier-green" href="#how-it-works">How it works</a>
                        <a className="transition-colors hover:text-courier-green" href="#for-everyone">For senders &amp; travelers</a>
                        <a className="transition-colors hover:text-courier-green" href="#handoff">Safe handoffs</a>
                    </nav>
                    <div className="flex items-center gap-3 sm:gap-5">
                        <Link className="hidden min-h-10 items-center text-[12px] font-semibold text-courier-ink hover:text-courier-green min-[360px]:inline-flex" href="/sign-in">Sign in</Link>
                        <Link className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-courier-green px-3.5 text-[11px] font-semibold text-white transition-colors hover:bg-courier-green-deep sm:min-h-12 sm:gap-3 sm:px-5 sm:text-[12px]" href="/sign-up">Get started <Arrow className="size-4 transition-transform group-hover:translate-x-1" /></Link>
                    </div>
                </div>
            </header>

            <section className="relative overflow-hidden bg-courier-green text-white" aria-labelledby="hero-title">
                    <div className="hero-orbit absolute -right-32 -top-48 size-[470px] rounded-full border border-white/10 sm:size-[620px]" aria-hidden="true" />
                    <div className="hero-orbit hero-orbit-slower absolute -right-8 -top-24 size-[330px] rounded-full border border-white/10 sm:size-[470px]" aria-hidden="true" />
                <div className="relative mx-auto grid w-full max-w-[1320px] items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:min-h-[710px] lg:grid-cols-[.92fr_1.08fr] lg:gap-14 lg:px-12 lg:py-24">
                    <div className="animate-enter max-w-[600px]">
                        <h1 id="hero-title" className="max-w-[640px] text-[clamp(3rem,6vw,5.5rem)] font-bold leading-[.99] tracking-[-.06em] text-white">
                            Send with someone <span className="text-[#f1d39a]">already headed there.</span>
                        </h1>
                        <p className="mt-6 max-w-[500px] text-[16px] leading-7 text-white/80 sm:text-[18px] sm:leading-8">
                            Courier connects an item that needs a journey with a traveler already heading there. Agree on the details, meet, and confirm the handoff together.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link href="/sign-up" className="group inline-flex min-h-14 items-center gap-5 rounded-full bg-[#f1d39a] px-6 text-[13px] font-bold text-courier-ink transition-colors hover:bg-white">Send an item <Arrow className="size-4 transition-transform group-hover:translate-x-1" /></Link>
                            <a href="#for-everyone" className="inline-flex min-h-14 items-center gap-2 rounded-full border border-white/35 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-white/10">I have a trip <Arrow className="size-4 text-[#f1d39a]" /></a>
                        </div>
                        <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-[11px] font-medium text-white/75">
                            <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[#f1d39a]" />You choose the match</span>
                            <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-white" />You agree before delivery</span>
                        </div>
                    </div>
                    <div className="animate-enter-delayed relative w-full lg:justify-self-end lg:max-w-[600px]">
                        <RouteIllustration />
                        <div className="absolute -bottom-5 left-2 flex items-center gap-3 rounded-2xl border border-[#d7e2d9] bg-white px-4 py-3 text-courier-ink sm:bottom-5 sm:-left-5 sm:px-5 sm:py-4">
                            <span className="grid size-10 place-items-center rounded-full bg-[#f3ead8] text-courier-gold"><ParcelIcon /></span>
                            <span><span className="block text-[11px] font-bold">Request meets route</span><span className="mt-1 block text-[10px] text-courier-muted">A clearer way to send</span></span>
                        </div>
                    </div>
                </div>
            </section>


            <section className="border-b border-courier-line bg-[#fbfaf7]" aria-label="Courier commitments">
                <div className="mx-auto grid max-w-[1320px] gap-5 px-5 py-7 sm:grid-cols-3 sm:px-8 sm:py-8 lg:px-12">
                    <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f2e6cd] text-courier-gold"><RouteIcon /></span><span className="text-[13px] font-semibold sm:text-[14px]">A trip already planned</span></div>
                    <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e5eee8] text-courier-green"><ParcelIcon /></span><span className="text-[13px] font-semibold sm:text-[14px]">Clear terms before handoff</span></div>
                    <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f2e6cd] text-courier-gold"><ShieldIcon /></span><span className="text-[13px] font-semibold sm:text-[14px]">Requester confirms arrival</span></div>
                </div>
            </section>

            <section id="how-it-works" className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
                <div className="mb-10 flex flex-col justify-between gap-5 border-b border-courier-line pb-7 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.15em] text-courier-gold">The journey, made simple</p>
                        <h2 className="mb-0 max-w-[680px] text-[clamp(2.2rem,4vw,3.7rem)] font-semibold leading-[1.04] tracking-tighter">A good handoff starts with a good match.</h2>
                    </div>
                    <p className="mb-1 max-w-[390px] text-[14px] leading-6 text-courier-muted">Each person chooses what works for them, from the route to the meetup plan.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {steps.map((step, index) => (
                            <article className={`reveal-on-scroll relative overflow-hidden rounded-[28px] border p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-8 ${index === 1 ? "border-courier-green bg-courier-green text-white" : "border-courier-line bg-white"}`} key={step.number}>
                            <div className="mb-10 flex items-center justify-between">
                                <span className={`font-mono text-[13px] font-bold ${index === 1 ? "text-[#f1d39a]" : "text-courier-gold"}`}>0{step.number}</span>
                                <span className={`grid size-12 place-items-center rounded-full ${index === 1 ? "bg-white/10 text-[#f1d39a]" : "bg-[#f5f0e6] text-courier-green"}`}>{index === 0 ? <ParcelIcon /> : index === 1 ? <RouteIcon /> : <ShieldIcon />}</span>
                            </div>
                            <h3 className="mb-3 text-[20px] font-semibold tracking-[-.03em]">{step.title}</h3>
                            <p className={`mb-0 max-w-[310px] text-[14px] leading-6 ${index === 1 ? "text-white/75" : "text-courier-muted"}`}>{step.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="overflow-hidden bg-[#f6f0e5]" aria-labelledby="match-title">
                <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.86fr_1.14fr] lg:gap-16 lg:px-12 lg:py-24">
                    <div>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.15em] text-courier-green">Routes that line up</p>
                        <h2 id="match-title" className="mb-5 max-w-[520px] text-[clamp(2.1rem,4vw,3.5rem)] font-semibold leading-[1.04] tracking-tighter">One shared route can make the difference.</h2>
                        <p className="mb-7 max-w-[460px] text-[14px] leading-6 text-courier-muted sm:text-[15px]">Add the destination and timing. Courier helps surface trips that could suit the request, so both people can decide if the details fit.</p>
                        <a href="#for-everyone" className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-courier-green px-5 text-[12px] font-semibold text-courier-green transition-colors hover:bg-courier-green hover:text-white">See how to get started <Arrow className="size-4 transition-transform group-hover:translate-x-1" /></a>
                    </div>
                    <div className="reveal-on-scroll"><RouteMatchPreview /></div>
                </div>
            </section>

            <section id="for-everyone" className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
                <div className="mb-10 grid gap-5 md:grid-cols-[1fr_.7fr] md:items-end">
                    <div>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.15em] text-courier-gold">One service, two sides of the journey</p>
                        <h2 className="mb-0 max-w-[680px] text-[clamp(2.1rem,4vw,3.5rem)] font-semibold leading-[1.04] tracking-tighter">A useful connection for both of you.</h2>
                    </div>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                    <article className="reveal-on-scroll group overflow-hidden rounded-[30px] border border-[#e6dac3] bg-white transition-transform duration-300 hover:-translate-y-1">
                        <div className="flex min-h-[250px] flex-col items-start justify-between gap-3 overflow-hidden bg-[#f5eee1] px-6 py-6 sm:min-h-[220px] sm:flex-row sm:items-center sm:gap-4 sm:px-9 sm:py-7">
                            <div className="max-w-[280px]"><span className="mb-4 inline-flex rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-courier-gold">For senders</span><p className="mb-0 text-[23px] font-semibold leading-tight tracking-[-.04em] text-courier-ink sm:text-[28px]">Something needs to get there.</p></div>
                            <ParcelScene />
                        </div>
                        <div className="px-6 py-7 sm:px-9 sm:py-8">
                            <p className="mb-6 max-w-[440px] text-[14px] leading-6 text-courier-muted">Share what you need carried, where it is going, and when it should arrive. Then review travelers whose trips may fit.</p>
                            <Link href="/sign-up" className="group/link inline-flex min-h-12 items-center gap-3 rounded-full bg-courier-green px-5 text-[12px] font-semibold text-white transition-colors hover:bg-courier-green-deep">Post an item request <Arrow className="size-4 transition-transform group-hover/link:translate-x-1" /></Link>
                        </div>
                    </article>
                    <article className="reveal-on-scroll group overflow-hidden rounded-[30px] border border-[#d6e2d9] bg-white transition-transform duration-300 hover:-translate-y-1">
                        <div className="flex min-h-[250px] flex-col items-start justify-between gap-3 overflow-hidden bg-[#eaf1eb] px-6 py-6 sm:min-h-[220px] sm:flex-row sm:items-center sm:gap-4 sm:px-9 sm:py-7">
                            <div className="max-w-[280px]"><span className="mb-4 inline-flex rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-courier-green">For travelers</span><p className="mb-0 text-[23px] font-semibold leading-tight tracking-[-.04em] text-courier-ink sm:text-[28px]">Already on your way?</p></div>
                            <TravelerScene />
                        </div>
                        <div className="px-6 py-7 sm:px-9 sm:py-8">
                            <p className="mb-6 max-w-[440px] text-[14px] leading-6 text-courier-muted">Share a journey you already plan to make. Look through requests, and choose whether anything suits your route.</p>
                            <Link href="/sign-up" className="group/link inline-flex min-h-12 items-center gap-3 rounded-full border border-courier-green px-5 text-[12px] font-semibold text-courier-green transition-colors hover:bg-[#eef4ef]">Share a trip <Arrow className="size-4 transition-transform group-hover/link:translate-x-1" /></Link>
                        </div>
                    </article>
                </div>
            </section>

            <section id="handoff" className="overflow-hidden bg-courier-green text-white" aria-labelledby="handoff-title">
                <div className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:gap-16 lg:px-12 lg:py-24">
                    <div className="absolute -left-32 -top-32 size-[420px] rounded-full border border-white/10 sm:size-[560px]" aria-hidden="true" />
                    <div className="relative z-10">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.15em] text-[#f1d39a]">Clear from agreement to arrival</p>
                        <h2 id="handoff-title" className="mb-5 max-w-[550px] text-[clamp(2.2rem,4.2vw,3.8rem)] font-semibold leading-[1.03] tracking-tighter">The details matter. Keep them in the open.</h2>
                        <p className="mb-8 max-w-[490px] text-[14px] leading-6 text-white/75 sm:text-[15px]">Both people review the item, fee, and handoff plan before moving ahead. Once they meet, the requester confirms whether the item arrived.</p>
                        <ul className="grid gap-4">
                            <li className="flex items-start gap-3"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#f1d39a] text-courier-green"><CheckIcon /></span><span><strong className="block text-[14px] font-semibold">Agree on the complete terms</strong><span className="mt-1 block text-[12px] leading-5 text-white/70">Fee and handoff details are accepted before the agreement proceeds.</span></span></li>
                            <li className="flex items-start gap-3"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#f1d39a] text-courier-green"><CheckIcon /></span><span><strong className="block text-[14px] font-semibold">Meet using the agreed plan</strong><span className="mt-1 block text-[12px] leading-5 text-white/70">Coordinate the meetup with each other and follow the agreed details.</span></span></li>
                            <li className="flex items-start gap-3"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#f1d39a] text-courier-green"><CheckIcon /></span><span><strong className="block text-[14px] font-semibold">Requester confirms delivery</strong><span className="mt-1 block text-[12px] leading-5 text-white/70">The receiver confirms arrival; the traveler cannot do it on their behalf.</span></span></li>
                        </ul>
                    </div>
                    <div className="reveal-on-scroll"><HandoffScene /></div>
                </div>
            </section>

            <section className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28" aria-labelledby="faq-title">
                <div className="grid gap-10 md:grid-cols-[.72fr_1.28fr] md:gap-20">
                    <div>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.15em] text-courier-gold">A few useful details</p>
                        <h2 id="faq-title" className="mb-0 max-w-[410px] text-[clamp(2.1rem,4vw,3.5rem)] font-semibold leading-[1.04] tracking-tighter">Good to know before you go.</h2>
                    </div>
                    <div className="divide-y divide-courier-line border-y border-courier-line">
                        <details className="group py-5 sm:py-6">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[14px] font-semibold sm:text-[16px]">Does the traveler make a special trip for an item?<span className="grid size-8 shrink-0 place-items-center rounded-full border border-courier-line text-[20px] font-normal text-courier-green transition-transform group-open:rotate-45">+</span></summary>
                            <p className="mb-0 mt-3 max-w-[620px] text-[13px] leading-6 text-courier-muted">Courier is designed to connect a request with a traveler who is already planning to go that way.</p>
                        </details>
                        <details className="group py-5 sm:py-6">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[14px] font-semibold sm:text-[16px]">Who decides the delivery fee?<span className="grid size-8 shrink-0 place-items-center rounded-full border border-courier-line text-[20px] font-normal text-courier-green transition-transform group-open:rotate-45">+</span></summary>
                            <p className="mb-0 mt-3 max-w-[620px] text-[13px] leading-6 text-courier-muted">The traveler proposes a fee. The requester reviews and accepts the full terms before the agreement proceeds.</p>
                        </details>
                        <details className="group py-5 sm:py-6">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[14px] font-semibold sm:text-[16px]">Who confirms the item has arrived?<span className="grid size-8 shrink-0 place-items-center rounded-full border border-courier-line text-[20px] font-normal text-courier-green transition-transform group-open:rotate-45">+</span></summary>
                            <p className="mb-0 mt-3 max-w-[620px] text-[13px] leading-6 text-courier-muted">The requester confirms receipt after the handoff. The traveler cannot confirm delivery on the requester&apos;s behalf.</p>
                        </details>
                        <details className="group py-5 sm:py-6">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[14px] font-semibold sm:text-[16px]">Can I be both a requester and a traveler?<span className="grid size-8 shrink-0 place-items-center rounded-full border border-courier-line text-[20px] font-normal text-courier-green transition-transform group-open:rotate-45">+</span></summary>
                            <p className="mb-0 mt-3 max-w-[620px] text-[13px] leading-6 text-courier-muted">Yes. One account lets you post item requests and share journeys.</p>
                        </details>
                    </div>
                </div>
            </section>

            <section className="bg-courier-gold text-courier-ink">
                <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-5 py-14 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between lg:px-12 lg:py-20">
                    <div className="max-w-[760px]">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.15em] text-courier-ink/70">Make your next journey count</p>
                        <h2 className="mb-3 text-[clamp(2.2rem,4vw,3.7rem)] font-bold leading-[1.02] tracking-tighter">Your route might be just what someone needs.</h2>
                        <p className="mb-0 max-w-[620px] text-[15px] leading-6 text-courier-ink/80">Share a trip you already plan to make and see which requests may fit.</p>
                    </div>
                    <Link href="/sign-up" className="group inline-flex min-h-14 shrink-0 items-center justify-between gap-8 rounded-full bg-courier-green px-6 text-[13px] font-semibold text-white transition-colors hover:bg-courier-green-deep">Share your trip <Arrow className="size-4 transition-transform group-hover:translate-x-1" /></Link>
                </div>
            </section>

            <footer className="bg-[#fbfaf7]">
                <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
                    <div><BrandMark /><p className="mb-0 mt-3 text-[12px] text-courier-muted">A better way to carry what matters.</p></div>
                    <nav className="flex flex-wrap gap-x-6 gap-y-3 text-[12px] font-medium text-courier-muted" aria-label="Footer navigation">
                        <a className="transition-colors hover:text-courier-green" href="#how-it-works">How it works</a><a className="transition-colors hover:text-courier-green" href="#for-everyone">For everyone</a><a className="transition-colors hover:text-courier-green" href="#handoff">Handoffs</a><Link className="transition-colors hover:text-courier-green" href="/sign-in">Sign in</Link>
                    </nav>
                    <span className="text-[11px] font-medium text-courier-muted">© {new Date().getFullYear()} Courier</span>
                </div>
            </footer>
        </main>
    );
}
