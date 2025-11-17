// src/components/Financial/Invoices/CustomLineItems.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Loader2, Save, Undo2, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { StudentInfo } from '../../../types/database'; // Assuming StudentInfo is imported/accessible

// --- New Interface for Dynamic Custom Fields ---
interface DropdownCustomField {
    field_id: string; // The actual column name in the students table (e.g., 'residence_zone')
    field_name: string; // The display name (e.g., 'Residence Zone')
    options: string[]; // Parsed array of dropdown options
}

// Note: Updated the interface to include the new 'field_id' field for tracking the actual student column
export interface ConditionalLineItemRule {
    ruleId: string; // Unique ID for React keying and identification
    field_id: string; // **NEW**: Student table column name (used for batch processing)
    field_name: string; // The display name (e.g., 'Zone')
    field_value: string; // The selected option value (e.g., 'Zone1')
    item_master_id: string;
    unitPrice: number; // NOTE: We keep this as Unit Price in the state
    description: string | null; // Changed to allow null/undefined description for better type matching
    quantity: number; // ADDED: Quantity field
}

// ⭐ NEW INTERFACE: Represents the FINAL line item to be added to the invoice ⭐
export interface CalculatedLineItem { // Renaming to CalculatedLineItem for clarity in staging
    admission_number: string; // Added for the custom_line_items staging table
    item_name: string; // Fetched from masterItems
    description: string | null;
    unit_price: number;
    quantity: number;
    line_total: number; // Renamed from total_price to line_total for custom_line_items table match
    // NOTE: The following are for LOCAL tracking/debugging only, NOT inserted into DB
    source_rule_id: string;
    qualified_by_field: string;
    qualified_by_value: string;
}

interface CustomLineItemsProps {
    // State and setter from the parent (InvoiceBatchCreate)
    conditionalRules: ConditionalLineItemRule[];
    setConditionalRules: (rules: ConditionalLineItemRule[]) => void;
    // Contextual props
    masterItems: any[]; // Use 'any' or import ItemMaster if possible
    isSubmitting: boolean;
    // ⭐ NEW PROPS FROM InvoiceBatchCreate.tsx ⭐
    selectedStudentIds: string[];
    allStudents: StudentInfo[];
    // ⭐ NEW PROP: Callback to notify parent of save status ⭐
    onStagingStatusChange: (isStaged: boolean) => void;
}

// Factory function for a new default rule
const getNewDefaultRule = (): ConditionalLineItemRule => ({
    ruleId: Date.now().toString() + Math.random().toString().slice(2, 6), // Simple unique ID
    field_id: '', // Will be set after initial field selection
    field_name: '', // ⭐ UPDATED: Start with empty string to prevent auto-selection ⭐
    field_value: '',
    item_master_id: '',
    unitPrice: 0.00,
    description: null, // Initializing as null to match ItemMaster structure
    quantity: 1, // UPDATED: Initialize quantity
});

// --- UPDATED HELPER FUNCTION FOR CONDITIONAL CHECKING (Now returns CALCULATED line items) ---
const checkStudentForConditionalItems = (
    student: StudentInfo,
    rules: ConditionalLineItemRule[],
    studentCustomFieldsMap: Map<string, any>,
    masterItems: any[] // ⭐ NEW: Pass masterItems to get the item name ⭐
): CalculatedLineItem[] => { // Return type changed to CalculatedLineItem[]
    const qualifiedItems: CalculatedLineItem[] = [];

    // Filter down to only fully defined rules
    const definedRules = rules.filter(rule =>
        rule.field_id && rule.field_value && rule.item_master_id && rule.quantity > 0
    );

    // Find the relevant student data (or fall back to the basic student object)
    const studentDataForCheck = studentCustomFieldsMap.get(student.admission_number) || student;

    for (const rule of definedRules) {
        // Access the value using the dynamic field_id
        const studentCustomValue = (studentDataForCheck as any)[rule.field_id];

        const ruleValue = rule.field_value.toString();
        const actualValue = studentCustomValue !== undefined && studentCustomValue !== null
            ? studentCustomValue.toString()
            : "undefined"; // Handle null/undefined values in the DB

        const masterItem = masterItems.find(i => i.id === rule.item_master_id);

        if (actualValue === ruleValue && masterItem) {
            const line_total = rule.unitPrice * rule.quantity;

            qualifiedItems.push({
                admission_number: student.admission_number, // CRITICAL for staging table
                item_name: masterItem.item_name, // Get the display name
                description: rule.description,
                unit_price: rule.unitPrice,
                quantity: rule.quantity,
                line_total: line_total, // Changed to line_total
                // Metadata for LOCAL tracking only
                source_rule_id: rule.ruleId,
                qualified_by_field: rule.field_id,
                qualified_by_value: rule.field_value,
            });
        }
    }

    return qualifiedItems;
};
// -----------------------------------------------------------------------------------------


