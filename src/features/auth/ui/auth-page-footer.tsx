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
    <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-8 lg:px-10 xl:px-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_16rem]">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted">
              {aboutUsIntro.title}
            </p>
            <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {aboutUsIntro.summary}
            </h2>
            <p className="max-w-2xl text-sm leading-8 text-muted">{aboutUsIntro.purpose}</p>
          </div>

          {narrativeSections.map((section) => (
            <div key={section.heading} className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">{section.heading}</h3>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="max-w-2xl text-sm leading-8 text-muted">
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="max-w-2xl space-y-2 text-sm leading-8 text-muted">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted">
            Who We Serve
          </p>
          <ul className="space-y-3 text-sm leading-8 text-muted">
            {whoWeServeSection?.bullets?.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <blockquote className="rounded-[1.5rem] border border-border bg-panel px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-medium text-foreground">A message from the founder</p>
            <p className="mt-3 text-sm leading-8 text-muted">&ldquo;{founderMessage.quote}&rdquo;</p>
            <footer className="mt-4 text-sm text-muted">
              <p className="font-semibold text-foreground">{founderMessage.author}</p>
              <p>{founderMessage.title}</p>
            </footer>
          </blockquote>
        </div>

        <div className="space-y-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted">
            Connect
          </p>
          <div className="flex flex-col gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-between rounded-full border border-border bg-panel px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
              >
                <span>{social.label}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
