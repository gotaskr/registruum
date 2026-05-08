export type TermsSection = Readonly<{
  id: string;
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  ordered?: readonly string[];
}>;

export const termsMeta = {
  title: "Registruum Terms and Conditions",
  documentName: "REGISTRUUM TERMS OF SERVICE",
  effectiveDate: "April 10, 2026",
  lastUpdated: "April 10, 2026",
} as const;

export const termsSections: readonly TermsSection[] = [
  {
    id: "intro",
    heading: "Overview",
    paragraphs: [
      'These Terms of Service ("Terms") govern access to and use of the Registruum platform, website, software, applications, dashboards, records, messaging tools, storage tools, work order systems, bidding tools, and related services (collectively, the "Platform" or "Services") provided by Registruum Technologies Inc. ("Registruum," "we," "us," or "our").',
      "By accessing, registering for, or using Registruum, you agree to be bound by these Terms.",
    ],
  },
  {
    id: "agreement-and-scope",
    heading: "1. Agreement and Scope",
    paragraphs: [
      "These Terms form a legally binding agreement between you and Registruum. They apply to:",
      "These Terms may be supplemented by:",
      "If there is a conflict, the order of priority will be:",
    ],
    bullets: [
      "all users, companies, organizations, contractors, managers, workers, owners, guests, and invited members using the Platform;",
      "all data, files, messages, records, images, work orders, bids, updates, comments, and other materials uploaded, stored, or transmitted through the Platform;",
      "all plans, subscriptions, free trials, paid accounts, and enterprise arrangements.",
      "our Privacy Policy;",
      "our Acceptable Use Policy;",
      "our subscription, billing, and pricing terms;",
      "any order form, quote, proposal, or service agreement issued by Registruum.",
    ],
    ordered: [
      "signed custom agreement or order form;",
      "these Terms;",
      "policies and supporting materials published by Registruum.",
    ],
  },
  {
    id: "eligibility-and-authority",
    heading: "2. Eligibility and Authority",
    paragraphs: [
      "You may only use Registruum if:",
      "If you create or use an account on behalf of a business, property manager, contractor, corporation, partnership, or other entity, you represent and warrant that you have authority to bind that entity to these Terms.",
    ],
    bullets: [
      "you are legally capable of entering into a binding agreement;",
      "you are authorized to act on behalf of yourself, your company, or your organization;",
      "all information you provide is accurate, current, and complete.",
    ],
  },
  {
    id: "account-responsibility",
    heading: "3. Account Responsibility",
    paragraphs: [
      "You are responsible for:",
      "Registruum is not responsible for losses resulting from unauthorized use of your credentials where such use results from your failure to maintain reasonable account security.",
    ],
    bullets: [
      "all activity under your account and sub-accounts;",
      "maintaining the confidentiality of your password and login credentials;",
      "ensuring that invited users, workers, managers, contractors, and team members comply with these Terms;",
      "keeping your account information accurate and updated.",
    ],
  },
  {
    id: "nature-of-platform",
    heading: "4. Nature of the Platform",
    paragraphs: [
      "Registruum is a digital platform designed to support operational coordination, work order management, document storage, collaboration, and recordkeeping.",
      "Unless expressly stated otherwise in a separate written agreement, Registruum:",
      "The Platform is a tool for managing and preserving workflows and records. Final business, legal, safety, compliance, operational, and contractor decisions remain your responsibility.",
    ],
    bullets: [
      "is not a law firm, accounting firm, engineering firm, or professional advisory service;",
      "is not a licensed property manager, contractor, insurer, escrow provider, or payment processor;",
      "does not guarantee the quality, legality, safety, completion, pricing, licensing, conduct, or performance of third-party users, vendors, or contractors;",
      "does not independently verify every file, statement, photo, work update, contractor qualification, or user-submitted record on the Platform.",
    ],
  },
  {
    id: "user-content-and-records",
    heading: "5. User Content and Records",
    paragraphs: [
      'You retain ownership of the information, documents, photos, messages, and materials you upload or submit ("User Content").',
      "By uploading or submitting User Content, you grant Registruum a non-exclusive, worldwide, royalty-free license to host, store, process, transmit, back up, display, reproduce, and use such User Content solely for:",
      "You represent and warrant that:",
    ],
    bullets: [
      "operating the Platform;",
      "providing the Services;",
      "maintaining backups and security;",
      "enforcing these Terms;",
      "complying with legal obligations;",
      "improving platform functionality in aggregated or de-identified form.",
      "you own or control the necessary rights to all User Content you upload;",
      "your User Content does not infringe any third-party rights;",
      "your User Content is lawful, accurate to the best of your knowledge, and not misleading in a material way.",
    ],
  },
  {
    id: "acceptable-use",
    heading: "6. Acceptable Use",
    paragraphs: [
      "You agree not to:",
      "We may monitor, investigate, remove, restrict, suspend, or terminate content or access where we reasonably believe a violation has occurred.",
    ],
    bullets: [
      "use the Platform for unlawful, fraudulent, deceptive, abusive, or harmful purposes;",
      "upload malicious code, malware, ransomware, spyware, or harmful scripts;",
      "interfere with or disrupt the Platform, servers, or infrastructure;",
      "attempt unauthorized access to any account, database, storage, or network;",
      "scrape, copy, extract, reverse engineer, decompile, or exploit the Platform beyond permitted use;",
      "use the Platform to harass, threaten, defame, impersonate, or abuse others;",
      "upload content that is illegal, infringing, obscene, discriminatory, violent, or otherwise objectionable;",
      "falsify records, timestamps, photos, work completion evidence, approvals, or bidding activity;",
      "misuse the messaging or recordkeeping system to fabricate compliance or mislead other users.",
    ],
  },
  {
    id: "roles-and-permissions",
    heading: "7. Platform Roles and Permissions",
    paragraphs: [
      "Registruum may provide role-based access such as administrator, manager, superintendent, contractor, worker, viewer, executive viewer, or other permission-based roles.",
      "Role settings are provided as a convenience feature only. You are responsible for:",
      "Registruum is not responsible for internal misuse caused by permissions granted by your organization unless caused directly by our own proven misconduct.",
    ],
    bullets: [
      "assigning appropriate roles;",
      "controlling who has access to your workspace;",
      "reviewing access rights regularly;",
      "removing users who should no longer have access.",
    ],
  },
  {
    id: "record-locking",
    heading: "8. Record Locking, Archives, and Audit Features",
    paragraphs: [
      "Registruum may provide features such as locked work orders, archived files, immutable records, time-stamped uploads, approval workflows, and audit-ready histories.",
      "These features are intended to support operational traceability, but Registruum does not guarantee that:",
      "You remain responsible for your own legal retention obligations, reporting obligations, and evidence management practices.",
    ],
    bullets: [
      "every record will satisfy every legal, evidentiary, insurance, court, regulatory, or contractual standard;",
      "every timestamp will be accepted by third parties as conclusive proof;",
      "stored records alone will be sufficient to defend, prove, or win any dispute, claim, audit, or lawsuit.",
    ],
  },
  {
    id: "privacy-and-data-handling",
    heading: "9. Privacy and Data Handling",
    paragraphs: [
      "We collect, use, store, and disclose personal and business information in accordance with our Privacy Policy.",
      "You acknowledge and agree that:",
      "Where permitted by law, Registruum may access, preserve, review, or disclose account information or User Content where reasonably necessary to:",
    ],
    bullets: [
      "data may be processed through third-party hosting, storage, analytics, communications, and infrastructure providers;",
      "no digital platform can guarantee absolute security;",
      "you are responsible for not uploading unnecessary highly sensitive information unless required and authorized.",
      "operate and secure the Platform;",
      "investigate suspected misuse;",
      "enforce these Terms;",
      "comply with legal process, court orders, or lawful requests;",
      "protect Registruum, its users, or the public.",
    ],
  },
  {
    id: "security",
    heading: "10. Security",
    paragraphs: [
      "Registruum will take commercially reasonable steps to protect the Platform and data under our control using administrative, technical, and organizational safeguards appropriate to the nature of the Services.",
      "However:",
      "You must immediately notify us if you suspect unauthorized access, breach, credential compromise, or suspicious activity involving your account.",
    ],
    bullets: [
      "the internet is not fully secure;",
      "unauthorized access, outages, interception, delays, corruption, and cyber incidents can still occur;",
      "you are responsible for maintaining your own internal device, email, network, password, and user-access security.",
    ],
  },
  {
    id: "subscriptions",
    heading: "11. Subscription, Billing, and Fees",
    paragraphs: [
      "Some Services may be free, trial-based, usage-based, subscription-based, or subject to custom pricing.",
      "By subscribing to a paid plan, you agree to pay all applicable:",
      "Unless otherwise stated:",
      "Failure to pay may result in restricted access, suspension, storage limitation, downgrade, or termination of Services.",
    ],
    bullets: [
      "subscription fees;",
      "add-on fees;",
      "overage fees;",
      "storage or bandwidth fees;",
      "taxes and government charges.",
      "fees are billed in advance;",
      "fees are non-refundable once billed;",
      "overdue amounts may result in suspension or termination;",
      "Registruum may change pricing on future billing cycles with prior notice.",
    ],
  },
  {
    id: "trials-and-beta",
    heading: "12. Free Plans, Trials, and Beta Features",
    paragraphs: [
      'Registruum may offer free plans, free trials, promotional access, beta tools, or early-access features. These are provided "as is" and may:',
      "We may delete or disable trial environments after expiry unless otherwise agreed.",
    ],
    bullets: [
      "be limited in scope;",
      "change at any time;",
      "be withdrawn at any time;",
      "have reduced storage, bandwidth, speed, support, or retention.",
    ],
  },
  {
    id: "service-changes",
    heading: "13. Service Changes",
    paragraphs: [
      "We may modify, update, suspend, discontinue, enhance, remove, or replace any part of the Platform or Services at any time.",
      "We may also change these Terms by posting an updated version and indicating the revised effective date. Continued use after the effective date of the updated Terms constitutes acceptance of the revised Terms.",
      "If you do not agree to a material update, your remedy is to stop using the Platform and cancel your account.",
    ],
  },
  {
    id: "suspension-and-termination",
    heading: "14. Suspension and Termination",
    paragraphs: [
      "We may restrict, suspend, or terminate access immediately, with or without notice, if:",
      "Upon suspension or termination:",
    ],
    bullets: [
      "you breach these Terms;",
      "you fail to pay amounts due;",
      "we suspect fraud, abuse, illegal conduct, or security risk;",
      "your use threatens the integrity, availability, legality, or security of the Platform;",
      "required by law, court order, or regulatory direction;",
      "we determine continued service is commercially, legally, or technically impractical.",
      "your access may be disabled immediately;",
      "your data may become unavailable;",
      "we may retain or delete data in accordance with our retention policies and legal obligations;",
      "amounts already due remain payable.",
    ],
  },
  {
    id: "intellectual-property",
    heading: "15. Intellectual Property",
    paragraphs: [
      "Registruum and its licensors own all right, title, and interest in the Platform, including:",
      "Except for the limited right to use the Platform in accordance with these Terms, no rights are granted to you.",
      "You may not copy, reproduce, modify, sell, license, distribute, or create derivative works from the Platform unless expressly authorized in writing.",
    ],
    bullets: [
      "software;",
      "structure;",
      "databases;",
      "interface design;",
      "branding;",
      "text;",
      "workflows;",
      "logos;",
      "features;",
      "graphics;",
      "documentation.",
    ],
  },
  {
    id: "third-party-services",
    heading: "16. Third-Party Services",
    paragraphs: [
      "The Platform may integrate with or depend on third-party tools, hosting providers, messaging systems, payment services, file storage services, or external links.",
      "Registruum is not responsible for:",
      "Your use of third-party services is governed by their own terms.",
    ],
    bullets: [
      "third-party outages;",
      "third-party terms or privacy practices;",
      "third-party fees;",
      "losses caused by your use of third-party products or services.",
    ],
  },
  {
    id: "no-warranty",
    heading: "17. No Warranty",
    paragraphs: [
      'To the maximum extent permitted by law, the Platform and Services are provided "as is" and "as available."',
      "Registruum disclaims all warranties, representations, and conditions, whether express, implied, statutory, or collateral, including any implied warranties of:",
      "We do not warrant that the Platform will always be uninterrupted, secure, timely, complete, or free from bugs, data loss, or downtime.",
    ],
    bullets: [
      "merchantability;",
      "fitness for a particular purpose;",
      "title;",
      "non-infringement;",
      "uninterrupted availability;",
      "accuracy;",
      "security;",
      "compatibility;",
      "error-free performance.",
    ],
  },
  {
    id: "limitation-of-liability",
    heading: "18. Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, Registruum, its affiliates, officers, directors, employees, contractors, licensors, and agents will not be liable for any:",
      "To the maximum extent permitted by law, Registruum's total aggregate liability arising out of or relating to the Services shall not exceed the greater of:",
      "This limitation applies regardless of the legal theory and even if a remedy fails of its essential purpose.",
    ],
    bullets: [
      "indirect, incidental, special, exemplary, punitive, or consequential damages;",
      "lost profits;",
      "lost revenue;",
      "lost business opportunities;",
      "lost data;",
      "loss of goodwill;",
      "business interruption;",
      "security incidents;",
      "procurement of substitute services;",
      "legal, insurance, or compliance losses arising from use of the Platform.",
    ],
    ordered: [
      "the total amount you paid to Registruum in the 3 months before the event giving rise to the claim; or",
      "CAD $100.",
    ],
  },
  {
    id: "indemnity",
    heading: "19. Indemnity",
    paragraphs: [
      "You agree to defend, indemnify, and hold harmless Registruum, its affiliates, officers, directors, employees, contractors, and agents from and against all claims, liabilities, losses, damages, penalties, judgments, costs, and expenses, including reasonable legal fees, arising from or related to:",
    ],
    bullets: [
      "your use of the Platform;",
      "your User Content;",
      "your breach of these Terms;",
      "your violation of law;",
      "your infringement of third-party rights;",
      "disputes between you and another user, customer, contractor, worker, vendor, or organization.",
    ],
  },
  {
    id: "compliance",
    heading: "20. Compliance and Legal Use",
    paragraphs: [
      "You agree to use Registruum in compliance with all applicable laws, regulations, and contractual obligations, including those relating to:",
      "Registruum does not guarantee that your use of the Platform alone makes you legally compliant.",
    ],
    bullets: [
      "privacy;",
      "workplace safety;",
      "recordkeeping;",
      "employment;",
      "contract or engagement;",
      "consumer protection;",
      "communications;",
      "document retention.",
    ],
  },
  {
    id: "governing-law",
    heading: "21. Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles.",
      "Any dispute arising out of or relating to these Terms or the Services shall be brought in the courts located in Ontario, unless Registruum elects another lawful dispute resolution method in a separate written agreement.",
    ],
  },
  {
    id: "severability",
    heading: "22. Severability",
    paragraphs: [
      "If any provision of these Terms is held unlawful, invalid, or unenforceable, the remaining provisions shall remain in full force and effect.",
    ],
  },
  {
    id: "no-waiver",
    heading: "23. No Waiver",
    paragraphs: [
      "A failure by Registruum to enforce any provision of these Terms is not a waiver of our right to do so later.",
    ],
  },
  {
    id: "entire-agreement",
    heading: "24. Entire Agreement",
    paragraphs: [
      "These Terms, together with any incorporated policies and applicable order forms, constitute the entire agreement between you and Registruum regarding the Platform.",
    ],
  },
];

