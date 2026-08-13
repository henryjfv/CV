/**
 * Single source of truth for every piece of content in the site — both the 3D
 * world and the text layer read from here.
 *
 * House rules for this file:
 *  - Employers are named; individual clients of those employers are not.
 *    Engagements are described by the problem they solved.
 *  - No invented metrics. If a number is not verified, it is not written.
 *  - No 3D data. Coordinates, colours and scene wiring live in `world.ts`,
 *    which imports this file. A copy change stays a one-line change here.
 *
 * The most recent roles carry the most detail, and the world gives them the
 * most architecture — that ordering is deliberate, not accidental.
 */

import type { StaticImageData } from "next/image";

// Imported explicitly rather than resolved by a dynamic import: a dynamic path
// makes the bundler emit every image in the folder, which would publish the two
// certificates that show a national ID number.
import certUdemy from "@/assets/img/cert3.jpg";
import certIlac from "@/assets/img/ilac.png";

export const SITE_URL = "https://henryjfv.github.io/CV/";

/** First professional role. Everything time-related is derived from this. */
export const CAREER_START_YEAR = 2016;

/**
 * Computed once at module load so the server-rendered HTML and the client
 * render agree, and so the figure never goes stale in the copy the way a
 * hand-written "9+ years" does.
 */
export const yearsOfExperience =
  new Date().getFullYear() - CAREER_START_YEAR;

export const profile = {
  firstName: "Henry",
  lastName: "Fernández",
  shortName: "Henry Fernández",
  role: "Senior Full Stack Engineer",
  location: "Barranquilla, Colombia",
  availability: "Remote — EST overlap available",
  english: "English: B2 Upper-Intermediate",
  // Split so the address is assembled at runtime instead of shipping a
  // scrapeable mailto: in the served markup.
  email: { user: "henryfernandezv", domain: "gmail.com" },
  tagline: "I don't just write code. I build systems.",
  summary:
    "Senior Full Stack Engineer with 9+ years designing, building, and maintaining scalable " +
    "web and mobile applications for clients in banking, fintech, energy, healthcare, and " +
    "logistics. Hands-on expertise across Node.js, TypeScript, Python (FastAPI/Django), " +
    "JavaScript (ES6+), and Java, with a strong track record building and consuming RESTful " +
    "APIs within microservices architectures on AWS and Azure. Experienced leading distributed " +
    "remote teams: driving architecture discussions, running code reviews, mentoring peers, " +
    "and delivering in Agile/Scrum environments.",
  links: {
    linkedin: "https://www.linkedin.com/in/henryjosefernandez-villarreal/",
    github: "https://github.com/henryjfv",
  },
};

/**
 * The six claims the CV leads with. Kept separate from the roles because they
 * cut across several of them, and because they are the argument the world is
 * making before any single station is opened.
 */
export const careerHighlights = [
  {
    title: "Technical leadership",
    detail:
      "Lead a distributed, cross-functional engineering team delivering a data management, " +
      "reporting, and AI-agent platform across AWS and Azure, owning architecture decisions " +
      "and code review standards.",
  },
  {
    title: "API & microservices architecture",
    detail:
      "Designed, documented (Swagger/OpenAPI), and shipped REST APIs and interconnected " +
      "microservices in Python and Node.js, standardizing service contracts across multiple " +
      "product teams.",
  },
  {
    title: "Java engineering",
    detail:
      "Built a Java formula engine that parsed and transformed complex Excel rule sets into " +
      "insurance plan structures, replacing manual configuration; previously delivered two " +
      "production Android applications in Java.",
  },
  {
    title: "Serverless & cloud",
    detail:
      "Architected serverless backends on AWS Lambda (Node.js + Python) with DynamoDB and " +
      "VPC networking for a banking loan product.",
  },
  {
    title: "Enterprise integrations",
    detail:
      "Integrated multiple external data sources — SFTP servers and ERPs including Siigo and " +
      "SIESA — into unified PostgreSQL models supporting large-volume value-chain data.",
  },
  {
    title: "Delivery engineering",
    detail:
      "Established CI/CD pipelines (YAML), Docker containerization, and Git-based branching " +
      "workflows with mandatory peer code reviews.",
  },
];

export type Experience = {
  /** Stable key used by `world.ts` to attach a station to this entry. */
  id: string;
  title: string;
  context: string;
  period: string;
  startYear: number;
  current?: boolean;
  /** One line of context above the bullets, when the CV gives one. */
  summary?: string;
  highlights: string[];
};

