/* src/components/FloatingQuickAdd.jsx */
import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import PlacesAutocomplete from '@/components/UI/PlacesAutocomplete';
import RestaurantAutocomplete from '@/components/UI/RestaurantAutocomplete';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import PillButton from '@/components/UI/PillButton';
import Select from '@/components/UI/Select';
import { useQuickAdd } from '@/contexts/QuickAddContext';
import useFormHandler from '@/hooks/useFormHandler';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';
import useUserListStore from '@/stores/useUserListStore';
import useSubmissionStore from '@/stores/useSubmissionStore';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/searchService';
import { filterService } from '@/services/filterService'; // Updated for API standardization

const FloatingQuickAdd = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isCreatingRestaurant, setIsCreatingRestaurant] = useState(false);
  const [isCreatingDish, setIsCreatingDish] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const { openQuickAdd } = useQuickAdd();
  const { handleError, errorMessage, clearError } = useApiErrorHandler();

  const [manualCity, setManualCity] = useState('');
  const [showManualCitySelect, setShowManualCitySelect] = useState(false);

  const { addToList } = useUserListStore();
  const isAddingToListStore = useUserListStore(state => state.isAddingToList);
  const userListStoreError = useUserListStore(state => state.error);
  const clearUserListStoreError = useUserListStore(state => state.clearError);

  const addPendingSubmission = useSubmissionStore(state => state.addPendingSubmission);
  const isSubmittingViaStore = useSubmissionStore(state => state.isLoading);
  const submissionStoreError = useSubmissionStore(state => state.error);
  const clearSubmissionStoreError = useSubmissionStore(state => state.clearError);

  const initialListValues = { name: '', list_type: '' };
  const { formData: listFormData, setFormData: setListFormData, handleChange: handleListChange, handleSubmit: handleListSubmit, isSubmitting: isListFormSubmitting, submitError: listSubmitError, setSubmitError: setListSubmitError, resetForm: resetListForm } = useFormHandler(initialListValues);
  const initialRestaurantValues = { name: '', place_id: '', address: '', city: '', neighborhood: '' };
  const { formData: restaurantFormData, setFormData: setRestaurantFormData, handleSubmit: handleRestaurantSubmit, isSubmitting: isRestaurantFormSubmitting, submitError: restaurantSubmitError, setSubmitError: setRestaurantSubmitError, resetForm: resetRestaurantForm } = useFormHandler(initialRestaurantValues);
  const initialDishValues = { name: '', restaurant_id: null, restaurant_name: '' };
  const { formData: dishFormData, setFormData: setDishFormData, handleChange: handleDishChange, handleSubmit: handleDishSubmit, isSubmitting: isDishFormSubmitting, submitError: dishSubmitError, setSubmitError: setDishSubmitError, resetForm: resetDishForm } = useFormHandler(initialDishValues);

  const { data: dishSearchResults, isLoading: isDishLoading } = useQuery({ queryKey: ['dishSuggestions', dishFormData.name], queryFn: () => searchService.search({ q: dishFormData.name, type: 'dish', limit: 5 }), enabled: isCreatingDish && !!dishFormData.name.trim() && dishFormData.name.length >= 2, placeholderData: { dishes: [] } });

  const { data: citiesList, isLoading: isLoadingCities } = useQuery({
    queryKey: ['citiesList'],
    queryFn: filterService.getCities, // Use default export
    staleTime: Infinity,
    enabled: isCreatingRestaurant,
    placeholderData: [],
  });

  useEffect(() => { 
    if (isCreatingDish && dishSearchResults?.dishes) { 
      setDishSuggestions(dishSearchResults.dishes.map(dish => dish.name)); 
    } else { 
      setDishSuggestions([]); 
    } 
  }, [dishSearchResults, isCreatingDish]);

  const resetAllFormsAndStates = () => {
    setIsCreatingList(false); setIsCreatingRestaurant(false); setIsCreatingDish(false);
    setSuccessMessage(null); clearError(); clearSubmissionStoreError(); clearUserListStoreError();
    resetListForm(initialListValues); resetRestaurantForm(initialRestaurantValues); resetDishForm(initialDishValues);
    setDishSuggestions([]);
    setShowManualCitySelect(false);
    setManualCity('');
  };

  const toggleOpen = () => {
    if (isOpen) { resetAllFormsAndStates(); }
    setIsOpen(!isOpen);
  };

  const handleCreateNewList = async () => { 
    const result = await handleListSubmit(async (data) => { 
      if (!data.name.trim()) throw new Error('List name is required.'); 
      if (!data.list_type) throw new Error('Please select a list type.'); 
      await addToList({ createNew: true, listData: { name: data.name.trim(), list_type: data.list_type, is_public: true } }); 
    }); 
    if (result.success) { 
      setSuccessMessage('List created!'); 
      setTimeout(() => { setIsCreatingList(false); setSuccessMessage(null); resetListForm(initialListValues); }, 2000); 
    } else { 
      setListSubmitError(result.error || userListStoreError || 'Failed to create list.'); 
    } 
  };

  const handleCreateRestaurant = async () => {
    setRestaurantSubmitError(null); clearSubmissionStoreError();
    const finalCity = (restaurantFormData.city || manualCity)?.trim();
    if (!restaurantFormData.name?.trim()) { setRestaurantSubmitError('Restaurant name is required.'); return; }
    if (!restaurantFormData.place_id) { setRestaurantSubmitError('Please select a place from suggestions to get location details.'); return; }
    if (!finalCity) {
      setRestaurantSubmitError('City is required. Please select a place or choose a city manually.');
      setShowManualCitySelect(true);
      return;
    }

    const result = await handleRestaurantSubmit(async (data) => {
      console.log("[FloatingQuickAdd] Submitting restaurant data with final city:", finalCity);
      await addPendingSubmission({
        type: 'restaurant',
        name: data.name.trim(),
        place_id: data.place_id,
        location: data.address || null,
        city: finalCity,
        neighborhood: data.neighborhood?.trim() || null
      });
    });
    if (result.success) {
      setSuccessMessage('Restaurant submitted!');
      setTimeout(() => { resetAllFormsAndStates(); setIsOpen(true); setIsCreatingRestaurant(true); }, 2000);
    } else {
      setRestaurantSubmitError(result.error || submissionStoreError || 'Failed to submit restaurant.');
    }
  };

  const handleCreateDish = async () => { 
    setDishSubmitError(null); clearSubmissionStoreError(); 
    if (!dishFormData.name?.trim()) { setDishSubmitError('Dish name is required.'); return; } 
    if (!dishFormData.restaurant_id) { setDishSubmitError('Please select a restaurant from suggestions.'); return; } 
    const result = await handleDishSubmit(async (data) => { 
      console.log("[FloatingQuickAdd] Submitting dish data:", data); 
      await addPendingSubmission({ type: 'dish', name: data.name.trim(), restaurant_id: data.restaurant_id, restaurant_name: data.restaurant_name || null }); 
    }); 
    if (result.success) { 
      setSuccessMessage('Dish submitted!'); 
      setTimeout(() => { setIsCreatingDish(false); setSuccessMessage(null); resetDishForm(initialDishValues); setDishSuggestions([]); }, 2000); 
    } else { 
      setDishSubmitError(result.error || submissionStoreError || 'Failed to submit dish.'); 
    } 
  };

  const handleListTypeSelect = (type) => { 
    setListFormData((prev) => ({ ...prev, list_type: type })); 
    clearError(); clearUserListStoreError(); setListSubmitError(null); 
  };

  const handlePlaceSelected = (placeData) => {
    console.log('[FloatingQuickAdd] handlePlaceSelected received:', placeData);
    setRestaurantSubmitError(null); clearSubmissionStoreError();
    setManualCity('');
    setShowManualCitySelect(false);

    if (placeData && placeData.place_id) {
      const extractedCity = placeData.city?.trim() || '';
      setRestaurantFormData({
        name: placeData.name || '',
        place_id: placeData.place_id,
        address: placeData.formattedAddress || '',
        city: extractedCity,
        neighborhood: placeData.neighborhood?.trim() || '',
      });

      console.log('[FloatingQuickAdd] Attempting to set restaurantFormData to:', { ...placeData, city: extractedCity });

      if (!extractedCity) {
        console.warn('[FloatingQuickAdd] City field in placeData is empty even after extraction attempts:', placeData);
        setRestaurantSubmitError('Warning: City could not be extracted. Please select manually below.');
        setShowManualCitySelect(true);
      }
    } else {
      setRestaurantFormData(initialRestaurantValues);
      console.log('[FloatingQuickAdd] Reset restaurantFormData (placeData null or invalid)');
    }
  };

  const handleRestaurantSelected = (restaurant) => { 
    setDishSubmitError(null); clearSubmissionStoreError(); 
    if (restaurant) { 
      setDishFormData({ name: dishFormData.name, restaurant_id: restaurant.id || '', restaurant_name: restaurant.name || '' }); 
    } else { 
      setDishFormData(prev => ({ ...prev, restaurant_id: '', restaurant_name: '' })); 
    } 
  };

  const handleDishSuggestionSelect = (suggestion) => { 
    setDishFormData((prev) => ({ ...prev, name: suggestion })); 
    setDishSuggestions([]); 
  };

  const isSubmittingAny = isListFormSubmitting || isAddingToListStore || isRestaurantFormSubmitting || isDishFormSubmitting || isSubmittingViaStore;
  const displayError = listSubmitError || userListStoreError || restaurantSubmitError || dishSubmitError || submissionStoreError || errorMessage;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {isOpen ? (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 w-80 sm:w-96 max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Quick Add</h3>
            <Button variant="tertiary" size="icon" onClick={toggleOpen} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close quick add" disabled={isSubmittingAny} > <X size={20} /> </Button>
          </div>

          {!isCreatingList && !isCreatingRestaurant && !isCreatingDish && ( 
            <div className="space-y-2"> 
              <Button variant="primary" size="lg" className="w-full justify-start text-left" onClick={() => { setIsCreatingList(true); clearError(); clearSubmissionStoreError(); clearUserListStoreError(); }} > Create a List </Button> 
              <Button variant="primary" size="lg" className="w-full justify-start text-left" onClick={() => { setIsCreatingRestaurant(true); clearError(); clearSubmissionStoreError(); clearUserListStoreError(); }} > Submit a Restaurant </Button> 
              <Button variant="primary" size="lg" className="w-full justify-start text-left" onClick={() => { setIsCreatingDish(true); clearError(); clearSubmissionStoreError(); clearUserListStoreError(); }} > Submit a Dish </Button> 
            </div> 
          )}

          {isCreatingList && ( 
            <div className="space-y-3"> 
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">New List</h4> 
              <div> 
                <label htmlFor="list-name" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"> List Name </label> 
                <Input id="list-name" name="name" value={listFormData.name} onChange={handleListChange} placeholder="Enter list name..." className="w-full text-sm" disabled={isSubmittingAny} aria-invalid={!!(listSubmitError || userListStoreError)} aria-describedby={(listSubmitError || userListStoreError) ? 'list-error' : undefined} /> 
              </div> 
              <div> 
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">List Type</label> 
                <div className="flex space-x-2"> 
                  <PillButton label="Restaurant" isActive={listFormData.list_type === 'restaurant'} onClick={() => handleListTypeSelect('restaurant')} disabled={isSubmittingAny} /> 
                  <PillButton label="Dish" isActive={listFormData.list_type === 'dish'} onClick={() => handleListTypeSelect('dish')} disabled={isSubmittingAny} /> 
                </div> 
              </div> 
              {(displayError && isCreatingList) && ( <div id="list-error" className="text-sm text-red-600 dark:text-red-400"> {displayError} </div> )} 
              {successMessage && ( <div className="text-sm text-green-600 dark:text-green-400">{successMessage}</div> )} 
              <div className="flex justify-end space-x-2 mt-2"> 
                <Button variant="secondary" size="sm" onClick={() => resetAllFormsAndStates()} disabled={isSubmittingAny} > Cancel </Button> 
                <Button variant="primary" size="sm" onClick={handleCreateNewList} disabled={isSubmittingAny || !listFormData.name.trim() || !listFormData.list_type} > {isSubmittingAny ? ( <><Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" /> Creating...</> ) : ( 'Create List' )} </Button> 
              </div> 
            </div> 
          )}

          {isCreatingRestaurant && (
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">New Restaurant Submission</h4>
              <div>
                <label htmlFor="place-autocomplete-qadd" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"> Search Place </label>
                <PlacesAutocomplete rowId="qadd-restaurant" initialValue={restaurantFormData.name} onPlaceSelected={handlePlaceSelected} disabled={isSubmittingAny} enableManualEntry={true} placeholder="Search Google Places..." aria-invalid={!!(restaurantSubmitError || submissionStoreError)} aria-describedby={(restaurantSubmitError || submissionStoreError) ? 'restaurant-error' : undefined} />
                {!restaurantFormData.place_id && restaurantFormData.name && ( <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select a place from suggestions to auto-fill details.</p> )}
              </div>

              {showManualCitySelect && (
                <div>
                  <Select
                    label="Select City Manually"
                    id="manual-city-select"
                    value={manualCity}
                    onChange={(e) => {
                      setManualCity(e.target.value);
                      if (restaurantSubmitError?.includes('City is required')) {
                        setRestaurantSubmitError(null);
                      }
                    }}
                    disabled={isLoadingCities || isSubmittingAny}
                    error={!manualCity && restaurantSubmitError?.includes('City is required') ? "Please select a city" : ""}
                  >
                    <option value="" disabled>
                      {isLoadingCities ? 'Loading cities...' : '-- Select City --'}
                    </option>
                    {(citiesList || []).map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </Select>
                  {isLoadingCities && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading available cities...</p>}
                  {!isLoadingCities && (!citiesList || citiesList.length === 0) && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">Could not load cities list.</p>
                  )}
                </div>
              )}

              {(displayError && isCreatingRestaurant) && ( <div id="restaurant-error" className="text-sm text-red-600 dark:text-red-400"> {displayError} </div> )}
              {successMessage && ( <div className="text-sm text-green-600 dark:text-green-400">{successMessage}</div> )}

              <div className="flex justify-end space-x-2 mt-2">
                <Button variant="secondary" size="sm" onClick={() => resetAllFormsAndStates()} disabled={isSubmittingAny} > Cancel </Button>
                <Button variant="primary" size="sm" onClick={handleCreateRestaurant} disabled={isSubmittingAny} > {isSubmittingAny ? ( <><Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" /> Submitting...</> ) : ( 'Submit Restaurant' )} </Button>
              </div>
            </div>
          )}

          {isCreatingDish && ( 
            <div className="space-y-3"> 
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">New Dish Submission</h4> 
              <div className="relative"> 
                <label htmlFor="dish-name" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"> Dish Name </label> 
                <Input id="dish-name" name="name" value={dishFormData.name} onChange={handleDishChange} placeholder="Enter dish name..." className="w-full text-sm" disabled={isSubmittingAny} aria-invalid={!!(dishSubmitError || submissionStoreError)} aria-describedby={(dishSubmitError || submissionStoreError) ? 'dish-error' : undefined} autoComplete="off" /> 
                {isDishLoading && dishFormData.name && ( <Loader2 className="absolute right-2 top-9 h-4 w-4 animate-spin text-gray-400" /> )} 
                {dishSuggestions.length > 0 && ( <ul className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1"> {dishSuggestions.map((suggestion, index) => ( <li key={index} className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onMouseDown={() => handleDishSuggestionSelect(suggestion)} > {suggestion} </li> ))} </ul> )} 
              </div> 
              <div> 
                <label htmlFor="restaurant-autocomplete-dish" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"> Restaurant </label> 
                <RestaurantAutocomplete inputId="restaurant-autocomplete-dish" initialValue={dishFormData.restaurant_name} onRestaurantSelected={handleRestaurantSelected} onChange={(value) => { if (dishFormData.restaurant_id && value !== dishFormData.restaurant_name) { setDishFormData(prev => ({ ...prev, restaurant_name: value, restaurant_id: '' })); } else { setDishFormData(prev => ({ ...prev, restaurant_name: value })); } }} disabled={isSubmittingAny} placeholder="Search for restaurant..." useLocalSearch={true} aria-invalid={!!(dishSubmitError || submissionStoreError)} aria-describedby={(dishSubmitError || submissionStoreError) ? 'dish-error' : undefined} /> 
                {!dishFormData.restaurant_id && dishFormData.restaurant_name && ( <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Select a restaurant from suggestions.</p> )} 
              </div> 
              {(displayError && isCreatingDish) && ( <div id="dish-error" className="text-sm text-red-600 dark:text-red-400"> {displayError} </div> )} 
              {successMessage && ( <div className="text-sm text-green-600 dark:text-green-400">{successMessage}</div> )} 
              <div className="flex justify-end space-x-2 mt-2"> 
                <Button variant="secondary" size="sm" onClick={() => resetAllFormsAndStates()} disabled={isSubmittingAny} > Cancel </Button> 
                <Button variant="primary" size="sm" onClick={handleCreateDish} disabled={isSubmittingAny} > {isSubmittingAny ? ( <><Loader2 className="animate-spin h-4 w-4 mr-2 inline-block" /> Submitting...</> ) : ( 'Submit Dish' )} </Button> 
              </div> 
            </div> 
          )}
        </div>
      ) : (
        <Button variant="primary" size="icon" className="rounded-full h-12 w-12 flex items-center justify-center shadow-lg" onClick={toggleOpen} aria-label="Open quick add" > <Plus size={24} /> </Button>
      )}
    </div>
  );
};

export default FloatingQuickAdd;