export const policySections: readonly TermsSection[] = [
  {
    id: "privacy-policy",
    heading: "Privacy Policy",
    paragraphs: [
      'Registruum Technologies Inc. ("Registruum", "we", "us") respects your privacy and is committed to protecting your personal and business information.',
      "This Privacy Policy explains how we collect, use, store, and protect your data when you use the Registruum platform.",
      "We may collect account information such as your name, email address, phone number, company details, and role; platform data such as work orders, messages, chats, photos, files, bids, pricing data, logs, timestamps, and activity records; and technical data such as your IP address, device type, browser, and usage analytics.",
      "We use your data to operate and improve the platform, manage accounts and access, store and organize records, provide customer support, monitor security and prevent fraud, and comply with legal obligations.",
      "We do not sell your data. We may share data with cloud hosting providers, analytics tools, service providers such as email and infrastructure vendors, and legal authorities if required.",
      "Data may be stored in Canada or other secure regions using secure cloud infrastructure. We apply reasonable safeguards but cannot guarantee complete security.",
      "You are responsible for not uploading unnecessary sensitive data, managing user access in your account, and securing your login credentials.",
      "We may retain data while your account is active, for backup and legal compliance, and for a limited period after termination.",
      "You may request access to your data, corrections, or deletion, subject to legal limits. We may update this policy at any time, and continued use means acceptance.",
    ],
  },
  {
    id: "acceptable-use-policy",
    heading: "Acceptable Use Policy",
    paragraphs: [
      "This policy defines what users can and cannot do on Registruum.",
      "You must not break any law, upload illegal content, use the platform for fraud or scams, hack, exploit, reverse engineer, overload servers, bypass security, falsify work orders, fake completion proof, manipulate timestamps or logs, mislead clients or contractors, harass or threaten users, impersonate others, or upload offensive content.",
      "We may remove content, suspend accounts, terminate users, and report issues to authorities without notice if the risk is serious.",
    ],
  },
  {
    id: "data-retention-processing-policy",
    heading: "Data Retention and Processing Policy",
    paragraphs: [
      "This policy explains how Registruum handles storage, backups, deletion, and processing.",
      "Data is stored on secure servers, backups may be created automatically, and storage may include third-party providers.",
      "We may retain active account data, archived work orders, logs, and audit trails. Even after deletion, backups may still temporarily exist and legal retention may apply.",
      "We may process data to operate workflows, enable messaging, maintain audit logs, and improve the platform.",
      "Registruum does not guarantee legal compliance of stored records, court acceptance of data, or perfect accuracy or completeness. Users remain responsible for their own compliance, legal documentation, and record validation.",
      "Users may request deletion, but some data may remain for legal or security reasons and deletion may not be immediate.",
    ],
  },
  {
    id: "subscription-refund-policy",
    heading: "Subscription and Refund Policy",
    paragraphs: [
      "Registruum may offer Free, Basic, Pro, and Enterprise or custom plans with different storage, bandwidth, work order limits, and user limits.",
      "Fees are billed in advance. Monthly or yearly billing may apply, and taxes may apply.",
      "You agree to pay all charges on time and maintain a valid payment method. Failure may result in suspension, downgrade, or termination.",
      "All payments are non-refundable except where required by law or explicitly approved by Registruum.",
      "We may change pricing, features, and limits with notice for paid users.",
      "Free users may have limited storage, bandwidth, features, and slower performance. We may restrict usage or suspend excessive use.",
      "We may terminate accounts for non-payment, abuse, or violations. No refunds apply after termination.",
    ],
  },
];
