// src/services/expenseService.ts

import { supabase } from '../supabaseClient';
import {
    Expense,
    ExpenseCategory,
    ExpenseDescription,
    ExpenseVendor,
    ExpensePaidThrough,
    ExpenseSubmissionData
} from '../types/database';

// ============================================================================
// EXPENSE LOOKUP TABLES (Customizable Dropdowns)
// ============================================================================

/**
 * Fetches all expense categories
 */
export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching expense categories:', error);
        throw new Error('Failed to fetch expense categories');
    }

    return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        sort_order: item.sort_order || 0,
        is_active: item.is_active ?? true,
        created_at: item.created_at,
        updated_at: item.updated_at
    }));
}

/**
 * Fetches expense descriptions for a specific category
 */
export async function fetchExpenseDescriptions(categoryId: number): Promise<ExpenseDescription[]> {
    const { data, error } = await supabase
        .from('expense_descriptions')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching expense descriptions:', error);
        throw new Error('Failed to fetch expense descriptions');
    }

    return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        category_id: item.category_id,
        sort_order: item.sort_order || 0,
        is_active: item.is_active ?? true,
        created_at: item.created_at,
        updated_at: item.updated_at
    }));
}

/**
 * Fetches all expense vendors
 */
export async function fetchExpenseVendors(): Promise<ExpenseVendor[]> {
    const { data, error } = await supabase
        .from('expense_vendors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching expense vendors:', error);
        throw new Error('Failed to fetch expense vendors');
    }

    return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        sort_order: item.sort_order || 0,
        is_active: item.is_active ?? true,
        created_at: item.created_at,
        updated_at: item.updated_at
    }));
}

/**
 * Fetches all expense paid through options
 */
export async function fetchExpensePaidThrough(): Promise<ExpensePaidThrough[]> {
    const { data, error } = await supabase
        .from('expense_paid_through')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching expense paid through options:', error);
        throw new Error('Failed to fetch expense paid through options');
    }

    return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        sort_order: item.sort_order || 0,
        is_active: item.is_active ?? true,
        created_at: item.created_at,
        updated_at: item.updated_at
    }));
}

// ============================================================================
// EXPENSE CRUD OPERATIONS
// ============================================================================

/**
 * Fetches all expenses (non-voided)
 */
export async function fetchExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
        .from('expenses_view')
        .select('*')
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching expenses:', error);
        throw new Error('Failed to fetch expenses');
    }

    return (data || []).map(item => {
        // Calculate balance_due if not present in database
        let balanceDue = 0;
        if (item.balance_due !== undefined && item.balance_due !== null) {
            balanceDue = parseFloat(item.balance_due);
        } else {
            // Fallback: calculate from payment status
            balanceDue = item.payment_status === 'Unpaid' ? parseFloat(item.amount) : 0;
        }
        
        const expense: Expense & { balance_due?: number; notes?: string | null } = {
            id: item.id,
            internal_reference: item.internal_reference,
            expense_date: item.expense_date,
            category_id: item.category_id,
            description_id: item.description_id,
            amount: parseFloat(item.amount),
            vendor_id: item.vendor_id,
            paid_through_id: item.paid_through_id,
            payment_status: item.payment_status,
            due_date: item.due_date,
            date_paid: item.date_paid,
            payment_reference_no: item.payment_reference_no,
            is_voided: item.is_voided ?? false,
            created_at: item.created_at,
            updated_at: item.updated_at,
            category_name: item.category_name,
            description_name: item.description_name,
            vendor_name: item.vendor_name,
            paid_through_name: item.paid_through_name
        };
        
        // Only add optional fields if they exist in the database response
        if (item.balance_due !== undefined) {
            expense.balance_due = balanceDue;
        }
        if (item.notes !== undefined) {
            expense.notes = item.notes || null;
        }
        
        return expense;
    });
}

/**
 * Creates a new expense
 */
