'use client';

import { FaShippingFast } from 'react-icons/fa';
import { BiHeadphone } from 'react-icons/bi';
import { MdOutlineVerifiedUser } from 'react-icons/md';

export default function ServiceBanner() {
  const services = [
    {
      icon: <FaShippingFast className="text-xl text-white" />,
      title: 'FREE AND FAST DELIVERY',
      desc: 'Free delivery for all orders over $140',
    },
    {
      icon: <BiHeadphone className="text-xl text-white" />,
      title: '24/7 CUSTOMER SERVICE',
      desc: 'Friendly 24/7 customer support',
    },
    {
      icon: <MdOutlineVerifiedUser className="text-xl text-white" />,
      title: 'MONEY BACK GUARANTEE',
      desc: 'We return money within 30 days',
    },
  ];

  return (
    <section className="py-10 bg-white">
      <div className="max-w-[1170px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        {services.map((s, idx) => (
          <div key={idx} className="flex flex-col items-center gap-3">
            {/* Outer gray ring/border using a standard Tailwind gray class */}
            <div className="w-16 h-16 rounded-full !border !border-gray-400 flex items-center justify-center"> 
              <div className="w-12 h-12 rounded-full !bg-black flex items-center justify-center shadow-md">
                {s.icon}
              </div>
            </div>
            {/* Title text is black and extra bold */}
            <h4 className="text-sm font-extrabold uppercase text-black">{s.title}</h4>
            <p className="text-xs text-gray-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}