import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Search, Filter, FileText, Trash2, X } from 'lucide-react';

export const RequisitionRecords: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [lineItems, setLineItems] = useState([
    { item: '', qtyRequisitioned: '', qtyIssued: '' }
  ]);
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Requested By dropdown state
  const [allStaff, setAllStaff] = useState([
    { id: 1, name: 'John Teacher', department: 'Grade 8' },
    { id: 2, name: 'Dr. Smith', department: 'Science Department' },
    { id: 3, name: 'Jane Wilson', department: 'Mathematics' },
    { id: 4, name: 'Michael Brown', department: 'English Department' },
    { id: 5, name: 'Sarah Davis', department: 'Computer Science' },
    { id: 6, name: 'Robert Johnson', department: 'Physics Department' },
    { id: 7, name: 'Emily Martinez', department: 'Chemistry Department' },
    { id: 8, name: 'David Anderson', department: 'Biology Department' }
  ]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isStaffSearching, setIsStaffSearching] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const staffDropdownRef = useRef<HTMLDivElement>(null);

  // Item dropdown state for each line item
  const [itemSearchQueries, setItemSearchQueries] = useState<string[]>(['']);
  const [isItemSearching, setIsItemSearching] = useState<boolean[]>([false]);
  const [selectedItems, setSelectedItems] = useState<any[]>([null]);
  const itemDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Sample inventory items
  const [allItems] = useState([
    { id: 1, name: 'Exercise Books A4', category: 'Stationery', stock: 500 },
    { id: 2, name: 'Exercise Books A5', category: 'Stationery', stock: 300 },
    { id: 3, name: 'Pens (Blue)', category: 'Stationery', stock: 1000 },
    { id: 4, name: 'Pens (Black)', category: 'Stationery', stock: 1000 },
    { id: 5, name: 'Pencils (HB)', category: 'Stationery', stock: 800 },
    { id: 6, name: 'Erasers', category: 'Stationery', stock: 500 },
    { id: 7, name: 'Rulers (30cm)', category: 'Stationery', stock: 200 },
    { id: 8, name: 'Scientific Calculators', category: 'Equipment', stock: 50 },
    { id: 9, name: 'Geometry Sets', category: 'Equipment', stock: 100 },
    { id: 10, name: 'Lab Coats', category: 'Uniform', stock: 150 },
    { id: 11, name: 'Safety Goggles', category: 'Equipment', stock: 200 },
    { id: 12, name: 'Microscopes', category: 'Equipment', stock: 25 },
    { id: 13, name: 'Test Tubes', category: 'Lab Supplies', stock: 1000 },
    { id: 14, name: 'Beakers (500ml)', category: 'Lab Supplies', stock: 300 },
    { id: 15, name: 'Chemistry Sets', category: 'Lab Supplies', stock: 40 }
  ]);

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

  // Filter staff based on search query
  const filteredStaff = useMemo(() => {
    if (!staffSearchQuery) return [];
    return allStaff.filter(staff => 
      staff.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      staff.department.toLowerCase().includes(staffSearchQuery.toLowerCase())
    );
  }, [allStaff, staffSearchQuery]);

  // Handle staff selection
  const handleSelectStaff = (staff: any) => {
    setSelectedStaff(staff);
    setStaffSearchQuery(`${staff.name} (${staff.department})`);
    setIsStaffSearching(false);
  };

  // Handle item selection for each line item
  const handleSelectItem = (item: any, index: number) => {
    const newSelectedItems = [...selectedItems];
    const newSearchQueries = [...itemSearchQueries];
    const newSearching = [...isItemSearching];
    
    newSelectedItems[index] = item;
    newSearchQueries[index] = `${item.name} (${item.category})`;
    newSearching[index] = false;
    
    setSelectedItems(newSelectedItems);
    setItemSearchQueries(newSearchQueries);
    setIsItemSearching(newSearching);
    
    // Also update the lineItems array
    updateLineItem(index, 'item', item.name);
  };

  // Filter items based on search query for each line item
  const getFilteredItems = (searchQuery: string) => {
    if (!searchQuery) return [];
    return allItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
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

  const addLineItem = () => {
    setLineItems([...lineItems, { item: '', qtyRequisitioned: '', qtyIssued: '' }]);
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

  const requisitions = [
    {
      id: 1,
      item: 'Exercise Books',
      description: 'A4 ruled exercise books for students',
      department: 'Grade 8',
      requestedBy: 'John Teacher',
      date: '2024-02-15',
      quantityRequisitioned: 100,
      quantityIssued: 80,
      status: 'Partially Issued',
      remarks: 'Remaining 20 out of stock'
    },
    {
      id: 2,
      item: 'Science Lab Equipment',
      description: 'Microscopes and lab apparatus',
      department: 'Science Department',
      requestedBy: 'Dr. Smith',
      date: '2024-02-14',
      quantityRequisitioned: 10,
      quantityIssued: 5,
      status: 'Partially Issued',
      remarks: 'Waiting for new stock'
    }
  ];

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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filters</span>
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{req.item}</div>
                      <div className="text-xs text-gray-500">{req.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{req.requestedBy}</div>
                      <div className="text-xs text-gray-500">{req.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                      {req.quantityRequisitioned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {req.quantityIssued}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors">
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <form className="space-y-4">
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
                              <span className="font-medium text-gray-900">{staff.name}</span>
                              <span className="text-sm text-gray-500">{staff.department}</span>
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
                                    className="p-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                                  >
                                    <span className="font-medium text-gray-900">{item.name}</span>
                                    <span className="text-sm text-gray-500">{item.category} (Stock: {item.stock})</span>
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
                      setLineItems([{ item: '', qtyRequisitioned: '', qtyIssued: '' }]);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Record Requisition
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};