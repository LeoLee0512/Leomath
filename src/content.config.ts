import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

/** Concept articles: content/concepts/<slug>/<locale>.mdx, entry ids "<slug>/<locale>". */
const concepts = defineCollection({
  loader: glob({ base: "./content/concepts", pattern: "*/{zh,en}.mdx" }),
});

export const collections = { concepts };
