import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthProvider';
import { 
  userServiceGetUserProfile, 
  chainServiceGetDanceChains,
  votingServiceGetTopMoves,
  type UserProfile,
  type DanceChain,
  type ChainMove
} from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '../layout/Navbar';
import { 
  User, Play, Trophy, TrendingUp, Users, Eye, 
  Plus, Calendar, Star, Award, Activity 
} from 'lucide-react';

export default function Dashboard() {
  const { userDetails } = useAuthContext();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [featuredChains, setFeaturedChains] = useState<DanceChain[]>([]);
  const [topMoves, setTopMoves] = useState<ChainMove[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const profileResponse = await userServiceGetUserProfile({});
      if (!profileResponse.data) {
        navigate('/setup-profile');
        return;
      }
      setProfile(profileResponse.data);

      // Load featured chains
      const chainsResponse = await chainServiceGetDanceChains({
        body: { category: null, limit: 6, offset: 0 }
      });
      setFeaturedChains(chainsResponse.data || []);

      // Load top moves
      const movesResponse = await votingServiceGetTopMoves({
        body: { limit: 8 }
      });
      setTopMoves(movesResponse.data || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {profile?.display_name || profile?.username}!
              </h1>
              <p className="text-gray-600 mt-1">
                Ready to create some amazing dance content?
              </p>
            </div>
            <Button 
              onClick={() => navigate('/create-chain')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Chain
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chains Created</p>
                  <p className="text-2xl font-bold text-gray-900">{profile?.total_chains_created || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Moves Submitted</p>
                  <p className="text-2xl font-bold text-gray-900">{profile?.total_moves_submitted || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Votes Received</p>
                  <p className="text-2xl font-bold text-gray-900">{profile?.total_votes_received || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Followers</p>
                  <p className="text-2xl font-bold text-gray-900">{profile?.follower_count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Your Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.avatar_path ? (
                  <img src={profile.avatar_path} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {profile?.display_name || profile?.username}
                </h3>
                <p className="text-gray-600 mb-2">@{profile?.username}</p>
                {profile?.bio && (
                  <p className="text-gray-700 mb-3">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {profile?.dance_styles?.split(',').map((style, index) => (
                    <Badge key={index} variant="outline">
                      {style.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={() => navigate(`/user/${profile?.username}`)}
              >
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="featured" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="featured">Featured Chains</TabsTrigger>
            <TabsTrigger value="trending">Trending Moves</TabsTrigger>
          </TabsList>

          {/* Featured Chains */}
          <TabsContent value="featured">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Featured Dance Chains</span>
                </CardTitle>
                <CardDescription>
                  Popular chains from the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredChains.map((chain) => (
                    <Card 
                      key={chain.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/chain/${chain.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{chain.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {chain.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {chain.category}
                          </Badge>
                          <span>{chain.current_move_count}/{chain.max_moves} moves</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{chain.total_views || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{chain.total_votes || 0}</span>
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {featuredChains.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No featured chains yet. Be the first to create one!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trending Moves */}
          <TabsContent value="trending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Trending Moves</span>
                </CardTitle>
                <CardDescription>
                  Most popular moves across all chains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topMoves.map((move) => (
                    <Card key={move.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                            <video 
                              src={move.video_path}
                              className="w-full h-full object-cover"
                              muted
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              Move #{move.move_number}
                            </p>
                            <p className="text-sm text-gray-600">
                              {move.duration_seconds.toFixed(1)}s
                            </p>
                            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                <span>{move.votes_up || 0}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{move.views || 0}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {topMoves.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No trending moves yet. Start creating to be featured!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}