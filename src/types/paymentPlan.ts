// src/types/database.ts - Payment Plan Types (add to existing file)

export interface PaymentPlan {
  id: number;
  invoice_number: string;
  student_admission_number: string;
  student_name: string;
  total_amount: number;
  status: 'draft' | 'active' | 'completed' | 'defaulted' | 'terminated';
  signed_status: 'signed' | 'not_signed';
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  school_representative: string;
  school_representative_title: string;
  created_date: string;
  signed_date?: string;
  notes?: string;
  milestones: PaymentPlanMilestone[];
  // Invoice details for display
  invoice_date: string;
  invoice_total_amount: number;
  invoice_balance_due: number;
}

export interface PaymentPlanMilestone {
  id: number;
  payment_plan_id: number;
  milestone_number: number;
  due_date: string;
  percentage_of_total: number;
  amount: number;
  description?: string;
  status: 'pending' | 'completed' | 'overdue';
  completed_date?: string;
  paid_amount?: number;
}

export interface PaymentPlanSubmissionData {
  invoice_number: string;
  student_admission_number: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  school_representative: string;
  school_representative_title: string;
  notes?: string;
  milestones: Omit<PaymentPlanMilestone, 'id' | 'payment_plan_id' | 'status' | 'completed_date' | 'paid_amount'>[];
}
