import { defineArrayMember, defineField, defineType } from "sanity";
import { isContentHref, isHttpsUrl } from "@/lib/https-url";

const linkAnnotation = {
  name: "link",
  type: "object",
  title: "Link",
  fields: [
    defineField({
      name: "href",
      type: "string",
      validation: (rule) =>
        rule.required().custom((value) => {
          if (typeof value === "string" && isContentHref(value)) return true;
          return "Use an https URL or a path on this site. javascript:, data:, and vbscript: are rejected.";
        }),
    }),
  ],
};

export const blockContent = defineArrayMember({
  type: "block",
  styles: [
    {
      title: "Normal",
      value: "normal",
    },
    {
      title: "H2",
      value: "h2",
    },
    {
      title: "H3",
      value: "h3",
    },
    {
      title: "Quote",
      value: "blockquote",
    },
  ],
  marks: {
    decorators: [
      {
        title: "Strong",
        value: "strong",
      },
      {
        title: "Emphasis",
        value: "em",
      },
      {
        title: "Code",
        value: "code",
      },
    ],
    annotations: [
      linkAnnotation,
    ],
  },
});

const codeBlock = defineArrayMember({
  type: "code",
});

export const callout = defineType({
  name: "callout",
  title: "Callout",
  type: "object",
  fields: [
    defineField({
      name: "tone",
      type: "string",
      options: {
        list: [
          {
            title: "Note",
            value: "note",
          },
          {
            title: "Warning",
            value: "warning",
          },
        ],
        layout: "radio",
      },
      initialValue: "note",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      type: "array",
      of: [
        blockContent,
        codeBlock,
      ],
      validation: (rule) => rule.required(),
    }),
  ],
});

export const figure = defineType({
  name: "figure",
  title: "Figure",
  type: "object",
  fields: [
    defineField({
      name: "image",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "alt",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "caption",
      type: "text",
      rows: 2,
    }),
  ],
});

export const postBody = [
  blockContent,
  codeBlock,
  defineArrayMember({
    type: "callout",
  }),
  defineArrayMember({
    type: "figure",
  }),
];

export const linkUrl = defineField({
  name: "url",
  title: "URL",
  type: "url",
  description: "https only. javascript:, data:, and vbscript: are rejected.",
  validation: (rule) =>
    rule
      .required()
      .uri({
        scheme: [
          "https",
        ],
        allowRelative: false,
      })
      .custom((value) => {
        if (typeof value === "string" && isHttpsUrl(value)) return true;
        return "Use an https URL. javascript:, data:, and vbscript: are rejected.";
      }),
});
