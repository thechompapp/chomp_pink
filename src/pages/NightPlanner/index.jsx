// src/pages/NightPlanner/index.jsx
// UPDATE: Remove useAppStore, use local state for plans temporarily.
// TODO: Create a dedicated usePlannerStore for managing 'plans' state globally.
import React, { useState, useEffect, useCallback } from "react";
import { Moon, Plus, MapPin, Calendar, Clock, Users, Trash, Check, Save, Edit2, X } from "lucide-react";
import RestaurantCard from "@/components/UI/RestaurantCard";
import { Link } from "react-router-dom";
// ** REMOVED: import useAppStore from "@/hooks/useAppStore"; **
import Button from "@/components/Button";
import Modal from "@/components/UI/Modal";

// Sample data structure (used for local state initialization)
const samplePlansData = [
  {
    id: 1,
    title: "Date Night",
    date: "2025-04-15",
    time: "19:30",
    location: "Downtown",
    numberOfPeople: "2",
    notes: "Looking for a romantic dinner spot with cocktails",
    items: [
      { id: 1, name: "The Rooftop", type: "restaurant", tags: ["romantic", "cocktails"], neighborhood: "Downtown", city: "New York" },
    ],
  },
  {
    id: 2,
    title: "Birthday Dinner",
    date: "2025-05-25",
    time: "20:00",
    location: "West Village",
    numberOfPeople: "8",
    notes: "Need a place that takes reservations for groups",
    items: [],
  },
];

const sampleRecommendationsData = [
  { name: "Lilia", neighborhood: "Williamsburg", city: "New York", tags: ["italian", "pasta", "romantic"] },
  { name: "Rolf's", neighborhood: "Gramercy", city: "New York", tags: ["german", "festive", "drinks"] },
  { name: "Buvette", neighborhood: "West Village", city: "New York", tags: ["french", "cozy", "wine"] },
  { name: "Le Bernardin", neighborhood: "Midtown", city: "New York", tags: ["seafood", "fine-dining", "special-occasion"] },
  { name: "Dante", neighborhood: "Greenwich Village", city: "New York", tags: ["cocktails", "italian", "casual"] },
  { name: "Ci Siamo", neighborhood: "Hudson Yards", city: "New York", tags: ["italian", "new", "lively"] },
];
// --- End Sample Data ---

