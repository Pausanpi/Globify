const CLIENT_ID = '8dd4cfb515cf4929b141f028721625b6';
const REDIRECT_URI = 'http://localhost:5500/layout.html';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';

const SCOPES = 'user-read-private user-read-email'; //Permisos
const AUTH_URL = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`; //URL autentificación

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

/*------------ PERFIL Y BARRA DE BUSQUEDA ------------*/

// Función para obtener y mostrar el perfil del usuario
async function displayUserProfile() {
    const token = localStorage.getItem('spotifyToken'); // Obtener el token

    if (!token) {
        console.log("Token no disponible, no se puede obtener el perfil.");
        return;
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const userData = await response.json();
            console.log("Datos del usuario:", userData); // Imprimir datos en la consola para depuración
            renderUserProfile(userData); // Renderizar el perfil del usuario
        } else {
            console.error('Error en la respuesta de la API:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
    }
}


// Función para buscar artistas y canciones
let currentAudio = null; // Variable para almacenar el audio actual
let currentButton = null; // Variable para almacenar el botón actual

const searchBtn = document.getElementById('search-btn');
const artistInput = document.getElementById('artist-name');
const trackResultsDiv = document.getElementById('track-results');

const searchTracks = async () => {
    const query = artistInput.value; // Obtener la consulta de búsqueda
    const token = localStorage.getItem('spotifyToken');

    // Realiza la búsqueda solo de canciones
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    // Limpiar resultados previos
    trackResultsDiv.innerHTML = ''; // Vacía los resultados anteriores

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

            // Añadir botón de reproducir
            trackDiv.innerHTML += `
                <button class="play-btn" data-url="${track.preview_url || ''}" style="${track.preview_url ? '' : 'background-color: grey; cursor: not-allowed;'}" ${track.preview_url ? '' : 'disabled'}>
                    Reproducir
                </button>
            `;
            
            trackResultsDiv.appendChild(trackDiv);
            
            // Manejo del evento de clic en el botón de reproducción
            trackDiv.querySelector('.play-btn:not([disabled])')?.addEventListener('click', () => {
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
        document.getElementById('hideContainer').style.display = 'none'; // Mostrar el contenedor de favoritos
    } else {
        trackResultsDiv.innerHTML = '<p>No se encontraron canciones.</p>';
    }
};

// Añadir evento de clic al botón de búsqueda
searchBtn.addEventListener('click', searchTracks);

// Añadir evento de pulsar Enter en el campo de entrada
artistInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchTracks();
    }
});


/*------------ FAVORITOS ------------ */

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
    }
}

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
                <button class="play-btn" data-url="${track.previewUrl || ''}" style="${track.previewUrl ? '' : 'background-color: grey; cursor: not-allowed;'}" ${track.previewUrl ? '' : 'disabled'}>
                    Reproducir
                </button>
                <button class="remove-btn" data-track-id="${track.id}">
                    <img src="assets/heart2.png" alt="Quitar de favoritos" style="width: 13px; height: 13px;">
                </button>
            `;

            favoritesListDiv.appendChild(favoriteItemDiv);

            // Manejo del evento de clic en el botón de reproducción
            favoriteItemDiv.querySelector('.play-btn:not([disabled])')?.addEventListener('click', () => {
                playTrack(track.previewUrl); // Implementa la función de reproducción
            });

            // Manejo del evento de clic en el botón de quitar
            favoriteItemDiv.querySelector('.remove-btn').addEventListener('click', () => {
                removeFromFavorites(track.id);
            });
        });
    }
}

