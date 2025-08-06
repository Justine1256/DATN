'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/utils/api'
import { Modal, Input, Button, Form, Checkbox, message, Typography, notification } from 'antd'
import { EyeInvisibleOutlined, EyeTwoTone, MailOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function SignupForm() {
  const [form] = Form.useForm()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    agree: false,
  })
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(300) // 5 minutes
  const [resendCountdown, setResendCountdown] = useState(60) // 1 minute for resend
  const [loading, setLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    notification.config({ placement: 'topRight', duration: 4, rtl: false })
  }, [])

  useEffect(() => {
    if (showOtpModal && otpCountdown > 0) {
      const timer = setInterval(() => setOtpCountdown((prev) => prev - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [showOtpModal, otpCountdown])

  useEffect(() => {
    if (showOtpModal && resendCountdown > 0) {
      const timer = setInterval(() => setResendCountdown((prev) => prev - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [showOtpModal, resendCountdown])

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/register`, {
        name: values.name,
        username: values.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, ''), // Loại bỏ ký tự đặc biệt
        email: values.email,
        phone: values.phone,
        password: values.password,
        password_confirmation: values.password_confirmation, // Sử dụng giá trị từ form
      })

      setFormData(values)
      notification.success({
        message: 'Mã OTP đã được gửi',
        description: `Chúng tôi đã gửi mã xác nhận đến ${values.email}. Vui lòng kiểm tra hộp thư.`,
        icon: <MailOutlined style={{ color: '#52c41a' }} />,
      })
      setShowOtpModal(true)
      setOtpCountdown(300)
      setResendCountdown(60)
    } catch (err: any) {
      console.log('Full error object:', err)
      console.log('Error response:', err.response?.data) // Debug log
      console.log('Error status:', err.response?.status) // Debug status
      
      // Xử lý lỗi validation từ Laravel (422 status)
      const errors = err.response?.data?.errors
      const errorMessage = err.response?.data?.message || ''
      
      if (errors) {
        console.log('Validation errors found:', errors)
        
        // Set lỗi cho từng field tương ứng
        const formErrors: any[] = []
        
        // Kiểm tra lỗi name
        if (errors.name && errors.name.length > 0) {
          formErrors.push({
            name: 'name',
            errors: [errors.name[0]]
          })
        }
        
        // Kiểm tra lỗi email
        if (errors.email && errors.email.length > 0) {
          console.log('Email error found:', errors.email[0])
          formErrors.push({
            name: 'email',
            errors: [errors.email[0]]
          })
        }
        
        // Kiểm tra lỗi phone
        if (errors.phone && errors.phone.length > 0) {
          formErrors.push({
            name: 'phone',
            errors: [errors.phone[0]]
          })
        }
        
        // Kiểm tra lỗi username (không hiển thị vì username được tạo tự động từ email)
        if (errors.username && errors.username.length > 0) {
          // Chỉ log để debug, không hiển thị lỗi cho user vì username được tạo tự động
          console.log('Username error (auto-generated):', errors.username[0])
        }
        
        // Kiểm tra lỗi password
        if (errors.password && errors.password.length > 0) {
          formErrors.push({
            name: 'password',
            errors: [errors.password[0]]
          })
        }
        
        // Kiểm tra lỗi password confirmation
        if (errors.password_confirmation && errors.password_confirmation.length > 0) {
          formErrors.push({
            name: 'password_confirmation',
            errors: [errors.password_confirmation[0]]
          })
        }
        
        // Set lỗi cho form
        if (formErrors.length > 0) {
          form.setFields(formErrors)
        }
      }
      // Fallback cho các lỗi khác không phải validation
      else {
        let messageText = 'Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.'
        if (errorMessage) {
          messageText = errorMessage
        }
        
        notification.error({
          message: 'Đăng ký thất bại',
          description: messageText,
          icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!otpCode.trim()) {
      notification.warning({
        message: 'Thiếu mã OTP',
        description: 'Vui lòng nhập mã OTP để tiếp tục.',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      })
      return
    }

    if (otpCode.length !== 6) {
      notification.error({
        message: 'Mã OTP không hợp lệ',
        description: 'Mã OTP phải có đủ 6 chữ số. Vui lòng kiểm tra lại.',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      })
      return
    }

    setVerifyLoading(true)
    try {
      await axios.post(`${API_BASE_URL}/verify-otp`, {
        email: formData.email,
        otp: otpCode,
      })

      setShowOtpModal(false)
      setShowSuccessPopup(true)

      notification.success({
        message: 'Xác thực thành công!',
        description: 'Tài khoản của bạn đã được kích hoạt. Đang chuyển hướng đến trang đăng nhập...',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 3,
      })

      setTimeout(() => {
        setShowSuccessPopup(false)
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Mã OTP không hợp lệ'

      let title = 'Xác thực thất bại'
      let desc = errorMessage

      if (errorMessage.toLowerCase().includes('hết hạn') || errorMessage.toLowerCase().includes('expired')) {
        title = 'Mã OTP đã hết hạn'
        desc = 'Mã OTP đã hết hiệu lực. Vui lòng nhấn "Gửi lại mã" để nhận mã mới.'
      } else if (errorMessage.toLowerCase().includes('sai') || errorMessage.toLowerCase().includes('invalid')) {
        title = 'Mã OTP không chính xác'
        desc = 'Mã OTP bạn nhập không đúng. Vui lòng kiểm tra lại email và nhập mã chính xác.'
      }

      notification.error({
        message: title,
        description: desc,
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
        duration: 5,
      })
      setOtpCode('')
    } finally {
      setVerifyLoading(false)
    }
  }

  const resendOtp = async () => {
    setResendLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/register`, {
        name: formData.name,
        username: formData.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, ''), // Loại bỏ ký tự đặc biệt
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.password_confirmation, // Sử dụng giá trị từ formData
      })
      
      notification.success({
        message: 'Mã OTP mới đã được gửi',
        description: 'Chúng tôi đã gửi mã xác nhận mới đến email của bạn. Vui lòng kiểm tra hộp thư.',
        icon: <MailOutlined style={{ color: '#52c41a' }} />,
      })
      setResendCountdown(60)
      setOtpCode('')
    } catch (err: any) {
      notification.error({
        message: 'Không thể gửi lại mã',
        description: 'Có lỗi xảy ra khi gửi lại mã OTP. Vui lòng thử lại sau.',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      })
    } finally {
      setResendLoading(false)
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6)
    setOtpCode(numericValue)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const numericData = pastedData.replace(/\D/g, '').slice(0, 6)
    setOtpCode(numericData)
    
    // Focus the last filled input or the next empty input
    setTimeout(() => {
      const inputs = document.querySelectorAll('.otp-input') as NodeListOf<HTMLInputElement>
      const targetIndex = Math.min(numericData.length, 5)
      inputs[targetIndex]?.focus()
    }, 0)
  }

  return (
    <div className="w-[370px] max-w-md mx-auto text-black relative">
      <h2 className="text-[1.5rem] font-semibold mb-1">Tạo tài khoản</h2>
      <p className="text-sm text-gray-700 mb-6">Vui lòng nhập thông tin bên dưới</p>

      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        className="space-y-4"
      >
        <Form.Item
          name="name"
          rules={[
            { required: true, message: 'Vui lòng nhập họ và tên' },
            { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự' }
          ]}
        >
          <Input
            placeholder="Họ và tên"
            className="custom-input border-0 border-b-2 border-gray-300 rounded-none px-0 py-2"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' }
          ]}
        >
          <Input
            placeholder="Email"
            className="custom-input border-0 border-b-2 border-gray-300 rounded-none px-0 py-2"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            {
              pattern: /^(03|05|07|08|09)[0-9]{8}$/,
              message: 'Số điện thoại không hợp lệ'
            }
          ]}
        >
          <Input
            placeholder="Số điện thoại"
            className="custom-input border-0 border-b-2 border-gray-300 rounded-none px-0 py-2"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
          ]}
        >
          <Input.Password
            placeholder="Mật khẩu"
            className="custom-input border-0 border-b-2 border-gray-300 rounded-none px-0 py-2"
            size="large"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="password_confirmation"
          rules={[
            { required: true, message: 'Vui lòng nhập xác nhận mật khẩu' },
            { min: 6, message: 'Xác nhận mật khẩu phải có ít nhất 6 ký tự' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Xác nhận mật khẩu không khớp!'));
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="Xác nhận mật khẩu"
            className="custom-input border-0 border-b-2 border-gray-300 rounded-none px-0 py-2"
            size="large"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="agree"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error('Bạn cần đồng ý với điều khoản')),
            },
          ]}
        >
          <Checkbox className="custom-checkbox text-sm">
            <span className="text-gray-700">
              Tôi đồng ý với{' '}
              <a href="/dieu-khoan" className="text-blue-600 underline">
                Điều khoản & Chính sách
              </a>
            </span>
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="custom-button w-full h-10 bg-[#db4444] hover:bg-[#c03d3d] border-[#db4444] hover:border-[#c03d3d] text-white font-medium"
            size="large"
          >
            Đăng ký
          </Button>
        </Form.Item>
      </Form>

      <div className="my-6 flex items-center">
        <div className="flex-grow border-t" />
        <span className="mx-2 text-black text-sm">hoặc</span>
        <div className="flex-grow border-t" />
      </div>

      <Button
        className="w-full mb-2 h-10 border flex items-center justify-center text-black hover:bg-gray-100"
        onClick={() => notification.info({
          message: 'Tính năng sắp ra mắt',
          description: 'Đăng ký bằng Google sẽ sớm có mặt. Hiện tại vui lòng sử dụng email để đăng ký.',
          icon: <ExclamationCircleOutlined style={{ color: '#1890ff' }} />,
        })}
        size="large"
      >
        <img src="/google-logo.png" alt="Google" className="w-5 h-5 mr-2" />
        Đăng ký bằng Google
      </Button>

      <p className="text-center mt-6 text-sm">
        Đã có tài khoản?{' '}
        <a href="/login" className="underline hover:text-blue-600">
          Đăng nhập
        </a>
      </p>

      {/* OTP Modal */}
      <Modal
        title={null}
        open={showOtpModal}
        onCancel={() => {
          setOtpCode('')
          setShowOtpModal(false)
        }}
        footer={null}
        centered
        width={480}
        className="otp-modal"
        maskClosable={false}
      >
        <div className="px-8 py-6">
          {/* Icon và tiêu đề */}
          <div className="text-center mb-5">
            <div className="w-16 h-16 mx-auto mb-3 bg-[#db4444] rounded-full flex items-center justify-center">
              <MailOutlined className="text-2xl text-white" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Xác nhận email
            </h2>
            
            <p className="text-gray-600 text-sm mb-3 leading-relaxed">
              Chúng tôi đã gửi mã xác nhận 6 chữ số đến email<br />của bạn
            </p>
            
            <p className="text-[#db4444] font-semibold text-base mb-6">
              {formData.email}
            </p>
          </div>

          {/* 6 ô OTP */}
          <div className="flex justify-center gap-3 mb-5">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={otpCode[index] || ''}
                className="otp-input w-14 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-[#db4444] focus:outline-none transition-colors"
                autoFocus={index === 0}
                onChange={(e) => {
                  const target = e.target as HTMLInputElement
                  const value = target.value.replace(/\D/g, '')
                  const newOtp = otpCode.split('')
                  newOtp[index] = value
                  const newOtpString = newOtp.join('').slice(0, 6)
                  setOtpCode(newOtpString)
                  
                  // Auto focus next input
                  if (value && index < 5) {
                    const nextInput = target.parentElement?.children[index + 1] as HTMLInputElement
                    nextInput?.focus()
                  }
                }}
                onKeyDown={(e) => {
                  const target = e.target as HTMLInputElement
                  // Handle backspace
                  if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
                    const prevInput = target.parentElement?.children[index - 1] as HTMLInputElement
                    prevInput?.focus()
                  }
                }}
                onPaste={index === 0 ? handlePaste : (e) => e.preventDefault()}
              />
            ))}
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center mb-6 text-gray-600">
            <ClockCircleOutlined className="mr-2" />
            <span className="text-sm">
              Mã sẽ hết hạn sau: <span className="font-bold text-[#db4444]">{formatTime(otpCountdown)}</span>
            </span>
          </div>

          {/* Nút xác nhận */}
          <div className="mb-4">
            <button
              onClick={verifyOtp}
              disabled={otpCode.length !== 6 || verifyLoading}
              className="w-full h-11 bg-[#db4444] hover:bg-[#c03d3d] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors"
              style={{
                opacity: otpCode.length !== 6 ? 0.5 : 1
              }}
            >
              {verifyLoading ? 'Đang xác nhận...' : 'Xác nhận và hoàn tất đăng ký'}
            </button>
          </div>

          {/* Không nhận được mã */}
          <div className="text-center mb-4">
            <p className="text-gray-600 text-sm mb-1">Không nhận được mã?</p>
            <button
              onClick={resendOtp}
              disabled={resendCountdown > 0 || resendLoading}
              className="text-gray-400 disabled:text-gray-300 hover:text-gray-600 text-sm underline bg-transparent border-none cursor-pointer disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Đang gửi...' : resendCountdown > 0 ? `Gửi lại mã (${resendCountdown}s)` : 'Gửi lại mã'}
            </button>
          </div>

          {/* Quay lại */}
          <div className="text-center">
            <button
              onClick={() => {
                setOtpCode('')
                setShowOtpModal(false)
              }}
              className="text-gray-500 hover:text-gray-700 text-sm bg-transparent border-none cursor-pointer flex items-center justify-center mx-auto"
            >
              <span className="mr-1">←</span>
              Quay lại đăng ký
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        title={null}
        open={showSuccessPopup}
        footer={null}
        centered
        closable={false}
        width={320}
        className="success-modal"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <Title level={3} className="!mb-2 !text-green-700">
            Đăng ký thành công!
          </Title>
          <Text className="text-gray-600">
            Tài khoản của bạn đã được tạo thành công
          </Text>
        </div>
      </Modal>

      <style jsx global>{`
        .otp-modal .ant-modal-content {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .otp-modal .ant-modal-body {
          padding: 0;
        }
        
        .success-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
        }
        
        .custom-input.ant-input {
          border: 0 !important;
          border-bottom: 2px solid #d1d5db !important;
          border-radius: 0 !important;
          padding: 8px 0 !important;
          box-shadow: none !important;
        }
        
        .custom-input.ant-input:hover {
          border-color: #db4444 !important;
          box-shadow: none !important;
        }
        
        .custom-input.ant-input:focus,
        .custom-input.ant-input-focused {
          border-color: #db4444 !important;
          box-shadow: none !important;
          outline: none !important;
        }
        
        .custom-input.ant-input-affix-wrapper {
          border: 0 !important;
          border-bottom: 2px solid #d1d5db !important;
          border-radius: 0 !important;
          padding: 8px 0 !important;
          box-shadow: none !important;
        }
        
        .custom-input.ant-input-affix-wrapper:hover {
          border-color: #db4444 !important;
          box-shadow: none !important;
        }
        
        .custom-input.ant-input-affix-wrapper:focus,
        .custom-input.ant-input-affix-wrapper-focused {
          border-color: #db4444 !important;
          box-shadow: none !important;
          outline: none !important;
        }
        
        .custom-input .ant-input {
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        
        .custom-input .ant-input:focus {
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
        
        .ant-form-item-has-error .custom-input.ant-input,
        .ant-form-item-has-error .custom-input.ant-input-affix-wrapper {
          border-color: #ff4d4f !important;
          box-shadow: none !important;
        }
        
        .ant-form-item-has-error .custom-input.ant-input:hover,
        .ant-form-item-has-error .custom-input.ant-input-affix-wrapper:hover {
          border-color: #ff4d4f !important;
        }
        
        .ant-form-item-has-error .custom-input.ant-input:focus,
        .ant-form-item-has-error .custom-input.ant-input-focused,
        .ant-form-item-has-error .custom-input.ant-input-affix-wrapper:focus,
        .ant-form-item-has-error .custom-input.ant-input-affix-wrapper-focused {
          border-color: #ff4d4f !important;
          box-shadow: none !important;
        }
        
        /* Custom Checkbox */
        .custom-checkbox .ant-checkbox-wrapper:hover .ant-checkbox-inner,
        .custom-checkbox .ant-checkbox:hover .ant-checkbox-inner {
          border-color: #db4444 !important;
        }
        
        .custom-checkbox .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #db4444 !important;
          border-color: #db4444 !important;
        }
        
        .custom-checkbox .ant-checkbox-checked:hover .ant-checkbox-inner {
          background-color: #c03d3d !important;
          border-color: #c03d3d !important;
        }
        
        .custom-checkbox .ant-checkbox-input:focus + .ant-checkbox-inner {
          border-color: #db4444 !important;
        }
        
        /* Custom Button */
        .custom-button.ant-btn-primary {
          background-color: #db4444 !important;
          border-color: #db4444 !important;
        }
        
        .custom-button.ant-btn-primary:hover {
          background-color: #c03d3d !important;
          border-color: #c03d3d !important;
        }
        
        .custom-button.ant-btn-primary:focus {
          background-color: #c03d3d !important;
          border-color: #c03d3d !important;
        }
        
        .custom-button.ant-btn-primary:active {
          background-color: #a73333 !important;
          border-color: #a73333 !important;
        }
      `}</style>
    </div>
  )
}