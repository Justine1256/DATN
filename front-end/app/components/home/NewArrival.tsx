"use client";

import Image from "next/image";
import Link from "next/link";

// const newArrivals = [
//   {
//     title: "PlayStation 5",
//     desc: "Black and White version of the PS5 coming out on sale.",
//     image: "/ps5.png",
//     href: "/category/playstation",
//     colSpan: "col-span-6 aspect-[550/600]",
//   },
//   {
//     title: "Women’s Collections",
//     desc: "Featured woman collections that give you another vibe.",
//     image: "/phuba.png",
//     href: "/category/women",
//     colSpan: "col-span-6 aspect-[570/284]",
//   },
//   {
//     title: "Speakers",
//     desc: "Amazon wireless speakers",
//     image: "/hang.png",
//     href: "/category/speakers",
//     colSpan: "col-span-3 aspect-[270/284]",
//   },
//   {
//     title: "Perfume",
//     desc: "GUCCI INTENSE OUD EDP",
//     image: "/per.webp",
//     href: "/category/perfume",
//     colSpan: "col-span-3 aspect-[270/284]",
//   },
// ];

export default function NewArrival() {
  return (
    <section className="max-w-[1160px] mx-auto px-4 py-10">
      {/* Short horizontal line at the very top */}
      <div className="w-full h-[1px] bg-gray-300 mb-6" />

      {/* Header (Red bar, "This Week", "New Arrival") */}
      <div className="mb-6">
        {/* Short red bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-[10px] h-[22px] bg-[#dc4b47] rounded-tl-sm rounded-bl-sm" />
          <p className="text-red-500 font-semibold text-sm translate-y-[1px]">Featured</p>
        </div>
        <h2 className="text-3xl font-bold text-black mt-4">New Arrival</h2>
        {/* The short gray line below the title has been removed from here */}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: PlayStation */}
        <Link href="/category/playstation" className="col-span-6 relative overflow-hidden rounded-lg group aspect-[550/600] bg-black">
          <Image
            src="/ps5.png"
            alt="PlayStation 5"
            fill
            className="object-cover transition duration-500 brightness-75 group-hover:brightness-100"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition duration-300 z-10" />
          <div className="absolute bottom-4 left-4 z-20 text-white">
            <h3 className="text-lg font-semibold mb-1">PlayStation 5</h3>
            <p className="text-xs mb-2 max-w-[80%]">Black and White version of the PS5 coming out on sale.</p>
            <span className="underline text-sm font-medium hover:text-[#dc4b47] transition">Shop Now</span>
          </div>
        </Link>

        {/* Right grid */}
        <div className="col-span-6 grid grid-cols-2 grid-rows-2 gap-4">
          {/* Top right: Women’s Collections */}
          <Link href="/category/women" className="col-span-2 relative overflow-hidden rounded-lg group aspect-[570/284] bg-black">
            <Image
              src="/phuba.png"
              alt="Women’s Collections"
              fill
              className="object-cover transition duration-500 brightness-75 group-hover:brightness-100"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition duration-300 z-10" />
            <div className="absolute bottom-4 left-4 z-20 text-white">
              <h3 className="text-lg font-semibold mb-1">Women’s Collections</h3>
              <p className="text-xs mb-2 max-w-[80%]">Featured woman collections that give you another vibe.</p>
              <span className="underline text-sm font-medium hover:text-[#dc4b47] transition">Shop Now</span>
            </div>
          </Link>

          {/* Bottom right: Speakers */}
          <Link href="/category/speakers" className="relative overflow-hidden rounded-lg group aspect-[270/284] bg-black">
            <Image
              src="/hang.png"
              alt="Speakers"
              fill
              className="object-cover transition duration-500 brightness-75 group-hover:brightness-100"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition duration-300 z-10" />
            <div className="absolute bottom-4 left-4 z-20 text-white">
              <h3 className="text-lg font-semibold mb-1">Speakers</h3>
              <p className="text-xs mb-2 max-w-[80%]">Amazon wireless speakers</p>
              <span className="underline text-sm font-medium hover:text-[#dc4b47] transition">Shop Now</span>
            </div>
          </Link>

          {/* Bottom right: Perfume */}
          <Link href="/category/perfume" className="relative overflow-hidden rounded-lg group aspect-[270/284] bg-black">
            <Image
              src="/per.webp"
              alt="Perfume"
              fill
              className="object-cover transition duration-500 brightness-75 group-hover:brightness-100"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition duration-300 z-10" />
            <div className="absolute bottom-4 left-4 z-20 text-white">
              <h3 className="text-lg font-semibold mb-1">Perfume</h3>
              <p className="text-xs mb-2 max-w-[80%]">GUCCI INTENSE OUD EDP</p>
              <span className="underline text-sm font-medium hover:text-[#dc4b47] transition">Shop Now</span>
            </div>
          </Link>
        </div>
      </div>
      {/* Short horizontal line at the very bottom of the section */}
      <div className="w-full h-[1px] bg-gray-300 mt-10" />
    </section>
  );
}