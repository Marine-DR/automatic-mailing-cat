export type FieldKind =
  | "text"
  | "email"
  | "date"
  | "enum"
  | "phone"
  | "year"
  | "digits15";

export interface FieldSchema {
  key: string;
  label: string;
  sourceLabel: string;
  sourceAliases: string[];
  kind: FieldKind;
  required: boolean;
  allowedValues?: string[];
}

export interface SystemColumnSchema {
  key: string;
  label: string;
  kind: "checkbox" | "text";
}

export const VALIDATED_SHEET_NAME = "Validated Adoptions";
export const MENU_NAME = "Cat Automation";

export const ADOPTION_FIELDS: FieldSchema[] = [
  {
    key: "adoptionDate",
    label: "Date adoption",
    sourceLabel: "Date_adoption",
    sourceAliases: ["Date_adoption", "Date adoption"],
    kind: "date",
    required: true
  },
  {
    key: "store",
    label: "Magasin",
    sourceLabel: "Magasin",
    sourceAliases: ["Magasin"],
    kind: "enum",
    required: true
    ,
    allowedValues: [
      "Amazonie Labège",
      "Animal & Co Tlse",
      "Animalis Portet",
      "Animalis Tlse",
      "Aquacanine Balma",
      "Biofood Villefranche",
      "Botanic Labège",
      "Bricomarché",
      "Domicile",
      "Jardiland Montaudran",
      "La Jardinerie Tlsaine",
      "Maxi Zoo St Orens",
      "Médor Labège",
      "Médor Portet",
      "Pépinière du Lauragais",
      "RAGT Balma",
      "Solignac Bessieres",
      "Truffaut Balma",
      "Truffaut Tlse",
      "Autre"
    ]
  },
  {
    key: "courtesyTitle",
    label: "Civilite",
    sourceLabel: "M_Me",
    sourceAliases: ["M_Me", "M Me"],
    kind: "enum",
    required: false,
    allowedValues: ["M", "Me"]
  },
  {
    key: "lastName",
    label: "Nom",
    sourceLabel: "NOM",
    sourceAliases: ["NOM", "Nom"],
    kind: "text",
    required: true
  },
  {
    key: "firstName",
    label: "Prenom",
    sourceLabel: "Prénom",
    sourceAliases: ["Prenom", "Prénom", "Prenom adoptant"],
    kind: "text",
    required: true
  },
  {
    key: "recipientEmail",
    label: "Recipient",
    sourceLabel: "Recipient",
    sourceAliases: ["Recipient", "Email"],
    kind: "email",
    required: true
  },
  {
    key: "phone",
    label: "Telephone",
    sourceLabel: "Téléphone",
    sourceAliases: ["Telephone", "Téléphone"],
    kind: "phone",
    required: false
  },
  {
    key: "catName",
    label: "Nom chat",
    sourceLabel: "Nom chat",
    sourceAliases: ["Nom chat"],
    kind: "text",
    required: true
  },
  {
    key: "identificationNumber",
    label: "Numero identification",
    sourceLabel: "Numéro identification",
    sourceAliases: ["Numero identification", "Numéro identification"],
    kind: "digits15",
    required: true
  },
  {
    key: "birthDate",
    label: "Date naissance",
    sourceLabel: "Date de naissance",
    sourceAliases: ["Date de naissance"],
    kind: "date",
    required: true
  },
  {
    key: "ageGroup",
    label: "Adulte ou Chaton",
    sourceLabel: "Adulte / Chaton",
    sourceAliases: ["Adulte / Chaton"],
    kind: "enum",
    required: true,
    allowedValues: ["Adulte", "Chaton"]
  },
  {
    key: "sex",
    label: "Sexe",
    sourceLabel: "Sexe",
    sourceAliases: ["Sexe"],
    kind: "enum",
    required: true,
    allowedValues: ["F", "M"]
  },
  {
    key: "sterilized",
    label: "Ste fait",
    sourceLabel: "Sté_Fait",
    sourceAliases: ["Ste_Fait", "Sté_Fait"],
    kind: "enum",
    required: false,
    allowedValues: ["OK", "NON", "N/A"]
  },
  {
    key: "sterilizationVet",
    label: "Veto pour ste",
    sourceLabel: "Véto pour sté ?",
    sourceAliases: ["Veto pour ste ?", "Véto pour sté ?"],
    kind: "enum",
    required: false,
    allowedValues: [
      "Baziège",
      "Bessières",
      "Carmes",
      "Castelginest",
      "Cazères",
      "Colomiers",
      "Cros",
      "Escalquens",
      "Fronton",
      "Labège",
      "Lanta",
      "Le Vernet",
      "Montaudran",
      "Nailloux",
      "Orangeraie",
      "Portet",
      "Pradettes",
      "Pujo",
      "Quint",
      "St Paul",
      "Tlse: Blaszczyk",
      "Verfeil",
      "Autre"
    ]
  },
  {
    key: "remainingService",
    label: "Presta restante",
    sourceLabel: "Presta restant à faire le jour de la JA",
    sourceAliases: ["Presta restant a faire le jour de la JA", "Presta restant à faire le jour de la JA"],
    kind: "enum",
    required: false,
    allowedValues: [
      "ok",
      "Identif+Sté+Vacc+tests",
      "Identification et vaccination",
      "Stérilisation",
      "Stérilisation + test FIV/FELV",
      "Stérilisation et vaccination",
      "Test FIV/FELV",
      "Vaccination"
    ]
  },
  {
    key: "ieDossierComplete",
    label: "Dossier IE complet",
    sourceLabel: "Dossier IE complet ?",
    sourceAliases: ["Dossier IE complet ?"],
    kind: "enum",
    required: false,
    allowedValues: ["complet", "incomplet"]
  },
  {
    key: "year",
    label: "Year",
    sourceLabel: "year",
    sourceAliases: ["year", "Year"],
    kind: "year",
    required: false
  },
  {
    key: "ieDossierDate",
    label: "Date dossier IE complet",
    sourceLabel: "Date dossier IE complet",
    sourceAliases: ["Date dossier IE complet"],
    kind: "date",
    required: false
  },
  {
    key: "ieChangeDone",
    label: "Chgt IE fait",
    sourceLabel: "Chgt IE Fait",
    sourceAliases: ["Chgt IE Fait"],
    kind: "enum",
    required: false,
    allowedValues: ["OUI", "NON"]
  },
  {
    key: "lifeStatus",
    label: "Sapca Retour Perdu dcd",
    sourceLabel: "Sapca / Retour / Perdu / dcd",
    sourceAliases: ["Sapca / Retour / Perdu / dcd"],
    kind: "enum",
    required: false,
    allowedValues: ["Sapca", "Retour", "Perdu", "dcd"]
  },
  {
    key: "lifeStatusDate",
    label: "Date statut",
    sourceLabel: "Date",
    sourceAliases: ["Date"],
    kind: "date",
    required: false
  },
  {
    key: "comments",
    label: "Commentaires",
    sourceLabel: "Commentaires",
    sourceAliases: ["Commentaires"],
    kind: "text",
    required: false
  },
  {
    key: "followUpDate",
    label: "Date relance nouvelles",
    sourceLabel: "Date relance nouvelles",
    sourceAliases: ["Date relance nouvelles"],
    kind: "date",
    required: false
  },
  {
    key: "followUpResponse",
    label: "Reponse relance",
    sourceLabel: "Réponse relance ?",
    sourceAliases: ["Reponse relance ?", "Réponse relance ?"],
    kind: "text",
    required: false
  },
  {
    key: "lastNewsReceived",
    label: "Dernieres nouvelles",
    sourceLabel: "Dernières nlles reçues",
    sourceAliases: ["Dernieres nlles recues", "Dernières nlles reçues"],
    kind: "text",
    required: false
  },
  {
    key: "emailSent",
    label: "Email Sent",
    sourceLabel: "Email Sent",
    sourceAliases: ["Email Sent"],
    kind: "text",
    required: false
  }
];

export const SYSTEM_COLUMNS: SystemColumnSchema[] = [
  { key: "mailEligible", label: "Mail eligible", kind: "checkbox" },
  { key: "validationErrors", label: "Validation errors", kind: "text" },
  { key: "isValid", label: "Validation", kind: "checkbox" }
];
