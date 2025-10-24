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
import { EnhancedHeader, EnhancedLoading, EnhancedEmptyState, EnhancedStats, DanceCard } from '@/components/ui';
import Navbar from '../layout/Navbar';
import { 
  User, MapPin, Calendar, Trophy, Play, 
  Eye, TrendingUp, Users, Award, Music,
  ExternalLink, Share, Activity
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedLoading message="Loading user profile..." />
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
        <EnhancedHeader
          title={profile.display_name || profile.username}
          subtitle={`@${profile.username}`}
        >
          <div className="flex justify-center mb-6">
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </EnhancedHeader>
        
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
                {profile.verified && (
                  <Badge className="bg-blue-100 text-blue-800 mb-4">
                    ✓ Verified
                  </Badge>
                )}
                
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
            <div className="mt-8 pt-8 border-t border-gray-200">
              <EnhancedStats stats={[
                {
                  value: profile.total_chains_created || 0,
                  label: "Chains Created",
                  icon: <Play className="w-5 h-5" />,
                  color: "text-purple-600"
                },
                {
                  value: profile.total_moves_submitted || 0,
                  label: "Moves Submitted",
                  icon: <Activity className="w-5 h-5" />,
                  color: "text-pink-600"
                },
                {
                  value: profile.total_votes_received || 0,
                  label: "Votes Received",
                  icon: <Trophy className="w-5 h-5" />,
                  color: "text-blue-600"
                },
                {
                  value: profile.follower_count || 0,
                  label: "Followers",
                  icon: <Users className="w-5 h-5" />,
                  color: "text-green-600"
                }
              ]} />
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
              <EnhancedEmptyState
                title="No chains created yet"
                description="This user hasn't created any dance chains yet."
                icon={<Play className="w-8 h-8" />}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chains.map((chain) => (
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
          </TabsContent>

          {/* Submitted Moves */}
          <TabsContent value="moves" className="mt-6">
            {moves.length === 0 ? (
              <EnhancedEmptyState
                title="No moves submitted yet"
                description="This user hasn't submitted any dance moves yet."
                icon={<Award className="w-8 h-8" />}
              />
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