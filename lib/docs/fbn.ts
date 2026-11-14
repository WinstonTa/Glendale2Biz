import type { GeneratedDoc, DocInput, DocField } from "./types";
import { L, valueOr, STRUCTURE_LABEL, TO_FILL, businessAddress, localizedDate } from "./common";

export const FBN_URL = "https://www.lavote.gov/home/county-clerk/fictitious-business-names";

/** LA County Fictitious Business Name statement worksheet (pre-filled). */
export function buildFbnWorksheet(input: DocInput): GeneratedDoc {
  const f = input.form;
  const addr = businessAddress(input);
  const isEntity = f.structure === "llc" || f.structure === "corporation";

  const fields: DocField[] = [
    {
      label: L("1. Fictitious business name(s)", "1. Nombre(s) comercial(es) ficticio(s)", "1. Ֆիկտիվ բիզնես անվանում(ներ)"),
      ...valueOr(f.businessName),
    },
    {
      label: L(
        "2. Street address of principal place of business (no P.O. box)",
        "2. Dirección física del lugar principal de negocio (sin apartado postal)",
        "2. Գործունեության հիմնական վայրի փողոցային հասցե (ոչ փոստարկղ)",
      ),
      ...valueOr(addr),
    },
    {
      label: L("3. Mailing address, if different", "3. Dirección postal, si es diferente", "3. Փոստային հասցե, եթե տարբեր է"),
      value: L("[only if different]", "[solo si es diferente]", "[միայն եթե տարբեր է]"),
    },
    {
      label: isEntity
        ? L(
            "4. Registrant: entity name, state of organization and CA Secretary of State file number",
            "4. Registrante: nombre de la entidad, estado de constitución y número de archivo del Secretario de Estado de CA",
            "4. Գրանցող՝ կազմակերպության անվանում, գրանցման նահանգ և Կալիֆոռնիայի պետքարտուղարի ֆայլի համար",
          )
        : L(
            "4. Registrant(s): full legal name and residence address of each owner",
            "4. Registrante(s): nombre legal completo y domicilio de cada propietario",
            "4. Գրանցող(ներ)՝ յուրաքանչյուր սեփականատիրոջ լրիվ իրավական անունը և բնակության հասցեն",
          ),
      ...valueOr(f.ownerNames),
    },
    {
      label: L("5. Business is conducted by", "5. El negocio es dirigido por", "5. Բիզնեսը վարում է"),
      value: STRUCTURE_LABEL[f.structure],
    },
    {
      label: L(
        "6. Date registrant started doing business under this name",
        "6. Fecha en que el registrante comenzó a operar con este nombre",
        "6. Այս անվամբ գործունեություն սկսելու ամսաթիվը",
      ),
      ...(f.startDate
        ? { value: localizedDate(f.startDate) }
        : { value: L("Not yet started", "Aún no ha comenzado", "Դեռ չի սկսվել") }),
    },
    {
      label: L(
        "7. Signature, printed name and title of registrant",
        "7. Firma, nombre en letra de molde y cargo del registrante",
        "7. Գրանցողի ստորագրությունը, տպագիր անունը և պաշտոնը",
      ),
      value: TO_FILL,
      missing: true,
    },
  ];

  return {
    id: "fbn",
    title: L(
      "Fictitious Business Name (DBA) statement worksheet",
      "Hoja de trabajo para la declaración de Nombre Comercial Ficticio (DBA)",
      "Ֆիկտիվ բիզնես անվանման (DBA) հայտարարության աշխատանքային թերթիկ",
    ),
    subtitle: L(
      "Los Angeles County Registrar-Recorder/County Clerk",
      "Registrador-Archivista/Secretario del Condado de Los Ángeles",
      "Լոս Անջելեսի շրջանի գրանցող-արձանագրող/շրջանային քարտուղար",
    ),
    sections: [
      {
        heading: L("Who needs this", "Quién lo necesita", "Ում է սա պետք"),
        paragraphs: [
          L(
            "You generally need an FBN statement if your business name does not include the surname of every owner, or if it suggests extra owners (for example \"& Sons\" or \"Group\"). LLCs and corporations need one when they operate under a name that differs from their registered name.",
            "Por lo general necesita una declaración FBN si el nombre de su negocio no incluye el apellido de cada propietario, o si sugiere más propietarios (por ejemplo \"e Hijos\" o \"Grupo\"). Las LLC y corporaciones la necesitan cuando operan con un nombre distinto al registrado.",
            "Սովորաբար FBN հայտարարություն անհրաժեշտ է, եթե բիզնեսի անվանումը չի ներառում յուրաքանչյուր սեփականատիրոջ ազգանունը կամ ենթադրում է լրացուցիչ սեփականատերեր (օր.՝ «և որդիներ» կամ «Խումբ»)։ LLC-ներին և կորպորացիաներին այն պետք է, երբ գործում են գրանցվածից տարբեր անվամբ։",
          ),
        ],
      },
      {
        heading: L("Form fields, pre-filled", "Campos del formulario, ya completados", "Ձևի դաշտերը՝ նախապես լրացված"),
        fields,
      },
      {
        heading: L("Next steps", "Próximos pasos", "Հաջորդ քայլերը"),
        checklist: [
          L(
            "File the statement with the LA County Registrar-Recorder/County Clerk (in person, by mail, or online where offered).",
            "Presente la declaración ante el Registrador-Archivista/Secretario del Condado de Los Ángeles (en persona, por correo o en línea si está disponible).",
            "Ներկայացրեք հայտարարությունը Լոս Անջելեսի շրջանի գրանցող-արձանագրողին/շրջանային քարտուղարին (անձամբ, փոստով կամ առցանց, եթե հասանելի է)։",
          ),
          L(
            "Pay the filing fee. Fee: confirm with agency.",
            "Pague la tarifa de presentación. Tarifa: confirme con la agencia.",
            "Վճարեք ներկայացման վճարը։ Վճար՝ հաստատեք գերատեսչության հետ։",
          ),
          L(
            "Within 30 days of filing, start publishing the statement in an adjudicated newspaper of general circulation in LA County, once a week for 4 consecutive weeks.",
            "Dentro de los 30 días posteriores a la presentación, comience a publicar la declaración en un periódico adjudicado de circulación general en el Condado de Los Ángeles, una vez por semana durante 4 semanas consecutivas.",
            "Ներկայացումից հետո 30 օրվա ընթացքում սկսեք հրապարակել հայտարարությունը Լոս Անջելեսի շրջանի ընդհանուր տարածման դատարանով հաստատված թերթում՝ շաբաթը մեկ անգամ, 4 անընդմեջ շաբաթ։",
          ),
          L(
            "File the newspaper's proof of publication (affidavit) with the County Clerk.",
            "Presente la prueba de publicación (declaración jurada) del periódico ante el Secretario del Condado.",
            "Թերթի հրապարակման ապացույցը (երդմնագիրը) ներկայացրեք շրջանային քարտուղարին։",
          ),
          L(
            "Refile before the statement expires, 5 years from the filing date, or sooner if the facts change.",
            "Vuelva a presentarla antes de que venza, 5 años después de la fecha de presentación, o antes si cambian los datos.",
            "Վերաներկայացրեք մինչև ժամկետի ավարտը՝ ներկայացման օրվանից 5 տարի հետո, կամ ավելի շուտ, եթե տվյալները փոխվեն։",
          ),
        ],
        links: [
          {
            label: L(
              "LA County: Fictitious Business Names",
              "Condado de Los Ángeles: Nombres Comerciales Ficticios",
              "Լոս Անջելեսի շրջան՝ ֆիկտիվ բիզնես անվանումներ",
            ),
            url: FBN_URL,
          },
        ],
      },
    ],
  };
}
