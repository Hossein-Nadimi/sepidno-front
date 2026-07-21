"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Send, Paperclip, Loader2, X, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { ticketService, type TicketMessage } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/common/loading";
import { resolveMediaUrl, toPersianDigits } from "@/lib/utils";
import { toJalaliDateTime } from "@/lib/jalali";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "باز", variant: "default" },
  pending: { label: "در انتظار", variant: "secondary" },
  answered: { label: "پاسخ داده شده", variant: "default" },
  closed: { label: "بسته شده", variant: "outline" },
};

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", params.id],
    queryFn: () => ticketService.get(params.id),
    enabled: !!params.id,
  });

  const { data: messagesData } = useQuery({
    queryKey: ["ticket-messages", params.id],
    queryFn: () => ticketService.messages.list(params.id),
    enabled: !!params.id,
    refetchInterval: 10_000,
  });

  // Sort messages: oldest first (chronological order)
  const messages = (messagesData?.items || []).slice().sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: () => ticketService.messages.create(params.id, { message, attachments }),
    onSuccess: () => {
      setMessage("");
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", params.id] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => ticketService.update(params.id, { status: "closed" }),
    onSuccess: () => {
      toast.success("تیکت بسته شد");
      queryClient.invalidateQueries({ queryKey: ["ticket", params.id] });
    },
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const url = await ticketService.uploadAttachment(file);
      setAttachments([...attachments, url]);
      toast.success("تصویر اضافه شد");
    } catch {
      toast.error("خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="جزئیات تیکت" />
        <PageLoading />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <PageHeader title="جزئیات تیکت" />
        <p className="text-muted-foreground">تیکت یافت نشد</p>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[ticket.status] || { label: ticket.status, variant: "outline" as const };
  const isClosed = ticket.status === "closed";

  return (
    <div className="space-y-4">
      <PageHeader
        title={ticket.title}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowRight className="size-4 ml-1" />
            بازگشت
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        {!isClosed && (
          <Button variant="ghost" size="sm" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
            بستن تیکت
          </Button>
        )}
      </div>

      {/* Chat area */}
      <Card className="flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm">پیام‌های تیکت ({toPersianDigits(messages.length)} پیام)</CardTitle>
        </CardHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">هنوز پیامی ارسال نشده است</p>
          ) : (
            messages.map((msg: TicketMessage) => (
              <div key={msg._id} className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 ${msg.isAdmin ? "bg-primary/10" : "bg-primary text-primary-foreground"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.isAdmin && (
                      <span className="text-xs font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">پشتیبانی</span>
                    )}
                    <span className="text-xs opacity-70">{toJalaliDateTime(msg.createdAt)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-line break-words">{msg.message}</p>
                  {msg.attachments?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.attachments.map((url, i) => (
                        <a key={i} href={resolveMediaUrl(url)} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveMediaUrl(url)}
                            alt="ضمیمه"
                            className="size-20 rounded-lg object-cover border"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="border-t p-2 flex flex-wrap gap-2">
            {attachments.map((url, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveMediaUrl(url)} alt="پیش‌نمایش" className="size-16 rounded-lg object-cover border" />
                <button
                  type="button"
                  className="absolute -top-1 -left-1 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        {!isClosed ? (
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
              </Button>
              <Textarea
                rows={1}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="پیام خود را وارد کنید..."
                className="flex-1 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim() && !sendMutation.isPending) {
                      sendMutation.mutate();
                    }
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                className="shrink-0"
                disabled={!message.trim() || sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
              >
                {sendMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t p-4 text-center text-sm text-muted-foreground">
            این تیکت بسته شده است
          </div>
        )}
      </Card>
    </div>
  );
}
