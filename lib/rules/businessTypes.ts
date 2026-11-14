import type { BusinessType } from "../contracts";
import { L } from "./text";

type Flags = BusinessType["flags"];
const F = (f: Partial<Flags>): Flags => ({
  food: false,
  alcohol: false,
  healthPermit: false,
  homeBasedOk: false,
  sellsGoods: false,
  tech: false,
  ...f,
});

/**
 * Business-type catalog. ~85% brick-and-mortar / service, 2 tech.
 * Spanish and Armenian are machine-authored ("translation in review").
 */
export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "cafe",
    category: "food",
    icon: "☕",
    name: L("Coffee & boba shop", "Cafetería y tienda de boba", "Սրճարան և բոբա թեյարան"),
    blurb: L(
      "Coffee, tea, boba and light snacks, counter service.",
      "Café, té, boba y bocadillos ligeros, servicio en mostrador.",
      "Սուրճ, թեյ, բոբա և թեթև նախուտեստներ՝ վաճառասեղանի սպասարկումով։",
    ),
    keywords: ["cafe", "café", "coffee", "boba", "tea", "espresso", "juice", "smoothie", "cafetería", "té", "սրճարան", "սուրճ", "թեյ"],
    flags: F({ food: true, healthPermit: true, sellsGoods: true }),
  },
  {
    id: "restaurant",
    category: "food",
    icon: "🍽️",
    name: L("Restaurant", "Restaurante", "Ռեստորան"),
    blurb: L(
      "Sit-down or takeout restaurant with a full kitchen.",
      "Restaurante para comer en el lugar o para llevar, con cocina completa.",
      "Ռեստորան տեղում կամ տանելու համար՝ լիարժեք խոհանոցով։",
    ),
    keywords: ["restaurant", "food", "kitchen", "diner", "kebab", "pizza", "taco", "tacos", "grill", "catering", "restaurante", "comida", "taquería", "ռեստորան", "խոհանոց", "քաբաբ", "ուտելիք"],
    flags: F({ food: true, healthPermit: true, sellsGoods: true }),
  },
  {
    id: "bakery",
    category: "food",
    icon: "🥐",
    name: L("Bakery & pastry shop", "Panadería y pastelería", "Հացաբուլկեղենի և հրուշակեղենի խանութ"),
    blurb: L(
      "Bread, pastries and cakes baked on site.",
      "Pan, pasteles y tortas horneados en el local.",
      "Հաց, թխվածքներ և տորթեր՝ թխված տեղում։",
    ),
    keywords: ["bakery", "bake", "bread", "pastry", "cake", "cakes", "donut", "gata", "lavash", "panadería", "pastelería", "pan", "հացատուն", "հաց", "թխվածք", "տորթ", "փուռ"],
    flags: F({ food: true, healthPermit: true, sellsGoods: true }),
  },
  {
    id: "retail_boutique",
    category: "retail",
    icon: "🛍️",
    name: L("Retail boutique", "Tienda boutique", "Մանրածախ խանութ (բուտիկ)"),
    blurb: L(
      "Clothing, gifts, jewelry or home goods sold in a storefront.",
      "Ropa, regalos, joyería o artículos para el hogar en un local.",
      "Հագուստ, նվերներ, զարդեր կամ տնային ապրանքներ՝ խանութում։",
    ),
    keywords: ["retail", "boutique", "store", "shop", "clothing", "clothes", "gift", "gifts", "jewelry", "flowers", "florist", "tienda", "ropa", "joyería", "regalos", "խանութ", "հագուստ", "զարդեր", "նվեր"],
    flags: F({ sellsGoods: true }),
  },
  {
    id: "salon",
    category: "personal_care",
    icon: "💅",
    name: L("Hair & nail salon", "Salón de belleza y uñas", "Գեղեցկության և եղունգների սրահ"),
    blurb: L(
      "Hair, nails, lashes, skin care or makeup services.",
      "Servicios de cabello, uñas, pestañas, cuidado de la piel o maquillaje.",
      "Մազերի, եղունգների, թարթիչների, մաշկի խնամքի կամ դիմահարդարման ծառայություններ։",
    ),
    keywords: ["salon", "hair", "nail", "nails", "beauty", "lashes", "spa", "esthetician", "makeup", "salón", "belleza", "uñas", "cabello", "սրահ", "գեղեցկություն", "եղունգ", "մազ"],
    flags: F({}),
  },
  {
    id: "barbershop",
    category: "personal_care",
    icon: "💈",
    name: L("Barbershop", "Barbería", "Վարսավիրանոց"),
    blurb: L(
      "Haircuts, shaves and grooming.",
      "Cortes de cabello, afeitado y arreglo personal.",
      "Սանրվածքներ, սափրում և խնամք։",
    ),
    keywords: ["barber", "barbershop", "haircut", "shave", "fade", "barbería", "barbero", "վարսավիր", "վարսավիրանոց", "սափրիչ"],
    flags: F({}),
  },
  {
    id: "fitness_studio",
    category: "fitness",
    icon: "🏋️",
    name: L("Fitness studio", "Estudio de fitness", "Ֆիթնես ստուդիա"),
    blurb: L(
      "Gym, yoga, pilates, martial arts or dance studio.",
      "Gimnasio, yoga, pilates, artes marciales o estudio de baile.",
      "Մարզասրահ, յոգա, պիլատես, մարտարվեստ կամ պարի ստուդիա։",
    ),
    keywords: ["gym", "fitness", "yoga", "pilates", "martial", "karate", "boxing", "dance", "crossfit", "gimnasio", "baile", "մարզասրահ", "ֆիթնես", "յոգա", "պար"],
    flags: F({}),
  },
  {
    id: "auto_repair",
    category: "auto",
    icon: "🔧",
    name: L("Auto repair shop", "Taller mecánico", "Ավտովերանորոգման արհեստանոց"),
    blurb: L(
      "Mechanical repair, tires, smog, body work or detailing.",
      "Reparación mecánica, llantas, smog, carrocería o detallado.",
      "Մեխանիկական վերանորոգում, անվադողեր, սմոգ ստուգում, թափքի աշխատանք կամ լվացում։",
    ),
    keywords: ["auto", "car", "mechanic", "repair", "tires", "smog", "body shop", "detailing", "oil change", "taller", "mecánico", "carro", "llantas", "ավտո", "մեքենա", "վերանորոգում", "մեխանիկ"],
    flags: F({ sellsGoods: true }),
  },
  {
    id: "convenience_store",
    category: "retail",
    icon: "🏪",
    name: L("Convenience / liquor store", "Tienda de conveniencia / licorería", "Մթերային / ալկոհոլային խմիչքների խանութ"),
    blurb: L(
      "Packaged food, drinks, beer, wine and spirits to go.",
      "Alimentos empacados, bebidas, cerveza, vino y licores para llevar.",
      "Փաթեթավորված սնունդ, ըմպելիքներ, գարեջուր, գինի և ոգելից խմիչքներ՝ տանելու համար։",
    ),
    keywords: ["convenience", "liquor", "market", "minimarket", "grocery", "deli", "beer", "wine", "licorería", "mercado", "tienda de abarrotes", "մթերային", "խանութ", "գինի", "գարեջուր"],
    flags: F({ food: true, alcohol: true, healthPermit: true, sellsGoods: true }),
  },
  {
    id: "daycare",
    category: "childcare",
    icon: "🧸",
    name: L("Daycare / child care", "Guardería / cuidado infantil", "Մանկապարտեզ / երեխաների խնամք"),
    blurb: L(
      "Licensed child care center or preschool.",
      "Centro de cuidado infantil o preescolar con licencia.",
      "Լիցենզավորված երեխաների խնամքի կենտրոն կամ նախադպրոց։",
    ),
    keywords: ["daycare", "child care", "childcare", "preschool", "nursery", "kids", "guardería", "preescolar", "niños", "մանկապարտեզ", "երեխա", "նախադպրոց"],
    flags: F({}),
  },
  {
    id: "tutoring_center",
    category: "services",
    icon: "📚",
    name: L("Tutoring & learning center", "Centro de tutoría y aprendizaje", "Ուսուցման և կրթական կենտրոն"),
    blurb: L(
      "Tutoring, test prep, music or language lessons.",
      "Tutoría, preparación para exámenes, clases de música o idiomas.",
      "Կրկնուսուցում, քննությունների նախապատրաստում, երաժշտության կամ լեզվի դասեր։",
    ),
    keywords: ["tutoring", "tutor", "learning", "lessons", "music", "piano", "language", "test prep", "school", "tutoría", "clases", "música", "idiomas", "դասեր", "կրթություն", "ուսուցում", "երաժշտություն"],
    flags: F({}),
  },
  {
    id: "professional_office",
    category: "services",
    icon: "💼",
    name: L(
      "Professional office",
      "Oficina profesional",
      "Մասնագիտական գրասենյակ",
    ),
    blurb: L(
      "Accounting, insurance, real estate, legal or consulting office.",
      "Oficina de contabilidad, seguros, bienes raíces, legal o consultoría.",
      "Հաշվապահական, ապահովագրական, անշարժ գույքի, իրավաբանական կամ խորհրդատվական գրասենյակ։",
    ),
    keywords: ["office", "accounting", "accountant", "tax", "insurance", "real estate", "law", "lawyer", "consulting", "notary", "oficina", "contabilidad", "seguros", "abogado", "գրասենյակ", "հաշվապահ", "ապահովագրություն", "փաստաբան"],
    flags: F({ homeBasedOk: true }),
  },
  {
    id: "home_business",
    category: "home_based",
    icon: "🏠",
    name: L("Home-based business", "Negocio desde casa", "Տնային բիզնես"),
    blurb: L(
      "Run from your home: crafts, bookkeeping, online services and more.",
      "Desde su casa: artesanías, contabilidad, servicios en línea y más.",
      "Ձեր տնից՝ ձեռագործ, հաշվապահություն, առցանց ծառայություններ և այլն։",
    ),
    keywords: ["home", "home-based", "from home", "freelance", "crafts", "etsy", "side business", "desde casa", "casa", "independiente", "տնից", "տնային", "տուն"],
    flags: F({ homeBasedOk: true, sellsGoods: true }),
  },
  {
    id: "cottage_food",
    category: "home_based",
    icon: "🍪",
    name: L("Home bakery (cottage food)", "Repostería casera (cottage food)", "Տնային հրուշակեղեն (cottage food)"),
    blurb: L(
      "Sell approved low-risk foods made in your home kitchen.",
      "Venda alimentos de bajo riesgo aprobados, hechos en la cocina de su casa.",
      "Վաճառեք ձեր տնային խոհանոցում պատրաստված թույլատրված ցածր ռիսկի սնունդ։",
    ),
    keywords: ["cottage", "home bakery", "home baker", "cookies", "baking at home", "jam", "repostería casera", "galletas", "տնային թխվածք", "թխվածքաբլիթ"],
    flags: F({ food: true, healthPermit: true, homeBasedOk: true, sellsGoods: true }),
  },
  {
    id: "software_startup",
    category: "tech",
    icon: "💻",
    name: L("Software / tech startup", "Startup de software / tecnología", "Ծրագրային / տեխնոլոգիական ստարտափ"),
    blurb: L(
      "Apps, SaaS or AI products; often starts at home or in a coworking space.",
      "Apps, SaaS o productos de IA; a menudo empieza en casa o en un coworking.",
      "Հավելվածներ, SaaS կամ AI արտադրանք․ հաճախ սկսվում է տնից կամ համատեղ աշխատատարածքից։",
    ),
    keywords: ["software", "startup", "tech", "app", "saas", "ai", "developer", "coding", "web", "tecnología", "aplicación", "ծրագրային", "ստարտափ", "տեխնոլոգիա", "հավելված"],
    flags: F({ homeBasedOk: true, tech: true }),
  },
  {
    id: "ecommerce",
    category: "tech",
    icon: "📦",
    name: L("E-commerce shop", "Tienda en línea", "Առցանց խանութ"),
    blurb: L(
      "Sell products online and ship from home or a small warehouse.",
      "Venda productos en línea y envíe desde casa o un pequeño almacén.",
      "Վաճառեք ապրանքներ առցանց և առաքեք տնից կամ փոքր պահեստից։",
    ),
    keywords: ["ecommerce", "e-commerce", "online store", "online shop", "shopify", "amazon", "dropshipping", "tienda en línea", "en línea", "առցանց", "առցանց խանութ"],
    flags: F({ homeBasedOk: true, sellsGoods: true, tech: true }),
  },
];

