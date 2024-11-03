import Link from 'next/link';


export default function SideNav() {


  return (
    <>
      {/* Sidebar */}

        <nav className="p-4">
          <ul>
            <li className="mb-2">
              <Link
                href="/"
                rel="noopener noreferrer"
              >
                <span className="block p-2 text-gray-700 hover:bg-blue-200 rounded">Yu-Gi-Oh! Card Prices</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/sports/cardSet"
                rel="noopener noreferrer"
              >
                <span className="block p-2 text-gray-700 hover:bg-blue-200 rounded">Sports Card Prices</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/yugioh/my-collection"
                rel="noopener noreferrer"
              >
                <span className="block p-2 text-gray-700 hover:bg-blue-200 rounded">My Collection</span>
              </Link>
            </li>
          </ul>
        </nav>

    </>
  );
};