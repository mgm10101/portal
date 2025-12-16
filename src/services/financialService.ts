// src/services/financialService.ts

import { supabase } from '../supabaseClient'; 
import { 
    ItemMaster, 
    InvoiceHeader, 
    FullInvoice, 
    StudentInfo, 
    InvoiceSubmissionData,
    InvoiceLineItem,
    // Import the new type we will define in database.ts
    OutstandingBalanceReview,
    // Payments module types
    Payment,
    PaymentMethod,
    Account,
    PaymentAllocation,
    FullPayment,
    PaymentSubmissionData,
    // Expenses module types
    Expense,
    ExpenseCategory,
    ExpenseDescription,
    ExpenseVendor,
    ExpensePaidThrough,
    ExpenseSubmissionData
} from '../types/database'; 

// Helper types to represent the raw data returned by Supabase 
// (where all 'numeric' database fields are returned as 'string' before coercion)
// --- FIX 1: Revert numeric fields to SNAKE_CASE, as returned by the database/PostgREST
type RawInvoiceData = Omit<InvoiceHeader, 'subtotal' | 'totalAmount' | 'paymentMade' | 'balanceDue' | 'class_name'> & {
    subtotal: string;
    total_amount: string; // ✅ FIX: Changed to use snake_case for raw DB response
    payment_made: string; // ✅ FIX: Changed to use snake_case for raw DB response
    balance_due: string; // ✅ FIX: Changed to use snake_case for raw DB response
    // NOTE: broughtforward_amount removed - BBF is now only included as a line item
    // --- ADDED: Structure for the joined 'students' table to retrieve class_name ---
    students: { class_name: string | null } | null;
    // -----------------------------------------------------------------------------
};

// --- BATCH CREATION TYPES ---

// Define the required fields for a line item in the context of the Batch Form
interface BatchLineItem {
    itemName: string; // Now using item_name directly instead of item_master_id
    unitPrice: number;
    quantity: number;
    discount: number;
    // NOTE: Adding itemName and lineTotal is crucial for reusability with createInvoice
    itemName: string; 
    lineTotal: number;
    description: string | null;
}

// Condition interface for combination rules
export interface Condition {
    conditionId: string;
    field_id: string;
    field_name: string;
    field_value: string;
}

// Conditional Line Item Rule - for student-specific items
// Supports both single condition (legacy) and multiple conditions (new)
export interface ConditionalLineItemRule {
    ruleId: string; // Unique ID for React keying
    // Legacy single condition fields (for backward compatibility)
    field_id?: string;
    field_name?: string;
    field_value?: string;
    // New: Array of conditions (all must match - AND logic)
    conditions?: Condition[];
    itemName: string; // Item name stored in DB
    selectedItemId?: string; // Item ID used for dropdown selection (not stored in DB)
    unitPrice: number;
    quantity: number;
    discount: number;
    description: string | null;
}

export interface BatchCreationData {
    selectedStudentIds: string[]; // List of admission numbers
    lineItems: BatchLineItem[]; // Common items for all students
    invoiceDate: string;
    dueDate: string;
    description: string;
    // NEW: Conditional line items
    conditionalLineRules?: ConditionalLineItemRule[];
    // NEW: Balance Brought Forward configuration (system-generated, no item master needed)
    includeBalanceBroughtForward?: boolean;
}
// --- END BATCH CREATION TYPES ---


// --- NEW: BALANCE BROUGHT FORWARD TYPES (Internal Service Use) ---

// Type for the data to be written to the balance_brought_forward table
interface BalanceBroughtForwardPayload {
    student_name: string;
    admission_number: string;
    invoice_number: string;
    invoice_description: string | null;
    balance_due: number;
}
// --- END BALANCE BROUGHT FORWARD TYPES ---


// --- A. Student & Master Item Fetching (UPDATED) ---

export async function fetchStudents(): Promise<StudentInfo[]> {
    console.log("🐛 [DEBUG] Fetching student data for invoice form...");
    const { data, error } = await supabase
        .from('students')
        // Include fields needed for conditional rules
        // Use * to get all fields including custom_1, custom_2, etc.
        // Only fetch students with status = 'Active'
        .select('*')
        .eq('status', 'Active'); 
    if (error) {
        console.error("❌ [ERROR] Error fetching students:", error);
        throw new Error('Failed to fetch students data from the database.');
    }
    console.log(`✅ [DEBUG] Successfully fetched ${data.length} active students.`);
    return data as StudentInfo[]; 
}

export async function fetchMasterItems(): Promise<ItemMaster[]> {
    console.log("🐛 [DEBUG] Fetching master items...");
    const { data, error } = await supabase
        .from('item_master')
        .select('*')
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('created_at', { ascending: true }); // Secondary sort
    if (error) {
        console.error("❌ [ERROR] Error fetching master items:", error);
        throw new Error('Could not fetch available fees/items.');
    }
    // No change here, current_unit_price is snake_case in ItemMaster which is fine
    const typedData: ItemMaster[] = data.map((item: any) => ({
        ...item,
        current_unit_price: parseFloat(item.current_unit_price),
        sort_order: item.sort_order !== null && item.sort_order !== undefined ? parseInt(item.sort_order) : null,
    }));
    console.log(`✅ [DEBUG] Successfully fetched ${typedData.length} master items.`);
    return typedData;
}

// --- A. Item Master CRUD Functions (NEW) ---

// New type for creating a master item (since ID and created_at are generated by DB)
type NewItemMaster = Omit<ItemMaster, 'id' | 'created_at'>;

/**
 * Creates a new master item.
 * @param data The item details (name, price, description, status).
 * @returns The newly created ItemMaster object.
 */
export async function createMasterItem(data: NewItemMaster): Promise<ItemMaster> {
    console.log("🐛 [DEBUG] Creating new master item:", data.item_name);
    const payload = {
        item_name: data.item_name,
        // Convert number to precise string for DB insertion
        current_unit_price: data.current_unit_price.toFixed(2), 
        description: data.description,
        status: data.status,
    };

    const { data: itemData, error } = await supabase
        .from('item_master')
        .insert(payload)
        .select()
        .single();

    if (error || !itemData) {
        console.error("❌ [ERROR] Error creating master item:", error);
        throw new Error(`Failed to create item: ${error?.message}`);
    }

    // Coerce the numeric string back into a number for the client
    const createdItem: ItemMaster = {
        ...itemData,
        current_unit_price: parseFloat(itemData.current_unit_price),
    };
    console.log(`✅ [DEBUG] Master item created with ID: ${createdItem.id}`);
    return createdItem;
}

/**
 * Updates an existing master item (e.g., status or price).
 * @param id The ID of the item to update.
 * @param updates The fields to update.
 * @returns The updated ItemMaster object.
 */
