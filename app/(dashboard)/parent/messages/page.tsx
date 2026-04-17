"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton, DialogFooter } from "@/components/ui/dialog";
import { Send, Bell, MessageSquare, CheckCheck, Loader2, Inbox } from "lucide-react";

interface ChildData {
  _id: string;
  name: string;
  className: string;
  section: string;
}

interface MessageItem {
  _id: string;
  senderName: string;
  subject: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  priority: string;
  isRead: boolean;
}

export default function ParentMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [composeSent, setComposeSent] = useState(false);

  // Placeholder data — will be real once Message model & API are built
  const messages: MessageItem[] = [];
  const notifications: NotificationItem[] = [];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parent/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data.children.length > 0) {
          setChildren(json.data.children);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCompose = () => {
    if (!body.trim()) return;
    setComposeSent(true);
    setTimeout(() => {
      setComposeOpen(false);
      setComposeSent(false);
      setSubject("");
      setBody("");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <Button variant="default" onClick={() => setComposeOpen(true)}>
          <Send className="w-4 h-4 mr-2" /> Message Teacher
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Messages List */}
        <div className="xl:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">Inbox</h3>
          {messages.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <Inbox className="w-7 h-7 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-500">No messages yet</p>
                <p className="text-xs text-gray-400">Messaging backend coming soon</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((msg, i) => (
              <div key={msg._id} className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3 p-4">
                  <Avatar name={msg.senderName} size="md" colorIndex={i % 8} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{msg.senderName}</p>
                        <p className="font-medium text-gray-800 text-sm mt-0.5">{msg.subject}</p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <p className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                        {!msg.isRead && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notifications + Children */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">School Notifications</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {notifications.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2 text-center">
                  <Bell className="w-6 h-6 text-gray-300" />
                  <p className="text-xs text-gray-400">No notifications</p>
                  <p className="text-xs text-gray-300">Notifications backend coming soon</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 4).map((notif) => (
                    <div key={notif._id} className={`flex gap-2.5 p-3 rounded-xl ${!notif.isRead ? "bg-purple-50" : "bg-gray-50"}`}>
                      <Bell className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                          <Badge variant={notif.priority === "high" ? "destructive" : "secondary"} className="text-xs py-0">{notif.priority}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Children */}
          {children.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">My Children</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {children.map((c, i) => (
                  <div key={c._id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50">
                    <Avatar name={c.name} size="sm" colorIndex={i + 2} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">Class {c.className} {c.section}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="lg">
        <DialogHeader>
          <DialogTitle>Message a Teacher</DialogTitle>
          <DialogCloseButton onClose={() => setComposeOpen(false)} />
        </DialogHeader>
        <DialogContent>
          {composeSent ? (
            <div className="py-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCheck className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="font-bold text-gray-900">Message Sent!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Regarding</label>
                {children.length > 0 && (
                  <p className="text-xs text-gray-400 mb-2">for {children.map((c) => c.name).join(", ")}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Regarding attendance on 12th Jan"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Type your message here…"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              </div>
            </div>
          )}
        </DialogContent>
        {!composeSent && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={handleCompose} disabled={!body.trim()}>
              <Send className="w-3.5 h-3.5 mr-1.5" /> Send
            </Button>
          </DialogFooter>
        )}
      </Dialog>
    </div>
  );
}
