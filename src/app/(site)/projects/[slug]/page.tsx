import {
  RiAppleFill,
  RiGithubFill,
  RiGlobalLine,
  RiGooglePlayFill,
  RiLinkedinFill,
  RiNewspaperLine,
  RiPlaneFill,
} from "@remixicon/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MorphingAppIcon } from "@/components/os/app-icon";
import { AppWindow } from "@/components/os/app-window";
import { ListGroup, ListRow } from "@/components/os/os-list";
import { findProjectApp, linkTypeLabels, projectApps } from "@/data/apps";
import type { ProjectLinkType } from "@/data/projects";
import { siteName } from "@/lib/site";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const icons: Record<ProjectLinkType, typeof RiAppleFill> = {
  "app-store": RiAppleFill,
  "play-store": RiGooglePlayFill,
  github: RiGithubFill,
  web: RiGlobalLine,
  press: RiNewspaperLine,
  linkedin: RiLinkedinFill,
  testflight: RiPlaneFill,
};

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js prerenders every app from this list.
export function generateStaticParams() {
  return projectApps.map((app) => ({
    slug: app.id,
  }));
}

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const app = findProjectApp(slug);
  if (!app) notFound();
  return {
    title: app.name,
    description: app.description,
    alternates: {
      canonical: app.href,
    },
    openGraph: {
      type: "website",
      url: app.href,
      title: `${app.name} | ${siteName}`,
      description: app.description,
    },
  };
}

function hostname(href: string) {
  return new URL(href).hostname.replace(/^www\./, "");
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const app = findProjectApp(slug);
  if (!app) notFound();

  const Primary = icons[app.primary.type];

  return (
    <AppWindow
      title={app.name}
      icon={null}
      back={{
        href: "/projects",
        label: "Apps",
        kind: "pop",
      }}
      analyticsLabel={`Project ${app.name}`}
    >
      <div className="flex flex-col items-center px-2 pt-4 pb-6 text-center">
        <div className="[&_.os-icon]:shadow-[0_18px_40px_-16px_rgb(0_0_0/0.45)]">
          <MorphingAppIcon app={app} size={108} priority />
        </div>
        <p className="mt-5 max-w-[32ch] text-[17px] leading-[1.4]">
          {app.description}
        </p>
        <p className="mt-2 text-[13px] text-[color:var(--os-text-2)]">
          {app.group === "shipped" ? "Shipped at work" : "Side project"}
        </p>
        <a
          className="os-button mt-5 min-w-[11rem]"
          href={app.primary.href}
          target="_blank"
          rel="noopener noreferrer"
          data-sound="tap"
          data-analytics-event="Project Link Clicked"
          data-analytics-project={app.name}
          data-analytics-type={app.primary.type}
        >
          <Primary aria-hidden="true" />
          {app.primary.type === "app-store"
            ? "Get it on the App Store"
            : app.primary.type === "testflight"
              ? "Join the TestFlight"
              : `Open ${hostname(app.primary.href)}`}
        </a>
      </div>

      {app.role ? (
        <ListGroup title="What I did">
          <li>
            <p className="os-row text-[15px] leading-[1.5]">{app.role}</p>
          </li>
        </ListGroup>
      ) : null}

      {app.links.length > 0 ? (
        <ListGroup title="Also on">
          {app.links.map((link) => {
            const Icon = icons[link.type];
            return (
              <ListRow
                key={link.href}
                href={link.href}
                external
                leading={
                  <span className="grid size-9 place-items-center rounded-[10px] bg-[color:var(--os-card-2)] text-[color:var(--os-text)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                }
                title={
                  link.platform
                    ? `${linkTypeLabels[link.type]} · ${link.platform}`
                    : linkTypeLabels[link.type]
                }
                subtitle={hostname(link.href)}
                chevron
                aria-label={link.ariaLabel}
                data-sound="tap"
                data-analytics-event="Project Link Clicked"
                data-analytics-project={app.name}
                data-analytics-type={link.type}
              />
            );
          })}
        </ListGroup>
      ) : null}
    </AppWindow>
  );
}
