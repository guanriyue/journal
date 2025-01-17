import './App.css';
import { Tiptap } from './Tiptap';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient()

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Tiptap />
    </QueryClientProvider>
  );
};

export default App;
