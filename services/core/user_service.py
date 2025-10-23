from typing import Optional, List
from solar.access import User, authenticated, public
from solar.media import MediaFile, save_to_bucket, generate_presigned_url
from core.user_profiles import UserProfile
from core.dance_chains import DanceChain
from core.chain_moves import ChainMove
from core.tableland import store_user_profile_on_chain
from core.ipfs import store_media_file, get_ipfs_gateway_url
import uuid
import os
import logging

logger = logging.getLogger(__name__)

@authenticated
def get_user_profile(user: User) -> Optional[UserProfile]:
    """Get the current user's profile."""
    try:
        results = UserProfile.sql(
            "SELECT * FROM user_profiles WHERE user_id = %(user_id)s",
            {"user_id": user.id}
        )
        if not results:
            return None
        
        profile = UserProfile(**results[0])
        
        # Generate presigned URL for avatar if it exists
        if profile.avatar_path:
            profile.avatar_path = generate_presigned_url(profile.avatar_path)
        
        return profile
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        raise

@authenticated
def create_user_profile(user: User, username: str, display_name: Optional[str] = None, 
                       bio: Optional[str] = None, avatar: Optional[MediaFile] = None,
                       location: Optional[str] = None, dance_styles: Optional[str] = None) -> UserProfile:
    """Create a user profile for the authenticated user."""
    try:
        # Validate username format
        if not username or len(username) < 3 or len(username) > 50:
            raise ValueError("Username must be between 3 and 50 characters")
        
        # Validate other fields
        if display_name and len(display_name) > 100:
            raise ValueError("Display name must be 100 characters or less")
        
        if bio and len(bio) > 500:
            raise ValueError("Bio must be 500 characters or less")
        
        if location and len(location) > 100:
            raise ValueError("Location must be 100 characters or less")
        
        if dance_styles and len(dance_styles) > 500:
            raise ValueError("Dance styles must be 500 characters or less")
        
        # Check if profile already exists
        existing = get_user_profile(user)
        if existing:
            raise ValueError("User profile already exists")
        
        # Check if username is already taken
        username_check = UserProfile.sql(
            "SELECT id FROM user_profiles WHERE username = %(username)s",
            {"username": username}
        )
        if username_check:
            raise ValueError("Username already taken")
        
        avatar_path = None
        avatar_cid = None
        if avatar:
            # Validate file size
            if avatar.size > 10 * 1024 * 1024:  # 10MB limit
                raise ValueError("Avatar file too large (max 10MB)")
            
            # Store on S3 (existing functionality)
            avatar_path = save_to_bucket(avatar, f"avatars/{user.id}_{avatar.mime_type.split('/')[-1]}")
            
            # Also store on IPFS for decentralized access
            try:
                avatar_cid = store_media_file(avatar)
                if avatar_cid:
                    logger.info(f"Avatar stored on IPFS with CID: {avatar_cid}")
            except Exception as e:
                # Log the error but don't fail the profile creation
                logger.warning(f"Failed to store avatar on IPFS: {e}")
        
        profile = UserProfile(
            user_id=user.id,
            username=username,
            display_name=display_name,
            bio=bio,
            avatar_path=avatar_path,
            location=location,
            dance_styles=dance_styles
        )
        profile.sync()
        
        # Store profile on Tableland for immutable record
        try:
            private_key = os.getenv("TABLELAND_PRIVATE_KEY")
            if private_key:
                store_user_profile_on_chain(
                    user_id=str(user.id),
                    username=username,
                    display_name=display_name,
                    bio=bio,
                    avatar_cid=avatar_cid,
                    location=location,
                    dance_styles=dance_styles,
                    private_key=private_key
                )
        except Exception as e:
            # Log the error but don't fail the profile creation
            logger.warning(f"Failed to store profile on Tableland: {e}")
        
        # Generate presigned URL for avatar if it exists
        if profile.avatar_path:
            profile.avatar_path = generate_presigned_url(profile.avatar_path)
        
        return profile
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error creating user profile: {str(e)}")
        raise

