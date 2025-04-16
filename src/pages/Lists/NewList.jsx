/* src/pages/Lists/NewList.jsx */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserListStore from '@/stores/useUserListStore';
import useFormHandler from '@/hooks/useFormHandler';
// FIX: Changed from default import to named import
import { useUIStateStore } from '@/stores/useUIStateStore';
import Button from '@/components/UI/Button';
import { Loader2, Info, X, HelpCircle } from 'lucide-react';

const NewList = () => {
    const navigate = useNavigate();
    const addToListAction = useUserListStore(state => state.addToList);
    const isProcessing = useUserListStore(state => state.isAddingToList); // Use the correct state name
    const storeError = useUserListStore(state => state.error);
    const clearStoreError = useUserListStore(state => state.clearError);

    // FIX: Use named import selector
    const cuisines = useUIStateStore(state => state.cuisines || []);
    const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
    const isLoadingCuisines = useUIStateStore(state => state.isLoadingCuisines);

    const [hashtagInput, setHashtagInput] = useState('');
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
    const hashtagInputRef = useRef(null);

    const {
        formData,
        handleChange,
        handleSubmit,
        submitError,
        setSubmitError,
        resetForm,
        setFormData,
    } = useFormHandler({
        name: '',
        description: '',
        is_public: true,
        list_type: '', // ** Start with no type selected **
    });

    // Fetch Cuisines Effect
    useEffect(() => { if (cuisines.length === 0 && !isLoadingCuisines) { fetchCuisines(); } }, [cuisines.length, fetchCuisines, isLoadingCuisines]);

    // Error Clearing Effect
    useEffect(() => { clearStoreError?.(); setSubmitError(null); return () => { clearStoreError?.(); setSubmitError(null); }; }, [clearStoreError, setSubmitError]);

    // --- Hashtag Logic --- (No changes needed in this logic block)
    const filteredHashtags = useMemo(() => {
        const inputLower = hashtagInput.toLowerCase().trim();
        if (!inputLower || !Array.isArray(cuisines)) return [];
        return cuisines.map((c) => c.name)
            .filter((name) => name.toLowerCase().includes(inputLower) && !selectedHashtags.includes(name))
            .slice(0, 5);
    }, [cuisines, hashtagInput, selectedHashtags]);
    const handleAddHashtag = useCallback(() => {
        const newTag = hashtagInput.trim().toLowerCase();
        if (!newTag) { setHashtagInput(''); return; }
        if (selectedHashtags.includes(newTag)) { setSubmitError(`Tag "${newTag}" already added.`); setHashtagInput(''); return; }
        const isValidCuisine = cuisines.some((c) => c.name.toLowerCase() === newTag);
        if (isValidCuisine) { setSelectedHashtags((prev) => [...prev, newTag]); setHashtagInput(''); setShowHashtagSuggestions(false); setSubmitError(null); }
        else { setSubmitError(`"${hashtagInput.trim()}" is not a recognized tag.`); }
    }, [hashtagInput, selectedHashtags, setSubmitError, cuisines]);
    const handleHashtagInputKeyDown = useCallback((e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddHashtag(); } }, [handleAddHashtag]);
    const handleRemoveHashtag = useCallback((tagToRemove) => { setSelectedHashtags((prev) => prev.filter((h) => h !== tagToRemove)); }, []);
    const handleSelectHashtagSuggestion = useCallback((tag) => { if (tag && !selectedHashtags.includes(tag)) { setSelectedHashtags((prev) => [...prev, tag]); } setHashtagInput(''); setShowHashtagSuggestions(false); }, [selectedHashtags]);
    useEffect(() => { const handleClickOutside = (event) => { if (showHashtagSuggestions && hashtagInputRef.current && !hashtagInputRef.current.contains(event.target)) { setShowHashtagSuggestions(false); } }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, [showHashtagSuggestions]);
    const handleHashtagInputChange = useCallback((e) => { setHashtagInput(e.target.value); if (e.target.value.trim()) setShowHashtagSuggestions(true); else setShowHashtagSuggestions(false); setSubmitError(null); }, [setSubmitError]);
    // --- End Hashtag Logic ---


    // --- Form Submission --- (No changes needed in this logic block)
    const performSubmit = async (currentFormData) => {
        if (!currentFormData.name?.trim()) throw new Error('List name cannot be empty.');
        // ** VALIDATION: Ensure a valid list type is selected **
        if (!currentFormData.list_type || !['restaurant', 'dish'].includes(currentFormData.list_type)) {
            throw new Error('Please select a list type (Restaurant or Dish).');
         }
        try {
            const result = await addToListAction({
                item: null, createNew: true,
                listData: {
                    name: currentFormData.name.trim(),
                    description: currentFormData.description.trim() || null,
                    is_public: currentFormData.is_public,
                    list_type: currentFormData.list_type, // Pass selected type
                    tags: selectedHashtags,
                }
            });
            if (result?.success && result?.listId) { navigate(`/lists/${result.listId}`); }
            else { throw new Error(result?.message || "List creation failed."); }
        } catch (error) {
             console.error("Error during list creation:", error);
             setSubmitError(error.message || 'An unexpected error occurred.');
             throw error; // Re-throw for handleSubmit
        }
    };
    // --- End Form Submission ---

    const handleFormSubmit = (e) => { e.preventDefault(); handleSubmit(performSubmit); };
    const displayError = submitError || storeError;

    // --- JSX --- (No changes needed in JSX structure)
    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <Button onClick={() => navigate('/lists')} variant="tertiary" size="sm" className="mb-6 text-sm text-gray-600 hover:text-gray-900">
                &larr; Back to My Lists
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Create New List</h1>

            <form onSubmit={handleFormSubmit} className="space-y-5 bg-white p-6 rounded-lg shadow border border-gray-100">
                {/* List Name */}
                <div>
                    <label htmlFor="new-list-name" className="block text-sm font-medium text-gray-700 mb-1">List Name*</label>
                    <input id="new-list-name" name="name" type="text" value={formData.name} onChange={handleChange} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-100" placeholder="e.g., NYC Cheap Eats" disabled={isProcessing}/>
                </div>
                {/* Description */}
                <div>
                    <label htmlFor="new-list-desc" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea id="new-list-desc" name="description" value={formData.description} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-100" placeholder="A short description..." rows="3" disabled={isProcessing}/>
                </div>
                {/* List Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">List Type*</label>
                    <div className="flex flex-col sm:flex-row gap-3 mt-1">
                        {(['restaurant', 'dish']).map(type => (
                             <label key={type} className={`flex items-center p-2 border rounded-md cursor-pointer transition-colors text-xs flex-1 justify-center ${isProcessing ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''} ${formData.list_type === type ? 'bg-[#D1B399]/10 border-[#D1B399]/50 ring-1 ring-[#D1B399]' : 'border-gray-300 hover:border-gray-400 bg-white'}`}>
                                <input type="radio" name="list_type" value={type} checked={formData.list_type === type} onChange={handleChange} disabled={isProcessing} className="h-3.5 w-3.5 text-[#A78B71] border-gray-300 focus:ring-[#A78B71] mr-1.5" required />
                                <span className="capitalize">{type}</span>
                                <HelpCircle size={12} className="ml-1 text-gray-400" title={type === 'restaurant' ? "Can only contain restaurants" : "Can only contain dishes"}/>
                             </label>
                        ))}
                    </div>
                    {!formData.list_type && <p className="text-xs text-red-500 mt-1">Please select a list type.</p>}
                </div>
                {/* Hashtags */}
                <div ref={hashtagInputRef} className="relative">
                    <label htmlFor="new-list-tags" className="block text-sm font-medium text-gray-700 mb-1">Hashtags (Optional)</label>
                    <input id="new-list-tags" type="text" value={hashtagInput} onChange={handleHashtagInputChange} onKeyDown={handleHashtagInputKeyDown} onFocus={() => setShowHashtagSuggestions(true)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-100" placeholder={isLoadingCuisines ? "Loading tags..." : "Type to add..."} disabled={isProcessing || isLoadingCuisines} autoComplete="off"/>
                    {showHashtagSuggestions && filteredHashtags.length > 0 && hashtagInput && ( <ul className="absolute z-10 mt-1 w-full border border-gray-200 rounded-md bg-white max-h-32 overflow-y-auto shadow-lg"> {filteredHashtags.map((name) => ( <li key={name} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onMouseDown={(e) => { e.preventDefault(); handleSelectHashtagSuggestion(name); }}> #{name} </li> ))} </ul> )}
                    <div className="mt-2 flex flex-wrap gap-1 min-h-[20px]">
                        {selectedHashtags.map((h) => ( <span key={h} className="inline-flex items-center px-2 py-0.5 bg-[#A78B71]/80 text-white rounded-full text-xs"> #{h} <button type="button" onClick={() => handleRemoveHashtag(h)} disabled={isProcessing} className="ml-1 -mr-0.5 p-0.5 text-white/70 hover:text-white focus:outline-none disabled:opacity-50" aria-label={`Remove tag ${h}`}><X size={12} /></button></span> ))}
                    </div>
                </div>
                {/* Public/Private Toggle */}
                <div className="flex items-center justify-start pt-1">
                    <label className={`flex items-center mr-3 ${isProcessing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <div className="relative">
                            <input type="checkbox" name="is_public" checked={formData.is_public} onChange={handleChange} className="sr-only peer" disabled={isProcessing}/>
                            <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-700 select-none">{formData.is_public ? 'Public' : 'Private'}</span>
                    </label>
                    <span className="text-xs text-gray-500 flex items-center"><Info size={13} className="mr-1 flex-shrink-0"/> Public lists may appear in trending sections.</span>
                </div>
                {/* Error Display */}
                {displayError && (<p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">{displayError}</p>)}
                {/* Submit Button */}
                <div className="pt-4">
                    <Button type="submit" variant="primary" className="w-full flex justify-center py-2 px-4" disabled={isProcessing || !formData.name || !formData.list_type}>
                        {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create List'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default NewList;