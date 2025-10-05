import { Play, Settings, CircleAlert, Sparkles } from "lucide-react";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chainServiceCreateDanceChain, userServiceGetUserProfile } from '@/lib/sdk';
import { useAI } from '@/hooks/use-ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '../layout/Navbar';
import VideoRecorder from '../video/VideoRecorder';


export default function CreateChain() {
  const navigate = useNavigate();
  const { generateChallenge, loading: aiLoading, error: aiError, inferenceTimeMs } = useAI();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    maxMoves: 10
  });
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [step, setStep] = useState(1);
  const [showAISuccess, setShowAISuccess] = useState(false);

  const categories = [
    { value: 'hip-hop', label: 'Hip-Hop' },
    { value: 'contemporary', label: 'Contemporary' },
    { value: 'breakdance', label: 'Breakdance' },
    { value: 'freestyle', label: 'Freestyle' },
    { value: 'pop', label: 'Pop' },
    { value: 'latin', label: 'Latin' },
    { value: 'jazz', label: 'Jazz' },
    { value: 'ballet', label: 'Ballet' }
  ];

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const response = await userServiceGetUserProfile({});
      setHasProfile(!!response.data);
      if (!response.data) {
        navigate('/setup-profile');
      }
    } catch (error) {
      setHasProfile(false);
      navigate('/setup-profile');
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAIGenerate = async () => {
    if (!formData.category) {
      setError('Please select a category first');
      return;
    }

    try {
      setError(null);
      const difficulty = 'medium'; // Default difficulty
      const challenge = await generateChallenge(formData.category, difficulty);
      
      // Fill form with AI-generated content
      setFormData(prev => ({
        ...prev,
        title: challenge.name || prev.title,
        description: challenge.description || prev.description,
      }));
      
      setShowAISuccess(true);
      setTimeout(() => setShowAISuccess(false), 3000);
    } catch (err) {
      setError(aiError || 'Failed to generate challenge');
    }
  };

  const handleVideoRecorded = (blob: Blob) => {
    setVideoBlob(blob);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!videoBlob) {
      setError('Please record a video for your dance chain');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await chainServiceCreateDanceChain({
        body: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          max_moves: formData.maxMoves,
          video: new File([videoBlob], 'dance-move.webm', { type: 'video/webm' })
        }
      });

      if (response.data) {
        navigate(`/chain/${response.data.id}`);
      }
    } catch (error: any) {
      console.error('Error creating chain:', error);
      setError(error.response?.data?.detail || 'Failed to create dance chain. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep2 = formData.title.trim() && formData.description.trim() && formData.category;

  if (hasProfile === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create a New Dance Chain
          </h1>
          <p className="text-gray-600">
            Start a collaborative dance sequence that others can build upon
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              <Settings className="w-4 h-4" />
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              <Play className="w-4 h-4" />
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              <CircleAlert className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Step 1: Chain Details */}
        {step === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Chain Details</CardTitle>
              <CardDescription>
                Provide information about your dance chain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <CircleAlert className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {showAISuccess && inferenceTimeMs && (
                <Alert className="bg-purple-50 border-purple-200">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-900">
                    AI generated your challenge in {inferenceTimeMs}ms! ⚡
                  </AlertDescription>
                </Alert>
              )}

              {/* AI Generate Button */}
              {formData.category && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                        AI Challenge Generator
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Let AI create a catchy title and description for your {formData.category} challenge
                      </p>
                      <Button
                        type="button"
                        onClick={handleAIGenerate}
                        disabled={aiLoading || !formData.category}
                        variant="outline"
                        size="sm"
                        className="border-purple-300 hover:bg-purple-50"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {aiLoading ? 'Generating...' : 'Generate with AI'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <Label htmlFor="title">Chain Title *</Label>
                <Input
                  id="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Give your chain a catchy name"
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your chain and what makes it special"
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a dance style" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Max Moves */}
              <div>
                <Label htmlFor="maxMoves">Maximum Moves</Label>
                <Select 
                  value={formData.maxMoves.toString()} 
                  onValueChange={(value) => handleInputChange('maxMoves', parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 6, 7, 8, 9, 10, 12, 15, 20].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} moves
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Total number of moves before the chain is complete
                </p>
              </div>

              <Button 
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Next: Record Your Move
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Video Recording */}
        {step === 2 && (
          <div>
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle>Record Your Opening Move</CardTitle>
                <CardDescription>
                  This will be the first move in your dance chain. Make it memorable!
                </CardDescription>
              </CardHeader>
            </Card>
            
            <VideoRecorder 
              onVideoRecorded={handleVideoRecorded}
              maxDurationSeconds={10}
              minDurationSeconds={5}
            />
            
            <div className="text-center mt-6">
              <Button 
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back to Details
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Submit */}
        {step === 3 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Review Your Chain</CardTitle>
              <CardDescription>
                Make sure everything looks good before publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <CircleAlert className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Chain Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{formData.title}</h3>
                <p className="text-gray-600 mb-2">{formData.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {categories.find(c => c.value === formData.category)?.label}
                  </span>
                  <span>Max {formData.maxMoves} moves</span>
                </div>
              </div>

              {/* Video Preview */}
              {videoBlob && (
                <div>
                  <Label>Your Opening Move</Label>
                  <video 
                    src={URL.createObjectURL(videoBlob)}
                    controls
                    className="w-full mt-2 rounded-lg"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Re-record Video
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {loading ? 'Creating Chain...' : 'Publish Chain'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