export async function createExpense(data: ExpenseSubmissionData & { notes?: string | null; balance_due?: number }): Promise<Expense> {
    // Build insert object with only fields that exist in the database
    const insertData: any = {
        expense_date: data.expense_date,
        category_id: data.category_id,
        description_id: data.description_id || null,
        amount: data.amount,
        vendor_id: data.vendor_id || null,
        paid_through_id: data.paid_through_id || null,
        payment_status: data.payment_status,
        due_date: data.due_date || null,
        date_paid: data.date_paid || null,
        payment_reference_no: data.payment_reference_no || null
    };
    
    // Only add optional fields if they are provided (database may not have these columns yet)
    if (data.notes !== undefined) {
        insertData.notes = data.notes;
    }
    if (data.balance_due !== undefined) {
        insertData.balance_due = data.balance_due;
    }
    
    const { data: expenseData, error } = await supabase
        .from('expenses')
        .insert(insertData)
        .select()
        .single();

    if (error || !expenseData) {
        console.error('Error creating expense:', error);
        throw new Error('Failed to create expense');
    }

    // Fetch the complete expense with joined data
    const { data: fullExpense, error: fetchError } = await supabase
        .from('expenses_view')
        .select('*')
        .eq('id', expenseData.id)
        .single();

    if (fetchError || !fullExpense) {
        console.error('Error fetching created expense:', fetchError);
        throw new Error('Failed to fetch created expense');
    }

    return {
        id: fullExpense.id,
        internal_reference: fullExpense.internal_reference,
        expense_date: fullExpense.expense_date,
        category_id: fullExpense.category_id,
        description_id: fullExpense.description_id,
        amount: parseFloat(fullExpense.amount),
        vendor_id: fullExpense.vendor_id,
        paid_through_id: fullExpense.paid_through_id,
        payment_status: fullExpense.payment_status,
        due_date: fullExpense.due_date,
        date_paid: fullExpense.date_paid,
        payment_reference_no: fullExpense.payment_reference_no,
        is_voided: fullExpense.is_voided ?? false,
        created_at: fullExpense.created_at,
        updated_at: fullExpense.updated_at,
        category_name: fullExpense.category_name,
        description_name: fullExpense.description_name,
        vendor_name: fullExpense.vendor_name,
        paid_through_name: fullExpense.paid_through_name
    };
}

/**
 * Updates an existing expense
 */
export async function updateExpense(expenseId: number, data: ExpenseSubmissionData & { notes?: string | null; balance_due?: number }): Promise<Expense> {
    // Build update object with only fields that exist in the database
    const updateData: any = {
        expense_date: data.expense_date,
        category_id: data.category_id,
        description_id: data.description_id || null,
        amount: data.amount,
        vendor_id: data.vendor_id || null,
        paid_through_id: data.paid_through_id || null,
        payment_status: data.payment_status,
        due_date: data.due_date || null,
        date_paid: data.date_paid || null,
        payment_reference_no: data.payment_reference_no || null,
        updated_at: new Date().toISOString()
    };
    
    // Only add optional fields if they are provided (database may not have these columns yet)
    if (data.notes !== undefined) {
        updateData.notes = data.notes;
    }
    if (data.balance_due !== undefined) {
        updateData.balance_due = data.balance_due;
    }
    
    const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expenseId);

    if (error) {
        console.error('Error updating expense:', error);
        throw new Error('Failed to update expense');
    }

    // Fetch the updated expense with joined data
    const { data: fullExpense, error: fetchError } = await supabase
        .from('expenses_view')
        .select('*')
        .eq('id', expenseId)
        .single();

    if (fetchError || !fullExpense) {
        console.error('Error fetching updated expense:', fetchError);
        throw new Error('Failed to fetch updated expense');
    }

    return {
        id: fullExpense.id,
        internal_reference: fullExpense.internal_reference,
        expense_date: fullExpense.expense_date,
        category_id: fullExpense.category_id,
        description_id: fullExpense.description_id,
        amount: parseFloat(fullExpense.amount),
        vendor_id: fullExpense.vendor_id,
        paid_through_id: fullExpense.paid_through_id,
        payment_status: fullExpense.payment_status,
        due_date: fullExpense.due_date,
        date_paid: fullExpense.date_paid,
        payment_reference_no: fullExpense.payment_reference_no,
        is_voided: fullExpense.is_voided ?? false,
        created_at: fullExpense.created_at,
        updated_at: fullExpense.updated_at,
        category_name: fullExpense.category_name,
        description_name: fullExpense.description_name,
        vendor_name: fullExpense.vendor_name,
        paid_through_name: fullExpense.paid_through_name
    };
}

/**
 * Fetches all payments for a specific expense
 */
