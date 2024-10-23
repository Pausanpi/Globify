const CLIENT_ID = '8dd4cfb515cf4929b141f028721625b6'; // Tu Client ID
const REDIRECT_URI = 'http://localhost:5500/index.html'; // Cambia esto a la URI de tu página principal
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';

const AUTH_URL = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`;

// Manejo de eventos para el botón de inicio de sesión en index.html
document.getElementById('login-btn')?.addEventListener('click', () => {
    window.location.href = AUTH_URL; // Redirige a Spotify para iniciar sesión
});

// Comprobación del token al cargar la página
if (window.location.hash) {
    const token = window.location.hash.split('&')[0].split('=')[1];
    localStorage.setItem('spotifyToken', token);
    window.location.hash = ''; // Limpiar el hash para evitar redirecciones innecesarias
    window.location.reload(); // Recargar la página para mostrar los elementos de búsqueda
}

// Mostrar el formulario de búsqueda si hay un token
if (localStorage.getItem('spotifyToken')) {
    document.getElementById('artist-search').style.display = 'block'; // Mostrar el formulario de búsqueda
    //displayUserProfile(); // Mostrar el perfil del usuario
}

// Función para obtener y mostrar el perfil del usuario
/* async function displayUserProfile() {
    const token = localStorage.getItem('spotifyToken');
    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const userData = await response.json();
    const welcomeMessage = document.createElement('div');
    welcomeMessage.innerHTML = `
        <h2>Bienvenido, ${userData.display_name}!</h2>
        <img src="${userData.images[0]?.url}" alt="Foto de perfil" style="width: 100px; border-radius: 50%;">
    `;
    document.querySelector('.main-content').insertBefore(welcomeMessage, document.getElementById('artist-search'));
} */

// Función para buscar artistas
document.getElementById('search-btn')?.addEventListener('click', async () => {
    const artistName = document.getElementById('artist-name').value;
    const token = localStorage.getItem('spotifyToken');

    const response = await fetch(`https://api.spotify.com/v1/search?q=${artistName}&type=artist`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Limpiar resultados previos

    if (data.artists.items.length > 0) {
        data.artists.items.forEach(artist => {
            const artistDiv = document.createElement('div');
            artistDiv.innerHTML = `<h3>${artist.name}</h3><img src="${artist.images[0]?.url}" alt="${artist.name}" style="width: 100px;">`;
            resultsDiv.appendChild(artistDiv);
        });
    } else {
        resultsDiv.innerHTML = '<p>No se encontraron artistas.</p>';
    }
});

// Manejo del botón de Logout
document.getElementById('logoutButton')?.addEventListener('click', () => {
    localStorage.removeItem('spotifyToken'); // Elimina el token
    document.getElementById('artist-search').style.display = 'none'; // Ocultar el formulario de búsqueda
    alert("Has cerrado sesión exitosamente."); // Mensaje opcional de cierre de sesión
	window.location.href= 'http://localhost:5500/login.html';
});

document.getElementById("search-btn").addEventListener("click", function() {
    search();
});

function checkEnter(event) {
    if (event.key === "Enter") {
        search();
    }
}

function search() {
    const query = document.getElementById("artist-name").value;
    console.log("Buscando artista:", query);
    // Aquí puedes implementar la lógica para realizar la búsqueda usando la API de Spotify
    // Por ejemplo, hacer una llamada a la API para buscar el artista
}
