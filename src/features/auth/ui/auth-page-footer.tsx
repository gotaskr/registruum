"use client";

import { ExternalLink } from "lucide-react";
import {
  aboutUsIntro,
  aboutUsSections,
  founderMessage,
} from "@/features/auth/content/about-us";

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61578647712827",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@registruum.ca",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/registruum/",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/registruum/",
  },
] as const;

const whoWeServeSection = aboutUsSections.find((section) => section.heading === "Who We Serve");
const narrativeSections = aboutUsSections.filter((section) => section.heading !== "Who We Serve");

export function AuthPageFooter() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10 xl:gap-14">
        <main className="min-w-0 flex-1 space-y-8">
          <div className="space-y-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted">
              {aboutUsIntro.title}
            </p>
            <h2 className="text-pretty text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.65rem] sm:leading-snug">
              {aboutUsIntro.summary}
            </h2>
            <p className="text-pretty text-sm leading-7 text-muted sm:text-[15px] sm:leading-8">
              {aboutUsIntro.purpose}
            </p>
          </div>

          {narrativeSections.map((section) => (
            <div key={section.heading} className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">{section.heading}</h3>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="text-pretty text-sm leading-7 text-muted sm:text-[15px] sm:leading-8">
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="space-y-2 text-sm leading-7 text-muted sm:text-[15px] sm:leading-8">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </main>

        <aside className="w-full shrink-0 space-y-5 rounded-2xl border border-border bg-panel-muted/50 p-5 sm:p-6 lg:sticky lg:top-8 lg:max-w-sm lg:self-start xl:max-w-[22rem]">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted">
              Who we serve
            </p>
            <ul className="mt-2.5 space-y-2 text-sm leading-7 text-muted">
              {whoWeServeSection?.bullets?.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <blockquote className="border-t border-border pt-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted">
              A message from the founder
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">&ldquo;{founderMessage.quote}&rdquo;</p>
            <footer className="mt-2.5 text-sm text-muted">
              <p className="font-semibold text-foreground">{founderMessage.author}</p>
              <p className="text-xs sm:text-sm">{founderMessage.title}</p>
            </footer>
          </blockquote>

          <div className="border-t border-border pt-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted">
              Connect
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-between gap-1 rounded-xl border border-border bg-panel px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-background sm:text-[13px]"
                >
                  <span className="truncate">{social.label}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
