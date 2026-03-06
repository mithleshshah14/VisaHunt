import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// ============================================================
// Visa Guide Data
// ============================================================

interface VisaTypeInfo {
  name: string;
  description: string;
  salaryThreshold?: string;
  salaryThresholdINR?: string;
  processingTime: string;
  duration: string;
  prPathway: boolean;
  prNote?: string;
}

interface CostItem {
  item: string;
  costLocal: string;
  costINR: string;
}

interface GuideData {
  code: string;
  name: string;
  flag: string;
  intro: string;
  visaTypes: VisaTypeInfo[];
  costs: CostItem[];
  tips: string[];
  avgTechSalary: string;
  avgTechSalaryINR: string;
  colIndex: number; // Bangalore = 100
  indiaSpecific: string;
}

const GUIDES: Record<string, GuideData> = {
  gb: {
    code: "GB",
    name: "United Kingdom",
    flag: "\u{1F1EC}\u{1F1E7}",
    intro:
      "The UK is one of the top destinations for Indian tech professionals, with over 90,000 licensed sponsor employers. The Skilled Worker Visa is the most common route, offering a clear path to settlement.",
    visaTypes: [
      {
        name: "Skilled Worker Visa",
        description:
          "The primary work visa for tech professionals. Requires a job offer from a licensed sponsor, a Certificate of Sponsorship, and meeting salary thresholds.",
        salaryThreshold: "\u00A338,700/year",
        salaryThresholdINR: "\u20B941L/year",
        processingTime: "3\u20138 weeks",
        duration: "Up to 5 years",
        prPathway: true,
        prNote: "Eligible for Indefinite Leave to Remain (ILR) after 5 years",
      },
      {
        name: "Global Talent Visa",
        description:
          "For exceptional talent in tech, endorsed by Tech Nation. No job offer required, no salary threshold.",
        processingTime: "3\u20138 weeks (endorsement: 5\u20138 weeks)",
        duration: "Up to 5 years",
        prPathway: true,
        prNote: "Fast-track ILR after 3 years",
      },
      {
        name: "Scale-up Worker Visa",
        description:
          "For workers hired by recognized UK scale-up companies. More flexibility after 6 months \u2014 can switch employers freely.",
        salaryThreshold: "\u00A336,300/year",
        salaryThresholdINR: "\u20B939L/year",
        processingTime: "3\u20138 weeks",
        duration: "2 years",
        prPathway: true,
        prNote: "ILR after 5 years",
      },
    ],
    costs: [
      { item: "Visa application fee", costLocal: "\u00A3719\u2013\u00A31,420", costINR: "\u20B977K\u2013\u20B91.5L" },
      { item: "Immigration Health Surcharge", costLocal: "\u00A31,035/year", costINR: "\u20B91.1L/year" },
      { item: "Certificate of Sponsorship", costLocal: "\u00A3239 (employer pays)", costINR: "\u2014" },
      { item: "English language test (IELTS)", costLocal: "\u00A3170\u2013\u00A3200", costINR: "\u20B918K\u2013\u20B921K" },
      { item: "Biometric enrolment", costLocal: "\u00A319.20", costINR: "\u20B92K" },
    ],
    tips: [
      "Start your sponsor license check early \u2014 not all companies are licensed",
      "IELTS is not required if you have a degree taught in English",
      "The NHS surcharge is a hidden cost \u2014 budget \u00A35,175 for a 5-year visa",
      "London salaries are 20\u201340% higher but cost of living is steep",
      "Consider cities like Manchester, Edinburgh, and Bristol for better value",
    ],
    avgTechSalary: "\u00A355,000\u2013\u00A375,000",
    avgTechSalaryINR: "\u20B959L\u2013\u20B980L",
    colIndex: 185,
    indiaSpecific:
      "Indian nationals are the largest group of Skilled Worker visa holders. The UK-India Young Professionals Scheme offers 3,000 places annually for 18\u201330 year olds. Direct flights from major Indian cities make relocation convenient.",
  },
  de: {
    code: "DE",
    name: "Germany",
    flag: "\u{1F1E9}\u{1F1EA}",
    intro:
      "Germany is Europe's largest tech market with a growing English-speaking startup scene. The EU Blue Card offers one of the fastest PR pathways in the EU, and no sponsor register is needed \u2014 any company can hire you.",
    visaTypes: [
      {
        name: "EU Blue Card",
        description:
          "The premium work permit for highly skilled workers. Requires a recognized degree and a job offer meeting the salary threshold.",
        salaryThreshold: "\u20AC43,800/year (tech/IT)",
        salaryThresholdINR: "\u20B940L/year",
        processingTime: "1\u20133 months",
        duration: "4 years",
        prPathway: true,
        prNote: "Permanent residence after 21 months (with B1 German) or 33 months",
      },
      {
        name: "IT Specialist Visa",
        description:
          "For IT professionals without a formal degree. Requires 3+ years of experience and \u20AC41,040+ salary. Germany\u2019s recognition of experience over degrees is a game-changer.",
        salaryThreshold: "\u20AC41,040/year",
        salaryThresholdINR: "\u20B938L/year",
        processingTime: "1\u20134 months",
        duration: "4 years",
        prPathway: true,
        prNote: "PR after 21\u201333 months",
      },
      {
        name: "Job Seeker Visa",
        description:
          "Allows you to enter Germany for 6 months to search for a job. Requires a recognized degree and proof of funds.",
        processingTime: "1\u20133 months",
        duration: "6 months",
        prPathway: false,
      },
    ],
    costs: [
      { item: "Blue Card application", costLocal: "\u20AC100", costINR: "\u20B99.2K" },
      { item: "Residence permit issuance", costLocal: "\u20AC100", costINR: "\u20B99.2K" },
      { item: "Health insurance (public)", costLocal: "\u20AC400\u2013\u20AC500/month", costINR: "\u20B937K\u2013\u20B946K/month" },
      { item: "Degree recognition (anabin)", costLocal: "Free\u2013\u20AC200", costINR: "Free\u2013\u20B918K" },
      { item: "Blocked account (proof of funds)", costLocal: "\u20AC11,904", costINR: "\u20B911L" },
    ],
    tips: [
      "Berlin, Munich, and Hamburg have the most tech jobs \u2014 but Berlin is most English-friendly",
      "Learning basic German (A2\u2013B1) dramatically improves daily life and accelerates PR",
      "The IT Specialist Visa is ideal for self-taught developers without a degree",
      "Tax burden is high (42\u201345%) but includes excellent public services",
      "Check your degree recognition on anabin.kmk.org before applying",
    ],
    avgTechSalary: "\u20AC55,000\u2013\u20AC75,000",
    avgTechSalaryINR: "\u20B951L\u2013\u20B969L",
    colIndex: 155,
    indiaSpecific:
      "Germany has a large Indian tech community, especially in Berlin and Munich. Indian engineering degrees are generally well-recognized. The blocked account requirement (\u20AC11,904) is waived once you have a job contract.",
  },
  nl: {
    code: "NL",
    name: "Netherlands",
    flag: "\u{1F1F3}\u{1F1F1}",
    intro:
      "The Netherlands offers one of the fastest visa processes in Europe with the 30% tax ruling \u2014 a massive financial benefit where 30% of your salary is tax-free for 5 years.",
    visaTypes: [
      {
        name: "Highly Skilled Migrant (Kennismigrant)",
        description:
          "The main work visa for tech professionals. Employer must be a recognized sponsor with IND. Very fast processing.",
        salaryThreshold: "\u20AC46,107/year (under 30: \u20AC35,048)",
        salaryThresholdINR: "\u20B942L/year",
        processingTime: "2\u20134 weeks",
        duration: "Up to 5 years",
        prPathway: true,
        prNote: "Permanent residence after 5 years",
      },
      {
        name: "Orientation Year Visa (Zoekjaar)",
        description:
          "For recent graduates from top-200 universities. 1 year to find a job in the Netherlands.",
        processingTime: "2\u20134 weeks",
        duration: "1 year",
        prPathway: false,
      },
    ],
    costs: [
      { item: "Visa application (employer pays)", costLocal: "\u20AC345", costINR: "\u20B932K" },
      { item: "Residence permit", costLocal: "\u20AC77", costINR: "\u20B97K" },
      { item: "Health insurance (mandatory)", costLocal: "\u20AC120\u2013\u20AC160/month", costINR: "\u20B911K\u2013\u20B915K/month" },
      { item: "BSN registration", costLocal: "Free", costINR: "Free" },
    ],
    tips: [
      "The 30% ruling is the biggest financial perk \u2014 apply within 4 months of starting work",
      "Almost everyone speaks English, making it very expat-friendly",
      "Amsterdam is expensive \u2014 consider Rotterdam, Eindhoven, or The Hague",
      "Housing is the #1 challenge \u2014 start searching before you arrive",
      "The Kennismigrant visa is employer-sponsored, so your company handles most paperwork",
    ],
    avgTechSalary: "\u20AC50,000\u2013\u20AC70,000",
    avgTechSalaryINR: "\u20B946L\u2013\u20B964L",
    colIndex: 160,
    indiaSpecific:
      "Large Indian tech community in the Eindhoven and Amsterdam regions. Companies like Booking.com, ASML, and Philips actively recruit from India. The 30% ruling effectively boosts your take-home by 15\u201320%.",
  },
  ca: {
    code: "CA",
    name: "Canada",
    flag: "\u{1F1E8}\u{1F1E6}",
    intro:
      "Canada is the most popular immigration destination for Indian tech workers, with Express Entry providing a clear and transparent PR pathway. Toronto, Vancouver, and Montreal are major tech hubs.",
    visaTypes: [
      {
        name: "LMIA Work Permit",
        description:
          "Employer-specific work permit requiring a Labour Market Impact Assessment. The employer must prove no Canadian worker is available.",
        processingTime: "2\u20136 months",
        duration: "1\u20133 years",
        prPathway: true,
        prNote: "Work experience counts toward Express Entry CRS points",
      },
      {
        name: "Global Talent Stream (GTS)",
        description:
          "Fast-tracked LMIA for tech roles. 2-week processing. Covers software engineers, data scientists, and other in-demand tech roles.",
        processingTime: "2 weeks",
        duration: "Up to 3 years",
        prPathway: true,
        prNote: "Fast-track to PR via Express Entry",
      },
      {
        name: "Express Entry (PR)",
        description:
          "Points-based permanent residency. Factors: age, education, language (IELTS), work experience. Tech workers with Canadian experience score well.",
        processingTime: "6\u201312 months",
        duration: "Permanent",
        prPathway: true,
      },
    ],
    costs: [
      { item: "Work permit application", costLocal: "CAD $155", costINR: "\u20B99.6K" },
      { item: "LMIA fee (employer pays)", costLocal: "CAD $1,000", costINR: "\u2014" },
      { item: "Biometrics", costLocal: "CAD $85", costINR: "\u20B95.3K" },
      { item: "Express Entry PR application", costLocal: "CAD $1,525", costINR: "\u20B995K" },
      { item: "IELTS test", costLocal: "CAD $300\u2013$400", costINR: "\u20B919K\u2013\u20B925K" },
    ],
    tips: [
      "The Global Talent Stream is the fastest way in \u2014 2-week processing for tech roles",
      "Start IELTS prep early \u2014 a high score significantly boosts your Express Entry points",
      "Toronto salaries are highest but so is cost of living \u2014 Ottawa and Calgary offer better value",
      "French proficiency gives a massive CRS bonus (up to 50 extra points)",
      "Get your degree assessed by WES before applying for PR",
    ],
    avgTechSalary: "CAD $75,000\u2013$110,000",
    avgTechSalaryINR: "\u20B947L\u2013\u20B968L",
    colIndex: 165,
    indiaSpecific:
      "Indians are the #1 source country for Express Entry invitations. The Indian community in Canada is massive, with strong support networks. Direct flights from Delhi, Mumbai, and Bangalore to Toronto and Vancouver.",
  },
  us: {
    code: "US",
    name: "United States",
    flag: "\u{1F1FA}\u{1F1F8}",
    intro:
      "The US offers the highest tech salaries globally but the visa process is complex and lottery-based. The H-1B remains the primary route, with an annual cap of 85,000 visas.",
    visaTypes: [
      {
        name: "H-1B Visa",
        description:
          "The primary work visa for tech professionals. Subject to an annual lottery (March). Requires a bachelor\u2019s degree and employer sponsorship.",
        salaryThreshold: "$60,000+/year (typical, varies by role/location)",
        salaryThresholdINR: "\u20B950L+/year",
        processingTime: "3\u20136 months (October start)",
        duration: "3 years (renewable to 6)",
        prPathway: true,
        prNote: "Green Card via employer sponsorship (EB-2/EB-3) \u2014 long wait for Indian nationals",
      },
      {
        name: "L-1 Visa (Intracompany Transfer)",
        description:
          "For employees transferring from an overseas office to a US office. Requires 1 year of employment with the company. No lottery.",
        processingTime: "1\u20133 months",
        duration: "L-1A: 7 years, L-1B: 5 years",
        prPathway: true,
        prNote: "Green Card possible via EB-1C (managers)",
      },
      {
        name: "O-1 Visa (Extraordinary Ability)",
        description:
          "For individuals with extraordinary ability or achievement in their field. No lottery, no cap. Requires strong evidence of recognition.",
        processingTime: "2\u20134 months (premium: 15 days)",
        duration: "3 years (renewable)",
        prPathway: true,
        prNote: "Green Card via EB-1A (self-petition possible)",
      },
    ],
    costs: [
      { item: "H-1B registration fee", costLocal: "$215", costINR: "\u20B918K" },
      { item: "H-1B petition (employer pays)", costLocal: "$1,710\u2013$4,710", costINR: "\u2014" },
      { item: "Premium processing (optional)", costLocal: "$2,805", costINR: "\u20B92.4L" },
      { item: "Visa stamping (DS-160)", costLocal: "$205", costINR: "\u20B917K" },
      { item: "Green Card (EB-2/EB-3)", costLocal: "$700+", costINR: "\u20B959K+" },
    ],
    tips: [
      "Apply to multiple H-1B sponsors to increase your lottery chances",
      "L-1 is a great alternative \u2014 join a multinational in India, transfer after 1 year",
      "The O-1 visa has no lottery \u2014 build a strong portfolio of talks, publications, or open-source contributions",
      "Green Card backlog for Indian nationals is 10+ years for EB-2/EB-3",
      "Consider starting in Canada and later transferring to the US via L-1 or TN visa",
    ],
    avgTechSalary: "$110,000\u2013$180,000",
    avgTechSalaryINR: "\u20B992L\u2013\u20B91.5Cr",
    colIndex: 195,
    indiaSpecific:
      "Indians receive ~70% of all H-1B visas annually. The Green Card backlog is the biggest challenge \u2014 many Indian professionals wait 10+ years. Companies like Google, Microsoft, Amazon, and Meta are top H-1B sponsors.",
  },
  ie: {
    code: "IE",
    name: "Ireland",
    flag: "\u{1F1EE}\u{1F1EA}",
    intro:
      "Ireland is the European HQ for most US tech giants (Google, Meta, Apple, Microsoft). The Critical Skills Permit offers a fast track to residency and an English-speaking environment.",
    visaTypes: [
      {
        name: "Critical Skills Employment Permit",
        description:
          "For highly skilled occupations including most tech roles. Fastest route to Irish residency.",
        salaryThreshold: "\u20AC38,000/year",
        salaryThresholdINR: "\u20B935L/year",
        processingTime: "4\u20138 weeks",
        duration: "2 years (then Stamp 4 \u2014 open work permission)",
        prPathway: true,
        prNote: "Stamp 4 after 2 years, citizenship after 5 years",
      },
      {
        name: "General Employment Permit",
        description:
          "For roles not on the Critical Skills list. Requires a labour market needs test.",
        salaryThreshold: "\u20AC34,000/year",
        salaryThresholdINR: "\u20B931L/year",
        processingTime: "4\u201312 weeks",
        duration: "2 years (renewable)",
        prPathway: true,
        prNote: "Stamp 4 after 5 years",
      },
    ],
    costs: [
      { item: "Employment permit application", costLocal: "\u20AC1,000", costINR: "\u20B992K" },
      { item: "IRP registration (Stamp 1)", costLocal: "\u20AC300", costINR: "\u20B928K" },
      { item: "Health insurance", costLocal: "\u20AC50\u2013\u20AC150/month", costINR: "\u20B95K\u2013\u20B914K/month" },
    ],
    tips: [
      "Dublin\u2019s tech scene is booming but housing is extremely competitive \u2014 start searching immediately",
      "The Critical Skills Permit gives you open work permission after just 2 years",
      "Ireland has no language requirement for visas",
      "Tax rates are moderate (20\u201340%) and there\u2019s no social insurance cap",
      "Consider Cork and Galway for lower cost of living with growing tech scenes",
    ],
    avgTechSalary: "\u20AC55,000\u2013\u20AC80,000",
    avgTechSalaryINR: "\u20B951L\u2013\u20B974L",
    colIndex: 170,
    indiaSpecific:
      "Ireland has a growing Indian community, especially in Dublin. Many Indian professionals work at Google, Meta, and Accenture. Direct flights from Delhi and Mumbai. English-speaking environment makes transition easier.",
  },
  se: {
    code: "SE",
    name: "Sweden",
    flag: "\u{1F1F8}\u{1F1EA}",
    intro:
      "Sweden has a thriving tech ecosystem with companies like Spotify, Klarna, and Ericsson. The work permit process is straightforward, and the quality of life is exceptional.",
    visaTypes: [
      {
        name: "Work Permit",
        description:
          "Standard work permit for employed workers. Employer must offer terms equivalent to Swedish collective agreements.",
        salaryThreshold: "SEK 27,360/month (~\u20AC2,400)",
        salaryThresholdINR: "\u20B922K/month",
        processingTime: "1\u20134 months",
        duration: "2 years (renewable)",
        prPathway: true,
        prNote: "Permanent residence after 4 years",
      },
    ],
    costs: [
      { item: "Work permit application", costLocal: "SEK 2,000", costINR: "\u20B916K" },
      { item: "Residence permit card", costLocal: "SEK 400", costINR: "\u20B93.2K" },
      { item: "Health insurance", costLocal: "Included in taxes", costINR: "\u2014" },
    ],
    tips: [
      "Stockholm is the startup capital of Europe \u2014 Spotify, Klarna, King are headquartered here",
      "Swedish is not required for tech jobs, but learning basics helps socially",
      "Winters are dark and cold \u2014 be prepared for the adjustment",
      "The work-life balance is among the best in the world",
      "PR after just 4 years is one of the shortest timelines in Europe",
    ],
    avgTechSalary: "SEK 45,000\u201365,000/month",
    avgTechSalaryINR: "\u20B946L\u2013\u20B966L/year",
    colIndex: 165,
    indiaSpecific:
      "Smaller but growing Indian community in Stockholm and Gothenburg. Ericsson and other companies actively recruit from India. The high tax rate (30\u201355%) funds excellent public services including free healthcare and education.",
  },
  dk: {
    code: "DK",
    name: "Denmark",
    flag: "\u{1F1E9}\u{1F1F0}",
    intro:
      "Denmark offers the Pay Limit Scheme for high-earning tech professionals and a Positive List for in-demand occupations. Copenhagen has a strong fintech and cleantech scene.",
    visaTypes: [
      {
        name: "Pay Limit Scheme",
        description:
          "For high-salary positions. No specific occupation requirement \u2014 just meet the salary threshold.",
        salaryThreshold: "DKK 465,000/year (~\u20AC62,300)",
        salaryThresholdINR: "\u20B957L/year",
        processingTime: "1\u20132 months",
        duration: "Up to 4 years",
        prPathway: true,
        prNote: "Permanent residence after 4 years",
      },
      {
        name: "Positive List (IT)",
        description:
          "For occupations on Denmark\u2019s shortage list. Most software/IT roles qualify.",
        processingTime: "1\u20132 months",
        duration: "Up to 4 years",
        prPathway: true,
        prNote: "Permanent residence after 4 years",
      },
    ],
    costs: [
      { item: "Residence/work permit", costLocal: "DKK 3,245", costINR: "\u20B940K" },
      { item: "Biometric card", costLocal: "DKK 260", costINR: "\u20B93.2K" },
    ],
    tips: [
      "Copenhagen is expensive but salaries compensate well",
      "Danish language isn\u2019t required but helps for long-term integration",
      "Cycling is the primary mode of transport \u2014 embrace it",
      "The tax rate is high (37\u201352%) but includes world-class public services",
    ],
    avgTechSalary: "DKK 50,000\u201370,000/month",
    avgTechSalaryINR: "\u20B950L\u2013\u20B970L/year",
    colIndex: 190,
    indiaSpecific:
      "Smaller Indian community than UK/Germany. Novo Nordisk, Maersk, and various startups hire tech talent. Direct flights are limited \u2014 most routes connect via Dubai or London.",
  },
  au: {
    code: "AU",
    name: "Australia",
    flag: "\u{1F1E6}\u{1F1FA}",
    intro:
      "Australia offers excellent quality of life and a strong tech market. The Temporary Skill Shortage visa (subclass 482) is the primary work visa, with a clear PR pathway.",
    visaTypes: [
      {
        name: "TSS Visa (Subclass 482)",
        description:
          "Employer-sponsored temporary work visa. Medium-term stream covers most tech roles and leads to PR.",
        salaryThreshold: "AUD $73,150/year (TSMIT)",
        salaryThresholdINR: "\u20B940L/year",
        processingTime: "1\u20134 months",
        duration: "Up to 4 years",
        prPathway: true,
        prNote: "PR via subclass 186 after 2\u20133 years",
      },
      {
        name: "Skilled Independent Visa (Subclass 189)",
        description:
          "Points-based PR visa. No employer sponsorship needed. For occupations on the MLTSSL.",
        processingTime: "6\u201318 months",
        duration: "Permanent",
        prPathway: true,
      },
    ],
    costs: [
      { item: "TSS 482 visa", costLocal: "AUD $1,455\u2013$3,035", costINR: "\u20B980K\u2013\u20B91.7L" },
      { item: "Skills assessment", costLocal: "AUD $500\u2013$1,000", costINR: "\u20B928K\u2013\u20B955K" },
      { item: "Health examination", costLocal: "AUD $400\u2013$500", costINR: "\u20B922K\u2013\u20B928K" },
      { item: "English test (PTE/IELTS)", costLocal: "AUD $300\u2013$400", costINR: "\u20B917K\u2013\u20B922K" },
    ],
    tips: [
      "Sydney and Melbourne have the most tech jobs, but Perth and Brisbane are growing fast",
      "PTE Academic is generally easier and faster than IELTS for visa purposes",
      "The points system rewards age (25\u201332), English proficiency, and Australian qualifications",
      "Health insurance (OSHC) is mandatory for visa holders",
      "The ACS skills assessment is required for most tech occupations",
    ],
    avgTechSalary: "AUD $95,000\u2013$140,000",
    avgTechSalaryINR: "\u20B952L\u2013\u20B977L",
    colIndex: 175,
    indiaSpecific:
      "Indians are the largest migrant group in Australia. Massive Indian community in Sydney and Melbourne. Direct flights from major Indian cities. Mutual recognition of some qualifications.",
  },
  sg: {
    code: "SG",
    name: "Singapore",
    flag: "\u{1F1F8}\u{1F1EC}",
    intro:
      "Singapore is Asia\u2019s premier tech hub with a simple visa process. The Employment Pass is the main work visa for tech professionals, with no quota or lottery.",
    visaTypes: [
      {
        name: "Employment Pass (EP)",
        description:
          "For foreign professionals earning above the threshold. Evaluated on salary, qualifications, and a new COMPASS points-based framework.",
        salaryThreshold: "SGD $5,600/month (tech: higher)",
        salaryThresholdINR: "\u20B93.5L/month",
        processingTime: "3\u20138 weeks",
        duration: "Up to 2 years (renewable)",
        prPathway: true,
        prNote: "PR application after 6 months, approval varies",
      },
      {
        name: "Tech.Pass",
        description:
          "For established tech leaders, founders, and experts. Requires high salary history or significant tech achievements.",
        salaryThreshold: "SGD $22,500/month",
        salaryThresholdINR: "\u20B914L/month",
        processingTime: "4\u20138 weeks",
        duration: "2 years",
        prPathway: true,
      },
    ],
    costs: [
      { item: "EP application", costLocal: "SGD $105", costINR: "\u20B96.5K" },
      { item: "EP issuance", costLocal: "SGD $225", costINR: "\u20B914K" },
      { item: "Multiple journey visa", costLocal: "SGD $30", costINR: "\u20B91.9K" },
    ],
    tips: [
      "Singapore has no capital gains tax and income tax is 0\u201322% (much lower than Europe)",
      "The COMPASS framework now considers company diversity and local hiring ratios",
      "Housing (rental) is the biggest expense \u2014 budget SGD $2,000\u2013$3,500/month",
      "No language barrier \u2014 English is the working language",
      "PR approval has become harder recently \u2014 community contributions help your application",
    ],
    avgTechSalary: "SGD $72,000\u2013$120,000",
    avgTechSalaryINR: "\u20B945L\u2013\u20B975L",
    colIndex: 180,
    indiaSpecific:
      "Singapore has a large Indian community (~9% of population). No cultural adjustment issues with food, language, or social networks. 4.5-hour direct flights from most Indian cities. Many Indian-founded startups operate here.",
  },
  fr: {
    code: "FR",
    name: "France",
    flag: "\u{1F1EB}\u{1F1F7}",
    intro:
      "France\u2019s tech scene (La French Tech) is booming, centered around Paris and its Station F startup campus. The Talent Passport offers a streamlined visa for tech workers.",
    visaTypes: [
      {
        name: "Talent Passport (Salaried Employee)",
        description:
          "For highly skilled workers in innovative companies or those earning above the threshold. Multi-year visa with work authorization.",
        salaryThreshold: "\u20AC39,000/year (1.5x minimum wage)",
        salaryThresholdINR: "\u20B936L/year",
        processingTime: "2\u20134 months",
        duration: "Up to 4 years",
        prPathway: true,
        prNote: "10-year resident card after 5 years",
      },
      {
        name: "EU Blue Card (France)",
        description:
          "EU-wide work permit option. Higher salary threshold than the Talent Passport but portable across EU.",
        salaryThreshold: "\u20AC53,836/year",
        salaryThresholdINR: "\u20B950L/year",
        processingTime: "2\u20134 months",
        duration: "4 years",
        prPathway: true,
      },
    ],
    costs: [
      { item: "Visa application", costLocal: "\u20AC99", costINR: "\u20B99K" },
      { item: "Residence permit (OFII tax)", costLocal: "\u20AC225", costINR: "\u20B921K" },
      { item: "Health insurance", costLocal: "Included in social charges", costINR: "\u2014" },
    ],
    tips: [
      "Paris is the main tech hub \u2014 Station F is the world\u2019s largest startup campus",
      "French language skills significantly improve your daily life and career prospects",
      "The Talent Passport is easier to obtain than a standard work permit",
      "Lyon, Toulouse, and Bordeaux have growing tech scenes with lower costs",
      "Social charges are high (~22%) but cover excellent healthcare and benefits",
    ],
    avgTechSalary: "\u20AC45,000\u2013\u20AC65,000",
    avgTechSalaryINR: "\u20B941L\u2013\u20B960L",
    colIndex: 160,
    indiaSpecific:
      "Smaller Indian community than UK/Germany but growing. Companies like Capgemini, Atos, and startups at Station F hire Indian tech talent. French language basics (A2) recommended for a smoother experience.",
  },
};

