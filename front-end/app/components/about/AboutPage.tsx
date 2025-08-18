'use client';

import Image from 'next/image';
import {
  FaStore, FaDollarSign, FaUsers, FaMoneyBillWave,
  FaTruck, FaHeadset, FaShieldAlt
} from 'react-icons/fa';
import CountUp from 'react-countup';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

type Stack = 'Backend' | 'Frontend' | 'Fullstack' | 'Mobile' | 'Data' | 'Design' | 'PM' | 'Figma' | 'Ui/Ux' | 'Tester';
interface TeamMember {
  name: string;
  role: string;
  stacks: Stack[];
  mssv: string;
  image: string;
}

const teamMembers: TeamMember[] = [
  { name: 'Nguyễn Văn Nhật', role: 'Trưởng nhóm', stacks: ['Frontend', 'Design'], mssv: 'Ps38490', image: '/team/vn.jpg' },
  { name: 'Ngô Duy Nhân', role: 'Thành Viên', stacks: ['Backend', 'Frontend'], mssv: 'PS42395', image: '/team/dn.jpg' },
  { name: 'Trương Hiền Bảo', role: 'Thành Viên', stacks: ['Backend', 'Frontend'], mssv: '20125678', image: '/team/hb.png' },
  { name: 'Huỳnh Phạm Thùy Anh', role: 'Thành Viên', stacks: ['Figma', 'Frontend'], mssv: 'PS42206', image: '/team/ta.jpg' },
  { name: 'Nguyễn Trần Thanh Tú', role: 'Thành Viên', stacks: ['Tester'], mssv: 'PS37977', image: '/team/tt.jpg' },
];

const features = [
  { title: 'GIAO HÀNG NHANH VÀ MIỄN PHÍ', desc: 'Miễn phí giao hàng cho đơn hàng trên 140$', icon: FaTruck },
  { title: 'HỖ TRỢ KHÁCH HÀNG 24/7', desc: 'Hỗ trợ thân thiện 24/7', icon: FaHeadset },
  { title: 'ĐẢM BẢO HOÀN TIỀN', desc: 'Hoàn tiền trong vòng 30 ngày', icon: FaShieldAlt },
];

const stats = [
  { number: 10.5, suffix: 'k', label: 'Người bán đang hoạt động', icon: FaStore },
  { number: 33, suffix: 'k', label: 'Sản phẩm được bán hàng tháng', icon: FaDollarSign },
  { number: 45.5, suffix: 'k', label: 'Khách hàng đang sử dụng', icon: FaUsers },
  { number: 25, suffix: 'k', label: 'Doanh thu hàng năm', icon: FaMoneyBillWave },
];

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ==== Carousel state ====
  const perSlide = 3;                     // 3 card/slide
  const slides = useMemo(() => {
    const chunks: TeamMember[][] = [];
    for (let i = 0; i < teamMembers.length; i += perSlide) {
      chunks.push(teamMembers.slice(i, i + perSlide));
    }
    return chunks;
  }, []);
  const totalSlides = slides.length;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const next = () => setCurrent((c) => (c + 1) % totalSlides);
  const prev = () => setCurrent((c) => (c - 1 + totalSlides) % totalSlides);

  useEffect(() => {
    if (paused || totalSlides <= 1) return; // thêm điều kiện
    autoplayRef.current = setInterval(next, 2000);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [paused, totalSlides]);


  return (
    <div className={`container mx-auto px-4 ${inter.className}`}>
      <div className="py-12 text-black">
        {/* Câu chuyện của chúng tôi */}
        <div className="flex flex-col md:flex-row gap-12 items-stretch mb-24">
          <div className="flex-1 flex flex-col justify-between max-w-[600px]">
            <div>
              <h2 className="text-4xl font-bold mb-6">Câu chuyện của chúng tôi</h2>
              <p className="mb-4 text-[14px] text-black">
                Ra mắt vào năm 2015, Marketo là nền tảng mua sắm trực tuyến hàng đầu tại Nam Á...
              </p>
              <p className="text-[14px] text-black">
                Marketo cung cấp hơn 1 triệu sản phẩm và đang phát triển nhanh chóng...
              </p>
            </div>
          </div>
          <div className="flex-1 flex items-stretch">
            <Image
              src="/about1.avif"
              alt="Câu chuyện của chúng tôi"
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto object-cover rounded-lg"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Thống kê */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className="group w-full aspect-square flex flex-col items-center justify-center bg-white text-black border border-black hover:bg-[#db4444] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-md"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-black group-hover:bg-white border-4 border-gray-300 group-hover:border-white flex items-center justify-center transition-all duration-300">
                  <item.icon className="text-xl text-white group-hover:text-black transition-all duration-300" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-2 text-black group-hover:text-white transition-all duration-300">
                {mounted ? (
                  <>
                    <CountUp end={item.number} decimals={item.number % 1 !== 0 ? 1 : 0} duration={2} />
                    {item.suffix}
                  </>
                ) : (
                  `${item.number}${item.suffix}`
                )}
              </p>
              <p className="text-[13px] px-2 text-center break-words text-black group-hover:text-white transition-all duration-300">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Đội ngũ của chúng tôi - Slider 3 ảnh/slide */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Đội ngũ của chúng tôi</h2>

          {/* Uniform card width */}
          <style jsx>{`
            .member-card { width: 260px; }
            @media (max-width: 640px) { .member-card { width: 100%; } }
          `}</style>

          <div
            className="relative overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Track */}
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                width: `${totalSlides * 100}%`,
                transform: `translateX(-${(100 / totalSlides) * current}%)`,
              }}
            >
              {slides.map((slide, sIdx) => (
                <div
                  key={sIdx}
                  className="flex justify-center gap-8 px-2 flex-shrink-0"
                  style={{ width: `${100 / totalSlides}%` }}
                >
                  {slide.map((member, idx) => (
                    <div key={idx} className="text-center member-card">
                      <div className="relative w-full aspect-[4/5] mb-4 rounded-md overflow-hidden bg-gray-100">
                        <Image src={member.image} alt={member.name} fill className="object-cover" />
                      </div>
                      <h3 className="text-lg font-semibold text-black">{member.name}</h3>
                      <p className="text-sm text-gray-700">{member.role}</p>
                      <div className="mt-2 text-sm">
                        <p className="text-gray-600">
                          <span className="font-semibold text-black">MSSV:</span> {member.mssv}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-semibold text-black">Phụ trách:</span> {member.stacks.join(' · ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Controls */}
            

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${current === i ? 'bg-red-500' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tại sao chọn chúng tôi */}
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