// Función para quitar una canción de la lista de favoritos
function removeFromFavorites(trackId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const updatedFavorites = favorites.filter(track => track.id !== trackId);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    loadFavorites(); // Recargar la lista de favoritos
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

// Llama a esta función en favorites.html si existe el contenedor
if (document.getElementById('favorites-list')) {
    loadFavorites(); 
}

/*------------ LOGOUT ------------*/

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


/*------------ LOGO SPOTIFY ------------*/

document.getElementById('logo-img').addEventListener('click', () => {
    window.location.href = 'http://localhost:5500/layout.html'; // Cambia la URL según sea necesario
});


/*------------ PAGINAS ------------*/

// Obtener la URL actual de la página
const currentPage = window.location.pathname;

// Aplicar la clase 'active-page' al enlace correspondiente según la página actual
if (currentPage.includes("layout.html")) {
    document.querySelector('a[href="layout.html"]').classList.add('active-page');
} else if (currentPage.includes("home.html")) {
    document.querySelector('a[href="home.html"]').classList.add('active-page');
} else if (currentPage.includes("favourites.html")) {
    document.querySelector('a[href="favourites.html"]').classList.add('active-page');
} else if (currentPage.includes("playlist.html")) {
    document.querySelector('a[href="playlist.html"]').classList.add('active-page');
}

/*------------ PERFIL DE USUARIO ------------*/

function renderUserProfile(userData) {
    const userProfileDiv = document.getElementById('user-profile');
    userProfileDiv.classList.add('loaded'); // Añadir clase loaded para la animación
    userProfileDiv.style.display = 'block'; // Mostrar el contenedor

    document.getElementById('profile-img').src = userData.images[0]?.url || 'placeholder.jpg';
    document.getElementById('user-name').textContent = userData.display_name;
    document.getElementById('user-email').textContent = userData.email;
    document.getElementById('user-country').textContent = userData.country;
}

window.onload = function() {
    if (localStorage.getItem('spotifyToken')) {
        displayUserProfile();
    }
};

function toggleProfileInfo() {
    const userInfo = document.querySelector('.user-info');
    const toggleInfo = document.getElementById('toggle-info');

    // Alterna la clase 'hidden'
    const isHidden = userInfo.classList.toggle('hidden');

    // Cambia la opacidad a 0 para desvanecer
    toggleInfo.style.opacity = '0';

    // Cambia el texto entre "..." y "X" después de la transición
    setTimeout(() => {
        toggleInfo.textContent = isHidden ? '...' : 'X';
        toggleInfo.style.opacity = '1'; // Restaura la opacidad
    }, 200); // Espera a que la opacidad se desvanezca
}


/*------------ CATEGORÍAS HOME ------------*/

const categories = [
	{ name: 'Música', image: 'https://cdns-images.dzcdn.net/images/cover/2370f31d7a02c149f2748d01c4a7d220/0x1900-000000-80-0-0.jpg'},
	{ name: 'Pódcast', image: 'https://cdns-images.dzcdn.net/images/talk/4b3edf73117166f810e2fc1ea4ded1e8/0x1900-000000-80-0-0.jpg'},
	{ name: 'Eventos en directo', image: 'https://image.ondacero.es/clipping/cmsimages02/2024/09/30/2BA5906F-FE41-4003-B99A-899F4A0452F7/sold-out-saiko-despedir-selvatic-consolidado-como-festival-verano-malaga_104.jpg?crop=3840,3840,x964,y0&width=1200&height=1200&optimize=low&format=webply'},
	{ name: 'Especialmente para ti', image: 'https://image.europafm.com/clipping/cmsimages02/2024/08/21/A4FF1E95-1AA6-4383-AD54-F69DC1DF2007/sabrina-carpenter-lanza-sexto-album-short-sweet_104.jpg?crop=858,858,x0,y0&width=1200&height=1200&optimize=low&format=webply'},
	{ name: 'Novedades', image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2d/1a/7d/2d1a7d91-587e-0ceb-d434-327bd66d9e86/075679628312.jpg/1200x1200bf-60.jpg'},
	{ name: 'Latina', image: 'https://cdns-images.dzcdn.net/images/cover/b29d1070377b784384c2456093f96a66/0x1900-000000-80-0-0.jpg'},
	{ name: 'Pop', image: 'https://ca-times.brightspotcdn.com/dims4/default/becaa9d/2147483647/strip/true/crop/3000x3000+0+0/resize/1200x1200!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2Fde%2F78%2Fd629fd914c66a25f0114a16bdba6%2Fsour-final.jpg' },
	{ name: 'Rock', image: 'https://fotografias.flooxernow.com/clipping/cmsimages02/2024/10/18/D4459191-A53C-4064-81BE-93284286A088/lenny-kravitz-actuacion-rock-rio-madrid-2012_104.jpg?crop=480,480,x107,y0&width=1200&height=1200&optimize=low&format=webply' },
	{ name: 'Jazz', image: 'https://cdns-images.dzcdn.net/images/cover/d6331a9b0c447602b6dced52ef3616ff/0x1900-000000-80-0-0.jpg' },
	{ name: 'Hip Hop', image: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/c9/89/1a/c9891a80-d618-539a-42a8-37bbbecb3300/artwork.jpg/1200x1200bb.jpg' }
];

// Función para crear dinámicamente las cajas de categorías
function createCategoryBoxes() {
	const container = document.getElementById('category-container');

	categories.forEach(category => {
		// Crear caja de categoría
		const categoryBox = document.createElement('div');
		categoryBox.classList.add('category-box');

		// Crear imagen
		const img = document.createElement('img');
		img.src = category.image;
		img.alt = category.name;

		// Crear título
		const title = document.createElement('div');
		title.classList.add('category-title');
		title.textContent = category.name;

		// Añadir imagen y título a la caja
		categoryBox.appendChild(img);
		categoryBox.appendChild(title);

		// Añadir la caja al contenedor
		container.appendChild(categoryBox);
	});
}

// Ejecutar función al cargar la página
window.onload = createCategoryBoxes;


/*------------ TOP TRACKS ------------*/
const token = 'BQBOAg4KJI76yROYKz3sQDRgz0dDpBZHJfAp6dM5N8zQLcgd-mCTeXiuQbgFDOIIKSbAmmmvMYLQZDSDrKVFE75UssCOYZrSCPRYMM6t8Zknc4KQ9zHTWnGkXdnlTOsWOOXX8ay4YK4PrsnQhyZetRnM6ZBQiprK9LbuMcKw1qHA-c9jVdtOg4r2pJ78Ra1afOmnS1H4osjSBbLEXQ_1zPASa5b1qFdCaakMmQL0gtxxcV7jeGHlQsiYNrSrDrcJMzGkF_Rbag';

        async function fetchWebApi(endpoint, method, body) {
            const res = await fetch(`https://api.spotify.com/${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                method,
                body: JSON.stringify(body)
            });
            return await res.json();
        }

        async function getTopTracks() {
            // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
            return (await fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=5', 'GET')).items;
        }

        async function displayTopTracks() {
            const topTracks = await getTopTracks(); // Función que obtiene las canciones populares
            const topTracksContainer = document.getElementById('top-tracks');
        
            topTracks.forEach(track => {
                const trackItem = document.createElement('div');
                trackItem.classList.add('track-item');
        
                const trackImage = document.createElement('img');
                trackImage.src = track.album.images[0].url; // La URL de la portada
                trackImage.alt = track.name;
                trackImage.classList.add('track-image');
        
                const trackInfo = document.createElement('div');
                trackInfo.classList.add('track-info');
        
                const trackName = document.createElement('h4');
                trackName.textContent = track.name;
        
                const trackArtist = document.createElement('p');
                trackArtist.textContent = track.artists.map(artist => artist.name).join(', ');
        
                trackInfo.appendChild(trackName);
                trackInfo.appendChild(trackArtist);
                trackItem.appendChild(trackImage);
                trackItem.appendChild(trackInfo);
                topTracksContainer.appendChild(trackItem);
            });
        }
        
        // Llama a la función para mostrar las canciones populares
        displayTopTracks();
