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
    // displayUserProfile(); // Mostrar el perfil del usuario
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

// Función para buscar artistas y canciones
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
            artistDiv.classList.add('result-item'); // Añade una clase común para estilos
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
    let currentAudio = null; // Variable para almacenar el audio actual
let currentButton = null; // Variable para almacenar el botón actual

// Mostrar resultados de canciones
if (data.tracks && data.tracks.items.length > 0) {
    data.tracks.items.forEach(track => {
        const trackDiv = document.createElement('div');
        trackDiv.classList.add('result-item'); // Añade una clase común para estilos
        trackDiv.innerHTML = `
            <h4>${track.name}</h4>
            <p>${track.artists.map(artist => artist.name).join(', ')}</p>
            <img src="${track.album.images[0]?.url || 'placeholder.jpg'}" alt="${track.name}">
        `;
        
        // Mostrar el preview_url en la consola
        console.log(track.name, track.preview_url); 

        // Añadir botón solo si hay preview_url
        if (track.preview_url) {
            trackDiv.innerHTML += `<button class="play-btn" data-url="${track.preview_url}">Reproducir</button>`;
        } else {
            trackDiv.innerHTML += `<p>Vista previa no disponible.</p>`;
        }
        trackResultsDiv.appendChild(trackDiv);

        // Manejo del evento de clic en el botón de reproducción
        trackDiv.querySelector('.play-btn')?.addEventListener('click', () => {
            // Si hay un audio reproduciéndose, lo pausamos
            if (currentAudio) {
                currentAudio.pause();
                // Cambia el texto del botón de reproducción anterior
                if (currentButton) {
                    currentButton.textContent = 'Reproducir'; // Cambia el texto del botón
                }
            }

            // Si el audio es el mismo que el actual, lo pausamos
            if (currentAudio && currentAudio.src === track.preview_url) {
                currentAudio.pause(); // Pausar si ya está reproduciendo
                currentAudio.currentTime = 0; // Reiniciar a la posición inicial si es necesario
                currentAudio = null; // Limpiar la referencia
                currentButton.textContent = 'Reproducir'; // Cambia el texto del botón a "Reproducir"
            } else {
                // Crear un nuevo audio si no es el mismo
                currentAudio = new Audio(track.preview_url);
                currentAudio.play().catch(error => {
                    console.error('Error al reproducir:', error);
                });
                
                // Cambia el texto del botón a "Pausar"
                currentButton = trackDiv.querySelector('.play-btn');
                currentButton.textContent = 'Pausar';

                // Limpiar la referencia al finalizar
                currentAudio.addEventListener('ended', () => {
                    currentAudio = null; // Limpiar la referencia al final
                    currentButton.textContent = 'Reproducir'; // Cambia el texto del botón al finalizar
                });
                
                // Actualiza currentButton para el siguiente clic
                currentButton.addEventListener('click', () => {
                    if (currentAudio.paused) {
                        currentAudio.play();
                        currentButton.textContent = 'Pausar'; // Cambia el texto a "Pausar"
                    } else {
                        currentAudio.pause();
                        currentButton.textContent = 'Reproducir'; // Cambia el texto a "Reproducir"
                    }
                });
            }
        });
    });
} else {
    trackResultsDiv.innerHTML = '<p>No se encontraron canciones.</p>';
}


    // Agregar eventos a los botones de reproducción
    addPlayButtonEvents();
});

// Manejo del botón de Logout
document.getElementById('logoutButton')?.addEventListener('click', () => {
    localStorage.removeItem('spotifyToken'); // Elimina el token
    document.getElementById('artist-search').style.display = 'none'; // Ocultar el formulario de búsqueda
    alert("Has cerrado sesión exitosamente."); // Mensaje opcional de cierre de sesión
    window.location.href= 'http://localhost:5500/login.html'; // Redirige a la página de login
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
