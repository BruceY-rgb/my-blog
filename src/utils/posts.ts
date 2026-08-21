import { getCollection, type CollectionEntry } from "astro:content";
import { withBase } from "./site";

export type PostData = {
  title: string;
  date: Date;
  description: string;
  categories: string[];
  tags: string[];
  cover?: string;
  authors?: string;
  venue?: string;
  published: boolean;
  legacyPath: string;
  sourcePath: string;
};

export type Post = Omit<CollectionEntry<"posts">, "data"> & { data: PostData };

export async function getPublishedPosts(): Promise<Post[]> {
  const entries = (await getCollection("posts")) as unknown as Post[];
  return entries
    .filter((post) => post.data.published)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function getPostUrl(post: Post) {
  return withBase(`${post.data.legacyPath}/`);
}

export function getTerms(posts: Post[], field: "tags" | "categories") {
  return [...new Set(posts.flatMap((post) => post.data[field]))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}
