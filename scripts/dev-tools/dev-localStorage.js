
    // Auto-set development localStorage values
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // Clear explicit logout flag
      localStorage.removeItem('user_explicitly_logged_out');
      
      // Set admin access flags
      localStorage.setItem('bypass_auth_check', 'true');
      localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
      localStorage.setItem('superuser_override', 'true');
      localStorage.setItem('admin_access_enabled', 'true');
      
      console.log('[DevServer] Development localStorage values set');
    }
    