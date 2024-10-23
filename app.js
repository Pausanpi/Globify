// Simula el proceso de logout
document.getElementById('logoutButton').addEventListener('click', function() {
	// Supongamos que almacenamos un token de autenticación en el localStorage
	localStorage.removeItem('spotifyAuthToken');  // Elimina el token
	
	// Redirige a la página de login (o simula el logout)
	alert('Has cerrado sesión.');
	window.location.href = 'login.html';  // Redirigir a la página de login
  });
  
