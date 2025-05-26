/**
 * List Service Module
 * 
 * Unified export for all list-related services.
 * Provides a backward-compatible API while using the new modular services internally.
 */
import { listCrudService } from './ListCrudService';
import { listItemService } from './ListItemService';
import { listSharingService } from './ListSharingService';
import { listSearchService } from './ListSearchService';
import { logDebug } from '@/utils/logger';

/**
 * Unified list service that maintains backward compatibility
 * while using the new modular services internally.
 */
export const listService = {
  // CRUD operations
  getLists: listCrudService.getLists.bind(listCrudService),
  getList: listCrudService.getList.bind(listCrudService),
  createList: listCrudService.createList.bind(listCrudService),
  updateList: listCrudService.updateList.bind(listCrudService),
  deleteList: listCrudService.deleteList.bind(listCrudService),
  getPublicLists: listCrudService.getPublicLists.bind(listCrudService),
  getFeaturedLists: listCrudService.getFeaturedLists.bind(listCrudService),
  getMultipleListSummary: listCrudService.getMultipleListSummary.bind(listCrudService),
  duplicateList: listCrudService.duplicateList.bind(listCrudService),
  
  // Item operations
  getListItems: listItemService.getListItems.bind(listItemService),
  addItemToList: listItemService.addItemToList.bind(listItemService),
  updateListItem: listItemService.updateListItem.bind(listItemService),
  deleteListItem: listItemService.deleteListItem.bind(listItemService),
  addItemsToListBulk: listItemService.addItemsToListBulk.bind(listItemService),
  reorderListItems: listItemService.reorderListItems.bind(listItemService),
  addDishToMultipleLists: listItemService.addDishToMultipleLists.bind(listItemService),
  addRestaurantToMultipleLists: listItemService.addRestaurantToMultipleLists.bind(listItemService),
  getListsContainingDish: listItemService.getListsContainingDish.bind(listItemService),
  getListsContainingRestaurant: listItemService.getListsContainingRestaurant.bind(listItemService),
  getMultipleListItemsDetails: listItemService.getMultipleListItemsDetails.bind(listItemService),
  
  // Sharing operations
  getFollowedLists: listSharingService.getFollowedLists.bind(listSharingService),
  followList: listSharingService.followList.bind(listSharingService),
  unfollowList: listSharingService.unfollowList.bind(listSharingService),
  toggleFollowList: listSharingService.toggleFollowList.bind(listSharingService),
  checkFollowStatus: listSharingService.checkFollowStatus.bind(listSharingService),
  getShareableListLink: listSharingService.getShareableListLink.bind(listSharingService),
  getCollaboratingLists: listSharingService.getCollaboratingLists.bind(listSharingService),
  addCollaboratorToList: listSharingService.addCollaboratorToList.bind(listSharingService),
  removeCollaboratorFromList: listSharingService.removeCollaboratorFromList.bind(listSharingService),
  updateCollaboratorRole: listSharingService.updateCollaboratorRole.bind(listSharingService),
  getListCollaborators: listSharingService.getListCollaborators.bind(listSharingService),
  mergeLists: listSharingService.mergeLists.bind(listSharingService),
  
  // Search operations
  searchLists: listSearchService.searchLists.bind(listSearchService),
  getListSuggestions: listSearchService.getListSuggestions.bind(listSearchService),
  getUserLists: listSearchService.getUserLists.bind(listSearchService),
  getRecentListsForUser: listSearchService.getRecentListsForUser.bind(listSearchService),
  getListActivity: listSearchService.getListActivity.bind(listSearchService),
  
  /**
   * Handle following/unfollowing a list, used by FollowButton
   * This method ensures backward compatibility with the existing codebase
   * @param {string} id - List ID
   * @returns {Promise<Object>} Toggle result
   */
  handleFollowList: async function(id) {
    logDebug(`[listService] Handling follow toggle for list ${id}`);
    return listSharingService.toggleFollowList(id);
  }
};

// Export individual services for direct use
export { 
  listCrudService,
  listItemService,
  listSharingService,
  listSearchService
};
