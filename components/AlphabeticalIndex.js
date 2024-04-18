// @/components/AlphabeticalIndex.js
import Link from 'next/link';

const AlphabeticalIndex=() => {
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <div className="mx-auto w-full my-10">
      <h1 className="text-xl font-semibold mb-4">Alphabetical Index</h1>
      <div className="flex flex-wrap gap-2 place-content-center md:text-nowrap">
        {alphabet.split('').map((letter) => (
          <Link href={`/sets/${letter}`} key={letter}>
            <div className="mx-auto p-2 text-3xl font-medium no-underline hover:underline hover:font-bold">{letter}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AlphabeticalIndex;
