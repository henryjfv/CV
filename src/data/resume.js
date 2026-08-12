/**
 * Single source of truth for every piece of content rendered by the CV.
 *
 * The page used to be hand-written markup; keeping the content here means a
 * copy change never touches a template, and future dynamic sections (filters,
 * detail views, i18n) can read from the same objects.
 *
 * House rules for this file:
 *  - No client names. Engagements are described by the problem they solved.
 *  - No invented metrics. If a number is not verified, it is not written.
 */

// Imported explicitly rather than resolved by a dynamic require(): a dynamic
// path makes webpack bundle every image in the folder, which would keep
// publishing the two certificates that show a national ID number.
import certUdemy from "@/assets/img/cert3.jpg";
import certIlac from "@/assets/img/ilac.png";

export const SITE_URL = "https://henryjfv.github.io/CV/";

export const profile = {
  firstName: "Henry José",
  lastName: "Fernández Villarreal",
  role: "Senior Fullstack Engineer & Software Architect",
  location: "Colombia · Remote",
  // Split so the address is assembled at runtime instead of shipping a
  // scrapeable mailto: in the served markup.
  email: { user: "henryfernandezv", domain: "gmail.com" },
  availability: "Open to contract work",
  summary:
    "I build systems for companies whose tools outgrew them: legacy ERPs with no API, " +
    "reporting stacks that stopped scaling, manual processes that should have been pipelines. " +
    "Working in software since 2016, I sit on the line between product engineering and data " +
    "infrastructure — Django and FastAPI services, PostgreSQL and Airflow pipelines, Angular " +
    "and Flutter front ends — and I document the architectural decisions behind them.",
  links: {
    linkedin:
      "https://www.linkedin.com/in/henryjosefernandez-villarreal/",
    github: "https://github.com/henryjfv",
  },
};

export const experience = [
  {
    title: "Senior Fullstack Engineer & Software Architect",
    // Deliberately not an employer name: these are engagements delivered
    // across contract and in-house work.
    context: "Contract and in-house engagements",
    period: "2023 – Present",
    current: true,
    highlights: [
      "Replaced a Power BI reporting stack for a multi-tenant platform with a canonical " +
        "contract model and per-tenant SQL adapters, so tenant-specific schemas resolve to " +
        "one reporting surface. Django and PostgreSQL backend, Redis caching, Airflow " +
        "materialisation, Angular portal.",
      "Automated invoice processing on a legacy ERP with no API, combining document " +
        "extraction and RPA with a human validation checkpoint before anything is committed.",
      "Built data quality checks and ingestion pipelines for financial sector reporting.",
      "Designed a retrieval-augmented conversational assistant serving users over messaging channels.",
    ],
  },
  {
    title: "Full Stack Developer",
    context: "Indra",
    period: "Mar 2022 – Mar 2023",
    highlights: [
      "Built a Flutter loan application with payment calculation, discounts and notifications, " +
        "backed by serverless Python and JavaScript services on AWS Lambda, DynamoDB and VPC.",
      "Maintained an auto-insurance product built with Ionic and Angular.",
    ],
  },
  {
    title: "Full Stack Developer",
    context: "Opensols",
    period: "Aug 2018 – Mar 2022",
    highlights: [
      "Delivered web and mobile products for corporate clients in the energy and healthcare sectors, " +
        "including telemedicine, project reporting and business management platforms.",
      "Processed large datasets with Python and Django; built front ends in Vue.js and mobile apps " +
        "with Flutter, Xamarin and .NET.",
    ],
  },
  {
    title: "Android Developer",
    context: "Cloud Technology Center",
    period: "Apr 2016 – Jan 2018",
    highlights: [
      "Developed native Android applications in Java for school academic management: attendance, " +
        "grades, certificates and digital wallet features.",
      "Maintained the REST API backend on ASP.NET and C# with MySQL.",
    ],
  },
];

export const education = [
  {
    institution: "Universidad Libre, Seccional Barranquilla",
    detail: "Systems Engineering",
    period: "2015 – 2020",
  },
  {
    institution: "ILAC International Language Academy of Canada",
    detail: "English Program — Pre-Advanced (Level 10)",
    period: "2022",
  },
];

export const skills = [
  {
    category: "Languages",
    items: ["TypeScript", "Python", "JavaScript", "Java", "Dart", "SQL"],
  },
  {
    category: "Backend",
    items: ["FastAPI", "Django", "Node.js / Express", "Pydantic", "SQLAlchemy"],
  },
  {
    category: "Frontend",
    items: ["Angular", "React", "Vue", "Flutter"],
  },
  {
    category: "Data",
    items: ["PostgreSQL", "SQL Server", "Airflow", "Redis", "Power BI"],
  },
  {
    category: "Infrastructure",
    items: ["AWS", "Azure", "Docker", "GitHub Actions"],
  },
  {
    category: "Practices",
    items: [
      "Software architecture",
      "Architecture decision records",
      "Legacy system integration",
      "Process automation",
    ],
  },
];

/**
 * `image` is only set for certificates that carry no personal identifiers.
 * The Apps.co certificate and the university degree record both show a national
 * ID number, so they are listed as text only.
 */
export const certifications = [
  {
    name: "REST API with Node.js using MongoDB or MySQL",
    issuer: "Udemy",
    year: "2023",
    image: certUdemy,
  },
  {
    name: "English Program — Pre-Advanced (Level 10)",
    issuer: "ILAC International Language Academy of Canada",
    year: "2022",
    image: certIlac,
  },
  {
    name: "EF SET English Certificate — 53/100, B2 Upper-Intermediate",
    issuer: "EF Standard English Test",
    year: null,
  },
  {
    name: "Native Android Development",
    issuer: "Apps.co — MinTIC, Universidad del Norte",
    year: "2015",
  },
];
