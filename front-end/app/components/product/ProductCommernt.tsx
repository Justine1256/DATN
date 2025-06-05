'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import axios from 'axios';
import Cookies from 'js-cookie';
import { FiSend } from 'react-icons/fi';

interface Comment {
  id: number;
  user: { name: string };
  content: string;
  image?: string;
  created_at: string;
}

export default function ProductComments({
  shopslug,
  productslug,
}: {
  shopslug: string;
  productslug: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const token = Cookies.get('authToken');

  useEffect(() => {
    if (token) {
      axios
        .get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => Cookies.remove('authToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchComments = () => {
    axios
      .get(`http://localhost:8000/api/${shopslug}/product/${productslug}/comment?page=${page}`)
      .then((res) => {
        setComments(res.data.data);
        setTotalPages(res.data.total_pages || 1);
      });
  };

  useEffect(() => {
    fetchComments();
  }, [page]);

  const handleSubmit = async () => {
    if (!content.trim()) return alert('Vui lòng nhập nội dung');

    const formData = new FormData();
    formData.append('content', content);
    if (image) formData.append('image', image);

    await axios.post(
      `http://localhost:8000/api/${shopslug}/product/${productslug}/comment`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    setContent('');
    setImage(null);
    setPreview(null);
    fetchComments();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  if (loading) return <p className="text-gray-500">Đang tải đánh giá...</p>;

  return (
    <div className="mt-10 border-t pt-8">
      <h2 className="text-xl font-semibold mb-4 text-[#DC4B47]">Đánh giá sản phẩm</h2>

      {user ? (
        <div className="mb-6 space-y-3">
          {/* ✅ Ô nhập và nút gửi nằm cùng 1 vùng */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Nhập đánh giá..."
              spellCheck={false}
              className="w-full border border-gray-300 rounded p-3 pr-10 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#DC4B47]"
            />
            {/* ✅ Nút gửi: chỉ icon, không nền đỏ, không border */}
            <button
              onClick={handleSubmit}
              className="absolute bottom-3 right-3 text-[#DC4B47] hover:text-[#a82f2c]"
              title="Gửi đánh giá"
            >
              <FiSend size={18} />
            </button>
          </div>

          {/* ✅ Upload ảnh và preview */}
          <div className="flex flex-col items-start space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm"
            />
            {preview && (
              <Image
                src={preview}
                alt="Preview"
                width={120}
                height={120}
                className="rounded border"
              />
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 italic mb-4">*Bạn cần đăng nhập để đánh giá.</p>
      )}

      {/* ✅ Danh sách đánh giá */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="border rounded p-4 shadow-sm cursor-pointer"
            onClick={() => setTimeout(() => textareaRef.current?.focus(), 100)}
          >
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-700 font-semibold">
              🧑 {comment.user.name}
              <span className="ml-auto text-gray-400 text-xs font-normal">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-800 mb-2 text-sm">{comment.content}</p>

            {comment.image && (
              <Image
                src={comment.image}
                alt="Comment Image"
                width={120}
                height={120}
                className="rounded"
              />
            )}
          </div>
        ))}
      </div>

      {/* ✅ Phân trang */}
      <div className="mt-6 flex justify-center items-center gap-2 font-semibold text-sm">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className={`px-3 py-1 rounded border ${
            page === 1
              ? 'text-black font-bold border-gray-400'
              : 'border-gray-300 hover:border-[#DC4B47] hover:text-[#DC4B47]'
          }`}
        >
          Trước
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1 rounded border transition ${
              p === page
                ? 'border-black text-black font-bold'
                : 'border-gray-300 text-gray-700 hover:border-[#DC4B47] hover:text-[#DC4B47]'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className={`px-3 py-1 rounded border ${
            page === totalPages
              ? 'text-black font-bold border-gray-400'
              : 'border-gray-300 hover:border-[#DC4B47] hover:text-[#DC4B47]'
          }`}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
