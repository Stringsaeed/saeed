import {
  type ProjectLink,
  type ShippedApp,
  type SideProject,
  shippedApps,
  sideProjects,
} from "@/data/projects";

// Every app as a game cartridge. Shipped apps and side projects are the
// same object; the label says which. This file is data only, so the page
// can list the cartridges without loading three.js.

/** Stickers that fit along the bottom of a cartridge. No app has more
 *  links than this today; a fifth would have no sticker and so no way to
 *  reach it, and would need a place of its own. */
export const MAX_STICKERS = 4;

export type Cartridge = {
  id: string;
  name: string;
  description: string;
  logo: string;
  /** The app's own colour, as #rrggbb. The shell is a pastel of it. */
  brand: string;
  kind: "shipped" | "side";
  links: readonly ProjectLink[];
};

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function fromShipped(app: ShippedApp): Cartridge {
  const links: ProjectLink[] = [
    {
      ariaLabel: `${app.name} on the App Store`,
      href: app.appStore,
      type: "app-store",
    },
    {
      ariaLabel: `${app.name} on Google Play`,
      href: app.playStore,
      type: "play-store",
    },
  ];
  if (app.web) {
    links.push({
      ariaLabel: `${app.name} on the web`,
      href: app.web,
      type: "web",
    });
  }
  return {
    id: slug(app.name),
    name: app.name,
    description: app.description,
    logo: app.logo,
    brand: app.brand,
    kind: "shipped",
    links,
  };
}

function fromSide(project: SideProject): Cartridge {
  const links: ProjectLink[] = [
    {
      ariaLabel: `${project.name}`,
      href: project.href,
      type: project.type,
    },
    ...project.links,
  ];
  return {
    id: slug(project.name),
    name: project.name,
    description: project.description,
    logo: project.logo,
    brand: project.brand ?? "#8e8e96",
    kind: "side",
    links,
  };
}

export const CARTRIDGES: readonly Cartridge[] = [
  ...shippedApps.map(fromShipped),
  ...sideProjects.map(fromSide),
];
