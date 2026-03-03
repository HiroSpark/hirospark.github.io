import matter from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export async function generateStaticParams() {
  const posts = await fetch(
    "https://api.github.com/repos/HiroSpark/articles/contents/articles/",
  ).then((res) => res.json());
  return posts.map((post) => {
    const id = post.name.split(".")[0];
    return {
      id,
    };
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await fetch(
    "https://api.github.com/repos/HiroSpark/articles/contents/articles/" + id,
  ).then((res) => res.json());
  const markdown = Buffer.from(raw.content, "base64").toString();
  const { data, content } = matter(markdown);
  const html = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(content)
    .then((res) => res.value);

  return (
    <main>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
