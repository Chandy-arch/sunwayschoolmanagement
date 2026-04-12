"use client";

import { useRef, useState } from "react";
import { mockStudents, mockMarksRecords, mockAttendanceRecords, mockClasses } from "@/lib/mock-data";
import { calculateGrade, getGradeColor, formatDate } from "@/lib/utils";
import { Grade } from "@/types";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";

const myChild = mockStudents[0];
const myClass = mockClasses.find(c => c._id === myChild.classId);
const allMarks = mockMarksRecords.filter(m => m.studentId === myChild._id);
const attendanceRecs = mockAttendanceRecords.filter(a => a.studentId === myChild._id);
const attendancePercent = attendanceRecs.length > 0
  ? Math.round((attendanceRecs.filter(a => a.status === "Present").length / attendanceRecs.length) * 100)
  : 87;

const subjects = ["Mathematics", "Science", "English", "Social Science", "Tamil"];
const examTypes = ["Unit Test 1", "Unit Test 2", "Mid Term", "Final"];

const tableData = subjects.map(sub => {
  const row: Record<string, string> = { subject: sub };
  examTypes.forEach(exam => {
    const rec = allMarks.find(m => m.subject === sub && m.examType === exam);
    row[exam] = rec ? `${rec.marksObtained}/${rec.maxMarks}` : "—";
  });
  // Calculate final grade from "Final" exam or average
  const finalRec = allMarks.find(m => m.subject === sub && m.examType === "Final");
  const allSubMarks = allMarks.filter(m => m.subject === sub);
  const avg = allSubMarks.length > 0
    ? Math.round(allSubMarks.reduce((a, m) => a + (m.marksObtained / m.maxMarks) * 100, 0) / allSubMarks.length)
    : 70;
  row.grade = calculateGrade(avg, 100);
  row.avg = `${avg}`;
  return row;
});

const overallAvg = tableData.length > 0
  ? Math.round(tableData.reduce((a, r) => a + parseInt(r.avg), 0) / tableData.length)
  : 75;
const overallGrade = calculateGrade(overallAvg, 100);

const remarks: Record<string, string> = {
  "A+": "Excellent performance! Keep up the outstanding work.",
  "A": "Very good performance. Continue to strive for excellence.",
  "B": "Good performance. Focus on weaker areas to improve further.",
  "C": "Satisfactory. Regular practice and revision will help you improve.",
  "D": "Needs improvement. Please focus on studies more diligently.",
  "F": "Unsuccessful. Needs immediate attention and extra support.",
};

