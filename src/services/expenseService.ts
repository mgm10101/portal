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

    return (data || []).map(item => ({
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
    }));
}

/**
 * Creates a new expense
 */
export async function createExpense(data: ExpenseSubmissionData): Promise<Expense> {
    const { data: expenseData, error } = await supabase
        .from('expenses')
        .insert({
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
        })
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
export async function updateExpense(expenseId: number, data: ExpenseSubmissionData): Promise<Expense> {
    const { error } = await supabase
        .from('expenses')
        .update({
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
        })
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
 * Marks an expense as paid
 */
export async function markExpenseAsPaid(
    expenseId: number,
    datePaid: string,
    paymentReferenceNo?: string | null
): Promise<Expense> {
    const { error } = await supabase
        .from('expenses')
        .update({
            payment_status: 'Paid',
            date_paid: datePaid,
            payment_reference_no: paymentReferenceNo || null,
            due_date: null, // Clear due date when marked as paid
            updated_at: new Date().toISOString()
        })
        .eq('id', expenseId);

    if (error) {
        console.error('Error marking expense as paid:', error);
        throw new Error('Failed to mark expense as paid');
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
 * Voids an expense (soft delete)
 */
export async function voidExpense(expenseId: number): Promise<void> {
    const { error } = await supabase
        .from('expenses')
        .update({
            is_voided: true,
            voided_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', expenseId);

    if (error) {
        console.error('Error voiding expense:', error);
        throw new Error('Failed to void expense');
    }
}

/**
 * Voids multiple expenses (bulk void)
 */
export async function voidExpenses(expenseIds: number[]): Promise<void> {
    const { error } = await supabase
        .from('expenses')
        .update({
            is_voided: true,
            voided_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .in('id', expenseIds);

    if (error) {
        console.error('Error voiding expenses:', error);
        throw new Error('Failed to void expenses');
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
 * Deletes an expense category (soft delete)
 */
export async function deleteExpenseCategory(categoryId: number): Promise<void> {
    const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: false })
        .eq('id', categoryId);

    if (error) {
        console.error('Error deleting expense category:', error);
        throw new Error('Failed to delete expense category');
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
 * Deletes an expense description (soft delete)
 */
export async function deleteExpenseDescription(descriptionId: number): Promise<void> {
    const { error } = await supabase
        .from('expense_descriptions')
        .update({ is_active: false })
        .eq('id', descriptionId);

    if (error) {
        console.error('Error deleting expense description:', error);
        throw new Error('Failed to delete expense description');
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
 * Deletes an expense vendor (soft delete)
 */
export async function deleteExpenseVendor(vendorId: number): Promise<void> {
    const { error } = await supabase
        .from('expense_vendors')
        .update({ is_active: false })
        .eq('id', vendorId);

    if (error) {
        console.error('Error deleting expense vendor:', error);
        throw new Error('Failed to delete expense vendor');
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
 * Deletes an expense paid through option (soft delete)
 */
export async function deleteExpensePaidThrough(paidThroughId: number): Promise<void> {
    const { error } = await supabase
        .from('expense_paid_through')
        .update({ is_active: false })
        .eq('id', paidThroughId);

    if (error) {
        console.error('Error deleting expense paid through option:', error);
        throw new Error('Failed to delete expense paid through option');
    }
}