// ⭐ EXPORTED HELPER: Calculates ALL items across ALL selected students ⭐
export const stageAllQualifiedItems = (
    selectedStudentIds: string[],
    conditionalRules: ConditionalLineItemRule[],
    allStudents: StudentInfo[],
    studentCustomFieldsMap: Map<string, any>,
    masterItems: any[]
): CalculatedLineItem[] => {
    const selectedStudents = allStudents.filter(student =>
        selectedStudentIds.includes(student.admission_number)
    );

    const allStagedItems: CalculatedLineItem[] = [];

    selectedStudents.forEach(student => {
        const studentItems = checkStudentForConditionalItems(
            student,
            conditionalRules,
            studentCustomFieldsMap,
            masterItems
        );
        allStagedItems.push(...studentItems);
    });

    return allStagedItems;
}

// ⭐ EXPORTED HELPER: Function to insert/delete (FULLY IMPLEMENTED AND CORRECTED) ⭐
export const insertStagedCustomLineItems = async (stagedItems: CalculatedLineItem[], studentAdmissionNumbers: string[]) => {
    // 1. Delete existing staged items for the selected students
    const deleteResult = await supabase
        .from('custom_line_items')
        .delete()
        .in('admission_number', studentAdmissionNumbers);

    if (deleteResult.error) {
        console.error("Error deleting existing custom line items:", deleteResult.error);
        return { data: null, error: deleteResult.error };
    }

    if (stagedItems.length === 0) {
        console.log("No new items to stage. Deletion successful.");
        return { data: [], error: null };
    }

    // 2. Map staged items to the target table schema fields (ONLY THE ONES THAT EXIST)
    const itemsToInsert = stagedItems.map(item => ({
        admission_number: item.admission_number,
        item_name: item.item_name,
        description: item.description,
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.line_total,
        // *** REMOVED NON-EXISTENT DB FIELDS: source_rule_id, qualified_by_field, qualified_by_value ***
    }));

    // 3. Insert the new staged items
    const { data, error } = await supabase
        .from('custom_line_items')
        .insert(itemsToInsert)
        .select();

    if (error) {
        console.error("Error inserting custom line items:", error);
    } else {
        console.log(`Successfully staged ${data.length} custom line items.`);
    }

    return { data, error };
};


