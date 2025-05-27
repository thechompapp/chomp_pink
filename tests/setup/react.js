// Mock React's useSyncExternalStore
const React = require('react');

// Mock the actual React module
jest.mock('react', () => {
  const ActualReact = jest.requireActual('react');
  return {
    ...ActualReact,
    useSyncExternalStore: jest.fn((subscribe, getSnapshot) => {
      const value = getSnapshot();
      const [state, setState] = React.useState(value);
      
      React.useEffect(() => {
        const unsubscribe = subscribe(() => {
          setState(getSnapshot());
        });
        return () => unsubscribe();
      }, [subscribe]);
      
      return state;
    })
  };
});

// Mock zustand
jest.mock('zustand', () => {
  const create = (createState) => {
    const state = {};
    const setState = (partial, replace) => {
      const nextState = typeof partial === 'function' ? partial(state) : partial;
      if (replace) {
        Object.assign(state, nextState);
      } else {
        Object.keys(nextState).forEach(key => {
          state[key] = nextState[key];
        });
      }
      return state;
    };
    
    const getState = () => state;
    const subscribe = (listener) => {
      // Simple implementation for tests
      return () => {};
    };
    
    const api = { setState, getState, subscribe };
    const initialState = createState(setState, getState, api);
    return api;
  };
  
  return { create };
});
