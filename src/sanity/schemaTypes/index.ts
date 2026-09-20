import { defineField, defineType } from "sanity";
import { callout, figure, linkUrl, postBody } from "./content";

const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "date",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [
        {
          type: "string",
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "body",
      type: "array",
      of: postBody,
    }),
  ],
  orderings: [
    {
      title: "Date, newest",
      name: "dateDesc",
      by: [
        {
          field: "date",
          direction: "desc",
        },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "date",
    },
  },
});

const link = defineType({
  name: "link",
  title: "Link",
  type: "document",
  fields: [
    defineField({
      name: "website",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "type",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    linkUrl,
    defineField({
      name: "description",
      type: "text",
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      type: "number",
      validation: (rule) => rule.required().integer(),
    }),
  ],
  orderings: [
    {
      title: "Order",
      name: "orderAsc",
      by: [
        {
          field: "order",
          direction: "asc",
        },
      ],
    },
  ],
  preview: {
    select: {
      title: "website",
      subtitle: "url",
    },
  },
});

export const schemaTypes = [
  post,
  link,
  callout,
  figure,
];
