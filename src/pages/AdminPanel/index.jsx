import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
import Button from "@/components/Button";
import { ChevronDown, ChevronUp, Edit, Trash } from "lucide-react";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("restaurants");
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [lists, setLists] = useState([]);
  const [sort, setSort] = useState("name_asc");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async (type) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/${type}?sort=${sort}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}`);
      }
      const data = await response.json();
      if (type === "restaurants") setRestaurants(data);
      if (type === "dishes") setDishes(data);
      if (type === "lists") setLists(data);
    } catch (err) {
      setError(`Error fetching ${type}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, sort]);

  const handleSort = (newSort) => {
    setSort(newSort);
  };

  const handleEdit = (item, type) => {
    setEditingItem({ ...item, type });
  };

  const handleSave = async () => {
    if (!editingItem) return;
    const { id, type, ...updates } = editingItem;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error(`Failed to update ${type}`);
      }
      const updatedItem = await response.json();
      if (type === "restaurants") {
        setRestaurants(restaurants.map(item => item.id === id ? updatedItem : item));
      } else if (type === "dishes") {
        setDishes(dishes.map(item => item.id === id ? updatedItem : item));
      } else if (type === "lists") {
        setLists(lists.map(item => item.id === id ? updatedItem : item));
      }
      setEditingItem(null);
    } catch (err) {
      setError(`Error updating ${type}: ${err.message}`);
    }
  };

  const handleDelete = async (id, type) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/${type}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete ${type}`);
      }
      if (type === "restaurants") {
        setRestaurants(restaurants.filter(item => item.id !== id));
      } else if (type === "dishes") {
        setDishes(dishes.filter(item => item.id !== id));
      } else if (type === "lists") {
        setLists(lists.filter(item => item.id !== id));
      }
    } catch (err) {
      setError(`Error deleting ${type}: ${err.message}`);
    }
  };

  const renderTable = (items, type) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b">
              Name
              <button onClick={() => handleSort(sort === "name_asc" ? "name_desc" : "name_asc")} className="ml-2">
                {sort === "name_asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </th>
            {type === "restaurants" && (
              <>
                <th className="px-4 py-2 border-b">Neighborhood</th>
                <th className="px-4 py-2 border-b">City</th>
              </>
            )}
            {type === "dishes" && <th className="px-4 py-2 border-b">Restaurant</th>}
            <th className="px-4 py-2 border-b">Tags</th>
            <th className="px-4 py-2 border-b">Adds/Saves</th>
            <th className="px-4 py-2 border-b">
              Created At
              <button onClick={() => handleSort(sort === "date_asc" ? "date_desc" : "date_asc")} className="ml-2">
                {sort === "date_asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </th>
            <th className="px-4 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td className="px-4 py-2 border-b">
                {editingItem?.id === item.id && editingItem?.type === type ? (
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="border rounded px-2 py-1"
                  />
                ) : (
                  item.name
                )}
              </td>
              {type === "restaurants" && (
                <>
                  <td className="px-4 py-2 border-b">
                    {editingItem?.id === item.id && editingItem?.type === type ? (
                      <input
                        type="text"
                        value={editingItem.neighborhood}
                        onChange={(e) => setEditingItem({ ...editingItem, neighborhood: e.target.value })}
                        className="border rounded px-2 py-1"
                      />
                    ) : (
                      item.neighborhood
                    )}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {editingItem?.id === item.id && editingItem?.type === type ? (
                      <input
                        type="text"
                        value={editingItem.city}
                        onChange={(e) => setEditingItem({ ...editingItem, city: e.target.value })}
                        className="border rounded px-2 py-1"
                      />
                    ) : (
                      item.city
                    )}
                  </td>
                </>
              )}
              {type === "dishes" && <td className="px-4 py-2 border-b">{item.restaurant}</td>}
              <td className="px-4 py-2 border-b">
                {editingItem?.id === item.id && editingItem?.type === type ? (
                  <input
                    type="text"
                    value={editingItem.tags.join(", ")}
                    onChange={(e) => setEditingItem({ ...editingItem, tags: e.target.value.split(", ").map(tag => tag.trim()) })}
                    className="border rounded px-2 py-1"
                  />
                ) : (
                  item.tags?.join(", ") || "None"
                )}
              </td>
              <td className="px-4 py-2 border-b">
                {editingItem?.id === item.id && editingItem?.type === type ? (
                  <input
                    type="number"
                    value={editingItem.adds || editingItem.saved_count}
                    onChange={(e) => setEditingItem({ ...editingItem, [type === "lists" ? "saved_count" : "adds"]: parseInt(e.target.value) })}
                    className="border rounded px-2 py-1"
                  />
                ) : (
                  type === "lists" ? item.saved_count : item.adds
                )}
              </td>
              <td className="px-4 py-2 border-b">{new Date(item.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-2 border-b flex space-x-2">
                {editingItem?.id === item.id && editingItem?.type === type ? (
                  <>
                    <Button onClick={handleSave} variant="primary" size="sm">Save</Button>
                    <Button onClick={() => setEditingItem(null)} variant="tertiary" size="sm">Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => handleEdit(item, type)} variant="tertiary" size="sm">
                      <Edit size={16} />
                    </Button>
                    <Button onClick={() => handleDelete(item.id, type)} variant="tertiary" size="sm" className="text-red-500">
                      <Trash size={16} />
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("restaurants")}
          className={`py-2 px-4 font-medium ${
            activeTab === "restaurants"
              ? "border-b-2 border-[#D1B399] text-[#D1B399]"
              : "text-gray-500 hover:text-[#D1B399]"
          }`}
        >
          Restaurants
        </button>
        <button
          onClick={() => setActiveTab("dishes")}
          className={`py-2 px-4 font-medium ${
            activeTab === "dishes"
              ? "border-b-2 border-[#D1B399] text-[#D1B399]"
              : "text-gray-500 hover:text-[#D1B399]"
          }`}
        >
          Dishes
        </button>
        <button
          onClick={() => setActiveTab("lists")}
          className={`py-2 px-4 font-medium ${
            activeTab === "lists"
              ? "border-b-2 border-[#D1B399] text-[#D1B399]"
              : "text-gray-500 hover:text-[#D1B399]"
          }`}
        >
          Lists
        </button>
      </div>

      {isLoading && <div className="text-center py-10 text-gray-500">Loading...</div>}
      {error && (
        <div className="text-center py-10">
          <p className="text-red-500 mb-4">{error}</p>
          <Button
            onClick={() => fetchData(activeTab)}
            variant="primary"
            className="px-4 py-2"
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {activeTab === "restaurants" && renderTable(restaurants, "restaurants")}
          {activeTab === "dishes" && renderTable(dishes, "dishes")}
          {activeTab === "lists" && renderTable(lists, "lists")}
        </>
      )}
    </div>
  );
};

export default AdminPanel;