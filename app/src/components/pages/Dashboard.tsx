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
import { 
  User, Play, Trophy, TrendingUp, Users, Eye, 
  Plus, Calendar, Star, Award, Activity, Zap, Music, MapPin
} from 'lucide-react';
import { 
  EnhancedHeader,
  EnhancedStats,
  EnhancedCard,
  EnhancedLoading,
  EnhancedEmptyState,
  EnhancedTabs,
  DanceCard
} from '@/components/ui';
import Navbar from '../layout/Navbar';

export default function Dashboard() {
  const { userDetails } = useAuthContext();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userChains, setUserChains] = useState<DanceChain[]>([]);
  const [featuredChains, setFeaturedChains] = useState<DanceChain[]>([]);
  const [topMoves, setTopMoves] = useState<ChainMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chains');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load user profile
      const profileResponse = await userServiceGetUserProfile({});
      setProfile(profileResponse.data || null);
      
      // Load user's chains
      const chainsResponse = await chainServiceGetDanceChains({});
      setUserChains(chainsResponse.data || []);
      
      // Load featured chains (for now, just use all chains)
      setFeaturedChains(chainsResponse.data || []);
      
      // Load top moves
      const movesResponse = await votingServiceGetTopMoves({ body: { limit: 6 } });
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

  const formatDuration = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedLoading message="Loading your dashboard..." />
        </div>
      </div>
    );
  }

  const stats = [
    {
      value: profile?.total_chains_created || 0,
      label: "Chains Created",
      icon: <Play className="w-6 h-6" />,
      color: "text-purple-600"
    },
    {
      value: profile?.total_moves_submitted || 0,
      label: "Moves Submitted",
      icon: <Activity className="w-6 h-6" />,
      color: "text-pink-600"
    },
    {
      value: profile?.total_votes_received || 0,
      label: "Votes Received",
      icon: <Trophy className="w-6 h-6" />,
      color: "text-blue-600"
    }
  ];

  const tabs = [
    {
      id: 'chains',
      label: `My Chains (${userChains.length})`,
      content: (
        <div className="space-y-6">
          {userChains.length === 0 ? (
            <EnhancedCard className="col-span-full">
              <EnhancedEmptyState
                title="No chains yet"
                description="Create your first dance chain to get started. Your chains will appear here."
                icon={<Play className="w-8 h-8" />}
                action={{
                  label: "Create New Chain",
                  onClick: () => navigate('/create-chain')
                }}
              />
            </EnhancedCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userChains.map((chain) => (
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
        </div>
      )
    },
    {
      id: 'moves',
      label: `Top Moves (${topMoves.length})`,
      content: (
        <div className="space-y-6">
          {topMoves.length === 0 ? (
            <EnhancedCard className="col-span-full">
              <EnhancedEmptyState
                title="No moves yet"
                description="Submit moves to dance chains to see them here. Your top-rated moves will appear in this section."
                icon={<Activity className="w-8 h-8" />}
              />
            </EnhancedCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topMoves.map((move) => (
                <EnhancedCard
                  key={move.id}
                  title={`Move #${move.move_number}`}
                  description={move.chain?.title}
                  icon={<Activity className="w-5 h-5" />}
                >
                  <div className="space-y-4">
                    {/* Video Preview */}
                    <div className="bg-black rounded-lg aspect-video overflow-hidden">
                      <video 
                        src={move.video_path}
                        className="w-full h-full object-cover"
                        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23000'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='12'%3EMove %23{move.move_number}%3C/text%3E%3C/svg%3E"
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
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{(move.votes_up || 0) - (move.votes_down || 0)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{move.views || 0} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="w-4 h-4 text-purple-500" />
                        <span>{Math.round((move.verification_score || 0) * 100)}% verified</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(move.created_at || '')}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/chain/${move.chain_id}`)}
                      className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      View Chain
                    </button>
                  </div>
                </EnhancedCard>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'explore',
      label: `Explore (${featuredChains.length})`,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredChains.map((chain) => (
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
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <EnhancedHeader
          title={`Welcome back, ${profile?.display_name || userDetails?.email?.split('@')[0] || 'Dancer'}! 🎭`}
          subtitle="Ready to create your next viral dance chain or explore what's trending in the community?"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <button
              onClick={() => navigate('/create-chain')}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Chain
            </button>
            <button
              onClick={() => navigate('/search')}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
            >
              <Zap className="w-5 h-5 mr-2" />
              Explore Chains
            </button>
          </div>
        </EnhancedHeader>
        
        {/* Stats Cards */}
        <EnhancedCard className="mb-8">
          <div className="p-6">
            <EnhancedStats stats={stats} />
          </div>
        </EnhancedCard>
        
        {/* User Profile Summary */}
        {profile && (
          <EnhancedCard 
            title="Your Profile" 
            description="Your dancer profile information"
            icon={<User className="w-5 h-5" />}
            className="mb-8"
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {profile.avatar_path ? (
                    <img src={profile.avatar_path} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{profile.display_name || profile.username}</h3>
                  <p className="text-gray-600">@{profile.username}</p>
                </div>
              </div>
              
              {profile.bio && (
                <p className="text-gray-700">{profile.bio}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.dance_styles && (
                  <div className="flex items-center space-x-1">
                    <Music className="w-4 h-4" />
                    <span>{profile.dance_styles}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(profile.created_at || '')}</span>
                </div>
              </div>
            </div>
          </EnhancedCard>
        )}
        
        {/* Tabbed Content */}
        <EnhancedTabs 
          tabs={tabs} 
          defaultTab="chains"
        />
      </div>
    </div>
  );
}