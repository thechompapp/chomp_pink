import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowRight, Search, Plus, List, Coffee, UtensilsCrossed } from 'lucide-react';

const QuickCreateForm = ({ onClose }) => {
  const [creationType, setCreationType] = useState('restaurant');
  const [step, setStep] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [showMapSuggestions, setShowMapSuggestions] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [manualTagInput, setManualTagInput] = useState('');
  const [showResetToast, setShowResetToast] = useState(false);
  
  // List-specific state
  const [listTitle, setListTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [listItems, setListItems] = useState([]);
  const [listDescription, setListDescription] = useState('');
  
  // Track previous type to detect changes
  const prevTypeRef = useRef(creationType);
  
  // Ref for the Google Maps autocomplete
  const autocompleteRef = useRef(null);

  // Reset form when toggling between restaurant and dish
  useEffect(() => {
    if (prevTypeRef.current !== creationType) {
      // Reset form data
      setNameInput('');
      setLocationInput('');
      setSelectedTags([]);
      setStep(1);
      setSuggestedTags([]);
      setShowSuggestions(false);
      
      // Reset list-specific data
      if (creationType === 'list') {
        setListTitle('');
        setListItems([]);
        setListDescription('');
      }
      
      // Show reset toast
      setShowResetToast(true);
      setTimeout(() => setShowResetToast(false), 2000);
      
      // Update the ref
      prevTypeRef.current = creationType;
    }
  }, [creationType]);

  // Mock data
  const suggestedRestaurants = [
    { id: 1, name: "Via Carota", neighborhood: "West Village", tags: ["italian", "pasta"] },
    { id: 2, name: "Vic's", neighborhood: "NoHo", tags: ["italian", "wine"] },
    { id: 3, name: "Vinetta", neighborhood: "East Village", tags: ["italian", "cozy"] }
  ];
  
  const suggestedDishes = [
    { id: 1, name: "Cacio e Pepe", restaurant: "Via Carota", tags: ["pasta", "signature"] },
    { id: 2, name: "Carbonara", restaurant: "Vic's", tags: ["pasta", "creamy"] },
    { id: 3, name: "Chicken Parm", restaurant: "Vinetta", tags: ["chicken", "classic"] }
  ];
  
  const suggestedListTemplates = [
    { id: 1, name: "Favorite Pasta Spots", description: "Collection of the best pasta restaurants", tags: ["italian", "pasta"] },
    { id: 2, name: "Date Night Places", description: "Romantic restaurants for special occasions", tags: ["romantic", "date-night"] },
    { id: 3, name: "Brunch Spots", description: "Best places for weekend brunch", tags: ["brunch", "breakfast"] }
  ];
  
  // Mock Google Places API data for place details
  const mockPlaceDetails = {
    "Via Carota": { address: "51 Grove St, West Village, New York, NY", coords: { lat: 40.7313, lng: -74.0042 } },
    "Lilia": { address: "567 Union Ave, Williamsburg, Brooklyn, NY", coords: { lat: 40.7139, lng: -73.9503 } },
    "Carbone": { address: "181 Thompson St, Greenwich Village, New York, NY", coords: { lat: 40.7273, lng: -74.0016 } },
    "Vic's": { address: "31 Great Jones St, NoHo, New York, NY", coords: { lat: 40.7273, lng: -73.9930 } },
    "Vinetta": { address: "231 E 10th St, East Village, New York, NY", coords: { lat: 40.7292, lng: -73.9845 } }
  };
  
  // Category mappings for contextual tag suggestions
  const cuisineToTags = {
    'italian': ['pasta', 'pizza', 'wine', 'romantic'],
    'japanese': ['sushi', 'ramen', 'sake', 'cozy'],
    'mexican': ['tacos', 'margaritas', 'spicy', 'casual'],
    'french': ['wine', 'romantic', 'fancy', 'date-night'],
    'chinese': ['dim-sum', 'noodles', 'family-style', 'quick-bite'],
    'thai': ['spicy', 'noodles', 'casual', 'quick-bite'],
    'american': ['burgers', 'cocktails', 'brunch', 'casual'],
    'indian': ['curry', 'spicy', 'vegetarian', 'family-style']
  };

  // Function to autopopulate location based on selected restaurant
  const autofillLocation = (restaurantName) => {
    // Simulate API call delay
    setTimeout(() => {
      const matchedPlace = mockPlaceDetails[restaurantName];
      if (matchedPlace) {
        setLocationInput(matchedPlace.address);
        // Generate location-based tags
        const lowercaseLocation = matchedPlace.address.toLowerCase();
        const locationTags = [];
        
        if (lowercaseLocation.includes('village')) locationTags.push('village');
        if (lowercaseLocation.includes('williamsburg') || lowercaseLocation.includes('brooklyn')) locationTags.push('brooklyn');
        if (lowercaseLocation.includes('east village')) locationTags.push('east-village');
        
        // Add location tags to suggested tags
        setSuggestedTags(prev => [...new Set([...prev, ...locationTags])]);
      }
    }, 300);
  };

  // Mock Google Maps Places API response
  const mockPlacesAPI = (input) => {
    const mockPlaces = [
      { id: 'place1', description: "51 Grove St, West Village, New York, NY", structured: { main: "51 Grove St", secondary: "West Village, New York" } },
      { id: 'place2', description: "52 Irving Pl, Gramercy, New York, NY", structured: { main: "52 Irving Pl", secondary: "Gramercy, New York" } },
      { id: 'place3', description: "50 Clinton St, Lower East Side, New York, NY", structured: { main: "50 Clinton St", secondary: "Lower East Side, New York" } },
      { id: 'place4', description: "55 Bond St, NoHo, New York, NY", structured: { main: "55 Bond St", secondary: "NoHo, New York" } }
    ];
    
    return mockPlaces.filter(place => 
      place.description.toLowerCase().includes(input.toLowerCase())
    );
  };
  
  // Handle location input change
  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);
    
    if (value.length > 2) {
      // Simulate Google Places API call
      const suggestions = mockPlacesAPI(value);
      setMapSuggestions(suggestions);
      setShowMapSuggestions(suggestions.length > 0);
    } else {
      setShowMapSuggestions(false);
    }
  };
  
  // Select a location from suggestions
  const selectLocation = (location) => {
    setLocationInput(location.description);
    setShowMapSuggestions(false);
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setNameInput(value);
    
    if (value.length > 2) {
      setShowSuggestions(true);
      
      // Generate contextual tag suggestions based on restaurant name
      generateTagSuggestions(value);
    } else {
      setShowSuggestions(false);
    }
  };
  
  const handleListTitleChange = (e) => {
    setListTitle(e.target.value);
    
    if (e.target.value.length > 2) {
      // Generate contextual tag suggestions based on list title
      generateTagSuggestions(e.target.value);
    }
  };
  
  // Function to generate contextual tag suggestions based on input
  const generateTagSuggestions = (input) => {
    const lowercaseInput = input.toLowerCase();
    let newSuggestions = [];
    
    // Check restaurant name against different cuisines
    Object.keys(cuisineToTags).forEach(cuisine => {
      if (lowercaseInput.includes(cuisine) || 
          (cuisine === 'italian' && (lowercaseInput.includes('pasta') || lowercaseInput.includes('pizz'))) ||
          (cuisine === 'japanese' && (lowercaseInput.includes('sushi') || lowercaseInput.includes('ramen'))) ||
          (cuisine === 'mexican' && (lowercaseInput.includes('taco') || lowercaseInput.includes('burrito'))) ||
          (cuisine === 'french' && (lowercaseInput.includes('bistro') || lowercaseInput.includes('cafe'))) ||
          (cuisine === 'chinese' && (lowercaseInput.includes('wok') || lowercaseInput.includes('dragon')))
         ) {
        newSuggestions = [...new Set([...newSuggestions, cuisine, ...cuisineToTags[cuisine]])];
      }
    });
    
    // If we have location information, add neighborhood tags
    if (locationInput) {
      const lowercaseLocation = locationInput.toLowerCase();
      if (lowercaseLocation.includes('soho') || lowercaseLocation.includes('tribeca'))
        newSuggestions.push('trendy');
      if (lowercaseLocation.includes('village') || lowercaseLocation.includes('brooklyn'))
        newSuggestions.push('cozy');
    }
    
    // Check for common list types
    if (creationType === 'list') {
      if (lowercaseInput.includes('favorite')) newSuggestions.push('favorites');
      if (lowercaseInput.includes('best')) newSuggestions.push('must-try');
      if (lowercaseInput.includes('brunch')) newSuggestions.push('breakfast', 'weekend');
      if (lowercaseInput.includes('date')) newSuggestions.push('romantic', 'date-night');
    }
    
    // If suggestions are low, add some common tags
    if (newSuggestions.length < 3) {
      newSuggestions = [...newSuggestions, 'must-try', 'hidden-gem', 'casual'];
    }
    
    // Limit to 10 suggestions
    newSuggestions = newSuggestions.slice(0, 10);
    
    setSuggestedTags(newSuggestions);
  };

  const selectSuggestion = (item) => {
    if (creationType === 'list') {
      setListTitle(item.name);
      setListDescription(item.description || '');
    } else {
      setNameInput(item.name);
    }
    
    setShowSuggestions(false);
    
    // Add the tags from the selected item
    if (item.tags && item.tags.length > 0) {
      setSelectedTags([...new Set([...selectedTags, ...item.tags])].slice(0, 5));
    }
    
    // Auto-populate location for restaurants
    if (creationType === 'restaurant') {
      autofillLocation(item.name);
    } else if (creationType === 'dish') {
      // For dishes, we'd need to set the restaurant name
      setLocationInput(item.restaurant || '');
    }
    
    setStep(2);
  };
  
  const handleManualTagInput = (e) => {
    setManualTagInput(e.target.value);
    
    // If user types a hashtag and space, add it as a tag
    if (e.target.value.endsWith(' ') && e.target.value.trim() !== '') {
      const newTag = e.target.value.trim().toLowerCase().replace('#', '');
      
      if (newTag && !selectedTags.includes(newTag) && selectedTags.length < 5) {
        setSelectedTags([...selectedTags, newTag]);
        
        // Generate related tags based on the manually entered tag
        const relatedTags = [];
        Object.keys(cuisineToTags).forEach(cuisine => {
          if (cuisine === newTag || cuisineToTags[cuisine].includes(newTag)) {
            relatedTags.push(...cuisineToTags[cuisine]);
          }
        });
        
        setSuggestedTags([...new Set(relatedTags.filter(tag => tag !== newTag))].slice(0, 10));
      }
      
      setManualTagInput('');
    }
  };
  
  const handleNextStep = () => {
    if (creationType === 'restaurant') {
      autofillLocation(nameInput);
    }
    setStep(2);
  };
  
  // Modified to handle closing the modal after completion
  const handleSubmit = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
      
      // Auto close after 2.5 seconds to allow user to see success message
      setTimeout(() => {
        if (onClose) onClose();
      }, 2500);
    }, 800);
  };
  
  const resetForm = () => {
    setCreationType('restaurant');
    setStep(1);
    setNameInput('');
    setLocationInput('');
    setSelectedTags([]);
    setSuggestedTags([]);
    setListTitle('');
    setListItems([]);
    setListDescription('');
    
    // Don't close the form - allow adding another
  };
  
  // Add option to close and add to list
  const handleAddToList = () => {
    if (onClose) onClose();
    // In a real app, you would navigate to the list selection view here
  };
  
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Add a new item to the list
  const handleAddListItem = () => {
    if (!nameInput.trim()) return;
    
    const newItem = {
      id: Date.now(),
      name: nameInput,
      type: locationInput ? 'dish' : 'restaurant',
      location: locationInput || '',
      tags: [...selectedTags]
    };
    
    setListItems([...listItems, newItem]);
    setNameInput('');
    setLocationInput('');
    setSelectedTags([]);
  };
  
  // Remove an item from the list
  const handleRemoveListItem = (id) => {
    setListItems(listItems.filter(item => item.id !== id));
  };

  const getSuggestions = () => {
    if (creationType === 'restaurant') {
      return suggestedRestaurants.filter(item => item.name.toLowerCase().includes(nameInput.toLowerCase()));
    } else if (creationType === 'dish') {
      return suggestedDishes.filter(item => item.name.toLowerCase().includes(nameInput.toLowerCase()));
    } else if (creationType === 'list') {
      return suggestedListTemplates.filter(item => item.name.toLowerCase().includes(listTitle.toLowerCase()));
    }
    return [];
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-pink-500 to-orange-400 text-white">
        <h2 className="text-xl font-bold">Quick Add</h2>
        <p className="text-sm opacity-90">Add a {creationType} in seconds</p>
      </div>
      
      {/* Type Selection */}
      <div className="p-4 border-b">
        <div className="flex rounded-lg overflow-hidden">
          <button 
            className={`flex-1 py-2 px-4 text-center flex justify-center items-center ${creationType === 'restaurant' 
              ? 'bg-pink-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setCreationType('restaurant')}
          >
            <Coffee size={16} className="mr-1" /> Restaurant
          </button>
          <button 
            className={`flex-1 py-2 px-4 text-center flex justify-center items-center ${creationType === 'dish' 
              ? 'bg-pink-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setCreationType('dish')}
          >
            <UtensilsCrossed size={16} className="mr-1" /> Dish
          </button>
          <button 
            className={`flex-1 py-2 px-4 text-center flex justify-center items-center ${creationType === 'list' 
              ? 'bg-pink-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setCreationType('list')}
          >
            <List size={16} className="mr-1" /> List
          </button>
        </div>
        
        {/* Auto-suggested hashtags based on context */}
        {suggestedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {suggestedTags
              .filter(tag => !selectedTags.includes(tag))
              .map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  disabled={selectedTags.length >= 5 && !selectedTags.includes(tag)}
                  className={`px-2 py-1 text-xs rounded-full ${
                    selectedTags.length >= 5 && !selectedTags.includes(tag)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))
            }
          </div>
        )}
      </div>
      
      {/* Restaurant or Dish Creation - Step 1 */}
      {(creationType === 'restaurant' || creationType === 'dish') && step === 1 && (
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {creationType === 'restaurant' ? 'Restaurant Name' : 'Dish Name'}
            </label>
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={handleNameChange}
                  className="w-full p-2 pr-8 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                  placeholder={creationType === 'restaurant' ? "Via Carota" : "Cacio e Pepe"}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <Search size={18} />
                </div>
              </div>
              
              {showSuggestions && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200 max-h-60 overflow-auto">
                  <div className="text-xs font-medium text-gray-500 p-2 bg-gray-50">
                    Existing {creationType === 'restaurant' ? 'restaurants' : 'dishes'} - click to select
                  </div>
                  <ul>
                    {getSuggestions().map(item => (
                      <li 
                        key={item.id} 
                        className="px-3 py-2 hover:bg-pink-50 cursor-pointer border-b border-gray-100"
                        onClick={() => selectSuggestion(item)}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {creationType === 'restaurant' 
                            ? item.neighborhood
                            : `at ${item.restaurant}`}
                        </div>
                      </li>
                    ))}
                    <li className="px-3 py-2 text-pink-600 hover:bg-pink-50 cursor-pointer text-sm font-medium">
                      + Create new {creationType}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={handleNextStep}
              disabled={!nameInput.trim()}
              className={`flex items-center px-4 py-2 rounded-lg ${
                nameInput.trim() 
                  ? 'bg-pink-500 text-white hover:bg-pink-600' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      )}
      
      {/* List Creation - Step 1 */}
      {creationType === 'list' && step === 1 && (
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              List Title
            </label>
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={listTitle}
                  onChange={handleListTitleChange}
                  className="w-full p-2 pr-8 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                  placeholder="My Favorite Pizza Places"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <Search size={18} />
                </div>
              </div>
              
              {listTitle.length > 2 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200 max-h-60 overflow-auto">
                  <div className="text-xs font-medium text-gray-500 p-2 bg-gray-50">
                    Suggested templates - click to select
                  </div>
                  <ul>
                    {getSuggestions().map(item => (
                      <li 
                        key={item.id} 
                        className="px-3 py-2 hover:bg-pink-50 cursor-pointer border-b border-gray-100"
                        onClick={() => selectSuggestion(item)}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </li>
                    ))}
                    <li className="px-3 py-2 text-pink-600 hover:bg-pink-50 cursor-pointer text-sm font-medium">
                      + Create custom list
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={listDescription}
              onChange={(e) => setListDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
              placeholder="A short description of your list"
              rows={2}
            />
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                id="public"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="public" className="ml-2 block text-sm text-gray-700">
                Make this list public
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Public lists can be seen by anyone and will appear in search results.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={handleNextStep}
              disabled={!listTitle.trim()}
              className={`flex items-center px-4 py-2 rounded-lg ${
                listTitle.trim() 
                  ? 'bg-pink-500 text-white hover:bg-pink-600' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      )}
      
      {/* Restaurant or Dish - Step 2: Additional Info */}
      {(creationType === 'restaurant' || creationType === 'dish') && step === 2 && (
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {creationType === 'restaurant' ? 'Location' : 'Restaurant'}
            </label>
            <div className="flex relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <MapPin size={18} />
              </div>
              <input
                type="text"
                value={locationInput}
                onChange={handleLocationChange}
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                placeholder={creationType === 'restaurant' ? "Search address or neighborhood" : "Search restaurant name"}
              />
            </div>
            
            {/* Google Maps Places Autocomplete Suggestions */}
            {showMapSuggestions && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200 max-h-60 overflow-auto">
                <ul>
                  {mapSuggestions.map(place => (
                    <li 
                      key={place.id} 
                      className="px-3 py-2 hover:bg-pink-50 cursor-pointer border-b border-gray-100 flex items-start"
                      onClick={() => selectLocation(place)}
                    >
                      <MapPin size={16} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{place.structured.main}</div>
                        <div className="text-xs text-gray-500">{place.structured.secondary}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (select up to 5)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTags.map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-sm flex items-center"
                >
                  #{tag}
                  <button 
                    onClick={() => toggleTag(tag)}
                    className="ml-1 text-pink-600 hover:text-pink-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedTags.length < 5 && (
                <div className="relative w-full">
                  <input
                    type="text"
                    value={manualTagInput}
                    onChange={handleManualTagInput}
                    placeholder="Type a tag and press space to add"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTags
                .filter(tag => !selectedTags.includes(tag))
                .map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    disabled={selectedTags.length >= 5 && !selectedTags.includes(tag)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      selectedTags.length >= 5 && !selectedTags.includes(tag)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))
              }
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={() => setStep(1)}
              className="text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
            
            <button 
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`flex items-center px-4 py-2 rounded-lg ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-wait'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Create'}
            </button>
          </div>
        </div>
      )}
      
      {/* List Creation - Step 2: Add Items */}
      {creationType === 'list' && step === 2 && (
        <div className="p-4">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Add Items to "{listTitle}"
              </label>
              <span className="text-xs text-gray-500">{listItems.length} items</span>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={handleNameChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                placeholder="Restaurant or dish name"
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">
                Location/Restaurant (optional)
              </label>
              <input
                type="text"
                value={locationInput}
                onChange={handleLocationChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                placeholder="For dishes, add the restaurant"
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {selectedTags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full text-xs flex items-center"
                  >
                    #{tag}
                    <button 
                      onClick={() => toggleTag(tag)}
                      className="ml-1 text-pink-600 hover:text-pink-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {selectedTags.length < 5 && (
                <input
                  type="text"
                  value={manualTagInput}
                  onChange={handleManualTagInput}
                  placeholder="Type a tag and press space"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 text-sm"
                />
              )}
            </div>
            
            <button
              onClick={handleAddListItem}
              disabled={!nameInput.trim()}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-lg ${
                nameInput.trim()
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Plus size={16} className="mr-1" />
              Add to List
            </button>
          </div>
          
          {/* List of added items */}
          {listItems.length > 0 && (
            <div className="mb-4">
              <div className="border rounded-lg divide-y">
                {listItems.map((item) => (
                  <div key={item.id} className="p-2 flex items-center justify-between hover:bg-gray-50">
                    <div className="overflow-hidden">
                      <div className="font-medium truncate">{item.name}</div>
                      {item.location && (
                        <div className="text-xs text-gray-500 truncate">
                          {item.location}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveListItem(item.id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-4">
            <button 
              onClick={() => setStep(1)}
              className="text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
            
            <button 
              onClick={handleSubmit}
              disabled={isProcessing || listItems.length === 0}
              className={`flex items-center px-4 py-2 rounded-lg ${
                isProcessing || listItems.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {isProcessing ? 'Processing...' : listItems.length === 0 ? 'Add Items First' : 'Create List'}
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Success */}
      {step === 3 && (
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-1">Added Successfully!</h3>
          <p className="text-gray-600 mb-4">
            {creationType === 'list' 
              ? `"${listTitle}" with ${listItems.length} items has been created.`
              : `${nameInput} has been added to your collection.`}
          </p>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={resetForm}
              className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              Add Another
            </button>
            {creationType !== 'list' && (
              <button
                onClick={handleAddToList}
                className="w-full px-4 py-2 border border-pink-500 text-pink-500 rounded-lg hover:bg-pink-50"
              >
                Add to a List
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toast message for type change */}
      {showResetToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in-out">
          Form cleared for new {creationType} entry
        </div>
      )}
    </div>
  );
};

export default QuickCreateForm;