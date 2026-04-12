"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, ChevronLeft, Bell } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useNotifications } from "@/components/providers/NotificationContext";
import { Message } from "@/types";
import { mockMessages } from "@/lib/mock-data";

interface ChatThread {
  id: string;
  name: string;
  role: string;
  initials: string;
  colorIndex: number;
}

const contacts: ChatThread[] = [
  { id: "t1", name: "Mrs. Lakshmi Priya", role: "Class Teacher", initials: "LP", colorIndex: 0 },
  { id: "t2", name: "Mr. Vijay Kumar", role: "Math Teacher", initials: "VK", colorIndex: 1 },
  { id: "t3", name: "Mrs. Divya Menon", role: "Science Teacher", initials: "DM", colorIndex: 2 },
  { id: "a1", name: "School Admin", role: "Administration", initials: "SA", colorIndex: 3 },
];

interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
}

const seedMessages: Record<string, ChatMessage[]> = {
  t1: [
    { id: "s1", text: "Hello! Aarav is doing well in class.", sender: "them", time: "10:30 AM" },
    { id: "s2", text: "His Math scores improved this term.", sender: "them", time: "10:31 AM" },
  ],
  t2: [
    { id: "s3", text: "Please remind Aarav to submit the homework.", sender: "them", time: "Yesterday" },
  ],
  t3: [],
  a1: [
    { id: "s4", text: "Fee deadline is April 30th. Please pay on time.", sender: "them", time: "2 days ago" },
  ],
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>(seedMessages);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotifications();

  const totalUnread = Object.values(threads).reduce((sum, msgs) => {
    const last = msgs[msgs.length - 1];
    return last?.sender === "them" ? sum + 1 : sum;
  }, 0);

  useEffect(() => {
    if (open && activeThread) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, activeThread, threads]);

  const handleSend = () => {
    if (!input.trim() || !activeThread) return;
    const contact = contacts.find((c) => c.id === activeThread)!;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const myMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      text: input.trim(),
      sender: "me",
      time: timeStr,
    };

    setThreads((prev) => ({
      ...prev,
      [activeThread]: [...(prev[activeThread] || []), myMsg],
    }));
    setInput("");

    // Create notification for the sent message
    addNotification({
      title: `Message sent to ${contact.name}`,
      message: input.trim(),
      type: "info",
      targetRole: "all",
      createdBy: "me",
    });

    // Simulate a reply after 2 seconds
    setTimeout(() => {
      const replies = [
        "Thank you for reaching out. I'll get back to you soon.",
        "Noted. I'll look into this and respond shortly.",
        "Got it! I'll keep you updated.",
        "Sure, let's discuss this further.",
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg: ChatMessage = {
        id: `msg_${Date.now()}_reply`,
        text: replyText,
        sender: "them",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setThreads((prev) => ({
        ...prev,
        [activeThread]: [...(prev[activeThread] || []), replyMsg],
      }));
      addNotification({
        title: `New message from ${contact.name}`,
        message: replyText,
        type: "success",
        targetRole: "all",
        createdBy: contact.id,
      });
    }, 2000);
  };

  const activeContact = contacts.find((c) => c.id === activeThread);
  const activeMessages = activeThread ? threads[activeThread] || [] : [];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center justify-center transition-all active:scale-95"
        aria-label="Open Chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center ring-2 ring-white">
            {totalUnread}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            {activeThread ? (
              <>
                <button
                  onClick={() => setActiveThread(null)}
                  className="hover:bg-indigo-700 rounded-lg p-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <Avatar name={activeContact!.name} size="sm" colorIndex={activeContact!.colorIndex} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{activeContact!.name}</p>
                  <p className="text-indigo-200 text-xs">{activeContact!.role}</p>
                </div>
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Messages</p>
                  <p className="text-indigo-200 text-xs">{contacts.length} contacts</p>
                </div>
                <Bell className="w-4 h-4 text-indigo-200" />
              </>
            )}
          </div>

          {/* Content */}
          {!activeThread ? (
            /* Contact List */
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {contacts.map((contact) => {
                const msgs = threads[contact.id] || [];
                const lastMsg = msgs[msgs.length - 1];
                const hasUnread = lastMsg?.sender === "them";
                return (
                  <button
                    key={contact.id}
                    onClick={() => setActiveThread(contact.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar name={contact.name} size="md" colorIndex={contact.colorIndex} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-gray-900 truncate">{contact.name}</p>
                        {lastMsg && (
                          <p className="text-xs text-gray-400 flex-shrink-0 ml-1">{lastMsg.time}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {lastMsg ? lastMsg.text : "Start a conversation…"}
                      </p>
                    </div>
                    {hasUnread && (
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Message Thread */
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {activeMessages.length === 0 && (
                  <p className="text-center text-xs text-gray-400 mt-8">No messages yet. Send one!</p>
                )}
                {activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        msg.sender === "me"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p
                        className={`text-xs mt-0.5 ${
                          msg.sender === "me" ? "text-indigo-200 text-right" : "text-gray-400"
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 flex-shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message…"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
