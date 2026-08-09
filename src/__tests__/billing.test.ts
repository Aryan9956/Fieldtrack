import assert from 'assert';
import { calculateMonthlyBill, isPaymentEnabled } from '../lib/billing';

console.log('🧪 Running FieldTrack Core Business Rules & Pricing Tests...\n');

// 1. Pricing calculation: ₹19 per active employee
assert.strictEqual(calculateMonthlyBill(1).totalMonthlyCost, 19, '1 employee = ₹19/month');
console.log('✅ 1 employee = ₹19/month');

assert.strictEqual(calculateMonthlyBill(5).totalMonthlyCost, 95, '5 employees = ₹95/month');
console.log('✅ 5 employees = ₹95/month');

assert.strictEqual(calculateMonthlyBill(10).totalMonthlyCost, 190, '10 employees = ₹190/month');
console.log('✅ 10 employees = ₹190/month');

assert.strictEqual(calculateMonthlyBill(20).totalMonthlyCost, 380, '20 employees = ₹380/month');
console.log('✅ 20 employees = ₹380/month');

assert.strictEqual(calculateMonthlyBill(50).totalMonthlyCost, 950, '50 employees = ₹950/month');
console.log('✅ 50 employees = ₹950/month');

assert.strictEqual(calculateMonthlyBill(100).totalMonthlyCost, 1900, '100 employees = ₹1,900/month');
console.log('✅ 100 employees = ₹1,900/month');

// 2. Payment system status check
assert.strictEqual(isPaymentEnabled(), false, 'Payment processing MUST be disabled for ₹0 MVP');
console.log('✅ Payment processing status: DISABLED (₹0 MVP Mode)');

// 3. Edge cases
assert.strictEqual(calculateMonthlyBill(0).totalMonthlyCost, 0, '0 employees = ₹0');
assert.strictEqual(calculateMonthlyBill(-10).totalMonthlyCost, 0, 'Negative employees handled safely as 0');
console.log('✅ Edge case employee counts handled safely');

console.log('\n🎉 ALL BUSINESS RULE & PRICING VERIFICATION TESTS PASSED SUCCESSFULLY!');
