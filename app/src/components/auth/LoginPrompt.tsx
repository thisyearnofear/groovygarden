import { useAuthContext } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Users, Trophy, Sparkles } from 'lucide-react';

export default function LoginPrompt() {
  const { login } = useAuthContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-6">
              <Play className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-4">
            Dance Chain
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Create viral dance chains with AI-powered move verification
          </p>
          <Button 
            onClick={login}
            size="lg"
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-pink-400" />
                <CardTitle>Collaborate</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Start a dance chain or join existing ones. Each dancer adds their move to build epic sequences together.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Sparkles className="h-8 w-8 text-blue-400" />
                <CardTitle>AI Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Our AI ensures you perform all previous moves correctly before adding your own. Perfect accuracy, every time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Trophy className="h-8 w-8 text-yellow-400" />
                <CardTitle>Compete</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Vote on the best moves, climb leaderboards, and earn recognition for your creative contributions.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-white/60 mb-4">
            Join thousands of dancers creating viral content together
          </p>
          <Button 
            onClick={login}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Sign In to Start Dancing
          </Button>
        </div>
      </div>
    </div>
  );
}