const BY_ID = new Map(BUSINESS_TYPES.map((b) => [b.id, b]));

export function getBusinessType(id: string): BusinessType | undefined {
  return BY_ID.get(id);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip Latin accents (Armenian has none in NFD)
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Keyword scoring. Returns matching types, best first (empty array when nothing matches).
 * Multi-word keywords score higher; a match on the type's own name scores too.
 */
export function matchBusinessType(text: string): BusinessType[] {
  const q = normalize(text ?? "");
  if (!q) return [];
  const padded = ` ${q} `;
  const tokens = new Set(q.split(" "));
  const scored: { b: BusinessType; score: number; idx: number }[] = [];
  BUSINESS_TYPES.forEach((b, idx) => {
    let score = 0;
    for (const raw of b.keywords) {
      const k = normalize(raw);
      if (!k) continue;
      if (k.includes(" ")) {
        if (padded.includes(` ${k} `)) score += 3;
      } else if (tokens.has(k)) {
        score += 2;
      } else if (k.length >= 4 && [...tokens].some((tok) => tok.length >= 4 && (tok.startsWith(k) || k.startsWith(tok)))) {
        score += 1; // plurals / prefixes: "bakeries", "nail" ↔ "nails"
      }
    }
    for (const n of Object.values(b.name)) {
      if (padded.includes(` ${normalize(n)} `)) score += 2;
    }
    if (score > 0) scored.push({ b, score, idx });
  });
  scored.sort((a, z) => z.score - a.score || a.idx - z.idx);
  return scored.map((s) => s.b);
}
