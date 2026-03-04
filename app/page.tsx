import matter from "gray-matter";
import Image from "next/image";
import Link from "next/link";

import "./globals.css";

export default async function Home() {
  const list = await fetch(
    "https://api.github.com/repos/HiroSpark/articles/contents/articles/",
    {
      cache: "force-cache",
      headers: {
        Authorization: "Bearer " + process.env.GH_TOKEN,
      },
    },
  ).then((res) => res.json());
  const meta = await Promise.all(
    list.map(async (file) => {
      const id = file.name.split(".")[0];
      const markdown = await fetch(file.download_url).then((res) => res.text());
      const { data } = matter(markdown);
      return { id, data };
    }),
  );
  return (
    <div>
      <div className="my-12">
        <p className="mb-4">Webや組版について興味があります。</p>
        <div className="font-semibold flex gap-6">
          <p>
            <a
              href="https://zenn.dev/hirospark"
              target="_blank"
              rel="noopener noreferer"
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
              rel="noopener noreferer"
              className="flex gap-1 flex-row items-center transition delay-100 duration-200 ease-[ease] hover:transform-[translateX(4px)]"
            >
              <Image src="/arrow-right.svg" alt="" height={18} width={18} />
              GitHub
            </a>
          </p>
        </div>
      </div>

      {/* featured articles */}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
        {meta.map(({ id, data }) => {
          const url = "/blog/" + id;
          return (
            <li key={id}>
              <Link
                href={url}
                className="flex flex-row gap-1 justify-between items-start h-full p-4 rounded-xl border-1 border-zinc-400 bg-white font-semibold hover:bg-zinc-50 hover:border-zinc-600"
              >
                <span>{data.title}</span>
                <Image
                  src="/arrow-right-circle.svg"
                  alt=""
                  className=""
                  width={24}
                  height={24}
                />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* the others */}
    </div>
  );
}