export const CustomLineItems: React.FC<CustomLineItemsProps> = ({
    conditionalRules,
    setConditionalRules,
    masterItems = [],
    isSubmitting,
    selectedStudentIds,
    allStudents,
    onStagingStatusChange,
}) => {
    const [customFieldsData, setCustomFieldsData] = useState<DropdownCustomField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [studentCustomFieldsMap, setStudentCustomFieldsMap] = useState<Map<string, any>>(new Map());
    const [isFetchingCustomData, setIsFetchingCustomData] = useState(false);

    // ⭐ NEW STATE: Tracking the staging status and save process ⭐
    const [isStaged, setIsStaged] = useState<boolean>(false);
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    // -------------------------------------------------------------

    // --- Data Fetching Logic (UNMODIFIED) ---
    // ... useEffect to fetch custom fields config ... (Keeping it as is)
    useEffect(() => {
        const fetchCustomFields = async () => {
            setIsLoading(true);
            try {
                // Fetch only dropdown fields
                const { data, error } = await supabase
                    .from('custom_fields')
                    .select('field_id, field_name, field_type, options')
                    .eq('field_type', 'Dropdown');

                if (error) {
                    console.error("Supabase Error fetching custom fields config:", error);
                    throw error;
                }

                const processedData: DropdownCustomField[] = data.map((item) => {
                    let parsedOptions: string[] = [];
                    const rawOptions = item.options;

                    if (rawOptions) {
                        try {
                            if (typeof rawOptions !== 'string') {
                                if (Array.isArray(rawOptions)) {
                                    parsedOptions = rawOptions as string[];
                                } else {
                                    throw new Error("Raw options is not a string or array.");
                                }
                            } else {
                                parsedOptions = JSON.parse(rawOptions);
                            }

                            if (!Array.isArray(parsedOptions) || parsedOptions.some(p => typeof p !== 'string')) {
                                throw new Error("Parsed result is not a simple string array.");
                            }

                        } catch (e) {
                            parsedOptions = [];
                        }
                    }

                    return {
                        field_id: item.field_id,
                        field_name: item.field_name,
                        options: parsedOptions, // Will be the parsed array or []
                    };
                });

                setCustomFieldsData(processedData);

            } catch (error) {
                console.error("Error fetching custom fields for conditional rules:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomFields();
    }, []);

    // --- Student Custom Field Data Fetch (UNMODIFIED) ---
    // ... useEffect to fetch student custom field values ... (Keeping it as is)
    useEffect(() => {
        if (selectedStudentIds.length === 0 || isLoading) {
            setStudentCustomFieldsMap(new Map());
            return;
        }

        const fetchStudentCustomData = async () => {
            setIsFetchingCustomData(true);
            const selectQuery = [
                'admission_number',
                'custom_text1', 'custom_text2', 'custom_text3', 'custom_text4', 'custom_text5',
                'custom_num1', 'custom_num2', 'custom_num3'
            ].join(', ');

            try {
                const { data, error } = await supabase
                    .from('students')
                    .select(selectQuery)
                    .in('admission_number', selectedStudentIds);

                if (error) throw error;

                const newMap = new Map();
                data.forEach(student => {
                    newMap.set(student.admission_number, student);
                });

                setStudentCustomFieldsMap(newMap);

            } catch (e) {
                console.error("Failed to fetch student custom fields for check:", e);
                setStudentCustomFieldsMap(new Map());
            } finally {
                setIsFetchingCustomData(false);
            }
        };

        fetchStudentCustomData();

    }, [selectedStudentIds, isLoading]);


    // ⭐ NEW MEMO: Calculate the final list of items for the preview and save operation ⭐
    const allQualifiedItems: CalculatedLineItem[] = useMemo(() => {
        if (isFetchingCustomData || selectedStudentIds.length === 0 || conditionalRules.length === 0) {
            return [];
        }

        return stageAllQualifiedItems(
            selectedStudentIds,
            conditionalRules,
            allStudents,
            studentCustomFieldsMap,
            masterItems
        );
    }, [selectedStudentIds, conditionalRules, allStudents, studentCustomFieldsMap, masterItems, isFetchingCustomData]);


    // ⭐ NEW EFFECT: Notify parent on staging status change ⭐
    useEffect(() => {
        onStagingStatusChange(isStaged);
    }, [isStaged, onStagingStatusChange]);


    // --- IMPLEMENTED Save/Cancel Logic ---
    const handleSaveConfirm = async () => {
        setShowConfirm(false);
        setIsSaving(true);

        const { error } = await insertStagedCustomLineItems(allQualifiedItems, selectedStudentIds);

        if (!error) {
            setIsStaged(true);
            console.log("Custom Line Items successfully staged.");
        } else {
            // Handle save failure (e.g., show error toast/message)
            console.error("Failed to stage custom line items.", error);
            setIsStaged(false);
        }

        setIsSaving(false);
    };


    const handleCancel = async () => {
        setIsSaving(true);
        console.log("Cancel staging logic triggered (deleting items).");

        // The logic to "cancel staging" is simply to delete all staged items
        // for the currently selected students. We pass an empty array to trigger the delete only.
        const { error } = await insertStagedCustomLineItems([], selectedStudentIds);

        if (!error) {
            setIsStaged(false);
            console.log("Custom Line Items successfully unstaged/deleted.");
        } else {
            // Handle delete failure
            console.error("Failed to cancel staging/delete custom line items.", error);
        }

        setIsSaving(false);
    };
    // --------------------------------------------------------------------


    // --- Component Logic (Handlers remain the same) ---
    const handleAddRule = () => {
        setConditionalRules([...conditionalRules, getNewDefaultRule()]);
        setIsStaged(false); // New rule invalidates staging
    };

    const handleRemoveRule = (ruleId: string) => {
        setConditionalRules(conditionalRules.filter(rule => rule.ruleId !== ruleId));
        setIsStaged(false); // Rule removal invalidates staging
    };

    const handleChange = useCallback((index: number, name: keyof ConditionalLineItemRule, value: string | number) => {
        setIsStaged(false); // Any change in a rule invalidates staging
        const newRules = [...conditionalRules];

        let processedValue: string | number = value;
        if (name === 'quantity') {
            processedValue = parseInt(value as string) || 0;
            if (processedValue < 1) processedValue = 1;
        } else if (name === 'unitPrice') {
            processedValue = parseFloat(value as string) || 0.00;
        }

        (newRules[index] as any)[name] = processedValue;

        // Logic to link field_name change to field_id and reset field_value
        if (name === 'field_name') {
            const selectedField = customFieldsData.find(f => f.field_name === value);
            newRules[index].field_id = selectedField ? selectedField.field_id : '';
            newRules[index].field_value = ''; // Reset the value dropdown when field changes

            if (value === '') {
                newRules[index].item_master_id = '';
                newRules[index].unitPrice = 0.00;
                newRules[index].description = null;
            }
        }

        // Auto-fill price and description if item master changes
        if (name === 'item_master_id') {
            const selectedItem = masterItems.find(i => i.id === value);
            if (selectedItem) {
                newRules[index].unitPrice = selectedItem.current_unit_price;
                newRules[index].description = selectedItem.description;
            } else {
                newRules[index].unitPrice = 0.00;
                newRules[index].description = null;
            }
        }

        setConditionalRules(newRules);
    }, [conditionalRules, masterItems, customFieldsData, setConditionalRules]);


    if (isLoading || isFetchingCustomData) {
        return (
            <div className="p-4 border rounded-lg shadow-sm text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                {isLoading ? "Loading custom field configurations..." : "Fetching student custom data for qualification check..."}
            </div>
        );
    }

    const hasCustomFields = customFieldsData.length > 0;
    // CRITERIA FOR SAVE BUTTON: At least one rule must exist
    const showSaveButton = conditionalRules.length > 0;
    const canSave = allQualifiedItems.length > 0 && !isStaged && !isSaving;
    const saveButtonText = isStaged ? "Cancel Staging" : (isSaving ? 'Saving...' : 'Save Custom Items');
    const saveButtonAction = isStaged ? handleCancel : () => setShowConfirm(true);

    // --- Render ---
    return (
        <div className="p-4 border rounded-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-xl font-semibold">
                    2. Conditional Line Items
                    <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
                </h4>

                {/* ⭐ SAVE/CANCEL BUTTON SECTION ⭐ */}
                {showSaveButton && (
                    <div className="space-x-2">
                        {isStaged && (
                            <div className="inline-flex items-center text-sm font-medium text-green-600 bg-green-50 p-2 rounded-lg border border-green-200">
                                <Save size={16} className="mr-1" /> Items Staged & Ready
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={saveButtonAction}
                            disabled={isSaving || (isStaged ? false : !canSave)}
                            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                                isStaged
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            {isStaged ? <Undo2 size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
                            {saveButtonText}
                        </button>
                    </div>
                )}
                {/* ---------------------------------- */}
            </div>

            {/* Conditional Display of Header and Rows */}
            {conditionalRules.length > 0 && (
                <>
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-2 text-base font-semibold text-gray-600 border-b pb-1">
                        <div className="col-span-4">If Field Is</div>
                        <div className="col-span-4">Apply Item (Description)</div>
                        <div className="col-span-1 text-center">Qty</div>
                        <div className="col-span-2 text-right">Total Price</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Rule Rows */}
                    <div className="space-y-3">
                        {conditionalRules.map((rule, index) => {
                            const currentFieldConfig = customFieldsData.find(f => f.field_name === rule.field_name);
                            const fieldValues = currentFieldConfig ? currentFieldConfig.options : [];
                            const totalPrice = rule.unitPrice * rule.quantity;
                            const isRuleStarted = !!rule.field_name;

                            return (
                                <div key={rule.ruleId} className={`grid grid-cols-12 gap-2 items-center ${isStaged ? 'opacity-60 pointer-events-none' : ''}`}>

                                    {/* Field & Value */}
                                    <div className="col-span-4 flex space-x-2">
                                        {/* 1. Field Name Dropdown */}
                                        <select
                                            value={rule.field_name}
                                            onChange={(e) => handleChange(index, 'field_name', e.target.value)}
                                            className="w-1/2 p-2.5 border rounded-lg text-sm disabled:bg-gray-100"
                                            disabled={isSubmitting || !hasCustomFields || isStaged}
                                        >
                                            <option value="">Select Field...</option>
                                            {customFieldsData.map(field => (
                                                <option key={field.field_id} value={field.field_name}>
                                                    {field.field_name}
                                                </option>
                                            ))}
                                        </select>

                                        {/* 2. Field Value Dropdown */}
                                        <select
                                            value={rule.field_value}
                                            onChange={(e) => handleChange(index, 'field_value', e.target.value)}
                                            className="w-1/2 p-2.5 border rounded-lg text-sm disabled:bg-gray-100"
                                            disabled={isSubmitting || fieldValues.length === 0 || isStaged}
                                            required={isRuleStarted}
                                        >
                                            <option value="">Select Value</option>
                                            {fieldValues.map(value => (
                                                <option key={value} value={value}>{value}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Master Item Dropdown */}
                                    <div className="col-span-4">
                                        <select
                                            value={rule.item_master_id}
                                            onChange={(e) => handleChange(index, 'item_master_id', e.target.value)}
                                            className="w-full p-2.5 border rounded-lg text-sm disabled:bg-gray-100"
                                            disabled={isSubmitting || masterItems.length === 0 || isStaged}
                                            required={isRuleStarted}
                                        >
                                            <option value="">Select Item (Unit Price: {rule.unitPrice.toFixed(2)})</option>
                                            {masterItems.map(mItem => (
                                                <option key={mItem.id} value={mItem.id}>
                                                    {mItem.item_name} {mItem.description && `(${mItem.description})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quantity Input */}
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={rule.quantity}
                                        onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                                        className="col-span-1 p-2.5 border rounded-lg text-sm text-center disabled:bg-gray-100"
                                        min="1"
                                        disabled={isSubmitting || isStaged}
                                        required={isRuleStarted}
                                    />

                                    {/* Total Price Display */}
                                    <div className="col-span-2 p-2.5 text-sm text-right font-semibold text-gray-800 bg-gray-50 border rounded-lg">
                                        {totalPrice.toFixed(2)}
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRule(rule.ruleId)}
                                        className="col-span-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                                        disabled={isSubmitting || isStaged}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* No Fields/Rules Message */}
            {!hasCustomFields && (
                <div className="text-center text-gray-500 p-4 border rounded-lg bg-yellow-50/50">
                    No drop-down custom fields found in the database.
                </div>
            )}

            {/* Add Rule Button */}
            <div className="pt-2">
                <button
                    type="button"
                    onClick={handleAddRule}
                    className="flex items-center text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 text-base"
                    disabled={isSubmitting || !hasCustomFields || isStaged}
                >
                    <Plus size={18} className="mr-1" /> Add Conditional Rule
                </button>
            </div>

            {/* --- Qualified Students Preview Section --- */}
            {conditionalRules.length > 0 && (
                <QualifiedStudentsPreview
                    allQualifiedItems={allQualifiedItems}
                    isFetchingCustomData={isFetchingCustomData}
                    isStaged={isStaged}
                    // ⭐ PASSING NEW PROP ⭐
                    allStudents={allStudents} 
                />
            )}
            {/* ------------------------------------------ */}

            {/* Confirmation Pop-up */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm space-y-4">
                        <h3 className="text-lg font-bold text-indigo-700 flex items-center">
                            <AlertTriangle size={20} className="mr-2 text-yellow-500" /> Confirm Item Staging
                        </h3>
                        <p className="text-gray-700">
                            You are about to save **{allQualifiedItems.length}** line item(s) for **{new Set(allQualifiedItems.map(i => i.admission_number)).size}** students.
                            Confirm that you have finished selecting students and configuring rules.
                        </p>
                        <p className="text-sm text-gray-500">
                            *Saving will lock this section until you press 'Cancel Staging'.
                        </p>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-100"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={handleSaveConfirm}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                {isSaving ? 'Saving...' : 'Confirm & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomLineItems;


// ------------------------------------------------------------------------------------------
// ## Qualified Students Preview Component
// ------------------------------------------------------------------------------------------

interface PreviewProps {
    allQualifiedItems: CalculatedLineItem[];
    isFetchingCustomData: boolean;
    isStaged: boolean;
    // ⭐ ADDED NEW PROP ⭐
    allStudents: StudentInfo[]; 
}

const QualifiedStudentsPreview: React.FC<PreviewProps> = ({ allQualifiedItems, isFetchingCustomData, isStaged, allStudents }) => {
    
    // Create a map for quick student name lookup
    const studentNameMap = useMemo(() => {
        return new Map(allStudents.map(s => [s.admission_number, s.name]));
    }, [allStudents]);

    // Group items by admission number for a cleaner display
    const groupedItems = useMemo(() => {
        // FIX: Ensure allQualifiedItems is an array before reducing it.
        if (!Array.isArray(allQualifiedItems)) return new Map<string, CalculatedLineItem[]>();

        return allQualifiedItems.reduce((acc, item) => {
            const studentGroup = acc.get(item.admission_number) || [];
            studentGroup.push(item);
            acc.set(item.admission_number, studentGroup);
            return acc;
        }, new Map<string, CalculatedLineItem[]>());
    }, [allQualifiedItems]);
    
    // NOTE: groupedItems is guaranteed to be a Map here due to the defensive check above
    const totalStudents = groupedItems.size;
    const totalItems = allQualifiedItems.length; // This check relies on the parent passing an array, which should be the case.

    if (isFetchingCustomData) {
        return (
            <div className="p-4 border-t mt-4 text-center text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Calculating potential items...
            </div>
        );
    }

    return (
        <div className="p-4 border-t mt-4 space-y-3">
            <h5 className="text-lg font-semibold text-gray-700 flex items-center justify-between">
                <span>
                    {isStaged ? 'Staged Items Preview' : 'Live Preview'} 
                </span>
                <span className={`text-base font-bold ${totalStudents > 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                    {totalStudents} Student(s) Qualified | {totalItems} Total Item(s)
                </span>
            </h5>
            
            {totalStudents === 0 ? (
                <div className={`p-3 rounded-lg text-center font-medium ${isStaged ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {isStaged ? 'No items were staged as no students qualified.' : 'No students currently qualify for the conditional items defined above.'}
                </div>
            ) : (
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50/50">
                    <div className="space-y-4">
                        {Array.from(groupedItems.entries()).map(([admissionNumber, items]) => {
                            // ⭐ FETCH STUDENT NAME ⭐
                            const studentName = studentNameMap.get(admissionNumber) || 'Name Not Found';
                            
                            return (
                                <div key={admissionNumber} className="border-b pb-2 last:border-b-0">
                                    <p className="font-semibold text-sm text-gray-900 mb-1 flex items-center">
                                        <ArrowRight size={14} className="mr-2 text-indigo-500" />
                                        {admissionNumber} <span className="ml-2 font-normal text-gray-600">({studentName})</span>
                                    </p>
                                    <ul className="list-disc pl-8 text-sm text-gray-700 space-y-0.5">
                                        {items.map((item, index) => (
                                            <li key={`${admissionNumber}-${index}`}>
                                                {item.item_name} ({item.description || 'No Description'}) x {item.quantity} @ {item.unit_price.toFixed(2)} = {item.line_total.toFixed(2)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};