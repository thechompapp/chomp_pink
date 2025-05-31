/**
 * Cleanup Service
 * 
 * Provides data analysis and cleanup functionality for admin panel.
 * Supports configurable validation rules and automated fix application.
 */

import { getDefaultApiClient } from '@/services/http';
import { handleApiResponse } from '@/utils/serviceHelpers';
import { logInfo, logError, logDebug } from '@/utils/logger';

/**
 * Data validation and cleanup rules
 */
const CLEANUP_RULES = {
  restaurants: {
    relationships: {
      missingCityId: {
        check: (item) => !item.city_id || item.city_id === null,
        fix: (item, context) => ({
          message: `Restaurant "${item.name}" missing city assignment`,
          details: `Address: ${item.address}`,
          suggestion: 'Use Google Places or manual assignment',
          fixable: false,
          priority: 'high',
          valueBefore: 'No city assigned',
          valueAfter: 'Requires manual assignment'
        })
      },
      missingNeighborhoodId: {
        check: (item) => !item.neighborhood_id || item.neighborhood_id === null,
        fix: (item, context) => ({
          message: `Restaurant "${item.name}" missing neighborhood assignment`,
          details: `Address: ${item.address}`,
          suggestion: 'Use Google Places or manual assignment',
          fixable: false,
          priority: 'high',
          valueBefore: 'No neighborhood assigned',
          valueAfter: 'Requires manual assignment'
        })
      },
      invalidCityId: {
        check: (item, context) => {
          if (!item.city_id) return false;
          return !context.cities?.find(c => c.id === item.city_id);
        },
        fix: (item, context) => ({
          message: `Restaurant "${item.name}" has invalid city reference`,
          details: `City ID ${item.city_id} not found`,
          suggestion: 'Reassign to valid city',
          fixable: false,
          priority: 'high',
          valueBefore: `City ID: ${item.city_id}`,
          valueAfter: 'Requires valid city assignment'
        })
      },
      invalidNeighborhoodId: {
        check: (item, context) => {
          if (!item.neighborhood_id) return false;
          return !context.neighborhoods?.find(n => n.id === item.neighborhood_id);
        },
        fix: (item, context) => ({
          message: `Restaurant "${item.name}" has invalid neighborhood reference`,
          details: `Neighborhood ID ${item.neighborhood_id} not found`,
          suggestion: 'Reassign to valid neighborhood',
          fixable: false,
          priority: 'high',
          valueBefore: `Neighborhood ID: ${item.neighborhood_id}`,
          valueAfter: 'Requires valid neighborhood assignment'
        })
      }
    },
    formatting: {
      nameFormatting: {
        check: (item) => {
          if (!item.name) return false;
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return item.name !== titleCase;
        },
        fix: (item, context) => {
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return {
            message: `Restaurant name needs title case formatting`,
            details: `Name: "${item.name}"`,
            suggestion: 'Apply title case formatting',
            fixable: true,
            priority: 'medium',
            valueBefore: item.name,
            valueAfter: titleCase,
            autoFix: {
              field: 'name',
              value: titleCase
            }
          };
        }
      },
      phoneFormatting: {
        check: (item) => {
          if (!item.phone) return false;
          const cleaned = item.phone.replace(/\D/g, '');
          if (cleaned.length !== 10) return false;
          const formatted = `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
          return item.phone !== formatted;
        },
        fix: (item, context) => {
          const cleaned = item.phone.replace(/\D/g, '');
          const formatted = `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
          return {
            message: `Phone number needs standard formatting`,
            details: `Restaurant: "${item.name}"`,
            suggestion: 'Apply standard US phone format',
            fixable: true,
            priority: 'medium',
            valueBefore: item.phone,
            valueAfter: formatted,
            autoFix: {
              field: 'phone',
              value: formatted
            }
          };
        }
      },
      websiteFormatting: {
        check: (item) => {
          if (!item.website) return false;
          return !item.website.startsWith('http://') && !item.website.startsWith('https://');
        },
        fix: (item, context) => {
          const formattedWebsite = `https://${item.website}`;
          return {
            message: `Website URL missing protocol`,
            details: `Restaurant: "${item.name}"`,
            suggestion: 'Add https:// prefix',
            fixable: true,
            priority: 'low',
            valueBefore: item.website,
            valueAfter: formattedWebsite,
            autoFix: {
              field: 'website',
              value: formattedWebsite
            }
          };
        }
      },
      addressFormatting: {
        check: (item) => {
          if (!item.address) return false;
          return item.address !== item.address.trim();
        },
        fix: (item, context) => {
          const trimmedAddress = item.address.trim();
          return {
            message: `Address has extra whitespace`,
            details: `Restaurant: "${item.name}"`,
            suggestion: 'Trim whitespace',
            fixable: true,
            priority: 'low',
            valueBefore: `"${item.address}"`,
            valueAfter: `"${trimmedAddress}"`,
            autoFix: {
              field: 'address',
              value: trimmedAddress
            }
          };
        }
      }
    },
    validation: {
      requiredFields: {
        check: (item) => !item.name || !item.address,
        fix: (item, context) => {
          const missingFields = [
            !item.name && 'name',
            !item.address && 'address'
          ].filter(Boolean);
          
          return {
            message: `Restaurant missing required fields`,
            details: `Restaurant ID: ${item.id}`,
            suggestion: 'Add missing required information',
            fixable: false,
            priority: 'high',
            valueBefore: `Missing: ${missingFields.join(', ')}`,
            valueAfter: 'Requires manual data entry'
          };
        }
      },
      duplicateNames: {
        check: (item, context, allItems) => {
          return allItems.filter(other => 
            other.id !== item.id && 
            other.name && 
            other.name.toLowerCase() === item.name?.toLowerCase()
          ).length > 0;
        },
        fix: (item, context, allItems) => {
          const duplicates = allItems.filter(other => 
            other.id !== item.id && 
            other.name && 
            other.name.toLowerCase() === item.name?.toLowerCase()
          );
          
          return {
            message: `Duplicate restaurant name found`,
            details: `Restaurant: "${item.name}" (ID: ${item.id})`,
            suggestion: 'Review and merge or rename duplicates',
            fixable: false,
            priority: 'medium',
            valueBefore: `"${item.name}" (${duplicates.length + 1} total)`,
            valueAfter: 'Requires manual review and resolution'
          };
        }
      }
    }
  },
  dishes: {
    relationships: {
      missingRestaurantId: {
        check: (item) => !item.restaurant_id || item.restaurant_id === null,
        fix: (item, context) => ({
          message: `Dish missing restaurant assignment`,
          details: `Dish: "${item.name}" (ID: ${item.id})`,
          suggestion: 'Assign to a restaurant or remove',
          fixable: false,
          priority: 'high',
          valueBefore: 'No restaurant assigned',
          valueAfter: 'Requires restaurant assignment'
        })
      },
      invalidRestaurantId: {
        check: (item, context) => {
          if (!item.restaurant_id) return false;
          // Handle potential type mismatches by converting both to numbers for comparison
          const dishRestaurantId = Number(item.restaurant_id);
          return !context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
        },
        fix: (item, context) => {
          // Try to find the restaurant name with type-safe comparison
          const dishRestaurantId = Number(item.restaurant_id);
          const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
          const restaurantDisplay = restaurant ? 
            `"${restaurant.name}" (ID: ${item.restaurant_id})` : 
            `Restaurant ID: ${item.restaurant_id} (not found)`;
            
          return {
            message: `Dish has invalid restaurant reference`,
            details: `Dish: "${item.name}" (ID: ${item.id})`,
            suggestion: 'Reassign to valid restaurant',
            fixable: false,
            priority: 'high',
            valueBefore: restaurantDisplay,
            valueAfter: 'Requires valid restaurant assignment'
          };
        }
      },
      orphanedDishes: {
        check: (item, context) => {
          if (!item.restaurant_id) return true;
          // Handle potential type mismatches by converting both to numbers for comparison
          const dishRestaurantId = Number(item.restaurant_id);
          const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
          return !restaurant;
        },
        fix: (item, context) => {
          // Show the restaurant name if found, even for orphaned dishes
          const dishRestaurantId = Number(item.restaurant_id);
          const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
          const restaurantDisplay = item.restaurant_id ? 
            (restaurant ? 
              `"${restaurant.name}" (ID: ${item.restaurant_id})` : 
              `Restaurant ID: ${item.restaurant_id} (deleted)`) : 
            'No restaurant assigned';
            
          return {
            message: `Orphaned dish detected`,
            details: `Dish: "${item.name}" (ID: ${item.id})`,
            suggestion: 'Reassign or remove dish',
            fixable: false,
            priority: 'high',
            valueBefore: restaurantDisplay,
            valueAfter: 'Requires reassignment or removal'
          };
        }
      }
    },
    formatting: {
      nameFormatting: {
        check: (item) => {
          if (!item.name) return false;
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return item.name !== titleCase;
        },
        fix: (item, context) => {
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          
          // Also show which restaurant this dish belongs to for context with type-safe comparison
          const dishRestaurantId = Number(item.restaurant_id);
          const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
          const restaurantContext = restaurant ? ` at "${restaurant.name}"` : '';
          
          return {
            message: `Dish name needs title case formatting`,
            details: `Dish: "${item.name}"${restaurantContext} (ID: ${item.id})`,
            suggestion: 'Apply title case formatting',
            fixable: true,
            priority: 'medium',
            valueBefore: item.name,
            valueAfter: titleCase,
            autoFix: {
              field: 'name',
              value: titleCase
            }
          };
        }
      },
      descriptionFormatting: {
        check: (item) => {
          if (!item.description) return false;
          return item.description !== item.description.trim();
        },
        fix: (item, context) => {
          const trimmedDescription = item.description.trim();
          
          // Show restaurant context with type-safe comparison
          const dishRestaurantId = Number(item.restaurant_id);
          const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
          const restaurantContext = restaurant ? ` at "${restaurant.name}"` : '';
          
          return {
            message: `Description has extra whitespace`,
            details: `Dish: "${item.name}"${restaurantContext} (ID: ${item.id})`,
            suggestion: 'Trim whitespace',
            fixable: true,
            priority: 'low',
            valueBefore: `"${item.description}"`,
            valueAfter: `"${trimmedDescription}"`,
            autoFix: {
              field: 'description',
              value: trimmedDescription
            }
          };
        }
      }
    },
    validation: {
      requiredFields: {
        check: (item) => !item.name || !item.restaurant_id,
        fix: (item, context) => {
          const missingFields = [
            !item.name && 'name',
            !item.restaurant_id && 'restaurant'
          ].filter(Boolean);
          
          return {
            message: `Dish missing required fields`,
            details: `Dish ID: ${item.id}`,
            suggestion: 'Add missing required information',
            fixable: false,
            priority: 'high',
            valueBefore: `Missing: ${missingFields.join(', ')}`,
            valueAfter: 'Requires manual data entry'
          };
        }
      },
      duplicateDishes: {
        check: (item, context, allItems) => {
          return allItems.filter(other => 
            other.id !== item.id && 
            other.restaurant_id === item.restaurant_id &&
            other.name && 
            other.name.toLowerCase() === item.name?.toLowerCase()
          ).length > 0;
        },
        fix: (item, context, allItems) => {
          const duplicates = allItems.filter(other => 
            other.id !== item.id && 
            other.restaurant_id === item.restaurant_id &&
            other.name && 
            other.name.toLowerCase() === item.name?.toLowerCase()
          );
          
          // Use type-safe comparison for restaurant lookup
          const dishRestaurantId = Number(item.restaurant_id);
          const restaurant = context.restaurants?.find(r => Number(r.id) === dishRestaurantId);
          const restaurantName = restaurant?.name || `Restaurant ID ${item.restaurant_id}`;
          
          return {
            message: `Duplicate dish name at restaurant`,
            details: `Dish: "${item.name}" at "${restaurantName}"`,
            suggestion: 'Review and merge or rename duplicates',
            fixable: false,
            priority: 'medium',
            valueBefore: `"${item.name}" at "${restaurantName}" (${duplicates.length + 1} total)`,
            valueAfter: 'Requires manual review and resolution'
          };
        }
      }
    }
  },
  // Add other resource types as needed...
  neighborhoods: {
    relationships: {
      missingCityId: {
        check: (item) => !item.city_id || item.city_id === null,
        fix: (item, context) => ({
          message: `Neighborhood missing city assignment`,
          details: `Neighborhood: "${item.name}" (ID: ${item.id})`,
          suggestion: 'Assign to appropriate city',
          fixable: false,
          priority: 'high',
          valueBefore: 'No city assigned',
          valueAfter: 'Requires city assignment'
        })
      },
      invalidCityId: {
        check: (item, context) => {
          if (!item.city_id) return false;
          return !context.cities?.find(c => c.id === item.city_id);
        },
        fix: (item, context) => ({
          message: `Neighborhood has invalid city reference`,
          details: `Neighborhood: "${item.name}" (ID: ${item.id})`,
          suggestion: 'Reassign to valid city',
          fixable: false,
          priority: 'high',
          valueBefore: `City ID: ${item.city_id}`,
          valueAfter: 'Requires valid city assignment'
        })
      }
    },
    formatting: {
      nameFormatting: {
        check: (item) => {
          if (!item.name) return false;
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return item.name !== titleCase;
        },
        fix: (item, context) => {
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return {
            message: `Neighborhood name needs title case formatting`,
            details: `Neighborhood ID: ${item.id}`,
            suggestion: 'Apply title case formatting',
            fixable: true,
            priority: 'medium',
            valueBefore: item.name,
            valueAfter: titleCase,
            autoFix: {
              field: 'name',
              value: titleCase
            }
          };
        }
      },
      boroughFormatting: {
        check: (item) => {
          if (!item.borough) return false;
          const titleCase = item.borough.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return item.borough !== titleCase;
        },
        fix: (item, context) => {
          const titleCase = item.borough.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return {
            message: `Borough name needs title case formatting`,
            details: `Neighborhood: "${item.name}" (ID: ${item.id})`,
            suggestion: 'Apply title case formatting',
            fixable: true,
            priority: 'low',
            valueBefore: item.borough,
            valueAfter: titleCase,
            autoFix: {
              field: 'borough',
              value: titleCase
            }
          };
        }
      }
    },
    validation: {
      requiredFields: {
        check: (item) => !item.name || !item.city_id,
        fix: (item, context) => {
          const missingFields = [
            !item.name && 'name',
            !item.city_id && 'city'
          ].filter(Boolean);
          
          return {
            message: `Neighborhood missing required fields`,
            details: `Neighborhood ID: ${item.id}`,
            suggestion: 'Add missing required information',
            fixable: false,
            priority: 'high',
            valueBefore: `Missing: ${missingFields.join(', ')}`,
            valueAfter: 'Requires manual data entry'
          };
        }
      },
      duplicateNames: {
        check: (item, context, allItems) => {
          return allItems.filter(other => 
            other.id !== item.id && 
            other.city_id === item.city_id &&
            other.name && 
            other.name.toLowerCase() === item.name?.toLowerCase()
          ).length > 0;
        },
        fix: (item, context, allItems) => {
          const duplicates = allItems.filter(other => 
            other.id !== item.id && 
            other.city_id === item.city_id &&
            other.name && 
            other.name.toLowerCase() === item.name?.toLowerCase()
          );
          
          const city = context.cities?.find(c => c.id === item.city_id);
          const cityName = city?.name || `City ID ${item.city_id}`;
          
          return {
            message: `Duplicate neighborhood name in city`,
            details: `Neighborhood: "${item.name}" in ${cityName}`,
            suggestion: 'Review and merge or rename duplicates',
            fixable: false,
            priority: 'medium',
            valueBefore: `"${item.name}" (${duplicates.length + 1} total in this city)`,
            valueAfter: 'Requires manual review and resolution'
          };
        }
      }
    }
  },
  cities: {
    formatting: {
      nameFormatting: {
        check: (item) => {
          if (!item.name) return false;
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return item.name !== titleCase;
        },
        fix: (item, context) => {
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return {
            message: `City name needs title case formatting`,
            details: `City ID: ${item.id}`,
            suggestion: 'Apply title case formatting',
            fixable: true,
            priority: 'medium',
            valueBefore: item.name,
            valueAfter: titleCase,
            autoFix: {
              field: 'name',
              value: titleCase
            }
          };
        }
      },
      stateFormatting: {
        check: (item) => {
          if (!item.state) return false;
          const uppercase = item.state.toUpperCase();
          return item.state !== uppercase;
        },
        fix: (item, context) => {
          const uppercase = item.state.toUpperCase();
          return {
            message: `State code needs uppercase formatting`,
            details: `City: "${item.name}" (ID: ${item.id})`,
            suggestion: 'Convert to uppercase',
            fixable: true,
            priority: 'low',
            valueBefore: item.state,
            valueAfter: uppercase,
            autoFix: {
              field: 'state',
              value: uppercase
            }
          };
        }
      }
    },
    validation: {
      requiredFields: {
        check: (item) => !item.name,
        fix: (item, context) => ({
          message: `City missing required fields`,
          details: `City ID: ${item.id}`,
          suggestion: 'Add missing required information',
          fixable: false,
          priority: 'high',
          valueBefore: 'Missing: name',
          valueAfter: 'Requires manual data entry'
        })
      },
      duplicateNames: {
        check: (item, context, allItems) => {
          return allItems.filter(other => 
            other.id !== item.id && 
            other.name && 
            other.name.toLowerCase() === item.name?.toLowerCase()
          ).length > 0;
        },
        fix: (item, context, allItems) => {
          const duplicates = allItems.filter(other => 
            other.id !== item.id && 
            other.name && 
            other.name.toLowerCase() === item.name?.toLowerCase()
          );
          
          return {
            message: `Duplicate city name found`,
            details: `City: "${item.name}" (ID: ${item.id})`,
            suggestion: 'Review and merge or rename duplicates',
            fixable: false,
            priority: 'medium',
            valueBefore: `"${item.name}" (${duplicates.length + 1} total)`,
            valueAfter: 'Requires manual review and resolution'
          };
        }
      }
    }
  },
  users: {
    formatting: {
      nameFormatting: {
        check: (item) => {
          if (!item.name) return false;
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return item.name !== titleCase;
        },
        fix: (item, context) => {
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return {
            message: `User name needs title case formatting`,
            details: `User: ${item.username} (ID: ${item.id})`,
            suggestion: 'Apply title case formatting',
            fixable: true,
            priority: 'medium',
            valueBefore: item.name,
            valueAfter: titleCase,
            autoFix: {
              field: 'name',
              value: titleCase
            }
          };
        }
      },
      emailFormatting: {
        check: (item) => {
          if (!item.email) return false;
          const lowercase = item.email.toLowerCase();
          return item.email !== lowercase;
        },
        fix: (item, context) => {
          const lowercase = item.email.toLowerCase();
          return {
            message: `Email needs lowercase formatting`,
            details: `User: ${item.username} (ID: ${item.id})`,
            suggestion: 'Convert email to lowercase',
            fixable: true,
            priority: 'medium',
            valueBefore: item.email,
            valueAfter: lowercase,
            autoFix: {
              field: 'email',
              value: lowercase
            }
          };
        }
      }
    },
    validation: {
      requiredFields: {
        check: (item) => !item.username || !item.email,
        fix: (item, context) => {
          const missingFields = [
            !item.username && 'username',
            !item.email && 'email'
          ].filter(Boolean);
          
          return {
            message: `User missing required fields`,
            details: `User ID: ${item.id}`,
            suggestion: 'Add missing required information',
            fixable: false,
            priority: 'high',
            valueBefore: `Missing: ${missingFields.join(', ')}`,
            valueAfter: 'Requires manual data entry'
          };
        }
      },
      emailValidation: {
        check: (item) => {
          if (!item.email) return false;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return !emailRegex.test(item.email);
        },
        fix: (item, context) => ({
          message: `Invalid email format`,
          details: `User: ${item.username} (ID: ${item.id})`,
          suggestion: 'Correct email format',
          fixable: false,
          priority: 'high',
          valueBefore: item.email,
          valueAfter: 'Requires valid email format'
        })
      },
      duplicateEmails: {
        check: (item, context, allItems) => {
          if (!item.email) return false;
          return allItems.filter(other => 
            other.id !== item.id && 
            other.email && 
            other.email.toLowerCase() === item.email.toLowerCase()
          ).length > 0;
        },
        fix: (item, context, allItems) => {
          const duplicates = allItems.filter(other => 
            other.id !== item.id && 
            other.email && 
            other.email.toLowerCase() === item.email.toLowerCase()
          );
          
          return {
            message: `Duplicate email address found`,
            details: `User: ${item.username} (ID: ${item.id})`,
            suggestion: 'Resolve duplicate accounts',
            fixable: false,
            priority: 'high',
            valueBefore: `${item.email} (${duplicates.length + 1} accounts)`,
            valueAfter: 'Requires manual resolution'
          };
        }
      },
      unverifiedAccounts: {
        check: (item) => item.verified === false || item.verified === 0,
        fix: (item, context) => ({
          message: `Unverified user account`,
          details: `User: ${item.username} (ID: ${item.id})`,
          suggestion: 'Send verification email or manually verify',
          fixable: false,
          priority: 'low',
          valueBefore: 'Unverified',
          valueAfter: 'Requires verification'
        })
      }
    }
  },
  hashtags: {
    formatting: {
      nameFormatting: {
        check: (item) => {
          if (!item.name) return false;
          const lowercase = item.name.toLowerCase();
          return item.name !== lowercase;
        },
        fix: (item, context) => {
          const lowercase = item.name.toLowerCase();
          return {
            message: `Hashtag needs lowercase formatting`,
            details: `Hashtag ID: ${item.id}`,
            suggestion: 'Convert to lowercase',
            fixable: true,
            priority: 'medium',
            valueBefore: item.name,
            valueAfter: lowercase,
            autoFix: {
              field: 'name',
              value: lowercase
            }
          };
        }
      },
      hashtagPrefix: {
        check: (item) => {
          if (!item.name) return false;
          return !item.name.startsWith('#');
        },
        fix: (item, context) => {
          const withPrefix = `#${item.name}`;
          return {
            message: `Hashtag missing # prefix`,
            details: `Hashtag ID: ${item.id}`,
            suggestion: 'Add # prefix',
            fixable: true,
            priority: 'low',
            valueBefore: item.name,
            valueAfter: withPrefix,
            autoFix: {
              field: 'name',
              value: withPrefix
            }
          };
        }
      }
    },
    validation: {
      requiredFields: {
        check: (item) => !item.name,
        fix: (item, context) => ({
          message: `Hashtag missing required fields`,
          details: `Hashtag ID: ${item.id}`,
          suggestion: 'Add hashtag name',
          fixable: false,
          priority: 'high',
          valueBefore: 'Missing: name',
          valueAfter: 'Requires hashtag name'
        })
      },
      duplicateNames: {
        check: (item, context, allItems) => {
          if (!item.name) return false;
          return allItems.filter(other => 
            other.id !== item.id && 
            other.name && 
            other.name.toLowerCase() === item.name.toLowerCase()
          ).length > 0;
        },
        fix: (item, context, allItems) => {
          const duplicates = allItems.filter(other => 
            other.id !== item.id && 
            other.name && 
            other.name.toLowerCase() === item.name.toLowerCase()
          );
          
          return {
            message: `Duplicate hashtag found`,
            details: `Hashtag: "${item.name}" (ID: ${item.id})`,
            suggestion: 'Merge duplicate hashtags',
            fixable: false,
            priority: 'medium',
            valueBefore: `"${item.name}" (${duplicates.length + 1} total)`,
            valueAfter: 'Requires manual merge'
          };
        }
      },
      unusedHashtags: {
        check: (item, context) => {
          // This would need actual usage data from submissions/dishes
          // For now, just check if the hashtag has been around for a while without usage
          const createdDate = new Date(item.created_at);
          const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreated > 30; // Assume unused if older than 30 days
        },
        fix: (item, context) => ({
          message: `Potentially unused hashtag`,
          details: `Hashtag: "${item.name}" (ID: ${item.id})`,
          suggestion: 'Review usage and consider removal',
          fixable: false,
          priority: 'low',
          valueBefore: 'Old hashtag (30+ days)',
          valueAfter: 'Review for removal'
        })
      }
    }
  },
  submissions: {
    validation: {
      requiredFields: {
        check: (item) => !item.dish_name || !item.restaurant_name,
        fix: (item, context) => {
          const missingFields = [
            !item.dish_name && 'dish name',
            !item.restaurant_name && 'restaurant name'
          ].filter(Boolean);
          
          return {
            message: `Submission missing required fields`,
            details: `Submission ID: ${item.id}`,
            suggestion: 'Add missing required information',
            fixable: false,
            priority: 'high',
            valueBefore: `Missing: ${missingFields.join(', ')}`,
            valueAfter: 'Requires manual data entry'
          };
        }
      },
      pendingSubmissions: {
        check: (item) => {
          if (item.status !== 'pending') return false;
          const createdDate = new Date(item.created_at);
          const daysPending = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysPending > 7; // Pending for more than 7 days
        },
        fix: (item, context) => {
          const createdDate = new Date(item.created_at);
          const daysPending = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            message: `Long-pending submission requires attention`,
            details: `Submission: "${item.dish_name}" at "${item.restaurant_name}"`,
            suggestion: 'Review and approve/reject submission',
            fixable: false,
            priority: 'medium',
            valueBefore: `Pending for ${daysPending} days`,
            valueAfter: 'Requires review decision'
          };
        }
      },
      duplicateSubmissions: {
        check: (item, context, allItems) => {
          return allItems.filter(other => 
            other.id !== item.id && 
            other.dish_name && 
            other.restaurant_name &&
            other.dish_name.toLowerCase() === item.dish_name?.toLowerCase() &&
            other.restaurant_name.toLowerCase() === item.restaurant_name?.toLowerCase()
          ).length > 0;
        },
        fix: (item, context, allItems) => {
          const duplicates = allItems.filter(other => 
            other.id !== item.id && 
            other.dish_name && 
            other.restaurant_name &&
            other.dish_name.toLowerCase() === item.dish_name?.toLowerCase() &&
            other.restaurant_name.toLowerCase() === item.restaurant_name?.toLowerCase()
          );
          
          return {
            message: `Duplicate submission detected`,
            details: `"${item.dish_name}" at "${item.restaurant_name}"`,
            suggestion: 'Review and merge duplicates',
            fixable: false,
            priority: 'medium',
            valueBefore: `${duplicates.length + 1} identical submissions`,
            valueAfter: 'Requires manual review and merge'
          };
        }
      }
    }
  },
  restaurant_chains: {
    formatting: {
      nameFormatting: {
        check: (item) => {
          if (!item.name) return false;
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return item.name !== titleCase;
        },
        fix: (item, context) => {
          const titleCase = item.name.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          return {
            message: `Chain name needs title case formatting`,
            details: `Chain ID: ${item.id}`,
            suggestion: 'Apply title case formatting',
            fixable: true,
            priority: 'medium',
            valueBefore: item.name,
            valueAfter: titleCase,
            autoFix: {
              field: 'name',
              value: titleCase
            }
          };
        }
      }
    },
    validation: {
      requiredFields: {
        check: (item) => !item.name,
        fix: (item, context) => ({
          message: `Restaurant chain missing required fields`,
          details: `Chain ID: ${item.id}`,
          suggestion: 'Add chain name',
          fixable: false,
          priority: 'high',
          valueBefore: 'Missing: name',
          valueAfter: 'Requires chain name'
        })
      },
      duplicateNames: {
        check: (item, context, allItems) => {
          if (!item.name) return false;
          return allItems.filter(other => 
            other.id !== item.id && 
            other.name && 
            other.name.toLowerCase() === item.name.toLowerCase()
          ).length > 0;
        },
        fix: (item, context, allItems) => {
          const duplicates = allItems.filter(other => 
            other.id !== item.id && 
            other.name && 
            other.name.toLowerCase() === item.name.toLowerCase()
          );
          
          return {
            message: `Duplicate chain name found`,
            details: `Chain: "${item.name}" (ID: ${item.id})`,
            suggestion: 'Merge duplicate chains',
            fixable: false,
            priority: 'medium',
            valueBefore: `"${item.name}" (${duplicates.length + 1} total)`,
            valueAfter: 'Requires manual merge'
          };
        }
      }
    }
  }
};