export default function ParentReportCardPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`ReportCard_${myChild.name.replace(/\s+/g, "_")}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {/* Print Controls (hidden in print) */}
      <div className="flex gap-3 mb-5 print:hidden">
        <Button variant="default" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print Report Card
        </Button>
        <Button variant="outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          {downloading ? "Generating PDF…" : "Download PDF"}
        </Button>
      </div>

      {/* Report Card */}
      <div ref={printRef} className="max-w-3xl mx-auto bg-white border-2 border-gray-200 rounded-2xl shadow-lg print:shadow-none print:border-gray-400 print:rounded-none overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white px-8 py-6 print:bg-indigo-700">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-black text-indigo-700">SGS</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wide">Sunway Global School</h1>
              <p className="text-white/70 text-sm">123, Education Lane, Chennai - 600001, Tamil Nadu</p>
              <p className="text-white/70 text-xs mt-0.5">Ph: 044-12345678 | info@sunwayglobalschool.edu</p>
            </div>
          </div>
          <div className="mt-4 border-t border-white/20 pt-3">
            <h2 className="text-center text-lg font-bold tracking-widest uppercase">
              Academic Report Card — {myChild.academicYear}
            </h2>
          </div>
        </div>

        <div className="px-8 py-5 space-y-6">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              {[
                ["Student Name", myChild.name],
                ["Roll Number", myChild.rollNumber],
                ["Class & Section", `${myChild.class} - ${myChild.section}`],
                ["Date of Birth", formatDate(myChild.dob)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-3">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
                  <span className="flex-1 border-b border-dotted border-gray-300 text-sm font-semibold text-gray-800 pb-0.5">{value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                ["Father's Name", myChild.parentName],
                ["Phone", myChild.phone],
                ["Gender", myChild.gender],
                ["Blood Group", myChild.bloodGroup],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-3">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
                  <span className="flex-1 border-b border-dotted border-gray-300 text-sm font-semibold text-gray-800 pb-0.5">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance */}
          <div className="bg-gray-50 rounded-xl px-5 py-3 flex items-center gap-8 border border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{attendanceRecs.length || 180}</p>
              <p className="text-xs text-gray-500">Working Days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{attendancePercent > 0 ? Math.round((attendancePercent / 100) * 180) : 156}</p>
              <p className="text-xs text-gray-500">Days Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{180 - Math.round((attendancePercent / 100) * 180)}</p>
              <p className="text-xs text-gray-500">Days Absent</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${attendancePercent >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                {attendancePercent}%
              </p>
              <p className="text-xs text-gray-500">Attendance %</p>
            </div>
          </div>

          {/* Marks Table */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Academic Performance</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="border border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-700">Subject</th>
                  {examTypes.map(e => (
                    <th key={e} className="border border-gray-200 px-3 py-2 text-center text-xs font-bold text-gray-700">{e}</th>
                  ))}
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-bold text-gray-700">Avg %</th>
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-bold text-gray-700">Grade</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={row.subject} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-200 px-3 py-2 font-semibold text-gray-800">{row.subject}</td>
                    {examTypes.map(e => (
                      <td key={e} className="border border-gray-200 px-3 py-2 text-center text-gray-600">{row[e]}</td>
                    ))}
                    <td className="border border-gray-200 px-3 py-2 text-center font-bold text-gray-800">{row.avg}%</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${getGradeColor(row.grade as Grade)}`}>{row.grade}</span>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-indigo-50 font-bold">
                  <td className="border border-gray-200 px-3 py-2 text-gray-800">OVERALL</td>
                  {examTypes.map(e => <td key={e} className="border border-gray-200 px-3 py-2" />)}
                  <td className="border border-gray-200 px-3 py-2 text-center text-indigo-700">{overallAvg}%</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${getGradeColor(overallGrade as Grade)}`}>{overallGrade}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grade Scale */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Grade Scale</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { grade: "A+", range: "90–100", color: "bg-emerald-100 text-emerald-800" },
                { grade: "A", range: "80–89", color: "bg-green-100 text-green-800" },
                { grade: "B", range: "70–79", color: "bg-blue-100 text-blue-800" },
                { grade: "C", range: "60–69", color: "bg-yellow-100 text-yellow-800" },
                { grade: "D", range: "50–59", color: "bg-orange-100 text-orange-800" },
                { grade: "F", range: "<50", color: "bg-red-100 text-red-800" },
              ].map(g => (
                <span key={g.grade} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${g.color}`}>
                  {g.grade}: {g.range}
                </span>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Teacher's Remarks</h3>
              <div className="border border-dashed border-gray-300 rounded-xl p-3 min-h-[80px]">
                <p className="text-xs text-gray-600 italic">{remarks[overallGrade] || remarks["A"]}</p>
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <div className="h-px w-28 bg-gray-400" />
                    <p className="text-xs text-gray-500 mt-1">Class Teacher Signature</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Principal's Remarks</h3>
              <div className="border border-dashed border-gray-300 rounded-xl p-3 min-h-[80px]">
                <p className="text-xs text-gray-600 italic">
                  {overallAvg >= 80
                    ? "Promoted to the next class with distinction. Excellent academic year!"
                    : overallAvg >= 50
                    ? "Promoted to the next class. Keep striving for excellence."
                    : "Needs improvement. Additional support recommended."}
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <div className="h-px w-28 bg-gray-400" />
                    <p className="text-xs text-gray-500 mt-1">Principal Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4 text-center">
            <p className="text-xs text-gray-400">
              This is an official document generated by Sunway Global School Management System. • Generated on {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
