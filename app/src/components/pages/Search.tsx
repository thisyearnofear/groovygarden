import { Search as SearchIcon, Play, Users, Eye, TrendingUp, Clock, ListFilter } from "lucide-react";
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { chainServiceSearchChains, type DanceChain } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Dance Chains</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
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
        </div>

        {/* Search Results */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!loading && searched && (
          <>
            {results.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                    <SearchIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No chains found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {query 
                      ? `No dance chains match "${query}". Try different keywords or browse popular chains.`
                      : 'Try searching for dance chains by title, description, or category.'
                    }
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button onClick={() => navigate('/')}>
                      Browse All Chains
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/create-chain')}
                    >
                      Create New Chain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((chain) => (
                  <Card 
                    key={chain.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => navigate(`/chain/${chain.id}`)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                            {chain.title}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {chain.description}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(chain.status || 'active')}>
                          {chain.status || 'active'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        {/* Category Badge */}
                        <Badge variant="outline" className="capitalize">
                          {chain.category}
                        </Badge>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{chain.current_move_count}/{chain.max_moves} moves</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{chain.total_views || 0} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{chain.total_votes || 0} votes</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(chain.created_at || '')}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${((chain.current_move_count || 1) / (chain.max_moves || 10)) * 100}%` 
                            }}
                          ></div>
                        </div>

                        {/* Action Button */}
                        <Button 
                          className="w-full"
                          variant={chain.status === 'active' ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chain/${chain.id}`);
                          }}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {chain.status === 'active' ? 'Join Chain' : 'View Chain'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Initial State (No Search Yet) */}
        {!loading && !searched && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Discover Amazing Dance Chains
              </h3>
              <p className="text-gray-600 mb-6">
                Search for dance chains by title, description, category, or any keywords. 
                Find the perfect chain to join or get inspiration for your next creation.
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => navigate('/')}>
                  Browse Popular Chains
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/create-chain')}
                >
                  Create Your Own
                </Button>
              </div>
            </CardContent>
          </Card>
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