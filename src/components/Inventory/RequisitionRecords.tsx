import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Search, Filter, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { fetchStaffMembers, StaffMember } from '../../services/staffService';
import { getInventoryItems, InventoryItem, submitRequisition, getRequisitions, updateRequisitionIssued, Requisition } from './Inventory.data';

export const RequisitionRecords: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [currentItemStock, setCurrentItemStock] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;
  const [updateFormData, setUpdateFormData] = useState({
    addToIssuedQty: '',
    returnQty: '',
    updateRequisitionedQty: ''
  });
  const [isUpdateModalHovering, setIsUpdateModalHovering] = useState(false);
  const updateModalScrollRef = useRef<HTMLDivElement>(null);
  const [lineItems, setLineItems] = useState([
    { item: '', description: '', qtyRequisitioned: '', qtyIssued: '' }
  ]);
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingRequisition, setIsUpdatingRequisition] = useState(false);
  const [updateModalMessage, setUpdateModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Requisitions data
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    staffName: ''
  });

  // Filter dropdown state
  const [filterDepartmentSearch, setFilterDepartmentSearch] = useState('');
  const [filterStaffSearch, setFilterStaffSearch] = useState('');
  const [isFilterDepartmentSearching, setIsFilterDepartmentSearching] = useState(false);
  const [isFilterStaffSearching, setIsFilterStaffSearching] = useState(false);
  const filterDepartmentDropdownRef = useRef<HTMLDivElement>(null);
  const filterStaffDropdownRef = useRef<HTMLDivElement>(null);

  // Requested By dropdown state
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isStaffSearching, setIsStaffSearching] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const staffDropdownRef = useRef<HTMLDivElement>(null);

  // Item dropdown state for each line item
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [itemSearchQueries, setItemSearchQueries] = useState<string[]>(['']);
  const [isItemSearching, setIsItemSearching] = useState<boolean[]>([false]);
  const [selectedItems, setSelectedItems] = useState<any[]>([null]);
  const itemDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load staff, inventory, and requisitions data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [staffData, itemsData, requisitionsData] = await Promise.all([
          fetchStaffMembers(),
          getInventoryItems(),
          getRequisitions()
        ]);
        setAllStaff(staffData);
        setAllItems(itemsData);
        setRequisitions(requisitionsData);
      } catch (error) {
        console.error('Error loading requisition data:', error);
      }
    };
    loadData();
  }, []);

  // Update arrays when line items change
  useEffect(() => {
    const currentLength = lineItems.length;
    const queriesLength = itemSearchQueries.length;
    const searchingLength = isItemSearching.length;
    const selectedLength = selectedItems.length;
    const refsLength = itemDropdownRefs.current.length;

    // Extend arrays if needed
    if (currentLength > queriesLength) {
      setItemSearchQueries(prev => [...prev, ...Array(currentLength - queriesLength).fill('')]);
      setIsItemSearching(prev => [...prev, ...Array(currentLength - searchingLength).fill(false)]);
      setSelectedItems(prev => [...prev, ...Array(currentLength - selectedLength).fill(null)]);
      itemDropdownRefs.current = [...itemDropdownRefs.current, ...Array(currentLength - refsLength).fill(null)];
    }
  }, [lineItems.length]);

  // Keyboard navigation for scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovering || !scrollContainerRef.current) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovering]);

  // Keyboard navigation for update modal scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isUpdateModalHovering || !updateModalScrollRef.current) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        updateModalScrollRef.current.scrollBy({
          top: -50,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updateModalScrollRef.current.scrollBy({
          top: 50,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUpdateModalHovering]);

  // Filter staff based on search query
  const filteredStaff = useMemo(() => {
    if (!staffSearchQuery) return [];
    return allStaff.filter(staff =>
      staff.status === 'Active' && (
        staff.full_name?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        staff.department_name?.toLowerCase().includes(staffSearchQuery.toLowerCase())
      )
    );
  }, [allStaff, staffSearchQuery]);

  // Get unique departments from staff
  const uniqueDepartments = useMemo(() => {
    const departments = new Set(allStaff.map(staff => staff.department_name).filter(Boolean));
    return Array.from(departments).sort();
  }, [allStaff]);

  // Filter departments for filter dropdown
  const filteredDepartments = useMemo(() => {
    if (!filterDepartmentSearch) return uniqueDepartments;
    return uniqueDepartments.filter(dept =>
      dept && dept.toLowerCase().includes(filterDepartmentSearch.toLowerCase())
    );
  }, [uniqueDepartments, filterDepartmentSearch]);

  // Filter staff for filter dropdown
  const filteredStaffForFilter = useMemo(() => {
    if (!filterStaffSearch) return allStaff;
    return allStaff.filter(staff =>
      staff.status === 'Active' && (
        staff.full_name?.toLowerCase().includes(filterStaffSearch.toLowerCase()) ||
        staff.department_name?.toLowerCase().includes(filterStaffSearch.toLowerCase())
      )
    );
  }, [allStaff, filterStaffSearch]);

  // Handle staff selection
  const handleSelectStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setStaffSearchQuery(`${staff.full_name} (${staff.department_name})`);
    setIsStaffSearching(false);
  };

  // Handle item selection for each line item
  const handleSelectItem = (item: InventoryItem, index: number) => {
    const newSelectedItems = [...selectedItems];
    const newSearchQueries = [...itemSearchQueries];
    const newSearching = [...isItemSearching];

    newSelectedItems[index] = item;
    // Display description if available, otherwise fallback to category
    newSearchQueries[index] = item.description
      ? `${item.item_name} (${item.description})`
      : `${item.item_name} (${item.category_name})`;
    newSearching[index] = false;

    setSelectedItems(newSelectedItems);
    setItemSearchQueries(newSearchQueries);
    setIsItemSearching(newSearching);

    // Update lineItems with both item and description in a single state update
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], item: item.item_name, description: item.description || '' };
    setLineItems(updatedItems);
  };

  // Filter items based on search query for each line item
  const getFilteredItems = (searchQuery: string) => {
    if (!searchQuery) return [];
    return allItems.filter(item => 
      item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Close item dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      itemDropdownRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target as Node) && isItemSearching[index]) {
          const newSearching = [...isItemSearching];
          newSearching[index] = false;
          setIsItemSearching(newSearching);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isItemSearching]);

  // Close staff dropdown when clicking outside
  useEffect(() => {
    if (!isStaffSearching) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target as Node)) {
        setIsStaffSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStaffSearching]);

  // Close filter department dropdown when clicking outside
  useEffect(() => {
    if (!isFilterDepartmentSearching) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDepartmentDropdownRef.current && !filterDepartmentDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDepartmentSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterDepartmentSearching]);

  // Close filter staff dropdown when clicking outside
  useEffect(() => {
    if (!isFilterStaffSearching) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (filterStaffDropdownRef.current && !filterStaffDropdownRef.current.contains(event.target as Node)) {
        setIsFilterStaffSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterStaffSearching]);

  const addLineItem = () => {
    setLineItems([...lineItems, { item: '', description: '', qtyRequisitioned: '', qtyIssued: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setLineItems(updatedItems);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!selectedStaff) {
      setSubmitMessage({ type: 'error', text: 'Please select a staff member' });
      return;
    }

    const dateInput = (e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement)?.value;
    if (!dateInput) {
      setSubmitMessage({ type: 'error', text: 'Please select a date' });
      return;
    }

    if (lineItems.length === 0 || !lineItems[0].item || !selectedItems[0]) {
      setSubmitMessage({ type: 'error', text: 'Please select an item from the dropdown' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const result = await submitRequisition(
        {
          item_name: lineItems[0].item,
          description: lineItems[0].description || '',
          req_by: selectedStaff.full_name,
          department: selectedStaff.department_name,
          date: dateInput,
          requisitioned: parseInt(lineItems[0].qtyRequisitioned) || 0,
          issued: parseInt(lineItems[0].qtyIssued) || 0
        },
        lineItems,
        selectedStaff
      );

      if (result.success) {
        setSubmitMessage({ type: 'success', text: result.message });
        // Reset form
        setTimeout(async () => {
          setShowForm(false);
          setLineItems([{ item: '', description: '', qtyRequisitioned: '', qtyIssued: '' }]);
          setSelectedStaff(null);
          setStaffSearchQuery('');
          setSelectedItems([null]);
          setItemSearchQueries(['']);
          setSubmitMessage(null);
          // Refresh requisitions
          const updatedRequisitions = await getRequisitions();
          setRequisitions(updatedRequisitions);
        }, 1500);
      } else {
        setSubmitMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error submitting requisition:', error);
      setSubmitMessage({ type: 'error', text: 'An error occurred while submitting the requisition' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter requisitions based on search and filters
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(req => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const itemMatch = req.item.toLowerCase().includes(searchLower);
        const staffMatch = req.req_by.toLowerCase().includes(searchLower);
        const departmentMatch = req.department.toLowerCase().includes(searchLower);
        if (!itemMatch && !staffMatch && !departmentMatch) return false;
      }

      // Status filter
      if (filters.status && req.status !== filters.status) return false;

      // Department filter
      if (filters.department && req.department !== filters.department) return false;

      // Staff name filter
      if (filters.staffName && !req.req_by.toLowerCase().includes(filters.staffName.toLowerCase())) return false;

      return true;
    });
  }, [requisitions, searchTerm, filters]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Calculate paginated data
  const paginatedRequisitions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRequisitions.slice(startIndex, endIndex);
  }, [filteredRequisitions, currentPage]);

  const totalPages = Math.ceil(filteredRequisitions.length / itemsPerPage);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.status ||
      filters.department ||
      filters.staffName
    );
  }, [filters]);

  // Handle update requisition
  const handleUpdateRequisition = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedRequisition) return;

    const addToIssued = parseInt(updateFormData.addToIssuedQty) || 0;
    const returnQty = parseInt(updateFormData.returnQty) || 0;
    const updateRequisitioned = parseInt(updateFormData.updateRequisitionedQty) || 0;

    // Allow updating just the requisitioned quantity, or issuing/returning
    if (addToIssued === 0 && returnQty === 0 && updateRequisitioned === 0) {
      setUpdateModalMessage({ type: 'error', text: 'Please enter an amount to update' });
      return;
    }

    // Validate stock availability before issuing
    if (addToIssued > 0 && addToIssued > currentItemStock) {
      setUpdateModalMessage({ 
        type: 'error', 
        text: `Insufficient stock. Available: ${currentItemStock}, trying to issue: ${addToIssued}` 
      });
      return;
    }

    setIsUpdatingRequisition(true);
    setUpdateModalMessage(null);

    try {
      // If only updating requisitioned quantity (no issue/return)
      if (updateRequisitioned > 0 && addToIssued === 0 && returnQty === 0) {
        const { error } = await supabase
          .from('requisitions')
          .update({ requisitioned: updateRequisitioned })
          .eq('id', selectedRequisition.id);

        if (error) {
          setUpdateModalMessage({ type: 'error', text: 'Failed to update requisitioned quantity' });
        } else {
          setUpdateModalMessage({ type: 'success', text: 'Requisitioned quantity updated successfully' });
          setTimeout(async () => {
            setShowUpdateModal(false);
            setSelectedRequisition(null);
            setUpdateFormData({ addToIssuedQty: '', returnQty: '', updateRequisitionedQty: '' });
            setUpdateModalMessage(null);
            // Refresh requisitions
            const updatedRequisitions = await getRequisitions();
            setRequisitions(updatedRequisitions);
          }, 1500);
        }
      } else {
        // Handle issue/return operations
        const result = await updateRequisitionIssued(
          selectedRequisition.id,
          selectedRequisition.item,
          selectedRequisition.description || '',
          addToIssued,
          returnQty,
          new Date().toISOString().split('T')[0]
        );

        if (result.success) {
          setUpdateModalMessage({ type: 'success', text: result.message });
          setTimeout(async () => {
            setShowUpdateModal(false);
            setSelectedRequisition(null);
            setUpdateFormData({ addToIssuedQty: '', returnQty: '', updateRequisitionedQty: '' });
            setUpdateModalMessage(null);
            // Refresh requisitions
            const updatedRequisitions = await getRequisitions();
            setRequisitions(updatedRequisitions);
          }, 1500);
        } else {
          setUpdateModalMessage({ type: 'error', text: result.message });
        }
      }
    } catch (error) {
      console.error('Error updating requisition:', error);
      setUpdateModalMessage({ type: 'error', text: 'An error occurred while updating the requisition' });
    } finally {
      setIsUpdatingRequisition(false);
    }
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Search, Filters, and New Requisition */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search requisitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className={`flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border rounded-lg hover:bg-gray-50 relative ${
                hasActiveFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-600'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filters</span>
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
              )}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">New Requisition</span>
            </button>
          </div>
        </div>

        {/* Requisitions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requisitioned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRequisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{req.item}</div>
                      <div className="text-xs text-gray-500">{req.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{req.req_by}</div>
                      <div className="text-xs text-gray-500">{req.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                      {req.requisitioned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {req.issued}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      <div>
                        {req.total_price !== undefined && req.total_price !== null ? `Ksh. ${req.total_price.toLocaleString()}` : '-'}
                      </div>
                      {req.unit_price !== undefined && req.unit_price !== null && (
                        <div className="text-xs text-gray-400 mt-1">
                          Unit Cost: Ksh. {req.unit_price.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        req.status === 'Complete'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={async () => {
                          setSelectedRequisition(req);
                          setUpdateFormData({
                            addToIssuedQty: '',
                            returnQty: '',
                            updateRequisitionedQty: ''
                          });
                          // Fetch current stock for the item
                          try {
                            const trimmedItemName = req.item.trim();
                            const trimmedDescription = req.description ? req.description.trim() : '';

                            // Strict match with both item_name and description (case-insensitive, trimmed)
                            const { data: inventoryItem } = await supabase
                              .from('inventory_items')
                              .select('in_stock')
                              .ilike('item_name', trimmedItemName)
                              .ilike('description', trimmedDescription)
                              .maybeSingle();

                            if (inventoryItem) {
                              setCurrentItemStock(inventoryItem.in_stock);
                            } else {
                              // No matching inventory record found
                              setCurrentItemStock(0);
                            }
                          } catch (error) {
                            console.error('Error fetching current stock:', error);
                            setCurrentItemStock(0);
                          }
                          setShowUpdateModal(true);
                        }}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors">
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 mb-4 px-6">
              <div className="text-sm text-gray-700">
                Showing {paginatedRequisitions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredRequisitions.length)} of {filteredRequisitions.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <style>
              {`
                @media (min-width: 768px) {
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                  .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                  }
                }
              `}
            </style>
            <div 
              ref={scrollContainerRef}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {submitMessage && (
                <div className={`p-4 rounded-lg flex items-center space-x-3 mb-4 ${
                  submitMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {submitMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className={submitMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {submitMessage.text}
                  </span>
                </div>
              )}
              <form className="space-y-4" onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative" ref={staffDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by Name or Department"
                        value={staffSearchQuery}
                        onChange={(e) => {
                          setStaffSearchQuery(e.target.value);
                          setIsStaffSearching(true);
                          if (!e.target.value) {
                            setSelectedStaff(null);
                          }
                        }}
                        onFocus={() => setIsStaffSearching(true)}
                        onBlur={() => {}}
                        onMouseDown={() => {}}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {selectedStaff && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaff(null);
                            setStaffSearchQuery('');
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {isStaffSearching && staffSearchQuery.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {filteredStaff.length > 0 ? (
                          filteredStaff.map(staff => (
                            <li
                              key={staff.id}
                              onMouseDown={() => handleSelectStaff(staff)}
                              className="p-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                            >
                              <span className="font-medium text-gray-900">{staff.full_name}</span>
                              <span className="text-sm text-gray-500">{staff.department_name}</span>
                            </li>
                          ))
                        ) : (
                          <li className="p-3 text-gray-500 italic">No staff found matching "{staffSearchQuery}".</li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Line Items Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Line Items</h3>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  {/* Render line items dynamically */}
                  {lineItems.map((lineItem, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                        <div className="relative" ref={el => itemDropdownRefs.current[index] = el}>
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by Item name or Category"
                            value={itemSearchQueries[index] || ''}
                            onChange={(e) => {
                              const newQueries = [...itemSearchQueries];
                              const newSearching = [...isItemSearching];
                              newQueries[index] = e.target.value;
                              newSearching[index] = true;
                              setItemSearchQueries(newQueries);
                              setIsItemSearching(newSearching);
                              if (!e.target.value) {
                                const newSelected = [...selectedItems];
                                newSelected[index] = null;
                                setSelectedItems(newSelected);
                              }
                            }}
                            onFocus={() => {
                              const newSearching = [...isItemSearching];
                              newSearching[index] = true;
                              setIsItemSearching(newSearching);
                            }}
                            onBlur={() => {}}
                            onMouseDown={() => {}}
                            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {selectedItems[index] && (
                            <button
                              type="button"
                              onClick={() => {
                                const newSelected = [...selectedItems];
                                const newQueries = [...itemSearchQueries];
                                newSelected[index] = null;
                                newQueries[index] = '';
                                setSelectedItems(newSelected);
                                setItemSearchQueries(newQueries);
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {isItemSearching[index] && itemSearchQueries[index] && itemSearchQueries[index].length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                              {getFilteredItems(itemSearchQueries[index]).length > 0 ? (
                                getFilteredItems(itemSearchQueries[index]).map(item => (
                                  <li
                                    key={item.id}
                                    onMouseDown={() => handleSelectItem(item, index)}
                                    className="p-3 cursor-pointer hover:bg-blue-50"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-gray-900">{item.item_name}</span>
                                      <span className="text-sm text-gray-500">{item.category_name} (Stock: {item.in_stock})</span>
                                    </div>
                                    {item.description && (
                                      <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                                    )}
                                  </li>
                                ))
                              ) : (
                                <li className="p-3 text-gray-500 italic">No items found matching "{itemSearchQueries[index]}".</li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qty Requisitioned</label>
                        <input
                          type="number"
                          value={lineItem.qtyRequisitioned}
                          onChange={(e) => updateLineItem(index, 'qtyRequisitioned', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qty Issued</label>
                        <input
                          type="number"
                          value={lineItem.qtyIssued}
                          onChange={(e) => updateLineItem(index, 'qtyIssued', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length <= 1}
                          className={`p-2 rounded-lg transition-colors ${
                            lineItems.length > 1
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-red-300 cursor-not-allowed'
                          }`}
                          title={lineItems.length > 1 ? 'Remove Item' : 'Cannot remove last item'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setLineItems([{ item: '', description: '', qtyRequisitioned: '', qtyIssued: '' }]);
                      setSubmitMessage(null);
                    }}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    )}
                    <span>{isSubmitting ? 'Recording...' : 'Record Requisition'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Requisition Modal */}
        {showUpdateModal && selectedRequisition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <style>
              {`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}
            </style>
            <div 
              ref={updateModalScrollRef}
              className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide"
              onMouseEnter={() => setIsUpdateModalHovering(true)}
              onMouseLeave={() => setIsUpdateModalHovering(false)}
              onWheel={(e) => {
                const target = e.currentTarget;
                target.scrollTop += e.deltaY;
              }}
              tabIndex={-1}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Update Requisition</h3>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {updateModalMessage && (
                <div className={`p-4 rounded-lg flex items-center space-x-3 mb-4 ${
                  updateModalMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {updateModalMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className={updateModalMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {updateModalMessage.text}
                  </span>
                </div>
              )}

              {/* Item Info Display */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Item:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedRequisition.item}
                    {selectedRequisition.description && ` (${selectedRequisition.description})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Requested By:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedRequisition.req_by}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-sm text-gray-600">Current Requisitioned:</span>
                  <span className="text-sm font-medium text-blue-600">{selectedRequisition.requisitioned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Issued:</span>
                  <span className="text-sm font-medium text-green-600">{selectedRequisition.issued}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-sm text-gray-600">Available Stock:</span>
                  <span className="text-sm font-medium text-purple-600">{currentItemStock}</span>
                </div>
              </div>

              {/* Update Form */}
              <form 
                onSubmit={handleUpdateRequisition}
                className="space-y-4"
              >
                {/* Update Requisitioned Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update Requisitioned Quantity
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Set a new requisitioned amount (optional)</p>
                  <input
                    type="number"
                    value={updateFormData.updateRequisitionedQty}
                    onChange={(e) => setUpdateFormData({
                      ...updateFormData,
                      updateRequisitionedQty: e.target.value
                    })}
                    placeholder="Leave blank to keep current"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Add to Issued Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Add to Issued Quantity
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Additional quantity to issue</p>
                  <input
                    type="number"
                    min="0"
                    value={updateFormData.addToIssuedQty}
                    onChange={(e) => setUpdateFormData({
                      ...updateFormData,
                      addToIssuedQty: e.target.value
                    })}
                    placeholder="0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Return Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Quantity
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Amount being returned to inventory</p>
                  <input
                    type="number"
                    min="0"
                    value={updateFormData.returnQty}
                    onChange={(e) => setUpdateFormData({
                      ...updateFormData,
                      returnQty: e.target.value
                    })}
                    placeholder="0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpdateModal(false);
                      setUpdateModalMessage(null);
                    }}
                    disabled={isUpdatingRequisition}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingRequisition}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isUpdatingRequisition && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    )}
                    <span>{isUpdatingRequisition ? 'Updating...' : 'Update'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Filter Requisitions</h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Partially Issued">Partially Issued</option>
                    <option value="Fully Issued">Fully Issued</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Department Filter */}
                <div className="relative" ref={filterDepartmentDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.department || filterDepartmentSearch}
                      onChange={(e) => {
                        setFilterDepartmentSearch(e.target.value);
                        setIsFilterDepartmentSearching(true);
                        if (!e.target.value) {
                          setFilters({ ...filters, department: '' });
                        }
                      }}
                      onFocus={() => setIsFilterDepartmentSearching(true)}
                      onBlur={() => {}}
                      onMouseDown={() => {}}
                      placeholder="Search department"
                      className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {filters.department && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilters({ ...filters, department: '' });
                          setFilterDepartmentSearch('');
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isFilterDepartmentSearching && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {filteredDepartments.length > 0 ? (
                        filteredDepartments.map(dept => (
                          <li
                            key={dept}
                            onMouseDown={() => {
                              if (dept) {
                                setFilters({ ...filters, department: dept });
                                setFilterDepartmentSearch(dept);
                              }
                              setIsFilterDepartmentSearching(false);
                            }}
                            className="p-3 cursor-pointer hover:bg-blue-50"
                          >
                            {dept}
                          </li>
                        ))
                      ) : (
                        <li className="p-3 text-gray-500 italic">No departments found matching "{filterDepartmentSearch}".</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Staff Name Filter */}
                <div className="relative" ref={filterStaffDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.staffName || filterStaffSearch}
                      onChange={(e) => {
                        setFilterStaffSearch(e.target.value);
                        setIsFilterStaffSearching(true);
                        if (!e.target.value) {
                          setFilters({ ...filters, staffName: '' });
                        }
                      }}
                      onFocus={() => setIsFilterStaffSearching(true)}
                      onBlur={() => {}}
                      onMouseDown={() => {}}
                      placeholder="Search staff name"
                      className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {filters.staffName && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilters({ ...filters, staffName: '' });
                          setFilterStaffSearch('');
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isFilterStaffSearching && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {filteredStaffForFilter.length > 0 ? (
                        filteredStaffForFilter.map(staff => (
                          <li
                            key={staff.id}
                            onMouseDown={() => {
                              setFilters({ ...filters, staffName: staff.full_name });
                              setFilterStaffSearch(`${staff.full_name} (${staff.department_name})`);
                              setIsFilterStaffSearching(false);
                            }}
                            className="p-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                          >
                            <span className="font-medium text-gray-900">{staff.full_name}</span>
                            <span className="text-sm text-gray-500">{staff.department_name}</span>
                          </li>
                        ))
                      ) : (
                        <li className="p-3 text-gray-500 italic">No staff found matching "{filterStaffSearch}".</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setFilters({ status: '', department: '', staffName: '' });
                      setSearchTerm('');
                      setFilterDepartmentSearch('');
                      setFilterStaffSearch('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};