export const experience: Experience[] = [
  {
    id: "imagineapps-lead",
    title: "Senior Software Engineer",
    context: "Imagine Apps",
    period: "Jun 2025 – Present",
    startYear: 2025,
    current: true,
    summary:
      "Technical lead for a team building data management, reporting, and simulation " +
      "products across enterprise value chains.",
    highlights: [
      "Lead a cross-functional engineering team delivering a platform built on Django, " +
        "Angular, Docker, Apache Airflow, AWS, and Azure — owning technical direction, " +
        "architecture reviews, and peer mentoring.",
      "Designed and shipped backend microservices in Python (Django, FastAPI) documented " +
        "with Swagger/OpenAPI, defining REST API contracts consumed across multiple internal teams.",
      "Architected integrations with multiple external data sources, including SFTP servers " +
        "and ERPs such as Siigo and SIESA, replacing manual data handoffs with automated ingestion.",
      "Modeled and optimized PostgreSQL schemas supporting large-volume value-chain datasets, " +
        "improving query performance and long-term maintainability.",
      "Built responsive web applications in Next.js, TypeScript, Tailwind CSS, and Ant Design " +
        "from Figma specifications for a supply-chain simulation platform (Cosmicfrog).",
      "Implemented CI/CD pipelines via YAML with Docker containerization, substantially " +
        "reducing manual deployment effort to Azure and AWS and enabling repeatable, low-risk releases.",
      "Automated recurring data flows with Apache Airflow, delivered executive-level Power BI " +
        "reporting, and integrated AI/LLM solutions — including self-hosted local models — into " +
        "production workflows.",
      "Authored microservices architecture proposals and technical estimation documents used to " +
        "scope client engagements, and contributed features and fixes to sibling teams' React.js " +
        "and React Native applications.",
    ],
  },
  {
    id: "personalsoft",
    title: "Mobile Developer (Flutter)",
    context: "PersonalSoft",
    period: "Aug 2024 – Jun 2025",
    startYear: 2024,
    highlights: [
      "Delivered new features on a cross-platform banking application (iOS/Android) in Flutter, " +
        "translating client requirements into production releases.",
      "Managed AWS resources and ran the full development lifecycle in Azure DevOps, following " +
        "Figma design systems and Agile ceremonies.",
    ],
  },
  {
    id: "imagineapps-freelance",
    title: "Full Stack Engineer (Remote, Freelance)",
    context: "Imagine Apps",
    period: "Oct 2023 – Aug 2024",
    startYear: 2023,
    highlights: [
      "Extended a web investment platform built with React.js, Node.js, MongoDB, cron jobs, and " +
        "AWS S3, shipping new backend and frontend features end to end.",
      "Integrated third-party services into the platform: SendGrid (transactional email), " +
        "SignNow (e-signature), Withpersona (biometric KYC), and JWT-based authentication.",
      "Developed Node.js backend services with SQL Server, Sequelize ORM, and Docker, exposing " +
        "documented REST endpoints.",
      "Diagnosed and resolved defects in a freight logistics mobile app (React Native / Expo) " +
        "covering maps, geolocation, and Redux state management.",
    ],
  },
  {
    id: "byondit",
    title: "Mobile Developer (Remote)",
    context: "BYONDIT",
    period: "Jul 2023 – Dec 2023",
    startYear: 2023,
    highlights: [
      "Maintained and enhanced a digital wallet application with virtual and physical card " +
        "features, working across Flutter (client) and Python (backend) on AWS infrastructure.",
      "Operated feature flags and product analytics through Split.io and Segment to support " +
        "controlled, data-informed releases.",
    ],
  },
  {
    id: "indra",
    title: "Full Stack Developer (Remote)",
    context: "Indra",
    period: "Mar 2022 – Mar 2023",
    startYear: 2022,
    highlights: [
      "Engineered a Java formula engine that parsed complex Excel workbooks and transformed them " +
        "into structured insurance plans, eliminating repetitive manual configuration.",
      "Built a serverless backend on AWS Lambda using JavaScript (Serverless Framework) and " +
        "Python, with DynamoDB persistence and VPC networking.",
      "Developed a Flutter loan-request application featuring monthly payment calculations, " +
        "discount rules, and push notifications.",
      "Delivered enhancements and defect fixes on an auto-insurance mobile application built " +
        "with Ionic and Angular.",
    ],
  },
  {
    id: "freelance",
    title: "Software Engineer (Freelance)",
    context: "Independent Clients",
    period: "2021 – 2022",
    startYear: 2021,
    highlights: [
      "Delivered a Vue.js management system for a construction company covering projects, " +
        "vehicles, drivers, and load tracking.",
      "Built a Node.js + TypeScript + MySQL backend with a Flutter client for a mechanical " +
        "services marketplace (geolocation, maps, camera).",
      "Developed a Vue.js application for processing large Excel datasets with Supabase storage.",
    ],
  },
  {
    id: "opensols",
    title: "Full Stack Developer (Remote)",
    context: "Opensols",
    period: "Aug 2018 – Mar 2022",
    startYear: 2018,
    summary:
      "Multiple web and mobile projects for corporate clients, including the energy sector.",
    highlights: [
      "Built a telemedicine platform in Vue.js covering medical records management, virtual " +
        "appointments via Jitsi, and online payments through Wompi.",
      "Processed large flight datasets in Python and Django, implementing efficient pagination " +
        "to keep response times stable at scale.",
      "Developed a dynamic form builder in .NET with rendering on a Xamarin mobile app for " +
        "field incident capture (photo, audio, and video).",
      "Delivered improvements to ISA Transelca's technical examination software (.NET Framework) " +
        "and built internal Vue.js applications for time tracking, project reporting, and " +
        "meeting minutes.",
    ],
  },
  {
    id: "cloudtech",
    title: "Android Developer",
    context: "CloudTechnologyCenter",
    period: "Apr 2016 – Jan 2018",
    startYear: 2016,
    highlights: [
      "Developed two production Android applications in Java for school academic management, " +
        "covering attendance, grades, minutes, digital wallet, agenda, and certificate generation.",
    ],
  },
];

