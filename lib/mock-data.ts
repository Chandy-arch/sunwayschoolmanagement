import {
  Student,
  Staff,
  Class,
  AttendanceRecord,
  MarksRecord,
  FeeRecord,
  TimetableSlot,
  Notification,
  Message,
  DashboardStats,
  ChartData,
  ExamType,
} from "@/types";

// ==================== CLASSES ====================
export const mockClasses: Class[] = [
  { _id: "cls1", name: "6", section: "A", classTeacherId: "stf1", classTeacherName: "Mrs. Lakshmi Priya", subjects: ["Tamil", "English", "Mathematics", "Science", "Social Science"], studentCount: 42, room: "Room 101", academicYear: "2024-2025" },
  { _id: "cls2", name: "6", section: "B", classTeacherId: "stf2", classTeacherName: "Mr. Vijay Kumar", subjects: ["Tamil", "English", "Mathematics", "Science", "Social Science"], studentCount: 40, room: "Room 102", academicYear: "2024-2025" },
  { _id: "cls3", name: "7", section: "A", classTeacherId: "stf3", classTeacherName: "Mrs. Divya Menon", subjects: ["Tamil", "English", "Mathematics", "Science", "Social Science", "Computer Science"], studentCount: 38, room: "Room 201", academicYear: "2024-2025" },
  { _id: "cls4", name: "7", section: "B", classTeacherId: "stf4", classTeacherName: "Mr. Karthik Raja", subjects: ["Tamil", "English", "Mathematics", "Science", "Social Science", "Computer Science"], studentCount: 40, room: "Room 202", academicYear: "2024-2025" },
  { _id: "cls5", name: "8", section: "A", classTeacherId: "stf5", classTeacherName: "Mrs. Priya Nair", subjects: ["Tamil", "English", "Mathematics", "Science", "Social Science", "Computer Science"], studentCount: 45, room: "Room 301", academicYear: "2024-2025" },
  { _id: "cls6", name: "8", section: "B", classTeacherId: "stf6", classTeacherName: "Mr. Suresh Babu", subjects: ["Tamil", "English", "Mathematics", "Science", "Social Science", "Computer Science"], studentCount: 43, room: "Room 302", academicYear: "2024-2025" },
  { _id: "cls7", name: "9", section: "A", classTeacherId: "stf7", classTeacherName: "Dr. Meena Krishnan", subjects: ["Tamil", "English", "Mathematics", "Physics", "Chemistry", "Biology", "Social Science"], studentCount: 44, room: "Room 401", academicYear: "2024-2025" },
  { _id: "cls8", name: "10", section: "A", classTeacherId: "stf8", classTeacherName: "Mr. Anand Swamy", subjects: ["Tamil", "English", "Mathematics", "Physics", "Chemistry", "Biology", "Social Science"], studentCount: 46, room: "Room 501", academicYear: "2024-2025" },
  { _id: "cls9", name: "11", section: "A", classTeacherId: "stf9", classTeacherName: "Mrs. Radha Kumari", subjects: ["Tamil", "English", "Physics", "Chemistry", "Mathematics"], studentCount: 38, room: "Room 601", academicYear: "2024-2025" },
  { _id: "cls10", name: "12", section: "A", classTeacherId: "stf10", classTeacherName: "Mr. Balaji Raman", subjects: ["Tamil", "English", "Physics", "Chemistry", "Mathematics"], studentCount: 36, room: "Room 701", academicYear: "2024-2025" },
];

