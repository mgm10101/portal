// src/components/CustomRecords.tsx
import React, { useState } from 'react';
import {
  Folder,
  FileText,
  Plus,
  ChevronLeft,
  Pencil,
  Trash2,
  X,
  Search
} from 'lucide-react';

type FieldType = 'text' | 'number' | 'calendar' | 'dropdown' | 'formula';
type Operator = '+' | '-' | '*' | '/';

interface FieldDef {
  id: string;
  name: string;
  type: FieldType;
  options?: string[];
  formulaParts?: { fieldId: string; operator?: Operator }[];
  aggregate?: 'sum' | 'avg' | 'none';
}

interface FolderItem {
  id: string;
  label: string;
  description?: string;
}

interface RecordItem {
  id: string;
  label: string;
  description?: string;
  fields: FieldDef[];
}

const initialFolders: FolderItem[] = [
  { id: 'folder1', label: 'Sample Folder 1', description: 'Demo folder' },
  { id: 'folder2', label: 'Sample Folder 2' },
  { id: 'folder3', label: 'Sample Folder 3' }
];

const sampleRecords: RecordItem[] = [
  {
    id: 'r1',
    label: 'Sample Record 1',
    description: 'Demo record with Boys, Girls, Score',
    fields: [
      { id: 'f1', name: 'Boys', type: 'number', aggregate: 'sum' },
      { id: 'f2', name: 'Girls', type: 'number', aggregate: 'sum' },
      {
        id: 'f3',
        name: 'Score',
        type: 'formula',
        formulaParts: [
          { fieldId: 'f1' },
          { operator: '+', fieldId: 'f2' }
        ],
        aggregate: 'avg'
      }
    ]
  }
];

const sampleDataMap: Record<string, Record<string, number>[]> = {
  r1: [
    { Boys: 12, Girls: 8, Score: 20 },
    { Boys: 15, Girls: 5, Score: 20 },
    { Boys: 10, Girls: 10, Score: 20 }
  ]
};

