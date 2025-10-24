import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthProvider';
import { userServiceCreateUserProfile, userServiceGetUserProfile } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedHeader, EnhancedLoading } from '@/components/ui';
import { User, Camera, MapPin, Music } from 'lucide-react';

export default function ProfileSetup() {
  const { userDetails } = useAuthContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    location: '',
    danceStyles: ''
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const popularStyles = [
    'Hip-Hop', 'Contemporary', 'Breakdance', 'Freestyle', 'Pop', 'Latin',
    'Jazz', 'Ballet', 'Salsa', 'Krumping', 'House', 'Voguing'
  ];

  useEffect(() => {
    checkExistingProfile();
    
    // Auto-populate form with Base Account data if available
    if (userDetails?.address) {
      // Use the first 8 characters of the address as default username
      const defaultUsername = userDetails.address.slice(0, 8);
      setFormData(prev => ({
        ...prev,
        username: prev.username || defaultUsername,
        displayName: prev.displayName || `User ${defaultUsername}`
      }));
    }
  }, [userDetails]);

  const checkExistingProfile = async () => {
    try {
      const response = await userServiceGetUserProfile({});
      if (response.data) {
        // User already has a profile, redirect to home
        navigate('/');
      }
    } catch (error) {
      // No profile exists, stay on setup page
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDanceStyle = (style: string) => {
    const currentStyles = formData.danceStyles.split(',').map(s => s.trim()).filter(s => s);
    const styleIndex = currentStyles.indexOf(style);
    
    if (styleIndex >= 0) {
      currentStyles.splice(styleIndex, 1);
    } else {
      currentStyles.push(style);
    }
    
    setFormData(prev => ({ ...prev, danceStyles: currentStyles.join(', ') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append('username', formData.username);
      if (formData.displayName) submitData.append('display_name', formData.displayName);
      if (formData.bio) submitData.append('bio', formData.bio);
      if (formData.location) submitData.append('location', formData.location);
      if (formData.danceStyles) submitData.append('dance_styles', formData.danceStyles);
      if (avatar) submitData.append('avatar', avatar);

      await userServiceCreateUserProfile({
        body: {
          username: formData.username,
          display_name: formData.displayName || null,
          bio: formData.bio || null,
          location: formData.location || null,
          dance_styles: formData.danceStyles || null,
          avatar: avatar || null
        }
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      setError(error.response?.data?.detail || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EnhancedLoading message="Checking profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <EnhancedHeader
          title="Complete Your Profile"
          subtitle="Set up your dancer profile to start creating and joining chains"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>
              This information will be visible to other dancers in the community
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Avatar Upload */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Click to upload avatar</p>
              </div>

              {/* Username */}
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Choose a unique username"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be your unique identifier on the platform
                </p>
                {userDetails?.address && !formData.username && (
                  <p className="text-xs text-blue-500 mt-1">
                    Auto-filled from your Base Account address: {userDetails.address.slice(0, 8)}...
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="How you'd like to be known"
                  className="mt-1"
                />
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell the community about yourself..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </Label>
                <Input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Country"
                  className="mt-1"
                />
              </div>

              {/* Dance Styles */}
              <div>
                <Label className="flex items-center space-x-1 mb-3">
                  <Music className="h-4 w-4" />
                  <span>Dance Styles</span>
                </Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {popularStyles.map((style) => {
                    const isSelected = formData.danceStyles.split(',').map(s => s.trim()).includes(style);
                    return (
                      <Badge
                        key={style}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => toggleDanceStyle(style)}
                      >
                        {style}
                      </Badge>
                    );
                  })}
                </div>
                <Input
                  type="text"
                  value={formData.danceStyles}
                  onChange={(e) => handleInputChange('danceStyles', e.target.value)}
                  placeholder="Or type custom styles (comma-separated)"
                  className="mt-1"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                disabled={loading || !formData.username.trim()}
              >
                {loading ? 'Creating Profile...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}