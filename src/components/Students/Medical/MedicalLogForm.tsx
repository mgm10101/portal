import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Calendar } from 'lucide-react';

interface MedicalLogFormProps {
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const MedicalLogForm: React.FC<MedicalLogFormProps> = ({
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

  // Placeholder students
  const [students] = useState([
    { admissionNumber: '2023001', name: 'John Doe' },
    { admissionNumber: '2023002', name: 'Jane Smith' },
    { admissionNumber: '2023003', name: 'Michael Johnson' },
    { admissionNumber: '2023004', name: 'Sarah Williams' },
    { admissionNumber: '2023005', name: 'David Brown' }
  ]);

  // Get current date and time for defaults
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

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
          .date-input::-webkit-calendar-picker-indicator {
            cursor: pointer;
          }
          .date-input {
            cursor: text;
          }
        `}</style>
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto max-h-[calc(90vh-3rem)] pb-6 scrollbar-hide"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-normal text-gray-800">Add Medical Log</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student & Date/Time */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
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
                    Date
                  </label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={getCurrentDate()}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent date-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    name="time"
                    type="time"
                    defaultValue={getCurrentTime()}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Visit Details */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Visit Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type of Service
                  </label>
                  <select
                    name="type"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>Select service type...</option>
                    <option value="First Aid">First Aid</option>
                    <option value="Dispensary">Dispensary</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Routine Check">Routine Check</option>
                    <option value="Counseling">Counseling</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complaint/Reason for Visit
                  </label>
                  <textarea
                    name="complaint"
                    rows={2}
                    placeholder="Describe the complaint or reason for visit"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Symptoms
                  </label>
                  <textarea
                    name="symptoms"
                    rows={2}
                    placeholder="List observed symptoms"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    name="temperature"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 37.5"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Treatment */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Treatment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Treatment Given
                  </label>
                  <textarea
                    name="treatment"
                    rows={3}
                    placeholder="Describe treatment provided (medication, first aid, etc.)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medication Administered
                  </label>
                  <input
                    name="medication"
                    type="text"
                    placeholder="e.g., Paracetamol 500mg"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage
                  </label>
                  <input
                    name="dosage"
                    type="text"
                    placeholder="e.g., 1 tablet"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attended By
                  </label>
                  <input
                    name="attendedBy"
                    type="text"
                    placeholder="Name of medical staff"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Follow-up */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Follow-up & Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      name="requiresFollowup"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Requires follow-up visit</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Any additional observations or notes"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      name="parentNotified"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Parent/Guardian notified</span>
                  </label>
                </div>
              </div>
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
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Medical Log
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

