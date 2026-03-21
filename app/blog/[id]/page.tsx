import matter from "gray-matter";
import { unified } from "unified";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeShiki from "@shikijs/rehype";

import { RequestError } from "octokit";

import { cache } from "react";

import { notFound } from "next/navigation";
import Image from "next/image";

import octokit from "@/libs/octokit";

import type { Root, Text } from "mdast";

// zenn独自記法に対応するパーサー

import { visit as unistVisit } from "unist-util-visit";

const MESSAGE_START = ":::message\n";
const ALERT_START = ":::message alert\n";

const BLOCK_END = "\n:::";

const removeIdentifier = (child: { value: string }, identifier: string) =>
  child.value.replace(identifier, "");

const isText = (node: unknown): node is Text => (node as Text).type === "text";

const zennBlockParser = () => {
  return (tree: Root) => {
    unistVisit(tree, "paragraph", (node, index, parent) => {
      if (parent === undefined || index === undefined) return;
      const children = node.children;
      if (children.length === 0) return;

      for (const startIdentifier of [MESSAGE_START, ALERT_START]) {
        const firstChild = children[0];
        const lastChild = children[children.length - 1];

        // first/lastChildがText型じゃないときはMESSAGE/ALERTどっちにもならないのでコールバック抜けてOK
        if (!isText(firstChild) || !isText(lastChild)) return;
        if (
          firstChild.value.startsWith(startIdentifier) &&
          lastChild.value.endsWith(BLOCK_END)
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

const mdToHtml = unified()
  .use(remarkParse)
  .use(zennBlockParser)
  .use(remarkGfm)
  .use(remarkRehype)
  // js:main.mjsのようにファイル名を併記されると言語名が認識されなくなるが今は目を瞑る
  .use(rehypeShiki, {
    theme: "github-light",
  })
  .use(rehypeStringify)
  .freeze();

const getPost = cache(async (id: string) => {
  const raw = await octokit
    .request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: "HiroSpark",
      repo: "articles",
      path: `articles/${id}.md`,
    })
    .then((res) => res.data)
    .catch((e) => {
      if (e instanceof RequestError && e.status === 404) notFound(); // 404ページを出す
      throw e; // errorページを出す
    });
  if (Array.isArray(raw) || raw.type !== "file") {
    throw new Error(`レスポンス型が不正`);
  }
  const markdown = Buffer.from(raw.content, "base64").toString();
  const { data, content } = matter(markdown);
  return { data, content };
});

export async function generateStaticParams() {
  const posts = await octokit
    .request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: "HiroSpark",
      repo: "articles",
      path: "articles",
    })
    .then((res) => res.data);

  if (!Array.isArray(posts)) {
    throw new Error("レスポンスが配列ではない");
  }

  return posts.map((post) => {
    const id = post.name.split(".")[0];
    return {
      id,
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await getPost(id);
  return {
    title: data.title,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, content } = await getPost(id);
  const html = await mdToHtml.process(content).then((res) => res.value);

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