// ==================== STUDENTS ====================
const studentNames = [
  "Aarav Sharma", "Priya Nataraj", "Karthik Murugan", "Deepika Rajan", "Arjun Pillai",
  "Kavitha Suresh", "Vivek Chandrasekaran", "Ananya Krishnamurthy", "Surya Balakrishnan", "Nithya Rajendran",
  "Ravi Shankar", "Meera Venkatesh", "Arun Kumar", "Divya Srinivasan", "Sanjay Narayanan",
  "Lakshmi Prabhakaran", "Vikram Selvaraj", "Pooja Thirumalai", "Mohan Das", "Saranya Palaniswamy",
  "Harish Prabhu", "Sindhu Muthusamy", "Dinesh Raghavan", "Pavithra Ayyappan", "Suresh Natarajan",
  "Geetha Manikandan", "Praveen Subramanian", "Nandini Gopalakrishnan", "Ashwin Venkataramanan", "Revathi Sundaram",
  "Balachandran Kutty", "Shalini Ramachandran", "Naveen Jayaraman", "Amitha Devi", "Rathinam Pillai",
  "Vidya Saravanan", "Ganesh Krishnan", "Manimegalai Rajan", "Senthil Kumar", "Brindha Mathew",
  "Prashanth Iyer", "Kaveri Mohan", "Chandran Pillai", "Swathi Natraj", "Mahesh Murugesan",
  "Padmavathi Reddy", "Ajay Kumar", "Thenmozhi Sundaram", "Rajkumar Singh", "Ambika Nair",
];

