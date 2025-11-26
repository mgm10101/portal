// src/components/Financial/Invoices/InvoiceDetails.tsx

import React, { useState, useRef } from 'react';
import { Upload, X, Save } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

interface InvoiceDetailsData {
    logo_url: string;
    school_name: string;
    contact_info: string;
    address: string;
    payment_details: string;
}

/**
 * Component to manage Invoice Details Configuration
 * (Logo, School Name, Contact Info, Address, Payment Details)
 */
export const InvoiceDetails: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [originalLogoUrl, setOriginalLogoUrl] = useState<string>(''); // Track original logo to delete on save
    
    const [formData, setFormData] = useState<InvoiceDetailsData>({
        logo_url: '',
        school_name: '',
        contact_info: '',
        address: '',
        payment_details: ''
    });

    // Load existing data on mount
    React.useEffect(() => {
        loadInvoiceDetails();
    }, []);

    const loadInvoiceDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('invoice_settings')
                .select('*')
                .single();
            
            if (error) {
                // PGRST116 = table not found, PGRST301 = no rows returned
                if (error.code === 'PGRST116') {
                    console.warn('invoice_settings table not found. Please run the database migration.');
                } else if (error.code === 'PGRST301') {
                    // No rows found - this is okay, we'll start with empty form
                    console.log('No invoice settings found. Starting with empty form.');
                } else {
                    console.error('Error loading invoice details:', error);
                }
                return;
            }
            
            if (data) {
                setFormData({
                    logo_url: data.logo_url || '',
                    school_name: data.school_name || '',
                    contact_info: data.contact_info || '',
                    address: data.address || '',
                    payment_details: data.payment_details || ''
                });
                // Track original logo URL for deletion on save
                setOriginalLogoUrl(data.logo_url || '');
                if (data.logo_url) {
                    setLogoPreview(data.logo_url);
                }
            }
        } catch (err) {
            console.error('Failed to load invoice details:', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        try {
            setIsSaving(true);
            
            // Create preview immediately for better UX
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Store old logo URL for potential rollback
            const oldLogoUrl = formData.logo_url;

            // Upload new logo to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `invoice-logo-${Date.now()}.${fileExt}`;
            const filePath = `invoices/${fileName}`;

            console.log('📤 [LOGO] Uploading new logo:', filePath);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('invoice-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false // Don't upsert - we want a new file each time
                });

            if (uploadError) {
                console.error('❌ [LOGO] Upload error:', uploadError);
                
                // Reset preview on error
                if (oldLogoUrl) {
                    setLogoPreview(oldLogoUrl);
                } else {
                    setLogoPreview(null);
                }
                
                // Provide more specific error messages
                if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS')) {
                    alert('Storage upload failed: Permission denied. Please check RLS policies for the invoice-assets bucket.');
                } else if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
                    alert('Storage bucket not found. Please create the "invoice-assets" bucket in Supabase Dashboard > Storage.');
                } else {
                    alert(`Failed to upload logo: ${uploadError.message || 'Unknown error'}. Please check storage configuration.`);
                }
                return;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('invoice-assets')
                .getPublicUrl(filePath);

            if (urlData?.publicUrl) {
                console.log('✅ [LOGO] New logo uploaded successfully:', urlData.publicUrl);
                
                // Update form data with new logo URL
                setFormData(prev => ({
                    ...prev,
                    logo_url: urlData.publicUrl
                }));
                // Preview is already set from FileReader above
            } else {
                console.error('❌ [LOGO] Failed to get public URL');
                alert('Logo uploaded but failed to get public URL. Please try again.');
                // Reset preview on error
                if (oldLogoUrl) {
                    setLogoPreview(oldLogoUrl);
                } else {
                    setLogoPreview(null);
                }
            }
        } catch (err) {
            console.error('❌ [LOGO] Error uploading logo:', err);
            alert('Failed to upload logo');
            // Reset preview on error
            if (formData.logo_url) {
                setLogoPreview(formData.logo_url);
            } else {
                setLogoPreview(null);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveLogo = async () => {
        const oldLogoUrl = formData.logo_url;
        
        // Delete from storage if logo exists
        if (oldLogoUrl) {
            try {
                // Extract file path from the public URL
                const urlParts = oldLogoUrl.split('/invoice-assets/');
                if (urlParts.length > 1) {
                    const oldFilePath = urlParts[1];
                    console.log('🗑️ [LOGO] Removing logo from storage:', oldFilePath);
                    
                    const { error: deleteError } = await supabase.storage
                        .from('invoice-assets')
                        .remove([oldFilePath]);
                    
                    if (deleteError) {
                        console.warn('⚠️ [LOGO] Failed to delete logo from storage:', deleteError);
                        // Still remove from UI even if storage deletion fails
                    } else {
                        console.log('✅ [LOGO] Logo removed from storage successfully');
                    }
                }
            } catch (err) {
                console.warn('⚠️ [LOGO] Error removing logo from storage:', err);
                // Still remove from UI even if storage deletion fails
            }
        }
        
        // Update UI
        setLogoPreview(null);
        setFormData(prev => ({
            ...prev,
            logo_url: ''
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            
            // Delete old logo from storage if logo was changed (new logo uploaded or logo removed)
            const newLogoUrl = formData.logo_url;
            if (originalLogoUrl && originalLogoUrl !== newLogoUrl) {
                try {
                    // Extract file path from the public URL
                    // URL format: https://[project].supabase.co/storage/v1/object/public/invoice-assets/invoices/filename.ext
                    const urlParts = originalLogoUrl.split('/invoice-assets/');
                    if (urlParts.length > 1) {
                        const oldFilePath = urlParts[1];
                        console.log('🗑️ [LOGO] Deleting old logo on save:', oldFilePath);
                        
                        const { error: deleteError } = await supabase.storage
                            .from('invoice-assets')
                            .remove([oldFilePath]);
                        
                        if (deleteError) {
                            console.warn('⚠️ [LOGO] Failed to delete old logo (non-critical):', deleteError);
                            // Don't block save - old logo will remain but new one is active
                        } else {
                            console.log('✅ [LOGO] Old logo deleted successfully on save');
                        }
                    }
                } catch (deleteErr) {
                    console.warn('⚠️ [LOGO] Error deleting old logo on save (non-critical):', deleteErr);
                    // Continue with save even if deletion fails
                }
            }
            
            // Save invoice settings to database
            const { error } = await supabase
                .from('invoice_settings')
                .upsert({
                    id: 1, // Assuming single row configuration
                    ...formData,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });

            if (error) {
                console.error('Error saving invoice details:', error);
                
                // Provide more specific error messages
                if (error.code === 'PGRST116') {
                    alert('invoice_settings table not found. Please run the database migration.');
                } else if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
                    alert('Save failed: Permission denied. Please check RLS policies for the invoice_settings table.');
                } else {
                    alert(`Failed to save invoice details: ${error.message || 'Unknown error'}. Please check console for details.`);
                }
                return;
            }

            // Update original logo URL to current one after successful save
            setOriginalLogoUrl(newLogoUrl);
            
            alert('Invoice details saved successfully!');
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to save invoice details:', err);
            alert('Failed to save invoice details');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        loadInvoiceDetails(); // Reload original data (this will reset originalLogoUrl too)
        setIsEditing(false);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-2xl font-semibold text-gray-800">Invoice Details Configuration</h3>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                    >
                        Edit Details
                    </button>
                )}
            </div>

            <div className="bg-white p-6 border rounded-lg shadow-sm space-y-6">
                {/* Logo Upload Section */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        1. Logo
                    </label>
                    <div className="flex items-start gap-4">
                        {logoPreview && (
                            <div className="relative">
                                <img 
                                    src={logoPreview} 
                                    alt="School Logo" 
                                    className="w-32 h-32 object-contain border border-gray-300 rounded-lg bg-gray-50"
                                />
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveLogo}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        title="Remove logo"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="flex-1">
                            {isEditing ? (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        id="logo-upload"
                                        disabled={isSaving}
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                                    >
                                        <Upload size={16} className="mr-2" />
                                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Supported formats: JPG, PNG, GIF. Max size: 5MB
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">
                                    {logoPreview ? 'Logo uploaded' : 'No logo uploaded'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* School Name */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        2. School Name <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="school_name"
                            value={formData.school_name}
                            onChange={handleInputChange}
                            placeholder="Enter school name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSaving}
                        />
                    ) : (
                        <p className="text-gray-800 p-3 bg-gray-50 rounded-lg">
                            {formData.school_name || 'Not set'}
                        </p>
                    )}
                </div>

                {/* Contact Info */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        3. Contact Info
                    </label>
                    {isEditing ? (
                        <textarea
                            name="contact_info"
                            value={formData.contact_info}
                            onChange={handleInputChange}
                            placeholder="e.g., Phone: +254 700 000 000, Email: info@school.com"
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSaving}
                        />
                    ) : (
                        <p className="text-gray-800 p-3 bg-gray-50 rounded-lg whitespace-pre-line">
                            {formData.contact_info || 'Not set'}
                        </p>
                    )}
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        4. Address
                    </label>
                    {isEditing ? (
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Enter full address"
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSaving}
                        />
                    ) : (
                        <p className="text-gray-800 p-3 bg-gray-50 rounded-lg whitespace-pre-line">
                            {formData.address || 'Not set'}
                        </p>
                    )}
                </div>

                {/* Payment Details */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        5. Payment Details
                    </label>
                    {isEditing ? (
                        <textarea
                            name="payment_details"
                            value={formData.payment_details}
                            onChange={handleInputChange}
                            placeholder="Enter payment details (e.g., Bank Name, Account Number, MPESA Paybill, SWIFT/Routing, etc.)"
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSaving}
                        />
                    ) : (
                        <p className="text-gray-800 p-3 bg-gray-50 rounded-lg whitespace-pre-line">
                            {formData.payment_details || 'Not set'}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                            disabled={isSaving || !formData.school_name.trim()}
                        >
                            <Save size={16} className="mr-2" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


