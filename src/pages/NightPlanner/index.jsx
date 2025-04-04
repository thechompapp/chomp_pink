// src/pages/NightPlanner/index.jsx
// UPDATE: Remove useAppStore, use local state for plans temporarily.
// TODO: Create a dedicated usePlannerStore for managing 'plans' state globally.
import React, { useState, useEffect, useCallback } from "react";
import { Moon, Plus, MapPin, Calendar, Clock, Users, Trash, Check, Save, Edit2, X } from "lucide-react";
import RestaurantCard from "@/components/UI/RestaurantCard";
import { Link } from "react-router-dom";
import Button from "@/components/Button";
import Modal from "@/components/UI/Modal";

// Removed samplePlansData and sampleRecommendationsData variables

const NightPlanner = () => {
  // ** FIX: Use local state for plans as useAppStore is removed **
  // ** NOTE: This state is local and won't persist or be shared. **
  // ** TODO: Replace with state and actions from a dedicated usePlannerStore. **
  const [plans, setPlans] = useState([]); // Initialize as empty
  const [recommendations, setRecommendations] = useState([]); // Keep local for now, init empty

  // Local UI state
  const [currentPlan, setCurrentPlan] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedPlan, setEditedPlan] = useState(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: "", date: "", time: "", location: "", numberOfPeople: "2", notes: "", items: [],
  });

  // --- Actions using Local State (TODO: Replace with store actions) ---
  const addPlanLocal = useCallback((planToAdd) => {
    setPlans(prev => [...prev, { ...planToAdd, id: Date.now() }]);
  }, []);

  const updatePlanLocal = useCallback((planId, updatedData) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updatedData } : p));
    if (currentPlan?.id === planId) {
        setCurrentPlan(prev => ({...prev, ...updatedData}));
    }
  }, [currentPlan?.id]);

  // --- Effects ---
  // Removed useEffect that loaded sample data

  // --- Handlers ---
  const handleAddPlace = useCallback((place) => {
    if (!currentPlan) return;
    const newItem = { ...place, id: Date.now() + Math.random() };
    const updatedPlanData = {
      ...currentPlan,
      items: [...currentPlan.items, newItem],
    };
    updatePlanLocal(currentPlan.id, updatedPlanData);
  }, [currentPlan, updatePlanLocal]);

  const handleRemovePlace = useCallback((placeId) => {
    if (!currentPlan) return;
    const updatedPlanData = {
      ...currentPlan,
      items: currentPlan.items.filter((item) => item.id !== placeId),
    };
    updatePlanLocal(currentPlan.id, updatedPlanData);
  }, [currentPlan, updatePlanLocal]);

  const handleEditPlan = useCallback(() => {
    if (!currentPlan) return;
    setEditMode(true);
    setEditedPlan({ ...currentPlan });
  }, [currentPlan]);

  const handleSaveEdit = useCallback(() => {
    if (!editedPlan) return;
    updatePlanLocal(editedPlan.id, editedPlan);
    setEditMode(false);
    setEditedPlan(null);
  }, [editedPlan, updatePlanLocal]);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setEditedPlan(null);
  }, []);

  const handleCreatePlan = useCallback(() => {
    addPlanLocal(newPlan);
    // This timeout logic to select the new plan is brittle, ideally find by ID after store integration
    setTimeout(() => {
        setPlans(prevPlans => {
            if (prevPlans.length > 0) setCurrentPlan(prevPlans[prevPlans.length - 1]);
            return prevPlans;
        })
    }, 10);
    setShowAddPlan(false);
    setNewPlan({ title: "", date: "", time: "", location: "", numberOfPeople: "2", notes: "", items: [] });
  }, [newPlan, addPlanLocal]);

  const handleInputChange = useCallback((e, formType) => {
    const { name, value } = e.target;
    if (formType === "edit" && editedPlan) {
      setEditedPlan(prev => ({ ...prev, [name]: value }));
    } else if (formType === "new") {
      setNewPlan(prev => ({ ...prev, [name]: value }));
    }
  }, [editedPlan]);

  const handleSelectPlan = useCallback((plan) => {
     setCurrentPlan(plan);
     setEditMode(false);
     setEditedPlan(null);
  }, []);

  // --- Render ---
  // NOTE: Recommendations section will be empty as sample data was removed.
  // Needs integration with actual recommendation fetching logic.
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Moon size={24} className="text-[#D1B399]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Night Planner</h1>
        </div>
        <Button onClick={() => setShowAddPlan(true)} variant="primary">
          <Plus size={16} className="mr-1" />
          New Plan
        </Button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sidebar: Your Plans */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Plans</h2>
            {plans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-4">You haven't created any plans yet</p>
                <Button onClick={() => setShowAddPlan(true)} variant="primary" size="sm">
                  <Plus size={14} className="mr-1" />
                  Create your first plan
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
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
                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
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
                  <div className="flex justify-between items-start">
                    <input
                      type="text" name="title" value={editedPlan.title} onChange={(e) => handleInputChange(e, "edit")}
                      className="text-xl font-bold bg-white rounded px-2 py-1 w-full max-w-xs border border-blue-300 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2 flex-shrink-0 ml-2">
                      <Button onClick={handleSaveEdit} variant="primary" size="sm" className="!p-1.5 bg-green-600 hover:bg-green-700"> <Save size={16} /> </Button>
                      <Button onClick={handleCancelEdit} variant="tertiary" size="sm" className="!p-1.5 text-red-500 hover:bg-red-100"> <X size={16} /> </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white truncate">{currentPlan.title}</h2>
                    <Button onClick={handleEditPlan} variant="tertiary" size="sm" className="!p-1.5 bg-white/20 hover:bg-white/30 text-white"> <Edit2 size={16} /> </Button>
                  </div>
                )}
              </div>
              {/* Card Body */}
              <div className="p-4 sm:p-5">
                {editMode && editedPlan ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div> <label className="block text-xs font-medium text-gray-600 mb-1">Date</label> <input type="date" name="date" value={editedPlan.date} onChange={(e) => handleInputChange(e, "edit")} className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
                    <div> <label className="block text-xs font-medium text-gray-600 mb-1">Time</label> <input type="time" name="time" value={editedPlan.time} onChange={(e) => handleInputChange(e, "edit")} className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
                    <div> <label className="block text-xs font-medium text-gray-600 mb-1">Location</label> <input type="text" name="location" value={editedPlan.location} onChange={(e) => handleInputChange(e, "edit")} placeholder="Neighborhood or area" className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
                    <div> <label className="block text-xs font-medium text-gray-600 mb-1"># People</label> <select name="numberOfPeople" value={editedPlan.numberOfPeople} onChange={(e) => handleInputChange(e, "edit")} className="w-full p-1.5 border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-[#D1B399]"> {[...Array(10).keys()].map(i => i + 1).map(num => (<option key={num} value={num}>{num}</option>))} <option value="10+">10+</option> </select> </div>
                    <div className="md:col-span-2"> <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label> <textarea name="notes" value={editedPlan.notes} onChange={(e) => handleInputChange(e, "edit")} className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" rows="2"></textarea> </div>
                  </div>
                ) : (
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
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Array.isArray(item.tags) && item.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-1.5 py-0.5 bg-gray-200 rounded-full text-[10px] text-gray-700"> #{tag} </span>
                              ))}
                            </div>
                          </div>
                          <Button onClick={() => handleRemovePlace(item.id)} variant="tertiary" size="sm" className="!p-1 text-red-400 hover:bg-red-50 hover:text-red-600"> <Trash size={14} /> </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations Section - Will be empty until integrated */}
            <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">Recommendations</h2>
                  <Link to="/trending" className="text-[#A78B71] hover:text-[#c1a389] text-xs font-medium flex items-center"> View more </Link>
                </div>
                {recommendations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.slice(0, 3).map((place, index) => (
                            <div key={index} className="relative">
                                <RestaurantCard {...place} />
                                <Button onClick={() => handleAddPlace(place)} variant="primary" size="sm" className="absolute bottom-3 right-3 z-10 !p-1.5 rounded-full shadow-md" title={`Add ${place.name} to plan`}> <Plus size={18} /> </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 px-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500">Recommendation service not available.</p>
                        {/* TODO: Add logic to fetch actual recommendations */}
                    </div>
                )}
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
        <div className="grid grid-cols-1 gap-4 mb-5 text-sm">
          <div> <label className="block text-xs font-medium text-gray-600 mb-1">Title*</label> <input type="text" name="title" value={newPlan.title} onChange={(e) => handleInputChange(e, "new")} placeholder="Date Night, Birthday Dinner, etc." className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
          <div> <label className="block text-xs font-medium text-gray-600 mb-1">Date*</label> <input type="date" name="date" value={newPlan.date} onChange={(e) => handleInputChange(e, "new")} className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
          <div> <label className="block text-xs font-medium text-gray-600 mb-1">Time*</label> <input type="time" name="time" value={newPlan.time} onChange={(e) => handleInputChange(e, "new")} className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
           <div> <label className="block text-xs font-medium text-gray-600 mb-1">Location</label> <input type="text" name="location" value={newPlan.location} onChange={(e) => handleInputChange(e, "new")} placeholder="Neighborhood or area" className="w-full p-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399]" /> </div>
           <div> <label className="block text-xs font-medium text-gray-600 mb-1"># People</label> <select name="numberOfPeople" value={newPlan.numberOfPeople} onChange={(e) => handleInputChange(e, "new")} className="w-full p-1.5 border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-[#D1B399]"> {[...Array(10).keys()].map(i => i + 1).map(num => (<option key={num} value={num}>{num}</option>))} <option value="10+">10+</option> </select> </div>
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