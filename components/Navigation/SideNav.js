import Link from 'next/link';


export default function SideNav() {


  return (
    <>
      {/* Sidebar */}

        <nav className="p-4">
          <ul className='inset-2'>
            <li className="mb-2">
              <Link
                href="/"
                rel="noopener noreferrer"
              >
                <span className="block p-2 text-white bg-clip-border font-semibold backdrop-opacity-70 hover:bg-none bg-gradient-radial to-black from-purple-500 hover:text-white rounded">Yu-Gi-Oh! Card Prices</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/sports/cardSet"
                rel="noopener noreferrer"
              >
                <span className="block p-2 text-white bg-clip-border font-semibold backdrop-opacity-70 hover:bg-none bg-gradient-radial to-black from-purple-600 hover:text-white rounded">Sports Card Prices</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/yugioh/my-collection"
                rel="noopener noreferrer"
              >
                <span className="block p-2 text-white bg-clip-border font-semibold backdrop-opacity-70 hover:bg-none bg-gradient-radial to-black from-purple-500 hover:text-white rounded">My Collection</span>
              </Link>
            </li>
          </ul>
        </nav>

    </>
  );
};