export async function updateMasterItem(id: string, updates: Partial<ItemMaster>): Promise<ItemMaster> {
    console.log(`🐛 [DEBUG] Updating master item ID: ${id}`);
    const payload: { [key: string]: any } = {};

    // Map camelCase to snake_case and handle numeric coercion
    if (updates.item_name !== undefined) payload.item_name = updates.item_name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;

    // Convert number to precise string for DB if price is being updated
    if (updates.current_unit_price !== undefined) {
        payload.current_unit_price = updates.current_unit_price.toFixed(2); 
    }

    const { data: itemData, error } = await supabase
        .from('item_master')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error || !itemData) {
        console.error(`❌ [ERROR] Error updating master item ${id}:`, error);
        throw new Error(`Failed to update item: ${error?.message}`);
    }

    // Coerce the numeric string back into a number for the client
    const updatedItem: ItemMaster = {
        ...itemData,
        current_unit_price: parseFloat(itemData.current_unit_price),
    };
    console.log(`✅ [DEBUG] Master item ID ${id} updated.`);
    return updatedItem;
}

/**
 * Deletes a master item.
 * @param id The ID of the item to delete.
 */
export async function deleteMasterItem(id: string): Promise<void> {
    console.log(`🐛 [DEBUG] Deleting master item ID: ${id}`);
    const { error } = await supabase
        .from('item_master')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`❌ [ERROR] Error deleting master item ${id}:`, error);
        throw new Error(`Failed to delete item: ${error.message}`);
    }
    console.log(`✅ [DEBUG] Master item ID ${id} deleted.`);
}


// --- B. Single Invoice CREATE Function (NO CHANGES NEEDED) ---

/**
 * Inserts a new Invoice Header and its associated Line Items in two steps.
 * @param data The structured invoice data from the form.
 * @returns The newly created Invoice Header object, including the generated invoice_number.
 */
export async function createInvoice(data: InvoiceSubmissionData): Promise<InvoiceHeader> {
    
    // 1. --- INSERT INVOICE HEADER ---
    console.log("🐛 [DEBUG] Step 1: Inserting Invoice Header for student:", data.header.admission_number);

    // Prepare the header object for insertion 
    // NOTE: We MUST explicitly map all camelCase fields to snake_case for the database.
    const headerToInsert = {
        // Explicitly map all fields from camelCase (submission type) to snake_case (database)

        // Basic Header Fields (These are usually snake_case in DB but mapped to client-friendly names in TS)
        admission_number: data.header.admission_number,
        name: data.header.name,
        invoice_date: data.header.invoice_date,
        due_date: data.header.due_date,
        
        // Status and Descriptions
        status: data.header.status || 'Pending',
        description: data.header.description || null,
        
        // Brought Forward Fields (description only - amount is in line items)
        broughtforward_description: data.header.broughtforward_description || null,
        
        // Calculated/Required Fields (Must use snake_case for DB)
        subtotal: data.header.subtotal,
        total_amount: data.header.totalAmount, 
        
        // *** FIX: payment_made and balance_due are mapped explicitly ***
        payment_made: data.header.paymentMade, 
        // Calculate initial balance due for insertion payload
        balance_due: data.header.totalAmount - data.header.paymentMade,
    };

    const { data: headerData, error: headerError } = await supabase
        .from('invoices')
        .insert(headerToInsert)
        .select() // Request the newly inserted record
        .single();
    
    if (headerError || !headerData) {
        console.error("❌ [ERROR] Error inserting Invoice Header:", headerError);
        throw new Error(`Failed to create invoice header: ${headerError?.message}`);
    }
    
    const newInvoiceNumber = headerData.invoice_number;
    console.log(`✅ [DEBUG] Invoice Header inserted. New Invoice Number: ${newInvoiceNumber}`);
    
    
    // 2. --- INSERT INVOICE LINE ITEMS ---
    if (data.line_items.length > 0) {
        console.log("🐛 [DEBUG] Step 2: Inserting Line Items...", data.line_items.length);
        
        // Fetch master items to get sort_order for sorting
        const masterItems = await fetchMasterItems();
        
        // IMPORTANT: Sort line items by master item's sort_order before inserting
        const sortedLineItems = [...data.line_items].sort((a, b) => {
            const itemA = masterItems.find(m => m.item_name === a.itemName);
            const itemB = masterItems.find(m => m.item_name === b.itemName);
            const orderA = itemA?.sort_order ?? 9999;
            const orderB = itemB?.sort_order ?? 9999;
            return orderA - orderB;
        });

        // Map the line items to include the generated invoice_number and sort_order snapshot
        const lineItemsToInsert = sortedLineItems.map((item, index) => {
            const masterItem = masterItems.find(m => m.item_name === item.itemName);
            return {
                // Explicitly map all necessary fields to snake_case for the DB
                invoice_number: newInvoiceNumber,
                item_name: item.itemName, // Now using item_name directly (no foreign key)
                description: item.description || null,
                quantity: item.quantity,
                discount: item.discount, // This field is correctly named in both cases
                sort_order: masterItem?.sort_order ?? index, // Store sort_order snapshot from master item

                // Mapping calculated/renamed camelCase fields back to snake_case for DB insertion
                unit_price: item.unitPrice, 
                line_total: item.lineTotal,
            };
        });
        
        const { error: lineItemError } = await supabase
            .from('invoice_line_items')
            .insert(lineItemsToInsert);

        if (lineItemError) {
            console.error("❌ [ERROR] Error inserting Invoice Line Items:", lineItemError);
            throw new Error(`Failed to insert line items for ${newInvoiceNumber}: ${lineItemError.message}`);
        }

        console.log(`✅ [DEBUG] Successfully inserted ${data.line_items.length} line items for ${newInvoiceNumber}.`);
    }

    // 3. --- RETURN COERCED HEADER DATA ---
    const rawHeader = headerData as RawInvoiceData;

    // Coerce the numeric strings back into numbers using the NEW CAMELCASE fields
    // NOTE: This insert returns only the header, so the joined 'students' field will not exist.
    const createdInvoice: InvoiceHeader = {
        // We use the snake_case keys from the RawInvoiceData type
        ...rawHeader, 
        // We explicitly set class_name to null on creation, as it will be correct on refetch.
        class_name: null, 
        subtotal: parseFloat(rawHeader.subtotal),
        // We must access the snake_case field names from the raw response here
        totalAmount: parseFloat(rawHeader.total_amount), 
        paymentMade: parseFloat(rawHeader.payment_made), 
        balanceDue: parseFloat(rawHeader.balance_due), 
    };
    
    return createdInvoice;
}


// --- C. Invoice Fetching Functions (FIXED FOR JOIN AND COERCION) ---

