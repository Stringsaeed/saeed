import Image from "next/image";
import Link from "next/link";
import { BookShelf } from "@/components/book-shelf";
import { SaeedName } from "@/components/saeed-name";
import { Things } from "@/components/things";
import { projectApps } from "@/data/apps";
import { roles } from "@/data/work";
import type { BlogPost } from "@/lib/content";
import { formatPostDate } from "@/lib/format-date";
import { AppIcon } from "./app-icon";

// The home page on the web platform: the same content as the phone's three
// pages, laid out as one column.

export function WebHome({ posts }: { posts: readonly BlogPost[] }) {
  return (
    <div className="pb-10 pt-6">
      <h1 className="max-w-[22ch] text-balance text-3xl leading-[1.1] font-semibold tracking-[-0.035em] sm:text-4xl">
        I’m <SaeedName />. I build the apps on your phone.
      </h1>
      <p className="mt-4 max-w-[46ch] text-base leading-7 text-muted-foreground">
        Senior software engineer in Dubai. Seven years of React Native, Swift,
        and Kotlin for Thndr, Nomo, Dubizzle, Breadfast, and du, plus a shelf
        of side projects. Switch to iOS or Android above to see this site as
        a phone.
      </p>

      <section className="mt-12">
        <Things />
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="list-heading">Apps</h2>
          <Link
            className="text-link text-sm text-muted-foreground"
            href="/projects"
          >
            All apps
          </Link>
        </div>
        <ul className="mt-5 grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-6 md:grid-cols-8">
          {projectApps.map((app) => (
            <li key={app.id} className="flex flex-col items-center gap-2">
              <Link
                href={app.href}
                className="flex flex-col items-center gap-2 text-center"
                data-sound="tap"
              >
                <AppIcon app={app} size={52} />
                <span className="max-w-full truncate text-[12px] text-muted-foreground">
                  {app.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="list-heading">Work</h2>
          <Link
            className="text-link text-sm text-muted-foreground"
            href="/work"
          >
            Full history
          </Link>
        </div>
        <ul className="mt-5 divide-y divide-border rounded-xl border border-border">
          {roles.slice(0, 5).map((role) => (
            <li key={role.company}>
              <a
                href={role.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 px-4 py-3 hover:bg-hover"
                data-sound="tap"
              >
                <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-border">
                  {role.logo ? (
                    <Image src={role.logo} alt="" width={32} height={32} />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {role.company}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {role.summary}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {role.period}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="list-heading">Writing</h2>
          <Link
            className="text-link text-sm text-muted-foreground"
            href="/blog"
          >
            All posts
          </Link>
        </div>
        <ul className="mt-5 space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                className="group flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                href={`/blog/${post.slug}`}
                data-sound="tap"
              >
                <span className="text-sm font-medium underline-offset-4 group-hover:underline">
                  {post.title}
                </span>
                <time
                  className="shrink-0 font-mono text-xs text-muted-foreground"
                  dateTime={post.date}
                >
                  {formatPostDate(post.date)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="list-heading">Library</h2>
        <div className="mt-5">
          <BookShelf />
        </div>
      </section>
    </div>
  );
}
