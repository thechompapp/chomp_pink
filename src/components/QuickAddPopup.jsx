import React, { useEffect, useState } from 'react';
import { useQuickAdd } from '../context/QuickAddContext'; // Named export
import useUserListStore from '../stores/useUserListStore'; // Default export
import useAuthStore from '../stores/useAuthStore'; // Default export
import Modal from './UI/Modal'; // Default export
import Button from './Button'; // Default export
import { Link } from 'react-router-dom'; // Named export

const QuickAddPopup = () => {
  const { isOpen, item, closeQuickAdd } = useQuickAdd();
  const { userLists, fetchUserLists, loading: loadingUser, errorUser } = useUserListStore();
  const { isAuthenticated } = useAuthStore();
  const [selectedList, setSelectedList] = useState(null);

  useEffect(() => {
    console.log('[QuickAddPopup useEffect] Checking conditions: ', {
      isOpen,
      isAuthenticated,
      loadingUser,
      userListsLength: userLists.length,
      errorUser,
    });
    if (isOpen && isAuthenticated && !loadingUser && !userLists.length && !errorUser) {
      console.log('[QuickAddPopup useEffect] Triggering fetchUserLists...');
      fetchUserLists();
    }
  }, [isOpen, isAuthenticated, loadingUser, userLists.length, errorUser, fetchUserLists]);

  const handleAddToList = async () => {
    if (!selectedList || !item) return;
    try {
      await useUserListStore.getState().addToList({ item, listId: selectedList });
      closeQuickAdd();
    } catch (err) {
      console.error('Failed to add item to list:', err);
    }
  };

  if (!isOpen || !item) return null;

  const title = `Add "${item.name}" to...`;

  return (
    <Modal isOpen={isOpen} onClose={closeQuickAdd} title={title}>
      <div className="p-4">
        {!isAuthenticated ? (
          <p className="text-gray-600">
            Please{' '}
            <Link to="/login" className="text-blue-600 hover:underline" onClick={closeQuickAdd}>
              log in
            </Link>{' '}
            to add items to your lists.
          </p>
        ) : (
          <>
            {loadingUser && <p className="text-gray-600">Loading your lists...</p>}
            {errorUser && <p className="text-red-500">Error: {errorUser}</p>}
            {!loadingUser && !errorUser && userLists.length === 0 && (
              <p className="text-gray-600">No lists found. Create one first!</p>
            )}
            {!loadingUser && !errorUser && userLists.length > 0 && (
              <ul className="space-y-2">
                {userLists.map((list) => (
                  <li key={list.id}>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="list"
                        value={list.id}
                        checked={selectedList === list.id}
                        onChange={() => setSelectedList(list.id)}
                        className="form-radio text-blue-600"
                      />
                      <span className="text-gray-800">{list.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <div className="mt-4 flex justify-end space-x-2">
          <Button onClick={closeQuickAdd} variant="secondary">
            Cancel
          </Button>
          {isAuthenticated && (
            <Button onClick={handleAddToList} disabled={!selectedList || loadingUser}>
              Add to List
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default QuickAddPopup;