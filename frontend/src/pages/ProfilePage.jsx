import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/authService'; // Use named exports

function ProfilePage() {
  const { currentUser, updateUserInContext } = useAuth(); // Get updateUserInContext
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // For initial fetch
  const [error, setError] = useState(null); // For API errors on fetch

  // States for edit form
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    city: '',
    pincode: '',
    general_availability: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [updateApiError, setUpdateApiError] = useState(''); // For API errors on update
  const [updateApiSuccess, setUpdateApiSuccess] = useState(''); // For API success on update
  const [isUpdating, setIsUpdating] = useState(false); // For update loading state


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setUpdateApiError(''); // Clear previous update errors
        setUpdateApiSuccess(''); // Clear previous update success messages
        const data = await authService.getProfile();
        setProfileData(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch profile. Please try logging out and in again.');
        console.error("Fetch profile error:", err);
        setProfileData(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchProfile();
    } else {
      setError("Not authenticated. Please login.");
      setIsLoading(false);
    }
  }, [currentUser]);

  // Effect to initialize formData when profileData is loaded and user enters editing mode
  useEffect(() => {
    if (profileData && isEditing) {
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        bio: profileData.bio || '',
        city: profileData.city || '',
        pincode: profileData.pincode || '',
        general_availability: profileData.general_availability || '',
      });
      setFormErrors({}); // Clear previous form errors
      setUpdateApiError(''); // Clear API messages from previous attempts
      setUpdateApiSuccess('');
    }
  }, [profileData, isEditing]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) { // If was editing, now cancelling
      setFormErrors({}); 
      setUpdateApiError('');
      setUpdateApiSuccess('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    const { first_name, last_name, bio, city, pincode, general_availability } = formData;

    if (first_name && (!/^[A-Za-z\s]{1,50}$/.test(first_name))) {
        newErrors.first_name = 'First name must be 1-50 alphabetic characters or spaces.';
    }
    if (last_name && (!/^[A-Za-z\s]{1,50}$/.test(last_name))) {
        newErrors.last_name = 'Last name must be 1-50 alphabetic characters or spaces.';
    }
    if (bio && bio.length > 500) {
        newErrors.bio = 'Bio must be max 500 characters.';
    }
    if (city && city.length > 100) {
        newErrors.city = 'City must be max 100 characters.';
    }
    if (pincode && !/^\d{6}$/.test(pincode)) {
        newErrors.pincode = 'Pincode must be 6 digits.';
    }
    if (general_availability && general_availability.length > 255) {
        newErrors.general_availability = 'General availability must be max 255 characters.';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setUpdateApiError('');
    setUpdateApiSuccess('');
    setFormErrors({});


    if (!validateForm()) {
      console.log('Form has validation errors.');
      return;
    }

    // Check if any field has actually changed from profileData
    let changed = false;
    const fieldsToUpdate = {};
    for (const key in formData) {
      // Ensure that we only include fields that are part of the editable set
      if (Object.prototype.hasOwnProperty.call(formData, key)) {
        if (formData[key] !== (profileData[key] || '')) { 
          changed = true;
        }
        // Backend expects only provided fields or all fields.
        // For this implementation, we send all fields from the form.
        fieldsToUpdate[key] = formData[key]; 
      }
    }

    if (!changed) {
      setUpdateApiSuccess("No changes detected to save."); // Or setFormErrors({ general: "No changes detected." });
      setIsEditing(false); // Optionally exit edit mode even if no changes
      return;
    }
    
    setIsUpdating(true);
    try {
      // Send only the fields that are part of the formData state
      const response = await authService.updateProfile(fieldsToUpdate);
      
      // Assuming response.user contains the full updated user object
      setProfileData(response.user); 
      updateUserInContext(response.user); 
      setUpdateApiSuccess(response.message || "Profile updated successfully!");
      setIsEditing(false); // Exit editing mode
    } catch (err) {
      // Handle field-specific errors from backend if available
      if (err.errors && err.errors.length > 0) {
        const backendErrors = {};
        err.errors.forEach(e => {
            backendErrors[e.field || 'general'] = e.message;
        });
        setFormErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
      }
      setUpdateApiError(err.message || "Failed to update profile.");
      console.error("Update profile error:", err);
    } finally {
      setIsUpdating(false);
    }
  };


  if (isLoading) {
    return <div>Loading profile data...</div>;
  }

  if (error && !profileData) { // Show initial fetch error only if no profile data is available
    return <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>Error: {error}</div>;
  }

  return (
    <div>
      <h1>User Profile</h1>
      {currentUser && <p>Viewing profile for: {profileData?.username || currentUser.username}</p>}
      
      {updateApiSuccess && !isEditing && <p style={{ color: 'green', border: '1px solid green', padding: '10px' }}>{updateApiSuccess}</p>}
      {updateApiError && !isEditing && <p style={{ color: 'red', border: '1px solid red', padding: '10px' }}>{updateApiError}</p>}


      {profileData && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h2>View Profile Section</h2>
          <p><strong>User ID:</strong> {profileData.user_id}</p>
          <p><strong>Username:</strong> {profileData.username}</p>
          <p><strong>Email:</strong> {profileData.email}</p>
          <p><strong>First Name:</strong> {profileData.first_name || 'Not set'}</p>
          <p><strong>Last Name:</strong> {profileData.last_name || 'Not set'}</p>
          <p><strong>Bio:</strong> {profileData.bio || 'Not set'}</p>
          <p><strong>City:</strong> {profileData.city || 'Not set'}</p>
          <p><strong>Pincode:</strong> {profileData.pincode || 'Not set'}</p>
          <p><strong>General Availability:</strong> {profileData.general_availability || 'Not set'}</p>
          <p><strong>SphereCredit Balance:</strong> {profileData.sphere_credit_balance !== undefined ? profileData.sphere_credit_balance : 'N/A'}</p>
          <p><strong>Average Rating:</strong> {profileData.avg_rating !== null ? Number(profileData.avg_rating).toFixed(1) : 'Not rated yet'}</p>
          <p><strong>Total Reviews:</strong> {profileData.total_reviews_received !== undefined ? profileData.total_reviews_received : '0'}</p>
          <p><strong>Status:</strong> {profileData.status}</p>
          <p><strong>Joined:</strong> {new Date(profileData.created_at).toLocaleDateString()}</p>
          <p><strong>Last Updated:</strong> {new Date(profileData.updated_at).toLocaleString()}</p>
          {!isEditing && <button onClick={handleEditToggle} style={{marginTop: '10px'}}>Edit Profile</button>}
        </div>
      )}

      {isEditing && profileData && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h2>Edit Profile Section</h2>
          {updateApiError && <p style={{ color: 'red', border: '1px solid red', padding: '10px' }}>{updateApiError}</p>}
          {updateApiSuccess && <p style={{ color: 'green', border: '1px solid green', padding: '10px' }}>{updateApiSuccess}</p>}
          {formErrors.general && <p style={{ color: 'red' }}>{formErrors.general}</p>}

          <form onSubmit={handleFormSubmit}>
            <div>
              <label htmlFor="first_name">First Name:</label>
              <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} disabled={isUpdating} />
              {formErrors.first_name && <p style={{ color: 'red' }}>{formErrors.first_name}</p>}
            </div>
            <div>
              <label htmlFor="last_name">Last Name:</label>
              <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} disabled={isUpdating} />
              {formErrors.last_name && <p style={{ color: 'red' }}>{formErrors.last_name}</p>}
            </div>
            <div>
              <label htmlFor="bio">Bio:</label>
              <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows="4" disabled={isUpdating} />
              {formErrors.bio && <p style={{ color: 'red' }}>{formErrors.bio}</p>}
            </div>
            <div>
              <label htmlFor="city">City:</label>
              <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} disabled={isUpdating} />
              {formErrors.city && <p style={{ color: 'red' }}>{formErrors.city}</p>}
            </div>
            <div>
              <label htmlFor="pincode">Pincode:</label>
              <input type="text" id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} disabled={isUpdating} />
              {formErrors.pincode && <p style={{ color: 'red' }}>{formErrors.pincode}</p>}
            </div>
            <div>
              <label htmlFor="general_availability">General Availability:</label>
              <textarea id="general_availability" name="general_availability" value={formData.general_availability} onChange={handleChange} rows="3" disabled={isUpdating} />
              {formErrors.general_availability && <p style={{ color: 'red' }}>{formErrors.general_availability}</p>}
            </div>
            <div style={{marginTop: '15px'}}>
              <button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleEditToggle} style={{marginLeft: '10px'}} disabled={isUpdating}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {!profileData && !isLoading && <p>No profile data found. If you just logged in, try refreshing.</p>}
    </div>
  );
}

export default ProfilePage;
