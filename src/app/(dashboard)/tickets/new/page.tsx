"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Paperclip, X, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { ticketService } from "@/services";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveMediaUrl } from "@/lib/utils";

export default function NewTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create ticket
      const ticket = await ticketService.create({ title, priority });
      // Step 2: Send initial message with attachments
      if (message.trim() || attachments.length > 0) {
        await ticketService.messages.create(ticket._id, { message: message || "—", attachments });
      }
      return ticket;
    },
    onSuccess: (ticket) => {
      toast.success("تیکت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      router.push(`/tickets/${ticket._id}`);
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="تیکت جدید"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowRight className="size-4 ml-1" />
            بازگشت
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات تیکت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>عنوان تیکت *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="موضوع تیکت را وارد کنید"
            />
          </div>

          <div className="space-y-2">
            <Label>اولویت</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">کم</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="high">زیاد</SelectItem>
                <SelectItem value="urgent">فوری</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>متن پیام *</Label>
            <Textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="مشکل یا سوال خود را به‌طور کامل توضیح دهید..."
            />
          </div>

          {/* Attachment upload */}
          <div className="space-y-2">
            <Label>ضمیمه تصویر (اختیاری)</Label>
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
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4 ml-1" />}
              آپلود تصویر
            </Button>
            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((url, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveMediaUrl(url)} alt="پیش‌نمایش" className="size-20 rounded-lg object-cover border" />
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
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => router.back()}>انصراف</Button>
            <Button
              disabled={!title.trim() || !message.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "ایجاد تیکت"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
