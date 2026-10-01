import Image from "next/image";
import { type CSSProperties, useId } from "react";
import type { Book, StripePressSpine } from "@/data/books";

// Spine art is drawn standing up, the way it sits on the shelf: x runs across
// the thickness, y down the length. Type is set in a group turned a quarter
// turn so it reads head to foot, with its baseline measured from the spine's
// centre line. textLength pins every line to the width it has on the printed
// spine, whatever font the device ends up using.
const STRIPE_PRESS_LENGTH = 1600;
// Share of the font size taken by a capital, used to centre type optically.
const CAP_HEIGHT = 0.72;

function StripePressMark() {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
    >
      <path d="M96.5 43V34.5A25 25 0 0 0 46.5 34.5A10.5 10.5 0 0 1 25.5 34.5A10.5 10.5 0 0 1 46.5 34.5" />
      <path d="M89 51V34.5A17.5 17.5 0 0 0 54 34.5A18 18 0 0 1 18 34.5V20" />
      <path d="M81.5 34.5A10 10 0 0 0 61.5 34.5A25.5 25.5 0 0 1 10.5 34.5V28" />
      <path d="M81.5 34.5V60H36M81.5 52H54.5M81.5 44H59.7" />
      <path d="M26 34.5V10.5H36A24 24 0 0 1 53.1 17.6M26 17.5H36A17 17 0 0 1 49 23.6" />
    </g>
  );
}

// The mark is drawn in an 91 by 54 box starting at (8, 8).
const MARK_WIDTH = 91;
const MARK_HEIGHT = 54;

function StripePressType({ spine }: { spine: StripePressSpine }) {
  const { author, mark, title } = spine;
  const markScale = mark.length / MARK_WIDTH;

  return (
    <>
      <text
        x={author.start}
        y={(author.size * CAP_HEIGHT) / 2}
        fontSize={author.size}
        fontWeight={author.weight}
        textLength={author.length}
        lengthAdjust="spacingAndGlyphs"
      >
        {author.text}
      </text>
      <text
        x={title.center}
        y={(title.size * CAP_HEIGHT) / 2}
        fontSize={title.size}
        fontWeight={title.weight}
        textAnchor="middle"
        textLength={title.length}
        lengthAdjust="spacingAndGlyphs"
      >
        {title.text}
      </text>
      <g
        transform={`translate(${mark.start} ${(-MARK_HEIGHT * markScale) / 2}) scale(${markScale}) translate(-8 -8)`}
      >
        <StripePressMark />
      </g>
    </>
  );
}

function StripePressSpineArt({ spine }: { spine: StripePressSpine }) {
  return (
    <svg
      aria-hidden="true"
      className="book-spine-art"
      preserveAspectRatio="none"
      viewBox={`0 0 ${spine.thickness} ${STRIPE_PRESS_LENGTH}`}
    >
      <g transform={`translate(${spine.thickness / 2} 0) rotate(90)`}>
        {spine.stamped ? (
          <g
            color="#2a1705"
            fill="currentColor"
            opacity={0.4}
            transform="translate(0.6 1.6)"
          >
            <StripePressType spine={spine} />
          </g>
        ) : null}
        <g color={spine.color} fill="currentColor">
          <StripePressType spine={spine} />
        </g>
      </g>
    </svg>
  );
}

// Wiley's second-edition spine, on a 111 by 925 grid.
const INSPIRED_STRIPES = [
  [
    0,
    10,
    "#ffd45e",
  ],
  [
    10,
    4,
    "#f9b233",
  ],
  [
    14,
    12,
    "#ffdb72",
  ],
  [
    26,
    4,
    "#ffe9b0",
  ],
  [
    30,
    11,
    "#fcc440",
  ],
  [
    41,
    6,
    "#f7a826",
  ],
  [
    47,
    12,
    "#ffd45e",
  ],
  [
    59,
    4,
    "#ffe4a0",
  ],
  [
    63,
    11,
    "#fbbb36",
  ],
] as const;

