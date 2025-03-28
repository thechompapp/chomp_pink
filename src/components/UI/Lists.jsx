import React, { useEffect } from 'react';
import useAppStore from '../../hooks/useAppStore';
import PageLayout from '../Layout/PageLayout';

const Lists = () => {
  const userLists = useAppStore((state) => state.userLists);
  const removeFromUserList = useAppStore((state) => state.removeFromUserList);

  useEffect(() => {
    console.log('User Lists:', userLists);
  }, [userLists]);

  const handleRemoveItem = (listId, itemName) => {
    console.log(`Removing ${itemName} from list ${listId}`);
    removeFromUserList(listId, itemName);
  };

  return (
    <PageLayout>
      <h1 className="text-3xl font-bold mb-6 text-center">My Lists</h1>

      {userLists.length === 0 ? (
        <p>You have no lists yet. Start adding items!</p>
      ) : (
        <div className="space-y-8">
          {userLists.map(list => (
            <div key={list.id} className="bg-white p-6 rounded-2xl shadow-xl border">
              <h2 className="text-xl font-bold mb-4">{list.name}</h2>
              
              {list.items.length === 0 ? (
                <p className="text-gray-500">No items added yet.</p>
              ) : (
                <div className="space-y-4">
                  {list.items.map(item => (
                    <div key={item.name} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow-sm">
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.neighborhood}, {item.city}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(list.id, item.name)}
                        className="bg-red-500 text-white py-1 px-3 rounded-lg hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default Lists;
