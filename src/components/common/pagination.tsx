"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, totalPages, hasNext, hasPrev, onPageChange }: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center gap-3 border-t px-4 py-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground">
        نمایش {toPersianDigits(from)} تا {toPersianDigits(to)} از {toPersianDigits(total)} مورد
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
          <ChevronRight className="size-4" />
          قبلی
        </Button>
        <span className="text-sm">
          صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
        </span>
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          بعدی
          <ChevronLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}