export const mockStudents: Student[] = studentNames.map((name, i) => {
  const classIndex = Math.floor(i / 5) % 10;
  const cls = mockClasses[classIndex];
  const feeStatuses = ["Paid", "Pending", "Partial", "Overdue"] as const;
  return {
    _id: `stu${i + 1}`,
    studentId: `PA2024${String(i + 1).padStart(4, "0")}`,
    name,
    email: `${name.split(" ")[0].toLowerCase()}${i + 1}@student.sunwayglobalschool.edu`,
    phone: `9${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
    dateOfBirth: `${2008 + (classIndex % 7)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
    gender: i % 3 === 0 ? "Female" : "Male",
    bloodGroup: (["A+", "B+", "O+", "AB+", "A-", "B-"] as const)[i % 6],
    address: `${i + 1}, ${["Anna Nagar", "T Nagar", "Velachery", "Adyar", "Nungambakkam"][i % 5]}, Chennai - ${600001 + (i % 10)}`,
    classId: cls._id,
    className: `${cls.name}${cls.section}`,
    section: cls.section,
    rollNumber: (i % 45) + 1,
    parentId: `par${i + 1}`,
    parentName: `${["Mr.", "Mrs."][i % 2]} ${name.split(" ")[1]} ${["Kumar", "Rajan", "Devi", "Pillai", "Nair"][i % 5]}`,
    parentPhone: `9${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
    parentEmail: `parent${i + 1}@email.com`,
    admissionDate: `${2020 + (i % 5)}-06-01`,
    admissionNumber: `ADM${2024}${String(i + 1).padStart(4, "0")}`,
    isActive: i % 20 !== 0,
    fees: [
      {
        _id: `fee${i}1`,
        studentId: `stu${i + 1}`,
        feeType: "Tuition Fee",
        amount: 15000,
        paidAmount: i % 4 === 1 ? 0 : i % 4 === 2 ? 7500 : 15000,
        dueDate: "2024-07-31",
        paidDate: i % 4 === 0 ? "2024-07-15" : undefined,
        status: feeStatuses[i % 4],
        academicYear: "2024-2025",
        receiptNumber: i % 4 === 0 ? `RCP${100000 + i}` : undefined,
        paymentMethod: i % 4 === 0 ? "Online" : undefined,
      },
      {
        _id: `fee${i}2`,
        studentId: `stu${i + 1}`,
        feeType: "Transport Fee",
        amount: 5000,
        paidAmount: i % 3 === 0 ? 5000 : 0,
        dueDate: "2024-07-31",
        paidDate: i % 3 === 0 ? "2024-07-10" : undefined,
        status: i % 3 === 0 ? "Paid" : "Pending",
        academicYear: "2024-2025",
      },
    ],
    attendance: {
      totalDays: 180,
      presentDays: 140 + (i % 40),
      absentDays: 40 - (i % 40),
      lateDays: i % 10,
      percentage: Math.round(((140 + (i % 40)) / 180) * 100),
    },
    createdAt: `2024-06-01T00:00:00.000Z`,
  };
});

// ==================== STAFF ====================
const staffData = [
  { name: "Mrs. Lakshmi Priya", designation: "Senior Teacher", department: "Languages", subjects: ["Tamil", "English"], experience: 12 },
  { name: "Mr. Vijay Kumar", designation: "Teacher", department: "Mathematics", subjects: ["Mathematics"], experience: 8 },
  { name: "Mrs. Divya Menon", designation: "Senior Teacher", department: "Science", subjects: ["Science", "Biology"], experience: 10 },
  { name: "Mr. Karthik Raja", designation: "Teacher", department: "Computer Science", subjects: ["Computer Science"], experience: 6 },
  { name: "Mrs. Priya Nair", designation: "HOD", department: "Mathematics", subjects: ["Mathematics", "Physics"], experience: 15 },
  { name: "Mr. Suresh Babu", designation: "Teacher", department: "Science", subjects: ["Chemistry", "Science"], experience: 9 },
  { name: "Dr. Meena Krishnan", designation: "Senior Teacher", department: "Languages", subjects: ["Tamil", "English"], experience: 18 },
  { name: "Mr. Anand Swamy", designation: "Teacher", department: "Social Science", subjects: ["Social Science", "History"], experience: 7 },
  { name: "Mrs. Radha Kumari", designation: "HOD", department: "Science", subjects: ["Physics", "Chemistry"], experience: 14 },
  { name: "Mr. Balaji Raman", designation: "Senior Teacher", department: "Mathematics", subjects: ["Mathematics"], experience: 11 },
  { name: "Mrs. Suganya Devi", designation: "Teacher", department: "Languages", subjects: ["Tamil"], experience: 5 },
  { name: "Mr. Prasad Iyengar", designation: "Teacher", department: "Science", subjects: ["Biology"], experience: 8 },
  { name: "Mrs. Kamala Sundaram", designation: "Teacher", department: "Computer Science", subjects: ["Computer Science"], experience: 6 },
  { name: "Mr. Murugesan Pillai", designation: "Teacher", department: "Physical Education", subjects: ["Physical Education"], experience: 10 },
  { name: "Mrs. Usha Ranganathan", designation: "Vice Principal", department: "Administration", subjects: [], experience: 20 },
];

export const mockStaff: Staff[] = staffData.map((s, i) => ({
  _id: `stf${i + 1}`,
  staffId: `ST${2024}${String(i + 1).padStart(3, "0")}`,
  name: s.name,
  email: `${s.name.split(" ")[1].toLowerCase()}@sunwayglobalschool.edu`,
  phone: `9${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
  designation: s.designation,
  department: s.department,
  subjects: s.subjects,
  classes: [`cls${(i % 10) + 1}`, `cls${((i + 1) % 10) + 1}`],
  qualifications: `M.Sc., B.Ed.${i % 3 === 0 ? ", M.Ed." : ""}`,
  experience: s.experience,
  salary: 35000 + (s.experience * 1500),
  dateOfJoining: `${2024 - s.experience}-06-01`,
  gender: i % 2 === 0 ? "Female" : "Male",
  address: `${i + 10}, ${["Anna Nagar", "T Nagar", "Mylapore", "Adyar"][i % 4]}, Chennai`,
  isActive: true,
  createdAt: `${2024 - s.experience}-06-01T00:00:00.000Z`,
}));

// ==================== ATTENDANCE ====================
const today = new Date();
export const mockAttendance: AttendanceRecord[] = [];
for (let d = 0; d < 30; d++) {
  const date = new Date(today);
  date.setDate(date.getDate() - d);
  const dateStr = date.toISOString().split("T")[0];
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  if (!isWeekend) {
    mockStudents.slice(0, 15).forEach((student, i) => {
      const rand = Math.random();
      const status: AttendanceRecord["status"] = rand > 0.1 ? "Present" : rand > 0.05 ? "Absent" : "Late";
      mockAttendance.push({
        _id: `att${d}_${i}`,
        studentId: student._id,
        studentName: student.name,
        classId: student.classId,
        date: dateStr,
        status,
        markedBy: "stf1",
      });
    });
  }
}

// ==================== MARKS ====================
const subjects6A = ["Tamil", "English", "Mathematics", "Science", "Social Science"];
const examTypesList: ExamType[] = ["Unit Test 1", "Unit Test 2", "Mid Term", "Final"];
export const mockMarks: MarksRecord[] = [];
mockStudents.slice(0, 15).forEach((student, si) => {
  examTypesList.forEach((examType, ei) => {
    subjects6A.forEach((subject, subi) => {
      const base = 50 + (si % 3) * 10 + ei * 3;
      const marks = Math.min(100, base + Math.floor(Math.random() * 30));
      mockMarks.push({
        _id: `mrk${si}_${ei}_${subi}`,
        studentId: student._id,
        studentName: student.name,
        classId: student.classId,
        subject,
        examType,
        marksObtained: marks,
        maxMarks: 100,
        percentage: marks,
        grade: marks >= 91 ? "A+" : marks >= 81 ? "A" : marks >= 71 ? "B+" : marks >= 61 ? "B" : marks >= 51 ? "C+" : marks >= 41 ? "C" : marks >= 35 ? "D" : "F",
        academicYear: "2024-2025",
        uploadedBy: "stf1",
        createdAt: `2024-${String(ei * 3 + 7).padStart(2, "0")}-15T00:00:00.000Z`,
      });
    });
  });
});
// Aliases for backward compat
export const mockMarksRecords = mockMarks;
export const mockAttendanceRecords = mockAttendance;

// ==================== FEES ====================
export const mockFeeRecords: FeeRecord[] = mockStudents.flatMap((s) => s.fees);

// ==================== TIMETABLE ====================
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = [
  { start: "08:00", end: "08:45" },
  { start: "08:45", end: "09:30" },
  { start: "09:30", end: "10:15" },
  { start: "10:30", end: "11:15" },
  { start: "11:15", end: "12:00" },
  { start: "13:00", end: "13:45" },
  { start: "13:45", end: "14:30" },
  { start: "14:30", end: "15:15" },
];
const subjectRotation = ["Tamil", "English", "Mathematics", "Science", "Social Science", "Computer Science", "Physical Education", "Tamil"];

export const mockTimetable: TimetableSlot[] = [];
days.forEach((day, di) => {
  timeSlots.forEach((slot, pi) => {
    mockTimetable.push({
      _id: `tt_${di}_${pi}`,
      classId: "cls1",
      className: "6A",
      day,
      period: pi + 1,
      startTime: slot.start,
      endTime: slot.end,
      subject: subjectRotation[(di + pi) % subjectRotation.length],
      staffId: `stf${((di + pi) % 5) + 1}`,
      staffName: mockStaff[(di + pi) % 5].name,
      room: "Room 101",
    });
  });
});

// ==================== NOTIFICATIONS ====================
export const mockNotifications: Notification[] = [
  { _id: "notif1", title: "Annual Sports Day", message: "Annual Sports Day will be held on 25th April 2025. All students are requested to participate.", type: "info", targetRole: "all", isRead: false, createdBy: "admin001", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: "notif2", title: "Term 2 Exams Schedule", message: "Term 2 examinations will begin from May 5th, 2025. Timetable uploaded in portal.", type: "warning", targetRole: "all", isRead: false, createdBy: "admin001", createdAt: new Date(Date.now() - 172800000).toISOString() },
  { _id: "notif3", title: "Fee Due Reminder", message: "Q2 fee payment deadline is April 30th, 2025. Please pay on time to avoid late charges.", type: "warning", targetRole: "parent", isRead: true, createdBy: "admin001", createdAt: new Date(Date.now() - 259200000).toISOString() },
  { _id: "notif4", title: "Parent-Teacher Meeting", message: "PTM scheduled for April 20th, 2025 from 10 AM to 1 PM. Your attendance is important.", type: "info", targetRole: "parent", isRead: false, createdBy: "admin001", createdAt: new Date(Date.now() - 345600000).toISOString() },
  { _id: "notif5", title: "Holiday Notice", message: "School will be closed on April 14th on account of Tamil New Year (Puthandu).", type: "success", targetRole: "all", isRead: true, createdBy: "admin001", createdAt: new Date(Date.now() - 432000000).toISOString() },
  { _id: "notif6", title: "Staff Meeting", message: "Mandatory staff meeting on April 18th at 3:30 PM in the conference room.", type: "info", targetRole: "staff", isRead: false, createdBy: "admin001", createdAt: new Date(Date.now() - 518400000).toISOString() },
];

// ==================== MESSAGES ====================
export const mockMessages: Message[] = [
  { _id: "msg1", senderId: "par1", senderName: "Mr. Rajesh Kumar", senderRole: "parent", receiverId: "stf1", receiverName: "Mrs. Lakshmi Priya", receiverRole: "staff", subject: "Regarding my child's performance", content: "Dear Teacher, I wanted to discuss about Aarav's recent test scores in Mathematics. Can we schedule a meeting?", isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: "msg2", senderId: "stf1", senderName: "Mrs. Lakshmi Priya", senderRole: "staff", receiverId: "par1", receiverName: "Mr. Rajesh Kumar", receiverRole: "parent", subject: "Re: Regarding my child's performance", content: "Dear Mr. Rajesh, Aarav is doing well. His Math scores have improved this term. Please come on PTM day for a detailed discussion.", isRead: false, createdAt: new Date(Date.now() - 43200000).toISOString() },
  { _id: "msg3", senderId: "admin001", senderName: "Dr. Sunway Admin", senderRole: "admin", receiverId: "stf1", receiverName: "Mrs. Lakshmi Priya", receiverRole: "staff", subject: "Marks Entry Reminder", content: "Please ensure all Term 2 marks are entered into the system by April 20th.", isRead: false, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { _id: "msg4", senderId: "par2", senderName: "Mrs. Priya Nataraj", senderRole: "parent", receiverId: "stf1", receiverName: "Mrs. Lakshmi Priya", receiverRole: "staff", subject: "Absence notification", content: "Dear Teacher, Priya will be absent from April 15-16 due to a family function. Please note.", isRead: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

// ==================== DASHBOARD STATS ====================
export const mockDashboardStats: DashboardStats = {
  totalStudents: 412,
  totalStaff: 28,
  totalClasses: 18,
  activeStudents: 398,
  attendanceToday: 87,
  feeCollectionMonth: 2450000,
  pendingFees: 680000,
  upcomingExams: 3,
  recentAdmissions: 12,
  notifications: 6,
};

// ==================== CHART DATA ====================
export const enrollmentTrendData: ChartData[] = [
  { name: "Jun 2024", students: 380 },
  { name: "Jul 2024", students: 395 },
  { name: "Aug 2024", students: 398 },
  { name: "Sep 2024", students: 402 },
  { name: "Oct 2024", students: 405 },
  { name: "Nov 2024", students: 408 },
  { name: "Dec 2024", students: 406 },
  { name: "Jan 2025", students: 410 },
  { name: "Feb 2025", students: 412 },
  { name: "Mar 2025", students: 412 },
  { name: "Apr 2025", students: 415 },
];

export const attendanceMonthlyData: ChartData[] = [
  { name: "Jun", present: 92, absent: 8 },
  { name: "Jul", present: 88, absent: 12 },
  { name: "Aug", present: 90, absent: 10 },
  { name: "Sep", present: 94, absent: 6 },
  { name: "Oct", present: 87, absent: 13 },
  { name: "Nov", present: 91, absent: 9 },
  { name: "Dec", present: 85, absent: 15 },
  { name: "Jan", present: 89, absent: 11 },
  { name: "Feb", present: 93, absent: 7 },
  { name: "Mar", present: 91, absent: 9 },
  { name: "Apr", present: 87, absent: 13 },
];

export const feeCollectionData: ChartData[] = [
  { name: "Jun", collected: 2100000, pending: 350000 },
  { name: "Jul", collected: 2400000, pending: 280000 },
  { name: "Aug", collected: 1800000, pending: 420000 },
  { name: "Sep", collected: 2200000, pending: 300000 },
  { name: "Oct", collected: 2350000, pending: 250000 },
  { name: "Nov", collected: 1950000, pending: 400000 },
  { name: "Dec", collected: 2100000, pending: 350000 },
  { name: "Jan", collected: 2450000, pending: 230000 },
  { name: "Feb", collected: 2300000, pending: 270000 },
  { name: "Mar", collected: 2500000, pending: 200000 },
  { name: "Apr", collected: 2450000, pending: 680000 },
];

export const classWiseStrengthData: ChartData[] = mockClasses.map((c) => ({
  name: `Std ${c.name}${c.section}`,
  students: c.studentCount,
}));

export const subjectPerformanceData: ChartData[] = [
  { subject: "Tamil", average: 78 },
  { subject: "English", average: 82 },
  { subject: "Mathematics", average: 71 },
  { subject: "Science", average: 76 },
  { subject: "Social Science", average: 80 },
  { subject: "Computer Science", average: 85 },
];

export const gradeDistributionData: ChartData[] = [
  { name: "A+", value: 48, fill: "#10B981" },
  { name: "A", value: 82, fill: "#3B82F6" },
  { name: "B+", value: 105, fill: "#6366F1" },
  { name: "B", value: 89, fill: "#8B5CF6" },
  { name: "C+", value: 54, fill: "#F59E0B" },
  { name: "C", value: 22, fill: "#F97316" },
  { name: "D", value: 8, fill: "#EF4444" },
  { name: "F", value: 4, fill: "#DC2626" },
];

export const feeTypeBreakdownData: ChartData[] = [
  { name: "Tuition Fee", value: 68, fill: "#4F46E5" },
  { name: "Transport", value: 15, fill: "#7C3AED" },
  { name: "Lab Fee", value: 8, fill: "#0EA5E9" },
  { name: "Sports", value: 5, fill: "#10B981" },
  { name: "Library", value: 4, fill: "#F59E0B" },
];

export const weeklyAttendanceData: ChartData[] = [
  { day: "Mon", male: 188, female: 156 },
  { day: "Tue", male: 190, female: 158 },
  { day: "Wed", male: 185, female: 154 },
  { day: "Thu", male: 192, female: 160 },
  { day: "Fri", male: 178, female: 148 },
];

export const studentPerformanceRadarData = [
  { subject: "Tamil", score: 78, fullMark: 100 },
  { subject: "English", score: 85, fullMark: 100 },
  { subject: "Maths", score: 72, fullMark: 100 },
  { subject: "Science", score: 80, fullMark: 100 },
  { subject: "Social", score: 88, fullMark: 100 },
  { subject: "Computer", score: 92, fullMark: 100 },
];

export const parentStudentData = {
  student: mockStudents[0],
  marks: mockMarks.filter((m) => m.studentId === "stu1"),
  attendance: mockStudents[0].attendance!,
  notifications: mockNotifications.filter((n) => n.targetRole === "parent" || n.targetRole === "all"),
  messages: mockMessages.filter((m) => m.senderId === "par1" || m.receiverId === "par1"),
};