const NightPlanner = () => {
  // ** FIX: Use local state for plans as useAppStore is removed **
  // ** NOTE: This state is local and won't persist or be shared. **
  // ** TODO: Replace with state and actions from a dedicated usePlannerStore. **
  const [plans, setPlans] = useState([]);
  const [recommendations, setRecommendations] = useState([]); // Keep recommendations local for now

  // Local UI state
  const [currentPlan, setCurrentPlan] = useState(null); // The plan currently being viewed/edited
  const [editMode, setEditMode] = useState(false); // Is the current plan being edited?
  const [editedPlan, setEditedPlan] = useState(null); // Temporary state while editing
  const [showAddPlan, setShowAddPlan] = useState(false); // Controls the 'New Plan' modal
  const [newPlan, setNewPlan] = useState({ // State for the 'New Plan' form
    title: "", date: "", time: "", location: "", numberOfPeople: "2", notes: "", items: [],
  });

  // --- Actions using Local State (TODO: Replace with store actions) ---
  const addPlanLocal = useCallback((planToAdd) => {
    setPlans(prev => [...prev, { ...planToAdd, id: Date.now() }]); // Add unique ID locally
  }, []);

  const updatePlanLocal = useCallback((planId, updatedData) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updatedData } : p));
    // If the currently viewed plan is updated, update currentPlan state too
    if (currentPlan?.id === planId) {
        setCurrentPlan(prev => ({...prev, ...updatedData}));
    }
  }, [currentPlan?.id]); // Depend on currentPlan.id to update it if necessary

  // --- Effects ---
  // Effect to load initial sample data into local state
  useEffect(() => {
    console.log("[NightPlanner] Initializing local state with sample data.");
    setPlans(samplePlansData);
    setRecommendations(sampleRecommendationsData);
    if (samplePlansData.length > 0) {
      setCurrentPlan(samplePlansData[0]); // Select the first plan initially
    }
  }, []); // Runs only once on mount


  // --- Handlers ---
  const handleAddPlace = useCallback((place) => {
    if (!currentPlan) return;
    // Ensure place has a unique ID within the context of this plan's items
    const newItem = { ...place, id: Date.now() + Math.random() }; // Simple unique enough ID for local state
    const updatedPlanData = {
      ...currentPlan,
      items: [...currentPlan.items, newItem],
    };
    // Use the local update function
    updatePlanLocal(currentPlan.id, updatedPlanData);
  }, [currentPlan, updatePlanLocal]);

  const handleRemovePlace = useCallback((placeId) => {
    if (!currentPlan) return;
    const updatedPlanData = {
      ...currentPlan,
      items: currentPlan.items.filter((item) => item.id !== placeId),
    };
     // Use the local update function
    updatePlanLocal(currentPlan.id, updatedPlanData);
  }, [currentPlan, updatePlanLocal]);

  const handleEditPlan = useCallback(() => {
    if (!currentPlan) return;
    setEditMode(true);
    setEditedPlan({ ...currentPlan }); // Copy current plan to edit state
  }, [currentPlan]);

  const handleSaveEdit = useCallback(() => {
    if (!editedPlan) return;
    // Use the local update function
    updatePlanLocal(editedPlan.id, editedPlan);
    setEditMode(false); // Exit edit mode
    setEditedPlan(null); // Clear edit state
  }, [editedPlan, updatePlanLocal]);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setEditedPlan(null);
  }, []);

  const handleCreatePlan = useCallback(() => {
    // Use the local add function
    addPlanLocal(newPlan); // ID will be added by addPlanLocal
    // Select the newly created plan (find it by timestamp/content, tricky with local state)
    // For simplicity, select the last added plan after a short delay (not robust)
    setTimeout(() => {
        setPlans(prevPlans => {
            if (prevPlans.length > 0) setCurrentPlan(prevPlans[prevPlans.length - 1]);
            return prevPlans;
        })
    }, 10);

    setShowAddPlan(false); // Close modal
    setNewPlan({ title: "", date: "", time: "", location: "", numberOfPeople: "2", notes: "", items: [] }); // Reset form
  }, [newPlan, addPlanLocal]);

  const handleInputChange = useCallback((e, formType) => {
    const { name, value } = e.target;
    if (formType === "edit" && editedPlan) {
      setEditedPlan(prev => ({ ...prev, [name]: value }));
    } else if (formType === "new") {
      setNewPlan(prev => ({ ...prev, [name]: value }));
    }
  }, [editedPlan]); // editedPlan is a dependency

  const handleSelectPlan = useCallback((plan) => {
     setCurrentPlan(plan);
     setEditMode(false); // Exit edit mode when selecting a different plan
     setEditedPlan(null);
  }, []);


  // --- Render ---
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8"> {/* Consistent padding */}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Moon size={24} className="text-[#D1B399]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Night Planner</h1>
        </div>
        <Button onClick={() => setShowAddPlan(true)} variant="primary">
          <Plus size={16} className="mr-1" /> {/* Adjusted margin */}
          New Plan
        </Button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Adjusted gap */}

        {/* Sidebar: Your Plans */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Plans</h2>
            {plans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-4">You haven't created any plans yet</p>
                <Button onClick={() => setShowAddPlan(true)} variant="primary" size="sm">
                  <Plus size={14} className="mr-1" /> {/* Adjusted size/margin */}
                  Create your first plan
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1"> {/* Added max-height and scroll */}
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full text-left p-3 rounded-lg transition-colors border ${
                      currentPlan?.id === plan.id
                        ? "bg-[#D1B399]/10 border-[#D1B399]/50"
                        : "hover:bg-gray-50 border-transparent"
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 truncate">{plan.title}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2"> {/* Use space-x */}
                       {plan.date && <span className="flex items-center"><Calendar size={12} className="mr-1 opacity-70" />{new Date(plan.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                       {plan.time && <span className="flex items-center"><Clock size={12} className="mr-1 opacity-70" />{plan.time}</span>}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                        {plan.location && <span className="flex items-center truncate"><MapPin size={12} className="mr-1 opacity-70" />{plan.location}</span>}
                        {plan.numberOfPeople && <span className="flex items-center"><Users size={12} className="mr-1 opacity-70" />{plan.numberOfPeople}{parseInt(plan.numberOfPeople) !== 1 ? ' people' : ' person'}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area: Selected Plan Details & Recommendations */}
        <div className="lg:col-span-2">
          {currentPlan ? (
            <>
            {/* Plan Details Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-6">
              {/* Card Header */}
              <div className={`px-4 py-3 sm:px-5 sm:py-4 ${editMode ? 'bg-blue-50' : 'bg-[#D1B399]'}`}>
                {editMode && editedPlan ? (
                  // Edit Mode Header
                  <div className="flex justify-between items-start">
                    <input
                      type="text"
                      name="title"
                      value={editedPlan.title}
                      onChange={(e) => handleInputChange(e, "edit")}
                      className="text-xl font-bold bg-white rounded px-2 py-1 w-full max-w-xs border border-blue-300 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2 flex-shrink-0 ml-2">
                      <Button onClick={handleSaveEdit} variant="primary" size="sm" className="!p-1.5 bg-green-600 hover:bg-green-700"> <Save size={16} /> </Button>
                      <Button onClick={handleCancelEdit} variant="tertiary" size="sm" className="!p-1.5 text-red-500 hover:bg-red-100"> <X size={16} /> </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode Header
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white truncate">{currentPlan.title}</h2>
                    <Button onClick={handleEditPlan} variant="tertiary" size="sm" className="!p-1.5 bg-white/20 hover:bg-white/30 text-white"> <Edit2 size={16} /> </Button>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5">
                {editMode && editedPlan ? (
                  // Edit Mode Form Fields
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    {/* Date */}
                    <div> <label className="block text-xs font-medium text-gray-600 mb-1">Date</label> <input type="date" name="date" value={editedPlan.date} onChange={(e) => handleInputChange(e, "edit")} className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
                    {/* Time */}
                    <div> <label className="block text-xs font-medium text-gray-600 mb-1">Time</label> <input type="time" name="time" value={editedPlan.time} onChange={(e) => handleInputChange(e, "edit")} className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
                    {/* Location */}
                    <div> <label className="block text-xs font-medium text-gray-600 mb-1">Location</label> <input type="text" name="location" value={editedPlan.location} onChange={(e) => handleInputChange(e, "edit")} placeholder="Neighborhood or area" className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
                    {/* People */}
                    <div> <label className="block text-xs font-medium text-gray-600 mb-1"># People</label> <select name="numberOfPeople" value={editedPlan.numberOfPeople} onChange={(e) => handleInputChange(e, "edit")} className="w-full p-1.5 border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-[#D1B399]"> {[...Array(10).keys()].map(i => i + 1).map(num => (<option key={num} value={num}>{num}</option>))} <option value="10+">10+</option> </select> </div>
                    {/* Notes */}
                    <div className="md:col-span-2"> <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label> <textarea name="notes" value={editedPlan.notes} onChange={(e) => handleInputChange(e, "edit")} className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" rows="2"></textarea> </div>
                  </div>
                ) : (
                  // View Mode Details
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3 text-sm text-gray-600">
                       {currentPlan.date && <div className="flex items-center"> <Calendar size={14} className="mr-1.5 text-[#D1B399]" /> {new Date(currentPlan.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} </div>}
                       {currentPlan.time && <div className="flex items-center"> <Clock size={14} className="mr-1.5 text-[#D1B399]" /> {currentPlan.time} </div>}
                       {currentPlan.location && <div className="flex items-center"> <MapPin size={14} className="mr-1.5 text-[#D1B399]" /> {currentPlan.location} </div>}
                       {currentPlan.numberOfPeople && <div className="flex items-center"> <Users size={14} className="mr-1.5 text-[#D1B399]" /> {currentPlan.numberOfPeople}{parseInt(currentPlan.numberOfPeople) !== 1 ? ' people' : ' person'} </div>}
                    </div>
                    {currentPlan.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-700">{currentPlan.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Added Places Section */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2">Added Places ({currentPlan.items.length})</h3>
                  {currentPlan.items.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-500 mb-3">No places added to this plan yet.</p>
                      <p className="text-xs text-gray-400">Check out recommendations below</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                      {currentPlan.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
                          <div>
                            <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                            <p className="text-xs text-gray-600">{item.neighborhood}, {item.city}</p>
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Array.isArray(item.tags) && item.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-1.5 py-0.5 bg-gray-200 rounded-full text-[10px] text-gray-700"> #{tag} </span>
                              ))}
                            </div>
                          </div>
                           {/* Remove Button */}
                          <Button onClick={() => handleRemovePlace(item.id)} variant="tertiary" size="sm" className="!p-1 text-red-400 hover:bg-red-50 hover:text-red-600"> <Trash size={14} /> </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Recommendations</h2>
                <Link to="/trending" className="text-[#A78B71] hover:text-[#c1a389] text-xs font-medium flex items-center"> View more </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.slice(0, 3).map((place, index) => (
                    <div key={index} className="relative">
                    {/* Assuming RestaurantCard takes these props */}
                    <RestaurantCard {...place} />
                    {/* Add Button overlay */}
                    <Button onClick={() => handleAddPlace(place)} variant="primary" size="sm" className="absolute bottom-3 right-3 z-10 !p-1.5 rounded-full shadow-md" title={`Add ${place.name} to plan`}> <Plus size={18} /> </Button>
                    </div>
                ))}
                </div>
            </div>
            </>
          ) : (
            // Placeholder when no plan is selected
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">No Plan Selected</h2>
              <p className="text-sm text-gray-500 mb-5">Select a plan from the sidebar or create a new one.</p>
              <Button onClick={() => setShowAddPlan(true)} variant="primary" size="sm"> <Plus size={14} className="mr-1" /> Create New Plan </Button>
            </div>
          )}
        </div> {/* End Main Content Area */}

      </div> {/* End Grid */}

      {/* New Plan Modal */}
      <Modal isOpen={showAddPlan} onClose={() => setShowAddPlan(false)} title="Create New Plan">
        <div className="grid grid-cols-1 gap-4 mb-5 text-sm"> {/* Adjusted styles */}
          {/* Title */}
          <div> <label className="block text-xs font-medium text-gray-600 mb-1">Title*</label> <input type="text" name="title" value={newPlan.title} onChange={(e) => handleInputChange(e, "new")} placeholder="Date Night, Birthday Dinner, etc." className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
          {/* Date */}
          <div> <label className="block text-xs font-medium text-gray-600 mb-1">Date*</label> <input type="date" name="date" value={newPlan.date} onChange={(e) => handleInputChange(e, "new")} className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
          {/* Time */}
          <div> <label className="block text-xs font-medium text-gray-600 mb-1">Time*</label> <input type="time" name="time" value={newPlan.time} onChange={(e) => handleInputChange(e, "new")} className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
           {/* Location */}
          <div> <label className="block text-xs font-medium text-gray-600 mb-1">Location</label> <input type="text" name="location" value={newPlan.location} onChange={(e) => handleInputChange(e, "new")} placeholder="Neighborhood or area" className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
           {/* People */}
          <div> <label className="block text-xs font-medium text-gray-600 mb-1"># People</label> <select name="numberOfPeople" value={newPlan.numberOfPeople} onChange={(e) => handleInputChange(e, "new")} className="w-full p-1.5 border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-[#D1B399]"> {[...Array(10).keys()].map(i => i + 1).map(num => (<option key={num} value={num}>{num}</option>))} <option value="10+">10+</option> </select> </div>
           {/* Notes */}
          <div> <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label> <textarea name="notes" value={newPlan.notes} onChange={(e) => handleInputChange(e, "new")} placeholder="Add any details or preferences..." className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" rows="3"></textarea> </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button onClick={() => setShowAddPlan(false)} variant="tertiary" size="sm"> Cancel </Button>
          <Button onClick={handleCreatePlan} variant="primary" size="sm" disabled={!newPlan.title || !newPlan.date || !newPlan.time}> Create Plan </Button>
        </div>
      </Modal>
    </div> // End Page Container
  );
};

export default NightPlanner;