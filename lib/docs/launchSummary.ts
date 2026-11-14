import type { LocalizedText } from "@/lib/contracts";
import { ROADMAP_PHASES } from "@/lib/contracts";
import type { GeneratedDoc, DocInput, DocSection } from "./types";
import { L, same, valueOr, businessName, businessAddress, VERDICT_LABEL, STRUCTURE_LABEL, localizedDate } from "./common";

const PHASE: Record<string, LocalizedText> = {
  plan: L("Plan", "Planear", "Պլանավորում"),
  register: L("Register", "Registrar", "Գրանցում"),
  permit: L("Permit", "Permisos", "Թույլտվություններ"),
  open: L("Open", "Abrir", "Բացում"),
};

const LOCATION_MODE: Record<string, LocalizedText> = {
  home: L("Home-based", "Desde casa", "Տնային"),
  undecided: L("Location not chosen yet", "Ubicación aún no elegida", "Վայրը դեռ ընտրված չէ"),
};

/** One-page launch summary: business, location, verdict, hazards, required steps. */
export function buildLaunchSummary(input: DocInput): GeneratedDoc {
  const f = input.form;
  const site = input.locationMode === "address" ? input.site ?? null : null;
  const addr = businessAddress(input);

  const sections: DocSection[] = [
    {
      heading: L("Business", "Negocio", "Բիզնես"),
      fields: [
        { label: L("Type", "Tipo", "Տեսակ"), value: businessName(input) },
        { label: L("Business name (DBA)", "Nombre comercial (DBA)", "Բիզնեսի անվանում (DBA)"), ...valueOr(f.businessName) },
        { label: L("Owner(s)", "Propietario(s)", "Սեփականատեր(եր)"), ...valueOr(f.ownerNames) },
        { label: L("Structure", "Estructura", "Կառուցվածք"), value: STRUCTURE_LABEL[f.structure] },
        ...(f.startDate
          ? [{ label: L("Planned start", "Inicio previsto", "Նախատեսված մեկնարկ"), value: localizedDate(f.startDate) }]
          : []),
      ],
    },
    {
      heading: L("Location", "Ubicación", "Վայր"),
      fields: [
        site
          ? { label: L("Address", "Dirección", "Հասցե"), value: same(site.address.matched) }
          : {
              label: L("Address", "Dirección", "Հասցե"),
              value: addr ? same(addr) : LOCATION_MODE[input.locationMode] ?? LOCATION_MODE.undecided,
            },
        ...(site
          ? [
              {
                label: L("Zoning", "Zonificación", "Գոտիավորում"),
                value: site.zoning.code
                  ? site.zoning.name
                    ? {
                        en: `${site.zoning.code} (${site.zoning.name.en})`,
                        es: `${site.zoning.code} (${site.zoning.name.es})`,
                        hy: `${site.zoning.code} (${site.zoning.name.hy})`,
                      }
                    : same(site.zoning.code)
                  : L("Not found", "No encontrada", "Չի գտնվել"),
              },
              { label: L("Zoning check", "Revisión de zonificación", "Գոտիավորման ստուգում"), value: VERDICT_LABEL[site.verdict.status] },
              {
                label: L("Data source", "Fuente de datos", "Տվյալների աղբյուր"),
                value:
                  site.meta.dataSource === "mock"
                    ? L("Demo data (sample records)", "Datos de demostración (registros de ejemplo)", "Ցուցադրական տվյալներ (օրինակային)")
                    : L("City of Glendale GIS (live)", "SIG de la Ciudad de Glendale (en vivo)", "Գլենդեյլ քաղաքի GIS (ուղիղ)"),
              },
            ]
          : [{ label: L("Setup", "Modalidad", "Ձևաչափ"), value: LOCATION_MODE[input.locationMode] ?? LOCATION_MODE.undecided }]),
      ],
    },
  ];

  if (site) {
    const inZone = site.hazards.filter((h) => h.status === "in_zone");
    sections.push({
      heading: L("Hazard zones", "Zonas de riesgo", "Վտանգի գոտիներ"),
      bullets: inZone.length
        ? inZone.map((h) => (h.detail ? { en: `${h.label.en} (${h.detail})`, es: `${h.label.es} (${h.detail})`, hy: `${h.label.hy} (${h.detail})` } : h.label))
        : [L("Not in any checked hazard zone.", "No está en ninguna de las zonas de riesgo revisadas.", "Ստուգված վտանգի գոտիներից ոչ մեկում չէ։")],
    });
  }

  const steps = [...(input.roadmap?.steps ?? [])].filter((s) => s.required).sort((a, b) => a.order - b.order);
  for (const phase of ROADMAP_PHASES) {
    const items = steps.filter((s) => s.phase === phase);
    if (!items.length) continue;
    sections.push({
      heading: { en: `${PHASE[phase].en}: required steps`, es: `${PHASE[phase].es}: pasos obligatorios`, hy: `${PHASE[phase].hy}․ պարտադիր քայլեր` },
      checklist: items.map((s) => ({
        en: `${s.title.en} (${s.agency})`,
        es: `${s.title.es} (${s.agency})`,
        hy: `${s.title.hy} (${s.agency})`,
      })),
    });
  }

  return {
    id: "launch_summary",
    title: L("One-page launch summary", "Resumen de apertura en una página", "Գործարկման ամփոփում՝ մեկ էջում"),
    subtitle: { en: `Prepared ${localizedDate(input.today).en}`, es: `Preparado el ${localizedDate(input.today).es}`, hy: `Պատրաստված է ${localizedDate(input.today).hy}` },
    sections,
  };
}
