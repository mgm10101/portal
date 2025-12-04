// src/components/Students/masterlist/CustomFields.types.ts
// @tag: Defines types and interfaces for Custom Fields data structures and component props.

export interface Field {
  field_id: string;
  field_name: string;
  field_type: 'Dropdown' | 'Text';
  options?: string[];
}

export interface DropdownOption {
  id: number;
  name: string;
}

export interface CustomFieldsProps {
  selectedStudent: any;
  onShowAddField: () => void; // preserved for prop compatibility
  onChange?: (values: Record<string, string>) => void;
  values?: Record<string, string>;
  isDisabled?: boolean;
}

// Interface for the data/logic provided by the custom hook
export interface CustomFieldsHook {
  customFields: Field[];
  showAddModal: boolean;
  showEditModal: boolean;
  optionsModalField: string | null;
  dropdownOptions: Record<string, DropdownOption[]>;
  openFields: Record<string, boolean>;
  selectedValues: Record<string, string>;
  setShowAddModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setOptionsModalField: (fieldId: string | null) => void;
  refreshFields: () => Promise<void>;
  openOptions: (fieldId: string) => Promise<void>;
  fetchDropdownOptionsIfNeeded: (fieldId: string) => Promise<void>;
  handleValueChange: (fieldId: string, value: string) => void;
  toggleDropdown: (fieldId: string) => Promise<void>;
  handleOptionsModalAdd: (name: string) => Promise<void>;
  handleOptionsModalDelete: (id: number) => Promise<void>;
  handleFieldDelete: (fieldId: string) => Promise<void>;
}

// Interface for the presentational component props
export interface CustomFieldsRenderProps extends Omit<CustomFieldsHook, 
  'setShowAddModal' | 'setShowEditModal' | 'setOptionsModalField' | 'refreshFields' | 'handleFieldDelete'
> {
  selectedStudent: any;
  onShowAdd: () => void;
  onShowEdit: () => void;
  onModalCloseAndRefresh: () => void;
  onEditModalClose: () => void;
  isDisabled?: boolean;
}