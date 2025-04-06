// src/components/FloatingQuickAdd.jsx
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Plus, Utensils, Store, List, X, Loader2, Send } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/Button';
import { useStore } from 'zustand';
import useSubmissionStore from '@/stores/useSubmissionStore';
import useUIStateStore from '@/stores/useUIStateStore';
import useFormHandler from '@/hooks/useFormHandler';
import { placeService } from '@/services/placeService';

const FloatingQuickAdd = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formState, setFormState] = useState({
    formType: null,
    tagInput: '',
    selectedTags: [],
    tagSuggestions: [],
    showTagSuggestions: false,
    restaurantSuggestions: [],
    showRestaurantSuggestions: false,
    isFetchingSuggestions: false,
  });
  const containerRef = useRef(null);
  const tagInputRef = useRef(null);
  const restaurantInputRef = useRef(null);

  const { openQuickAdd } = useQuickAdd();

  const addPendingSubmission = useStore(useSubmissionStore, (state) => state.addPendingSubmission);
  const cuisines = useStore(useUIStateStore, (state) => state.cuisines || []);

  useEffect(() => {
    console.log('[FloatingQuickAdd] Cuisines loaded:', cuisines);
  }, [cuisines]);

  const {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    submitError,
    setSubmitError,
    resetForm,
    setFormData,
  } = useFormHandler({
    newItemName: '',
    restaurantInput: '',
    placeId: null,
  });

  const resetAllState = useCallback(() => {
    setFormState({
      formType: null,
      tagInput: '',
      selectedTags: [],
      tagSuggestions: [],
      showTagSuggestions: false,
      restaurantSuggestions: [],
      showRestaurantSuggestions: false,
      isFetchingSuggestions: false,
    });
    resetForm();
    setSubmitError(null);
  }, [resetForm, setSubmitError]);

  const tagSuggestions = useMemo(() => {
    if (!formState.tagInput || formState.tagInput.trim().length === 0) return [];
    const suggestions = cuisines
      .filter((cuisine) => cuisine.name.toLowerCase().includes(formState.tagInput.toLowerCase()))
      .map((cuisine) => cuisine.name);
    console.log('[FloatingQuickAdd] Tag Suggestions for input', formState.tagInput, ':', suggestions);
    return suggestions;
  }, [formState.tagInput, cuisines]);

  const fetchPlaceSuggestions = useCallback(async (input) => {
    if (!input || input.trim().length < 2) {
      setFormState((prev) => ({
        ...prev,
        restaurantSuggestions: [],
        showRestaurantSuggestions: false,
      }));
      return;
    }
    setFormState((prev) => ({ ...prev, isFetchingSuggestions: true }));
    try {
      const data = await placeService.getAutocompleteSuggestions(input) || [];
      const predictions = data.map((prediction) => ({
        name: prediction.description,
        placeId: prediction.place_id,
      }));
      console.log('[FloatingQuickAdd] Place Suggestions for input', input, ':', predictions);
      setFormState((prev) => ({
        ...prev,
        restaurantSuggestions: predictions,
        showRestaurantSuggestions: predictions.length > 0,
      }));
    } catch (error) {
      console.error('[FloatingQuickAdd] Error fetching place suggestions:', error);
      setFormState((prev) => ({
        ...prev,
        restaurantSuggestions: [],
        showRestaurantSuggestions: false,
      }));
    } finally {
      setFormState((prev) => ({ ...prev, isFetchingSuggestions: false }));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchPlaceSuggestions(formData.restaurantInput), 300);
    return () => clearTimeout(timer);
  }, [formData.restaurantInput, fetchPlaceSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const fabButton = document.querySelector('.fixed.bottom-6.right-6');
      if (
        isMenuOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        !(fabButton && fabButton.contains(event.target))
      ) {
        setIsMenuOpen(false);
        resetAllState();
      }
      if (formState.showTagSuggestions && tagInputRef.current && !tagInputRef.current.contains(event.target)) {
        setFormState((prev) => ({ ...prev, showTagSuggestions: false }));
      }
      if (
        formState.showRestaurantSuggestions &&
        restaurantInputRef.current &&
        !restaurantInputRef.current.contains(event.target)
      ) {
        setFormState((prev) => ({ ...prev, showRestaurantSuggestions: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, formState.showTagSuggestions, formState.showRestaurantSuggestions, resetAllState]);

  const handleOpenMainButton = useCallback(() => {
    setIsMenuOpen((prev) => {
      if (prev) resetAllState();
      return !prev;
    });
  }, [resetAllState]);

  const handleOpenDishForm = useCallback(() => {
    resetAllState();
    setFormState((prev) => ({ ...prev, formType: 'dish' }));
  }, [resetAllState]);

  const handleOpenRestaurantForm = useCallback(() => {
    resetAllState();
    setFormState((prev) => ({ ...prev, formType: 'restaurant' }));
  }, [resetAllState]);

  const handleCreateNewList = useCallback(() => {
    openQuickAdd({ type: 'list', createNew: true });
    setIsMenuOpen(false);
    resetAllState();
  }, [openQuickAdd, resetAllState]);

  const handleAddTag = useCallback(() => {
    const newTag = formState.tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (newTag && !formState.selectedTags.includes(newTag)) {
      setFormState((prev) => ({
        ...prev,
        selectedTags: [...prev.selectedTags, newTag],
        tagInput: '',
        showTagSuggestions: false,
      }));
      setSubmitError(null);
    } else if (newTag && formState.selectedTags.includes(newTag)) {
      setSubmitError(`Tag "${newTag}" already added.`);
      setFormState((prev) => ({ ...prev, tagInput: '' }));
    }
  }, [formState.tagInput, formState.selectedTags, setSubmitError]);

  const handleTagInputKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const handleRemoveTag = useCallback((tagToRemove) => {
    setFormState((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  const handleSelectTagSuggestion = useCallback(
    (tag) => {
      if (!formState.selectedTags.includes(tag)) {
        setFormState((prev) => ({
          ...prev,
          selectedTags: [...prev.selectedTags, tag],
          tagInput: '',
          showTagSuggestions: false,
        }));
      } else {
        setFormState((prev) => ({ ...prev, tagInput: '', showTagSuggestions: false }));
      }
    },
    [formState.selectedTags]
  );

  const handleSelectRestaurantSuggestion = useCallback(
    (restaurant) => {
      setFormData((prev) => ({
        ...prev,
        restaurantInput: restaurant.name,
        placeId: restaurant.placeId,
      }));
      setFormState((prev) => ({ ...prev, showRestaurantSuggestions: false }));
    },
    [setFormData]
  );

  const performSubmit = useCallback(
    async (currentHookFormData) => {
      if (!currentHookFormData.newItemName?.trim()) throw new Error('Please provide a name.');
      if (formState.formType === 'dish' && !currentHookFormData.restaurantInput?.trim()) {
        throw new Error('Please provide the restaurant name for the dish.');
      }
      const submissionData = {
        type: formState.formType,
        name: currentHookFormData.newItemName.trim(),
        location: formState.formType === 'dish' ? currentHookFormData.restaurantInput.trim() : null,
        tags: formState.selectedTags,
        place_id: currentHookFormData.placeId || null,
      };
      await addPendingSubmission(submissionData);
      setIsMenuOpen(false);
      resetAllState();
      alert('Submission successful!');
    },
    [formState.formType, formState.selectedTags, addPendingSubmission, resetAllState]
  );

  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      handleSubmit(performSubmit);
    },
    [handleSubmit, performSubmit]
  );

  return (
    <>
      <button
        onClick={handleOpenMainButton}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b89e89] transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] z-50"
        aria-label={isMenuOpen ? 'Close quick add menu' : 'Open quick add menu'}
      >
        <span className={`transform transition-transform duration-200 ease-in-out ${isMenuOpen ? 'rotate-45' : 'rotate-0'}`}>
          <Plus size={28} />
        </span>
      </button>

      <div
        ref={containerRef}
        className={`fixed bottom-24 right-6 w-[340px] z-40 transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {!formState.formType ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 text-center mb-2">Quick Add</h3>
            <Button
              onClick={handleOpenDishForm}
              variant="tertiary"
              className="w-full flex items-center justify-start space-x-2 !text-gray-700 hover:!bg-gray-100"
            >
              <Utensils size={16} /> <span>Add New Dish...</span>
            </Button>
            <Button
              onClick={handleOpenRestaurantForm}
              variant="tertiary"
              className="w-full flex items-center justify-start space-x-2 !text-gray-700 hover:!bg-gray-100"
            >
              <Store size={16} /> <span>Add New Restaurant...</span>
            </Button>
            <Button
              onClick={handleCreateNewList}
              variant="tertiary"
              className="w-full flex items-center justify-start space-x-2 !text-gray-700 hover:!bg-gray-100"
            >
              <List size={16} /> <span>Create New List...</span>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="bg-white border border-gray-200 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {formState.formType === 'dish' ? 'Submit a Dish' : 'Submit a Restaurant'}
              </h3>
              <Button
                onClick={() => {
                  setFormState((prev) => ({ ...prev, formType: null }));
                  resetAllState();
                }}
                variant="tertiary"
                size="sm"
                className="!p-1 text-gray-400 hover:text-gray-600"
                aria-label="Back to quick add menu"
              >
                <X size={18} />
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label htmlFor="fq-item-name" className="block text-gray-700 font-medium mb-1">
                  {formState.formType === 'dish' ? 'Dish Name*' : 'Restaurant Name*'}
                </label>
                <input
                  id="fq-item-name"
                  type="text"
                  required
                  name="newItemName"
                  value={formData.newItemName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]"
                  placeholder={formState.formType === 'dish' ? 'e.g., Short Rib Taco' : 'e.g., Kogi BBQ Truck'}
                />
              </div>
              {formState.formType === 'dish' && (
                <div ref={restaurantInputRef} className="relative">
                  <label htmlFor="fq-restaurant-name" className="block text-gray-700 font-medium mb-1">
                    Restaurant Name*
                  </label>
                  <input
                    id="fq-restaurant-name"
                    type="text"
                    required
                    name="restaurantInput"
                    value={formData.restaurantInput}
                    onChange={handleChange}
                    onFocus={() => formData.restaurantInput && fetchPlaceSuggestions(formData.restaurantInput)}
                    disabled={isSubmitting || formState.isFetchingSuggestions}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]"
                    placeholder="e.g., Kogi BBQ Truck"
                    autoComplete="off"
                  />
                  {formState.isFetchingSuggestions && (
                    <Loader2 size={16} className="absolute right-2 top-9 animate-spin text-gray-400" />
                  )}
                  {formState.showRestaurantSuggestions && formState.restaurantSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                      <ul>
                        {formState.restaurantSuggestions.map((suggestion, index) => (
                          <li key={`rest-sugg-${suggestion.placeId || index}`}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none truncate"
                              onClick={() => handleSelectRestaurantSuggestion(suggestion)}
                            >
                              {suggestion.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div ref={tagInputRef} className="relative">
                <label htmlFor="fq-tags" className="block text-gray-700 font-medium mb-1">
                  Tags (optional, comma or Enter)
                </label>
                <input
                  id="fq-tags"
                  type="text"
                  value={formState.tagInput}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, tagInput: e.target.value }));
                    setSubmitError(null);
                  }}
                  onKeyDown={handleTagInputKeyDown}
                  onFocus={() => setFormState((prev) => ({ ...prev, showTagSuggestions: tagSuggestions.length > 0 }))}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]"
                  placeholder="e.g., spicy, korean, taco"
                  autoComplete="off"
                />
                {formState.showTagSuggestions && tagSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                    <ul>
                      {tagSuggestions.map((tag, index) => (
                        <li key={`tag-sugg-${index}`}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onClick={() => handleSelectTagSuggestion(tag)}
                          >
                            #{tag}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {formState.selectedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formState.selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          disabled={isSubmitting}
                          className="ml-1 -mr-0.5 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full focus:outline-none focus:bg-gray-200"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {submitError && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-2">
                  {submitError}
                </p>
              )}
              <Button
                type="submit"
                variant="primary"
                className="w-full flex justify-center py-2 px-4 mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <Send size={16} className="mr-2" /> Submit for Review
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default React.memo(FloatingQuickAdd);