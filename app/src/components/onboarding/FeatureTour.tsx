import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ChevronRight, Play, Users, Zap } from 'lucide-react';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon?: React.ReactNode;
}

interface FeatureTourProps {
  isActive: boolean;
  onComplete: () => void;
  currentPage: string;
}

const tourSteps: Record<string, TourStep[]> = {
  '/': [
    {
      target: '[data-tour="search"]',
      title: 'Discover Dance Chains',
      content: 'Search for existing chains by category, creator, or keywords to find inspiration!',
      position: 'bottom',
      icon: <Play className="w-5 h-5" />
    },
    {
      target: '[data-tour="categories"]',
      title: 'Browse by Style',
      content: 'Filter chains by dance style - from hip-hop to contemporary, find your favorite!',
      position: 'bottom',
      icon: <Users className="w-5 h-5" />
    },
    {
      target: '[data-tour="create-chain"]',
      title: 'Start Your Own Chain',
      content: 'Ready to create? Click here to start your first dance chain with AI assistance!',
      position: 'bottom',
      icon: <Zap className="w-5 h-5" />
    }
  ],
  '/create-chain': [
    {
      target: '[data-tour="ai-challenge"]',
      title: 'AI-Powered Challenges',
      content: 'Let our AI generate creative, engaging challenge ideas tailored to your chosen style!',
      position: 'right',
      icon: <Zap className="w-5 h-5" />
    },
    {
      target: '[data-tour="video-recorder"]',
      title: 'Record Your Move',
      content: 'Capture your dance move with our easy-to-use video recorder. Make it count!',
      position: 'left',
      icon: <Play className="w-5 h-5" />
    }
  ],
  '/chain/': [
    {
      target: '[data-tour="sequence-play"]',
      title: 'Watch the Sequence',
      content: 'See how the chain evolves! Play through all moves in order to understand the full sequence.',
      position: 'bottom',
      icon: <Play className="w-5 h-5" />
    },
    {
      target: '[data-tour="add-move"]',
      title: 'Join the Chain',
      content: 'Ready to contribute? Add your move after watching and learning all previous moves!',
      position: 'left',
      icon: <Users className="w-5 h-5" />
    }
  ]
};

export default function FeatureTour({ isActive, onComplete, currentPage }: FeatureTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const steps = tourSteps[currentPage] || [];

  useEffect(() => {
    if (isActive && steps.length > 0) {
      setCurrentStepIndex(0);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isActive, currentPage, steps.length]);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (currentStep && isVisible) {
      const targetElement = document.querySelector(currentStep.target);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible || !currentStep) return null;

  const targetElement = document.querySelector(currentStep.target);
  const targetRect = targetElement?.getBoundingClientRect();

  if (!targetRect) return null;

  const tooltipStyles = {
    top: currentStep.position === 'bottom' ? targetRect.bottom + 10 : undefined,
    bottom: currentStep.position === 'top' ? window.innerHeight - targetRect.top + 10 : undefined,
    left: currentStep.position === 'right' ? targetRect.right + 10 :
          currentStep.position === 'left' ? targetRect.left - 320 : // Assuming tooltip width ~300px
          targetRect.left + targetRect.width / 2 - 150, // Center horizontally
    right: currentStep.position === 'left' ? window.innerWidth - targetRect.left + 10 : undefined,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleSkip}
      />

      {/* Highlight */}
      <div
        className="fixed z-45 pointer-events-none border-2 border-purple-500 rounded-lg"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Tooltip */}
      <Card className="fixed z-50 w-80 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {currentStep.icon && (
                <div className="bg-purple-100 rounded-lg p-2">
                  {currentStep.icon}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{currentStep.title}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentStepIndex ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {currentStepIndex + 1} of {steps.length}
                  </span>
                </div>
              </div>
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

          <p className="text-gray-600 text-sm mb-6">
            {currentStep.content}
          </p>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              Previous
            </Button>

            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button onClick={handleNext}>
                {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
