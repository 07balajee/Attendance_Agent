import { ExpenseRequest, ExpenseStatus } from '../types/expense';
import { MOCK_EXPENSES } from '../data/mockExpenses';

let expenses: ExpenseRequest[] = [...MOCK_EXPENSES];

export const expenseService = {
  async getExpenses(filters?: {
    status?: ExpenseStatus | 'All' | 'SLA Breached' | 'Escalated';
    department?: string;
    search?: string;
  }): Promise<ExpenseRequest[]> {
    await new Promise((r) => setTimeout(r, 150));
    let list = [...expenses];

    if (filters?.status && filters.status !== 'All') {
      if (filters.status === 'SLA Breached') {
        list = list.filter((r) => r.sla_status === 'breached');
      } else if (filters.status === 'Escalated') {
        list = list.filter((r) => r.reviewed_by?.includes('auto-escalated'));
      } else {
        list = list.filter((r) => r.status === filters.status);
      }
    }
    if (filters?.department && filters.department !== 'All Departments') {
      list = list.filter((r) => r.department === filters.department);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.employee_name.toLowerCase().includes(q) ||
          r.employee_id.toLowerCase().includes(q) ||
          r.expense_type.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async approveExpense(id: string, reviewer: string = 'Finance Manager'): Promise<ExpenseRequest> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expense claim not found');

    expenses[idx] = {
      ...expenses[idx],
      status: 'Approved',
      reviewed_by: reviewer,
      reviewed_on: new Date().toISOString(),
      management_note: 'Expense reviewed and approved for reimbursement.',
    };

    return expenses[idx];
  },

  async rejectExpense(
    id: string,
    reviewer: string = 'Finance Manager',
    reason: string = 'Policy limit exceeded'
  ): Promise<ExpenseRequest> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expense claim not found');

    expenses[idx] = {
      ...expenses[idx],
      status: 'Rejected',
      reviewed_by: reviewer,
      reviewed_on: new Date().toISOString(),
      management_note: reason,
    };

    return expenses[idx];
  },
};
