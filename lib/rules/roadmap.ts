import type {
  BusinessType,
  LocalizedText,
  Roadmap,
  RoadmapInput,
  RoadmapPhase,
  RoadmapStep,
} from "../contracts";
import { ROADMAP_PHASES } from "../contracts";
import { getBusinessType } from "./businessTypes";
import { L } from "./text";

/**
 * Official agency URLs.
 * `ok: true` = page was fetched and confirmed to cover this topic (2026-11-14).
 * `ok: false` = agency page we could not confirm (bot-blocked / unknown deep link) ⇒ step.verified = false.
 */
export const SOURCES = {
  sbaPlan: { url: "https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan", agency: "U.S. Small Business Administration", ok: true },
  sbaInsurance: { url: "https://www.sba.gov/business-guide/launch-your-business/get-business-insurance", agency: "U.S. Small Business Administration", ok: false },
  glendalePlanning: { url: "https://www.glendaleca.gov/government/departments/community-development/planning", agency: "City of Glendale — Planning Division", ok: false },
  glendaleBuilding: { url: "https://www.glendaleca.gov/government/departments/community-development/building-safety", agency: "City of Glendale — Building & Safety", ok: false },
  glendaleFinance: { url: "https://www.glendaleca.gov/government/departments/finance", agency: "City of Glendale — Finance (Business License)", ok: false },
  glendaleFire: { url: "https://www.glendaleca.gov/government/departments/fire", agency: "Glendale Fire Department — Fire Prevention", ok: false },
  glendaleEconDev: { url: "https://www.glendaleca.gov/government/departments/community-development/economic-development", agency: "City of Glendale — Economic Development", ok: false },
  caSos: { url: "https://bizfileonline.sos.ca.gov/", agency: "California Secretary of State (bizfile Online)", ok: true },
  delaware: { url: "https://corp.delaware.gov/", agency: "Delaware Division of Corporations", ok: true },
  irsEin: { url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online", agency: "Internal Revenue Service (IRS)", ok: true },
  irsForms: { url: "https://www.irs.gov/forms-instructions", agency: "Internal Revenue Service (IRS)", ok: false },
  laFbn: { url: "https://www.lavote.gov/home/county-clerk/fictitious-business-names", agency: "LA County Registrar-Recorder/County Clerk", ok: true },
  cdtfa: { url: "https://www.cdtfa.ca.gov/", agency: "California Department of Tax and Fee Administration (CDTFA)", ok: false },
  edd: { url: "https://edd.ca.gov/en/payroll_taxes/", agency: "California Employment Development Department (EDD)", ok: true },
  laEh: { url: "https://publichealth.lacounty.gov/eh/", agency: "LA County Public Health — Environmental Health", ok: false },
  laCottage: { url: "https://publichealth.lacounty.gov/eh/business/cottage-food-operation.htm", agency: "LA County Public Health — Environmental Health", ok: false },
  abc: { url: "https://www.abc.ca.gov/licensing/", agency: "California Department of Alcoholic Beverage Control (ABC)", ok: true },
  barberCosmo: { url: "https://www.barbercosmo.ca.gov/", agency: "California Board of Barbering and Cosmetology", ok: true },
  bar: { url: "https://www.bar.ca.gov/", agency: "California Bureau of Automotive Repair (BAR)", ok: true },
  cdssChildCare: { url: "https://www.cdss.ca.gov/inforesources/child-care-licensing", agency: "California Department of Social Services — Community Care Licensing", ok: true },
} as const;
type SourceKey = keyof typeof SOURCES;

interface Draft {
  id: string;
  phase: RoadmapPhase;
  title: LocalizedText;
  description: LocalizedText;
  appliesBecause: LocalizedText;
  source: SourceKey;
  costEstimate?: string;
  timeEstimate?: string;
  required: boolean;
}

const ALWAYS = L(
  "Every new business in Glendale needs this.",
  "Todo negocio nuevo en Glendale lo necesita.",
  "Գլենդեյլում յուրաքանչյուր նոր բիզնեսի դա անհրաժեշտ է։",
);

function because(b: BusinessType, en: string, es: string, hy: string): LocalizedText {
  return L(`${b.name.en}: ${en}`, `${b.name.es}: ${es}`, `${b.name.hy}․ ${hy}`);
}

/** Pure, deterministic roadmap builder (steps depend only on input; pass `now` for a fixed generatedAt). Runs on the client. */
export function buildRoadmap(input: RoadmapInput, now: Date = new Date()): Roadmap {
  const b = getBusinessType(input.businessTypeId);
  const steps: Draft[] = [];
  const mode = input.locationMode;
  const site = mode === "address" ? input.site ?? null : null;
  const status = site?.verdict.status;
  const storefront = mode !== "home";
  const generatedAt = now.toISOString();

  if (!b) return { steps: [], generatedAt };
  const f = b.flags;
  const isCottage = b.id === "cottage_food";

  // ---------------- PLAN ----------------
  steps.push({
    id: "business_plan",
    phase: "plan",
    title: L("Write a simple business plan", "Escriba un plan de negocios sencillo", "Կազմեք պարզ բիզնես պլան"),
    description: L(
      "Estimate startup costs, pricing and monthly expenses. A one-page plan helps with leases and loans.",
      "Calcule costos iniciales, precios y gastos mensuales. Un plan de una página ayuda con arrendamientos y préstamos.",
      "Հաշվարկեք մեկնարկային ծախսերը, գները և ամսական ծախսերը։ Մեկ էջանոց պլանն օգնում է վարձակալության և վարկերի հարցում։",
    ),
    appliesBecause: ALWAYS,
    source: "sbaPlan",
    costEstimate: "Free",
    timeEstimate: "1–3 days",
    required: false,
  });

  if (mode === "address" && status === "not_allowed") {
    steps.push({
      id: "find_new_location",
      phase: "plan",
      title: L("Find a location zoned for your business", "Busque un local con la zonificación adecuada", "Գտեք ձեր բիզնեսի համար համապատասխան գոտիավորմամբ տարածք"),
      description: L(
        "The zone at this address likely does not allow this use. Look at commercial or mixed-use areas and run a new site check before signing anything.",
        "La zona de esta dirección probablemente no permite este uso. Busque en zonas comerciales o de uso mixto y haga otra verificación antes de firmar.",
        "Այս հասցեի գոտին, հավանաբար, թույլ չի տալիս այս գործունեությունը։ Փնտրեք առևտրային կամ խառը նշանակության տարածքներ և նորից ստուգեք նախքան որևէ բան ստորագրելը։",
      ),
      appliesBecause: L(
        "Your site check came back “not allowed”.",
        "Su verificación del sitio indicó “no permitido”.",
        "Ձեր տարածքի ստուգման արդյունքը «չի թույլատրվում» է։",
      ),
      source: "glendalePlanning",
      costEstimate: "Free",
      timeEstimate: "1–4 weeks",
      required: true,
    });
  }

  if (storefront) {
    steps.push({
      id: "confirm_zoning",
      phase: "plan",
      title: L(
        "Confirm zoning with Glendale Planning before you sign a lease",
        "Confirme la zonificación con Planificación de Glendale antes de firmar un contrato",
        "Նախքան վարձակալության պայմանագիր ստորագրելը՝ հաստատեք գոտիավորումը Գլենդեյլի Պլանավորման բաժնում",
      ),
      description: L(
        "Ask the Planning counter (or email) to confirm your use is permitted at the exact parcel, and whether parking or other conditions apply.",
        "Pida a Planificación que confirme que su uso está permitido en esa parcela exacta y si aplican requisitos de estacionamiento u otras condiciones.",
        "Խնդրեք Պլանավորման բաժնին հաստատել, որ ձեր գործունեությունը թույլատրված է հենց այդ հողամասում, և արդյոք կան կայանատեղիի կամ այլ պայմաններ։",
      ),
      appliesBecause:
        mode === "undecided"
          ? L(
              "You have not picked a location yet — check zoning for every address you consider.",
              "Aún no eligió un local: verifique la zonificación de cada dirección que considere.",
              "Դուք դեռ տարածք չեք ընտրել․ ստուգեք գոտիավորումը յուրաքանչյուր հասցեի համար։",
            )
          : status === "unknown" || !status
            ? L(
                "We could not determine a verdict for this zone automatically.",
                "No pudimos determinar automáticamente un resultado para esta zona.",
                "Մենք չկարողացանք ավտոմատ որոշել այս գոտու արդյունքը։",
              )
            : L(
                `Our check is guidance only (zone ${site?.zoning.code ?? "?"}); the City makes the final call.`,
                `Nuestra verificación es solo orientativa (zona ${site?.zoning.code ?? "?"}); la Ciudad decide.`,
                `Մեր ստուգումը միայն ուղղորդող է (գոտի ${site?.zoning.code ?? "?"})․ վերջնական որոշումը Քաղաքինն է։`,
              ),
      source: "glendalePlanning",
      costEstimate: "Free",
      timeEstimate: "1–5 days",
      required: true,
    });
  }

  // ---------------- REGISTER ----------------
  if (f.tech && b.id === "software_startup") {
    steps.push({
      id: "entity_c_corp",
      phase: "register",
      title: L("Form a C-corporation (Delaware or California)", "Constituya una C-corporation (Delaware o California)", "Հիմնադրեք C-կորպորացիա (Դելավեր կամ Կալիֆոռնիա)"),
      description: L(
        "Investors usually expect a Delaware C-corp. If you incorporate in Delaware, you must also register (qualify) it with the California Secretary of State because you operate here.",
        "Los inversionistas suelen esperar una C-corp de Delaware. Si se constituye en Delaware, también debe registrarla ante el Secretario de Estado de California porque opera aquí.",
        "Ներդրողները սովորաբար ակնկալում են Դելավերի C-կորպորացիա։ Եթե գրանցվում եք Դելավերում, պետք է նաև գրանցվեք Կալիֆոռնիայի Պետքարտուղարությունում, քանի որ գործում եք այստեղ։",
      ),
      appliesBecause: because(b, "venture-backed startups typically use a C-corp.", "las startups con inversión suelen usar una C-corp.", "ներդրումներ ներգրավող ստարտափները սովորաբար C-կորպորացիա են։"),
      source: "delaware",
      costEstimate: "$100–$500 + registered agent",
      timeEstimate: "1–5 days",
      required: true,
    });
  } else {
    steps.push({
      id: "entity",
      phase: "register",
      title: L("Choose your business structure", "Elija la estructura de su negocio", "Ընտրեք ձեր բիզնեսի իրավական ձևը"),
      description: L(
        "Sole proprietorship needs no state filing. An LLC or corporation is filed with the California Secretary of State (bizfile Online) and protects personal assets.",
        "Una empresa individual no requiere registro estatal. Una LLC o corporación se registra ante el Secretario de Estado de California (bizfile Online) y protege sus bienes personales.",
        "Անհատ ձեռնարկատիրոջ համար նահանգային գրանցում պետք չէ։ ՍՊԸ-ն (LLC) կամ կորպորացիան գրանցվում է Կալիֆոռնիայի Պետքարտուղարությունում (bizfile Online) և պաշտպանում է անձնական գույքը։",
      ),
      appliesBecause: ALWAYS,
      source: "caSos",
      costEstimate: "$0 (sole prop) · ~$70+ (LLC) + $800/yr CA franchise tax",
      timeEstimate: "1–10 days",
      required: true,
    });
  }

  steps.push({
    id: "ein",
    phase: "register",
    title: L("Get an EIN from the IRS", "Obtenga un EIN del IRS", "Ստացեք EIN համար IRS-ից"),
    description: L(
      "Your federal tax ID. Free online, issued immediately. Needed for a bank account and hiring.",
      "Su número de identificación fiscal federal. Gratis en línea y se emite de inmediato. Necesario para abrir una cuenta bancaria y contratar.",
      "Ձեր դաշնային հարկային նույնականացման համարը։ Անվճար է առցանց և տրվում է անմիջապես։ Անհրաժեշտ է բանկային հաշվի և աշխատողներ ընդունելու համար։",
    ),
    appliesBecause: ALWAYS,
    source: "irsEin",
    costEstimate: "Free",
    timeEstimate: "Same day",
    required: true,
  });

  steps.push({
    id: "fbn",
    phase: "register",
    title: L(
      "File a Fictitious Business Name (DBA) with LA County",
      "Registre un nombre comercial ficticio (DBA) en el Condado de LA",
      "Գրանցեք ֆիկտիվ բիզնես անվանում (DBA) ԼԱ շրջանում",
    ),
    description: L(
      "Required if you operate under a name other than your legal name (or your LLC's exact name). Must be published in a local newspaper after filing.",
      "Obligatorio si opera con un nombre distinto a su nombre legal (o al nombre exacto de su LLC). Debe publicarse en un periódico local después de registrarlo.",
      "Պարտադիր է, եթե գործում եք ձեր իրավական անունից (կամ ՍՊԸ-ի ճշգրիտ անունից) տարբեր անվամբ։ Գրանցումից հետո պետք է հրապարակվի տեղական թերթում։",
    ),
    appliesBecause: L(
      "Most shops use a brand name, e.g. “Jewel City Boba”.",
      "La mayoría de los negocios usan un nombre comercial, p. ej. “Jewel City Boba”.",
      "Խանութների մեծ մասն օգտագործում է ապրանքային անուն, օրինակ՝ «Jewel City Boba»։",
    ),
    source: "laFbn",
    costEstimate: "~$26 filing + newspaper publication",
    timeEstimate: "1 day + 4 weeks publication",
    required: false,
  });

  steps.push({
    id: "city_business_license",
    phase: "register",
    title: L(
      "Check City of Glendale business license / registration",
      "Verifique la licencia o registro de negocios de la Ciudad de Glendale",
      "Ստուգեք Գլենդեյլ քաղաքի բիզնես լիցենզիայի / գրանցման պահանջները",
    ),
    description: L(
      "Ask the City which business license, registration or regulatory permit applies to your business type in Glendale.",
      "Pregunte a la Ciudad qué licencia, registro o permiso regulatorio aplica a su tipo de negocio en Glendale.",
      "Հարցրեք Քաղաքապետարանին, թե Գլենդեյլում որ լիցենզիան, գրանցումը կամ կարգավորող թույլտվությունն է վերաբերում ձեր բիզնեսի տեսակին։",
    ),
    appliesBecause: L(
      "You will operate inside Glendale city limits.",
      "Operará dentro de los límites de la ciudad de Glendale.",
      "Դուք գործելու եք Գլենդեյլ քաղաքի սահմաններում։",
    ),
    source: "glendaleFinance",
    timeEstimate: "1–2 weeks",
    required: true,
  });

  if (f.sellsGoods) {
    steps.push({
      id: "sellers_permit",
      phase: "register",
      title: L("Get a California seller's permit (CDTFA)", "Obtenga un permiso de vendedor de California (CDTFA)", "Ստացեք Կալիֆոռնիայի վաճառողի թույլտվություն (CDTFA)"),
      description: L(
        "Required to sell taxable goods in California, in a store or online. Free; you will collect and file sales tax.",
        "Obligatorio para vender bienes gravables en California, en tienda o en línea. Gratis; usted cobrará y declarará el impuesto sobre las ventas.",
        "Պարտադիր է Կալիֆոռնիայում հարկվող ապրանքներ վաճառելու համար՝ խանութում կամ առցանց։ Անվճար է․ դուք կգանձեք և կհայտարարագրեք վաճառքի հարկը։",
      ),
      appliesBecause: because(b, "you sell physical products.", "usted vende productos físicos.", "դուք վաճառում եք ֆիզիկական ապրանքներ։"),
      source: "cdtfa",
      costEstimate: "Free (security deposit may apply)",
      timeEstimate: "1–7 days",
      required: true,
    });
  }

  if (f.tech && b.id === "software_startup") {
    steps.push({
      id: "83b_election",
      phase: "register",
      title: L("File your 83(b) election within 30 days", "Presente su elección 83(b) dentro de 30 días", "Ներկայացրեք 83(b) ընտրությունը 30 օրվա ընթացքում"),
      description: L(
        "If founders receive stock that vests, filing an 83(b) election with the IRS within 30 days of the grant can save significant taxes. The deadline cannot be extended.",
        "Si los fundadores reciben acciones con vesting, presentar la elección 83(b) ante el IRS dentro de 30 días puede ahorrar muchos impuestos. El plazo no se puede extender.",
        "Եթե հիմնադիրները ստանում են աստիճանաբար փոխանցվող բաժնետոմսեր, 30 օրվա ընթացքում IRS-ին 83(b) ընտրություն ներկայացնելը կարող է զգալիորեն խնայել հարկերը։ Ժամկետը չի երկարաձգվում։",
      ),
      appliesBecause: because(b, "founder stock usually vests over time.", "las acciones de fundador suelen tener vesting.", "հիմնադիրների բաժնետոմսերը սովորաբար փոխանցվում են ժամանակի ընթացքում։"),
      source: "irsForms",
      costEstimate: "Free",
      timeEstimate: "Within 30 days of stock grant",
      required: true,
    });
  }

  steps.push({
    id: "employer_registration",
    phase: "register",
    title: L("Register as an employer with EDD (if hiring)", "Regístrese como empleador ante el EDD (si contrata)", "Գրանցվեք որպես գործատու EDD-ում (եթե աշխատողներ եք ընդունում)"),
    description: L(
      "Once you pay more than $100 in wages in a quarter, register for California payroll taxes within 15 days.",
      "Cuando pague más de $100 en salarios en un trimestre, regístrese para los impuestos de nómina de California dentro de 15 días.",
      "Երբ եռամսյակում վճարեք ավելի քան $100 աշխատավարձ, 15 օրվա ընթացքում գրանցվեք Կալիֆոռնիայի աշխատավարձային հարկերի համար։",
    ),
    appliesBecause: L(
      "Only if you will have employees.",
      "Solo si tendrá empleados.",
      "Միայն եթե աշխատողներ կունենաք։",
    ),
    source: "edd",
    costEstimate: "Free",
    timeEstimate: "1 day",
    required: false,
  });

  // ---------------- PERMIT ----------------
  if (mode === "address" && status === "conditional") {
    steps.push({
      id: "conditional_use_permit",
      phase: "permit",
      title: L("Apply for a Conditional Use Permit (CUP)", "Solicite un Permiso de Uso Condicional (CUP)", "Դիմեք պայմանական օգտագործման թույլտվության (CUP) համար"),
      description: L(
        "Your use may be allowed here only with a discretionary permit approved by the City, often after a public hearing. Talk to Planning about the application, fees and timeline before you commit to the space.",
        "Su uso puede permitirse aquí solo con un permiso discrecional aprobado por la Ciudad, a menudo tras una audiencia pública. Hable con Planificación sobre la solicitud, tarifas y plazos antes de comprometerse con el local.",
        "Ձեր գործունեությունն այստեղ կարող է թույլատրվել միայն Քաղաքի կողմից հաստատված թույլտվությամբ, հաճախ՝ հանրային լսումից հետո։ Նախքան տարածքը վերցնելը՝ խոսեք Պլանավորման բաժնի հետ դիմումի, վճարների և ժամկետների մասին։",
      ),
      appliesBecause: L(
        `Your site check came back “conditional” for zone ${site?.zoning.code ?? "?"}.`,
        `Su verificación indicó “condicional” para la zona ${site?.zoning.code ?? "?"}.`,
        `Ձեր ստուգման արդյունքը «պայմանական» է ${site?.zoning.code ?? "?"} գոտու համար։`,
      ),
      source: "glendalePlanning",
      costEstimate: "Several thousand dollars (confirm current fee schedule)",
      timeEstimate: "2–6 months",
      required: true,
    });
  }

  if (mode === "home") {
    steps.push({
      id: "home_occupation",
      phase: "permit",
      title: L("Get a home occupation permit", "Obtenga un permiso de ocupación en el hogar", "Ստացեք տնային գործունեության թույլտվություն"),
      description: L(
        "Glendale allows many low-impact businesses at home, with limits on customers, signs, employees and storage. Confirm the current rules with Planning.",
        "Glendale permite muchos negocios de bajo impacto en casa, con límites de clientes, letreros, empleados y almacenamiento. Confirme las reglas actuales con Planificación.",
        "Գլենդեյլը թույլ է տալիս տնից վարել ցածր ազդեցությամբ շատ բիզնեսներ՝ հաճախորդների, ցուցանակների, աշխատողների և պահեստավորման սահմանափակումներով։ Հաստատեք գործող կանոնները Պլանավորման բաժնում։",
      ),
      appliesBecause: L(
        "You plan to run the business from your home.",
        "Planea operar el negocio desde su casa.",
        "Դուք նախատեսում եք բիզնեսը վարել ձեր տնից։",
      ),
      source: "glendalePlanning",
      timeEstimate: "1–3 weeks",
      required: true,
    });
    if (!f.homeBasedOk) {
      steps.push({
        id: "home_not_typical",
        phase: "plan",
        title: L("Check whether this business can run from home", "Verifique si este negocio puede operar desde casa", "Ստուգեք՝ արդյոք այս բիզնեսը կարող է գործել տնից"),
        description: L(
          "This type usually needs a commercial space (customers, equipment or health/safety rules). Ask Planning before investing.",
          "Este tipo de negocio suele necesitar un local comercial (clientes, equipo o normas de salud y seguridad). Consulte a Planificación antes de invertir.",
          "Այս տեսակը սովորաբար պահանջում է առևտրային տարածք (հաճախորդներ, սարքավորումներ կամ առողջության/անվտանգության կանոններ)։ Ներդրումից առաջ դիմեք Պլանավորման բաժին։",
        ),
        appliesBecause: because(b, "usually not allowed as a home occupation.", "normalmente no se permite como ocupación en el hogar.", "սովորաբար չի թույլատրվում որպես տնային գործունեություն։"),
        source: "glendalePlanning",
        required: true,
      });
    }
  }

  if (isCottage) {
    steps.push({
      id: "cottage_food_permit",
      phase: "permit",
      title: L("Register your Cottage Food Operation with LA County", "Registre su operación de cottage food en el Condado de LA", "Գրանցեք ձեր տնային սննդի (cottage food) գործունեությունը ԼԱ շրջանում"),
      description: L(
        "Class A (direct sales) or Class B (also through shops/restaurants). Only approved non-perishable foods; food handler training required.",
        "Clase A (venta directa) o Clase B (también a través de tiendas/restaurantes). Solo alimentos aprobados no perecederos; se requiere capacitación en manejo de alimentos.",
        "A դաս (ուղղակի վաճառք) կամ B դաս (նաև խանութների/ռեստորանների միջոցով)։ Միայն թույլատրված չփչացող սնունդ․ պահանջվում է սննդի հետ աշխատելու դասընթաց։",
      ),
      appliesBecause: because(b, "you will sell food made in your home kitchen.", "venderá alimentos hechos en la cocina de su casa.", "դուք վաճառելու եք ձեր տնային խոհանոցում պատրաստված սնունդ։"),
      source: "laCottage",
      costEstimate: "~$100–$300/yr",
      timeEstimate: "2–4 weeks",
      required: true,
    });
  } else if (f.healthPermit) {
    steps.push({
      id: "health_permit",
      phase: "permit",
      title: L(
        "Food facility plan check + public health permit (LA County)",
        "Revisión de planos y permiso de salud pública (Condado de LA)",
        "Սննդի օբյեկտի նախագծի ստուգում և հանրային առողջության թույլտվություն (ԼԱ շրջան)",
      ),
      description: L(
        "Glendale food businesses are permitted by LA County Environmental Health. Submit kitchen/floor plans for plan check before construction, pass the final inspection, then get your annual health permit. Staff need food handler cards.",
        "Los negocios de comida en Glendale los regula Salud Ambiental del Condado de LA. Presente planos de cocina antes de construir, apruebe la inspección final y obtenga su permiso de salud anual. El personal necesita tarjetas de manipulador de alimentos.",
        "Գլենդեյլի սննդի բիզնեսները թույլտվություն են ստանում ԼԱ շրջանի Շրջակա միջավայրի առողջության բաժնից։ Շինարարությունից առաջ ներկայացրեք խոհանոցի նախագծերը, անցեք վերջնական ստուգումը և ստացեք տարեկան թույլտվությունը։ Աշխատակիցներին անհրաժեշտ են սննդի հետ աշխատելու քարտեր։",
      ),
      appliesBecause: because(b, "you prepare or sell food.", "usted prepara o vende alimentos.", "դուք պատրաստում կամ վաճառում եք սնունդ։"),
      source: "laEh",
      costEstimate: "Plan check ~$1,000+; annual permit ~$500–$1,500",
      timeEstimate: "4–12 weeks",
      required: true,
    });
  }

  if (f.alcohol || (b.category === "food" && storefront && !isCottage)) {
    steps.push({
      id: "abc_license",
      phase: "permit",
      title: L("Apply for an ABC alcohol license", "Solicite una licencia de alcohol del ABC", "Դիմեք ABC ալկոհոլային լիցենզիայի համար"),
      description: L(
        "Selling beer, wine or spirits requires a state ABC license (and often a City use permit). Allow several months; licenses in some areas are limited.",
        "Vender cerveza, vino o licores requiere una licencia estatal del ABC (y a menudo un permiso de uso de la Ciudad). Prevea varios meses; en algunas zonas las licencias son limitadas.",
        "Գարեջուր, գինի կամ ոգելից խմիչքներ վաճառելու համար պահանջվում է նահանգային ABC լիցենզիա (և հաճախ՝ Քաղաքի օգտագործման թույլտվություն)։ Հաշվի առեք մի քանի ամիս․ որոշ տարածքներում լիցենզիաները սահմանափակ են։",
      ),
      appliesBecause: f.alcohol
        ? because(b, "you plan to sell alcohol.", "planea vender alcohol.", "դուք նախատեսում եք ալկոհոլ վաճառել։")
        : L(
            "Only if you want to serve beer or wine.",
            "Solo si quiere servir cerveza o vino.",
            "Միայն եթե ցանկանում եք գարեջուր կամ գինի մատուցել։",
          ),
      source: "abc",
      costEstimate: "~$300–$15,000+ depending on license type",
      timeEstimate: "45 days – 6 months",
      required: f.alcohol,
    });
  }

  if (b.category === "personal_care") {
    steps.push({
      id: "establishment_license",
      phase: "permit",
      title: L("Get a Barbering & Cosmetology establishment license", "Obtenga la licencia de establecimiento de Barbería y Cosmetología", "Ստացեք Վարսավիրության և կոսմետոլոգիայի հաստատության լիցենզիա"),
      description: L(
        "The shop itself needs a state establishment license, and every barber, cosmetologist, manicurist or esthetician needs their own license.",
        "El local necesita una licencia estatal de establecimiento y cada barbero, cosmetólogo, manicurista o esteticista necesita su propia licencia.",
        "Սրահին անհրաժեշտ է նահանգային հաստատության լիցենզիա, և յուրաքանչյուր վարսավիր, կոսմետոլոգ, մատնահարդար կամ էսթետիկ պետք է ունենա իր լիցենզիան։",
      ),
      appliesBecause: because(b, "you offer licensed beauty or grooming services.", "ofrece servicios de belleza que requieren licencia.", "դուք մատուցում եք լիցենզավորվող գեղեցկության ծառայություններ։"),
      source: "barberCosmo",
      costEstimate: "~$50–$150",
      timeEstimate: "2–6 weeks",
      required: true,
    });
  }

  if (b.category === "auto") {
    steps.push({
      id: "bar_registration",
      phase: "permit",
      title: L("Register with the Bureau of Automotive Repair (BAR)", "Regístrese en la Oficina de Reparación Automotriz (BAR)", "Գրանցվեք Ավտովերանորոգման բյուրոյում (BAR)"),
      description: L(
        "California requires auto repair dealers to register with BAR before doing repairs for pay. Smog check stations need an additional license.",
        "California exige que los talleres se registren en BAR antes de hacer reparaciones pagadas. Las estaciones de smog necesitan una licencia adicional.",
        "Կալիֆոռնիան պահանջում է, որ ավտովերանորոգման կետերը գրանցվեն BAR-ում նախքան վճարովի վերանորոգում կատարելը։ Սմոգ ստուգման կայաններին անհրաժեշտ է լրացուցիչ լիցենզիա։",
      ),
      appliesBecause: because(b, "you will repair vehicles for customers.", "reparará vehículos para clientes.", "դուք վերանորոգելու եք հաճախորդների մեքենաները։"),
      source: "bar",
      costEstimate: "~$200–$300/yr",
      timeEstimate: "2–4 weeks",
      required: true,
    });
  }

  if (b.category === "childcare") {
    steps.push({
      id: "child_care_license",
      phase: "permit",
      title: L("Get a child care license (CDSS Community Care Licensing)", "Obtenga una licencia de cuidado infantil (CDSS)", "Ստացեք երեխաների խնամքի լիցենզիա (CDSS)"),
      description: L(
        "Child care centers and family child care homes must be licensed by the state: orientation, application, background checks and a facility inspection.",
        "Los centros de cuidado infantil y los hogares de cuidado familiar deben tener licencia estatal: orientación, solicitud, verificación de antecedentes e inspección.",
        "Երեխաների խնամքի կենտրոնները և ընտանեկան խնամքի տները պետք է ունենան նահանգային լիցենզիա․ կողմնորոշում, դիմում, անցյալի ստուգում և տարածքի զննում։",
      ),
      appliesBecause: because(b, "you will care for children.", "cuidará niños.", "դուք խնամելու եք երեխաների։"),
      source: "cdssChildCare",
      costEstimate: "~$100–$1,000+ depending on capacity",
      timeEstimate: "3–6 months",
      required: true,
    });
  }

  if (storefront) {
    steps.push({
      id: "building_permits",
      phase: "permit",
      title: L(
        "Building permits & Certificate of Occupancy",
        "Permisos de construcción y Certificado de Ocupación",
        "Շինարարական թույլտվություններ և շահագործման վկայական",
      ),
      description: L(
        "Any remodel, new walls, plumbing, electrical or a change of use needs permits from Glendale Building & Safety. Ask whether your space needs a new Certificate of Occupancy.",
        "Cualquier remodelación, paredes nuevas, plomería, electricidad o cambio de uso requiere permisos de Construcción y Seguridad de Glendale. Pregunte si su local necesita un nuevo Certificado de Ocupación.",
        "Ցանկացած վերանորոգում, նոր պատեր, սանտեխնիկա, էլեկտրականություն կամ օգտագործման փոփոխություն պահանջում է Գլենդեյլի Շինարարության և անվտանգության բաժնի թույլտվություն։ Հարցրեք՝ արդյոք ձեր տարածքին նոր շահագործման վկայական է պետք։",
      ),
      appliesBecause: L(
        "You will open in a commercial space.",
        "Abrirá en un local comercial.",
        "Դուք բացվելու եք առևտրային տարածքում։",
      ),
      source: "glendaleBuilding",
      costEstimate: "Varies with project value",
      timeEstimate: "2–8 weeks",
      required: b.category === "food" || b.category === "childcare" || b.category === "fitness" || b.category === "auto",
    });

    steps.push({
      id: "fire_inspection",
      phase: "permit",
      title: L("Fire inspection / fire permit", "Inspección o permiso de bomberos", "Հրշեջ ստուգում / թույլտվություն"),
      description: L(
        "Glendale Fire Prevention inspects businesses for exits, extinguishers and occupancy. Cooking hoods, flammable materials and assembly spaces may need a fire permit.",
        "Prevención de Incendios de Glendale inspecciona salidas, extintores y ocupación. Campanas de cocina, materiales inflamables y espacios de reunión pueden requerir permiso.",
        "Գլենդեյլի հրդեհային կանխարգելման ծառայությունը ստուգում է ելքերը, կրակմարիչները և տարողությունը։ Խոհանոցային օդաքաշերը, դյուրավառ նյութերը և հավաքատեղիները կարող են թույլտվություն պահանջել։",
      ),
      appliesBecause: L(
        "Commercial spaces open to the public are inspected.",
        "Se inspeccionan los locales comerciales abiertos al público.",
        "Հանրության համար բաց առևտրային տարածքները ստուգվում են։",
      ),
      source: "glendaleFire",
      timeEstimate: "1–3 weeks",
      required: b.category === "food" || b.category === "childcare" || b.category === "fitness" || b.category === "auto",
    });

    steps.push({
      id: "sign_permit",
      phase: "permit",
      title: L("Sign permit", "Permiso de letrero", "Ցուցանակի թույլտվություն"),
      description: L(
        "Most exterior signs need City review and a permit before installation.",
        "La mayoría de los letreros exteriores necesitan revisión y permiso de la Ciudad antes de instalarse.",
        "Արտաքին ցուցանակների մեծ մասը տեղադրումից առաջ պահանջում է Քաղաքի ստուգում և թույլտվություն։",
      ),
      appliesBecause: L("Only if you add an outdoor sign.", "Solo si instala un letrero exterior.", "Միայն եթե արտաքին ցուցանակ եք տեղադրում։"),
      source: "glendalePlanning",
      timeEstimate: "1–4 weeks",
      required: false,
    });
  }

  // ---------------- OPEN ----------------
  const hazardsInZone = site?.hazards.filter((h) => h.status === "in_zone") ?? [];
  steps.push({
    id: "insurance",
    phase: "open",
    title: L("Get business insurance", "Obtenga un seguro para su negocio", "Ձեռք բերեք բիզնեսի ապահովագրություն"),
    description: L(
      "General liability is usually required by landlords. Workers' compensation is mandatory in California once you have employees.",
      "Los arrendadores suelen exigir seguro de responsabilidad general. La compensación laboral es obligatoria en California cuando tiene empleados.",
      "Վարձատուները սովորաբար պահանջում են ընդհանուր պատասխանատվության ապահովագրություն։ Աշխատողներ ունենալու դեպքում Կալիֆոռնիայում աշխատողների փոխհատուցման ապահովագրությունը պարտադիր է։",
    ),
    appliesBecause:
      hazardsInZone.length > 0
        ? L(
            `This site is in ${hazardsInZone.length} hazard zone(s) — ask about earthquake, fire or flood coverage.`,
            `Este sitio está en ${hazardsInZone.length} zona(s) de riesgo: pregunte por cobertura de terremoto, incendio o inundación.`,
            `Այս տարածքը գտնվում է ${hazardsInZone.length} վտանգավոր գոտում․ հարցրեք երկրաշարժի, հրդեհի կամ ջրհեղեղի ապահովագրության մասին։`,
          )
        : ALWAYS,
    source: "sbaInsurance",
    costEstimate: "~$500–$3,000/yr",
    timeEstimate: "1–7 days",
    required: true,
  });

  steps.push({
    id: "local_support",
    phase: "open",
    title: L("Connect with Glendale small-business support", "Conéctese con el apoyo a pequeños negocios de Glendale", "Կապվեք Գլենդեյլի փոքր բիզնեսի աջակցման ծառայությունների հետ"),
    description: L(
      "The City's Economic Development team can point you to grants, workshops and grand-opening help.",
      "El equipo de Desarrollo Económico de la Ciudad puede orientarle sobre subvenciones, talleres y ayuda para la inauguración.",
      "Քաղաքի Տնտեսական զարգացման թիմը կարող է ուղղորդել դրամաշնորհների, սեմինարների և բացման արարողության աջակցության հարցում։",
    ),
    appliesBecause: ALWAYS,
    source: "glendaleEconDev",
    costEstimate: "Free",
    required: false,
  });

  // Order: by phase, then insertion order.
  const phaseIdx = (p: RoadmapPhase) => ROADMAP_PHASES.indexOf(p);
  const sorted = steps
    .map((s, i) => ({ s, i }))
    .sort((a, z) => phaseIdx(a.s.phase) - phaseIdx(z.s.phase) || a.i - z.i)
    .map(({ s }) => s);

  const out: RoadmapStep[] = sorted.map((d, i) => {
    const src = SOURCES[d.source];
    return {
      id: d.id,
      phase: d.phase,
      order: i + 1,
      title: d.title,
      description: d.description,
      appliesBecause: d.appliesBecause,
      agency: src.agency,
      url: src.url,
      costEstimate: d.costEstimate,
      timeEstimate: d.timeEstimate,
      required: d.required,
      verified: src.ok,
    };
  });
  return { steps: out, generatedAt };
}
