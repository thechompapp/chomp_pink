
# Admin Panel Access Instructions

To enable admin access in the frontend application:

1. Make sure the backend server is running
2. Open your browser developer console (F12 or Ctrl+Shift+I)
3. Run the following code in the console:

```javascript
fetch('/admin-auth.js')
  .then(response => response.text())
  .then(script => {
    eval(script);
  })
  .catch(error => {
    console.error('Error loading admin authentication script:', error);
  });
```

This will load and execute the admin authentication script, which will:
- Add the correct admin API key to all admin requests
- Enable online mode in the application
- Configure proper authentication headers

After running the script, refresh the page to see the admin panel with data.
