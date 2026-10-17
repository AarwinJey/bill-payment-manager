import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Bill, PaymentRecord } from "../backend";
import { useActor } from "./useActor";

export function useGetBills() {
  const { actor, isFetching } = useActor();
  return useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBills();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPaymentHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentRecord[]>({
    queryKey: ["payment-history"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPaymentHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateBill() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      category: string;
      amount: number;
      dueDate: string;
      paymentMethod: string;
      chequeNumber: string | null;
      upiId: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createBill(
        params.name,
        params.category,
        params.amount,
        params.dueDate,
        params.paymentMethod,
        params.chequeNumber,
        params.upiId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useUpdateBillStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { billId: bigint; status: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateBillStatus(params.billId, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    },
  });
}

export function useUpdateBillStatusWithPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      billId: bigint;
      status: string;
      chequeNumber: string | null;
      upiId: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateBillStatusWithPayment(
        params.billId,
        params.status,
        params.chequeNumber,
        params.upiId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    },
  });
}

export function useUpdateBill() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      billId: bigint;
      name: string;
      category: string;
      amount: number;
      dueDate: string;
      paymentMethod: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateBill(
        params.billId,
        params.name,
        params.category,
        params.amount,
        params.dueDate,
        params.paymentMethod,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useDeleteBill() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (billId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteBill(billId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}
