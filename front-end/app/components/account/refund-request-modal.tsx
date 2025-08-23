"use client"
import { useState } from "react"
import type React from "react"

import { X, Upload, Trash2, AlertCircle } from "lucide-react"
import type { Order } from "../../../types/oder"
import { message } from "antd"

interface RefundRequestModalProps {
  order: Order
  isVisible: boolean
  onClose: () => void
  onSubmit: (data: { reason: string; images: File[] }) => Promise<void> | void
  isProcessing: boolean
}

export default function RefundRequestModal({
  order,
  isVisible,
  onClose,
  onSubmit,
  isProcessing,
}: RefundRequestModalProps) {
  const [reason, setReason] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  if (!isVisible) return null

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      message.error("Chỉ được tải lên tối đa 5 hình ảnh")
      return
    }

    const newImages = [...images, ...files]
    const newPreviews = [...imagePreviews]

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        setImagePreviews([...newPreviews])
      }
      reader.readAsDataURL(file)
    })

    setImages(newImages)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      message.error("Vui lòng nhập lý do hoàn đơn")
      return
    }
    if (images.length === 0) {
      message.error("Vui lòng tải lên ít nhất 1 hình ảnh minh chứng")
      return
    }
    await onSubmit({ reason: reason.trim(), images })
    message.success("Gửi yêu cầu hoàn đơn thành công!")
    // tự đóng modal sau khi gửi thành công
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>

          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors pt-10"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Warning Notice */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Chỉ các đơn hàng đã giao mới có thể yêu cầu hoàn đơn</li>
                <li>Vui lòng cung cấp hình ảnh minh chứng rõ ràng</li>
                <li>Thời gian xử lý yêu cầu: 3-7 ngày làm việc</li>
              </ul>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Lý do hoàn đơn <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết lý do bạn muốn hoàn đơn..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#db4444] focus:border-[#db4444] resize-none"
              rows={4}
              maxLength={500}
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-1">{reason.length}/500 ký tự</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Hình ảnh minh chứng <span className="text-red-500">*</span>
            </label>
            <div className="space-y-4">
              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessing || images.length >= 5}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#db4444] hover:bg-gray-50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-[#db4444]">Nhấn để tải lên</span> hoặc kéo thả hình ảnh
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG (tối đa 5 hình, mỗi hình &lt; 5MB)</p>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isProcessing}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              disabled={isProcessing}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#db4444] to-[#c73e3e] text-white rounded-xl hover:from-[#c73e3e] hover:to-[#b83838] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !reason.trim() || images.length === 0}
            >
              {isProcessing ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}