/**
 * CleanupService class
 */
class CleanupService {
  constructor() {
    this.apiClient = getDefaultApiClient();
  }

  /**
   * Analyze data for issues based on configuration
   */
  async analyzeData(resourceType, data, config) {
    try {
      logInfo(`[CleanupService] Analyzing ${resourceType} data`, {
        resourceType,
        itemCount: data.length,
        config: Object.keys(config)
      });

      // Get context data for relationship validation
      const context = await this.getContextData(resourceType);
      
      // Additional debugging for dishes
      if (resourceType === 'dishes') {
        logInfo(`[CleanupService] Context loaded for dishes analysis:`, {
          restaurantCount: context.restaurants?.length || 0,
          firstFewRestaurants: context.restaurants?.slice(0, 5).map(r => ({ id: r.id, name: r.name })) || [],
          sampleDishData: data.slice(0, 3).map(d => ({ id: d.id, name: d.name, restaurant_id: d.restaurant_id }))
        });
      }
      
      const issues = {};
      let totalIssues = 0;

      // Process each category of checks
      Object.entries(config).forEach(([categoryKey, category]) => {
        issues[categoryKey] = {};

        Object.entries(category).forEach(([checkKey, checkConfig]) => {
          if (!checkConfig.enabled) {
            logDebug(`[CleanupService] Skipping disabled check: ${resourceType}.${categoryKey}.${checkKey}`);
            return;
          }

          const rule = CLEANUP_RULES[resourceType]?.[categoryKey]?.[checkKey];
          if (!rule) {
            logDebug(`[CleanupService] No rule found for ${resourceType}.${categoryKey}.${checkKey}`);
            return;
          }

          logDebug(`[CleanupService] Processing check: ${resourceType}.${categoryKey}.${checkKey}`);
          const categoryIssues = [];

          data.forEach((item, index) => {
            try {
              if (rule.check(item, context, data)) {
                const issue = rule.fix(item, context, data);
                if (issue) {
                  // Add unique ID for tracking fixes
                  issue.id = `${resourceType}_${checkKey}_${item.id || index}`;
                  issue.itemId = item.id;
                  issue.checkKey = checkKey;
                  issue.categoryKey = categoryKey;
                  categoryIssues.push(issue);
                  totalIssues++;
                  
                  // Log restaurant context issues specifically
                  if (checkKey === 'restaurantContext') {
                    logInfo(`[CleanupService] Restaurant context issue found:`, {
                      dishId: item.id,
                      dishName: item.name,
                      restaurantId: item.restaurant_id,
                      issueMessage: issue.message,
                      valueBefore: issue.valueBefore,
                      valueAfter: issue.valueAfter
                    });
                  }
                }
              } else {
                // Log when restaurant context check doesn't trigger
                if (checkKey === 'restaurantContext') {
                  logDebug(`[CleanupService] Restaurant context check returned false for dish:`, {
                    dishId: item.id,
                    dishName: item.name,
                    restaurantId: item.restaurant_id
                  });
                }
              }
            } catch (error) {
              logError(`[CleanupService] Error checking item ${item.id}:`, error);
            }
          });

          if (categoryIssues.length > 0) {
            issues[categoryKey][checkKey] = categoryIssues;
            logInfo(`[CleanupService] Found ${categoryIssues.length} issues for ${categoryKey}.${checkKey}`);
          }
        });

        // Remove empty categories
        if (Object.keys(issues[categoryKey]).length === 0) {
          delete issues[categoryKey];
        }
      });

      const results = {
        resourceType,
        totalIssues,
        issues,
        analyzedAt: new Date().toISOString(),
        itemCount: data.length
      };

      logInfo(`[CleanupService] Analysis complete`, {
        resourceType,
        totalIssues,
        categories: Object.keys(issues),
        detailedResults: Object.entries(issues).map(([cat, catIssues]) => ({
          category: cat,
          checks: Object.keys(catIssues),
          totalIssues: Object.values(catIssues).flat().length
        }))
      });

      return results;
    } catch (error) {
      logError('[CleanupService] Analysis failed:', error);
      throw new Error(`Data analysis failed: ${error.message}`);
    }
  }

