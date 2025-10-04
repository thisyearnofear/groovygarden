import { Play, Search, Plus, User, LogOut, Trophy, House } from "lucide-react";
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { userDetails, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-2">
              <Play className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Dance Chain
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search chains, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </form>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button 
                variant={isActive('/') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center space-x-1"
              >
                <House className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>

            <Link to="/dashboard">
              <Button 
                variant={isActive('/dashboard') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center space-x-1"
              >
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>

            <Link to="/create-chain">
              <Button 
                variant={isActive('/create-chain') ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-1"
                onClick={() => navigate(`/user/${userDetails?.email}`)}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{userDetails?.email}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}