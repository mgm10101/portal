import React, { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchDocumentTypes, addDocumentType, deleteDocumentType } from '../../../api/tables';
import { OptionsModal } from './OptionsModal';
import { supabase } from '../../../supabaseClient';

interface DynamicDocumentsProps {
  selectedStudent: any;
  values?: Record<string, string>;
  onChange?: (values: Record<string, string>) => void;
}

export const DynamicDocuments: React.FC<DynamicDocumentsProps> = ({
  selectedStudent,
  values = {},
  onChange,
}) => {
  const queryClient = useQueryClient();
  const [documentValues, setDocumentValues] = useState<Record<string, string>>({});
  const [showDocumentTypesModal, setShowDocumentTypesModal] = useState(false);

  // Fetch document types
  const { data: documentTypes = [], isLoading } = useQuery({
    queryKey: ['document_types'],
    queryFn: fetchDocumentTypes,
  });

  // Initialize document values from selectedStudent or props
  useEffect(() => {
    if (selectedStudent?.documents) {
      setDocumentValues(selectedStudent.documents);
    } else if (values) {
      setDocumentValues(values);
    }
  }, [selectedStudent, values]);

  const handleValueChange = (documentId: string, value: string) => {
    const newValues = { ...documentValues, [documentId]: value };
    setDocumentValues(newValues);
    onChange?.(newValues);
  };

  // Add document type mutation
  const addDocumentTypeMutation = useMutation({
    mutationFn: addDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_types'] });
    },
  });

  // Delete document type mutation
  const deleteDocumentTypeMutation = useMutation({
    mutationFn: deleteDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_types'] });
    },
  });

  const handleAddDocumentType = async (name: string) => {
    await addDocumentTypeMutation.mutateAsync(name);
  };

  const handleDeleteDocumentType = async (id: number) => {
    await deleteDocumentTypeMutation.mutateAsync(id);
  };

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Loading documents...</div>;
  }

  return (
    <>
      {/* Documents Section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
          <button
            type="button"
            onClick={() => setShowDocumentTypesModal(true)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit Fields
          </button>
        </div>

        {documentTypes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600 mb-2">No document types configured yet</p>
            <button
              type="button"
              onClick={() => setShowDocumentTypesModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Add Document Types
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {documentTypes.map((doc) => {
              const docId = `doc_${doc.id}`;
              return (
                <div key={doc.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {doc.name}
                  </label>
                  <select
                    value={documentValues[docId] || ''}
                    onChange={(e) => handleValueChange(docId, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select status...</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Not Submitted">Not Submitted</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Types Modal */}
      {showDocumentTypesModal && (
        <OptionsModal
          title="Document Types"
          items={documentTypes}
          onAdd={handleAddDocumentType}
          onDelete={handleDeleteDocumentType}
          onClose={() => setShowDocumentTypesModal(false)}
          tableName="document_types"
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['document_types'] })}
        />
      )}
    </>
  );
};