@authenticated
def update_user_profile(user: User, display_name: Optional[str] = None,
                       bio: Optional[str] = None, avatar: Optional[MediaFile] = None,
                       location: Optional[str] = None, dance_styles: Optional[str] = None) -> UserProfile:
    """Update the current user's profile."""
    try:
        profile = get_user_profile(user)
        if not profile:
            raise ValueError("User profile not found")
        
        # Validate fields
        if display_name and len(display_name) > 100:
            raise ValueError("Display name must be 100 characters or less")
        
        if bio and len(bio) > 500:
            raise ValueError("Bio must be 500 characters or less")
        
        if location and len(location) > 100:
            raise ValueError("Location must be 100 characters or less")
        
        if dance_styles and len(dance_styles) > 500:
            raise ValueError("Dance styles must be 500 characters or less")
        
        # Validate and handle avatar update
        avatar_cid = None
        if avatar:
            # Validate file size
            if avatar.size > 10 * 1024 * 1024:  # 10MB limit
                raise ValueError("Avatar file too large (max 10MB)")
            
            # Store on S3 (existing functionality)
            avatar_path = save_to_bucket(avatar, f"avatars/{user.id}_{avatar.mime_type.split('/')[-1]}")
            profile.avatar_path = avatar_path
            
            # Also store on IPFS for decentralized access
            try:
                avatar_cid = store_media_file(avatar)
                if avatar_cid:
                    logger.info(f"Avatar stored on IPFS with CID: {avatar_cid}")
            except Exception as e:
                # Log the error but don't fail the profile update
                logger.warning(f"Failed to store avatar on IPFS: {e}")
        
        # Update fields
        if display_name is not None:
            profile.display_name = display_name
        if bio is not None:
            profile.bio = bio
        if location is not None:
            profile.location = location
        if dance_styles is not None:
            profile.dance_styles = dance_styles
        
        profile.sync()
        
        # Store updated profile on Tableland for immutable record
        try:
            private_key = os.getenv("TABLELAND_PRIVATE_KEY")
            if private_key:
                store_user_profile_on_chain(
                    user_id=str(user.id),
                    username=profile.username,
                    display_name=display_name,
                    bio=profile.bio,
                    avatar_cid=avatar_cid,
                    location=profile.location,
                    dance_styles=profile.dance_styles,
                    private_key=private_key
                )
        except Exception as e:
            # Log the error but don't fail the profile update
            logger.warning(f"Failed to update profile on Tableland: {e}")
        
        # Generate presigned URL for avatar
        if profile.avatar_path:
            profile.avatar_path = generate_presigned_url(profile.avatar_path)
        
        return profile
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        raise

@public
def get_public_user_profile(username: str) -> Optional[UserProfile]:
    """Get a user's public profile by username."""
    try:
        # Validate username format
        if not username or len(username) < 3 or len(username) > 50:
            raise ValueError("Invalid username format")
        
        results = UserProfile.sql(
            "SELECT * FROM user_profiles WHERE username = %(username)s",
            {"username": username}
        )
        if not results:
            return None
        
        profile = UserProfile(**results[0])
        
        # Generate presigned URL for avatar if it exists
        if profile.avatar_path:
            profile.avatar_path = generate_presigned_url(profile.avatar_path)
        
        return profile
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Error getting public user profile: {str(e)}")
        raise

@public
def get_user_chains(username: str) -> List[DanceChain]:
    """Get all dance chains created by a specific user."""
    try:
        # Validate username format
        if not username or len(username) < 3 or len(username) > 50:
            raise ValueError("Invalid username format")
        
        # First get the user's profile to get their user_id
        profile = get_public_user_profile(username)
        if not profile:
            return []
        
        results = DanceChain.sql(
            "SELECT * FROM dance_chains WHERE creator_id = %(creator_id)s ORDER BY created_at DESC",
            {"creator_id": profile.user_id}
        )
        
        return [DanceChain(**result) for result in results]
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Error getting user chains: {str(e)}")
        raise

@public
def get_user_moves(username: str) -> List[ChainMove]:
    """Get all moves submitted by a specific user."""
    try:
        # Validate username format
        if not username or len(username) < 3 or len(username) > 50:
            raise ValueError("Invalid username format")
        
        # First get the user's profile to get their user_id
        profile = get_public_user_profile(username)
        if not profile:
            return []
        
        results = ChainMove.sql(
            "SELECT * FROM chain_moves WHERE user_id = %(user_id)s ORDER BY created_at DESC",
            {"user_id": profile.user_id}
        )
        
        moves = []
        for result in results:
            move = ChainMove(**result)
            # Generate presigned URL for video
            move.video_path = generate_presigned_url(move.video_path)
            moves.append(move)
        
        return moves
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Error getting user moves: {str(e)}")
        raise