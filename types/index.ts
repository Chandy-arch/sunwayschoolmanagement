// Core Types for Praba School Management System

export type UserRole = "admin" | "staff" | "parent" | "student";

export type Gender = "Male" | "Female" | "Other";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Holiday";

export type FeeStatus = "Paid" | "Pending" | "Partial" | "Overdue";

export type ExamType = "Unit Test 1" | "Unit Test 2" | "Term 1" | "Mid Term" | "Term 2" | "Annual" | "Final";

export type Grade = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  _id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  address: string;
  photo?: string;
  classId: string;
  className: string;
  section: string;
  rollNumber: number;
  parentId: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  hasParentAccount?: boolean;
  admissionDate: string;
  admissionNumber: string;
  isActive: boolean;
  fees: FeeRecord[];
  attendance?: AttendanceSummary;
  createdAt: string;
}

export interface Staff {
  _id: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  subjects: string[];
  classes: string[];
  qualifications: string;
  experience: number;
  salary: number;
  dateOfJoining: string;
  gender: Gender;
  address: string;
  photo?: string;
  teacherType?: "class_teacher" | "subject_teacher";
  userId?: string;
  hasLoginAccount?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Class {
  _id: string;
  name: string;
  section: string;
  classTeacherId: string;
  classTeacherName: string;
  subjects: string[];
  studentCount: number;
  room: string;
  academicYear: string;
}

export interface Subject {
  name: string;
  code: string;
  maxMarks: number;
  passingMarks: number;
  teacherId?: string;
  teacherName?: string;
}

export interface AttendanceRecord {
  _id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  remarks?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
}

export interface MarksRecord {
  _id: string;
  studentId: string;
  studentName: string;
  classId: string;
  subject: string;
  examType: ExamType;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: Grade;
  academicYear: string;
  uploadedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface FeeRecord {
  _id: string;
  studentId: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidDate?: string;
  status: FeeStatus;
  academicYear: string;
  receiptNumber?: string;
  paymentMethod?: string;
  remarks?: string;
}

export interface Fee extends FeeRecord {
  studentName: string;
  className: string;
  section: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableSlot {
  _id: string;
  classId: string;
  className: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subject: string;
  staffId: string;
  staffName: string;
  room: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  targetRole: UserRole | "all";
  targetIds?: string[];
  isRead: boolean;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  receiverName: string;
  receiverRole: UserRole;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ReportCard {
  student: Student;
  academicYear: string;
  examType: ExamType;
  marks: MarksRecord[];
  attendance: AttendanceSummary;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: Grade;
  rank?: number;
  classTeacherRemarks?: string;
  principalRemarks?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalClasses: number;
  activeStudents: number;
  attendanceToday: number;
  feeCollectionMonth: number;
  pendingFees: number;
  upcomingExams: number;
  recentAdmissions: number;
  notifications: number;
}

export interface ChartData {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}
