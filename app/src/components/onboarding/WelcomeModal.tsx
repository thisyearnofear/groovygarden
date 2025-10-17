import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Zap, CheckCircle, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Welcome to Dance Chain! 🎉",
    subtitle: "Create viral dance sequences with AI-powered verification",
    content: (
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
          <Play className="h-10 w-10 text-white" />
        </div>
        <p className="text-gray-600 max-w-md mx-auto">
          Join the future of collaborative dance! Start chains, add moves, and watch your creations go viral with real-time AI feedback.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-lg p-3 mb-2">
              <Play className="h-6 w-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm font-medium">Start Chains</p>
            <p className="text-xs text-gray-500">Create dance sequences</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-lg p-3 mb-2">
              <Users className="h-6 w-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm font-medium">Join Others</p>
            <p className="text-xs text-gray-500">Add your unique moves</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-lg p-3 mb-2">
              <Zap className="h-6 w-6 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm font-medium">AI-Powered</p>
            <p className="text-xs text-gray-500">Smart verification & feedback</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "How It Works",
    subtitle: "3 simple steps to dance chain mastery",
    content: (
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Create Your Chain</h3>
            <p className="text-gray-600 text-sm">Start with an initial dance move. AI will help generate creative challenges!</p>
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Invite Others to Join</h3>
            <p className="text-gray-600 text-sm">Share your chain and watch as dancers from around the world add their unique moves.</p>
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Go Viral Together</h3>
            <p className="text-gray-600 text-sm">Each participant must perform all previous moves before adding theirs - creating amazing collaborative sequences!</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">AI Verification</h4>
              <p className="text-blue-700 text-sm">Our AI ensures every move is performed correctly, maintaining the integrity of your dance chain.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Ready to Dance? 💃",
    subtitle: "Let's get you started with your first chain!",
    content: (
      <div className="text-center space-y-6">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <Play className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Journey Begins Now</h3>
          <p className="text-gray-600">
            Create your first dance chain and see how the community builds upon your creativity!
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">💡 <strong>Pro Tip:</strong> Start with a simple, recognizable move that others can easily learn and build upon.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary">Hip-Hop</Badge>
            <Badge variant="secondary">Pop</Badge>
            <Badge variant="secondary">Freestyle</Badge>
            <Badge variant="secondary">Latin</Badge>
          </div>
        </div>
      </div>
    ),
  },
];

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onClose();
    navigate('/create-chain');
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep].subtitle}
            </p>
          </div>

          <div className="mb-8">
            {steps[currentStep].content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? handleSkip : handlePrevious}
              disabled={currentStep === 0}
            >
              {currentStep === 0 ? 'Skip Tour' : 'Previous'}
            </Button>

            <div className="flex space-x-2">
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  Create My First Chain
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