export async function fetchExpensePayments(expenseId: number): Promise<any[]> {
    const { data, error } = await supabase
        .from('expense_payments')
        .select(`
            *,
            expense_paid_through (
                id,
                name
            )
        `)
        .eq('expense_id', expenseId)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching expense payments:', error);
        throw new Error('Failed to fetch expense payments');
    }

    return (data || []).map(payment => ({
        id: payment.id,
        expense_id: payment.expense_id,
        payment_date: payment.payment_date,
        amount: parseFloat(payment.amount),
        paid_through_id: payment.paid_through_id,
        paid_through_name: payment.expense_paid_through?.name || null,
        payment_reference_no: payment.payment_reference_no,
        notes: payment.notes,
        created_at: payment.created_at,
        updated_at: payment.updated_at
    }));
}

/**
 * Records a payment for an expense (supports partial payments)
 */
export async function markExpenseAsPaid(
    expenseId: number,
    datePaid: string,
    paymentReferenceNo?: string | null,
    paidThroughId?: number | null,
    amountPaid?: number
): Promise<Expense> {
    // First, fetch the current expense to get the amount
    const { data: currentExpense, error: fetchCurrentError } = await supabase
        .from('expenses')
        .select('amount, due_date, paid_through_id')
        .eq('id', expenseId)
        .single();

    if (fetchCurrentError || !currentExpense) {
        console.error('Error fetching current expense:', fetchCurrentError);
        throw new Error('Failed to fetch current expense');
    }

    const totalAmount = parseFloat(currentExpense.amount);
    
    // Fetch existing payments to calculate current balance
    const { data: existingPayments, error: paymentsError } = await supabase
        .from('expense_payments')
        .select('amount')
        .eq('expense_id', expenseId);

    if (paymentsError) {
        console.error('Error fetching existing payments:', paymentsError);
        throw new Error('Failed to fetch existing payments');
    }

    const totalPaid = (existingPayments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const currentBalanceDue = totalAmount - totalPaid;
    const paymentAmount = amountPaid || currentBalanceDue;
    
    if (paymentAmount <= 0) {
        throw new Error('Payment amount must be greater than 0');
    }
    
    if (paymentAmount > currentBalanceDue) {
        throw new Error(`Payment amount (${paymentAmount}) cannot exceed balance due (${currentBalanceDue})`);
    }

    const newBalanceDue = currentBalanceDue - paymentAmount;

    // Create payment record in expense_payments table
    const { data: newPayment, error: paymentInsertError } = await supabase
        .from('expense_payments')
        .insert({
            expense_id: expenseId,
            payment_date: datePaid,
            amount: paymentAmount,
            paid_through_id: paidThroughId || null,
            payment_reference_no: paymentReferenceNo || null
        })
        .select()
        .single();

    if (paymentInsertError || !newPayment) {
        console.error('Error creating payment record:', paymentInsertError);
        throw new Error('Failed to create payment record');
    }

    // Determine payment status based on balance
    const paymentStatus = newBalanceDue <= 0 ? 'Paid' : 'Unpaid';
    const finalDatePaid = paymentStatus === 'Paid' ? datePaid : null;

    // Update expense with payment information
    const updateData: any = {
        payment_status: paymentStatus,
        date_paid: finalDatePaid,
        paid_through_id: paidThroughId || currentExpense.paid_through_id || null,
        due_date: paymentStatus === 'Paid' ? null : currentExpense.due_date, // Clear due date when fully paid
        updated_at: new Date().toISOString()
    };
    
    // Only update payment_reference_no if this is the first payment or if it's fully paid
    if (existingPayments.length === 0 || paymentStatus === 'Paid') {
        updateData.payment_reference_no = paymentReferenceNo || null;
    }

    const { error: updateError } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expenseId);

    if (updateError) {
        console.error('Error updating expense:', updateError);
        throw new Error('Failed to update expense');
    }

    // Fetch the updated expense
    const { data: fullExpense, error: fetchError } = await supabase
        .from('expenses_view')
        .select('*')
        .eq('id', expenseId)
        .single();

    if (fetchError || !fullExpense) {
        console.error('Error fetching updated expense:', fetchError);
        throw new Error('Failed to fetch updated expense');
    }

    const expense: Expense & { balance_due?: number; notes?: string | null } = {
        id: fullExpense.id,
        internal_reference: fullExpense.internal_reference,
        expense_date: fullExpense.expense_date,
        category_id: fullExpense.category_id,
        description_id: fullExpense.description_id,
        amount: parseFloat(fullExpense.amount),
        vendor_id: fullExpense.vendor_id,
        paid_through_id: fullExpense.paid_through_id,
        payment_status: fullExpense.payment_status,
        due_date: fullExpense.due_date,
        date_paid: fullExpense.date_paid,
        payment_reference_no: fullExpense.payment_reference_no,
        is_voided: fullExpense.is_voided ?? false,
        created_at: fullExpense.created_at,
        updated_at: fullExpense.updated_at,
        category_name: fullExpense.category_name,
        description_name: fullExpense.description_name,
        vendor_name: fullExpense.vendor_name,
        paid_through_name: fullExpense.paid_through_name
    };
    
    // Add optional fields if they exist
    if (fullExpense.balance_due !== undefined) {
        expense.balance_due = parseFloat(fullExpense.balance_due);
    }
    if (fullExpense.notes !== undefined) {
        expense.notes = fullExpense.notes || null;
    }
    
    return expense;
}