function InspiredSpineArt() {
  const id = useId();
  const bandId = `${id}-band`;
  const stripesId = `${id}-stripes`;

  return (
    <svg
      aria-hidden="true"
      className="book-spine-art book-spine-geometric"
      preserveAspectRatio="none"
      viewBox="0 0 111 925"
    >
      <defs>
        <linearGradient id={bandId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fdb918" />
          <stop offset="1" stopColor="#f9971c" />
        </linearGradient>
        <pattern
          id={stripesId}
          width="74"
          height="140"
          y="-70"
          patternUnits="userSpaceOnUse"
        >
          {INSPIRED_STRIPES.map(([x, width, fill]) => (
            <rect key={x} x={x} width={width} height="140" fill={fill} />
          ))}
        </pattern>
      </defs>
      <rect width="111" height="925" fill="#ffffff" />
      <rect width="111" height="83" fill={`url(#${bandId})`} />
      <g textAnchor="middle">
        <text
          x="55.5"
          y="63"
          fill="#ffffff"
          fontSize="20"
          textLength="73"
          lengthAdjust="spacingAndGlyphs"
        >
          CAGAN
        </text>
        <g fill="#f7b53a" fontSize="20" fontWeight="700">
          <text
            x="55.5"
            y="785"
            textLength="81"
            lengthAdjust="spacingAndGlyphs"
          >
            SECOND
          </text>
          <text
            x="55.5"
            y="807"
            textLength="81"
            lengthAdjust="spacingAndGlyphs"
          >
            EDITION
          </text>
        </g>
        <text
          x="55.5"
          y="884"
          fill="#3a3a3c"
          fontSize="19"
          fontWeight="500"
          textLength="69"
          lengthAdjust="spacingAndGlyphs"
        >
          WILEY
        </text>
      </g>
      <g transform="translate(55.5 0) rotate(90)">
        <text
          x="116"
          y="38"
          fill={`url(#${stripesId})`}
          fontSize="101"
          fontWeight="700"
          textLength="370"
          lengthAdjust="spacingAndGlyphs"
        >
          INSPIRED
        </text>
        <g fill="#5a5a5c" fontSize="25" fontWeight="300">
          <text
            x="509"
            y="-18.7"
            textLength="222"
            lengthAdjust="spacingAndGlyphs"
          >
            HOW TO CREATE
          </text>
          <text
            x="509"
            y="9.2"
            textLength="213"
            lengthAdjust="spacingAndGlyphs"
          >
            <tspan fill="#e8761c">TECH</tspan> PRODUCTS
          </text>
          <text
            x="509"
            y="36.6"
            textLength="233"
            lengthAdjust="spacingAndGlyphs"
          >
            CUSTOMERS{" "}
            <tspan fill="#444446" fontWeight="700">
              LOVE
            </tspan>
          </text>
        </g>
      </g>
    </svg>
  );
}

// The Design of Everyday Things, Basic Books paperback, on a 170 by 1728
// grid measured from the printed spine. The pot is cut from a photograph of
// the spine itself.
function EverydayThingsSpineArt() {
  return (
    <svg
      aria-hidden="true"
      className="book-spine-art"
      preserveAspectRatio="none"
      viewBox="0 0 170 1728"
    >
      <rect width="170" height="1728" fill="#ffe136" />
      <rect y="1553" width="170" height="175" fill="#1b1b1a" />
      <image
        href="/books/the-design-of-everyday-things-pot.webp"
        x="7.6"
        y="1314"
        width="151"
        height="239"
        preserveAspectRatio="none"
      />
      <g
        className="book-spine-humanist"
        fill="#24231f"
        fontSize="31"
        textAnchor="middle"
      >
        <text x="85" y="68" textLength="52" lengthAdjust="spacingAndGlyphs">
          DON
        </text>
        <text x="85" y="111" textLength="102" lengthAdjust="spacingAndGlyphs">
          NORMAN
        </text>
      </g>
      <g
        className="book-spine-serif"
        fill="#e9e7e2"
        fontSize="25"
        textAnchor="middle"
      >
        <text x="85" y="1644" textLength="85" lengthAdjust="spacingAndGlyphs">
          BASIC
        </text>
        <text x="85" y="1675" textLength="92" lengthAdjust="spacingAndGlyphs">
          BOOKS
        </text>
      </g>
      <g fill="#24231f" transform="translate(85 0) rotate(90)">
        <g className="book-spine-serif" fontSize="74" fontStyle="italic">
          <text x="183" y="19" textLength="87" lengthAdjust="spacingAndGlyphs">
            The
          </text>
          <text x="590" y="19" textLength="46" lengthAdjust="spacingAndGlyphs">
            of
          </text>
        </g>
        <g className="book-spine-humanist" fontSize="70">
          <text x="303" y="19" textLength="255" lengthAdjust="spacingAndGlyphs">
            DESIGN
          </text>
          <text x="668" y="19" textLength="365" lengthAdjust="spacingAndGlyphs">
            EVERYDAY
          </text>
          <text
            x="1068"
            y="19"
            textLength="232"
            lengthAdjust="spacingAndGlyphs"
          >
            THINGS
          </text>
        </g>
      </g>
    </svg>
  );
}

// The Staff Engineer's Path, O'Reilly paperback, on a 153 by 1890 grid
// measured from the printed spine. The panel of cover art at the head is cut
// from a photograph of the spine, with the bare paper keyed out.
function StaffEngineersPathSpineArt() {
  return (
    <svg
      aria-hidden="true"
      className="book-spine-art"
      preserveAspectRatio="none"
      viewBox="0 0 153 1890"
    >
      <rect width="153" height="1890" fill="#f2f3f5" />
      <image
        href="/books/the-staff-engineers-path-spine-head.webp"
        width="153"
        height="279"
        preserveAspectRatio="none"
      />
      <g fontWeight="700" transform="translate(76.5 0) rotate(90)">
        <text
          x="320"
          y="20"
          fill="#4f5f86"
          fontSize="58"
          fontWeight="600"
          textLength="658"
          lengthAdjust="spacingAndGlyphs"
        >
          The Staff Engineer’s Path
        </text>
        <text
          x="1395"
          y="16"
          fill="#2b2b2d"
          fontSize="45"
          textLength="112"
          lengthAdjust="spacingAndGlyphs"
        >
          REILLY
        </text>
        <g fill="#d3002d">
          <text
            x="1570"
            y="23"
            fontSize="66"
            textLength="260"
            lengthAdjust="spacingAndGlyphs"
          >
            O’REILLY
          </text>
          <text x="1834" y="-11" fontSize="15" fontWeight="500">
            ®
          </text>
        </g>
      </g>
    </svg>
  );
}

// `unlit` drops the painted-on curve shading: the pulled book lights its
// rounded spine strip by strip instead.
export function BookSpine({ book, unlit }: { book: Book; unlit?: boolean }) {
  const { spine } = book;

  if (spine.design === "stripe-press") {
    return (
      <span
        className="book-spine"
        style={{
          background: spine.background,
        }}
      >
        <span className="book-spine-texture" data-texture={spine.texture} />
        <StripePressSpineArt spine={spine} />
      </span>
    );
  }

  if (spine.design === "image") {
    return (
      <span
        className="book-spine"
        style={{
          background: spine.background,
        }}
      >
        {/* Unoptimized so the shelf and the pulled book share one cached file. */}
        <Image
          alt=""
          className="book-spine-art"
          draggable={false}
          height={spine.height}
          loading="eager"
          src={spine.src}
          unoptimized
          width={spine.width}
        />
        {spine.texture ? (
          <span className="book-spine-texture" data-texture={spine.texture} />
        ) : null}
      </span>
    );
  }

  if (spine.design === "everyday-things") {
    return (
      <span className="book-spine">
        <EverydayThingsSpineArt />
      </span>
    );
  }

  if (spine.design === "staff-engineers-path") {
    return (
      <span className="book-spine">
        <StaffEngineersPathSpineArt />
      </span>
    );
  }

  return (
    <span
      className="book-spine"
      data-round={book.spineRound && !unlit ? "" : undefined}
      style={
        {
          "--round": book.spineRound,
        } as CSSProperties
      }
    >
      <InspiredSpineArt />
    </span>
  );
}
