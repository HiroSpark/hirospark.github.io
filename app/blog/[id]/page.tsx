import matter from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import rehypeShiki from "@shikijs/rehype";

// zenn独自記法に対応するパーサー（昔書いたもののコピー）

import { visit as unistVisit } from "unist-util-visit";

const MESSAGE_START = ":::message\n";
const ALERT_START = ":::message alert\n";

const BLOCK_END = "\n:::";

const removeIdentifer = (child, identifer) =>
  child.value.replace(identifer, "");

const zennBlockParser = () => {
  return (tree) => {
    unistVisit(tree, "paragraph", (node, index, parent) => {
      for (const startIdentifer of [MESSAGE_START, ALERT_START]) {
        const children = node.children;
        const firstChild = children[0];
        const lastChild = children[children.length - 1];
        if (
          firstChild.value?.startsWith(startIdentifer) &&
          lastChild.value?.endsWith(BLOCK_END)
        ) {
          firstChild.value = removeIdentifer(firstChild, startIdentifer);
          lastChild.value = removeIdentifer(lastChild, BLOCK_END);
          parent.children[index] = {
            type: "blockquote",
            children: [{ type: "paragraph", children }],
          };
        }
      }
    });
  };
};

export async function generateStaticParams() {
  const posts = await fetch(
    "https://api.github.com/repos/HiroSpark/articles/contents/articles/",
    {
      cache: "force-cache",
      headers: {
        Authorization: "Bearer " + process.env.GH_TOKEN,
      },
    },
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
    "https://api.github.com/repos/HiroSpark/articles/contents/articles/" +
      id +
      ".md",
  ).then((res) => res.json());
  const markdown = Buffer.from(raw.content, "base64").toString();
  const { data, content } = matter(markdown);
  const html = await unified()
    .use(remarkParse)
    .use(zennBlockParser)
    .use(remarkGfm)
    .use(remarkRehype)
    // js:main.mjsのようにファイル名を併記されると言語名が認識されなくなるが今は目を瞑る
    .use(rehypeShiki, {
      theme: "github-light",
    })
    .use(rehypeStringify)
    .process(content)
    .then((res) => res.value);

  return (
    <div>
      <h1 className="text-2xl font-bold">{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