// ============================================================
// Page
// ============================================================

interface Props {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const guide = GUIDES[country];
  if (!guide) return { title: "Visa Guide Not Found" };

  return {
    title: `${guide.flag} ${guide.name} Visa Guide for Indian Developers`,
    description: `Complete guide to work visas in ${guide.name}: visa types, salary thresholds in INR, costs, processing times, and PR pathways for Indian tech professionals.`,
  };
}

export async function generateStaticParams() {
  return Object.keys(GUIDES).map((country) => ({ country }));
}

export default async function VisaGuideDetailPage({ params }: Props) {
  const { country } = await params;
  const guide = GUIDES[country];

  if (!guide) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-400">
        <Link href="/visa-guides" className="transition hover:text-sky-400">
          Visa Guides
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-300">
          {guide.flag} {guide.name}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-sora text-3xl font-bold text-white sm:text-4xl">
          {guide.flag} {guide.name} Visa Guide
        </h1>
        <p className="mt-1 text-sm text-sky-400">For Indian Tech Professionals</p>
        <p className="mt-4 text-lg text-slate-300">{guide.intro}</p>
      </div>

      {/* Quick stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Avg Tech Salary
          </p>
          <p className="mt-1 font-spaceGrotesk text-lg font-semibold text-emerald-400">
            {guide.avgTechSalary}
          </p>
          <p className="mt-0.5 text-sm text-slate-400">
            {guide.avgTechSalaryINR}
          </p>
        </div>
        <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Cost of Living
          </p>
          <p className="mt-1 font-spaceGrotesk text-lg font-semibold text-white">
            {guide.colIndex}
          </p>
          <p className="mt-0.5 text-sm text-slate-400">
            vs Bangalore = 100
          </p>
        </div>
        <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Visa Options
          </p>
          <p className="mt-1 font-spaceGrotesk text-lg font-semibold text-sky-400">
            {guide.visaTypes.length}
          </p>
          <p className="mt-0.5 text-sm text-slate-400">
            work visa routes
          </p>
        </div>
      </div>

      {/* Visa types */}
      <section className="mb-10">
        <h2 className="mb-6 font-sora text-2xl font-bold text-white">
          Visa Types
        </h2>
        <div className="space-y-4">
          {guide.visaTypes.map((visa) => (
            <div
              key={visa.name}
              className="rounded-xl border border-navy-600/50 bg-navy-800 p-6"
            >
              <h3 className="font-sora text-xl font-semibold text-white">
                {visa.name}
              </h3>
              <p className="mt-2 text-slate-300">{visa.description}</p>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {visa.salaryThreshold && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-slate-500">
                      Salary Threshold
                    </dt>
                    <dd className="mt-0.5 font-spaceGrotesk font-medium text-emerald-400">
                      {visa.salaryThreshold}
                    </dd>
                    {visa.salaryThresholdINR && (
                      <dd className="text-sm text-slate-400">
                        {visa.salaryThresholdINR}
                      </dd>
                    )}
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">
                    Processing Time
                  </dt>
                  <dd className="mt-0.5 font-medium text-white">
                    {visa.processingTime}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">
                    Duration
                  </dt>
                  <dd className="mt-0.5 font-medium text-white">
                    {visa.duration}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">
                    PR Pathway
                  </dt>
                  <dd className="mt-0.5">
                    {visa.prPathway ? (
                      <span className="text-emerald-400">
                        Yes {visa.prNote && `\u2014 ${visa.prNote}`}
                      </span>
                    ) : (
                      <span className="text-slate-400">No direct pathway</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* Costs */}
      <section className="mb-10">
        <h2 className="mb-6 font-sora text-2xl font-bold text-white">
          Cost Breakdown
        </h2>
        <div className="overflow-hidden rounded-xl border border-navy-600/50">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-600/50 bg-navy-800">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Item
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Cost (Local)
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Cost (INR)
                </th>
              </tr>
            </thead>
            <tbody>
              {guide.costs.map((cost, i) => (
                <tr
                  key={cost.item}
                  className={`border-b border-navy-600/30 ${
                    i % 2 === 0 ? "bg-navy-900/30" : "bg-navy-800/50"
                  }`}
                >
                  <td className="px-5 py-3 text-sm text-slate-300">
                    {cost.item}
                  </td>
                  <td className="px-5 py-3 text-right font-spaceGrotesk text-sm text-white">
                    {cost.costLocal}
                  </td>
                  <td className="px-5 py-3 text-right font-spaceGrotesk text-sm text-emerald-400">
                    {cost.costINR}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* India-specific notes */}
      <section className="mb-10">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="flex items-center gap-2 font-sora text-xl font-bold text-amber-400">
            <span className="text-2xl">{"\u{1F1EE}\u{1F1F3}"}</span> India-Specific Notes
          </h2>
          <p className="mt-3 text-slate-300">{guide.indiaSpecific}</p>
        </div>
      </section>

      {/* Tips */}
      <section className="mb-10">
        <h2 className="mb-6 font-sora text-2xl font-bold text-white">
          Top Tips
        </h2>
        <div className="space-y-3">
          {guide.tips.map((tip, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-navy-600/50 bg-navy-800 p-4"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/10 font-spaceGrotesk text-xs font-bold text-sky-400">
                {i + 1}
              </span>
              <p className="text-sm text-slate-300">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-8 text-center">
        <h2 className="font-sora text-xl font-bold text-white">
          Ready to find a job in {guide.name}?
        </h2>
        <p className="mt-2 text-slate-400">
          Browse visa-sponsored tech jobs with verified sponsors.
        </p>
        <Link
          href={`/jobs?country=${guide.code}`}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-medium text-white transition hover:bg-sky-400"
        >
          {guide.flag} Browse Jobs in {guide.name}
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
