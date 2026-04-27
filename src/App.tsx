import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AppRoutes } from './routes';
import './index.css';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Toaster position="top-right" richColors expand={false} duration={4000} closeButton />
      <AppRoutes />
    </Provider>
  );
};

export default App;