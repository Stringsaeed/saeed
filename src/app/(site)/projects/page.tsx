import type { Metadata } from "next";
import { AppIcon } from "@/components/os/app-icon";
import { AppWindow } from "@/components/os/app-window";
import { ListGroup, ListRow } from "@/components/os/os-list";
import {
  findBuiltInApp,
  shippedProjectApps,
  sideProjectApps,
} from "@/data/apps";
import { siteName } from "@/lib/site";

const description =
  "Sixteen apps: eight shipped at work for Thndr, dubizzle, Nomo, Breadfast, du and others, and eight side projects.";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Apps",
  description,
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    type: "website",
    url: "/projects",
    title: `Apps | ${siteName}`,
    description,
  },
};

export default function ProjectsPage() {
  const app = findBuiltInApp("projects");
  return (
    <AppWindow
      app={app}
      title="Apps"
      lede="The ones I shipped at work, then the ones I built for myself."
    >
      <ListGroup title="Shipped at work">
        {shippedProjectApps.map((item) => (
          <ListRow
            key={item.id}
            href={item.href}
            transitionTypes={[
              "push",
            ]}
            leading={<AppIcon app={item} size={36} />}
            title={item.name}
            subtitle={item.description}
            clampSubtitle
            chevron
            data-sound="tap"
            data-analytics-event="Project Opened"
            data-analytics-project={item.name}
          />
        ))}
      </ListGroup>
      <ListGroup title="Side projects" footer="All of these are open source.">
        {sideProjectApps.map((item) => (
          <ListRow
            key={item.id}
            href={item.href}
            transitionTypes={[
              "push",
            ]}
            leading={<AppIcon app={item} size={36} />}
            title={item.name}
            subtitle={item.description}
            clampSubtitle
            chevron
            data-sound="tap"
            data-analytics-event="Project Opened"
            data-analytics-project={item.name}
          />
        ))}
      </ListGroup>
    </AppWindow>
  );
}
