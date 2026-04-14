export type AboutUsSection = Readonly<{
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
}>;

export const aboutUsIntro = {
  title: "About Registruum",
  summary:
    "Registruum is a modern platform built by Hightech Elevator Solution Inc. to simplify operations, records, and communication for businesses, teams, and individuals.",
  purpose:
    "We built Registruum with one clear goal: to bring structure, clarity, and control to businesses overwhelmed by scattered workflows and lost information.",
} as const;

export const aboutUsSections: readonly AboutUsSection[] = [
  {
    heading: "Why Registruum Was Created",
    paragraphs: [
      "Registruum was not created in a boardroom. It was built from real-life experience.",
      "As a startup founder managing operations, communication, project tracking, and documentation, we experienced firsthand how difficult it is to stay organized when work is scattered across too many tools.",
      "Many startups, small teams, property managers, and service-based companies still rely on messaging apps, manual tracking, unorganized files, and verbal agreements. That often leads to confusion, delays, lost records, miscommunication, financial loss, and legal risk.",
      "Registruum was built to solve that.",
    ],
    bullets: [
      "keep track of work orders;",
      "manage teams across different roles;",
      "store important files and proof of work;",
      "maintain clear communication;",
      "protect records from being lost or disputed.",
    ],
  },
  {
    heading: "What Registruum Does",
    paragraphs: [
      "Registruum is a centralized platform that gives users one workflow and one place for operational coordination and recordkeeping.",
    ],
    bullets: [
      "create and manage work orders;",
      "assign roles and responsibilities;",
      "communicate within structured workflows;",
      "upload and store files, photos, and documents;",
      "track progress in real time;",
      "maintain organized and traceable records;",
      "build audit-ready documentation.",
    ],
  },
  {
    heading: "Who We Serve",
    bullets: [
      "small to medium businesses managing daily operations, projects, and internal coordination;",
      "property managers and building teams handling maintenance, repairs, and communication;",
      "contractors and service providers tracking jobs, documenting work, and maintaining proof of service;",
      "individuals and startups who need a simple but structured system to stay organized and professional.",
    ],
  },
  {
    heading: "Mission and Vision",
    paragraphs: [
      "Our mission is to empower businesses and individuals with a simple, structured, and reliable system that transforms chaos into organized workflows and secure records.",
      "Our vision is to become a globally trusted platform for work order management, digital recordkeeping, operational workflows, and business accountability, where every task, record, and communication is clear, traceable, and protected.",
    ],
  },
  {
    heading: "What Makes Registruum Different",
    bullets: [
      "simplicity with structure so complex operations stay manageable;",
      "an audit-ready system where every action, update, and record is stored and traceable;",
      "built for real use and based on real business struggles, not theory;",
      "flexible for any industry, from property management to service-based businesses and beyond;",
      "scalable growth so teams can start small and grow without changing systems.",
    ],
  },
  {
    heading: "Our Commitment",
    paragraphs: [
      "We are committed to continuously improving the platform, listening to real users, building features that solve actual problems, and maintaining security, reliability, and usability.",
      "Registruum is not just software. It is a system built to support your business as it grows.",
    ],
  },
];

export const founderMessage = {
  quote:
    "Registruum was built during a time when managing everything felt overwhelming, from connecting with people, handling operations, tracking work, to keeping records safe. I realized that many businesses go through the same struggle. Instead of accepting the chaos, we built a system to fix it. Registruum is more than a platform. It's a solution to help people stay organized, protected, and in control of their work.",
  author: "Ruzyl Earl Cabarles",
  title: "Founder of Registruum (by Hightech Elevator Solution Inc.)",
} as const;
