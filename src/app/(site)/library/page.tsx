import type { Metadata } from "next";
import { BookShelf } from "@/components/book-shelf";
import { AppWindow } from "@/components/os/app-window";
import { ListGroup, ListRow } from "@/components/os/os-list";
import { findBuiltInApp } from "@/data/apps";
import { BOOKS } from "@/data/books";
import { siteName } from "@/lib/site";

const description =
  "Six books I keep coming back to, on a shelf you can pull them off.";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Library",
  description,
  alternates: {
    canonical: "/library",
  },
  openGraph: {
    type: "website",
    url: "/library",
    title: `Library | ${siteName}`,
    description,
  },
};

export default function LibraryPage() {
  const app = findBuiltInApp("library");
  return (
    <AppWindow
      app={app}
      title="Library"
      lede="Six books I keep coming back to. Pull one off the shelf."
    >
      <div className="-mx-2 mb-8 mt-2">
        <BookShelf />
      </div>
      <ListGroup title="On the shelf">
        {BOOKS.map((book) => (
          <ListRow
            key={book.id}
            href={book.buyUrl}
            external
            title={book.title}
            subtitle={book.author}
            chevron
            data-sound="tap"
            data-analytics-event="Book Link Clicked"
            data-analytics-label={book.title}
          />
        ))}
      </ListGroup>
    </AppWindow>
  );
}
