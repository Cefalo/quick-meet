// src/context/ApiContext.tsx
import Api from '@/api/api';
import React, { createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface ApiContextProps {
  api: Api;
}

const ApiContext = createContext<ApiContextProps | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const apiInstance = Api.getInstance(navigate);

  return <ApiContext.Provider value={{ api: apiInstance }}>{children}</ApiContext.Provider>;
};

export const useApi = () => useContext(ApiContext)!.api;
