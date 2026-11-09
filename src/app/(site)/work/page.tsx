import type { Metadata } from "next";
import Image from "next/image";
import { AppWindow } from "@/components/os/app-window";
import { ListGroup, StaticRow } from "@/components/os/os-list";
import { findBuiltInApp } from "@/data/apps";
import { roles } from "@/data/work";
import { siteName } from "@/lib/site";

const description =
  "Seven years of mobile and frontend engineering, from a React Native developer in Giza to senior roles at Thndr, Dubizzle, Nomo, and Aquanow.";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Work",
  description,
  alternates: {
    canonical: "/work",
  },
  openGraph: {
    type: "website",
    url: "/work",
    title: `Work | ${siteName}`,
    description,
  },
};

function Logo({
  src,
  name,
  brand,
}: {
  src?: string;
  name: string;
  brand: string;
}) {
  return (
    <span
      className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-white text-[13px] font-semibold text-black ring-1 ring-black/10"
      style={
        src
          ? undefined
          : {
              background: brand,
              color: "#fff",
            }
      }
    >
      {src ? (
        <Image src={src} alt="" width={36} height={36} sizes="36px" />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}

export default function WorkPage() {
  const app = findBuiltInApp("work");
  return (
    <AppWindow
      app={app}
      title="Work"
      lede="Seven years, mostly in React Native, with native code in Swift and Kotlin when the app needed it."
    >
      {roles.map((role) => (
        <ListGroup key={role.company} title={role.period} footer={role.stack}>
          <StaticRow
            leading={
              <Logo src={role.logo} name={role.company} brand={role.brand} />
            }
            title={
              <a
                className="font-semibold"
                href={role.href}
                target="_blank"
                rel="noreferrer"
                data-sound="tap"
                data-analytics-event="Work Link Clicked"
                data-analytics-company={role.company}
                data-analytics-location="Work App"
              >
                {role.company}
              </a>
            }
            subtitle={`${role.title} · ${role.location}`}
          />
          {role.bullets.map((bullet) => (
            <StaticRow
              key={bullet}
              title={
                <span className="text-[15px] leading-[1.4]">{bullet}</span>
              }
            />
          ))}
        </ListGroup>
      ))}
    </AppWindow>
  );
}
