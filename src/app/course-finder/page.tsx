import type { Metadata } from "next";
export const metadata: Metadata = { title: "Course Finder", description: "Find the right course and university for your study abroad journey." };

export default function CourseFinderPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Course Finder</h1>
        <p className="text-lg text-slate-600">Search and compare courses from universities worldwide.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-8">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option>Any subject</option>
              <option>Business & Management</option>
              <option>Computer Science</option>
              <option>Engineering</option>
              <option>Medicine & Health</option>
              <option>Law</option>
              <option>Arts & Humanities</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option>Any level</option><option>Bachelor</option><option>Master</option><option>PhD</option><option>Diploma</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
            <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option>Any country</option><option>UK</option><option>Canada</option><option>Australia</option><option>USA</option><option>Ireland</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Search Courses</button>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
        <p className="text-slate-500">Enter your preferences above to find matching courses. Our database is being populated with verified university data.</p>
        <p className="text-sm text-slate-400 mt-2">Contact us for personalized course recommendations.</p>
      </div>
    </div>
  );
}