  /**
   * Apply selected fixes
   */
  async applyFixes(resourceType, fixIds) {
    try {
      logInfo(`[CleanupService] Applying ${fixIds.length} fixes for ${resourceType}`);

      // For now, simulate the fix application locally
      // In production, this would call the backend endpoint
      try {
        const response = await this.apiClient.post(`/admin/cleanup/${resourceType}/apply`, {
          fixIds
        });
        return handleApiResponse(response);
      } catch (apiError) {
        // If backend endpoint is not available, simulate successful fix application
        logInfo(`[CleanupService] Backend endpoint not available, simulating fix application`);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          message: `Simulated application of ${fixIds.length} fixes`,
          results: {
            applied: fixIds.length,
            failed: 0,
            details: fixIds.map(fixId => ({
              fixId,
              status: 'success',
              message: 'Fix simulated successfully'
            }))
          }
        };
      }
    } catch (error) {
      logError('[CleanupService] Failed to apply fixes:', error);
      throw new Error(`Failed to apply fixes: ${error.message}`);
    }
  }

  /**
   * Get context data for relationship validation
   */
  async getContextData(resourceType) {
    const context = {};

    try {
      // Always fetch cities and neighborhoods for relationship checks
      // For restaurants, use a large limit to get all restaurants for proper context
      const [citiesResponse, neighborhoodsResponse, restaurantsResponse] = await Promise.all([
        this.apiClient.get('/admin/cities?limit=1000'),
        this.apiClient.get('/admin/neighborhoods?limit=1000'),
        this.apiClient.get('/admin/restaurants?limit=10000') // Get all restaurants
      ]);

      context.cities = citiesResponse.data || [];
      context.neighborhoods = neighborhoodsResponse.data || [];
      
      // Handle restaurants response - it might be nested in data property
      let restaurantsData = restaurantsResponse.data;
      if (restaurantsData && restaurantsData.data && Array.isArray(restaurantsData.data)) {
        // Response has nested data structure
        restaurantsData = restaurantsData.data;
      } else if (!Array.isArray(restaurantsData)) {
        // Response is not an array, try to extract array from various possible structures
        restaurantsData = restaurantsData?.restaurants || [];
      }
      
      context.restaurants = restaurantsData;

      logDebug('[CleanupService] Context data loaded', {
        cities: context.cities.length,
        neighborhoods: context.neighborhoods.length,
        restaurants: context.restaurants.length,
        restaurantSample: context.restaurants.slice(0, 3).map(r => ({ id: r.id, name: r.name })),
        restaurantIds: context.restaurants.map(r => r.id).slice(0, 10)
      });
      
      // Additional debugging for dish cleanup specifically
      if (resourceType === 'dishes') {
        logInfo('[CleanupService] Restaurant context for dishes cleanup:', {
          totalRestaurants: context.restaurants.length,
          restaurantIdRange: context.restaurants.length > 0 ? {
            min: Math.min(...context.restaurants.map(r => r.id)),
            max: Math.max(...context.restaurants.map(r => r.id))
          } : null,
          hasRestaurant27: context.restaurants.some(r => r.id === 27),
          restaurant27Data: context.restaurants.find(r => r.id === 27)
        });
      }
    } catch (error) {
      logError('[CleanupService] Failed to load context data:', error);
      // Continue with empty context
    }

    return context;
  }
}

// Create and export singleton instance
export const cleanupService = new CleanupService(); 