import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PaymentRecord {
    billName: string;
    amount: number;
    paidAt: bigint;
    billId: bigint;
}
export interface Bill {
    id: bigint;
    status: string;
    paymentMethod: string;
    chequeNumber?: string;
    owner: Principal;
    name: string;
    createdAt: bigint;
    dueDate: string;
    upiId?: string;
    category: string;
    amount: number;
    paidAt?: bigint;
}
export interface UserProfile {
    name: string;
}
export interface Summary {
    unpaidCount: bigint;
    totalAmountDue: number;
    totalBills: bigint;
    paidCount: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBill(name: string, category: string, amount: number, dueDate: string, paymentMethod: string, chequeNumber: string | null, upiId: string | null): Promise<bigint>;
    deleteBill(billId: bigint): Promise<boolean>;
    getBills(): Promise<Array<Bill>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPaymentHistory(): Promise<Array<PaymentRecord>>;
    getSummary(): Promise<Summary>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBill(billId: bigint, name: string, category: string, amount: number, dueDate: string, paymentMethod: string): Promise<boolean>;
    updateBillStatus(billId: bigint, status: string): Promise<boolean>;
    updateBillStatusWithPayment(billId: bigint, status: string, chequeNumber: string | null, upiId: string | null): Promise<boolean>;
}
