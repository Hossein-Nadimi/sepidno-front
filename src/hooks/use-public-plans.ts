"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { SubscriptionPlan } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface PlanResponse {
  success: boolean;
  data: {
    items: SubscriptionPlan[];
    meta: { total: number };
  };
}

export function usePublicPlans() {
  return useQuery({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const { data } = await axios.get<PlanResponse>(
        `${API_URL}/subscription-plans/public`,
      );
      return data.data.items;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
