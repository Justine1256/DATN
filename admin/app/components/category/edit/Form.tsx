"use client";
import dynamic from "next/dynamic";

const CKEditor = dynamic(
  () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
  { ssr: false }
);
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

interface Category {
  id: string;
  name: string;
}

interface Props {
  data: any;
  setData: (field: string, value: string | null) => void;
  categories: Category[];
}

export default function CategoryInfoForm({ data, setData, categories }: Props) {
  return (
    <div className="space-y-8">
      {/* THÔNG TIN DANH MỤC */}
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
        <h3 className="text-base font-medium text-[#1e293b] mb-4 flex items-center">
          <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
          Thông tin danh mục
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tên danh mục */}
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Tên danh mục <span className="text-[#db4444]">*</span>
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData("name", e.target.value)}
              placeholder="Nhập tên danh mục"
              className="w-full px-3 py-2.5 border border-[#cbd5e1] rounded-md text-sm 
                        placeholder:text-[#94a3b8] focus:outline-none 
                        focus:ring-2 focus:ring-[#db4444]/20 
                        focus:border-[#db4444] transition-all"
            />
          </div>

          {/* Danh mục cha */}
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Danh mục cha (admin)
            </label>
            <select
              value={data.parent_id ?? ""}
              onChange={(e) => setData("parent_id", e.target.value || null)}
              className="w-full px-3 py-2.5 border border-[#cbd5e1] rounded-md text-sm 
            bg-[#f9fafb] focus:outline-none focus:ring-2 
            focus:ring-[#db4444]/20 focus:border-[#db4444] transition-all"
            >
              <option value="">-- Không có --</option>
              {(categories || []).map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

          </div>
        </div>
      </div>

      {/* MÔ TẢ */}
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6">
        <h3 className="text-base font-medium text-[#1e293b] mb-4 flex items-center">
          <div className="w-1 h-4 bg-[#db4444] rounded-full mr-3"></div>
          Mô tả danh mục
        </h3>
        <div className="border border-[#cbd5e1] rounded-lg overflow-hidden">
          <CKEditor
            editor={ClassicEditor}
            data={data.description}
            onChange={(_, editor) => {
              const value = editor.getData();
              setData("description", value);
            }}
            config={{
              toolbar: [
                "heading", "|",
                "bold", "italic", "underline", "|",
                "bulletedList", "numberedList", "|",
                "undo", "redo",
              ],
              placeholder: "Nhập mô tả danh mục...",
            }}
          />
        </div>
      </div>
    </div>
  );
}
