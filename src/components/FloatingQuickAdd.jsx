/* src/components/FloatingQuickAdd.jsx */
import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import PlacesAutocomplete from '@/components/UI/PlacesAutocomplete';
import RestaurantAutocomplete from '@/components/UI/RestaurantAutocomplete';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import PillButton from '@/components/UI/PillButton';
import { useQuickAdd } from '@/context/QuickAddContext';
import useFormHandler from '@/hooks/useFormHandler';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';
import { listService } from '@/services/listService';
// Removed direct import of submissionService
// import { submissionService } from '@/services/submissionService';
import useUserListStore from '@/stores/useUserListStore';
import useSubmissionStore from '@/stores/useSubmissionStore'; // *** ADDED: Import submission store ***
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/searchService';

const FloatingQuickAdd = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isCreatingRestaurant, setIsCreatingRestaurant] = useState(false);
  const [isCreatingDish, setIsCreatingDish] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const { openQuickAdd } = useQuickAdd();
  const { handleError, errorMessage, clearError } = useApiErrorHandler();
  const { setUserLists } = useUserListStore();
  // *** ADDED: Get submission store action and state ***
  const addPendingSubmission = useSubmissionStore(state => state.addPendingSubmission);
  const isSubmittingViaStore = useSubmissionStore(state => state.isLoading);
  const submissionStoreError = useSubmissionStore(state => state.error);
  const clearSubmissionStoreError = useSubmissionStore(state => state.clearError);
  // *** END ADDED ***

  const initialListValues = { name: '', list_type: '' };
  const {
    formData: listFormData,
    setFormData: setListFormData,
    handleChange: handleListChange,
    handleSubmit: handleListSubmit,
    isSubmitting: isListSubmitting,
    submitError: listSubmitError,
    setSubmitError: setListSubmitError,
    resetForm: resetListForm,
  } = useFormHandler(initialListValues);

  const initialRestaurantValues = { name: '', place_id: '', address: '', city: '', neighborhood: '' };
  const {
    formData: restaurantFormData,
    setFormData: setRestaurantFormData,
    handleSubmit: handleRestaurantSubmit,
    isSubmitting: isRestaurantSubmitting, // Keep for local form state if needed, but use store state for actual loading
    submitError: restaurantSubmitError,
    setSubmitError: setRestaurantSubmitError,
    resetForm: resetRestaurantForm,
  } = useFormHandler(initialRestaurantValues);

  const initialDishValues = { name: '', restaurant_id: null, restaurant_name: '' };
  const {
    formData: dishFormData,
    setFormData: setDishFormData,
    handleChange: handleDishChange,
    handleSubmit: handleDishSubmit,
    isSubmitting: isDishSubmitting, // Keep for local form state if needed
    submitError: dishSubmitError,
    setSubmitError: setDishSubmitError,
    resetForm: resetDishForm,
  } = useFormHandler(initialDishValues);

  const { data: dishSearchResults, isLoading: isDishLoading } = useQuery({
    queryKey: ['dishSuggestions', dishFormData.name],
    queryFn: () => searchService.search({ q: dishFormData.name, type: 'dish', limit: 5 }),
    enabled: isCreatingDish && !!dishFormData.name.trim() && dishFormData.name.length >= 2,
    placeholderData: { dishes: [] },
  });

  useEffect(() => {
    if (isCreatingDish && dishSearchResults?.dishes) {
      setDishSuggestions(dishSearchResults.dishes.map(dish => dish.name));
    } else {
      setDishSuggestions([]);
    }
  }, [dishSearchResults, isCreatingDish]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsCreatingList(false);
    setIsCreatingRestaurant(false);
    setIsCreatingDish(false);
    setSuccessMessage(null);
    clearError();
    clearSubmissionStoreError(); // Clear submission store error too
    resetListForm(initialListValues);
    resetRestaurantForm(initialRestaurantValues);
    resetDishForm(initialDishValues);
    setDishSuggestions([]);
  };

  const handleCreateNewList = async () => {
    const result = await handleListSubmit(async (data) => {
      if (!data.name.trim()) throw new Error('List name is required.');
      if (!data.list_type) throw new Error('Please select a list type.');

      const newList = await listService.createList({
        name: data.name.trim(),
        list_type: data.list_type,
        is_public: true,
      });

      return newList;
    });

    if (result.success) {
      setSuccessMessage('List created!');
      setUserLists(prev => [...prev, { ...result.result, item_count: 0 }]);
      setTimeout(() => {
        setIsCreatingList(false);
        setSuccessMessage(null);
        resetListForm(initialListValues);
      }, 2000);
    } else {
      setListSubmitError(result.error || 'Failed to create list.');
    }
  };

  // *** MODIFIED: Use submission store action ***
  const handleCreateRestaurant = async () => {
    // Use local handleSubmit to manage local form state, but call store action for logic
    const result = await handleRestaurantSubmit(async (data) => {
      if (!data.name.trim()) throw new Error('Restaurant name is required.');
      if (!data.place_id) throw new Error('Please select a valid place.');

      // Call the store action instead of the service directly
      await addPendingSubmission({
        type: 'restaurant',
        name: data.name.trim(),
        place_id: data.place_id,
        location: data.address || null,
        city: data.city || null,
        neighborhood: data.neighborhood || null,
      });
      // No need to return submission here, store handles state
    });

    if (result.success) {
      setSuccessMessage('Restaurant submitted!');
      setTimeout(() => {
        setIsCreatingRestaurant(false);
        setSuccessMessage(null);
        resetRestaurantForm(initialRestaurantValues);
      }, 2000);
    } else {
      // Error should now be handled by the submissionStoreError or local submitError
      setRestaurantSubmitError(result.error || submissionStoreError || 'Failed to submit restaurant.');
    }
  };

  // *** MODIFIED: Use submission store action ***
  const handleCreateDish = async () => {
     // Use local handleSubmit to manage local form state, but call store action for logic
    const result = await handleDishSubmit(async (data) => {
      if (!data.name.trim()) throw new Error('Dish name is required.');
      if (!data.restaurant_id) throw new Error('Please select a restaurant.');

      // Call the store action instead of the service directly
      await addPendingSubmission({
        type: 'dish',
        name: data.name.trim(),
        restaurant_id: data.restaurant_id,
        restaurant_name: data.restaurant_name // Pass name too
      });
      // No need to return submission here
    });

    if (result.success) {
      setSuccessMessage('Dish submitted!');
      setTimeout(() => {
        setIsCreatingDish(false);
        setSuccessMessage(null);
        resetDishForm(initialDishValues);
        setDishSuggestions([]);
      }, 2000);
    } else {
      // Error should now be handled by the submissionStoreError or local submitError
       setDishSubmitError(result.error || submissionStoreError || 'Failed to submit dish.');
    }
  };

  const handleListTypeSelect = (type) => {
    setListFormData((prev) => ({ ...prev, list_type: type }));
    clearError();
    setListSubmitError(null);
  };

  const handlePlaceSelected = (placeData) => {
    console.log('[FloatingQuickAdd] handlePlaceSelected called with:', placeData);
    if (placeData) {
      setRestaurantFormData({
        name: placeData.name || '',
        place_id: placeData.place_id || '',
        address: placeData.formattedAddress || '',
        city: placeData.city || '',
        neighborhood: placeData.neighborhood || '',
      });
      clearError();
      clearSubmissionStoreError(); // Clear store error on selection
      setRestaurantSubmitError(null);
      console.log('[FloatingQuickAdd] Updated restaurantFormData:', {
        name: placeData.name || '',
        place_id: placeData.place_id || '',
        address: placeData.formattedAddress || '',
        city: placeData.city || '',
        neighborhood: placeData.neighborhood || '',
      });
    } else {
      setRestaurantFormData(prev => ({
        ...prev,
        place_id: '',
      }));
      console.log('[FloatingQuickAdd] Reset place_id to empty string');
    }
  };

  const handleRestaurantSelected = (restaurant) => {
    if (restaurant) {
      setDishFormData({
        name: dishFormData.name,
        restaurant_id: restaurant.id || '',
        restaurant_name: restaurant.name || '',
      });
      clearError();
      clearSubmissionStoreError(); // Clear store error
      setDishSubmitError(null);
    } else {
      setDishFormData(prev => ({
        ...prev,
        restaurant_id: '',
        restaurant_name: '',
      }));
    }
  };

  const handleDishSuggestionSelect = (suggestion) => {
    setDishFormData((prev) => ({ ...prev, name: suggestion }));
    setDishSuggestions([]);
  };

  // Determine overall submitting state
  const isSubmittingAny = isListSubmitting || isRestaurantSubmitting || isDishSubmitting || isSubmittingViaStore;
  const displayError = listSubmitError || restaurantSubmitError || dishSubmitError || submissionStoreError || errorMessage;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {isOpen ? (
        <div className="bg-white shadow-lg rounded-lg p-4 w-80 sm:w-96 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Quick Add</h3>
            <Button
              variant="tertiary"
              size="sm"
              onClick={toggleOpen}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close quick add"
              disabled={isSubmittingAny} // Disable close during submission
            >
              <X size={20} />
            </Button>
          </div>

          {!isCreatingList && !isCreatingRestaurant && !isCreatingDish && (
            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-start text-left bg-[#A78B71] hover:bg-[#A78B71] rounded-md text-gray-800 font-medium text-sm py-2 px-3"
                onClick={() => {
                  setIsCreatingList(true);
                  clearError();
                  clearSubmissionStoreError();
                }}
              >
                Create a List
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-start text-left bg-[#A78B71] hover:bg-[#A78B71] rounded-md text-gray-800 font-medium text-sm py-2 px-3"
                onClick={() => {
                  setIsCreatingRestaurant(true);
                  clearError();
                   clearSubmissionStoreError();
                }}
              >
                Submit a Restaurant
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-start text-left bg-[#A78B71] hover:bg-[#A78B71] rounded-md text-gray-800 font-medium text-sm py-2 px-3"
                onClick={() => {
                  setIsCreatingDish(true);
                  clearError();
                   clearSubmissionStoreError();
                }}
              >
                Submit a Dish
              </Button>
            </div>
          )}

          {isCreatingList && (
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-700">New List</h4>
              {/* ... (List form remains the same) ... */}
               <div>
                  <label htmlFor="list-name" className="block text-sm font-medium text-gray-600 mb-1"> List Name </label>
                  <Input id="list-name" name="name" value={listFormData.name} onChange={handleListChange} placeholder="Enter list name..." className="w-full text-sm border-gray-300 focus:ring-[#A78B71] focus:border-[#A78B71]" disabled={isSubmittingAny} aria-invalid={!!listSubmitError} aria-describedby={listSubmitError ? 'list-error' : undefined} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">List Type</label>
                    <div className="flex space-x-2">
                        <PillButton label="Restaurant" isActive={listFormData.list_type === 'restaurant'} onClick={() => handleListTypeSelect('restaurant')} disabled={isSubmittingAny} />
                        <PillButton label="Dish" isActive={listFormData.list_type === 'dish'} onClick={() => handleListTypeSelect('dish')} disabled={isSubmittingAny} />
                    </div>
                 </div>
                {displayError && ( <div id="list-error" className="text-sm text-red-600"> {displayError} </div> )}
                 {successMessage && ( <div className="text-sm text-green-600">{successMessage}</div> )}
                 <div className="flex justify-end space-x-2 mt-2">
                    <Button variant="tertiary" size="sm" onClick={() => { setIsCreatingList(false); resetListForm(initialListValues); clearError(); clearSubmissionStoreError(); setSuccessMessage(null); }} disabled={isSubmittingAny} className="py-1 px-3 text-gray-600 font-medium text-sm rounded-md hover:bg-gray-100" > Cancel </Button>
                    <Button variant="primary" size="sm" onClick={handleCreateNewList} disabled={isSubmittingAny || !listFormData.name.trim() || !listFormData.list_type} className="py-1 px-3 bg-[#A78B71] hover:bg-[#A78B71] text-gray-800 font-medium text-sm rounded-md" > {isSubmittingAny ? ( <Loader2 className="animate-spin h-4 w-4 mr-2" /> ) : ( 'Create' )} </Button>
                </div>
            </div>
          )}

          {isCreatingRestaurant && (
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-700">New Restaurant Submission</h4>
              <div>
                <PlacesAutocomplete
                  rowId="new-restaurant"
                  initialValue={restaurantFormData.name}
                  onPlaceSelected={handlePlaceSelected}
                  // onChange={(value) => setRestaurantFormData(prev => ({ ...prev, name: value }))} // Let PlacesAutocomplete handle name update internally based on selection
                  disabled={isSubmittingAny}
                  enableManualEntry={true}
                  placeholder="Search for a restaurant..."
                />
              </div>
              {(displayError) && (
                <div id="restaurant-error" className="text-sm text-red-600">
                  {displayError}
                </div>
              )}
              {successMessage && (
                <div className="text-sm text-green-600">{successMessage}</div>
              )}
              <div className="flex justify-end space-x-2 mt-2">
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    setIsCreatingRestaurant(false);
                    resetRestaurantForm(initialRestaurantValues);
                    clearError();
                    clearSubmissionStoreError();
                    setSuccessMessage(null);
                  }}
                  disabled={isSubmittingAny}
                  className="py-1 px-3 text-gray-600 font-medium text-sm rounded-md hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateRestaurant} // Calls the modified handler
                  disabled={
                    isSubmittingAny ||
                    !restaurantFormData.name.trim() ||
                    !restaurantFormData.place_id // Still require place_id for submission trigger
                  }
                  className="py-1 px-3 bg-[#A78B71] hover:bg-[#A78B71] text-gray-800 font-medium text-sm rounded-md"
                >
                  {isSubmittingAny ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    'Submit Restaurant'
                  )}
                </Button>
              </div>
            </div>
          )}

          {isCreatingDish && (
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-700">New Dish Submission</h4>
              <div className="relative">
                <label htmlFor="dish-name" className="block text-sm font-medium text-gray-600 mb-1">
                  Dish Name
                </label>
                <Input
                  id="dish-name"
                  name="name"
                  value={dishFormData.name}
                  onChange={handleDishChange} // Uses local form handler change
                  placeholder="Enter dish name..."
                  className="w-full text-sm border-gray-300 focus:ring-[#A78B71] focus:border-[#A78B71]"
                  disabled={isSubmittingAny}
                  aria-invalid={!!dishSubmitError}
                  aria-describedby={dishSubmitError ? 'dish-error' : undefined}
                  autoComplete="off"
                />
                {isDishLoading && dishFormData.name && (
                  <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
                {dishSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {dishSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onMouseDown={() => handleDishSuggestionSelect(suggestion)}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label htmlFor="restaurant-autocomplete" className="block text-sm font-medium text-gray-600 mb-1">
                  Restaurant
                </label>
                <RestaurantAutocomplete
                  initialValue={dishFormData.restaurant_name}
                  inputValue={dishFormData.restaurant_name}
                  onRestaurantSelected={handleRestaurantSelected}
                  onChange={(value) => setDishFormData(prev => ({ ...prev, restaurant_name: value, restaurant_id: value ? prev.restaurant_id : '' }))}
                  disabled={isSubmittingAny}
                  placeholder="Search for a restaurant..."
                  useLocalSearch={true}
                />
              </div>
              {(displayError) && (
                <div id="dish-error" className="text-sm text-red-600">
                  {displayError}
                </div>
              )}
              {successMessage && (
                <div className="text-sm text-green-600">{successMessage}</div>
              )}
              <div className="flex justify-end space-x-2 mt-2">
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    setIsCreatingDish(false);
                    resetDishForm(initialDishValues);
                    clearError();
                    clearSubmissionStoreError();
                    setSuccessMessage(null);
                    setDishSuggestions([]);
                  }}
                  disabled={isSubmittingAny}
                  className="py-1 px-3 text-gray-600 font-medium text-sm rounded-md hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateDish} // Calls the modified handler
                  disabled={
                    isSubmittingAny ||
                    !dishFormData.name.trim() ||
                    !dishFormData.restaurant_id
                  }
                  className="py-1 px-3 bg-[#A78B71] hover:bg-[#A78B71] text-gray-800 font-medium text-sm rounded-md"
                >
                  {isSubmittingAny ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    'Submit Dish'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Button
          variant="primary"
          size="lg"
          className="rounded-full h-12 w-12 flex items-center justify-center bg-[#A78B71] hover:bg-[#8B6F47] shadow-lg"
          onClick={toggleOpen}
          aria-label="Open quick add"
        >
          <Plus size={24} />
        </Button>
      )}
    </div>
  );
};

export default FloatingQuickAdd;