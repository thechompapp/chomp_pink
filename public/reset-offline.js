// Reset offline mode and reload
localStorage.removeItem('offline_mode');
localStorage.removeItem('bypass_auth_check');
console.log('Offline mode and auth bypass disabled. Reloading...');
setTimeout(() => window.location.reload(), 500);
