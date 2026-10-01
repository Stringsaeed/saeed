import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { BookSpine } from "../src/components/book-spine";
import { BOOKS } from "../src/data/books";

const ids = new Set([
  "inspired",
  "the-design-of-everyday-things",
  "the-staff-engineers-path",
]);
const fonts = `<style>
svg { font-family: Arial, sans-serif; }
.book-spine-geometric { font-family: Futura, 'Century Gothic', 'Avenir Next', Arial, sans-serif; }
.book-spine-humanist { font-family: 'Gill Sans', 'Gill Sans MT', Arial, sans-serif; }
.book-spine-serif { font-family: 'Iowan Old Style', 'Hoefler Text', Palatino, Georgia, serif; }
</style>`;
for (const book of BOOKS.filter((item) => ids.has(item.id))) {
  const markup = renderToStaticMarkup(<BookSpine book={book} unlit />);
  let svg = markup.match(/<svg[\s\S]*?<\/svg>/)?.[0];
  if (!svg) throw new Error(`No SVG spine found for ${book.id}`);
  svg = svg.replace(
    "<svg",
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="3000"',
  );
  svg = svg.replace(/(<svg[^>]*>)/, `$1${fonts}`);
  for (const match of svg.matchAll(/href="(\/books\/[^"]+)"/g)) {
    const source = match[1];
    if (!source) continue;
    const bytes = await sharp(
      await readFile(resolve("public", source.slice(1))),
    )
      .png()
      .toBuffer();
    svg = svg.replace(
      match[0],
      `href="data:image/png;base64,${bytes.toString("base64")}"`,
    );
  }
  const output = resolve("public/books-3d", book.id, "spine-shelf");
  await writeFile(`${output}.svg`, svg);

  console.info(`${book.id}: exported existing SVG spine`);
}
