"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'Làm thế nào để đặt phòng?',
    answer: 'Nhấn vào nút "Đặt phòng" ở thanh điều hướng底部 hoặc chọn "Đặt phòng" từ menu. Nhập thông tin khách hàng, chọn phòng, thời gian và xác nhận.',
  },
  {
    question: 'Làm thế nào để xem trạng thái phòng?',
    answer: 'Nhấn vào "Phòng" ở thanh điều hướng底部 để xem tất cả phòng. Phòng trống hiển thị màu trắng, phòng đang dùng hiển thị màu cam, phòng chờ hiển thị màu xanh.',
  },
  {
    question: 'Làm thế nào để xác nhận khách đến?',
    answer: 'Vào chi tiết đơn đặt phòng, nhấn nút "Xác nhận đến". Hệ thống sẽ ghi lại thời gian khách đến.',
  },
  {
    question: 'Làm thế nào để thanh toán?',
    answer: 'Vào chi tiết đơn đặt phòng, nhấn nút "Thanh toán". Nhập số tiền và xác nhận. Đơn sẽ chuyển sang trạng thái "Chờ thanh toán".',
  },
  {
    question: 'Làm thế nào để thêm dịch vụ?',
    answer: 'Vào chi tiết đơn đặt phòng, nhấn nút "Thêm dịch vụ". Chọn dịch vụ và số lượng, sau đó xác nhận.',
  },
  {
    question: 'Làm thế nào để hủy đơn?',
    answer: 'Vào chi tiết đơn đặt phòng, nhấn nút "Hủy đơn". Đơn sẽ chuyển sang trạng thái "Đã hủy".',
  },
  {
    question: 'Làm thế nào để xem thống kê?',
    answer: 'Vào menu "Thêm" → "Thống kê" để xem doanh thu, số đơn, và phân loại trạng thái.',
  },
  {
    question: 'Làm thế nào để xem danh sách khách hàng?',
    answer: 'Vào menu "Thêm" → "Khách hàng" để xem danh sách khách hàng và số lần quay lại.',
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="w-full max-w-md bg-white relative h-[100dvh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
          <Link href="/more" className="flex items-center text-gray-700 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg">Hỗ trợ</h1>
          <div className="w-6" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
          {/* Intro */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              <h2 className="font-semibold text-blue-800">Hướng dẫn sử dụng</h2>
            </div>
            <p className="text-sm text-blue-700">
              Chào mừng bạn đến với ứng dụng quản lý đặt phòng. Dưới đây là các câu hỏi thường gặp.
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-800 text-sm pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-6 bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-2">Vẫn cần hỗ trợ?</p>
            <p className="text-sm font-semibold text-gray-700">Liên hệ quản trị viên</p>
          </div>
        </div>
      </div>
    </div>
  );
}