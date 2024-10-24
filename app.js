const CLIENT_ID = '8dd4cfb515cf4929b141f028721625b6'; // Tu Client ID
const REDIRECT_URI = 'http://localhost:5500/layout.html'; // Cambia esto a la URI de tu página principal
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';

const SCOPES = 'user-read-private user-read-email';
const AUTH_URL = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;

// Manejo de eventos para el botón de inicio de sesión en layout.html
document.getElementById('login-btn')?.addEventListener('click', () => {
    window.location.href = AUTH_URL; // Redirige a Spotify para iniciar sesión
});

// Comprobación del token al cargar la página
if (window.location.hash) {
    const token = window.location.hash.split('&')[0].split('=')[1];
    localStorage.setItem('spotifyToken', token);
    console.log('Token guardado:', token); // Verifica el token aquí
    window.location.hash = ''; // Limpiar el hash para evitar redirecciones innecesarias
    window.location.reload(); // Recargar la página para mostrar los elementos de búsqueda
}

// Mostrar el formulario de búsqueda si hay un token
if (localStorage.getItem('spotifyToken')) {
    document.getElementById('artist-search').style.display = 'block'; // Mostrar el formulario de búsqueda
    displayUserProfile(); // Mostrar el perfil del usuario
}

// Función para obtener y mostrar el perfil del usuario
async function displayUserProfile() {
    const token = localStorage.getItem('spotifyToken');

    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const userData = await response.json();
            
            // Mostrar el perfil del usuario en el contenedor correcto
            const userProfileDiv = document.getElementById('user-profile');
            userProfileDiv.style.display = 'block'; // Mostrar el perfil

            // Actualizar la imagen de perfil en el encabezado
            const profileImg = document.getElementById('profile-img');
            profileImg.src = userData.images[0]?.url || 'placeholder.jpg'; // Actualiza la imagen de perfil
        } else {
            console.error('Error en la respuesta de la API:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

// Función para buscar artistas y canciones
let currentAudio = null; // Variable para almacenar el audio actual
let currentButton = null; // Variable para almacenar el botón actual

document.getElementById('search-btn')?.addEventListener('click', async () => {
    const query = document.getElementById('artist-name').value;
    const token = localStorage.getItem('spotifyToken');

    // Realiza la búsqueda de artistas y canciones
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist,track`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    // Limpiar resultados previos
    const artistResultsDiv = document.getElementById('artist-results');
    const trackResultsDiv = document.getElementById('track-results');
    artistResultsDiv.innerHTML = ''; // Vacía los resultados anteriores
    trackResultsDiv.innerHTML = ''; // Vacía los resultados anteriores

    // Mostrar resultados de artistas
    if (data.artists && data.artists.items.length > 0) {
        data.artists.items.forEach(artist => {
            const artistDiv = document.createElement('div');
            artistDiv.classList.add('result-item');
            artistDiv.innerHTML = `
                <h4>${artist.name}</h4>
                <img src="${artist.images[0]?.url || 'placeholder.jpg'}" alt="${artist.name}">
            `;
            artistResultsDiv.appendChild(artistDiv);
        });
    } else {
        artistResultsDiv.innerHTML = '<p>No se encontraron artistas.</p>';
    }

    // Mostrar resultados de canciones
    if (data.tracks && data.tracks.items.length > 0) {
        data.tracks.items.forEach(track => {
            const trackDiv = document.createElement('div');
            trackDiv.classList.add('result-item');
            trackDiv.innerHTML = `
                <h4>${track.name}</h4>
                <p>${track.artists.map(artist => artist.name).join(', ')}</p>
                <img src="${track.album.images[0]?.url || 'placeholder.jpg'}" alt="${track.name}">
                <button class="favorite-btn" data-track-id="${track.id}">
                    <img src="assets/heart2.png">
                </button>
            `;

            // Añadir botón solo si hay preview_url
            if (track.preview_url) {
                trackDiv.innerHTML += `<button class="play-btn" data-url="${track.preview_url}">Reproducir</button>`;
            } else {
                trackDiv.innerHTML += `<p>Vista previa no disponible.</p>`;
            }
            trackResultsDiv.appendChild(trackDiv);

            // Manejo del evento de clic en el botón de reproducción
            trackDiv.querySelector('.play-btn')?.addEventListener('click', () => {
                if (currentAudio) {
                    currentAudio.pause();
                    if (currentButton) {
                        currentButton.textContent = 'Reproducir';
                    }
                }

                if (currentAudio && currentAudio.src === track.preview_url) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    currentAudio = null;
                    currentButton.textContent = 'Reproducir';
                } else {
                    currentAudio = new Audio(track.preview_url);
                    currentAudio.play().catch(error => {
                        console.error('Error al reproducir:', error);
                    });
                    currentButton = trackDiv.querySelector('.play-btn');
                    currentButton.textContent = 'Pausar';

                    currentAudio.addEventListener('ended', () => {
                        currentAudio = null;
                        currentButton.textContent = 'Reproducir';
                    });

                    currentButton.addEventListener('click', () => {
                        if (currentAudio.paused) {
                            currentAudio.play();
                            currentButton.textContent = 'Pausar';
                        } else {
                            currentAudio.pause();
                            currentButton.textContent = 'Reproducir';
                        }
                    });
                }
            });

            // Manejo del evento de clic en el botón de "Me gusta"
            trackDiv.querySelector('.favorite-btn')?.addEventListener('click', () => {
                addToFavorites(track); // Añade a favoritos
            });
        });
    } else {
        trackResultsDiv.innerHTML = '<p>No se encontraron canciones.</p>';
    }
});

// Función para añadir una canción a la lista de favoritos
function addToFavorites(track) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    const isFavorite = favorites.some(favorite => favorite.id === track.id);
    if (!isFavorite) {
        const trackData = {
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => artist.name).join(', '),
            imageUrl: track.album.images[0]?.url || 'placeholder.jpg',
            previewUrl: track.preview_url
        };

        favorites.push(trackData);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert('Canción añadida a favoritos');
    } else {
        alert('La canción ya está en favoritos');
    }
}

// Función para cargar y mostrar los favoritos en favorites.html
/*function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoritesListDiv = document.getElementById('favorites-list');

    if (favorites.length === 0) {
        favoritesListDiv.innerHTML = '<p>No tienes canciones favoritas.</p>';
        return;
    }

    favoritesListDiv.innerHTML = ''; // Limpiar lista previa

    favorites.forEach(track => {
        const trackDiv = document.createElement('div');
        trackDiv.classList.add('result-item');
        trackDiv.innerHTML = `
            <h4>${track.name}</h4>
            <p>${track.artists}</p>
            <img src="${track.imageUrl}" alt="${track.name}">
            <button class="play-btn" data-url="${track.previewUrl}">Reproducir</button>
        `;
        favoritesListDiv.appendChild(trackDiv);

        trackDiv.querySelector('.play-btn')?.addEventListener('click', () => {
            const audio = new Audio(track.previewUrl);
            audio.play();
        });
    });
}*/

// Función para cargar y mostrar las canciones favoritas
function loadFavorites() {
    const favoritesListDiv = document.getElementById('favorites-list');
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    // Limpiar el contenedor antes de agregar elementos
    favoritesListDiv.innerHTML = '';

    if (favorites.length === 0) {
        favoritesListDiv.innerHTML = '<p>No tienes canciones favoritas.</p>';
    } else {
        favorites.forEach(track => {
            const favoriteItemDiv = document.createElement('div');
            favoriteItemDiv.classList.add('favorite-item');
            favoriteItemDiv.innerHTML = `
                <img src="${track.imageUrl}" alt="${track.name}">
                <div>
                    <h4>${track.name}</h4>
                    <p>${track.artists}</p>
                </div>
                <button class="play-btn" data-url="${track.previewUrl}">Reproducir</button>
            `;

            favoritesListDiv.appendChild(favoriteItemDiv);

            // Manejo del evento de clic en el botón de reproducción
            favoriteItemDiv.querySelector('.play-btn').addEventListener('click', () => {
                playTrack(track.previewUrl); // Implementa la función de reproducción
            });
        });
    }
}

// Función para reproducir la canción
function playTrack(previewUrl) {
    const audio = new Audio(previewUrl);
    audio.play(); // Reproducir la canción
}

// Cargar favoritos al cargar la página
window.onload = () => {
    loadFavorites(); // Cargar favoritos al inicio
};


//--------------------------------------------------------------------------

if (document.getElementById('favorites-list')) {
    loadFavorites(); // Llama a esta función en favorites.html
}

// Manejo del botón de Logout
document.getElementById('logoutButton')?.addEventListener('click', () => {
    console.log("Logout button clicked"); // Para depuración
    localStorage.removeItem('spotifyToken'); // Elimina el token
    document.getElementById('artist-search').style.display = 'none'; // Ocultar el formulario de búsqueda
    document.getElementById('user-profile').style.display = 'none'; // Ocultar el perfil del usuario
    window.location.href = 'http://localhost:5500/index.html'; // Redirige a la página de login
});

document.getElementById('profile-img').addEventListener('click', function() {
    document.getElementById("dropdown").classList.toggle("show");
  });

  // Cerrar el menú si se hace clic fuera de él
  window.onclick = function(event) {
    if (!event.target.matches('#profile-img')) {
      const dropdowns = document.getElementsByClassName("dropdown-content");
      for (let i = 0; i < dropdowns.length; i++) {
        dropdowns[i].classList.remove('show');
      }
    }
  }

document.getElementById('logo-img').addEventListener('click', () => {
    window.location.href = 'http://localhost:5500/layout.html'; // Cambia la URL según sea necesario
});

document.addEventListener('click', function(event) {
    const artistResultsDiv = document.getElementById('artist-results');
    const trackResultsDiv = document.getElementById('track-results');
    const searchWrapper = document.querySelector('.search-wrapper');

    const clickedOutsideArtist = !artistResultsDiv.contains(event.target);
    const clickedOutsideTrack = !trackResultsDiv.contains(event.target);
    const clickedOutsideSearch = !searchWrapper.contains(event.target);

    if (clickedOutsideArtist && clickedOutsideTrack && clickedOutsideSearch) {
        artistResultsDiv.innerHTML = ''; // Limpia los resultados de artistas
        trackResultsDiv.innerHTML = '';  // Limpia los resultados de canciones
    }
});
