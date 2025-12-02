// src/components/Financial/Invoices/CustomLineItems.tsx

import React, { useState, useEffect } from 'react';
import { Plus, X, Info } from 'lucide-react';
import { ItemMaster } from '../../../types/database';
import { supabase } from '../../../supabaseClient';

// Condition interface for combination rules
export interface Condition {
    conditionId: string;
    field_id: string;
    field_name: string;
    field_value: string;
}

// Updated interface to match service layer - supports both single and multiple conditions
export interface ConditionalLineItemRule {
    ruleId: string;
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

interface CustomLineItemsProps {
    conditionalRules: ConditionalLineItemRule[];
    setConditionalRules: (rules: ConditionalLineItemRule[]) => void;
    masterItems: ItemMaster[];
    isSubmitting: boolean;
    selectedStudentIds: string[];
    allStudents: any[];
    onStagingStatusChange?: (isStaged: boolean) => void; // Optional for backward compatibility
    isStaged?: boolean; // Optional for backward compatibility
}

// Factory function for a new default condition
const getNewDefaultCondition = (): Condition => ({
    conditionId: Date.now().toString() + Math.random().toString().slice(2, 8),
    field_id: '',
    field_name: '',
    field_value: '',
});

// Factory function for a new default rule
const getNewDefaultRule = (): ConditionalLineItemRule => ({
    ruleId: Date.now().toString() + Math.random().toString().slice(2, 6),
    conditions: [getNewDefaultCondition()], // Start with one condition
    itemName: '', // Item name stored in DB
    selectedItemId: '', // Item ID used for dropdown selection (not stored in DB)
    unitPrice: 0.00,
    quantity: 1,
    discount: 0,
    description: null,
});

// Base student fields for conditional rules
const BASE_FIELDS: FieldDefinition[] = [
    { id: 'current_class_id', name: 'Current Class', table: 'classes', type: 'system' },
    { id: 'stream_id', name: 'Stream', table: 'streams', type: 'system' },
    { id: 'team_colour_id', name: 'Team', table: 'team_colours', type: 'system' },
];

// Transport fields
const TRANSPORT_FIELDS: FieldDefinition[] = [
    { id: 'transport_zone_id', name: 'Zone', table: 'transport_zones', type: 'transport' },
    { id: 'transport_type_id', name: 'Transport Type', table: 'transport_types', type: 'transport' },
];

// Accommodation fields
const ACCOMMODATION_FIELDS: FieldDefinition[] = [
    { id: 'boarding_house_id', name: 'House', table: 'boarding_houses', type: 'accommodation' },
    { id: 'accommodation_type_id', name: 'Accommodation Type', table: 'boarding_accommodation_types', type: 'accommodation' },
];

interface FieldDefinition {
    id: string;
    name: string;
    table?: string;
    type: 'system' | 'custom' | 'transport' | 'accommodation';
    fieldType?: 'Text' | 'Dropdown';
}

export const CustomLineItems: React.FC<CustomLineItemsProps> = ({
    conditionalRules,
    setConditionalRules,
    masterItems,
    isSubmitting,
    selectedStudentIds,
}) => {
    const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
    const [fieldOptions, setFieldOptions] = useState<Record<string, any[]>>({});
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [availableFields, setAvailableFields] = useState<FieldDefinition[]>(BASE_FIELDS);

    // Fetch all field definitions and their options on mount
    useEffect(() => {
        const fetchFieldsAndOptions = async () => {
            setLoadingOptions(true);
            try {
                const options: Record<string, any[]> = {};
                
                // Fetch system field options
                const { data: classes } = await supabase
                    .from('classes')
                    .select('id, name')
                    .order('sort_order', { ascending: true, nullsFirst: true });
                options['current_class_id'] = classes || [];
                
                const { data: streams } = await supabase
                    .from('streams')
                    .select('id, name')
                    .order('sort_order', { ascending: true, nullsFirst: true });
                options['stream_id'] = streams || [];
                
                const { data: teams } = await supabase
                    .from('team_colours')
                    .select('id, name')
                    .order('sort_order', { ascending: true, nullsFirst: true });
                options['team_colour_id'] = teams || [];
                
                // Fetch transport field options
                try {
                    const { data: transportZones } = await supabase
                        .from('transport_zones')
                        .select('id, name')
                        .order('name');
                    options['transport_zone_id'] = transportZones || [];
                } catch (err) {
                    console.warn('Could not fetch transport zones:', err);
                    options['transport_zone_id'] = [];
                }
                
                try {
                    const { data: transportTypes } = await supabase
                        .from('transport_types')
                        .select('id, name')
                        .order('sort_order', { ascending: true, nullsFirst: true })
                        .order('id', { ascending: true });
                    options['transport_type_id'] = transportTypes || [];
                } catch (err) {
                    console.warn('Could not fetch transport types:', err);
                    options['transport_type_id'] = [];
                }
                
                // Fetch accommodation field options
                try {
                    const { data: boardingHouses } = await supabase
                        .from('boarding_houses')
                        .select('id, name')
                        .order('name');
                    options['boarding_house_id'] = boardingHouses || [];
                } catch (err) {
                    console.warn('Could not fetch boarding houses:', err);
                    options['boarding_house_id'] = [];
                }
                
                try {
                    const { data: accommodationTypes } = await supabase
                        .from('boarding_accommodation_types')
                        .select('id, name')
                        .order('name');
                    options['accommodation_type_id'] = accommodationTypes || [];
                } catch (err) {
                    console.warn('Could not fetch accommodation types:', err);
                    options['accommodation_type_id'] = [];
                }
                
                // Fetch custom fields
                const { data: customFields } = await supabase
                    .from('custom_fields')
                    .select('field_id, field_name, field_type, options')
                    .order('field_name');
                
                if (customFields && customFields.length > 0) {
                    const customFieldDefs: FieldDefinition[] = customFields.map((cf: any) => ({
                        id: cf.field_id,
                        name: cf.field_name,
                        type: 'custom' as const,
                        fieldType: cf.field_type
                    }));
                    
                    // Add custom field options
                    customFields.forEach((cf: any) => {
                        if (cf.field_type === 'Dropdown' && cf.options && Array.isArray(cf.options)) {
                            // Map string array to {id, name} format
                            options[cf.field_id] = cf.options.map((opt: string) => ({
                                id: opt, // Use the actual value as ID
                                name: opt
                            }));
                        }
                    });
                    
                    // Combine base fields with transport, accommodation, and custom fields
                    setAvailableFields([...BASE_FIELDS, ...TRANSPORT_FIELDS, ...ACCOMMODATION_FIELDS, ...customFieldDefs]);
                } else {
                    // If no custom fields, still include transport and accommodation fields
                    setAvailableFields([...BASE_FIELDS, ...TRANSPORT_FIELDS, ...ACCOMMODATION_FIELDS]);
                }
                
                setFieldOptions(options);
            } catch (error) {
                console.error('Error fetching field options:', error);
            }
            setLoadingOptions(false);
        };

        fetchFieldsAndOptions();
    }, []);

    const handleAddRule = () => {
        const newRule = getNewDefaultRule();
        setConditionalRules([...conditionalRules, newRule]);
        // Auto-expand the new rule
        setExpandedRules(prev => new Set([...prev, newRule.ruleId]));
    };

    const handleRemoveRule = (ruleId: string) => {
        setConditionalRules(conditionalRules.filter(r => r.ruleId !== ruleId));
        setExpandedRules(prev => {
            const newSet = new Set(prev);
            newSet.delete(ruleId);
            return newSet;
        });
    };

    const handleAddCondition = (ruleId: string) => {
        setConditionalRules(
            conditionalRules.map(rule => {
                if (rule.ruleId !== ruleId) return rule;
                const conditions = rule.conditions || [];
                return {
                    ...rule,
                    conditions: [...conditions, getNewDefaultCondition()]
                };
            })
        );
    };

    const handleRemoveCondition = (ruleId: string, conditionId: string) => {
        setConditionalRules(
            conditionalRules.map(rule => {
                if (rule.ruleId !== ruleId) return rule;
                const conditions = (rule.conditions || []).filter(c => c.conditionId !== conditionId);
                // Ensure at least one condition exists
                if (conditions.length === 0) {
                    return { ...rule, conditions: [getNewDefaultCondition()] };
                }
                return { ...rule, conditions };
            })
        );
    };

    const handleConditionChange = (
        ruleId: string,
        conditionId: string,
        field: keyof Condition,
        value: any
    ) => {
        setConditionalRules(
            conditionalRules.map(rule => {
                if (rule.ruleId !== ruleId) return rule;
                
                const conditions = (rule.conditions || []).map(condition => {
                    if (condition.conditionId !== conditionId) return condition;
                    
                    const updatedCondition = { ...condition, [field]: value };
                    
                    // Auto-populate field_name when field_id changes
                    if (field === 'field_id') {
                        const selectedField = availableFields.find(f => f.id === value);
                        if (selectedField) {
                            updatedCondition.field_name = selectedField.name;
                            updatedCondition.field_value = ''; // Reset value when field changes
                        }
                    }
                    
                    return updatedCondition;
                });
                
                return { ...rule, conditions };
            })
        );
    };

    const handleRuleChange = (
        ruleId: string,
        field: keyof ConditionalLineItemRule,
        value: any
    ) => {
        setConditionalRules(
            conditionalRules.map(rule => {
                if (rule.ruleId !== ruleId) return rule;

                const updatedRule = { ...rule, [field]: value };

                // Auto-populate item details when selectedItemId changes
                if (field === 'selectedItemId') {
                    // Find item by ID (unique identifier) to handle duplicate names correctly
                    const selectedItem = masterItems.find(i => i.id === value);
                    if (selectedItem) {
                        updatedRule.selectedItemId = selectedItem.id;
                        updatedRule.itemName = selectedItem.item_name; // Store the name for DB
                        updatedRule.unitPrice = selectedItem.current_unit_price;
                        updatedRule.description = selectedItem.description;
                    }
                }

                return updatedRule;
            })
        );
    };

    const calculateLineTotal = (rule: ConditionalLineItemRule): number => {
        const discountFactor = 1 - (rule.discount / 100);
        return rule.unitPrice * rule.quantity * discountFactor;
    };

    const toggleRuleExpansion = (ruleId: string) => {
        setExpandedRules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ruleId)) {
                newSet.delete(ruleId);
            } else {
                newSet.add(ruleId);
            }
            return newSet;
        });
    };

    return (
        <div className="p-4 border rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-xl font-semibold">
                        2. Conditional Line Items 
                        <span className="text-sm font-normal text-gray-600 ml-2">
                            ({selectedStudentIds.length} Students Selected)
                        </span>
                    </h4>
                    <div className="flex items-start mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                            Add items that apply only to students matching specific criteria. You can add multiple conditions per rule (all must match).
                            Example: Zone = "Zone 1" AND Transport Type = "One Way". Rules are evaluated when you submit the batch.
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {conditionalRules.map((rule, index) => {
                    const isExpanded = expandedRules.has(rule.ruleId);
                    // Support both old format (field_id) and new format (conditions array)
                    const conditions = rule.conditions || (rule.field_id ? [{
                        conditionId: rule.ruleId + '_legacy',
                        field_id: rule.field_id || '',
                        field_name: rule.field_name || '',
                        field_value: rule.field_value || ''
                    }] : []);
                    
                    // Check if rule is complete (all conditions filled + item selected)
                    const isComplete = conditions.length > 0 && 
                        conditions.every(c => c.field_id && c.field_value) && 
                        rule.itemName;

                    // Build rule summary for header
                    const getRuleSummary = () => {
                        if (!isComplete || !rule.itemName) return null;
                        const conditionTexts = conditions.map(condition => {
                            const fieldDef = availableFields.find(f => f.id === condition.field_id);
                            const isCustomText = fieldDef?.type === 'custom' && fieldDef?.fieldType === 'Text';
                            const options = fieldOptions[condition.field_id] || [];
                            const valueDisplay = isCustomText 
                                ? `"${condition.field_value}"`
                                : (options.find(opt => opt.id.toString() === condition.field_value)?.name || condition.field_value);
                            return `${condition.field_name} = ${valueDisplay}`;
                        });
                        return conditionTexts.join(' AND ');
                    };

                    return (
                        <div key={rule.ruleId} className="border rounded-lg p-4 bg-gray-50">
                            {/* Rule Header */}
                            <div className="flex justify-between items-start mb-3">
                                <button
                                    type="button"
                                    onClick={() => toggleRuleExpansion(rule.ruleId)}
                                    className="text-left flex-1"
                                >
                                    <span className="font-medium text-gray-800">
                                        Rule #{index + 1}
                                        {isComplete && rule.itemName && (
                                            <span className="text-sm text-gray-600 ml-2">
                                                - {rule.itemName} {conditions.length > 1 && `(${conditions.length} conditions)`}
                                                {getRuleSummary() && (
                                                    <span className="block text-xs text-gray-500 mt-1">
                                                        {getRuleSummary()}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRule(rule.ruleId)}
                                    className="text-red-500 hover:text-red-700 ml-2"
                                    disabled={isSubmitting}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Rule Fields */}
                            {isExpanded && (
                                <div className="space-y-4">
                                    {/* Conditions Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Conditions (All must match) <span className="text-red-500">*</span>
                                            </label>
                                            {conditions.length > 1 && (
                                                <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                                                    AND logic
                                                </span>
                                            )}
                                        </div>
                                        
                                        {conditions.map((condition, condIndex) => {
                                            const availableOptions = fieldOptions[condition.field_id] || [];
                                            const selectedFieldDef = availableFields.find(f => f.id === condition.field_id);
                                            const isCustomTextField = selectedFieldDef?.type === 'custom' && selectedFieldDef?.fieldType === 'Text';
                                            
                                            return (
                                                <div key={condition.conditionId} className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {/* Field Selection */}
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                    Field {condIndex + 1}
                                                                </label>
                                                                <select
                                                                    value={condition.field_id}
                                                                    onChange={(e) => handleConditionChange(rule.ruleId, condition.conditionId, 'field_id', e.target.value)}
                                                                    className="w-full p-2 text-sm border rounded-lg"
                                                                    disabled={isSubmitting || loadingOptions}
                                                                >
                                                                    <option value="">Select field...</option>
                                                                    <optgroup label="System Fields">
                                                                        {availableFields.filter(f => f.type === 'system').map(field => (
                                                                            <option key={field.id} value={field.id}>
                                                                                {field.name}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                    {availableFields.some(f => f.type === 'transport') && (
                                                                        <optgroup label="Transport">
                                                                            {availableFields.filter(f => f.type === 'transport').map(field => (
                                                                                <option key={field.id} value={field.id}>
                                                                                    {field.name}
                                                                                </option>
                                                                            ))}
                                                                        </optgroup>
                                                                    )}
                                                                    {availableFields.some(f => f.type === 'accommodation') && (
                                                                        <optgroup label="Accommodation">
                                                                            {availableFields.filter(f => f.type === 'accommodation').map(field => (
                                                                                <option key={field.id} value={field.id}>
                                                                                    {field.name}
                                                                                </option>
                                                                            ))}
                                                                        </optgroup>
                                                                    )}
                                                                    {availableFields.some(f => f.type === 'custom') && (
                                                                        <optgroup label="Custom Fields">
                                                                            {availableFields.filter(f => f.type === 'custom').map(field => (
                                                                                <option key={field.id} value={field.id}>
                                                                                    {field.name} {field.fieldType === 'Text' ? '(Text)' : ''}
                                                                                </option>
                                                                            ))}
                                                                        </optgroup>
                                                                    )}
                                                                </select>
                                                            </div>

                                                            {/* Field Value */}
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                    Value
                                                                </label>
                                                                {isCustomTextField ? (
                                                                    <input
                                                                        type="text"
                                                                        value={condition.field_value}
                                                                        onChange={(e) => handleConditionChange(rule.ruleId, condition.conditionId, 'field_value', e.target.value)}
                                                                        placeholder="Enter value..."
                                                                        className="w-full p-2 text-sm border rounded-lg"
                                                                        disabled={!condition.field_id || isSubmitting}
                                                                    />
                                                                ) : (
                                                                    <select
                                                                        value={condition.field_value}
                                                                        onChange={(e) => handleConditionChange(rule.ruleId, condition.conditionId, 'field_value', e.target.value)}
                                                                        className="w-full p-2 text-sm border rounded-lg"
                                                                        disabled={!condition.field_id || isSubmitting || loadingOptions}
                                                                    >
                                                                        <option value="">Select value...</option>
                                                                        {availableOptions.map(option => (
                                                                            <option key={option.id} value={option.id.toString()}>
                                                                                {option.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Remove Condition Button */}
                                                        {conditions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveCondition(rule.ruleId, condition.conditionId)}
                                                                className="text-red-500 hover:text-red-700 mt-6"
                                                                disabled={isSubmitting}
                                                                title="Remove condition"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    {/* AND indicator between conditions */}
                                                    {condIndex < conditions.length - 1 && (
                                                        <div className="flex items-center justify-center mt-2 mb-1">
                                                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                                                AND
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Add Condition Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleAddCondition(rule.ruleId)}
                                            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                                            disabled={isSubmitting}
                                        >
                                            <Plus size={14} className="mr-1" /> Add Another Condition
                                        </button>
                                    </div>

                                    
                                    {/* Item Selection */}
                                    <div className="border-t pt-4 mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Item to Add <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={rule.selectedItemId || ''}
                                            onChange={(e) => handleRuleChange(rule.ruleId, 'selectedItemId', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Select item...</option>
                                            {masterItems.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.item_name} - Ksh.{item.current_unit_price.toFixed(2)}
                                                    {item.description && ` (${item.description})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quantity, Price, Discount */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Quantity */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={rule.quantity}
                                                onChange={(e) => handleRuleChange(rule.ruleId, 'quantity', parseInt(e.target.value) || 1)}
                                                className="w-full p-2 border rounded-lg"
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Unit Price */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Unit Price (Ksh.)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={rule.unitPrice}
                                                onChange={(e) => handleRuleChange(rule.ruleId, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                className="w-full p-2 border rounded-lg"
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Discount */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Discount (%)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={rule.discount}
                                                onChange={(e) => handleRuleChange(rule.ruleId, 'discount', parseInt(e.target.value) || 0)}
                                                className="w-full p-2 border rounded-lg"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    {/* Line Total Display */}
                                    {isComplete && (
                                        <div className="border-t pt-4 mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Line Total
                                            </label>
                                            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg font-medium text-blue-700">
                                                Ksh.{calculateLineTotal(rule).toFixed(2)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Rule Button */}
            <button
                type="button"
                onClick={handleAddRule}
                className="mt-4 flex items-center text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                disabled={isSubmitting}
            >
                <Plus size={16} className="mr-1" /> Add Conditional Rule
            </button>

            {/* Summary */}
            {conditionalRules.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                        <strong>{conditionalRules.length}</strong> conditional rule(s) configured.
                        These will be evaluated per student when you submit the batch.
                    </p>
                </div>
            )}
        </div>
    );
};
