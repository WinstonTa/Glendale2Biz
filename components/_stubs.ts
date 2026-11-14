// TEMPORARY stubs until backend-dev's @/lib/rules and @/lib/gis/demo land. Delete when swapped.
import type { BusinessType, Roadmap, RoadmapInput, LocalizedText } from "@/lib/contracts";

const L = (en: string, es: string, hy: string): LocalizedText => ({ en, es, hy });
const f = (o: Partial<BusinessType["flags"]>): BusinessType["flags"] => ({
  food: false, alcohol: false, healthPermit: false, homeBasedOk: false, sellsGoods: false, tech: false, ...o,
});

export const BUSINESS_TYPES: BusinessType[] = [
  { id: "cafe", category: "food", name: L("Café / boba shop", "Café / boba", "Սրճարան"), blurb: L("Coffee, tea, light food", "Café, té, comida ligera", "Սուրճ, թեյ, թեթև սնունդ"), icon: "☕", keywords: ["coffee", "cafe", "boba", "tea"], flags: f({ food: true, healthPermit: true, sellsGoods: true }) },
  { id: "salon", category: "personal_care", name: L("Hair / nail salon", "Salón de belleza", "Գեղեցկության սրահ"), blurb: L("Hair, nails, beauty", "Cabello, uñas, belleza", "Մազեր, եղունգներ"), icon: "💇", keywords: ["salon", "hair", "nails", "barber"], flags: f({}) },
  { id: "auto_repair", category: "auto", name: L("Auto repair", "Taller mecánico", "Ավտոնորոգում"), blurb: L("Repair and service", "Reparación y servicio", "Նորոգում և սպասարկում"), icon: "🔧", keywords: ["auto", "car", "mechanic"], flags: f({}) },
  { id: "home_bakery", category: "home_based", name: L("Home bakery", "Panadería en casa", "Տնային հացատուն"), blurb: L("Cottage food from your kitchen", "Comida casera", "Տնային սնունդ"), icon: "🧁", keywords: ["bakery", "cake", "cookies", "home"], flags: f({ food: true, homeBasedOk: true, sellsGoods: true }) },
  { id: "software_startup", category: "tech", name: L("Software startup", "Startup de software", "Ծրագրային ստարտափ"), blurb: L("Apps, SaaS, online services", "Apps, SaaS", "Հավելվածներ, SaaS"), icon: "💻", keywords: ["software", "app", "saas", "startup", "online"], flags: f({ tech: true, homeBasedOk: true }) },
];

export function getBusinessType(id: string) {
  return BUSINESS_TYPES.find((b) => b.id === id);
}

export function matchBusinessType(text: string): BusinessType[] {
  const q = text.toLowerCase();
  if (!q.trim()) return [];
  return BUSINESS_TYPES.filter((b) => b.keywords.some((k) => q.includes(k)));
}

export function buildRoadmap(input: RoadmapInput): Roadmap {
  return {
    generatedAt: new Date().toISOString(),
    steps: [
      { id: "entity", phase: "plan", order: 1, title: L("Choose a business structure", "Elija una estructura", "Ընտրեք կառուցվածքը"), description: L("Sole prop, LLC or corporation.", "Empresa individual, LLC o corporación.", "Անհատ ձեռնարկատեր, ՍՊԸ կամ կորպորացիա։"), appliesBecause: L("Every business needs one.", "Todo negocio lo necesita.", "Յուրաքանչյուր բիզնեսի պետք է։"), agency: "CA Secretary of State", url: "https://www.sos.ca.gov/business-programs", costEstimate: "$70+", timeEstimate: "1–2 weeks", required: true, verified: true },
      { id: "license", phase: "register", order: 2, title: L("Glendale business license", "Licencia de negocio", "Բիզնեսի լիցենզիա"), description: L("Register with the city.", "Regístrese en la ciudad.", "Գրանցվեք քաղաքում։"), appliesBecause: L(`You're opening in Glendale (${input.locationMode}).`, "Abre en Glendale.", "Բացում եք Գլենդեյլում։"), agency: "City of Glendale", url: "https://www.glendaleca.gov", required: true, verified: false },
    ],
  };
}

export const DEMO_ADDRESSES: { address: string; label?: LocalizedText }[] = [
  { address: "613 E Broadway", label: L("City Hall", "Ayuntamiento", "Քաղաքապետարան") },
];
