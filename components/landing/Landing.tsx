"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { LocalizedText } from "@/lib/contracts";
import { useT } from "@/lib/i18n";
import { Gem } from "@/components/SiteHeader";

const REPO_URL = "https://github.com/WinstonTa/Glendale2Biz";
const L = (en: string, es: string, hy: string): LocalizedText => ({ en, es, hy });

const T = {
  tryDemo: L("Try out the demo!", "¡Prueba la demo!", "Փորձեք դեմոն։"),
  seeGithub: L("See the project on Github!", "¡Mira el proyecto en GitHub!", "Տեսեք նախագիծը GitHub-ում։"),
  scroll: L("Scroll to learn more", "Desliza para saber más", "Ոլորեք՝ ավելին իմանալու համար"),
  problemKicker: L("The problem", "El problema", "Խնդիրը"),
  problem: L(
    "Too many Glendale founders sign a lease before they learn their business isn't allowed there.",
    "Demasiados emprendedores de Glendale firman un contrato de alquiler antes de saber que su negocio no está permitido allí.",
    "Գլենդեյլի շատ ձեռներեցներ վարձակալության պայմանագիր են ստորագրում՝ նախքան իմանալը, որ իրենց բիզնեսն այնտեղ թույլատրված չէ։",
  ),
  problemSub: L(
    "The answers are spread across city, county, state and federal websites, mostly in English. Glendale2Biz puts them in one place, for your address, in your language.",
    "Las respuestas están repartidas entre sitios de la ciudad, el condado, el estado y el gobierno federal, casi siempre en inglés. Glendale2Biz las reúne en un solo lugar, para su dirección y en su idioma.",
    "Պատասխանները ցրված են քաղաքային, շրջանային, նահանգային և դաշնային կայքերում, հիմնականում անգլերենով։ Glendale2Biz-ը դրանք հավաքում է մեկ տեղում՝ ձեր հասցեի համար, ձեր լեզվով։",
  ),
  howKicker: L("How it works", "Cómo funciona", "Ինչպես է աշխատում"),
  steps: [
    {
      title: L("1. Tell us your idea", "1. Cuéntenos su idea", "1. Պատմեք ձեր գաղափարը"),
      body: L(
        "Pick from 16 business types, or just describe it: “boba tea shop” works.",
        "Elija entre 16 tipos de negocio o simplemente descríbalo: “tienda de té boba” funciona.",
        "Ընտրեք 16 բիզնեսի տեսակներից կամ պարզապես նկարագրեք այն։",
      ),
      img: "/landing/picker.jpg",
      alt: L("Business picker with a boba shop matched", "Selector de negocios con una tienda de boba", "Բիզնեսի ընտրիչ"),
    },
    {
      title: L("2. Check your address", "2. Revise su dirección", "2. Ստուգեք ձեր հասցեն"),
      body: L(
        "Live City of Glendale GIS data gives the zoning at your address and a plain-language verdict: likely allowed, needs a permit, or likely not allowed.",
        "Datos SIG en vivo de la Ciudad de Glendale muestran la zonificación de su dirección y un veredicto claro: probablemente permitido, requiere permiso o probablemente no permitido.",
        "Գլենդեյլ քաղաքի GIS ուղիղ տվյալները ցույց են տալիս ձեր հասցեի գոտիավորումը և պարզ եզրակացություն՝ հավանաբար թույլատրված է, պահանջում է թույլտվություն, թե հավանաբար թույլատրված չէ։",
      ),
      img: "/landing/verdict.jpg",
      alt: L("Likely allowed verdict for 613 E Broadway", "Veredicto probablemente permitido", "Եզրակացություն՝ հավանաբար թույլատրված է"),
    },
    {
      title: L("3. See what's around you", "3. Vea lo que le rodea", "3. Տեսեք ձեր շրջակայքը"),
      body: L(
        "Wildfire, flood, earthquake and dam inundation zones that affect insurance and build-out, plus nearby schools, parks, bus stops and fire stations.",
        "Zonas de incendio forestal, inundación, sismos y ruptura de presas que afectan el seguro y la obra, además de escuelas, parques, paradas de autobús y estaciones de bomberos cercanas.",
        "Հրդեհի, ջրհեղեղի, երկրաշարժի և ամբարտակի ողողման գոտիներ, որոնք ազդում են ապահովագրության և շինարարության վրա, ինչպես նաև մոտակա դպրոցներ, այգիներ, կանգառներ և հրշեջ կայաններ։",
      ),
      img: "/landing/hazards.jpg",
      alt: L("Hazard zones and nearby resources for 2900 Honolulu Ave", "Zonas de riesgo y recursos cercanos", "Վտանգի գոտիներ և մոտակա ռեսուրսներ"),
    },
    {
      title: L("4. Follow your roadmap", "4. Siga su hoja de ruta", "4. Հետևեք ձեր ճանապարհային քարտեզին"),
      body: L(
        "An ordered checklist from Plan to Open, with the agency, official link, cost, time, and why each step applies to you.",
        "Una lista ordenada de Planear a Abrir, con la agencia, el enlace oficial, el costo, el tiempo y por qué cada paso le aplica.",
        "Հերթական ցուցակ՝ պլանավորումից մինչև բացում, գործակալությամբ, պաշտոնական հղումով, արժեքով, ժամկետով և թե ինչու է յուրաքանչյուր քայլը վերաբերում ձեզ։",
      ),
      img: "/landing/roadmap.jpg",
      alt: L("Personalized launch roadmap", "Hoja de ruta personalizada", "Անհատական ճանապարհային քարտեզ"),
    },
  ],
  statsKicker: L("Built on real data", "Basado en datos reales", "Հիմնված է իրական տվյալների վրա"),
  stats: [
    { n: 2426, label: L("City zoning areas mapped", "Áreas de zonificación mapeadas", "Քարտեզագրված գոտիավորման տարածքներ") },
    { n: 16, label: L("Business types", "Tipos de negocio", "Բիզնեսի տեսակներ") },
    { n: 4, label: L("Hazard layers checked", "Capas de riesgo revisadas", "Ստուգված վտանգի շերտեր") },
    { n: 3, label: L("Languages", "Idiomas", "Լեզուներ") },
  ],
  langKicker: L("In your language", "En su idioma", "Ձեր լեզվով"),
  langTitle: L(
    "English, Español and Հայերեն, from the first click to the last document.",
    "English, Español y Հայերեն, desde el primer clic hasta el último documento.",
    "English, Español և Հայերեն՝ առաջին սեղմումից մինչև վերջին փաստաթուղթը։",
  ),
  langBody: L(
    "Glendale is home to one of the largest Armenian communities outside Armenia and a large Latino community. Every screen, verdict, roadmap step and document switches with one tap.",
    "Glendale alberga una de las comunidades armenias más grandes fuera de Armenia y una gran comunidad latina. Cada pantalla, veredicto, paso y documento cambia con un toque.",
    "Գլենդեյլում է Հայաստանից դուրս ամենամեծ հայկական համայնքներից մեկը և մեծ լատինաամերիկյան համայնք։ Յուրաքանչյուր էկրան, եզրակացություն, քայլ և փաստաթուղթ փոխվում է մեկ հպումով։",
  ),
  legalKicker: L("LegalTech", "Tecnología legal", "Իրավական տեխնոլոգիա"),
  legalTitle: L(
    "Paperwork, pre-filled. Before you sign anything.",
    "Trámites prellenados. Antes de firmar nada.",
    "Փաստաթղթերը՝ նախապես լրացված։ Նախքան որևէ բան ստորագրելը։",
  ),
  legalBody: L(
    "Get a ready-to-send zoning inquiry to Glendale Planning, an LA County Fictitious Business Name worksheet, and a one-page launch summary. Drafts for your preparation, clearly marked “not legal advice”.",
    "Obtenga una consulta de zonificación lista para enviar a Planificación de Glendale, una hoja de trabajo de Nombre Comercial Ficticio del Condado de LA y un resumen de una página. Borradores para su preparación, marcados claramente como “no es asesoría legal”.",
    "Ստացեք Գլենդեյլի Պլանավորման բաժնին ուղարկելու պատրաստ գոտիավորման հարցում, LA շրջանի ֆիկտիվ բիզնես անվան աշխատաթերթ և մեկ էջանոց ամփոփում։ Նախագծեր՝ ձեր նախապատրաստման համար, հստակ նշված «իրավաբանական խորհուրդ չէ»։",
  ),
  ctaTitle: L("From idea to open doors.", "De la idea a abrir sus puertas.", "Գաղափարից մինչև բաց դռներ։"),
  builtWith: L(
    "Built at Jewel City Hacks 6.0 with Next.js, the Glendale GIS MCP, and Vercel.",
    "Creado en Jewel City Hacks 6.0 con Next.js, el Glendale GIS MCP y Vercel.",
    "Ստեղծված է Jewel City Hacks 6.0-ում՝ Next.js-ով, Glendale GIS MCP-ով և Vercel-ով։",
  ),
};

function GithubMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function CtaButtons({ lt, className = "" }: { lt: (t: LocalizedText) => string; className?: string }) {
  return (
    <div className={`flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center ${className}`}>
      <Link href="/demo" className="landing-btn landing-btn-primary" data-cta>
        <Gem className="h-6 w-6" />
        {lt(T.tryDemo)}
      </Link>
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="landing-btn landing-btn-github" data-cta>
        <GithubMark className="h-6 w-6" />
        {lt(T.seeGithub)}
      </a>
    </div>
  );
}

export function Landing() {
  const { lt } = useT();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero: buttons rise in, gems drift.
        gsap.from(".hero-cta [data-cta]", { y: 40, opacity: 0, scale: 0.9, duration: 0.9, stagger: 0.15, ease: "back.out(1.7)" });
        gsap.from(".scroll-cue", { opacity: 0, y: -10, delay: 0.9, duration: 0.6 });
        gsap.to(".scroll-cue-arrow", { y: 8, repeat: -1, yoyo: true, duration: 0.8, ease: "sine.inOut" });
        gsap.utils.toArray<HTMLElement>(".float-gem").forEach((el, i) => {
          gsap.to(el, { y: i % 2 ? 24 : -24, rotate: i % 2 ? 12 : -12, duration: 3 + i, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(el, { yPercent: -60 * (i + 1), ease: "none", scrollTrigger: { trigger: ".landing-hero", start: "top top", end: "bottom top", scrub: true } });
        });

        // Problem statement: words light up as you scroll.
        gsap.fromTo(
          ".problem-word",
          { opacity: 0.15 },
          { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: ".problem", start: "top 75%", end: "bottom 55%", scrub: true } },
        );
        gsap.from(".problem-sub", { y: 30, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ".problem-sub", start: "top 85%" } });

        // Steps: text and screenshots slide in from opposite sides.
        gsap.utils.toArray<HTMLElement>(".step-row").forEach((row, i) => {
          const dir = i % 2 ? -1 : 1;
          gsap.from(row.querySelector(".step-text"), {
            x: -60 * dir, opacity: 0, duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 80%" },
          });
          gsap.from(row.querySelector(".step-shot"), {
            x: 80 * dir, rotate: 4 * dir, opacity: 0, duration: 1.1, ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 80%" },
          });
          gsap.to(row.querySelector(".step-shot img"), {
            yPercent: -8, ease: "none",
            scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: true },
          });
        });

        // Stats: count up.
        gsap.utils.toArray<HTMLElement>(".stat-num").forEach((el) => {
          const target = Number(el.dataset.target ?? 0);
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 1.8, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
            onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString("en-US"); },
          });
        });
        gsap.from(".stat", { y: 40, opacity: 0, stagger: 0.12, duration: 0.7, scrollTrigger: { trigger: ".stats", start: "top 80%" } });

        // Languages + legal: pop the screenshots.
        gsap.utils.toArray<HTMLElement>(".pop-in").forEach((el) => {
          gsap.from(el, { y: 60, scale: 0.94, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
        });
        gsap.from(".lang-chip", { y: 20, opacity: 0, stagger: 0.15, duration: 0.6, scrollTrigger: { trigger: ".lang-chips", start: "top 85%" } });

        // Final CTA.
        gsap.from(".final-cta > *", { y: 30, opacity: 0, stagger: 0.12, duration: 0.8, scrollTrigger: { trigger: ".final-cta", start: "top 80%" } });
      });
    }, root);
    return () => {
      ctx.revert();
      mm.revert();
    };
  }, []);

  const problemWords = lt(T.problem).split(" ");

  return (
    <div ref={root} className="overflow-x-clip">
      {/* ---------- Hero: just the two buttons ---------- */}
      <section className="landing-hero hero relative flex min-h-[calc(100dvh-4.25rem)] flex-col items-center justify-center px-4">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Gem className="float-gem absolute left-[8%] top-[14%] h-20 w-20 opacity-30 sm:h-28 sm:w-28" />
          <Gem className="float-gem absolute right-[10%] top-[22%] h-14 w-14 opacity-25 sm:h-20 sm:w-20" />
          <Gem className="float-gem absolute bottom-[16%] left-[18%] h-12 w-12 opacity-20" />
          <Gem className="float-gem absolute bottom-[12%] right-[16%] h-24 w-24 opacity-25 sm:h-32 sm:w-32" />
        </div>
        <h1 className="sr-only">Glendale2Biz</h1>
        <CtaButtons lt={lt} className="hero-cta relative z-10 w-full max-w-2xl" />
        <a href="#learn" className="scroll-cue absolute bottom-6 flex flex-col items-center gap-1 text-sm font-semibold text-white/80">
          {lt(T.scroll)}
          <span className="scroll-cue-arrow text-xl" aria-hidden="true">↓</span>
        </a>
      </section>

      {/* ---------- Problem ---------- */}
      <section id="learn" className="problem mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-32">
        <p className="landing-kicker">{lt(T.problemKicker)}</p>
        <p className="font-display mt-4 text-3xl font-extrabold leading-tight text-jade-deep sm:text-5xl">
          {problemWords.map((w, i) => (
            <span key={i} className="problem-word">
              {w}{" "}
            </span>
          ))}
        </p>
        <p className="problem-sub mt-8 max-w-2xl text-lg text-ink-soft">{lt(T.problemSub)}</p>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="bg-paper-deep/60 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="landing-kicker text-center">{lt(T.howKicker)}</p>
          <div className="mt-12 space-y-20 sm:space-y-28">
            {T.steps.map((s, i) => (
              <div key={i} className={`step-row grid items-center gap-8 md:grid-cols-2 md:gap-14 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div className="step-text">
                  <h2 className="text-2xl font-extrabold text-jade-deep sm:text-4xl">{lt(s.title)}</h2>
                  <p className="mt-4 text-lg text-ink-soft">{lt(s.body)}</p>
                </div>
                <div className="step-shot landing-shot">
                  <img src={s.img} alt={lt(s.alt)} loading="lazy" width={1600} height={1000} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="stats mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="landing-kicker text-center">{lt(T.statsKicker)}</p>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {T.stats.map((s, i) => (
            <div key={i} className="stat rounded-2xl border border-line bg-card p-6 text-center">
              <div className="stat-num font-display text-4xl font-extrabold text-sapphire sm:text-5xl" data-target={s.n}>
                {s.n.toLocaleString("en-US")}
              </div>
              <div className="mt-2 text-sm font-semibold text-ink-soft">{lt(s.label)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Languages ---------- */}
      <section className="hero py-20 text-white sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <p className="landing-kicker !text-topaz">{lt(T.langKicker)}</p>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">{lt(T.langTitle)}</h2>
            <p className="mt-4 text-lg text-white/80">{lt(T.langBody)}</p>
            <div className="lang-chips mt-6 flex flex-wrap gap-3">
              {["English", "Español", "Հայերեն"].map((l) => (
                <span key={l} className="lang-chip rounded-full bg-white/10 px-4 py-2 font-bold ring-1 ring-white/30">
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div className="pop-in landing-shot">
            <img src="/landing/armenian.jpg" alt="Glendale2Biz verdict screen in Armenian" loading="lazy" width={1600} height={1000} />
          </div>
        </div>
      </section>

      {/* ---------- LegalTech ---------- */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 sm:py-28 md:grid-cols-2">
        <div className="pop-in landing-shot md:order-1">
          <img src="/landing/document.jpg" alt="Pre-filled pre-lease zoning inquiry to Glendale Planning" loading="lazy" width={1600} height={1000} />
        </div>
        <div className="md:order-2">
          <p className="landing-kicker">{lt(T.legalKicker)}</p>
          <h2 className="mt-4 text-3xl font-extrabold text-jade-deep sm:text-4xl">{lt(T.legalTitle)}</h2>
          <p className="mt-4 text-lg text-ink-soft">{lt(T.legalBody)}</p>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="final-cta mx-auto max-w-4xl px-4 pb-8 pt-4 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold text-jade-deep sm:text-5xl">{lt(T.ctaTitle)}</h2>
        <CtaButtons lt={lt} className="mt-8" />
        <p className="mt-8 text-sm text-ink-soft">{lt(T.builtWith)}</p>
      </section>
    </div>
  );
}
