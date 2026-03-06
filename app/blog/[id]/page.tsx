import matter from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import rehypeShiki from "@shikijs/rehype";
import Image from "next/image";

import octokit from "@/libs/octokit";

// zenn独自記法に対応するパーサー（昔書いたもののコピー）

import { visit as unistVisit } from "unist-util-visit";

const MESSAGE_START = ":::message\n";
const ALERT_START = ":::message alert\n";

const BLOCK_END = "\n:::";

const removeIdentifier = (child, identifier) =>
  child.value.replace(identifier, "");

const zennBlockParser = () => {
  return (tree) => {
    unistVisit(tree, "paragraph", (node, index, parent) => {
      for (const startIdentifier of [MESSAGE_START, ALERT_START]) {
        const children = node.children;
        const firstChild = children[0];
        const lastChild = children[children.length - 1];
        if (
          firstChild.value?.startsWith(startIdentifier) &&
          lastChild.value?.endsWith(BLOCK_END)
        ) {
          firstChild.value = removeIdentifier(firstChild, startIdentifier);
          lastChild.value = removeIdentifier(lastChild, BLOCK_END);
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
  const posts = await octokit
    .request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: "HiroSpark",
      repo: "articles",
      path: "articles",
    })
    .then((res) => res.data);

  if (!Array.isArray(posts)) {
    throw new Error("Expected list of files from GitHub API");
  }

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
  const raw = await octokit
    .request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: "HiroSpark",
      repo: "articles",
      path: "articles/" + id + ".md",
    })
    .then((res) => res.data);
  if (!("content" in raw)) {
    throw new Error("GitHub APIのリクエストに失敗");
  }
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
      <h1 className="text-2xl font-bold mb-6">{data.title}</h1>
      <article dangerouslySetInnerHTML={{ __html: html }} className="content" />
      <footer className="my-8">
        <div className="font-semibold flex gap-6">
          <p>
            <a
              href="https://zenn.dev/hirospark"
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-1 flex-row items-center transition delay-10 duration-200 ease-[ease] hover:transform-[translateX(4px)]"
            >
              <Image src="/arrow-right.svg" alt="" height={18} width={18} />
              Zenn
            </a>
          </p>
          <p>
            <a
              href="https://github.com/HiroSpark"
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-1 flex-row items-center transition delay-100 duration-200 ease-[ease] hover:transform-[translateX(4px)]"
            >
              <Image src="/arrow-right.svg" alt="" height={18} width={18} />
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
