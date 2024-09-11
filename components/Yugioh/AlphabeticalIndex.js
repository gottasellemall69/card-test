// @/components/AlphabeticalIndex.js
import Link from 'next/link';

const AlphabeticalIndex = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <>
      <div className="mx-auto w-full my-10 m-2">
        <h1 className="text-xl font-semibold mb-4">Alphabetical Index</h1>
        <div className="flex flex-wrap gap-2 place-content-center md:text-nowrap">
          {alphabet.split('').map((letter) => (
            <Link href={`/yugioh/sets/${ letter }`} key={letter}>
              <div className="mx-auto p-2 leading-7 text-3xl font-bold no-underline hover:underline hover:bg-stone-600">{letter}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default AlphabeticalIndex;