export const CustomRecords: React.FC = () => {
  // state
  const [folders, setFolders] = useState<FolderItem[]>(initialFolders);
  const [recordsMap, setRecordsMap] = useState<Record<string, RecordItem[]>>({
    folder1: sampleRecords
  });
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // create-folder modal
  const [isFolderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  // create-record modal
  const [isRecordModalOpen, setRecordModalOpen] = useState(false);
  const [newRecordName, setNewRecordName] = useState('');
  const [newRecordDescription, setNewRecordDescription] = useState('');
  const [newFields, setNewFields] = useState<FieldDef[]>([]);

  // edit-folder modal
  const [isEditFolderModalOpen, setEditFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<FolderItem | null>(null);

  // edit-record modal
  const [isEditRecordModalOpen, setEditRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<RecordItem | null>(null);
  const [editRecordName, setEditRecordName] = useState('');
  const [editRecordDescription, setEditRecordDescription] = useState('');
  const [editFields, setEditFields] = useState<FieldDef[]>([]);

  // Clear search when navigating
  const handleSelectFolder = (folder: FolderItem) => {
    setSelectedFolder(folder);
    setSearchTerm('');
  };

  const handleSelectRecord = (record: RecordItem) => {
    setSelectedRecord(record);
    setSearchTerm('');
  };

  const handleBackFromRecord = () => {
    setSelectedRecord(null);
    setSearchTerm('');
  };

  const handleBackFromFolder = () => {
    setSelectedFolder(null);
    setSearchTerm('');
  };

  // OPEN/CREATE FOLDER
  const openFolderModal = () => {
    setNewFolderName('');
    setNewFolderDescription('');
    setFolderModalOpen(true);
  };
  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const id = 'folder-' + Date.now();
    setFolders([...folders, { id, label: newFolderName, description: newFolderDescription }]);
    setFolderModalOpen(false);
  };

  // OPEN/CREATE RECORD
  const openRecordModal = () => {
    setNewRecordName('');
    setNewRecordDescription('');
    setNewFields([]);
    setRecordModalOpen(true);
  };
  const addField = () => {
    setNewFields([...newFields, { id: 'field-' + Date.now(), name: '', type: 'text', options: [], aggregate: 'none' }]);
  };
  const updateField = (idx: number, key: keyof FieldDef, value: any) => {
    const updated = [...newFields];
    if (key === 'type' && value === 'formula') {
      updated[idx].formulaParts = [{ fieldId: '' }];
      updated[idx].aggregate = 'none';
    }
    if (key === 'type' && value !== 'formula') {
      delete updated[idx].formulaParts;
    }
    // @ts-ignore
    updated[idx][key] = value;
    setNewFields(updated);
  };
  const addFormulaTerm = (fieldIdx: number) => {
    const updated = [...newFields];
    const parts = updated[fieldIdx].formulaParts || [];
    parts.push({ operator: '+', fieldId: '' });
    updated[fieldIdx].formulaParts = parts;
    setNewFields(updated);
  };
  const updateFormulaPart = (
    fieldIdx: number,
    partIdx: number,
    key: 'operator' | 'fieldId',
    value: any
  ) => {
    const updated = [...newFields];
    const parts = updated[fieldIdx].formulaParts || [];
    // @ts-ignore
    parts[partIdx][key] = value;
    updated[fieldIdx].formulaParts = parts;
    setNewFields(updated);
  };
  const createRecord = () => {
    if (!newRecordName.trim() || !selectedFolder) return;
    const id = 'record-' + Date.now();
    const rec: RecordItem = { id, label: newRecordName, description: newRecordDescription, fields: newFields };
    setRecordsMap({ ...recordsMap, [selectedFolder.id]: [...(recordsMap[selectedFolder.id] || []), rec] });
    setRecordModalOpen(false);
  };

  // OPEN/EDIT FOLDER
  const openEditFolderModal = (f: FolderItem) => {
    setFolderToEdit({ ...f });
    setEditFolderModalOpen(true);
  };
  const saveEditedFolder = () => {
    if (!folderToEdit) return;
    setFolders(folders.map(f => (f.id === folderToEdit.id ? folderToEdit : f)));
    if (selectedFolder?.id === folderToEdit.id) setSelectedFolder(folderToEdit);
    setEditFolderModalOpen(false);
  };
  const deleteFolder = () => {
    if (!folderToEdit) return;
    setFolders(folders.filter(f => f.id !== folderToEdit.id));
    setRecordsMap(({ [folderToEdit.id]: _, ...rest }) => rest);
    if (selectedFolder?.id === folderToEdit.id) setSelectedFolder(null);
    setEditFolderModalOpen(false);
  };

  // OPEN/EDIT RECORD
  const openEditRecordModal = (r: RecordItem) => {
    if (!selectedFolder) return;
    setRecordToEdit({ ...r });
    setEditRecordName(r.label);
    setEditRecordDescription(r.description || '');
    setEditFields(r.fields.map(fp => ({ ...fp })));
    setEditRecordModalOpen(true);
  };
  const saveEditedRecord = () => {
    if (!recordToEdit || !selectedFolder) return;
    const updatedRec: RecordItem = { ...recordToEdit, label: editRecordName, description: editRecordDescription, fields: editFields };
    setRecordsMap({
      ...recordsMap,
      [selectedFolder.id]: recordsMap[selectedFolder.id].map(r => (r.id === updatedRec.id ? updatedRec : r))
    });
    if (selectedRecord?.id === updatedRec.id) setSelectedRecord(updatedRec);
    setEditRecordModalOpen(false);
  };
  const deleteRecord = () => {
    if (!recordToEdit || !selectedFolder) return;
    setRecordsMap({
      ...recordsMap,
      [selectedFolder.id]: recordsMap[selectedFolder.id].filter(r => r.id !== recordToEdit.id)
    });
    if (selectedRecord?.id === recordToEdit.id) setSelectedRecord(null);
    setEditRecordModalOpen(false);
  };

  // DETAIL VIEW
  if (selectedRecord) {
    const rows = sampleDataMap[selectedRecord.id] || [];
    const aggFields = selectedRecord.fields.filter(f => f.aggregate && f.aggregate !== 'none');
    const stats = aggFields.map(f => {
      const vals = rows.map(r => r[f.name] || 0);
      const total = vals.reduce((a, b) => a + b, 0);
      const avg = vals.length ? total / vals.length : 0;
      return {
        id: f.id,
        title: f.aggregate === 'sum' ? `Total ${f.name}` : `Average ${f.name}`,
        value: f.aggregate === 'sum' ? total : parseFloat(avg.toFixed(2))
      };
    });

    return (
      <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Search and Add New Button */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleBackFromRecord} 
                className="flex-shrink-0 flex items-center text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${selectedRecord.label}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button 
                onClick={openRecordModal} 
                className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Add New</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-3 mb-6 md:mb-3">
            {stats.map(s => (
              <div key={s.id} className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">{s.title}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  {rows[0] && Object.keys(rows[0]).map(col => (
                    <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-gray-50">
                    {Object.values(row).map((val, ci) => (
                      <td key={ci} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{val}</td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-3">
                      <button className="hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                      <button className="hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // BASELINE FOLDERS / RECORD TILES VIEW
  const allItems = selectedFolder ? recordsMap[selectedFolder.id] || [] : folders;
  
  // Filter items based on search term
  const items = allItems.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Search and New Button */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex items-center space-x-2">
            {selectedFolder && (
              <button 
                onClick={handleBackFromFolder} 
                className="flex-shrink-0 flex items-center text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  !selectedFolder 
                    ? "Search Custom Records" 
                    : `Search ${selectedFolder.label} Records`
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {!selectedFolder ? (
              <button 
                onClick={openFolderModal} 
                className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">New Folder</span>
              </button>
            ) : (
              <button 
                onClick={openRecordModal} 
                className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">New Record</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-3">
          {items.map(item =>
            !selectedFolder ? (
              <div
                key={(item as FolderItem).id}
                className="relative bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => handleSelectFolder(item as FolderItem)}
              >
                <Folder className="w-6 h-6 text-gray-600 mb-2" />
                <p className="text-gray-800 font-medium">{(item as FolderItem).label}</p>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    openEditFolderModal(item as FolderItem);
                  }}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                key={(item as RecordItem).id}
                className="relative bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => handleSelectRecord(item as RecordItem)}
              >
                <FileText className="w-6 h-6 text-gray-600 mb-2" />
                <p className="text-gray-800 font-medium">{(item as RecordItem).label}</p>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    openEditRecordModal(item as RecordItem);
                  }}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex min-h-screen items-start justify-center p-4 sm:items-center">
            <div className="bg-white p-6 md:p-4 rounded-lg w-full max-w-md border border-gray-200 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">New Folder</h2>
                <button onClick={() => setFolderModalOpen(false)}><X className="w-5 h-5 text-gray-600" /></button>
              </div>
              <label className="block mb-2 text-gray-700">Folder Name</label>
              <input
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
              />
              <label className="block mb-2 text-gray-700">Description (optional)</label>
              <textarea
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                value={newFolderDescription}
                onChange={e => setNewFolderDescription(e.target.value)}
              />
              <button
                onClick={createFolder}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Record Modal */}
      {isRecordModalOpen && selectedFolder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex min-h-screen items-start justify-center p-4 sm:items-center">
            <div className="bg-white p-6 md:p-4 rounded-lg w-full max-w-lg border border-gray-200 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">New Record</h2>
                <button onClick={() => setRecordModalOpen(false)}><X className="w-5 h-5 text-gray-600" /></button>
              </div>
              <label className="block mb-2 text-gray-700">Record Name</label>
              <input
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                value={newRecordName}
                onChange={e => setNewRecordName(e.target.value)}
              />
              <label className="block mb-2 text-gray-700">Description (optional)</label>
              <textarea
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                value={newRecordDescription}
                onChange={e => setNewRecordDescription(e.target.value)}
              />

              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Fields</h3>
                {newFields.map((f, idx) => (
                  <div key={f.id} className="mb-3 border p-3 rounded border-gray-300">
                    <label className="block text-gray-700 mb-1">Field Name</label>
                    <input
                      className="w-full mb-2 p-1 border border-gray-300 rounded"
                      value={f.name}
                      onChange={e => updateField(idx, 'name', e.target.value)}
                    />
                    <label className="block text-gray-700 mb-1">Type</label>
                    <select
                      className="w-full mb-2 p-1 border border-gray-300 rounded"
                      value={f.type}
                      onChange={e => updateField(idx, 'type', e.target.value as FieldType)}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="calendar">Calendar</option>
                      <option value="dropdown">Drop-down</option>
                      <option value="formula">Formula</option>
                    </select>  
                    {f.type === 'dropdown' && (
                      <>
                        <label className="block text-gray-700 mb-1">Options (comma-separated)</label>
                        <input
                          className="w-full mb-2 p-1 border border-gray-300 rounded"
                          value={f.options?.join(',')}
                          onChange={e => updateField(idx, 'options', e.target.value.split(',').map(o => o.trim()))}
                        />
                      </>
                    )}
                    {f.type === 'formula' && f.formulaParts && (
                      <div className="space-y-2 mb-2">
                        {f.formulaParts.map((part, pi) => (
                          <div key={pi} className="flex items-center space-x-2">
                            {pi > 0 && (
                              <select
                                className="p-2 border border-gray-300 rounded"
                                value={part.operator}
                                onChange={e => updateFormulaPart(idx, pi, 'operator', e.target.value as Operator)}
                              >
                                <option value="+">+</option>
                                <option value="-">−</option>
                                <option value="*">×</option>
                                <option value="/">÷</option>
                              </select>
                            )}
                            <select
                              className="flex-1 p-2 border border-gray-300 rounded"
                              value={part.fieldId}
                              onChange={e => updateFormulaPart(idx, pi, 'fieldId', e.target.value)}
                            >
                              <option value="">Select field</option>
                              {newFields.filter((_, fi) => fi !== idx).map(ff => (
                                <option key={ff.id} value={ff.id}>{ff.name || 'Unnamed'}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                        <button
                          onClick={() => addFormulaTerm(idx)}
                          className="flex items-center text-blue-600 hover:text-blue-800 mt-1"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add term
                        </button>
                      </div>
                    )}
                    {(f.type === 'number' || f.type === 'formula') && (
                      <>
                        <label className="block text-gray-700 mb-1">Aggregate</label>
                        <select
                          className="w-full mb-2 p-1 border border-gray-300 rounded"
                          value={f.aggregate || 'none'}
                          onChange={e => updateField(idx, 'aggregate', e.target.value as FieldDef['aggregate'])}
                        >
                          <option value="none">None</option>
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                        </select>
                      </>
                    )}
                  </div>
                ))}
                <button onClick={addField} className="flex items-center text-blue-600 hover:text-blue-800">
                  <Plus className="w-4 h-4 mr-1" /> Add field
                </button>
              </div>

              <button
                onClick={createRecord}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Create Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Folder Modal */}
      {isEditFolderModalOpen && folderToEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex min-h-screen items-start justify-center p-4 sm:items-center">
            <div className="bg-white p-6 md:p-4 rounded-lg w-full max-w-md border border-gray-200 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Edit Folder</h2>
                <button onClick={() => setEditFolderModalOpen(false)}><X className="w-5 h-5 text-gray-600" /></button>
              </div>
              <label className="block mb-2 text-gray-700">Folder Name</label>
              <input
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                value={folderToEdit.label}
                onChange={e => setFolderToEdit({ ...folderToEdit, label: e.target.value })}
              />
              <label className="block mb-2 text-gray-700">Description (optional)</label>
              <textarea
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                value={folderToEdit.description}
                onChange={e => setFolderToEdit({ ...folderToEdit, description: e.target.value })}
              />
              <div className="flex justify-end space-x-2">
                <button onClick={saveEditedFolder} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                  Save
                </button>
                <button onClick={deleteFolder} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {isEditRecordModalOpen && recordToEdit && selectedFolder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex min-h-screen items-start justify-center p-4 sm:items-center">
            <div className="bg-white p-6 md:p-4 rounded-lg w-full max-w-lg border border-gray-200 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Edit Record</h2>
                <button onClick={() => setEditRecordModalOpen(false)}><X className="w-5 h-5 text-gray-600" /></button>
              </div>
              <label className="block mb-2 text-gray-700">Record Name</label>
              <input
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                value={editRecordName}
                onChange={e => setEditRecordName(e.target.value)}
              />
              <label className="block mb-2 text-gray-700">Description (optional)</label>
              <textarea
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                value={editRecordDescription}
                onChange={e => setEditRecordDescription(e.target.value)}
              />

              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Fields</h3>
                {editFields.map((f, idx) => (
                  <div key={f.id} className="mb-3 border p-3 rounded border-gray-300">
                    <label className="block text-gray-700 mb-1">Field Name</label>
                    <input
                      className="w-full mb-2 p-1 border border-gray-300 rounded"
                      value={f.name}
                      onChange={e => {
                        const u = [...editFields];
                        u[idx].name = e.target.value;
                        setEditFields(u);
                      }}
                    />
                    <label className="block text-gray-700 mb-1">Type</label>
                    <select
                      className="w-full mb-2 p-1 border border-gray-300 rounded"
                      value={f.type}
                      onChange={e => {
                        const u = [...editFields];
                        u[idx].type = e.target.value as FieldType;
                        if (u[idx].type === 'formula') u[idx].formulaParts = [{ fieldId: '' }];
                        else delete u[idx].formulaParts;
                        setEditFields(u);
                      }}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="calendar">Calendar</option>
                      <option value="dropdown">Drop-down</option>
                      <option value="formula">Formula</option>
                    </select>

                    {f.type === 'dropdown' && (
                      <>
                        <label className="block text-gray-700 mb-1">Options (comma-separated)</label>
                        <input
                          className="w-full mb-2 p-1 border border-gray-300 rounded"
                          value={f.options?.join(',')}
                          onChange={e => {
                            const u = [...editFields];
                            u[idx].options = e.target.value.split(',').map(o => o.trim());
                            setEditFields(u);
                          }}
                        />
                      </>
                    )}

                    {f.type === 'formula' && f.formulaParts && (
                      <div className="space-y-2 mb-2">
                        {f.formulaParts.map((part, pi) => (
                          <div key={pi} className="flex items-center space-x-2">
                            {pi > 0 && (
                              <select
                                className="p-2 border border-gray-300 rounded"
                                value={part.operator}
                                onChange={e => {
                                  const u = [...editFields];
                                  u[idx].formulaParts![pi].operator = e.target.value as Operator;
                                  setEditFields(u);
                                }}
                              >
                                <option value="+">+</option>
                                <option value="-">−</option>
                                <option value="*">×</option>
                                <option value="/">÷</option>
                              </select>
                            )}
                            <select
                              className="flex-1 p-2 border border-gray-300 rounded"
                              value={part.fieldId}
                              onChange={e => {
                                const u = [...editFields];
                                u[idx].formulaParts![pi].fieldId = e.target.value;
                                setEditFields(u);
                              }}
                            >
                              <option value="">Select field</option>
                              {editFields.filter((_, fi) => fi !== idx).map(ff => (
                                <option key={ff.id} value={ff.id}>{ff.name || 'Unnamed'}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const u = [...editFields];
                            u[idx].formulaParts!.push({ operator: '+', fieldId: '' });
                            setEditFields(u);
                          }}
                          className="flex items-center text-blue-600 hover:text-blue-800 mt-1"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add term
                        </button>
                      </div>
                    )}

                    {(f.type === 'number' || f.type === 'formula') && (
                      <>
                        <label className="block text-gray-700 mb-1">Aggregate</label>
                        <select
                          className="w-full mb-2 p-1 border border-gray-300 rounded"
                          value={f.aggregate || 'none'}
                          onChange={e => {
                            const u = [...editFields];
                            u[idx].aggregate = e.target.value as FieldDef['aggregate'];
                            setEditFields(u);
                          }}
                        >
                          <option value="none">None</option>
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                        </select>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setEditFields(editFields.filter((_, i) => i !== idx));
                      }}
                      className="flex items-center text-red-600 hover:text-red-800 mt-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Remove field
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setEditFields([...editFields, { id: 'field-' + Date.now(), name: '', type: 'text', options: [], aggregate: 'none' }])}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add field
                </button>
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={saveEditedRecord} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                  Save
                </button>
                <button onClick={deleteRecord} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};