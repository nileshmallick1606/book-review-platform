import React, { useState } from 'react';
import { User } from '../../types';
import userService from '../../services/userService';
import { useAuth } from '../../store';

interface EditProfileFormProps {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ user, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    location: user.location || '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: authUser } = useAuth();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await userService.updateProfile(user.id, formData);
      // Update auth context with the updated user info
      if (authUser) {
        const updatedProfile = await userService.getUserProfile(user.id);
        // We need to manually update the auth context here, but for now we'll just
        // show a success message and let the profile refetch
      }
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form className="edit-profile-form" onSubmit={handleSubmit}>
      <h2>Edit Profile</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="location">Location</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="form-control"
        />
      </div>
      
      <div className="form-actions">
        <button 
          type="submit" 
          className="save-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
        <button 
          type="button" 
          className="cancel-button" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;
