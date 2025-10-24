import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chainServiceGetDanceChains, type DanceChain } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '../layout/Navbar';
import { Play, Users, Eye, TrendingUp, Clock, Plus, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
        <motion.div 
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full px-4 py-2 mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
        <Zap className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">AI-Powered Dance Platform</span>
        </motion.div>

        <motion.h1 
          className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Discover Amazing<br />Dance Chains
        </motion.h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Join collaborative dance sequences powered by AI. Start chains, add moves, and watch your creations go viral with real-time verification.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
              style={{ touchAction: 'manipulation' }}
            >
            <Button
              onClick={() => isLoggedIn ? navigate('/create-chain') : setShowAuthModal(true)}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 text-lg min-h-[48px] shadow-lg hover:shadow-xl transition-all duration-300"
              data-tour="create-chain"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                <Plus className="w-5 h-5" />
              </motion.div>
              Create New Chain
            </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.querySelector('[data-tour="categories"]')?.scrollIntoView({ behavior: 'smooth' })}
              className="focus-enhanced px-8 py-4 text-lg min-h-[48px] touch-manipulation"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <Play className="w-5 h-5 mr-2" />
              </motion.div>
              Explore Chains
            </Button>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <motion.div 
                className="text-3xl font-bold text-purple-600 mb-1"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 2 }}
              >
                ∞
              </motion.div>
              <motion.div 
                className="text-sm text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                Dance Chains Created
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <motion.div 
                className="text-3xl font-bold text-pink-600 mb-1"
                animate={{ 
                  scale: [1, 1.2, 1],
                  textShadow: [
                    "0 0 0px rgba(236, 72, 153, 0)",
                    "0 0 10px rgba(236, 72, 153, 0.5)",
                    "0 0 0px rgba(236, 72, 153, 0)"
                  ]
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 3 }}
              >
                AI
              </motion.div>
              <motion.div 
                className="text-sm text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                Smart Verification
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              <motion.div 
                className="text-3xl font-bold text-purple-600 mb-1"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.15, 1],
                  filter: [
                    "brightness(1)",
                    "brightness(1.2)",
                    "brightness(1)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 4 }}
              >
                ⚡
              </motion.div>
              <motion.div 
                className="text-sm text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
              >
                Real-time Feedback
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8" data-tour="categories">
        <TabsList className="grid w-full grid-cols-7 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
            {categories.map((category, index) => (
              <motion.div
                key={category.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.1 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                style={{ touchAction: 'manipulation' }}
              >
              <TabsTrigger 
                value={category.value}
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 hover:bg-gray-100"
              >
                {selectedCategory === category.value && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-md"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{category.label}</span>
              </TabsTrigger>
              </motion.div>
            ))}
          </TabsList>
        </Tabs>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
              <Card className="overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <motion.div 
                        className="h-4 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 rounded"
                        animate={{ 
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                          opacity: [0.6, 1, 0.6]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ 
                          width: '75%',
                          backgroundSize: '200% 200%'
                        }}
                      />
                      <motion.div 
                        className="h-3 bg-gradient-to-r from-gray-200 via-purple-100 to-gray-200 rounded"
                        animate={{ 
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                        style={{ 
                          width: '50%',
                          backgroundSize: '200% 200%'
                        }}
                      />
                    </div>
                    <motion.div
                      className="w-8 h-8 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-3 h-3 bg-purple-400 rounded-full"
                      />
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Dance-themed skeleton */}
                    <motion.div 
                      className="h-20 bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 rounded-lg relative overflow-hidden"
                      animate={{ 
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      style={{ backgroundSize: '200% 200%' }}
                    >
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="w-8 h-8 bg-white/40 rounded-full flex items-center justify-center">
                          <Play className="w-4 h-4 text-purple-400" />
                        </div>
                      </motion.div>
                    </motion.div>
                    
                    <motion.div 
                      className="h-3 bg-gradient-to-r from-gray-200 via-pink-100 to-gray-200 rounded"
                      animate={{ 
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      style={{ backgroundSize: '200% 200%' }}
                    />
                    <motion.div 
                      className="h-3 bg-gradient-to-r from-purple-100 via-gray-200 to-purple-100 rounded"
                      animate={{ 
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        opacity: [0.4, 0.7, 0.4]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                      style={{ 
                        width: '85%',
                        backgroundSize: '200% 200%'
                      }}
                    />
                    
                    {/* Animated button skeleton */}
                    <motion.div 
                      className="h-10 bg-gradient-to-r from-pink-200 via-purple-200 to-pink-200 rounded-lg mt-4 relative overflow-hidden"
                      animate={{ 
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                      }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      style={{ backgroundSize: '200% 200%' }}
                    >
                      <motion.div
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white/30 rounded-full"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Chains Grid */}
        {!loading && (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
        <AnimatePresence>
        {chains.map((chain, index) => (
        <motion.div
          key={chain.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ 
            scale: 1.02, 
            y: -4,
            transition: { type: "spring", stiffness: 300, damping: 20 }
          }}
          whileTap={{ 
            scale: 0.98,
            transition: { duration: 0.1 }
          }}
          style={{ touchAction: 'manipulation' }}
        >
        <Card
          className="cursor-pointer overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-md hover:shadow-xl transition-all duration-300"
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
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                    <Button 
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chain/${chain.id}`);
                      }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                      </motion.div>
                      {chain.status === 'active' ? 'Join Chain' : 'View Chain'}
                    </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && chains.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 relative overflow-hidden"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              {/* Animated background pulse */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Play className="w-16 h-16 text-purple-600 relative z-10" />
              </motion.div>
              
              {/* Dancing particles */}
              <motion.div
                className="absolute top-2 right-2 w-3 h-3 bg-pink-400 rounded-full"
                animate={{ 
                  y: [0, -10, 0],
                  x: [0, 5, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div
                className="absolute bottom-3 left-3 w-2 h-2 bg-purple-400 rounded-full"
                animate={{ 
                  y: [0, -8, 0],
                  x: [0, -3, 0],
                  scale: [1, 1.3, 1]
                }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
              />
            </motion.div>
            
            <motion.h3 
              className="text-2xl font-bold text-gray-900 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {selectedCategory === 'all' 
                ? 'Ready to Start Dancing?' 
                : `No ${selectedCategory} chains yet!`
              }
            </motion.h3>
            
            <motion.p 
              className="text-lg text-gray-600 mb-8 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {selectedCategory === 'all' 
                ? 'Be the first to create an amazing dance chain and inspire others to join the movement!' 
                : `Start the first ${selectedCategory} chain and set the trend for this style!`
              }
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => isLoggedIn ? navigate('/create-chain') : setShowAuthModal(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mr-3"
                >
                  <Plus className="w-5 h-5" />
                </motion.div>
                {selectedCategory === 'all' ? 'Create First Chain' : `Start ${selectedCategory} Chain`}
              </Button>
            </motion.div>
            
            {/* Encouraging sub-text */}
            <motion.p 
              className="text-sm text-gray-500 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              ✨ Your creativity could inspire thousands of dancers worldwide
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
}