import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import QuickCreateForm from '../components/QuickCreateForm';
import Navbar from '../components/Navbar'; // Ensure Navbar is imported

// Reusable Draggable List Item Component
const DraggableListItem = ({
  item,
  index,
  moveItem,
  getDetailPageUrl,
  handleQuickAdd,
  isOwnedByUser,
  handleRemove,
  editMode,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'LIST_DETAIL_ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: () => isOwnedByUser && editMode,
  });

  const [, drop] = useDrop({
    accept: 'LIST_DETAIL_ITEM',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const [isDeleting, setIsDeleting] = useState(false);

  const handleSwipeDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      handleRemove(index);
    }, 300); // Delay to allow animation
  };

  return (
    <li
      ref={(node) => {
        if (isOwnedByUser && editMode) drag(drop(node));
      }}
      className={`relative hover:bg-gray-50 transition-transform ${
        isDragging ? 'opacity-50 bg-pink-50' : ''
      } ${isDeleting ? 'translate-x-[-100%] opacity-0' : ''}`}
    >
      <div
        className="block px-4 py-3 flex items-center justify-between"
        onClick={(e) => {
          if (isOwnedByUser && editMode) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div className="flex items-center">
          {isOwnedByUser && editMode && (
            <div className="mr-3 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 cursor-move"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                />
              </svg>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">
              {index + 1}. {item.name}
            </p>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              <span>{item.type}</span>
              {item.neighborhood && (
                <>
                  <span className="mx-1">•</span>
                  <span>{item.neighborhood}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              alert(`Map view for ${item.name}`);
            }}
            className="text-gray-400 hover:text-blue-500"
            aria-label="Map It"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 12 6 12s6-6.75 6-12c0-3.314-2.686-6-6-6z"
              />
              <circle cx="12" cy="8" r="3" />
            </svg>
          </button>
          {!isOwnedByUser && (
            <button
              onClick={(e) => handleQuickAdd(e, item.id)}
              className="text-pink-500 hover:text-pink-700 text-lg font-medium"
            >
              +
            </button>
          )}
        </div>
      </div>
    </li>
  );
};

// Reusable Sort Button Component
const SortButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`py-1 px-2 text-xs font-medium rounded-md border ${
      active
        ? 'bg-pink-50 border-pink-500 text-pink-500'
        : 'border-gray-300 text-gray-600'
    }`}
  >
    {label}
  </button>
);

const ListDetail = () => {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [sortOrder, setSortOrder] = useState('default');
  const [editMode, setEditMode] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [listTitle, setListTitle] = useState('Best Italian Spots in NYC');

  const list = {
    id,
    title: 'Best Italian Spots in NYC',
    author: '@pastafan',
    followers: 423,
    isOwnedByUser: true,
  };

  useEffect(() => {
    // Simulate API fetch
    const fetchedItems = [
      { id: 1, name: 'Via Carota', type: 'Restaurant', neighborhood: 'West Village', distance: 1.2 },
      { id: 2, name: 'Lilia', type: 'Restaurant', neighborhood: 'Williamsburg', distance: 3.5 },
      { id: 3, name: 'Rezdôra', type: 'Restaurant', neighborhood: 'Flatiron', distance: 2.1 },
    ];
    setItems(fetchedItems);
    setOriginalItems(fetchedItems);
  }, [id]);

  const handleSort = useCallback(
    (order) => {
      setSortOrder(order);
      if (order === 'default') {
        setItems([...originalItems]);
        return;
      }
      const sortedItems = [...items];
      sortedItems.sort((a, b) =>
        order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      );
      setItems(sortedItems);
    },
    [items, originalItems]
  );

  const handleSortByDistance = useCallback(() => {
    const sortedItems = [...items].sort((a, b) => a.distance - b.distance);
    setItems(sortedItems);
    setSortOrder('distance');
  }, [items]);

  const moveItem = useCallback(
    (fromIndex, toIndex) => {
      const updatedItems = [...items];
      const [movedItem] = updatedItems.splice(fromIndex, 1);
      updatedItems.splice(toIndex, 0, movedItem);
      setItems(updatedItems);
    },
    [items]
  );

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  const togglePublic = useCallback(() => {
    setIsPublic((prev) => !prev);
  }, []);

  const openQuickCreate = useCallback(() => {
    setShowQuickCreate(true);
  }, []);

  const closeQuickCreate = useCallback(() => {
    setShowQuickCreate(false);
  }, []);

  const handleRemove = useCallback(
    (index) => {
      const updatedItems = [...items];
      updatedItems.splice(index, 1);
      setItems(updatedItems);
    },
    [items]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-20"> {/* Added pt-20 for navbar spacing */}
        {/* Updated List Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                My Favorite Pasta Spots
              </h1>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Restaurant List
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isPublic 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
            {list.isOwnedByUser && (
              <button
                onClick={togglePublic}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPublic ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Rest of the component remains the same */}
        {/* Sort and Edit Controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <SortButton
              label="A-Z"
              active={sortOrder === 'asc'}
              onClick={() => handleSort('asc')}
            />
            <SortButton
              label="Z-A"
              active={sortOrder === 'desc'}
              onClick={() => handleSort('desc')}
            />
            <SortButton
              label="Default"
              active={sortOrder === 'default'}
              onClick={() => handleSort('default')}
            />
            <SortButton
              label="Distance"
              active={sortOrder === 'distance'}
              onClick={handleSortByDistance}
            />
          </div>
          {list.isOwnedByUser && (
            <button
              onClick={toggleEditMode}
              className={`py-1 px-2 text-xs font-medium rounded-md ${
                editMode ? 'bg-pink-500 text-white' : 'border border-pink-500 text-pink-500'
              }`}
            >
              {editMode ? 'Done' : 'Edit'}
            </button>
          )}
        </div>

        {/* Updated List Items - Removed "known for" snippet */}
        <ul className="divide-y divide-gray-200">
          {items.map((item, index) => (
            <DraggableListItem
              key={item.id}
              item={item}
              index={index}
              moveItem={moveItem}
              getDetailPageUrl={(item) => `/restaurant/${item.id}`}
              handleQuickAdd={() => {}}
              isOwnedByUser={list.isOwnedByUser}
              handleRemove={handleRemove}
              editMode={editMode}
            />
          ))}
        </ul>

        {/* Quick Add Button */}
        <button
          onClick={openQuickCreate}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
          aria-label="Quick Add"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {showQuickCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="relative w-full max-w-md my-8">
              <QuickCreateForm onClose={closeQuickCreate} initialType="list" />
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default ListDetail;
