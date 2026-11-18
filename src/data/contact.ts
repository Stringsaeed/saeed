// How to reach me, as the terminal version of the site lists it: its
// remotes pane and the shell's contact script read this. The regular site's
// header keeps its own list, with an icon for each.
export type Contact = {
  label: string;
  href: string;
  /** What the link says when it is written out. */
  value: string;
};

export const CONTACT: readonly Contact[] = [
  {
    label: "Email",
    href: "mailto:stringsaeed@gmail.com",
    value: "stringsaeed@gmail.com",
  },
  {
    label: "Phone",
    href: "tel:+18578678243",
    value: "+1 857 867 8243",
  },
  {
    label: "GitHub",
    href: "https://github.com/stringsaeed",
    value: "github.com/stringsaeed",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/stringsaeed",
    value: "linkedin.com/in/stringsaeed",
  },
  {
    label: "X",
    href: "https://x.com/stringsaeed",
    value: "x.com/stringsaeed",
  },
  {
    label: "Bluesky",
    href: "https://bsky.app/profile/saeed.guru",
    value: "saeed.guru",
  },
  {
    label: "Letterboxd",
    href: "https://letterboxd.com/stringsaeed/",
    value: "letterboxd.com/stringsaeed",
  },
];
