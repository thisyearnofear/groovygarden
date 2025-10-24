import { Search as SearchIcon, Play, Users, Eye, TrendingUp, Clock, ListFilter, Zap } from "lucide-react";
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { chainServiceSearchChains, type DanceChain } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedHeader, EnhancedLoading, EnhancedEmptyState, DanceCard } from '@/components/ui';
import Navbar from '../layout/Navbar';


export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<DanceChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await chainServiceSearchChains({
        body: {
          query: searchQuery.trim(),
          limit: 50
        }
      });
      
      setResults(response.data || []);
    } catch (error) {
      console.error('Error searching chains:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      performSearch(query.trim());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedHeader
          title="Search Dance Chains"
          subtitle="Find the perfect dance chains to join or get inspiration for your next creation."
        >
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-6 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by title, description, or keywords..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>
          
          {/* Search Info */}
          {searched && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {loading ? 'Searching...' : `Found ${results.length} result${results.length !== 1 ? 's' : ''}`}
                {query && ` for "${query}"`}
              </span>
              <Button variant="outline" size="sm">
                <ListFilter className="w-4 h-4 mr-1" />
                Filter
              </Button>
            </div>
          )}
        </EnhancedHeader>

        {/* Search Results */}
        {loading && (
          <EnhancedLoading message="Searching dance chains..." />
        )}

        {/* Results Grid */}
        {!loading && searched && (
          <>
            {results.length === 0 ? (
              <EnhancedEmptyState
                title="No chains found"
                description={query 
                  ? `No dance chains match "${query}". Try different keywords or browse popular chains.`
                  : 'Try searching for dance chains by title, description, or category.'
                }
                icon={<SearchIcon className="w-8 h-8" />}
                action={{
                  label: query ? "Browse All Chains" : "Create New Chain",
                  onClick: () => navigate(query ? '/' : '/create-chain')
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((chain) => (
                  <DanceCard
                    key={chain.id}
                    title={chain.title}
                    description={chain.description}
                    category={chain.category}
                    moveCount={chain.current_move_count}
                    viewCount={chain.total_views}
                    participantCount={chain.total_participants}
                    createdAt={new Date(chain.created_at || '')}
                    isViral={chain.total_views > 1000}
                    isAiGenerated={chain.is_ai_generated}
                    onPlay={() => navigate(`/chain/${chain.id}`)}
                    onJoin={() => navigate(`/chain/${chain.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Initial State (No Search Yet) */}
        {!loading && !searched && (
          <EnhancedEmptyState
            title="Discover Amazing Dance Chains"
            description="Search for dance chains by title, description, category, or any keywords. Find the perfect chain to join or get inspiration for your next creation."
            icon={<Zap className="w-8 h-8 text-purple-600" />}
            action={{
              label: "Browse Popular Chains",
              onClick: () => navigate('/')
            }}
          />
        )}

        {/* Popular Searches / Suggestions */}
        {!loading && !searched && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Search Terms</h3>
            <div className="flex flex-wrap gap-2">
              {['hip-hop', 'contemporary', 'breakdance', 'freestyle', 'viral', 'beginner', 'advanced', 'trending'].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(term);
                    setSearchParams({ q: term });
                    performSearch(term);
                  }}
                  className="capitalize"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}