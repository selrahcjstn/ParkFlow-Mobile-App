import { useCallback, useRef, useState } from "react";
import { violationService } from "@/features/violation/services/violation.service";
import { PaymentRecord } from "../types/payment.types";

const PAGE_SIZE = 20;

/** Payment / penalty history, loaded from the violation history API. */
export function usePaymentHistory() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const lastFetchedAt = useRef(0);
  const inFlight = useRef(false);

  const load = useCallback(async (next = 1, manual = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await violationService.getViolationHistory(next, PAGE_SIZE);
      if (!response.isSuccess) throw new Error(response.message || "Could not load transactions.");
      const rows = (response.data?.items || []).map((v: any): PaymentRecord => ({
        id: v.violationId || v.id || v.referenceNumber,
        plateNumber: v.plateNumber || "",
        name: [v.ownerFirstName || v.firstName, v.ownerLastName || v.lastName].filter(Boolean).join(" "),
        amount: Number(v.penaltyFee ?? 0),
        date: v.paidAt || v.issuedAt || v.createdAt,
        status: v.isPaid || v.settlementStatus === "Settled" ? "Paid" : "Pending",
        referenceNumber: v.referenceNumber,
        violationType: v.violationType,
      }));
      setPayments((previous) => (next === 1 ? rows : [...previous, ...rows]));
      setPage(next);
      setHasMore(rows.length === PAGE_SIZE);
      if (next === 1) lastFetchedAt.current = Date.now();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Could not load transactions.");
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /** Skip the request when the list was loaded recently (tab switches). */
  const refreshIfStale = useCallback(
    async (maxAgeMs = 60_000) => {
      if (Date.now() - lastFetchedAt.current < maxAgeMs) return;
      await load(1);
    },
    [load],
  );

  const refresh = useCallback(() => load(1, true), [load]);
  const loadMore = useCallback(() => {
    if (hasMore && !loading) void load(page + 1);
  }, [hasMore, loading, load, page]);

  return { payments, loading, refreshing, error, hasMore, refresh, refreshIfStale, loadMore };
}
