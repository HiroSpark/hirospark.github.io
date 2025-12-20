import Image from "next/image";

interface Article {
  id: number;
  title: string;
  slug: string;
  published_at: string;
  emoji: string;
  path: string;
  user: {
    username: string;
    name: string;
  };
}

export default async function Home() {
  // 一度の取得件数の制限にかからない程の記事数しかないのでループ処理はしてない
  const res = await fetch(
    "https://zenn.dev/api/articles?username=hirospark&order=latest"
  );
  const data = await res.json();
  const articles: Article[] = data.articles;
  return (
    <div className="flex min-h-screen items-center justify-center font-sans bg-zinc-100">
      <main className="max-w-xl min-h-screen w-full mx-6">
        <h1 className="font-bold text-2xl mt-12">HiroSpark</h1>

        <div className="my-12">
          <p className="mb-4">Webや組版について興味があります。</p>
          <div className="font-semibold flex gap-6">
            <p>
              <a
                href="https://zenn.dev/hirospark"
                className="flex gap-1 flex-row content-center transition delay-10 duration-200 ease-[ease] hover:transform-[translateX(4px)]"
              >
                <Image src="/arrow-right.svg" alt="" height={18} width={18} />
                Zenn
              </a>
            </p>
            <p>
              <a
                href="https://github.com/HiroSpark"
                className="flex gap-1 flex-row content-center transition delay-100 duration-200 ease-[ease] hover:transform-[translateX(4px)]"
              >
                <Image src="/arrow-right.svg" alt="" height={18} width={18} />
                GitHub
              </a>
            </p>
          </div>
        </div>

        {/* featured articles */}
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
          {articles.map((article) => {
            const url = "https://zenn.dev" + article.path;
            return (
              <li key={article.id}>
                <a
                  href={url}
                  className="flex flex-row gap-1 justify-between items-start h-full p-4 rounded-xl border-1 border-zinc-400 bg-white font-semibold hover:bg-zinc-50 hover:border-zinc-600"
                >
                  <span>{article.title}</span>
                  <Image
                    src="/arrow-right-circle.svg"
                    alt=""
                    className=""
                    width={24}
                    height={24}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        {/* the others */}
      </main>
    </div>
  );
}
