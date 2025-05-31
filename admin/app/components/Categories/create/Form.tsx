"use client";

import React from "react";

interface CategoryInfoFormProps {
  data: any;
  setData: (field: string, value: string) => void;
}

export default function CategoryInfoForm({
  data,
  setData,
}: CategoryInfoFormProps) {
  return (
    <div className="space-y-8">

      {/* General Information */}
      <div className="bg-white p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">General Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Title
            </label>
            <input
              type="text"
              value={data.name || ""}
              onChange={(e) => setData("name", e.target.value)}
              className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created By
            </label>
            <select
              value={data.createdBy || ""}
              onChange={(e) => setData("createdBy", e.target.value)}
              className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            >
              <option value="">Select</option>
              <option value="Admin">Admin</option>
              <option value="Seller">Seller</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            <input
              type="number"
              value={data.stock || ""}
              onChange={(e) => setData("stock", e.target.value)}
              className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag ID
            </label>
            <input
              type="text"
              value={data.id || ""}
              onChange={(e) => setData("id", e.target.value)}
              className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={data.description || ""}
            onChange={(e) => setData("description", e.target.value)}
            rows={4}
            className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
          />
        </div>
      </div>

      {/* Meta Options */}
      <div className="bg-white p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Meta Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={data.metaTitle || ""}
              onChange={(e) => setData("metaTitle", e.target.value)}
              className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Tag Keyword
            </label>
            <input
              type="text"
              value={data.metaKeyword || ""}
              onChange={(e) => setData("metaKeyword", e.target.value)}
              className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={data.metaDescription || ""}
            onChange={(e) => setData("metaDescription", e.target.value)}
            rows={3}
            className="w-full border border-gray-200 p-2 font-medium text-gray-800 rounded"
          />
        </div>
      </div>
    </div>
  );
}
