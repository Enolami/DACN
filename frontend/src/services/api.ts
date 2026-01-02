const API_URL = 'http://localhost:8000';

export const loginUser = async (email: string, password: string) => {
    console.log("Attempting login with:", { email, password });
  try {
    const response = await fetch(`${API_URL}/accounts/api/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // LOG THE SERVER ERROR HERE
      console.error("Server Error Details:", data); 
      
      // Check for specific field errors (like "email is required")
      const errorMessage = data.non_field_errors 
        ? data.non_field_errors[0] 
        : Object.values(data).flat().join(', ');
        
      throw new Error(errorMessage || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string, fullname: string) => {
  console.log("Attempting registration with:", { email, fullname });
  try {
    const response = await fetch(`${API_URL}/accounts/api/signup/`, { // Ensure this matches your urls.py path
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Map 'fullname' to 'first_name' as expected by the Django Serializer
      body: JSON.stringify({ 
        email, 
        password, 
        first_name: fullname 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Server Error Details:", data);
      
      // Handle Django array errors (e.g. { email: ["This email is already in use."] })
      const firstErrorKey = Object.keys(data)[0];
      const errorMessage = Array.isArray(data[firstErrorKey]) 
        ? data[firstErrorKey][0] 
        : data[firstErrorKey];
        
      throw new Error(errorMessage || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
};

export const loginWithGoogle = async (accessToken: string) => {
  try {
    const response = await fetch(`${API_URL}/accounts/api/google-login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Google login failed');
    }

    return data;
  } catch (error) {
    console.error("Google Login Error:", error);
    throw error;
  }
};

export const loginWithFacebook = async (accessToken: string) => {
  try {
    const response = await fetch(`${API_URL}/accounts/api/facebook-login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Facebook login failed');
    }

    return data;
  } catch (error) {
    console.error("Facebook Login Error:", error);
    throw error;
  }
};