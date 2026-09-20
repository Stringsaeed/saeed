import { collection, config, fields, singleton } from "@keystatic/core";
import { block, wrapper } from "@keystatic/core/content-components";
import {
  blogImagePathPattern,
  postDatePattern,
} from "./src/lib/content-patterns";
import { httpsUrlPattern } from "./src/lib/https-url";

// `next dev` writes to the local disk. Production builds use GitHub mode, so
// /keystatic requires a GitHub login and commits as that user. There is no
// unauthenticated admin and no fallback to local storage in production.
const storage =
  process.env.NODE_ENV === "development"
    ? {
        kind: "local" as const,
      }
    : {
        kind: "github" as const,
        repo: {
          owner: "Stringsaeed",
          name: "saeed",
        },
      };

export default config({
  storage,
  ui: {
    brand: {
      name: "Saeed",
    },
    navigation: [
      "posts",
      "links",
    ],
  },
  collections: {
    posts: collection({
      label: "Posts",
      slugField: "title",
      path: "src/content/blog/*",
      format: {
        contentField: "content",
      },
      entryLayout: "content",
      previewUrl: "/blog/{slug}",
      schema: {
        title: fields.slug({
          name: {
            label: "Title",
            validation: {
              isRequired: true,
            },
          },
        }),
        description: fields.text({
          label: "Description",
          multiline: true,
          validation: {
            isRequired: true,
          },
        }),
        date: fields.text({
          label: "Date",
          description: "UTC timestamp, like 2026-09-01T12:00:00.000Z.",
          validation: {
            isRequired: true,
            pattern: {
              regex: postDatePattern,
              message: "Use a UTC timestamp like 2026-09-01T12:00:00.000Z.",
            },
          },
        }),
        tags: fields.array(
          fields.text({
            label: "Tag",
            validation: {
              isRequired: true,
            },
          }),
          {
            label: "Tags",
            itemLabel: (props) => props.value || "Tag",
            validation: {
              length: {
                min: 1,
              },
            },
          },
        ),
        content: fields.mdx({
          label: "Content",
          options: {
            image: {
              directory: "public/images/blog",
              publicPath: "/images/blog/",
            },
          },
          components: {
            Callout: wrapper({
              label: "Callout",
              schema: {
                tone: fields.select({
                  label: "Tone",
                  options: [
                    {
                      label: "Note",
                      value: "note",
                    },
                    {
                      label: "Warning",
                      value: "warning",
                    },
                  ],
                  defaultValue: "note",
                }),
              },
            }),
            Figure: block({
              label: "Figure",
              schema: {
                src: fields.text({
                  label: "Image path",
                  description: "A file under /images/blog.",
                  validation: {
                    isRequired: true,
                    pattern: {
                      regex: blogImagePathPattern,
                      message: "Use a path like /images/blog/photo.png.",
                    },
                  },
                }),
                alt: fields.text({
                  label: "Alt text",
                  validation: {
                    isRequired: true,
                  },
                }),
                caption: fields.text({
                  label: "Caption",
                  multiline: true,
                }),
              },
            }),
          },
        }),
      },
    }),
  },
  singletons: {
    links: singleton({
      label: "Links",
      path: "src/data/links",
      format: {
        data: "json",
      },
      previewUrl: "/links",
      schema: {
        links: fields.array(
          fields.object({
            website: fields.text({
              label: "Website",
              validation: {
                isRequired: true,
              },
            }),
            type: fields.text({
              label: "Type",
              validation: {
                isRequired: true,
              },
            }),
            url: fields.text({
              label: "URL",
              description:
                "https only. javascript:, data:, and vbscript: are rejected.",
              validation: {
                isRequired: true,
                pattern: {
                  regex: httpsUrlPattern,
                  message: "Use an https URL.",
                },
              },
            }),
            description: fields.text({
              label: "Description",
              multiline: true,
              validation: {
                isRequired: true,
              },
            }),
          }),
          {
            label: "Links",
            itemLabel: (props) => props.fields.website.value || "Link",
          },
        ),
      },
    }),
  },
});
