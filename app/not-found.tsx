import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="my-12">
      <div className="grow">
        <p className="mb-4">ページが見つかりませんでした。</p>
        <p>
          <Link
            href="/"
            className="flex gap-1 flex-row items-center transition delay-10 duration-200 ease-[ease] hover:transform-[translateX(4px)] font-semibold"
          >
            <Image src="/arrow-right.svg" alt="" height={18} width={18} />
            トップページへ戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
