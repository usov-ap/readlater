import { Providers } from './app/providers';
import { AppRouter } from './app/router';
import { AuthGate } from './components/auth/AuthGate';

export default function App() {
  return (
    <Providers>
      <AuthGate>
        <AppRouter />
      </AuthGate>
    </Providers>
  );
}
