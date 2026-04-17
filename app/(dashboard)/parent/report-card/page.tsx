"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { calculateGrade, getGradeColor, formatDate } from "@/lib/utils";
import { Grade } from "@/types";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";

interface MarkRecord {
  _id: string;
  subject: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
}

interface ChildData {
  _id: string;
  name: string;
  className: string;
  section: string;
  rollNumber: number;
  gender: string;
  bloodGroup: string;
  dateOfBirth?: string;
  marks: MarkRecord[];
  attendance: { totalDays: number; present: number; absent: number; late: number; percentage: number };
}

const remarks: Record<string, string> = {
  "A+": "Excellent performance! Keep up the outstanding work.",
  "A": "Very good performance. Continue to strive for excellence.",
  "B+": "Great effort. A little more focus can take you higher.",
  "B": "Good performance. Focus on weaker areas to improve further.",
  "C+": "Above average. Regular practice will help you improve.",
  "C": "Satisfactory. Regular practice and revision will help you improve.",
  "D": "Needs improvement. Please focus on studies more diligently.",
  "F": "Unsuccessful. Needs immediate attention and extra support.",
};

export default function ParentReportCardPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [parentName, setParentName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parent/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data.children.length > 0) {
          setChildren(json.data.children);
          setSelectedChild(json.data.children[0]);
          setParentName(json.data.parentName);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const child = selectedChild;

  // Derive exam types and subjects from actual marks data
  const examTypes = useMemo(() => {
    if (!child) return [];
    const order = ["Unit Test 1", "Unit Test 2", "Mid Term", "Quarterly", "Half Yearly", "Final"];
    const types = [...new Set(child.marks.map((m) => m.examType))];
    return types.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [child]);

  const subjects = useMemo(() => {
    if (!child) return [];
    return [...new Set(child.marks.map((m) => m.subject))];
  }, [child]);

  // Build table data
  const tableData = useMemo(() => {
    if (!child) return [];
    return subjects.map((sub) => {
      const row: Record<string, string> = { subject: sub };
      examTypes.forEach((exam) => {
        const rec = child.marks.find((m) => m.subject === sub && m.examType === exam);
        row[exam] = rec ? `${rec.marksObtained}/${rec.maxMarks}` : "—";
      });
      const allSubMarks = child.marks.filter((m) => m.subject === sub);
      const avg = allSubMarks.length > 0
        ? Math.round(allSubMarks.reduce((a, m) => a + m.percentage, 0) / allSubMarks.length)
        : 0;
      row.grade = calculateGrade(avg);
      row.avg = `${avg}`;
      return row;
    });
  }, [child, subjects, examTypes]);

  const overallAvg = tableData.length > 0
    ? Math.round(tableData.reduce((a, r) => a + parseInt(r.avg), 0) / tableData.length)
    : 0;
  const overallGrade = calculateGrade(overallAvg);

  // Academic year
  const today = new Date();
  const academicYear = today.getMonth() >= 3
    ? `${today.getFullYear()}-${today.getFullYear() + 1}`
    : `${today.getFullYear() - 1}-${today.getFullYear()}`;

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
      pdf.save(`ReportCard_${child?.name.replace(/\s+/g, "_") || "student"}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <p className="text-sm">No children linked to your account</p>
      </div>
    );
  }

  const att = child.attendance;

  return (
    <div>
      {/* Print Controls */}
      <div className="flex flex-wrap gap-3 mb-5 print:hidden">
        {children.length > 1 && (
          <div className="flex gap-2 mr-4">
            {children.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedChild(c)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedChild?._id === c._id
                    ? "bg-purple-600 text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
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
              Academic Report Card — {academicYear}
            </h2>
          </div>
        </div>

        <div className="px-8 py-5 space-y-6">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              {[
                ["Student Name", child.name],
                ["Roll Number", child.rollNumber || "—"],
                ["Class & Section", `${child.className} - ${child.section}`],
                ["Date of Birth", child.dateOfBirth ? formatDate(child.dateOfBirth) : "—"],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-baseline gap-3">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
                  <span className="flex-1 border-b border-dotted border-gray-300 text-sm font-semibold text-gray-800 pb-0.5">{value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                ["Parent Name", parentName],
                ["Gender", child.gender || "—"],
                ["Blood Group", child.bloodGroup || "—"],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-baseline gap-3">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
                  <span className="flex-1 border-b border-dotted border-gray-300 text-sm font-semibold text-gray-800 pb-0.5">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance */}
          <div className="bg-gray-50 rounded-xl px-5 py-3 flex items-center gap-8 border border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{att.totalDays}</p>
              <p className="text-xs text-gray-500">Working Days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{att.present}</p>
              <p className="text-xs text-gray-500">Days Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{att.absent}</p>
              <p className="text-xs text-gray-500">Days Absent</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${att.percentage >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                {att.percentage}%
              </p>
              <p className="text-xs text-gray-500">Attendance %</p>
            </div>
          </div>

          {/* Marks Table */}
          {tableData.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Academic Performance</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-700">Subject</th>
                    {examTypes.map((e) => (
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
                      {examTypes.map((e) => (
                        <td key={e} className="border border-gray-200 px-3 py-2 text-center text-gray-600">{row[e]}</td>
                      ))}
                      <td className="border border-gray-200 px-3 py-2 text-center font-bold text-gray-800">{row.avg}%</td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${getGradeColor(row.grade as Grade)}`}>{row.grade}</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-50 font-bold">
                    <td className="border border-gray-200 px-3 py-2 text-gray-800">OVERALL</td>
                    {examTypes.map((e) => <td key={e} className="border border-gray-200 px-3 py-2" />)}
                    <td className="border border-gray-200 px-3 py-2 text-center text-indigo-700">{overallAvg}%</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${getGradeColor(overallGrade as Grade)}`}>{overallGrade}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Grade Scale */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Grade Scale</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { grade: "A+", range: "91–100", color: "bg-emerald-100 text-emerald-800" },
                { grade: "A", range: "81–90", color: "bg-green-100 text-green-800" },
                { grade: "B+", range: "71–80", color: "bg-blue-100 text-blue-800" },
                { grade: "B", range: "61–70", color: "bg-indigo-100 text-indigo-800" },
                { grade: "C+", range: "51–60", color: "bg-yellow-100 text-yellow-800" },
                { grade: "C", range: "41–50", color: "bg-orange-100 text-orange-800" },
                { grade: "D", range: "35–40", color: "bg-red-100 text-red-800" },
                { grade: "F", range: "<35", color: "bg-red-200 text-red-900" },
              ].map((g) => (
                <span key={g.grade} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${g.color}`}>
                  {g.grade}: {g.range}
                </span>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Teacher&apos;s Remarks</h3>
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
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Principal&apos;s Remarks</h3>
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
