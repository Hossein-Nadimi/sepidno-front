"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Help button + modal — shows a guide for the current page.
 *
 * Usage:
 * <PageHelp
 *   title="راهنمای ثبت سفارش"
 *   sections={[
 *     { title: "انتخاب مشتری", body: "ابتدا مشتری را جستجو کنید..." },
 *     { title: "افزودن لباس", body: "روی تب لباس مورد نظر بزنید..." },
 *   ]}
 * />
 */
export function PageHelp({
  title,
  sections,
}: {
  title: string;
  sections: Array<{ title: string; body: string }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="size-4" />
        <span className="hidden sm:inline">راهنما</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" />
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {sections.map((section, i) => (
              <div key={i} className="space-y-1">
                <h4 className="text-sm font-bold text-primary">{section.title}</h4>
                <p className="text-sm text-muted-foreground leading-6 whitespace-pre-line">{section.body}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setOpen(false)}>متوجه شدم</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
