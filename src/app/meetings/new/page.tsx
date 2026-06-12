"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Users, Save, X } from "lucide-react";
import Link from "next/link";

export default function NewMeetingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      meetingNo: formData.get("meetingNo"),
      meetingDate: formData.get("meetingDate"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      location: formData.get("location"),
      chairName: formData.get("chairName"),
      secretaryName: formData.get("secretaryName"),
    };

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      const result = await res.json();
      router.push(`/meetings/${result.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold leading-6 text-slate-900">
          สร้างการประชุมใหม่
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          กำหนดรายละเอียดการประชุมคณะกรรมการ
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="title" className="block text-sm font-medium leading-6 text-slate-900">
                ชื่อการประชุม *
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  defaultValue="การประชุมคณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ"
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="meetingNo" className="block text-sm font-medium leading-6 text-slate-900">
                ครั้งที่ *
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="meetingNo"
                  id="meetingNo"
                  required
                  placeholder="เช่น 1/2569"
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="meetingDate" className="block text-sm font-medium leading-6 text-slate-900">
                <Calendar className="inline-block mr-1 h-4 w-4" /> วันที่ประชุม *
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  name="meetingDate"
                  id="meetingDate"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="startTime" className="block text-sm font-medium leading-6 text-slate-900">
                <Clock className="inline-block mr-1 h-4 w-4" /> เวลาเริ่ม
              </label>
              <div className="mt-2">
                <input
                  type="time"
                  name="startTime"
                  id="startTime"
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="endTime" className="block text-sm font-medium leading-6 text-slate-900">
                เวลาสิ้นสุด
              </label>
              <div className="mt-2">
                <input
                  type="time"
                  name="endTime"
                  id="endTime"
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="location" className="block text-sm font-medium leading-6 text-slate-900">
                <MapPin className="inline-block mr-1 h-4 w-4" /> สถานที่
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="location"
                  id="location"
                  defaultValue="ห้องประชุม ก.พ.ค.ตร."
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="chairName" className="block text-sm font-medium leading-6 text-slate-900">
                <Users className="inline-block mr-1 h-4 w-4" /> ประธาน
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="chairName"
                  id="chairName"
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="secretaryName" className="block text-sm font-medium leading-6 text-slate-900">
                เลขานุการ
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="secretaryName"
                  id="secretaryName"
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <Link href="/meetings" className="text-sm font-semibold leading-6 text-slate-900">
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              <Save className="-ml-0.5 mr-1.5 h-5 w-5" />
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกการประชุม"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
