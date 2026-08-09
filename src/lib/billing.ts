export const PRICE_PER_EMPLOYEE = parseInt(process.env.PRICE_PER_EMPLOYEE || '19', 10);

export function isPaymentEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED === 'true';
}

export function calculateMonthlyBill(activeEmployeeCount: number): {
  activeEmployees: number;
  pricePerEmployee: number;
  totalMonthlyCost: number;
  isPaymentEnabled: boolean;
  currency: string;
} {
  const safeCount = Math.max(0, activeEmployeeCount);
  const total = safeCount * PRICE_PER_EMPLOYEE;

  return {
    activeEmployees: safeCount,
    pricePerEmployee: PRICE_PER_EMPLOYEE,
    totalMonthlyCost: total,
    isPaymentEnabled: isPaymentEnabled(),
    currency: 'INR',
  };
}
