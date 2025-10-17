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

@authenticated
def get_user_profile(user: User) -> Optional[UserProfile]:
    """Get the current user's profile."""
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

@authenticated
def create_user_profile(user: User, username: str, display_name: Optional[str] = None, 
                       bio: Optional[str] = None, avatar: Optional[MediaFile] = None,
                       location: Optional[str] = None, dance_styles: Optional[str] = None) -> UserProfile:
    """Create a user profile for the authenticated user."""
    
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
        # Store on S3 (existing functionality)
        avatar_path = save_to_bucket(avatar, f"avatars/{user.id}_{avatar.mime_type.split('/')[-1]}")
        
        # Also store on IPFS for decentralized access
        try:
            avatar_cid = store_media_file(avatar)
            if avatar_cid:
                print(f"Avatar stored on IPFS with CID: {avatar_cid}")
        except Exception as e:
            # Log the error but don't fail the profile creation
            print(f"Warning: Failed to store avatar on IPFS: {e}")
    
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
        print(f"Warning: Failed to store profile on Tableland: {e}")
    
    # Generate presigned URL for avatar if it exists
    if profile.avatar_path:
        profile.avatar_path = generate_presigned_url(profile.avatar_path)
    
    return profile

@authenticated
def update_user_profile(user: User, display_name: Optional[str] = None,
                       bio: Optional[str] = None, avatar: Optional[MediaFile] = None,
                       location: Optional[str] = None, dance_styles: Optional[str] = None) -> UserProfile:
    """Update the current user's profile."""
    profile = get_user_profile(user)
    if not profile:
        raise ValueError("User profile not found")
    
    # Handle avatar update
    avatar_cid = None
    if avatar:
        # Store on S3 (existing functionality)
        avatar_path = save_to_bucket(avatar, f"avatars/{user.id}_{avatar.mime_type.split('/')[-1]}")
        profile.avatar_path = avatar_path
        
        # Also store on IPFS for decentralized access
        try:
            avatar_cid = store_media_file(avatar)
            if avatar_cid:
                print(f"Avatar stored on IPFS with CID: {avatar_cid}")
        except Exception as e:
            # Log the error but don't fail the profile update
            print(f"Warning: Failed to store avatar on IPFS: {e}")
    
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
                display_name=profile.display_name,
                bio=profile.bio,
                avatar_cid=avatar_cid,
                location=profile.location,
                dance_styles=profile.dance_styles,
                private_key=private_key
            )
    except Exception as e:
        # Log the error but don't fail the profile update
        print(f"Warning: Failed to update profile on Tableland: {e}")
    
    # Generate presigned URL for avatar
    if profile.avatar_path:
        profile.avatar_path = generate_presigned_url(profile.avatar_path)
    
    return profile

@public
def get_public_user_profile(username: str) -> Optional[UserProfile]:
    """Get a user's public profile by username."""
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

@public
def get_user_chains(username: str) -> List[DanceChain]:
    """Get all dance chains created by a specific user."""
    # First get the user's profile to get their user_id
    profile = get_public_user_profile(username)
    if not profile:
        return []
    
    results = DanceChain.sql(
        "SELECT * FROM dance_chains WHERE creator_id = %(creator_id)s ORDER BY created_at DESC",
        {"creator_id": profile.user_id}
    )
    
    return [DanceChain(**result) for result in results]

@public
def get_user_moves(username: str) -> List[ChainMove]:
    """Get all moves submitted by a specific user."""
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