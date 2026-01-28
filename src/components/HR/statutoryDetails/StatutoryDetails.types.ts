// src/components/HR/statutoryDetails/StatutoryDetails.types.ts
// @tag: Defines types and interfaces for Statutory Details data structures and component props.

export interface StatutoryField {
  field_id: string;
  field_name: string;
  field_type: 'Dropdown' | 'Text';
  options?: string[];
}

export interface DropdownOption {
  id: number;
  name: string;
}

export interface StatutoryDetailsProps {
  selectedStaff: any;
  onShowAddField: () => void; // preserved for prop compatibility
  onChange?: (values: Record<string, string>) => void;
  values?: Record<string, string>;
}

// Interface for the data/logic provided by the custom hook
export interface StatutoryDetailsHook {
  statutoryFields: StatutoryField[];
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
export interface StatutoryDetailsRenderProps extends Omit<StatutoryDetailsHook, 
  'setShowAddModal' | 'setShowEditModal' | 'setOptionsModalField' | 'refreshFields' | 'handleFieldDelete'
> {
  selectedStaff: any;
  onShowAdd: () => void;
  onShowEdit: () => void;
  onModalCloseAndRefresh: () => void;
  onEditModalClose: () => void;
}
