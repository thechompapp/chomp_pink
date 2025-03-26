import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, ArrowRight, Search, Plus, List, Coffee, UtensilsCrossed } from 'lucide-react';

// Reusable Button Component
const Button = ({ onClick, disabled, children, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg transition-colors ${className} ${
      disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''
    }`}
  >
    {children}
  </button>
);

// Reusable Input Component
const Input = ({ value, onChange, placeholder, icon: Icon, className }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
        <Icon size={18} />
      </div>
    )}
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-2 ${Icon ? 'pl-10' : ''} border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 ${className}`}
    />
  </div>
);

// Reusable Tag Component
const Tag = ({ tag, onRemove, disabled }) => (
  <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-sm flex items-center">
    #{tag}
    {!disabled && (
      <button
        onClick={() => onRemove(tag)}
        className="ml-1 text-pink-600 hover:text-pink-800"
        aria-label={`Remove tag ${tag}`}
      >
        ×
      </button>
    )}
  </span>
);

const QuickCreateForm = ({ onClose }) => {
  const [creationType, setCreationType] = useState('restaurant');
  const [step, setStep] = useState(1);
  const [nameInput, setNameInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [manualTagInput, setManualTagInput] = useState('');
  const [showResetToast, setShowResetToast] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [listItems, setListItems] = useState([]);
  const [listDescription, setListDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const prevTypeRef = useRef(creationType);

  // Reset form when toggling between types
  useEffect(() => {
    if (prevTypeRef.current !== creationType) {
      setNameInput('');
      setLocationInput('');
      setSelectedTags([]);
      setStep(1);
      setListTitle('');
      setListItems([]);
      setListDescription('');
      setShowResetToast(true);
      setTimeout(() => setShowResetToast(false), 2000);
      prevTypeRef.current = creationType;
    }
  }, [creationType]);

  const handleNameChange = useCallback((e) => {
    setNameInput(e.target.value);
  }, []);

  const handleLocationChange = useCallback((e) => {
    setLocationInput(e.target.value);
  }, []);

  const toggleTag = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleManualTagInput = useCallback((e) => {
    setManualTagInput(e.target.value);
    if (e.target.value.endsWith(' ') && e.target.value.trim() !== '') {
      const newTag = e.target.value.trim().toLowerCase().replace('#', '');
      if (newTag && !selectedTags.includes(newTag) && selectedTags.length < 5) {
        setSelectedTags((prev) => [...prev, newTag]);
      }
      setManualTagInput('');
    }
  }, [selectedTags]);

  const handleSubmit = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
      setTimeout(() => {
        if (onClose) onClose();
      }, 2500);
    }, 800);
  }, [onClose]);

  const resetForm = useCallback(() => {
    setCreationType('restaurant');
    setStep(1);
    setNameInput('');
    setLocationInput('');
    setSelectedTags([]);
    setListTitle('');
    setListItems([]);
    setListDescription('');
  }, []);

  const handleAddListItem = useCallback(() => {
    if (!nameInput.trim()) return;
    const newItem = {
      id: Date.now(),
      name: nameInput,
      location: locationInput,
      tags: [...selectedTags],
    };
    setListItems((prev) => [...prev, newItem]);
    setNameInput('');
    setLocationInput('');
    setSelectedTags([]);
  }, [nameInput, locationInput, selectedTags]);

  const handleRemoveListItem = useCallback((id) => {
    setListItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

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
          {['restaurant', 'dish', 'list'].map((type) => (
            <button
              key={type}
              onClick={() => setCreationType(type)}
              className={`flex-1 py-2 px-4 text-center flex justify-center items-center ${
                creationType === type
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'restaurant' && <Coffee size={16} className="mr-1" />}
              {type === 'dish' && <UtensilsCrossed size={16} className="mr-1" />}
              {type === 'list' && <List size={16} className="mr-1" />}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4">
        {step === 1 && (
          <>
            <Input
              value={nameInput}
              onChange={handleNameChange}
              placeholder={`Enter ${creationType === 'restaurant' ? 'restaurant' : 'dish'} name`}
              icon={Search}
            />
            <div className="mt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!nameInput.trim()}
                className="bg-pink-500 text-white hover:bg-pink-600"
              >
                Next <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Input
              value={locationInput}
              onChange={handleLocationChange}
              placeholder="Enter location"
              icon={MapPin}
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (select up to 5)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <Tag key={tag} tag={tag} onRemove={toggleTag} />
                ))}
                {selectedTags.length < 5 && (
                  <Input
                    value={manualTagInput}
                    onChange={handleManualTagInput}
                    placeholder="Type a tag and press space"
                    className="text-sm"
                  />
                )}
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                onClick={() => setStep(1)}
                className="text-gray-600 hover:text-gray-800"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing}
                className={`${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-wait'
                    : 'bg-pink-500 text-white hover:bg-pink-600'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Create'}
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center">
            <h3 className="text-xl font-medium text-gray-900 mb-1">
              Added Successfully!
            </h3>
            <Button onClick={resetForm} className="bg-pink-500 text-white hover:bg-pink-600">
              Add Another
            </Button>
          </div>
        )}
      </div>

      {/* Toast */}
      {showResetToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in-out">
          Form cleared for new {creationType} entry
        </div>
      )}
    </div>
  );
};

export default QuickCreateForm;