/**
 * Voids an expense (hard delete with audit trail)
 * Stores expense data in voided_expenses table before deleting
 */
export async function voidExpense(expenseId: number, reason: string, voidedBy?: string): Promise<void> {
    if (!reason || reason.trim() === '') {
        throw new Error('Void reason is required');
    }

    // First, fetch the full expense data from expenses_view
    const { data: expenseData, error: fetchError } = await supabase
        .from('expenses_view')
        .select('*')
        .eq('id', expenseId)
        .single();

    if (fetchError || !expenseData) {
        console.error('Error fetching expense for void:', fetchError);
        throw new Error('Failed to fetch expense data for voiding');
    }

    // Store in voided_expenses table
    const { error: voidError } = await supabase
        .from('voided_expenses')
        .insert({
            original_expense_id: expenseData.id,
            internal_reference: expenseData.internal_reference,
            expense_date: expenseData.expense_date,
            amount: expenseData.amount,
            category_id: expenseData.category_id,
            category_name: expenseData.category_name,
            description_id: expenseData.description_id,
            description_name: expenseData.description_name,
            vendor_id: expenseData.vendor_id,
            vendor_name: expenseData.vendor_name,
            paid_through_id: expenseData.paid_through_id,
            paid_through_name: expenseData.paid_through_name,
            payment_status: expenseData.payment_status,
            due_date: expenseData.due_date,
            date_paid: expenseData.date_paid,
            payment_reference_no: expenseData.payment_reference_no,
            notes: expenseData.notes || null,
            balance_due: (expenseData as any).balance_due || null,
            void_reason: reason.trim(),
            voided_by: voidedBy || null,
            created_at: expenseData.created_at,
            updated_at: expenseData.updated_at
        });

    if (voidError) {
        console.error('Error storing voided expense:', voidError);
        throw new Error('Failed to store voided expense record');
    }

    // Now hard delete from expenses table
    const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

    if (deleteError) {
        console.error('Error deleting expense:', deleteError);
        throw new Error('Failed to delete expense');
    }
}

/**
 * Fetches voided expenses within a date range
 */
