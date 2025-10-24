import { Play, Users, Eye, TrendingUp, Clock, Plus, ThumbsUp, ThumbsDown, Share, Flag, Award, User as UserIcon, Calendar, CirclePlay, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthProvider';
import { useAI } from '@/hooks/use-ai';
import { 
  chainServiceGetDanceChain,
  chainServiceGetChainMoves,
  chainServiceAddMoveToChain,
  votingServiceVoteOnMove,
  votingServiceGetUserVoteOnMove,
  type DanceChain,
  type ChainMove
} from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EnhancedHeader, EnhancedLoading, EnhancedEmptyState, EnhancedStats, DanceCard } from '@/components/ui';
import Navbar from '../layout/Navbar';
import VideoRecorder from '../video/VideoRecorder';


export default function ChainView() {
  const { chainId } = useParams<{ chainId: string }>();
  const { userDetails } = useAuthContext();
  const navigate = useNavigate();
  const { getCoachCommentary, loading: aiLoading, inferenceTimeMs } = useAI();
  
  const [chain, setChain] = useState<DanceChain | null>(null);
  const [moves, setMoves] = useState<ChainMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showAddMoveDialog, setShowAddMoveDialog] = useState(false);
  const [submittingMove, setSubmittingMove] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [aiCommentary, setAiCommentary] = useState<Record<string, string>>({});
  const [loadingCommentary, setLoadingCommentary] = useState<Record<string, boolean>>({});
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [sequencePlaybackIndex, setSequencePlaybackIndex] = useState(0);
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error', message: string}>>([]);

  useEffect(() => {
    if (chainId) {
      loadChainData();
    }
  }, [chainId]);

  const loadChainData = async () => {
    if (!chainId) return;
    
    try {
      setLoading(true);
      
      // Load chain details
      const chainResponse = await chainServiceGetDanceChain({
        body: { chain_id: chainId }
      });
      
      if (!chainResponse.data) {
        setError('Chain not found');
        return;
      }
      
      setChain(chainResponse.data);
      
      // Load moves
      const movesResponse = await chainServiceGetChainMoves({
        body: { chain_id: chainId }
      });
      
      setMoves(movesResponse.data || []);
      
      // Load user votes for each move
      if (userDetails) {
        const votePromises = (movesResponse.data || []).map(async (move) => {
          try {
            const voteResponse = await votingServiceGetUserVoteOnMove({
              body: { move_id: move.id! }
            });
            return { moveId: move.id!, vote: voteResponse.data?.vote_type };
          } catch {
            return { moveId: move.id!, vote: null };
          }
        });
        
        const votes = await Promise.all(votePromises);
        const votesMap = votes.reduce((acc, { moveId, vote }) => {
          if (vote) acc[moveId] = vote;
          return acc;
        }, {} as Record<string, string>);
        
        setUserVotes(votesMap);
      }
      
    } catch (error) {
      console.error('Error loading chain data:', error);
      setError('Failed to load chain data');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (moveId: string, voteType: 'up' | 'down') => {
    try {
      await votingServiceVoteOnMove({
        body: { move_id: moveId, vote_type: voteType }
      });
      
      // Update local state
      setUserVotes(prev => ({ ...prev, [moveId]: voteType }));

      // Show success notification
      showNotification('success', `Vote ${voteType === 'up' ? 'up' : 'down'} recorded!`);

      // Refresh moves to get updated vote counts
      loadChainData();
    } catch (error) {
      console.error('Error voting:', error);
      showNotification('error', 'Failed to vote. Please try again.');
    }
  };

  const handleGetAIFeedback = async (move: ChainMove) => {
    if (!move.id) return;
    
    setLoadingCommentary(prev => ({ ...prev, [move.id!]: true }));
    
    try {
      const result = await getCoachCommentary(
        move.verification_score || 0.85,
        move.duration_seconds,
        move.move_number
      );
      
      setAiCommentary(prev => ({ ...prev, [move.id!]: result.content }));
    } catch (error) {
      console.error('Error getting AI feedback:', error);
    } finally {
      setLoadingCommentary(prev => ({ ...prev, [move.id!]: false }));
    }
  };

  const handleAddMove = async (videoBlob: Blob) => {
    if (!chainId) return;
    
    setSubmittingMove(true);
    try {
      const response = await chainServiceAddMoveToChain({
        body: {
          chain_id: chainId,
          video: new File([videoBlob], 'dance-move.webm', { type: 'video/webm' })
        }
      });
      
      if (response.data) {
        setShowAddMoveDialog(false);
        showNotification('success', 'Your move has been added to the chain!');
        loadChainData(); // Refresh to show new move
      }
    } catch (error: any) {
      console.error('Error adding move:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to add move. Please try again.';
      showNotification('error', errorMessage);
    } finally {
      setSubmittingMove(false);
    }
  };

  const playAllMoves = () => {
    if (!moves.length) return;

    setIsPlayingSequence(true);
    setSequencePlaybackIndex(0);
    setCurrentVideoIndex(0);
  };

  const stopSequencePlayback = () => {
    setIsPlayingSequence(false);
    setSequencePlaybackIndex(0);
  };

  const nextInSequence = () => {
    if (!isPlayingSequence || sequencePlaybackIndex >= moves.length - 1) {
      stopSequencePlayback();
      return;
    }

    setSequencePlaybackIndex(prev => prev + 1);
    setCurrentVideoIndex(sequencePlaybackIndex + 1);
  };

  const previousInSequence = () => {
    if (sequencePlaybackIndex > 0) {
      setSequencePlaybackIndex(prev => prev - 1);
      setCurrentVideoIndex(sequencePlaybackIndex - 1);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
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
          <EnhancedLoading message="Loading dance chain..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedEmptyState
            title="Error loading chain"
            description={error}
            icon={<AlertCircle className="w-8 h-8" />}
            action={{
              label: "Go Back",
              onClick: () => navigate(-1)
            }}
          />
        </div>
      </div>
    );
  }

  if (!chain) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedEmptyState
            title="Chain Not Found"
            description="The dance chain you're looking for doesn't exist or has been removed."
            icon={<AlertCircle className="w-8 h-8" />}
            action={{
              label: "Go Home",
              onClick: () => navigate('/')
            }}
          />
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50">
  <Navbar />

  {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`flex items-center p-4 rounded-lg shadow-lg max-w-sm ${
                notification.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedHeader
          title={chain.title}
          subtitle={chain.description}
        >
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <Badge variant="outline" className="capitalize">
              {chain.category}
            </Badge>
            <Badge className={chain.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
              {chain.status}
            </Badge>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Flag className="w-4 h-4 mr-1" />
                Report
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="w-full max-w-4xl mx-auto">
            <EnhancedStats stats={[
              {
                value: chain.current_move_count,
                label: "Moves",
                icon: <Play className="w-5 h-5" />,
                color: "text-purple-600"
              },
              {
                value: chain.total_views || 0,
                label: "Views",
                icon: <Eye className="w-5 h-5" />,
                color: "text-pink-600"
              },
              {
                value: chain.total_votes || 0,
                label: "Votes",
                icon: <TrendingUp className="w-5 h-5" />,
                color: "text-blue-600"
              },
              {
                value: chain.max_moves,
                label: "Max Moves",
                icon: <Award className="w-5 h-5" />,
                color: "text-green-600"
              }
            ]} />
          </div>
            
            {/* Progress Bar */}
            <div className="mt-6 w-full max-w-4xl mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{chain.current_move_count}/{chain.max_moves} moves</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(chain.current_move_count / chain.max_moves) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Dance Moves</span>
                  <div className="flex space-x-2">
                  {!isPlayingSequence ? (
                  <Button
                    onClick={playAllMoves}
                    variant="outline"
                      size="sm"
                  >
                    <CirclePlay className="w-4 h-4 mr-1" />
                      Play Sequence
                      </Button>
                    ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:space-x-2">
                    <div className="flex items-center space-x-2">
                    <Button
                      onClick={previousInSequence}
                      variant="outline"
                      size="sm"
                        disabled={sequencePlaybackIndex === 0}
                      className="min-w-[80px]"
                      >
                        Previous
                    </Button>
                      <Badge variant="secondary" className="px-3 py-1 min-w-[60px] text-center">
                        {sequencePlaybackIndex + 1} / {moves.length}
                    </Badge>
                    <Button
                      onClick={nextInSequence}
                      variant="outline"
                        size="sm"
                      disabled={sequencePlaybackIndex >= moves.length - 1}
                        className="min-w-[60px]"
                      >
                      Next
                    </Button>
                    </div>
                    <Button
                    onClick={stopSequencePlayback}
                      variant="outline"
                        size="sm"
                          className="min-w-[60px]"
                        >
                          Stop
                        </Button>
                      </div>
                    )}
                    {chain.status === 'active' && chain.current_move_count < chain.max_moves && (
                      <Dialog open={showAddMoveDialog} onOpenChange={setShowAddMoveDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                            <Plus className="w-4 h-4 mr-1" />
                            Add Move
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Add Your Move</DialogTitle>
                            <DialogDescription>
                              Record yourself performing all previous moves in sequence, then add your new move at the end.
                            </DialogDescription>
                          </DialogHeader>
                          {!submittingMove ? (
                            <VideoRecorder 
                              onVideoRecorded={handleAddMove}
                              maxDurationSeconds={30} // Longer for multiple moves
                              minDurationSeconds={10}
                            />
                          ) : (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
                              <p className="text-gray-600">Processing your move...</p>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moves.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No moves yet in this chain.</p>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {moves.map((move, index) => (
                    <Card
                    key={move.id}
                        className={`hover:shadow-md transition-all ${
                          isPlayingSequence && index === sequencePlaybackIndex
                            ? 'ring-2 ring-purple-500 shadow-lg'
                            : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          {/* Video */}
                          <div className="bg-black rounded-lg mb-4 aspect-video overflow-hidden">
                            <video 
                              src={move.video_path}
                              controls
                              className="w-full h-full object-cover"
                              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23000'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='16'%3EMove %23{move.move_number}%3C/text%3E%3C/svg%3E"
                            />
                          </div>
                          
                          {/* Move Info */}
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">Move #{move.move_number}</h4>
                              <p className="text-sm text-gray-600">{formatDuration(move.duration_seconds)}</p>
                              {move.verification_score && (
                                <div className="flex items-center mt-1">
                                  <Award className="w-3 h-3 text-yellow-500 mr-1" />
                                  <span className="text-xs text-gray-600">
                                    {Math.round(move.verification_score * 100)}% verified
                                  </span>
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {formatDate(move.created_at || '')}
                            </Badge>
                          </div>
                          
                          {/* Voting */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant={userVotes[move.id!] === 'up' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleVote(move.id!, 'up')}
                                disabled={!userDetails}
                              >
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                {move.votes_up || 0}
                              </Button>
                              <Button
                                variant={userVotes[move.id!] === 'down' ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={() => handleVote(move.id!, 'down')}
                                disabled={!userDetails}
                              >
                                <ThumbsDown className="w-3 h-3 mr-1" />
                                {move.votes_down || 0}
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Eye className="w-3 h-3" />
                              <span>{move.views || 0}</span>
                            </div>
                          </div>

                          {/* AI Coach Feedback */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            {!aiCommentary[move.id!] ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGetAIFeedback(move)}
                                disabled={loadingCommentary[move.id!]}
                                className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                <Sparkles className="w-3 h-3 mr-2" />
                                {loadingCommentary[move.id!] ? 'Getting AI feedback...' : 'Get AI Coach Feedback'}
                              </Button>
                            ) : (
                              <div className="bg-purple-50 p-3 rounded-lg">
                                <div className="flex items-start mb-2">
                                  <Sparkles className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-purple-900 mb-1">AI Coach:</p>
                                    <p className="text-sm text-gray-700">{aiCommentary[move.id!]}</p>
                                    {inferenceTimeMs && (
                                      <p className="text-xs text-purple-600 mt-2">
                                        Response time: {inferenceTimeMs}ms ⚡
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAiCommentary(prev => {
                                    const newState = { ...prev };
                                    delete newState[move.id!];
                                    return newState;
                                  })}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Dismiss
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chain Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chain Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={chain.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {chain.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-sm">{formatDate(chain.created_at || '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-sm">{formatDate(chain.updated_at || '')}</span>
                  </div>
                  {chain.featured && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Featured:</span>
                      <Badge variant="outline">⭐ Featured</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* How to Join */}
            {chain.status === 'active' && chain.current_move_count < chain.max_moves && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How to Join</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">1</div>
                      <p>Watch all existing moves carefully</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">2</div>
                      <p>Record yourself performing ALL previous moves in sequence</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">3</div>
                      <p>Add your own unique move at the end</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">4</div>
                      <p>AI will verify accuracy before accepting your submission</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chain Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Videos must be 5-30 seconds long</p>
                  <p>• Perform all previous moves accurately</p>
                  <p>• Add only one new move per submission</p>
                  <p>• Keep content appropriate and family-friendly</p>
                  <p>• No inappropriate or offensive content</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
