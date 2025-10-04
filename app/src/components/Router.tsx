import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut } from '@/auth/AuthProvider';
import HomePage from './pages/HomePage';
import LoginPrompt from './auth/LoginPrompt';
import Dashboard from './pages/Dashboard';
import CreateChain from './pages/CreateChain';
import ChainView from './pages/ChainView';
import ProfileSetup from './pages/ProfileSetup';
import UserProfile from './pages/UserProfile';
import Search from './pages/Search';

export default function Router() {
  return (
    <>
      <SignedOut>
        <LoginPrompt />
      </SignedOut>
      <SignedIn>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setup-profile" element={<ProfileSetup />} />
          <Route path="/create-chain" element={<CreateChain />} />
          <Route path="/chain/:chainId" element={<ChainView />} />
          <Route path="/user/:username" element={<UserProfile />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </SignedIn>
    </>
  );
}