export async function fetchInvoices(): Promise<InvoiceHeader[]> {
    console.log("🐛 [DEBUG] Starting fetch of all invoices with student join...");
    const { data, error } = await supabase
        .from('invoices')
        // 💡 FIX: Including the student join using the `select` syntax
        .select(`*, students(class_name)`) 
        .order('created_at', { ascending: false });
        
    if (error) {
        // Log the actual error properties for better debugging
        console.error("❌ [ERROR] Error fetching invoices:", error.message, error.details); 
        throw new Error('Could not fetch the list of invoices.');
    }
    
    // Use RawInvoiceData for the incoming data
    const typedData: InvoiceHeader[] = data.map((item: RawInvoiceData) => ({
        // Spread the original properties (non-numeric, non-joined)
        ...item,
        
        // --- MAP CLASS NAME from the JOINED OBJECT ---
        // Access item.students.class_name from the join. Must check for null.
        class_name: item.students ? item.students.class_name : null,
        // ---------------------------------------------
        
        // Coerce strings to numbers using the **CORRECT SNAKE_CASE FIELDS** from the raw data
        subtotal: parseFloat(item.subtotal),
        totalAmount: parseFloat(item.total_amount), // ✅ FIX: Using item.total_amount
        paymentMade: parseFloat(item.payment_made), // ✅ FIX: Using item.payment_made
        balanceDue: parseFloat(item.balance_due), // ✅ FIX: Using item.balance_due
    }));
    
    console.log(`✅ [DEBUG] Successfully fetched and coerced ${typedData.length} invoices.`);
    return typedData;
}

