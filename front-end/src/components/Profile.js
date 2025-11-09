import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';

const Profile = ({ onBack }) => {
  const [profile, setProfile] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    profilePicture: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
      if (data.profilePicture) {
        setPreviewImage(data.profilePicture);
      }
    } catch (error) {
      setError('Error fetching profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Keep the File object to send to the server via FormData
      setSelectedFile(file);
      // Use a blob URL for quick preview (avoids base64 conversion)
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      // Clear any previous base64 string in profile.profilePicture
      setProfile(prev => ({
        ...prev,
        profilePicture: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      // Append text fields
      formData.append('firstName', profile.firstName || '');
      formData.append('middleName', profile.middleName || '');
      formData.append('lastName', profile.lastName || '');
      formData.append('phoneNumber', profile.phoneNumber || '');

      // If a File was selected, append it so multer saves it server-side
      if (selectedFile) {
        formData.append('profilePicture', selectedFile);
      } else if (profile.profilePicture && profile.profilePicture.startsWith('data:image')) {
        // Fallback: append base64 string so server can save it
        formData.append('profilePicture', profile.profilePicture);
      }

      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully!');
      setError('');
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError('Error updating profile');
      setSuccess('');
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <button onClick={onBack} className="back-button">
            ← Back to Dashboard
          </button>
          <h2>Edit Profile</h2>
        </div>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              <img 
                src={previewImage ? 
                  (previewImage.startsWith('data:') ? previewImage : `${API_BASE}${previewImage}`) : 
                  '/default-avatar.png'} 
                alt="Profile" 
                className="profile-picture-preview"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="profile-picture"
                className="profile-picture-input"
              />
              <label htmlFor="profile-picture" className="profile-picture-label">
                Change Picture
              </label>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="middleName">Middle Name</label>
              <input
                type="text"
                id="middleName"
                name="middleName"
                value={profile.middleName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={profile.phoneNumber}
                onChange={handleChange}
                pattern="[0-9]*"
              />
            </div>
          </div>

          <div className="profile-actions">
            <button type="submit" className="save-button">Save Changes</button>
            <button type="button" onClick={onBack} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;