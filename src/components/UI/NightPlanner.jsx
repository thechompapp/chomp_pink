import React, { useState, useEffect } from "react";
import Card from "../UI/Card";
import Button from "../UI/Button";
import { Moon, Plus, MapPin, Calendar, Clock, Users, Trash, Check, Save, Edit2, X } from "lucide-react";
import RestaurantCard from "../UI/RestaurantCard";
import { Link } from "react-router-dom";

const NightPlanner = () => {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedPlan, setEditedPlan] = useState(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    numberOfPeople: "2",
    notes: "",
    items: []
  });
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Simulate fetching plans
    const fetchPlans = async () => {
      const samplePlans = [
        {
          id: 1,
          title: "Date Night",
          date: "2025-04-15",
          time: "19:30",
          location: "Downtown",
          numberOfPeople: "2",
          notes: "Looking for a romantic dinner spot with cocktails",
          items: [
            { id: 1, name: "The Rooftop", type: "restaurant", tags: ["romantic", "cocktails"], neighborhood: "Downtown", city: "New York" }
          ]
        },
        {
          id: 2,
          title: "Birthday Dinner",
          date: "2025-05-25",
          time: "20:00",
          location: "West Village",
          numberOfPeople: "8",
          notes: "Need a place that takes reservations for groups",
          items: []
        }
      ];
      
      setPlans(samplePlans);
      if (samplePlans.length > 0) {
        setCurrentPlan(samplePlans[0]);
      }
    };
    
    // Simulate fetching recommendations
    const fetchRecommendations = async () => {
      const sampleRecommendations = [
        { name: "Lilia", neighborhood: 'Williamsburg', city: 'New York', tags: ['italian', 'pasta', 'romantic'] },
        { name: "Rolf's", neighborhood: 'Gramercy', city: 'New York', tags: ['german', 'festive', 'drinks'] },
        { name: "Buvette", neighborhood: 'West Village', city: 'New York', tags: ['french', 'cozy', 'wine'] },
        { name: "Le Bernardin", neighborhood: 'Midtown', city: 'New York', tags: ['seafood', 'fine-dining', 'special-occasion'] },
        { name: "Dante", neighborhood: 'Greenwich Village', city: 'New York', tags: ['cocktails', 'italian', 'casual'] },
        { name: "Ci Siamo", neighborhood: 'Hudson Yards', city: 'New York', tags: ['italian', 'new', 'lively'] }
      ];
      setRecommendations(sampleRecommendations);
    };
    
    fetchPlans();
    fetchRecommendations();
  }, []);

  const handleAddPlace = (place) => {
    if (!currentPlan) return;
    
    const updatedPlan = {
      ...currentPlan,
      items: [...currentPlan.items, { ...place, id: Date.now() }]
    };
    
    setCurrentPlan(updatedPlan);
    setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
  };

  const handleRemovePlace = (placeId) => {
    if (!currentPlan) return;
    
    const updatedPlan = {
      ...currentPlan,
      items: currentPlan.items.filter(item => item.id !== placeId)
    };
    
    setCurrentPlan(updatedPlan);
    setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
  };

  const handleEditPlan = () => {
    setEditMode(true);
    setEditedPlan({...currentPlan});
  };

  const handleSaveEdit = () => {
    if (!editedPlan) return;
    
    setCurrentPlan(editedPlan);
    setPlans(plans.map(p => p.id === editedPlan.id ? editedPlan : p));
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedPlan(null);
  };

  const handleCreatePlan = () => {
    const createdPlan = {
      ...newPlan,
      id: Date.now(),
      items: []
    };
    
    setPlans([...plans, createdPlan]);
    setCurrentPlan(createdPlan);
    setShowAddPlan(false);
    setNewPlan({
      title: "",
      date: "",
      time: "",
      location: "",
      numberOfPeople: "2",
      notes: "",
      items: []
    });
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    
    if (formType === 'edit') {
      setEditedPlan({
        ...editedPlan,
        [name]: value
      });
    } else if (formType === 'new') {
      setNewPlan({
        ...newPlan,
        [name]: value
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Moon size={24} className="text-purple-500" />
          <h1 className="text-3xl font-bold text-gray-800">Night Planner</h1>
        </div>
        <Button 
          onClick={() => setShowAddPlan(true)}
          variant="primary"
        >
          <Plus size={16} className="mr-2" />
          New Plan
        </Button>
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left sidebar - Plans */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Your Plans</h2>
            
            {plans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't created any plans yet</p>
                <Button onClick={() => setShowAddPlan(true)} variant="primary" size="sm">
                  <Plus size={16} className="mr-1" />
                  Create your first plan
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => {
                      setCurrentPlan(plan);
                      setEditMode(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentPlan?.id === plan.id
                        ? 'bg-purple-50 border border-purple-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900">{plan.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar size={14} className="mr-1" />
                      {new Date(plan.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      <span className="mx-1">•</span>
                      <Clock size={14} className="mr-1" />
                      {plan.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin size={14} className="mr-1" />
                      {plan.location}
                      <span className="mx-1">•</span>
                      <Users size={14} className="mr-1" />
                      {plan.numberOfPeople} {parseInt(plan.numberOfPeople) === 1 ? 'person' : 'people'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Center - Current Plan */}
        <div className="lg:col-span-2">
          {currentPlan ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Plan header */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                {editMode ? (
                  <div className="flex justify-between items-start">
                    <input
                      type="text"
                      name="title"
                      value={editedPlan.title}
                      onChange={(e) => handleInputChange(e, 'edit')}
                      className="text-xl font-bold bg-white rounded px-2 py-1 w-full max-w-xs"
                    />
                    <div className="flex space-x-2">
                      <button onClick={handleSaveEdit} className="p-1 bg-white rounded-full text-green-500">
                        <Save size={18} />
                      </button>
                      <button onClick={handleCancelEdit} className="p-1 bg-white rounded-full text-red-500">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">{currentPlan.title}</h2>
                    <button onClick={handleEditPlan} className="p-1 bg-white/20 hover:bg-white/30 rounded-full text-white">
                      <Edit2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Plan details */}
              <div className="p-6">
                {editMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        name="date"
                        value={editedPlan.date}
                        onChange={(e) => handleInputChange(e, 'edit')}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="time"
                        name="time"
                        value={editedPlan.time}
                        onChange={(e) => handleInputChange(e, 'edit')}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={editedPlan.location}
                        onChange={(e) => handleInputChange(e, 'edit')}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                      <select
                        name="numberOfPeople"
                        value={editedPlan.numberOfPeople}
                        onChange={(e) => handleInputChange(e, 'edit')}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                        <option value="10+">10+</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={editedPlan.notes}
                        onChange={(e) => handleInputChange(e, 'edit')}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar size={18} className="mr-2 text-purple-500" />
                        {new Date(currentPlan.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock size={18} className="mr-2 text-purple-500" />
                        {currentPlan.time}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin size={18} className="mr-2 text-purple-500" />
                        {currentPlan.location}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users size={18} className="mr-2 text-purple-500" />
                        {currentPlan.numberOfPeople} {parseInt(currentPlan.numberOfPeople) === 1 ? 'person' : 'people'}
                      </div>
                    </div>
                    
                    {currentPlan.notes && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">{currentPlan.notes}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Places in this plan */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Added Places</h3>
                  
                  {currentPlan.items.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-gray-500 mb-4">No places added to this plan yet</p>
                      <p className="text-sm text-gray-500">Check out our recommendations below</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentPlan.items.map(item => (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600">{item.neighborhood}, {item.city}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.tags && item.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-700">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleRemovePlace(item.id)}
                            variant="tertiary"
                            size="sm"
                            className="text-red-500 hover:bg-red-50"
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">No Plan Selected</h2>
              <p className="text-gray-500 mb-6">Select a plan from the sidebar or create a new one</p>
              <Button onClick={() => setShowAddPlan(true)} variant="primary">
                <Plus size={16} className="mr-2" />
                Create New Plan
              </Button>
            </div>
          )}
          
          {/* Recommendations */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recommendations</h2>
              <Link to="/trending" className="text-purple-500 hover:text-purple-700 text-sm font-medium flex items-center">
                View more
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 3).map((place, index) => (
                <div key={index} className="relative">
                  <RestaurantCard {...place} />
                  {currentPlan && (
                    <button
                      onClick={() => handleAddPlace(place)}
                      className="absolute bottom-4 right-4 z-10 bg-purple-500 hover:bg-purple-600 text-white p-1 rounded-full shadow-md transition-colors"
                      title="Add to plan"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Create new plan modal */}
      {showAddPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Create New Plan</h2>
              <button onClick={() => setShowAddPlan(false)} className="text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={newPlan.title}
                    onChange={(e) => handleInputChange(e, 'new')}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Date Night, Birthday Dinner, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={newPlan.date}
                    onChange={(e) => handleInputChange(e, 'new')}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={newPlan.time}
                    onChange={(e) => handleInputChange(e, 'new')}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={newPlan.location}
                    onChange={(e) => handleInputChange(e, 'new')}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Neighborhood or area"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                  <select
                    name="numberOfPeople"
                    value={newPlan.numberOfPeople}
                    onChange={(e) => handleInputChange(e, 'new')}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                    <option value="10+">10+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={newPlan.notes}
                    onChange={(e) => handleInputChange(e, 'new')}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows="3"
                    placeholder="Add any details or preferences..."
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setShowAddPlan(false)} variant="tertiary">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePlan} 
                  variant="primary"
                  disabled={!newPlan.title || !newPlan.date || !newPlan.time}
                >
                  Create Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NightPlanner;