export async function fetchFullInvoice(invoiceNumber: string): Promise<FullInvoice | null> {
    console.log(`🐛 [DEBUG] Fetching full invoice details for ${invoiceNumber}...`);
    const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
            *,
            students (class_name),
            line_items:invoice_line_items ( * )
        `)
        .eq('invoice_number', invoiceNumber)
        .single();
    
    // Note: We'll sort line items in the mapping step below by sort_order

    if (invoiceError) {
        console.error(`❌ [ERROR] Error fetching invoice ${invoiceNumber}:`, invoiceError);
        return null;
    }

    if (!invoiceData) {
        console.warn(`⚠️ [WARNING] No invoice found for number ${invoiceNumber}.`);
        return null;
    }

    // Type the raw incoming data correctly
    const rawFullInvoice = invoiceData as unknown as RawInvoiceData & { line_items: any[] };

    // Map line items and sort by sort_order
    const coercedLineItems: FullInvoice['line_items'] = rawFullInvoice.line_items
        .map((item: any) => ({
            // Map snake_case fields from the DB to camelCase in the final InvoiceLineItem object
            id: item.id,
            invoice_number: item.invoice_number,
            itemName: item.item_name, // Map item_name (DB) to itemName (TS) - now the primary identifier
            description: item.description,
            sort_order: item.sort_order !== null && item.sort_order !== undefined ? parseInt(item.sort_order) : null,
            
            // Coercion from snake_case string (DB) to camelCase number (TS)
            unitPrice: parseFloat(item.unit_price), 
            lineTotal: parseFloat(item.line_total), 
            discount: parseFloat(item.discount),
            quantity: parseInt(item.quantity), // Quantities are usually integers
        }))
        .sort((a, b) => {
            // Sort by sort_order (preserving invoice order), fallback to id if sort_order is null
            if (a.sort_order !== null && b.sort_order !== null) {
                return a.sort_order - b.sort_order;
            }
            if (a.sort_order !== null) return -1;
            if (b.sort_order !== null) return 1;
            return (a.id || '').localeCompare(b.id || '');
        });
    
    // Coerce header numerics and map the class name
    // 🚨 FINAL FIX: Use a structured assignment to pick only the required fields from the RawInvoiceData,
    // avoiding the spread operator which includes the nested 'students' object.
    const { 
        students, // Destructure and omit the nested 'students' object
        total_amount, 
        payment_made, 
        balance_due, 
        subtotal: raw_subtotal,
        // Destructure other simple fields that match the InvoiceHeader definition
        ...restOfHeader // Includes all simple, non-numeric fields
    } = rawFullInvoice;

    const coercedInvoice: FullInvoice = {
        ...restOfHeader, // Spread all the non-numeric fields
        // --- MAP CLASS NAME from the JOINED OBJECT ---
        class_name: students ? students.class_name : null, // ✅ FIX: Map the required string
        // ---------------------------------------------
        subtotal: parseFloat(raw_subtotal),
        totalAmount: parseFloat(total_amount), 
        paymentMade: parseFloat(payment_made), 
        balanceDue: parseFloat(balance_due), 
        line_items: coercedLineItems,
    };
    console.log(`✅ [DEBUG] Full invoice ${invoiceNumber} fetched successfully.`);
    return coercedInvoice;
}


// --- D. Batch Invoice Creation (NEW IMPLEMENTATION) ---

/**
 * Creates multiple invoices for a list of students using the single `createInvoice` function.
 * Now supports conditional line items and balance brought forward processing inline.
 * @param data The batch creation details including conditional rules and BBF config.
 * @returns A promise resolving to the number of invoices successfully created.
 */
export async function createBatchInvoices(
    data: BatchCreationData,
    onProgress?: (current: number, total: number) => void
): Promise<number> {
    console.log(`🐛 [DEBUG] Initiating batch invoice creation for ${data.selectedStudentIds.length} requested students.`);
    
    if (data.selectedStudentIds.length === 0) {
        throw new Error("Cannot create batch with zero selected students.");
    }
    
    // Destructure the new optional fields
    const { 
        conditionalLineRules = [], 
        includeBalanceBroughtForward = false
    } = data;
    
    // 1. Fetch ALL students to get their full data for conditional rule evaluation
    const allStudents = await fetchStudents();
    const studentsToInvoice = allStudents.filter(s => data.selectedStudentIds.includes(s.admission_number));

    if (studentsToInvoice.length === 0) {
        console.warn("⚠️ [WARNING] No valid student records found for the selected admission numbers. Batch cancelled.");
        throw new Error("No valid student records found for the selected admission numbers.");
    }

    console.log(`🐛 [DEBUG] Starting batch invoice creation for ${studentsToInvoice.length} filtered students...`);

    let successfullyCreatedCount = 0;
    const failedStudents: { name: string, error: string }[] = [];
    const totalStudents = studentsToInvoice.length;

    // The common line items provided by the BatchForm
    const commonLineItems: InvoiceLineItem[] = data.lineItems as InvoiceLineItem[];

    for (let i = 0; i < studentsToInvoice.length; i++) {
        const student = studentsToInvoice[i];
        
        // Update progress
        if (onProgress) {
            onProgress(i + 1, totalStudents);
        }
        console.log(`🐛 [DEBUG] Processing invoice for ${student.name} (${student.admission_number})...`);
        try {
            // Start with common line items
            const studentLineItems: InvoiceLineItem[] = [...commonLineItems];
            
            // 3. Evaluate conditional rules for THIS student
            for (const rule of conditionalLineRules) {
                // Support both legacy single condition and new multiple conditions format
                const conditions = rule.conditions || (rule.field_id ? [{
                    conditionId: rule.ruleId + '_legacy',
                    field_id: rule.field_id,
                    field_name: rule.field_name || '',
                    field_value: rule.field_value || ''
                }] : []);
                
                // Check if student matches ALL conditions (AND logic)
                let allConditionsMatch = true;
                const matchedConditions: string[] = [];
                
                for (const condition of conditions) {
                    if (!condition.field_id || !condition.field_value) {
                        allConditionsMatch = false;
                        break;
                    }
                    
                    // Get the student's field value
                    const studentFieldValue = student[condition.field_id];
                    
                    // Check if this condition matches (convert both to strings for comparison)
                    const conditionMatches = studentFieldValue !== null && 
                                           studentFieldValue !== undefined && 
                                           String(studentFieldValue) === String(condition.field_value);
                    
                    if (conditionMatches) {
                        matchedConditions.push(`${condition.field_name} = ${condition.field_value}`);
                    } else {
                        allConditionsMatch = false;
                        break; // Short-circuit: if any condition fails, rule doesn't match
                    }
                }
                
                // If all conditions match, add the item
                if (allConditionsMatch && conditions.length > 0) {
                    console.log(`🎯 [DEBUG] Conditional rule matched for ${student.name}: ${matchedConditions.join(' AND ')}`);
                    
                    // Calculate line total for this conditional item
                    const discountFactor = 1 - ((rule.discount || 0) / 100);
                    const lineTotal = rule.unitPrice * rule.quantity * discountFactor;
                    
                    // Add the conditional item to this student's invoice
                    studentLineItems.push({
                        itemName: rule.itemName || (conditions.length > 1 ? `${conditions.length} conditions` : conditions[0]?.field_name || 'Conditional Item'),
                        unitPrice: rule.unitPrice,
                        quantity: rule.quantity,
                        discount: rule.discount || 0,
                        description: rule.description,
                        lineTotal: lineTotal
                    });
                }
            }
            
            // 4. Add Balance Brought Forward if enabled
            let bbfAmount = 0;
            let bbfDescription = null;
            let invoicesToForward: string[] = []; // Track invoices that will be marked as Forwarded
            if (includeBalanceBroughtForward) {
                // Fetch outstanding balances for this student
                const outstandingBalances = await fetchOutstandingBalances([student.admission_number]);
                
                if (outstandingBalances.length > 0) {
                    // Calculate total outstanding for this student
                    bbfAmount = outstandingBalances.reduce((sum, bal) => sum + bal.balance_due, 0);
                    
                    if (bbfAmount > 0) {
                        console.log(`💰 [DEBUG] Adding BBF of Ksh.${bbfAmount.toFixed(2)} for ${student.name}`);
                        
                        // Store invoice numbers for later forwarding
                        invoicesToForward = outstandingBalances.map(bal => bal.invoice_number);
                        
                        // Get invoice numbers for description
                        const invoiceNumbers = invoicesToForward.join(', ');
                        
                        // Find or create "Balance Brought Forward" item in item_master
                        let bbfItem = await supabase
                            .from('item_master')
                            .select('*')
                            .eq('item_name', 'Balance Brought Forward')
                            .single();
                        
                        // If it doesn't exist, create it
                        if (bbfItem.error || !bbfItem.data) {
                            console.log('🔧 [DEBUG] Creating system "Balance Brought Forward" item...');
                            const { data: newBbfItem, error: createError } = await supabase
                                .from('item_master')
                                .insert({
                                    item_name: 'Balance Brought Forward',
                                    current_unit_price: 0, // Price will be set per invoice
                                    description: 'System-generated item for carrying forward previous balances'
                                })
                                .select()
                                .single();
                            
                            if (createError || !newBbfItem) {
                                console.error('❌ [ERROR] Failed to create BBF item:', createError);
                                throw new Error('Failed to create Balance Brought Forward item');
                            }
                            bbfItem.data = newBbfItem;
                        }
                        
                        // Add BBF as a line item (now using itemName directly)
                        studentLineItems.push({
                            itemName: 'Balance Brought Forward',
                            unitPrice: bbfAmount,
                            quantity: 1,
                            discount: 0,
                            description: `Invoices: ${invoiceNumbers}`,
                            lineTotal: bbfAmount
                        });
                        
                        bbfDescription = `Balance from ${outstandingBalances.length} invoice(s): ${invoiceNumbers}`;
                    }
                }
            }
            
            // 5. Calculate totals for THIS student's invoice
            const lineItemsSubtotal = studentLineItems.reduce((sum, item) => sum + item.lineTotal, 0);
            const totalAmount = lineItemsSubtotal;
            
            // 6. Create the invoice submission data
            const submissionData: InvoiceSubmissionData = {
                header: {
                    admission_number: student.admission_number,
                    name: student.name,
                    invoice_date: data.invoiceDate,
                    due_date: data.dueDate,
                    status: 'Pending', 
                    description: data.description, 
                    
                    // BBF fields (description only - amount is in line items)
                    broughtforward_description: bbfDescription,
                    
                    // Totals
                    subtotal: lineItemsSubtotal,
                    totalAmount: totalAmount,
                    paymentMade: 0.00, // Always 0.00 for a new invoice
                },
                line_items: studentLineItems, 
            };

            // 7. Create the invoice using the existing function
            await createInvoice(submissionData);
            
            // 8. IMPORTANT: Mark the old invoices as 'Forwarded' if balance was brought forward
            // This ensures data integrity - the old invoices should not appear in outstanding balances
            if (invoicesToForward.length > 0) {
                try {
                    await markInvoicesAsForwarded(invoicesToForward);
                    console.log(`✅ [DEBUG] Marked ${invoicesToForward.length} invoices as 'Forwarded' for ${student.name}`);
                } catch (forwardError: any) {
                    // Log the error but don't fail the entire operation
                    // The new invoice was created successfully, but the status update failed
                    console.error(`⚠️ [WARNING] Failed to mark invoices as Forwarded for ${student.name}:`, forwardError);
                }
            }
            
            successfullyCreatedCount++;
            console.log(`✅ [DEBUG] Invoice created for ${student.name} with ${studentLineItems.length} line items (Total: Ksh.${totalAmount.toFixed(2)}).`);

        } catch (error) {
            console.error(`❌ [ERROR] Failed to create invoice for ${student.name} (${student.admission_number}):`, error);
            failedStudents.push({ 
                name: student.name, 
                error: (error as Error).message.substring(0, 50) + '...' 
            });
        }
    }
    
    if (failedStudents.length > 0) {
        console.warn(`⚠️ [WARNING] Batch creation completed with ${successfullyCreatedCount} successes and ${failedStudents.length} failures. Failures:`, failedStudents);
    } else {
        console.log(`✅ [DEBUG] Batch creation successfully created ${successfullyCreatedCount} invoices.`);
    }
    
    return successfullyCreatedCount;
}


// --- E. Single Invoice UPDATE Function (NEW IMPLEMENTATION) ---

/**
 * Updates an existing Invoice Header and its associated Line Items.
 * * IMPORTANT: This implements a "Separate Insert and Update" strategy for line items.
 * - Items with an existing 'id' are UPDATED.
 * - Items without an 'id' are INSERTED as new.
 * - Deletion is NOT supported by the UI/Service and must be handled manually in the DB if required.
 * * @param invoiceNumber The immutable identifier for the invoice being updated.
 * @param data The structured invoice data from the form, including the calculated totals.
 * @returns The updated Invoice Header object.
 */
export async function updateInvoice(invoiceNumber: string, data: InvoiceSubmissionData): Promise<InvoiceHeader> {
    
    // --- 1. UPDATE INVOICE HEADER ---
    console.log(`🐛 [DEBUG] Step 1: Updating Invoice Header for ${invoiceNumber}...`);

    // Only update the editable fields: dueDate, description, and the calculated totals.
    // NOTE: admission_number, name, and invoice_date are NOT updated as per requirements.
    const headerToUpdate = {
        due_date: data.header.due_date,
        description: data.header.description || null,
        
        // Update calculated fields (must be snake_case)
        subtotal: data.header.subtotal,
        total_amount: data.header.totalAmount, 
        
        // Update payment fields (these are editable if the payment form is available)
        payment_made: data.header.paymentMade, 
        balance_due: data.header.totalAmount - data.header.paymentMade,
    };

    const { data: headerData, error: headerError } = await supabase
        .from('invoices')
        .update(headerToUpdate)
        .eq('invoice_number', invoiceNumber)
        .select() // Request the newly updated record
        .single();
    
    if (headerError || !headerData) {
        console.error("❌ [ERROR] Error updating Invoice Header:", headerError);
        throw new Error(`Failed to update invoice header ${invoiceNumber}: ${headerError?.message}`);
    }
    
    console.log(`✅ [DEBUG] Invoice Header ${invoiceNumber} updated.`);
    
    // --- 2. FETCH EXISTING LINE ITEMS TO GET CURRENT SORT_ORDER ---
    const existingInvoice = await fetchFullInvoice(invoiceNumber);
    const existingItems = existingInvoice?.line_items || [];

    // --- 3. SEPARATE LINE ITEMS INTO UPDATE/INSERT GROUPS ---
    const itemsToUpdate = data.line_items.filter(item => item.id);
    const itemsToInsert = data.line_items.filter(item => !item.id);

    console.log(`🐛 [DEBUG] Line Items: Found ${itemsToUpdate.length} items to update and ${itemsToInsert.length} items to insert.`);

    
    // --- 4. HANDLE UPDATES (if any) ---
    if (itemsToUpdate.length > 0) {
        console.log("🐛 [DEBUG] Step 3a: Updating existing Line Items...");
        
        // Supabase/PostgREST does not support true batch-UPDATE from a list of records easily.
        // The most efficient client-side method is a series of single updates or a self-contained transaction (RPC).
        // For simplicity and resilience, we will use a Promise.all over individual updates.
        
        const updatePromises = itemsToUpdate.map(item => {
            // Map the item's editable fields to snake_case for DB
            const lineItemPayload = {
                item_name: item.itemName, // Now using item_name directly (no foreign key)
                description: item.description || null,
                quantity: item.quantity,
                discount: item.discount, 
                unit_price: item.unitPrice, 
                line_total: item.lineTotal, 
            };
            
            return supabase
                .from('invoice_line_items')
                .update(lineItemPayload)
                .eq('id', item.id);
        });
        
        const updateResults = await Promise.all(updatePromises);
        const updateError = updateResults.find(r => r.error)?.error;
        
        if (updateError) {
             console.error("❌ [ERROR] Error updating one or more Line Items:", updateError);
             // Note: In a real system, you'd roll back the header update here.
             throw new Error(`Failed to update some existing line items: ${updateError.message}`);
        }
        console.log(`✅ [DEBUG] Successfully updated ${itemsToUpdate.length} line items.`);
    }

    
    // --- 5. HANDLE INSERTS (if any) ---
    if (itemsToInsert.length > 0) {
        console.log("🐛 [DEBUG] Step 3b: Inserting new Line Items...");
        
        // Fetch master items to get sort_order for new items
        const masterItems = await fetchMasterItems();
        
        // Sort new items by master item's sort_order before inserting
        const sortedNewItems = [...itemsToInsert].sort((a, b) => {
            const itemA = masterItems.find(m => m.item_name === a.itemName);
            const itemB = masterItems.find(m => m.item_name === b.itemName);
            const orderA = itemA?.sort_order ?? 9999;
            const orderB = itemB?.sort_order ?? 9999;
            return orderA - orderB;
        });
        
        // Map the new line items to include the existing invoice_number and sort_order
        const lineItemsToInsert = sortedNewItems.map((item, index) => {
            const masterItem = masterItems.find(m => m.item_name === item.itemName);
            // Get max sort_order from existing items, then add index
            const maxExistingOrder = existingItems.length > 0 
                ? Math.max(...existingItems.map(i => i.sort_order || 0), -1)
                : -1;
            return {
                // Explicitly map all necessary fields to snake_case for the DB
                invoice_number: invoiceNumber, // Crucial: Link to the existing invoice
                item_name: item.itemName, // Now using item_name directly (no foreign key)
                description: item.description || null,
                quantity: item.quantity,
                discount: item.discount, 
                sort_order: masterItem?.sort_order ?? (maxExistingOrder + index + 1), // Store sort_order snapshot

                // Mapping calculated/renamed camelCase fields back to snake_case for DB insertion
                unit_price: item.unitPrice, 
                line_total: item.lineTotal, 
            };
        });
        
        const { error: insertError } = await supabase
            .from('invoice_line_items')
            .insert(lineItemsToInsert);

        if (insertError) {
            console.error("❌ [ERROR] Error inserting new Invoice Line Items:", insertError);
            throw new Error(`Failed to insert new line items for ${invoiceNumber}: ${insertError.message}`);
        }

        console.log(`✅ [DEBUG] Successfully inserted ${itemsToInsert.length} new line items.`);
    }

    // --- 5. RETURN COERCED HEADER DATA ---
    const rawHeader = headerData as RawInvoiceData;

    // Coerce the numeric strings back into numbers using the NEW CAMELCASE fields
    const updatedInvoice: InvoiceHeader = {
        // We use the snake_case keys from the RawInvoiceData type
        ...rawHeader,
        // Safest default for an update payload return
        class_name: null, 
        subtotal: parseFloat(rawHeader.subtotal),
        // We must access the snake_case field names from the raw response here
        totalAmount: parseFloat(rawHeader.total_amount), 
        paymentMade: parseFloat(rawHeader.payment_made), 
        balanceDue: parseFloat(rawHeader.balance_due), 
    };
    console.log(`✅ [DEBUG] Update process complete for invoice ${invoiceNumber}.`);
    return updatedInvoice;
}


// --- F. NEW: Outstanding Balance Functions ---

/**
 * Fetches all 'Overdue' invoices for a list of students.
 * @param admissionNumbers List of admission numbers to check.
 * @returns A list of invoices with their outstanding balance.
 */
export async function fetchOutstandingBalances(admissionNumbers: string[]): Promise<OutstandingBalanceReview[]> {
    if (admissionNumbers.length === 0) {
        return [];
    }

    console.log(`🐛 [DEBUG] Fetching overdue balances for ${admissionNumbers.length} students...`);

    // NOTE: We only need a few fields for the review table
    // IMPORTANT: Exclude 'Forwarded' invoices as they should not be included in outstanding balances
    const { data, error } = await supabase
        .from('invoices')
        .select(`
            admission_number,
            name,
            invoice_number,
            description,
            balance_due
        `)
        .in('admission_number', admissionNumbers)
        .eq('status', 'Overdue') // Only look for overdue invoices (this already excludes 'Forwarded')
        .gt('balance_due', 0) // Only look for invoices with a balance > 0
        .order('name', { ascending: true });

    if (error) {
        console.error("❌ [ERROR] Error fetching outstanding balances:", error);
        throw new Error('Failed to fetch outstanding balances.');
    }

    // Coerce numeric strings (balance_due) to numbers and map fields
    const coercedData: OutstandingBalanceReview[] = data.map((item: any) => ({
        admission_number: item.admission_number,
        name: item.name,
        invoice_number: item.invoice_number,
        invoice_description: item.description, // Map 'description' to 'invoice_description'
        balance_due: parseFloat(item.balance_due),
    }));

    console.log(`✅ [DEBUG] Found ${coercedData.length} outstanding balances.`);
    return coercedData;
}

// ============================================================================
// --- G. PAYMENTS RECEIVED MODULE FUNCTIONS ---
// ============================================================================

/**
 * Fetches all payment methods from the database
 */
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching payment methods:', error);
        throw new Error('Failed to fetch payment methods');
    }

    return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        sort_order: item.sort_order,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at
    }));
}

/**
 * Fetches all accounts from the database
 */
export async function fetchAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching accounts:', error);
        throw new Error('Failed to fetch accounts');
    }

    return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        account_number: item.account_number,
        bank_name: item.bank_name,
        sort_order: item.sort_order,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at
    }));
}

/**
 * Updates a payment method name
 */
export async function updatePaymentMethod(id: number, name: string): Promise<PaymentMethod> {
    const { data, error } = await supabase
        .from('payment_methods')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

    if (error || !data) {
        console.error('Error updating payment method:', error);
        throw new Error('Failed to update payment method');
    }

    return {
        id: data.id,
        name: data.name,
        description: data.description,
        sort_order: data.sort_order,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Updates an account name
 */
export async function updateAccount(id: number, name: string): Promise<Account> {
    const { data, error } = await supabase
        .from('accounts')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

    if (error || !data) {
        console.error('Error updating account:', error);
        throw new Error('Failed to update account');
    }

    return {
        id: data.id,
        name: data.name,
        description: data.description,
        account_number: data.account_number,
        bank_name: data.bank_name,
        sort_order: data.sort_order,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
}

/**
 * Fetches all payments with related data
 */
export async function fetchPayments(): Promise<Payment[]> {
    console.log('🔍 [DEBUG] Fetching payments from payments_view...');
    
    const { data, error } = await supabase
        .from('payments_view')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ [ERROR] Error fetching payments:', error);
        throw new Error('Failed to fetch payments');
    }

    console.log(`✅ [DEBUG] Successfully fetched ${data?.length || 0} payments`);

    return (data || []).map(item => ({
        id: item.id,
        receipt_number: item.receipt_number,
        admission_number: item.admission_number,
        student_name: item.student_name,
        payment_date: item.payment_date,
        amount: parseFloat(item.amount),
        payment_method_id: item.payment_method_id,
        account_id: item.account_id,
        reference_number: item.reference_number,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
        payment_method_name: item.payment_method_name,
        account_name: item.account_name,
        total_allocated: parseFloat(item.total_allocated || '0'),
        unallocated_amount: parseFloat(item.unallocated_amount || '0')
    }));
}

/**
 * Fetches a single payment with all allocations
 */
export async function fetchFullPayment(paymentId: number): Promise<FullPayment | null> {
    // Fetch payment
    const { data: paymentData, error: paymentError } = await supabase
        .from('payments_view')
        .select('*')
        .eq('id', paymentId)
        .single();

    if (paymentError || !paymentData) {
        console.error('Error fetching payment:', paymentError);
        return null;
    }

    // Fetch allocations
    const { data: allocationsData, error: allocationsError } = await supabase
        .from('payment_allocations')
        .select('*')
        .eq('payment_id', paymentId);

    if (allocationsError) {
        console.error('Error fetching payment allocations:', allocationsError);
    }

    const payment: FullPayment = {
        id: paymentData.id,
        receipt_number: paymentData.receipt_number,
        admission_number: paymentData.admission_number,
        student_name: paymentData.student_name,
        payment_date: paymentData.payment_date,
        amount: parseFloat(paymentData.amount),
        payment_method_id: paymentData.payment_method_id,
        account_id: paymentData.account_id,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes,
        created_at: paymentData.created_at,
        updated_at: paymentData.updated_at,
        created_by: paymentData.created_by,
        updated_by: paymentData.updated_by,
        payment_method_name: paymentData.payment_method_name,
        account_name: paymentData.account_name,
        total_allocated: parseFloat(paymentData.total_allocated || '0'),
        unallocated_amount: parseFloat(paymentData.unallocated_amount || '0'),
        allocations: (allocationsData || []).map(item => ({
            id: item.id,
            payment_id: item.payment_id,
            invoice_number: item.invoice_number,
            allocated_amount: parseFloat(item.allocated_amount),
            created_at: item.created_at
        }))
    };

    return payment;
}

/**
 * Fetches pending and overdue invoices for a student (for payment allocation)
 */
export async function fetchStudentInvoicesForPayment(admissionNumber: string): Promise<InvoiceHeader[]> {
    console.log(`🔍 [DEBUG] Fetching invoices for student: ${admissionNumber}`);
    
    const { data, error } = await supabase
        .from('invoices')
        .select('*, students(class_name)')
        .eq('admission_number', admissionNumber)
        .in('status', ['Pending', 'Overdue'])
        .neq('status', 'Forwarded') // Exclude Forwarded invoices
        .gt('balance_due', 0)
        .order('due_date', { ascending: true });

    if (error) {
        console.error('❌ [ERROR] Error fetching student invoices:', error);
        throw new Error('Failed to fetch student invoices');
    }

    console.log(`✅ [DEBUG] Found ${data?.length || 0} invoices for student ${admissionNumber}`);
    if (data && data.length > 0) {
        console.log('📋 [DEBUG] Invoice details:', data.map((item: any) => ({
            invoice_number: item.invoice_number,
            status: item.status,
            balance_due: item.balance_due,
            total_amount: item.total_amount,
            payment_made: item.payment_made
        })));
    }

    return (data || []).map((item: any) => ({
        invoice_number: item.invoice_number,
        invoice_seq_number: item.invoice_seq_number,
        created_at: item.created_at,
        admission_number: item.admission_number,
        name: item.name,
        class_name: item.students?.class_name || null,
        invoice_date: item.invoice_date,
        due_date: item.due_date,
        status: item.status,
        description: item.description,
        broughtforward_description: item.broughtforward_description,
        broughtforward_amount: item.broughtforward_amount ? parseFloat(item.broughtforward_amount) : null,
        subtotal: parseFloat(item.subtotal),
        totalAmount: parseFloat(item.total_amount),
        paymentMade: parseFloat(item.payment_made),
        balanceDue: parseFloat(item.balance_due)
    }));
}

/**
 * Creates a new payment with allocations
 */
export async function createPayment(data: PaymentSubmissionData): Promise<Payment> {
    // Insert payment
    const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
            admission_number: data.admission_number,
            student_name: data.student_name,
            payment_date: data.payment_date,
            amount: data.amount,
            payment_method_id: data.payment_method_id,
            account_id: data.account_id,
            reference_number: data.reference_number || null,
            notes: data.notes || null
        })
        .select()
        .single();

    if (paymentError || !paymentData) {
        console.error('Error creating payment:', paymentError);
        throw new Error('Failed to create payment');
    }

    // Insert allocations if any
    if (data.allocations && data.allocations.length > 0) {
        // Validate allocations before inserting
        const allocationsToInsert = data.allocations
            .filter(allocation => {
                const amount = parseFloat(allocation.allocated_amount.toString());
                if (isNaN(amount) || amount <= 0) {
                    console.warn('⚠️ [WARN] Skipping invalid allocation:', allocation);
                    return false;
                }
                if (!allocation.invoice_number || allocation.invoice_number.trim() === '') {
                    console.warn('⚠️ [WARN] Skipping allocation with missing invoice number:', allocation);
                    return false;
                }
                return true;
            })
            .map(allocation => ({
                payment_id: paymentData.id,
                invoice_number: allocation.invoice_number.trim(),
                allocated_amount: parseFloat(allocation.allocated_amount.toString())
            }));

        if (allocationsToInsert.length === 0) {
            console.warn('⚠️ [WARN] No valid allocations to insert');
        } else {
            console.log('🔍 [DEBUG] Inserting payment allocations:', allocationsToInsert);

            // Verify invoice numbers exist
            const invoiceNumbers = allocationsToInsert.map(a => a.invoice_number);
            const { data: invoiceCheck, error: checkError } = await supabase
                .from('invoices')
                .select('invoice_number')
                .in('invoice_number', invoiceNumbers);

            if (checkError) {
                console.error('❌ [ERROR] Error checking invoice numbers:', checkError);
                await supabase.from('payments').delete().eq('id', paymentData.id);
                throw new Error(`Failed to verify invoice numbers: ${checkError.message}`);
            }

            const existingInvoiceNumbers = new Set((invoiceCheck || []).map((i: any) => i.invoice_number));
            const missingInvoices = invoiceNumbers.filter(num => !existingInvoiceNumbers.has(num));
            
            if (missingInvoices.length > 0) {
                console.error('❌ [ERROR] Invoice numbers not found:', missingInvoices);
                await supabase.from('payments').delete().eq('id', paymentData.id);
                throw new Error(`Invoice numbers not found: ${missingInvoices.join(', ')}`);
            }

            const { error: allocationsError, data: allocationsData } = await supabase
                .from('payment_allocations')
                .insert(allocationsToInsert)
                .select();

            if (allocationsError) {
                console.error('❌ [ERROR] Error creating payment allocations:', allocationsError);
                console.error('❌ [ERROR] Allocations data attempted:', allocationsToInsert);
                console.error('❌ [ERROR] Payment ID:', paymentData.id);
                console.error('❌ [ERROR] Full error details:', JSON.stringify(allocationsError, null, 2));
                // Rollback payment if allocations fail
                await supabase.from('payments').delete().eq('id', paymentData.id);
                throw new Error(`Failed to create payment allocations: ${allocationsError.message || JSON.stringify(allocationsError)}`);
            }

            console.log('✅ [DEBUG] Successfully created payment allocations:', allocationsData);
        }
    }

    // Fetch the complete payment with joined data
    const fullPayment = await fetchFullPayment(paymentData.id);
    if (!fullPayment) {
        throw new Error('Failed to fetch created payment');
    }

    return fullPayment;
}

/**
 * Updates an existing payment and its allocations
 */
export async function updatePayment(paymentId: number, data: PaymentSubmissionData): Promise<Payment> {
    // Update payment
    const { error: paymentError } = await supabase
        .from('payments')
        .update({
            admission_number: data.admission_number,
            student_name: data.student_name,
            payment_date: data.payment_date,
            amount: data.amount,
            payment_method_id: data.payment_method_id,
            account_id: data.account_id,
            reference_number: data.reference_number || null,
            notes: data.notes || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

    if (paymentError) {
        console.error('Error updating payment:', paymentError);
        throw new Error('Failed to update payment');
    }

    // Delete existing allocations
    const { error: deleteError } = await supabase
        .from('payment_allocations')
        .delete()
        .eq('payment_id', paymentId);

    if (deleteError) {
        console.error('Error deleting old allocations:', deleteError);
        throw new Error('Failed to update payment allocations');
    }

    // Insert new allocations if any
    if (data.allocations && data.allocations.length > 0) {
        const allocationsToInsert = data.allocations.map(allocation => ({
            payment_id: paymentId,
            invoice_number: allocation.invoice_number,
            allocated_amount: allocation.allocated_amount
        }));

        const { error: allocationsError } = await supabase
            .from('payment_allocations')
            .insert(allocationsToInsert);

        if (allocationsError) {
            console.error('Error creating payment allocations:', allocationsError);
            throw new Error('Failed to update payment allocations');
        }
    }

    // Fetch the complete payment with joined data
    const fullPayment = await fetchFullPayment(paymentId);
    if (!fullPayment) {
        throw new Error('Failed to fetch updated payment');
    }

    return fullPayment;
}

/**
 * Deletes a payment and its allocations
 */
export async function deletePayment(paymentId: number): Promise<void> {
    // Allocations will be deleted automatically due to CASCADE
    const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

    if (error) {
        console.error('Error deleting payment:', error);
        throw new Error('Failed to delete payment');
    }
}

/**
 * Marks invoices as 'Forwarded' when their balances are brought forward to a new invoice.
 * This ensures data integrity - invoices that have been forwarded should not be counted in outstanding balances.
 * Also clears the balance_due by increasing payment_made to equal the total_amount (or adding balance_due to existing payment_made).
 * @param invoiceNumbers Array of invoice numbers to mark as 'Forwarded'
 * @returns The number of invoices successfully updated
 */
export async function markInvoicesAsForwarded(invoiceNumbers: string[]): Promise<number> {
    if (invoiceNumbers.length === 0) {
        return 0;
    }

    console.log(`🔄 [DEBUG] Marking ${invoiceNumbers.length} invoices as 'Forwarded' and clearing balances...`);

    // First, fetch the current invoices to get their payment_made and balance_due values
    const { data: invoicesData, error: fetchError } = await supabase
        .from('invoices')
        .select('invoice_number, payment_made, balance_due, total_amount')
        .in('invoice_number', invoiceNumbers);

    if (fetchError) {
        console.error("❌ [ERROR] Error fetching invoices to forward:", fetchError);
        throw new Error(`Failed to fetch invoices: ${fetchError.message}`);
    }

    if (!invoicesData || invoicesData.length === 0) {
        console.warn("⚠️ [WARNING] No invoices found to mark as Forwarded");
        return 0;
    }

    // Update each invoice: add balance_due to payment_made, set balance_due to 0, and set status to 'Forwarded'
    // This effectively treats the forwarded amount as "paid" so balance_due becomes 0
    const updates = invoicesData.map(invoice => {
        const currentPaymentMade = parseFloat(invoice.payment_made || '0');
        const currentBalanceDue = parseFloat(invoice.balance_due || '0');
        const newPaymentMade = currentPaymentMade + currentBalanceDue;

        return {
            invoice_number: invoice.invoice_number,
            payment_made: newPaymentMade.toFixed(2),
            balance_due: 0, // Clear the balance since it's being brought forward
            status: 'Forwarded'
        };
    });

    // Update all invoices
    let updatedCount = 0;
    for (const update of updates) {
        const { error: updateError } = await supabase
            .from('invoices')
            .update({
                payment_made: update.payment_made,
                balance_due: update.balance_due,
                status: update.status
            })
            .eq('invoice_number', update.invoice_number);

        if (updateError) {
            console.error(`❌ [ERROR] Error updating invoice ${update.invoice_number}:`, updateError);
            // Continue with other invoices even if one fails
        } else {
            updatedCount++;
            console.log(`✅ [DEBUG] Updated invoice ${update.invoice_number}: payment_made = ${update.payment_made}, balance_due = 0, status = Forwarded`);
        }
    }

    console.log(`✅ [DEBUG] Successfully marked ${updatedCount} invoices as 'Forwarded' and cleared their balances.`);
    return updatedCount;
}

/**
 * Transfers overdue balances to the balance_brought_forward table and deletes original invoices.
 * IMPORTANT: This is an irreversible, transactional operation.
 * @param balancesToTransfer The list of balances to save/delete.
 * @returns The total number of successful deletions/transfers.
 */
export async function finalizeAndTransferBalances(balancesToTransfer: OutstandingBalanceReview[]): Promise<number> {
    if (balancesToTransfer.length === 0) {
        return 0;
    }

    // 1. Prepare data for INSERT (balance_brought_forward table)
    const bbfPayload: BalanceBroughtForwardPayload[] = balancesToTransfer.map(b => ({
        student_name: b.name,
        admission_number: b.admission_number,
        invoice_number: b.invoice_number,
        invoice_description: b.invoice_description,
        // Convert number to precise string for DB insertion
        balance_due: b.balance_due, 
    }));

    // 2. Prepare list of invoice_numbers for DELETE (invoices table)
    const invoiceNumbersToDelete = balancesToTransfer.map(b => b.invoice_number);

    console.log(`🐛 [DEBUG] Initiating transfer for ${bbfPayload.length} balances and deletion of ${invoiceNumbersToDelete.length} invoices...`);

    // --- EXECUTE TRANSACTION (Simulated by sequential operations + error handling) ---
    
    // A. INSERT INTO balance_brought_forward
    const { error: insertError } = await supabase
        .from('balance_brought_forward')
        .insert(bbfPayload);

    if (insertError) {
        console.error("❌ [ERROR] Error inserting into balance_brought_forward:", insertError);
        throw new Error(`Failed to save balances to history table: ${insertError.message}`);
    }
    console.log(`✅ [DEBUG] Successfully saved ${bbfPayload.length} records to balance_brought_forward.`);

    // B. DELETE FROM invoices
    const { error: deleteError, count: deletedCount } = await supabase
        .from('invoices')
        .delete({ count: 'exact' }) // Request exact count
        .in('invoice_number', invoiceNumbersToDelete);

    if (deleteError) {
        console.error("❌ [ERROR] Error deleting old invoices:", deleteError);
        // CRITICAL: Throw an error but warn that the data was saved.
        throw new Error(`Failed to delete original invoices. Data was saved to history, but old invoices may still exist: ${deleteError.message}`);
    }

    if (deletedCount !== invoiceNumbersToDelete.length) {
         console.warn(`⚠️ [WARNING] Expected to delete ${invoiceNumbersToDelete.length} invoices, but only ${deletedCount} were deleted.`);
    }

    console.log(`✅ [DEBUG] Successfully deleted ${deletedCount} invoices.`);
    return deletedCount || 0;
}

/**
 * Deletes a single invoice and its associated line items.
 * @param invoiceNumber The invoice number to delete
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteInvoice(invoiceNumber: string): Promise<boolean> {
    console.log(`🐛 [DEBUG] Deleting invoice ${invoiceNumber}...`);
    
    // First, delete all line items associated with this invoice
    const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_number', invoiceNumber);
    
    if (lineItemsError) {
        console.error("❌ [ERROR] Error deleting invoice line items:", lineItemsError);
        throw new Error(`Failed to delete line items for invoice ${invoiceNumber}: ${lineItemsError.message}`);
    }
    
    console.log(`✅ [DEBUG] Successfully deleted line items for invoice ${invoiceNumber}.`);
    
    // Then, delete the invoice header
    const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('invoice_number', invoiceNumber);
    
    if (invoiceError) {
        console.error("❌ [ERROR] Error deleting invoice:", invoiceError);
        throw new Error(`Failed to delete invoice ${invoiceNumber}: ${invoiceError.message}`);
    }
    
    console.log(`✅ [DEBUG] Successfully deleted invoice ${invoiceNumber}.`);
    return true;
}