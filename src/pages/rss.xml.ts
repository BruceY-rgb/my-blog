import rss from "@astrojs/rss";
import { site } from "../../astro-paper.config";
import { getPostUrl, getPublishedPosts } from "../utils/posts";

export async function GET() {
  const posts = await getPublishedPosts();
  return rss({
    title: site.title,
    description: site.description,
    site: site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: getPostUrl(post),
    })),
  });
}