export async function fetchVoidedExpenses(dateFrom?: string, dateTo?: string): Promise<any[]> {
    let query = supabase
        .from('voided_expenses')
        .select('*')
        .order('voided_at', { ascending: false });

    if (dateFrom) {
        // Include the full day from 00:00:00
        const fromDate = dateFrom.includes('T') ? dateFrom : `${dateFrom}T00:00:00`;
        query = query.gte('voided_at', fromDate);
        console.log('🔍 [DEBUG] Fetching voided expenses from:', fromDate);
    }
    if (dateTo) {
        // Include the full day up to 23:59:59.999
        const toDate = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999`;
        query = query.lte('voided_at', toDate);
        console.log('🔍 [DEBUG] Fetching voided expenses to:', toDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching voided expenses:', error);
        throw new Error('Failed to fetch voided expenses');
    }

    console.log('🔍 [DEBUG] Fetched voided expenses count:', data?.length || 0);

    return (data || []).map(item => ({
        id: item.id,
        original_expense_id: item.original_expense_id,
        internal_reference: item.internal_reference,
        expense_date: item.expense_date,
        amount: parseFloat(item.amount),
        category_name: item.category_name,
        description_name: item.description_name,
        vendor_name: item.vendor_name,
        paid_through_name: item.paid_through_name,
        payment_status: item.payment_status,
        due_date: item.due_date,
        date_paid: item.date_paid,
        payment_reference_no: item.payment_reference_no,
        notes: item.notes,
        balance_due: item.balance_due ? parseFloat(item.balance_due) : null,
        void_reason: item.void_reason,
        voided_by: item.voided_by,
        voided_at: item.voided_at,
        created_at: item.created_at,
        updated_at: item.updated_at
    }));
}

/**
 * Voids multiple expenses (bulk void with audit trail)
 */
export async function voidExpenses(expenseIds: number[], reason: string, voidedBy?: string): Promise<void> {
    if (!reason || reason.trim() === '') {
        throw new Error('Void reason is required');
    }

    // Fetch all expense data
    const { data: expensesData, error: fetchError } = await supabase
        .from('expenses_view')
        .select('*')
        .in('id', expenseIds);

    if (fetchError || !expensesData || expensesData.length === 0) {
        console.error('Error fetching expenses for void:', fetchError);
        throw new Error('Failed to fetch expense data for voiding');
    }

    // Store all in voided_expenses table
    const voidedRecords = expensesData.map(expense => ({
        original_expense_id: expense.id,
        internal_reference: expense.internal_reference,
        expense_date: expense.expense_date,
        amount: expense.amount,
        category_id: expense.category_id,
        category_name: expense.category_name,
        description_id: expense.description_id,
        description_name: expense.description_name,
        vendor_id: expense.vendor_id,
        vendor_name: expense.vendor_name,
        paid_through_id: expense.paid_through_id,
        paid_through_name: expense.paid_through_name,
        payment_status: expense.payment_status,
        due_date: expense.due_date,
        date_paid: expense.date_paid,
        payment_reference_no: expense.payment_reference_no,
        notes: expense.notes || null,
        balance_due: (expense as any).balance_due || null,
        void_reason: reason.trim(),
        voided_by: voidedBy || null,
        created_at: expense.created_at,
        updated_at: expense.updated_at
    }));

    const { error: voidError } = await supabase
        .from('voided_expenses')
        .insert(voidedRecords);

    if (voidError) {
        console.error('Error storing voided expenses:', voidError);
        throw new Error('Failed to store voided expense records');
    }

    // Now hard delete from expenses table
    const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .in('id', expenseIds);

    if (deleteError) {
        console.error('Error deleting expenses:', deleteError);
        throw new Error('Failed to delete expenses');
    }
}

// ============================================================================
// DROPDOWN MANAGEMENT (Add/Update/Delete Options)
// ============================================================================

/**
 * Adds a new expense category
 */
export async function addExpenseCategory(name: string): Promise<ExpenseCategory> {
    // Get max sort_order
    const { data: maxData } = await supabase
        .from('expense_categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

    const maxSortOrder = maxData?.sort_order ?? -1;

    const { data, error } = await supabase
        .from('expense_categories')
        .insert({
            name,
            sort_order: maxSortOrder + 1
        })
        .select()
        .single();

    if (error || !data) {
        console.error('Error adding expense category:', error);
        throw new Error('Failed to add expense category');
    }

    return {
        id: data.id,
        name: data.name,
        sort_order: data.sort_order || 0,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Updates an expense category name
 */
export async function updateExpenseCategory(id: number, name: string): Promise<ExpenseCategory> {
    const { data, error } = await supabase
        .from('expense_categories')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

    if (error || !data) {
        console.error('Error updating expense category:', error);
        throw new Error('Failed to update expense category');
    }

    return {
        id: data.id,
        name: data.name,
        sort_order: data.sort_order || 0,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Deletes an expense category (hard delete with foreign key constraint handling)
 */
export async function deleteExpenseCategory(categoryId: number): Promise<void> {
    const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', categoryId);

    if (error) {
        console.error('Error deleting expense category:', error);
        // Check for foreign key constraint violation
        if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
            throw new Error('Cannot delete this category because it is being used by existing expenses. Please remove or update those expenses first.');
        }
        throw new Error(`Failed to delete expense category: ${error.message}`);
    }
}

/**
 * Adds a new expense description
 */
export async function addExpenseDescription(name: string, categoryId: number): Promise<ExpenseDescription> {
    // Get max sort_order for this category
    const { data: maxData } = await supabase
        .from('expense_descriptions')
        .select('sort_order')
        .eq('category_id', categoryId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

    const maxSortOrder = maxData?.sort_order ?? -1;

    const { data, error } = await supabase
        .from('expense_descriptions')
        .insert({
            name,
            category_id: categoryId,
            sort_order: maxSortOrder + 1
        })
        .select()
        .single();

    if (error || !data) {
        console.error('Error adding expense description:', error);
        throw new Error('Failed to add expense description');
    }

    return {
        id: data.id,
        name: data.name,
        category_id: data.category_id,
        sort_order: data.sort_order || 0,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Updates an expense description name
 */
export async function updateExpenseDescription(id: number, name: string): Promise<ExpenseDescription> {
    const { data, error } = await supabase
        .from('expense_descriptions')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

    if (error || !data) {
        console.error('Error updating expense description:', error);
        throw new Error('Failed to update expense description');
    }

    return {
        id: data.id,
        name: data.name,
        category_id: data.category_id,
        sort_order: data.sort_order || 0,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Deletes an expense description (hard delete with foreign key constraint handling)
 */
export async function deleteExpenseDescription(descriptionId: number): Promise<void> {
    const { error } = await supabase
        .from('expense_descriptions')
        .delete()
        .eq('id', descriptionId);

    if (error) {
        console.error('Error deleting expense description:', error);
        // Check for foreign key constraint violation
        if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
            throw new Error('Cannot delete this description because it is being used by existing expenses. Please remove or update those expenses first.');
        }
        throw new Error(`Failed to delete expense description: ${error.message}`);
    }
}

/**
 * Adds a new expense vendor
 */
export async function addExpenseVendor(name: string): Promise<ExpenseVendor> {
    // Get max sort_order
    const { data: maxData } = await supabase
        .from('expense_vendors')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

    const maxSortOrder = maxData?.sort_order ?? -1;

    const { data, error } = await supabase
        .from('expense_vendors')
        .insert({
            name,
            sort_order: maxSortOrder + 1
        })
        .select()
        .single();

    if (error || !data) {
        console.error('Error adding expense vendor:', error);
        throw new Error('Failed to add expense vendor');
    }

    return {
        id: data.id,
        name: data.name,
        sort_order: data.sort_order || 0,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Updates an expense vendor name
 */
export async function updateExpenseVendor(id: number, name: string): Promise<ExpenseVendor> {
    const { data, error } = await supabase
        .from('expense_vendors')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

    if (error || !data) {
        console.error('Error updating expense vendor:', error);
        throw new Error('Failed to update expense vendor');
    }

    return {
        id: data.id,
        name: data.name,
        sort_order: data.sort_order || 0,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Deletes an expense vendor (hard delete with foreign key constraint handling)
 */
export async function deleteExpenseVendor(vendorId: number): Promise<void> {
    const { error } = await supabase
        .from('expense_vendors')
        .delete()
        .eq('id', vendorId);

    if (error) {
        console.error('Error deleting expense vendor:', error);
        // Check for foreign key constraint violation
        if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
            throw new Error('Cannot delete this vendor because it is being used by existing expenses. Please remove or update those expenses first.');
        }
        throw new Error(`Failed to delete expense vendor: ${error.message}`);
    }
}

/**
 * Adds a new expense paid through option
 */
export async function addExpensePaidThrough(name: string): Promise<ExpensePaidThrough> {
    // Get max sort_order
    const { data: maxData } = await supabase
        .from('expense_paid_through')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

    const maxSortOrder = maxData?.sort_order ?? -1;

    const { data, error } = await supabase
        .from('expense_paid_through')
        .insert({
            name,
            sort_order: maxSortOrder + 1
        })
        .select()
        .single();

    if (error || !data) {
        console.error('Error adding expense paid through option:', error);
        throw new Error('Failed to add expense paid through option');
    }

    return {
        id: data.id,
        name: data.name,
        sort_order: data.sort_order || 0,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Updates an expense paid through option name
 */
export async function updateExpensePaidThrough(id: number, name: string): Promise<ExpensePaidThrough> {
    const { data, error } = await supabase
        .from('expense_paid_through')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

    if (error || !data) {
        console.error('Error updating expense paid through option:', error);
        throw new Error('Failed to update expense paid through option');
    }

    return {
        id: data.id,
        name: data.name,
        sort_order: data.sort_order || 0,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Deletes an expense paid through option (hard delete with foreign key constraint handling)
 */
export async function deleteExpensePaidThrough(paidThroughId: number): Promise<void> {
    const { error } = await supabase
        .from('expense_paid_through')
        .delete()
        .eq('id', paidThroughId);

    if (error) {
        console.error('Error deleting expense paid through option:', error);
        // Check for foreign key constraint violation
        if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
            throw new Error('Cannot delete this paid through option because it is being used by existing expenses. Please remove or update those expenses first.');
        }
        throw new Error(`Failed to delete expense paid through option: ${error.message}`);
    }
}

