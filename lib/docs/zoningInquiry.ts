import type { LocalizedText } from "@/lib/contracts";
import type { GeneratedDoc, DocInput } from "./types";
import { L, same, businessName, businessAddress, VERDICT_LABEL, STRUCTURE_LABEL, localizedDate } from "./common";

const withArticle = (name: string) => `${/^[aeiou]/i.test(name) ? "an" : "a"} ${name.toLowerCase()}`;

export const GLENDALE_PLANNING_URL = "https://www.glendaleca.gov/government/departments/community-development/planning";

const join = (parts: LocalizedText[], sep = " "): LocalizedText => ({
  en: parts.map((p) => p.en).filter(Boolean).join(sep),
  es: parts.map((p) => p.es).filter(Boolean).join(sep),
  hy: parts.map((p) => p.hy).filter(Boolean).join(sep),
});

/** Pre-lease zoning inquiry to the City of Glendale Planning Division. */
export function buildZoningInquiry(input: DocInput): GeneratedDoc {
  const f = input.form;
  const biz = businessName(input);
  const site = input.locationMode === "address" ? input.site ?? null : null;
  const addrRaw = businessAddress(input);
  const addr = addrRaw
    ? same(addrRaw)
    : L("[address of the property]", "[dirección de la propiedad]", "[գույքի հասցեն]");
  const code = site?.zoning.code ?? null;
  const zoneText: LocalizedText = code
    ? site?.zoning.name
      ? { en: `${code} (${site.zoning.name.en})`, es: `${code} (${site.zoning.name.es})`, hy: `${code} (${site.zoning.name.hy})` }
      : same(code)
    : L("[zone, if known]", "[zona, si la conoce]", "[գոտին, եթե հայտնի է]");
  const owner = f.ownerNames.trim() || "";
  const dba = f.businessName.trim();
  const signName = owner ? same(owner) : L("[your name]", "[su nombre]", "[ձեր անունը]");

  const subject = join([
    L("Zoning use confirmation before signing a lease:", "Confirmación de uso de zonificación antes de firmar un arrendamiento:", "Գոտիավորման օգտագործման հաստատում՝ վարձակալություն կնքելուց առաջ."),
    addr,
    code ? same(`(${code})`) : same(""),
  ]);

  const intro = join([
    L("I am planning to open", "Planeo abrir un negocio de tipo", "Պլանավորում եմ բացել"),
    { en: withArticle(biz.en), es: `«${biz.es}»`, hy: `«${biz.hy}»` },
    dba ? { en: `called "${dba}"`, es: `llamado "${dba}"`, hy: `«${dba}» անվամբ` } : same(""),
    L("at", "en", "հետևյալ հասցեում՝"),
    addr,
    L(
      "and would like the Planning Division to confirm the zoning requirements before I sign a lease.",
      "y quisiera que la División de Planificación confirme los requisitos de zonificación antes de firmar un contrato de arrendamiento.",
      "և կխնդրեի, որ Պլանավորման բաժինը հաստատի գոտիավորման պահանջները՝ նախքան վարձակալության պայմանագիր կնքելը։",
    ),
  ]);

  const prelim: LocalizedText | null = site
    ? join([
        L(
          "A preliminary check using City of Glendale GIS data shows the parcel in zone",
          "Una revisión preliminar con datos SIG de la Ciudad de Glendale muestra la parcela en la zona",
          "Գլենդեյլ քաղաքի GIS տվյալներով նախնական ստուգումը ցույց է տալիս, որ հողամասը գտնվում է",
        ),
        zoneText,
        L("with the result:", "con el resultado:", "գոտում, արդյունքը՝"),
        { en: `"${VERDICT_LABEL[site.verdict.status].en}".`, es: `"${VERDICT_LABEL[site.verdict.status].es}".`, hy: `«${VERDICT_LABEL[site.verdict.status].hy}»։` },
        L(
          "I understand this is not an official determination.",
          "Entiendo que esto no es una determinación oficial.",
          "Հասկանում եմ, որ սա պաշտոնական որոշում չէ։",
        ),
      ])
    : null;

  const questions: LocalizedText[] = [
    join([
      L("Is", "¿Es un negocio de tipo", "Արդյո՞ք"),
      { en: withArticle(biz.en), es: `«${biz.es}»`, hy: `«${biz.hy}»-ը` },
      L("a permitted use in zone", "un uso permitido en la zona", "թույլատրված օգտագործում է"),
      code ? same(code) : zoneText,
      L("at this address?", "en esta dirección?", "գոտում այս հասցեում։"),
    ]),
    L(
      "Does this use need a Conditional Use Permit (CUP), Administrative Use Permit or any other discretionary review here? If so, what are the typical timeline and fees?",
      "¿Este uso necesita un Permiso de Uso Condicional (CUP), un Permiso de Uso Administrativo u otra revisión discrecional aquí? Si es así, ¿cuáles son los plazos y tarifas habituales?",
      "Արդյո՞ք այս օգտագործման համար այստեղ անհրաժեշտ է պայմանական օգտագործման թույլտվություն (CUP), վարչական օգտագործման թույլտվություն կամ այլ հայեցողական վերանայում։ Եթե այո, որքա՞ն են սովորական ժամկետներն ու վճարները։",
    ),
    L(
      "What parking requirements apply, and would this count as a change of use from the previous tenant?",
      "¿Qué requisitos de estacionamiento aplican, y esto contaría como un cambio de uso respecto al inquilino anterior?",
      "Ի՞նչ ավտոկայանատեղիի պահանջներ են գործում, և արդյո՞ք սա կհամարվի օգտագործման փոփոխություն նախորդ վարձակալի համեմատ։",
    ),
    L(
      "Does a specific plan, overlay zone or design review apply to this parcel (including signage)?",
      "¿Aplica a esta parcela algún plan específico, zona superpuesta o revisión de diseño (incluidos letreros)?",
      "Արդյո՞ք այս հողամասի վրա տարածվում է հատուկ պլան, վերադրված գոտի կամ դիզայնի վերանայում (ներառյալ ցուցանակները)։",
    ),
    L(
      "Are there limits on hours of operation, outdoor seating, or the number of employees or customers?",
      "¿Hay límites en el horario de atención, asientos al aire libre o el número de empleados o clientes?",
      "Կա՞ն սահմանափակումներ աշխատանքային ժամերի, բացօթյա նստատեղերի կամ աշխատողների ու հաճախորդների թվի վրա։",
    ),
  ];
  if (input.locationMode === "home") {
    questions.push(
      L(
        "This would be run from my home. What does a Home Occupation Permit require, and which activities are not allowed at a residence?",
        "Lo administraría desde mi casa. ¿Qué requiere un Permiso de Ocupación Doméstica y qué actividades no se permiten en una residencia?",
        "Այն կգործի իմ տնից։ Ի՞նչ է պահանջում տնային զբաղվածության թույլտվությունը, և ի՞նչ գործողություններ չեն թույլատրվում բնակելի տանը։",
      ),
    );
  }

  const contact = [f.email.trim(), f.phone.trim()].filter(Boolean).join(" · ");

  return {
    id: "zoning_inquiry",
    title: L(
      "Pre-lease zoning inquiry to Glendale Planning",
      "Consulta de zonificación antes del arrendamiento a Planificación de Glendale",
      "Գոտիավորման հարցում Գլենդեյլի Պլանավորման բաժնին՝ վարձակալությունից առաջ",
    ),
    subtitle: L(
      "Send this before you sign a lease. Ask for the answer in writing.",
      "Envíelo antes de firmar un arrendamiento. Pida la respuesta por escrito.",
      "Ուղարկեք սա մինչև վարձակալության պայմանագիր կնքելը։ Խնդրեք պատասխանը գրավոր։",
    ),
    sections: [
      {
        heading: L("Send to", "Enviar a", "Ուղարկել"),
        fields: [
          {
            label: L("To", "Para", "Ում"),
            value: L(
              "City of Glendale, Community Development Department, Planning Division",
              "Ciudad de Glendale, Departamento de Desarrollo Comunitario, División de Planificación",
              "Գլենդեյլ քաղաք, Համայնքային զարգացման վարչություն, Պլանավորման բաժին",
            ),
          },
          {
            label: L("Where", "Dónde", "Որտեղ"),
            value: L(
              "Use the contact email or counter address listed on the Planning Division page (confirm with agency).",
              "Use el correo o la dirección de atención indicados en la página de la División de Planificación (confirme con la agencia).",
              "Օգտագործեք Պլանավորման բաժնի էջում նշված էլ. հասցեն կամ ընդունարանի հասցեն (հաստատեք գերատեսչության հետ)։",
            ),
          },
          { label: L("Subject", "Asunto", "Թեմա"), value: subject },
          { label: L("Date", "Fecha", "Ամսաթիվ"), value: localizedDate(input.today) },
        ],
        links: [
          {
            label: L("City of Glendale Planning Division", "División de Planificación de la Ciudad de Glendale", "Գլենդեյլ քաղաքի Պլանավորման բաժին"),
            url: GLENDALE_PLANNING_URL,
          },
        ],
      },
      {
        heading: L("Message", "Mensaje", "Նամակ"),
        paragraphs: [
          L("Dear Planning Division staff,", "Estimado personal de la División de Planificación:", "Հարգելի Պլանավորման բաժնի աշխատակիցներ,"),
          intro,
          ...(prelim ? [prelim] : []),
          L("Could you please confirm the following:", "¿Podrían confirmar lo siguiente?", "Խնդրում եմ հաստատել հետևյալը՝"),
        ],
        bullets: questions,
      },
      {
        heading: L("Closing", "Cierre", "Ավարտ"),
        paragraphs: [
          L(
            "A written reply (email is fine) would help me decide whether to sign the lease. Thank you for your help.",
            "Una respuesta por escrito (un correo está bien) me ayudaría a decidir si firmo el arrendamiento. Gracias por su ayuda.",
            "Գրավոր պատասխանը (էլ. նամակը նույնպես հարմար է) կօգնի ինձ որոշել՝ կնքե՞լ վարձակալության պայմանագիրը։ Շնորհակալություն օգնության համար։",
          ),
          L("Sincerely,", "Atentamente,", "Հարգանքով՝"),
          signName,
          ...(dba ? [join([same(dba), same("—"), STRUCTURE_LABEL[f.structure]])] : []),
          ...(contact ? [same(contact)] : []),
        ],
      },
    ],
  };
}
