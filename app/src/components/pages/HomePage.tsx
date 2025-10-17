import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chainServiceGetDanceChains, type DanceChain } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '../layout/Navbar';
import { Play, Users, Eye, TrendingUp, Clock, Plus, Zap } from 'lucide-react';
import { useAuthContext } from '@/auth/AuthProvider';
import { BaseSignInModal } from '../auth/BaseSignInModal';

export default function HomePage() {
  const [chains, setChains] = useState<DanceChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthContext();

  const categories = [
    { value: 'all', label: 'All Chains' },
    { value: 'hip-hop', label: 'Hip-Hop' },
    { value: 'contemporary', label: 'Contemporary' },
    { value: 'breakdance', label: 'Breakdance' },
    { value: 'freestyle', label: 'Freestyle' },
    { value: 'pop', label: 'Pop' },
    { value: 'latin', label: 'Latin' }
  ];

  useEffect(() => {
    loadChains();
  }, [selectedCategory]);

  const loadChains = async () => {
    try {
      setLoading(true);
      const response = await chainServiceGetDanceChains({
        body: {
          category: selectedCategory === 'all' ? null : selectedCategory,
          limit: 20,
          offset: 0
        }
      });
      setChains(response.data || []);
    } catch (error) {
      console.error('Error loading chains:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Authentication Modal */}
      {showAuthModal && (
        <BaseSignInModal onClose={() => setShowAuthModal(false)} />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in-up">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full px-4 py-2 mb-6">
        <Zap className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">AI-Powered Dance Platform</span>
        </div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-6 leading-tight">
          Discover Amazing<br />Dance Chains
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Join collaborative dance sequences powered by AI. Start chains, add moves, and watch your creations go viral with real-time verification.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              onClick={() => isLoggedIn ? navigate('/create-chain') : setShowAuthModal(true)}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 btn-primary focus-enhanced px-8 py-3 text-lg"
              data-tour="create-chain"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Chain
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => document.querySelector('[data-tour="categories"]')?.scrollIntoView({ behavior: 'smooth' })}
              className="focus-enhanced px-8 py-3 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Explore Chains
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl font-bold text-purple-600 mb-1">∞</div>
              <div className="text-sm text-gray-600">Dance Chains Created</div>
            </div>
            <div className="text-center animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl font-bold text-pink-600 mb-1">AI</div>
              <div className="text-sm text-gray-600">Smart Verification</div>
            </div>
            <div className="text-center animate-slide-in-right" style={{ animationDelay: '0.6s' }}>
              <div className="text-3xl font-bold text-purple-600 mb-1">⚡</div>
              <div className="text-sm text-gray-600">Real-time Feedback</div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8" data-tour="categories">
        <TabsList className="grid w-full grid-cols-7">
            {categories.map((category) => (
              <TabsTrigger key={category.value} value={category.value}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

        {/* Chains Grid */}
        {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {chains.map((chain, index) => (
        <Card
        key={chain.id}
        className="hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group animate-fade-in-up"
        style={{ animationDelay: `${index * 100}ms` }}
          onClick={() => navigate(`/chain/${chain.id}`)}
                data-tour="chain-card"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                        {chain.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
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

        {/* Empty State */}
        {!loading && chains.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <Play className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No chains found
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedCategory === 'all' 
                ? 'Be the first to create a dance chain!' 
                : `No ${selectedCategory} chains yet. Start one!`
              }
            </p>
            <Button 
              onClick={() => isLoggedIn ? navigate('/create-chain') : setShowAuthModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Chain
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}