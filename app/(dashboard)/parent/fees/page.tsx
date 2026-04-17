"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import PieChartComponent from "@/components/charts/PieChartComponent";
import { Check, AlertCircle, Receipt, IndianRupee, Loader2 } from "lucide-react";

interface FeeRecord {
  _id: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  paymentDate?: string;
  paymentMethod?: string;
}

interface ChildData {
  _id: string;
  name: string;
  className: string;
  fees: FeeRecord[];
  totalFeesDue: number;
}

const statusColors: Record<string, string> = {
  Paid: "success",
  Pending: "warning",
  Overdue: "destructive",
  Partial: "info",
};

export default function ParentFeesPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [payMethod, setPayMethod] = useState("upi");
  const [paySuccess, setPaySuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parent/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data.children.length > 0) {
          setChildren(json.data.children);
          setSelectedChild(json.data.children[0]);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const child = selectedChild;
  const myFees = child?.fees ?? [];

  const paid = useMemo(() => myFees.filter((f) => f.status === "Paid"), [myFees]);
  const pending = useMemo(() => myFees.filter((f) => f.status === "Pending"), [myFees]);
  const overdue = useMemo(() => myFees.filter((f) => f.status === "Overdue"), [myFees]);

  const totalDue = myFees.reduce((a, f) => a + f.amount, 0);
  const totalPaid = paid.reduce((a, f) => a + f.paidAmount, 0);
  const totalPending = myFees.filter((f) => f.status !== "Paid").reduce((a, f) => a + (f.amount - f.paidAmount), 0);

  // Build fee type breakdown for pie chart
  const feeTypeData = useMemo(() => {
    const map = new Map<string, number>();
    myFees.forEach((f) => {
      map.set(f.feeType, (map.get(f.feeType) || 0) + f.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [myFees]);

  const openPay = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPayOpen(true);
    setPaySuccess(false);
  };

  const handlePay = () => {
    setPaySuccess(true);
    setTimeout(() => { setPayOpen(false); setPaySuccess(false); }, 2000);
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

  return (
    <div className="space-y-5">
      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-2">
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

      {/* Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Annual Fee", value: formatCurrency(totalDue), color: "text-gray-900", bg: "bg-gray-50" },
          { label: "Total Paid", value: formatCurrency(totalPaid), color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Outstanding", value: formatCurrency(totalPending), color: totalPending > 0 ? "text-red-500" : "text-gray-400", bg: totalPending > 0 ? "bg-red-50" : "bg-gray-50" },
          { label: "Overdue", value: overdue.length, color: overdue.length > 0 ? "text-red-600" : "text-gray-400", bg: overdue.length > 0 ? "bg-red-50" : "bg-gray-50" },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} rounded-2xl p-4 text-center border border-gray-100`}>
            <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {overdue.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          You have {overdue.length} overdue payment(s). Please pay immediately to avoid penalties.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Fee Table */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Fee Details — {child.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs text-gray-500 font-semibold">Fee Type</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-semibold hidden sm:table-cell">Due Date</th>
                      <th className="text-right py-2 text-xs text-gray-500 font-semibold">Amount</th>
                      <th className="text-center py-2 text-xs text-gray-500 font-semibold">Status</th>
                      <th className="text-center py-2 text-xs text-gray-500 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myFees.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No fee records found</td></tr>
                    )}
                    {myFees.map((fee) => (
                      <tr key={fee._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-3">
                          <p className="font-semibold text-gray-900">{fee.feeType}</p>
                        </td>
                        <td className="py-3 hidden sm:table-cell text-gray-500 text-xs">{formatDate(fee.dueDate)}</td>
                        <td className="py-3 text-right font-bold text-gray-900">{formatCurrency(fee.amount)}</td>
                        <td className="py-3 text-center">
                          <Badge variant={statusColors[fee.status] as any} className="text-xs">{fee.status}</Badge>
                        </td>
                        <td className="py-3 text-center">
                          {fee.status !== "Paid" ? (
                            <Button size="sm" variant="default" onClick={() => openPay(fee)}>
                              Pay
                            </Button>
                          ) : (
                            <span className="text-emerald-600 text-xs font-semibold flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Paid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="space-y-4">
          {feeTypeData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fee Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartComponent
                  data={feeTypeData}
                  height={200}
                  innerRadius={50}
                />
              </CardContent>
            </Card>
          )}

          {totalDue > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Payment Progress</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Paid</span>
                    <span>{Math.round((totalPaid / totalDue) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                      style={{ width: `${(totalPaid / totalDue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)} paid</span>
                  <span className="font-semibold text-red-500">{formatCurrency(totalPending)} due</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pay Dialog */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)} maxWidth="md">
        <DialogHeader>
          <DialogTitle>Pay Fee</DialogTitle>
          <DialogCloseButton onClose={() => setPayOpen(false)} />
        </DialogHeader>
        <DialogContent>
          {paySuccess ? (
            <div className="py-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="font-bold text-gray-900 text-lg">Payment Successful!</p>
              <p className="text-sm text-gray-500">Receipt has been sent to your registered email.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-xs text-indigo-600 font-semibold mb-1">{selectedFee?.feeType}</p>
                <p className="text-3xl font-extrabold text-indigo-800">{formatCurrency(selectedFee?.amount ?? 0)}</p>
                <p className="text-xs text-indigo-500 mt-0.5">due {formatDate(selectedFee?.dueDate ?? "")}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "upi", label: "UPI", icon: "💳" },
                    { id: "card", label: "Card", icon: "🏦" },
                    { id: "netbanking", label: "Net Banking", icon: "🌐" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        payMethod === m.id ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {payMethod === "upi" && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">UPI ID</label>
                  <input
                    defaultValue="parent@okaxis"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
        {!paySuccess && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={handlePay}>
              <IndianRupee className="w-3.5 h-3.5 mr-1.5" />
              Pay {formatCurrency(selectedFee?.amount ?? 0)}
            </Button>
          </DialogFooter>
        )}
      </Dialog>
    </div>
  );
}
