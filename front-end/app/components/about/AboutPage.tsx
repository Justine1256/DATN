'use client';

import Image from 'next/image';
import {
  FaStore,
  FaDollarSign,
  FaUsers,
  FaMoneyBillWave,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaTruck,
  FaHeadset,
  FaShieldAlt,
} from 'react-icons/fa';
import CountUp from 'react-countup';
import { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const teamMembers = [
  {
    name: 'Tom Cruise',
    role: 'Founder & Chairman',
    image: '/team/man1.jpg',
    socials: ['twitter', 'instagram', 'linkedin'],
  },
  {
    name: 'Emma Watson',
    role: 'Managing Director',
    image: '/team/woman1.webp',
    socials: ['twitter', 'instagram', 'linkedin'],
  },
  {
    name: 'Will Smith',
    role: 'Product Designer',
    image: '/team/man3.jpg',
    socials: ['twitter', 'instagram', 'linkedin'],
  },
  {
    name: 'Scarlett Johansson',
    role: 'Marketing Lead',
    image: '/team/woman2.webp',
    socials: ['twitter', 'instagram', 'linkedin'],
  },
  {
    name: 'Chris Hemsworth',
    role: 'Lead Developer',
    image: '/team/man2.jpg',
    socials: ['twitter', 'instagram', 'linkedin'],
  },
  {
    name: 'Gal Gadot',
    role: 'UI/UX Designer',
    image: '/team/woman3.avif',
    socials: ['twitter', 'instagram', 'linkedin'],
  },
  {
    name: 'Ryan Reynolds',
    role: 'Brand Strategist',
    image: '/team/man4.jpg',
    socials: ['twitter', 'instagram', 'linkedin'],
  },
  {
    name: 'Zendaya',
    role: 'Creative Director',
    image: '/team/man5.jpg',
    socials: ['twitter', 'instagram', 'linkedin'],
  },
  {
    name: 'Dwayne Johnson',
    role: 'Operations Manager',
    image: '/team/man6.webp',
    socials: ['twitter', 'instagram', 'linkedin'],
  },
];

const features = [
  {
    title: 'FREE AND FAST DELIVERY',
    desc: 'Free delivery for all orders over $140',
    icon: FaTruck,
  },
  {
    title: '24/7 CUSTOMER SERVICE',
    desc: 'Friendly 24/7 customer support',
    icon: FaHeadset,
  },
  {
    title: 'MONEY BACK GUARANTEE',
    desc: 'We return money within 30 days',
    icon: FaShieldAlt,
  },
];

const stats = [
  { number: 10.5, suffix: 'k', label: 'Sellers active our site', icon: FaStore },
  { number: 33, suffix: 'k', label: 'Monthly Product Sale', icon: FaDollarSign },
  { number: 45.5, suffix: 'k', label: 'Customer active in our site', icon: FaUsers },
  { number: 25, suffix: 'k', label: 'Annual gross sale in our site', icon: FaMoneyBillWave },
];

export default function AboutPage() {
  const itemsPerPage = 3;
  const totalPages = Math.ceil(teamMembers.length / itemsPerPage);
  const [currentTeamPage, setCurrentTeamPage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTeamPage((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalPages]);

  return (
    <div className={`container mx-auto px-4 ${inter.className}`}>
      <div className="py-12 text-black">
        {/* Our Story */}
        <div className="flex flex-col md:flex-row gap-12 items-stretch mb-24">
          <div className="flex-1 flex flex-col justify-between max-w-[600px]">
            <div>
              <h2 className="text-4xl font-bold mb-6">Our Story</h2>
              <p className="mb-4 text-[14px] text-black">
                Launced in 2015, Exclusive is South Asia&apos;s premier online shopping marketplace with an active presence in Bangladesh. Supported by a wide range of tailored marketing, data and service solutions, Exclusive has 10,500 sellers and 300 brands and serves 3 million customers across the region.
              </p>
              <p className="text-[14px] text-black">
                Exclusive has more than 1 million products to offer, growing very fast. Exclusive offers a diverse assortment in categories ranging from consumer.
              </p>
            </div>
          </div>
          <div className="flex-1 flex items-stretch">
            <Image
              src="/about1.avif"
              alt="Our Story"
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto object-cover rounded-lg"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className="group w-full aspect-square flex flex-col items-center justify-center bg-white text-black hover:bg-[#db4444] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-md"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-black group-hover:bg-white border-4 border-gray-300 group-hover:border-white flex items-center justify-center transition-all duration-300">
                  <item.icon className="text-xl text-white group-hover:text-black transition-all duration-300" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-2 text-black">
                <CountUp end={item.number} decimals={item.number % 1 !== 0 ? 1 : 0} duration={2} />
                {item.suffix}
              </p>
              <p className="text-[13px] text-black group-hover:text-white transition-all duration-300">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Our Team */}
        <div className="overflow-hidden relative mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentTeamPage * (100 / totalPages)}%)`,
              width: `${totalPages * 100}%`,
            }}
          >
            {Array.from({ length: totalPages }).map((_, pageIndex) => {
              const start = pageIndex * itemsPerPage;
              const pageTeam = teamMembers.slice(start, start + itemsPerPage);
              return (
                <div
                  key={pageIndex}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 flex-shrink-0 px-4"
                  style={{ width: `${100 / totalPages}%` }}
                >
                  {pageTeam.map((member, index) => (
                    <div key={index} className="text-center">
                      <div className="w-full h-80 relative mb-4">
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-[14px] text-black">{member.name}</h3>
                      <p className="text-[13px] text-black">{member.role}</p>
                      <div className="flex justify-center space-x-4 mt-2 text-gray-600 text-lg">
                        {member.socials.includes('twitter') && (
                          <a href="#" aria-label="Twitter">
                            <FaTwitter className="hover:text-blue-400" />
                          </a>
                        )}
                        {member.socials.includes('instagram') && (
                          <a href="#" aria-label="Instagram">
                            <FaInstagram className="hover:text-pink-500" />
                          </a>
                        )}
                        {member.socials.includes('linkedin') && (
                          <a href="#" aria-label="LinkedIn">
                            <FaLinkedin className="hover:text-blue-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center space-x-2 mt-6">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentTeamPage(i)}
                className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                  currentTeamPage === i ? 'bg-red-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {features.map((feature, index) => (
            <div key={index}>
              <div className="w-16 h-16 mx-auto mb-4 bg-black border-4 border-gray-300 rounded-full flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-1 text-[14px] text-black">{feature.title}</h4>
              <p className="text-[13px] text-black">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
