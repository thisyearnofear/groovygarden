import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  userServiceGetPublicUserProfile,
  userServiceGetUserChains,
  userServiceGetUserMoves,
  type UserProfile,
  type DanceChain,
  type ChainMove
} from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '../layout/Navbar';
import { 
  User, MapPin, Calendar, Trophy, Play, 
  Eye, TrendingUp, Users, Award, Music,
  ExternalLink, Share
} from 'lucide-react';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [chains, setChains] = useState<DanceChain[]>([]);
  const [moves, setMoves] = useState<ChainMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chains');

  useEffect(() => {
    if (username) {
      loadUserData();
    }
  }, [username]);

  const loadUserData = async () => {
    if (!username) return;
    
    try {
      setLoading(true);
      
      // Load user profile
      const profileResponse = await userServiceGetPublicUserProfile({
        body: { username }
      });
      
      if (!profileResponse.data) {
        setError('User not found');
        return;
      }
      
      setProfile(profileResponse.data);
      
      // Load user's chains
      const chainsResponse = await userServiceGetUserChains({
        body: { username }
      });
      setChains(chainsResponse.data || []);
      
      // Load user's moves
      const movesResponse = await userServiceGetUserMoves({
        body: { username }
      });
      setMoves(movesResponse.data || []);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>{error || 'User not found'}</AlertDescription>
          </Alert>
          <div className="text-center mt-6">
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.avatar_path ? (
                  <img src={profile.avatar_path} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {profile.display_name || profile.username}
                    </h1>
                    <p className="text-lg text-gray-600 mb-2">@{profile.username}</p>
                    {profile.verified && (
                      <Badge className="bg-blue-100 text-blue-800 mb-4">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Share className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
                
                {/* Bio */}
                {profile.bio && (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}
                
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  {profile.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(profile.created_at || '')}</span>
                  </div>
                </div>
                
                {/* Dance Styles */}
                {profile.dance_styles && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Music className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Dance Styles</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.dance_styles.split(',').map((style, index) => (
                        <Badge key={index} variant="outline">
                          {style.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{profile.total_chains_created || 0}</div>
                <div className="text-sm text-gray-600">Chains Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{profile.total_moves_submitted || 0}</div>
                <div className="text-sm text-gray-600">Moves Submitted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{profile.total_votes_received || 0}</div>
                <div className="text-sm text-gray-600">Votes Received</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{profile.follower_count || 0}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chains">Created Chains ({chains.length})</TabsTrigger>
            <TabsTrigger value="moves">Submitted Moves ({moves.length})</TabsTrigger>
          </TabsList>

          {/* Created Chains */}
          <TabsContent value="chains" className="mt-6">
            {chains.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No chains created yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chains.map((chain) => (
                  <Card 
                    key={chain.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/chain/${chain.id}`)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{chain.title}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {chain.description}
                          </CardDescription>
                        </div>
                        <Badge className={
                          chain.status === 'active' ? 'bg-green-100 text-green-800' :
                          chain.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {chain.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        <Badge variant="outline" className="capitalize">
                          {chain.category}
                        </Badge>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{chain.current_move_count}/{chain.max_moves}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{chain.total_views || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{chain.total_votes || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(chain.created_at || '')}</span>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${((chain.current_move_count || 1) / (chain.max_moves || 10)) * 100}%` }}
                          ></div>
                        </div>
                        
                        <Button 
                          className="w-full"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chain/${chain.id}`);
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Chain
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Submitted Moves */}
          <TabsContent value="moves" className="mt-6">
            {moves.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No moves submitted yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moves.map((move) => (
                  <Card key={move.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      {/* Video Thumbnail */}
                      <div className="bg-black rounded-lg mb-4 aspect-video overflow-hidden">
                        <video 
                          src={move.video_path}
                          className="w-full h-full object-cover cursor-pointer"
                          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23000'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='16'%3EMove %23{move.move_number}%3C/text%3E%3C/svg%3E"
                          onClick={(e) => {
                            const video = e.target as HTMLVideoElement;
                            if (video.paused) {
                              video.play();
                            } else {
                              video.pause();
                            }
                          }}
                        />
                      </div>
                      
                      {/* Move Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">Move #{move.move_number}</h4>
                            <p className="text-sm text-gray-600">{formatDuration(move.duration_seconds)}</p>
                          </div>
                          {move.verification_score && (
                            <div className="flex items-center">
                              <Award className="w-4 h-4 text-yellow-500 mr-1" />
                              <span className="text-sm text-gray-600">
                                {Math.round(move.verification_score * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span>{(move.votes_up || 0) - (move.votes_down || 0)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{move.views || 0}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {formatDate(move.created_at || '')}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => navigate(`/chain/${move.chain_id}`)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Chain
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}