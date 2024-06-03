import {Html, Head, Main, NextScript} from "next/document"
import Link from 'next/link'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="mx-auto min-h-full">
        <div>
          <div className="md:block md:fixed left-0 top-0 h-full bg-black p-4 sidebar-menu transition-transform">
            <a className="flex items-center pb-4 border-b border-b-gray-800" href="#">
              <h2 className="font-bold text-2xl">
                LOREM{" "}
                <span className="bg-[#f84525] text-white px-2 rounded-md">IPSUM</span>
              </h2>
            </a>
            <ul className="mt-4">
              <span className="text-gray-400 font-bold">WELCOME</span>
              <li className="mb-1 group">
                <Link
                  className="inline-flex flex-wrap flex-row font-semibold items-center py-2 px-4 text-white hover:bg-gray-950 hover:text-gray-100 rounded-md group-[.active]:bg-gray-800 group-[.active]:text-white group-[.selected]:bg-gray-950 group-[.selected]:text-gray-100"
                  href="/"
                >
                  <i className="ri-home-2-line mr-3 text-lg" />
                  <span className="text-sm">Yu-Gi-Oh! Prices</span>
                </Link>
              </li>
              <li className="mb-1 group">
                <Link
                  className="inline-flex flex-wrap flex-row font-semibold items-center py-2 px-4 text-white hover:bg-gray-950 hover:text-gray-100 rounded-md group-[.active]:bg-gray-800 group-[.active]:text-white group-[.selected]:bg-gray-950 group-[.selected]:text-gray-100 sidebar-dropdown-toggle"
                  href="/MyCollectionPage"
                >
                  <i className="bx bx-user mr-3 text-lg" />
                  <span className="text-sm">My Collection</span>
                </Link>
              </li>
              <li className="mb-1 group">
                <Link
                  className="inline-flex flex-wrap flex-row font-semibold items-center py-2 px-4 text-white hover:bg-gray-950 hover:text-gray-100 rounded-md group-[.active]:bg-gray-800 group-[.active]:text-white group-[.selected]:bg-gray-950 group-[.selected]:text-gray-100"
                  href="/SportsPage"
                >
                  <i className="bx bx-list-ul mr-3 text-lg" />
                  <span className="text-sm">Sports Card Prices</span>
                </Link>
              </li>
            </ul>
          </div>
          <div className="w-full mx-auto md:w-[calc(100%-256px)] md:ml-64 min-h-screen transition-all main">
            <Main />
          </div>
          <NextScript />
        </div>
      </body>
    </Html>
  )
}