export const education = [
  {
    institution: "Universidad Libre Seccional Barranquilla",
    detail: "B.Sc. Systems Engineering",
    period: "2015 – 2022",
  },
  {
    institution: "International Language Academy of Canada (ILAC)",
    detail: "Pre-Advanced English",
    period: "Jan 2022 – Jul 2022",
  },
];

export type SkillGroup = {
  /** Stable key used by `world.ts` to place the group inside The Stack. */
  id: string;
  category: string;
  items: string[];
};

/**
 * Eight groups rather than one flat list: the groups are what The Stack builds
 * its clusters from, and what the districts of the world map onto.
 */
export const skills: SkillGroup[] = [
  {
    id: "backend",
    category: "Backend",
    items: [
      "Node.js",
      "TypeScript",
      "Python (FastAPI, Django)",
      "JavaScript (ES6+)",
      "Java",
      "REST APIs",
      "Microservices",
      "Serverless (AWS Lambda)",
      "Swagger/OpenAPI",
      "JWT",
      "Sequelize",
      ".NET Framework",
    ],
  },
  {
    id: "frontend",
    category: "Frontend",
    items: [
      "React.js",
      "Next.js",
      "Vue.js",
      "Angular",
      "TypeScript",
      "Redux",
      "Tailwind CSS",
      "Ant Design",
      "HTML5",
      "CSS3",
    ],
  },
  {
    id: "cloud",
    category: "Cloud & DevOps",
    items: [
      "AWS (Lambda, S3, DynamoDB, VPC)",
      "Azure",
      "Docker",
      "CI/CD (YAML pipelines)",
      "Jenkins",
      "Git",
      "GitHub",
      "Azure DevOps",
    ],
  },
  {
    id: "databases",
    category: "Databases",
    items: [
      "PostgreSQL",
      "MySQL",
      "SQL Server",
      "MongoDB",
      "DynamoDB",
      "Firestore",
      "Supabase",
      "MariaDB",
    ],
  },
  {
    id: "ai",
    category: "AI & Data",
    items: [
      "LLM integration (cloud and self-hosted local models)",
      "Apache Airflow",
      "Power BI",
    ],
  },
  {
    id: "practices",
    category: "Practices",
    items: [
      "Agile / Scrum",
      "Code Reviews",
      "Software Architecture",
      "Technical Estimation",
      "Mentoring",
      "Distributed Remote Teams",
      "Scalability & Maintainability",
    ],
  },
  {
    id: "mobile",
    category: "Mobile",
    items: ["React Native", "Flutter"],
  },
];

export type Certification = {
  name: string;
  issuer: string;
  year: string | null;
  image?: StaticImageData;
};

/**
 * `image` is only set for certificates that carry no personal identifiers.
 * The Apps.co certificate and the EF SET record both show a national ID
 * number, so they are listed as text only — never rendered as an image, and
 * never used as a texture in the 3D world.
 */
export const certifications: Certification[] = [
  {
    name: "REST API with Node.js using MongoDB or MySQL",
    issuer: "Udemy",
    year: null,
    image: certUdemy,
  },
  {
    name: "Pre-Advanced English",
    issuer: "International Language Academy of Canada (ILAC)",
    year: "2022",
    image: certIlac,
  },
  {
    name: "English — B2 Upper-Intermediate (EF SET English Certificate, 53/100)",
    issuer: "EF Standard English Test",
    year: null,
  },
];
