import React, { useState, useEffect, useRef } from 'react';
import { X, User, Search } from 'lucide-react';

interface MedicalInfoFormProps {
  selectedRecord?: any;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const MedicalInfoForm: React.FC<MedicalInfoFormProps> = ({
  selectedRecord,
  onClose,
  onSubmit,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

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

  // Click-outside logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const values = Object.fromEntries(formData);
    onSubmit(values);
  };

  // Placeholder students for selection
  const [students] = useState([
    { admissionNumber: '2023001', name: 'John Doe' },
    { admissionNumber: '2023002', name: 'Jane Smith' },
    { admissionNumber: '2023003', name: 'Michael Johnson' },
    { admissionNumber: '2023004', name: 'Sarah Williams' },
    { admissionNumber: '2023005', name: 'David Brown' }
  ]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={formRef} className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <style>{`
          @media (min-width: 768px) {
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          }
        `}</style>
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto max-h-[calc(90vh-3rem)] pb-6 scrollbar-hide"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-normal text-gray-800">
              {selectedRecord ? 'Update Medical Information' : 'Add Medical Information'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            {!selectedRecord && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Name
                    </label>
                    <select
                      name="studentName"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>Select student...</option>
                      {students.map((student) => (
                        <option key={student.admissionNumber} value={student.name}>
                          {student.name} ({student.admissionNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Type
                    </label>
                    <select
                      name="bloodType"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>Select blood type...</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {selectedRecord && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Information</h3>
                <div className="flex items-center mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-medium text-gray-900">{selectedRecord.studentName}</div>
                    <div className="text-sm text-gray-500">{selectedRecord.admissionNumber}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Type
                  </label>
                  <select
                    name="bloodType"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={selectedRecord.bloodType}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            )}

            {/* Allergies & Medical Conditions */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Medical Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allergies
                  </label>
                  <textarea
                    name="allergies"
                    rows={2}
                    placeholder="List any known allergies (e.g., Peanuts, Dust, Penicillin)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={selectedRecord?.allergies}
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple allergies with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Conditions
                  </label>
                  <textarea
                    name="medicalConditions"
                    rows={3}
                    placeholder="List any medical conditions (e.g., Asthma, Diabetes, ADHD, Autism, Sickle Cell)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={selectedRecord?.medicalConditions}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include chronic conditions, neurodivergent conditions, and any other relevant medical information
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Medication
                  </label>
                  <input
                    name="emergencyMedication"
                    type="text"
                    placeholder="e.g., Inhaler, EpiPen, Insulin"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={selectedRecord?.emergencyMedication}
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Notes</h3>
              <textarea
                name="additionalNotes"
                rows={3}
                placeholder="Any other relevant medical information..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedRecord?.additionalNotes}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedRecord ? 'Update' : 'Save'} Medical Info
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

