declare module '@/context/PlacesApiContext' {
  import { ReactNode } from 'react';

  export interface PlacesApiContextType {
    isAvailable: boolean;
    isLoading: boolean;
    forceManualMode: () => void;
    resetApiCheck: () => void;
  }

  export const usePlacesApi: () => PlacesApiContextType;
  export const PlacesApiProvider: React.FC<{ children: ReactNode }>;
} 