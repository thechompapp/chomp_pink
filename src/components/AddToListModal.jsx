// src/components/AddToListModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Corrected Heroicons import: Removed XIcon as it's not used directly here and caused an error.
// XMarkIcon would be the correct name if an X icon from Heroicons was needed.
import { PlusIcon as PlusHeroIcon, CheckCircleIcon as CheckCircleHeroIcon } from '@heroicons/react/24/outline'; 
import { ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react'; 
import { listService } from '@/services/listService';
import useAuthStore from '@/stores/useAuthStore';
import { logError, logDebug, logInfo } from '@/utils/logger.js';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Label from '@/components/UI/Label';

const AddToListModal = ({ isOpen, onClose, itemToAdd, onItemAdded }) => {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListId, setSelectedListId] = useState(null);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [step, setStep] = useState(1); // 1: Select/Create List, 2: Confirmation

  const { data: userListsData, isLoading: isLoadingUserLists } = useQuery({
    queryKey: ['userLists', user?.id],
    queryFn: () => listService.getUserLists(user?.id), 
    enabled: isAuthenticated && !!user?.id && isOpen,
    staleTime: 5 * 60 * 1000,
    select: (data) => data?.data || [],
  });

  const userLists = useMemo(() => userListsData || [], [userListsData]);

  const filteredLists = useMemo(() => {
    if (!searchTerm) return userLists;
    return userLists.filter((list) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userLists, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedListId(null);
      setShowNewListForm(false);
      setNewListName('');
      setNewListDescription('');
      setItemNotes('');
      setStep(1);
      logDebug("[AddToListModal] Modal opened and state reset.");
    }
  }, [isOpen]);

  const createListMutation = useMutation({
    mutationFn: (newListData) => listService.createList(newListData),
    onSuccess: (data) => {
      logInfo('New list created:', data);
      queryClient.invalidateQueries({ queryKey: ['userLists', user?.id] });
      const newList = data?.data;
      if (newList && newList.id) {
        setSelectedListId(newList.id);
        setShowNewListForm(false);
        logDebug(`New list "${newList.name}" selected (ID: ${newList.id}).`);
        if (itemToAdd) {
           handleAddItemToList(newList.id); 
        } else {
            setStep(2); 
        }
      }
    },
    onError: (error) => {
      logError('Error creating new list:', error);
      alert(`Error creating list: ${error.message || 'Unknown error'}`);
    },
  });

  const addItemToListMutation = useMutation({
    mutationFn: ({ listId, itemType, itemId, notes }) => {
      if (!itemToAdd) {
        logError("addItemToListMutation: itemToAdd is not defined");
        throw new Error("Item to add is not defined");
      }
      logDebug(`Adding item to list. ListID: ${listId}, ItemType: ${itemType}, ItemID: ${itemId}, Notes: ${notes}`);
      return listService.addItemToList(listId, itemType, itemId, { notes });
    },
    onSuccess: (data, variables) => {
      logInfo('Item added to list successfully:', data);
      localStorage.setItem('recent_list_operation', Date.now().toString());

      queryClient.invalidateQueries({ queryKey: ['listDetails', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['listItems', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['listPreviewItems', variables.listId] });
      
      queryClient.invalidateQueries({ queryKey: ['userLists', user?.id], exact: false });
      queryClient.invalidateQueries({ queryKey: ['lists'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['searchResults'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['homeFeed'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['results'], exact: false }); 

      queryClient.refetchQueries({ queryKey: ['listDetails', variables.listId], exact: true });
      queryClient.refetchQueries({ queryKey: ['userLists', user?.id], exact: true });

      window.dispatchEvent(new CustomEvent('listItemAdded', { 
        detail: { listId: variables.listId, itemId: variables.itemId }
      }));
      
      setStep(2); 
      if (onItemAdded) {
        onItemAdded(variables.listId, data?.data?.list_item_id);
      }
    },
    onError: (error) => {
      logError('Error adding item to list:', error);
      alert(`Error: ${error.response?.data?.message || error.message || 'Could not add item to list.'}`);
    },
  });

  const handleCreateList = () => {
    if (!newListName.trim()) {
      alert('Please enter a name for your new list.');
      return;
    }
    logDebug(`Attempting to create list: ${newListName}`);
    createListMutation.mutate({
      name: newListName,
      description: newListDescription,
      is_public: true, 
      list_type: itemToAdd?.type === 'restaurant' ? 'restaurants' : itemToAdd?.type === 'dish' ? 'dishes' : 'mixed',
    });
  };
  
  const handleAddItemToList = (listIdToUse) => {
    const listId = listIdToUse || selectedListId;
    if (!listId || !itemToAdd) {
      alert('Please select a list and ensure an item is available to add.');
      logError("handleAddItemToList: ListId or itemToAdd missing.", { listId, itemToAddPresent: !!itemToAdd });
      return;
    }
    addItemToListMutation.mutate({
      listId,
      itemType: itemToAdd.type,
      itemId: itemToAdd.id,
      notes: itemNotes,
    });
  };

  const selectedListData = useMemo(() => {
    if (!selectedListId) return null;
    return userLists.find(list => list.id === selectedListId);
  }, [selectedListId, userLists]);

  if (!isOpen) return null; 

  if (!isAuthenticated) {
      return (
          <Modal isOpen={isOpen} onClose={onClose} title="Authentication Required">
              <div className="p-4 text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-gray-600">Please log in to add items to your lists or create new lists.</p>
                  <Button onClick={onClose} variant="primary" className="mt-6">
                      Close
                  </Button>
              </div>
          </Modal>
      );
  }

  const renderStepOne = () => (
    <>
      <div className="mb-4">
        <Label htmlFor="list-search">Search your lists or create new</Label>
        <Input
          id="list-search"
          type="text"
          placeholder="Type to search lists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {isLoadingUserLists && <p className="text-sm text-gray-500 py-4 text-center">Loading your lists...</p>}

      {!isLoadingUserLists && !showNewListForm && (
        <div className="max-h-60 overflow-y-auto mb-4 border rounded-md shadow-sm">
          {filteredLists.length > 0 ? (
            filteredLists.map((list) => (
              <div
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedListId(list.id)}
                role="button"
                tabIndex={0}
                className={`p-3 cursor-pointer hover:bg-primary-50 dark:hover:bg-gray-700 ${
                  selectedListId === list.id ? 'bg-primary-100 dark:bg-primary-700 border-l-4 border-primary-500 dark:border-primary-400' : 'border-b border-gray-200 dark:border-gray-600'
                } transition-all duration-150`}
              >
                <h4 className="font-medium text-sm text-gray-800 dark:text-gray-100">{list.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {list.item_count ?? 0} items · {list.is_public ? 'Public' : 'Private'}
                </p>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">No lists found. Try creating one!</p>
          )}
        </div>
      )}

      {!showNewListForm && (
        <Button onClick={() => setShowNewListForm(true)} variant="outline" className="w-full mb-4">
          <PlusHeroIcon className="h-4 w-4 mr-2" /> Create New List
        </Button>
      )}

      {showNewListForm && (
        <div className="mb-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700 shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Create New List</h3>
          <div className="mb-3">
            <Label htmlFor="new-list-name" className="dark:text-gray-300">List Name*</Label>
            <Input
              id="new-list-name"
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., My Favorite Spots"
              className="w-full dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="new-list-description" className="dark:text-gray-300">Description (Optional)</Label>
            <Input
              id="new-list-description"
              type="text"
              value={newListDescription}
              onChange={(e) => setNewListDescription(e.target.value)}
              placeholder="A short description of your list"
              className="w-full dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateList} isLoading={createListMutation.isPending} className="flex-grow" variant="primary">
              Create & Select List
            </Button>
            <Button onClick={() => setShowNewListForm(false)} variant="ghost" className="flex-shrink-0">
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {selectedListId && !showNewListForm && itemToAdd && (
         <div className="mt-4 pt-4 border-t dark:border-gray-600">
            <Label htmlFor="item-notes" className="dark:text-gray-300">Notes for {itemToAdd.name} (Optional)</Label>
            <Input
              id="item-notes"
              type="text"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="e.g., Order the spicy ramen!"
              className="w-full mb-3 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
            <Button 
                onClick={() => handleAddItemToList()} 
                isLoading={addItemToListMutation.isPending} 
                className="w-full"
                variant="primary"
                disabled={!selectedListId}
            >
              Add "{itemToAdd.name?.substring(0,20)}{itemToAdd.name?.length > 20 ? '...' : ''}" to "{selectedListData?.name?.substring(0,15)}{selectedListData?.name?.length > 15 ? '...' : ''}"
            </Button>
        </div>
      )}
       {!itemToAdd && selectedListId && !showNewListForm && (
         <div className="text-sm text-green-600 dark:text-green-400 mt-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-md flex items-center">
            <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
            List "{selectedListData?.name}" selected.
         </div>
       )}
    </>
  );

  const renderStepTwo = () => (
    <div className="text-center py-6">
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Success!</h3>
      {itemToAdd && selectedListData && (
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          "{itemToAdd.name}" has been added to your list "{selectedListData.name}".
        </p>
      )}
      {!itemToAdd && selectedListData && ( 
         <p className="text-gray-600 dark:text-gray-300 mb-4">
          List "{selectedListData.name}" is ready.
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onClose} variant="primary" className="w-full sm:w-auto">
          Done
        </Button>
        {selectedListData && (
          <Button 
            onClick={() => {
              logDebug(`Viewing list: /lists/${selectedListData.id}`);
              onClose(); 
            }} 
            variant="outline" 
            className="w-full sm:w-auto"
          >
            View List <ExternalLink className="h-4 w-4 ml-1.5 opacity-70"/>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={step === 1 ? (itemToAdd ? `Add "${itemToAdd.name?.substring(0,30)}${itemToAdd.name?.length > 30 ? '...' : ''}" to a List` : "Select or Create List") : "Action Complete"}
        size={step === 1 ? "lg" : "md"}
    >
      <div className="p-1 sm:p-2"> 
        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
      </div>
    </Modal>
  );
};

AddToListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  itemToAdd: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
  onItemAdded: PropTypes.func,
};

export default AddToListModal;
