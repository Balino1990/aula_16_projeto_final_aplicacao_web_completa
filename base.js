// Seleção dos elementos principais
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const clearButton = document.getElementById("clearButton");
const scrollTopButton = document.getElementById("scrollTopButton");

// Containers de categorias
const emCartazContainer = document.getElementById("emCartaz");
const popularesContainer = document.getElementById("populares");
const avaliadosContainer = document.getElementById("avaliados");
const novidadesContainer = document.getElementById("novidades");
const resultadoPesquisaContainer = document.getElementById("resultadoPesquisa");

// Constantes da API
const API_KEY = "77c4e2b070a2e1396500d0b42ebf7cec";
const BASE_URL = "https://api.themoviedb.org/3"; // 
const IMG_URL = "https://image.tmdb.org/t/p/w500";

// Variáveis globais
let allMovies = [];

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
    document.querySelector("section:nth-child(5)").style.display = "none"; // Esconde a pesquisa
    await fetchAndRenderAllSections(); // Carrega os filmes
    setupEventListeners(); // Ativa eventos
    createMovieDetailsModal(); // Cria o modal
});

// Eventos
function setupEventListeners() {
    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        if (query) searchMovies(query);
    });

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const query = searchInput.value.trim();
            if (query) searchMovies(query);
        }
    });

    clearButton.addEventListener("click", () => {
        searchInput.value = "";
        document.querySelector("section:nth-child(5)").style.display = "none";
        document.querySelectorAll("section:not(:nth-child(5))").forEach(s => s.style.display = "block");
    });

    window.addEventListener("scroll", () => {
        scrollTopButton.style.display = window.scrollY > 300 ? "block" : "none";
    });

    scrollTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// Busca todas as seções
async function fetchAndRenderAllSections() {
    try {
        const nowPlaying = await fetchMovies(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=pt-BR&page=1`);
        renderMovieSection(emCartazContainer, nowPlaying, "emCartaz");

        const popular = await fetchMovies(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR&page=1`);
        renderMovieSection(popularesContainer, popular, "populares");

        const topRated = await fetchMovies(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=pt-BR&page=1`);
        renderMovieSection(avaliadosContainer, topRated, "avaliados");

        const upcoming = await fetchMovies(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=pt-BR&page=1`);
        renderMovieSection(novidadesContainer, upcoming, "novidades");

        allMovies = [...nowPlaying, ...popular, ...topRated, ...upcoming];
    } catch (error) {
        console.error("Erro ao carregar filmes:", error);
    }
}

// Função auxiliar para buscar filmes
async function fetchMovies(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results.map(movie => ({
            id: movie.id,
            titulo: movie.title,
            imagem: movie.poster_path ? `${IMG_URL}${movie.poster_path}` : "https://via.placeholder.com/200x300?text=Sem+Imagem",
            data: movie.release_date,
            sinopse: movie.overview,
            nota: movie.vote_average,
            popularidade: movie.popularity,
            idioma_original: movie.original_language,
            titulo_original: movie.original_title,
            adulto: movie.adult,
            generos: movie.genre_ids
        }));
    } catch (error) {
        console.error("Erro ao buscar filmes:", error);
        return [];
    }
}

// Renderiza seção
function renderMovieSection(container, movies, sectionId) {
    container.innerHTML = "";

    const prevButton = document.createElement("button");
    prevButton.classList.add("nav-button", "prev");
    prevButton.innerHTML = "&#10094;";
    prevButton.onclick = () => scrollSection(sectionId, -800);

    const nextButton = document.createElement("button");
    nextButton.classList.add("nav-button", "next");
    nextButton.innerHTML = "&#10095;";
    nextButton.onclick = () => scrollSection(sectionId, 800);

    const categorySection = container.parentElement;
    categorySection.appendChild(prevButton);
    categorySection.appendChild(nextButton);

    movies.forEach(movie => {
        const card = createMovieCard(movie);
        container.appendChild(card);
    });
}

// Scroll horizontal
function scrollSection(sectionId, amount) {
    document.getElementById(sectionId).scrollBy({ left: amount, behavior: "smooth" });
}

// Cria card
function createMovieCard(movie) {
    const card = document.createElement("div");
    card.classList.add("card_filme");
    card.dataset.movieId = movie.id;

    const img = document.createElement("img");
    img.src = movie.imagem;
    img.alt = movie.titulo;
    img.loading = "lazy";
    img.onerror = () => img.src = "https://via.placeholder.com/200x300?text=Sem+Imagem";

    const infos = document.createElement("div");
    infos.classList.add("infos");
    let dataFormatada = movie.data ? new Date(movie.data).toLocaleDateString("pt-BR") : "Data não disponível";

    infos.innerHTML = `
        <h3>${movie.titulo}</h3>
        <p><strong>Estreia:</strong> ${dataFormatada}</p>
        <p><strong>Nota:</strong> ${movie.nota ? movie.nota.toFixed(1) : "N/A"}</p>
        <p>${movie.sinopse || "Sinopse não disponível."}</p>
    `;

    const icones = document.createElement("div");
    icones.classList.add("icones");

    // Ícone de informações
    const infoIcon = createIcon("ℹ️", "Mais informações", "Ver mais informações", () => showMovieDetails(movie.id));
    const favIcon = createIcon("❤️", "Favoritar", "Adicionar aos favoritos", () => alert(`${movie.titulo} adicionado aos favoritos!`));
    const watchIcon = createIcon("🕒", "Assistir depois", "Adicionar à lista", () => alert(`${movie.titulo} adicionado para assistir depois!`));

    icones.append(infoIcon, favIcon, watchIcon);

    card.append(img, infos, icones);
    card.addEventListener("click", () => showMovieDetails(movie.id));
    return card;
}

// Cria ícone com tooltip
function createIcon(symbol, title, tooltipText, action) {
    const icon = document.createElement("span");
    icon.classList.add("icone");
    icon.innerHTML = symbol;
    icon.title = title;
    icon.addEventListener("click", (e) => {
        e.stopPropagation();
        action();
    });

    const tooltip = document.createElement("span");
    tooltip.classList.add("tooltip");
    tooltip.textContent = tooltipText;
    icon.appendChild(tooltip);

    return icon;
}

// Cria modal
function createMovieDetailsModal() {
    const modal = document.createElement("div");
    modal.id = "movieDetailsModal";
    modal.classList.add("movie-modal");

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-body">
                <div class="modal-loading">Carregando...</div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector(".close-modal").addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
}

// Exibe detalhes
async function showMovieDetails(movieId) {
    const modal = document.getElementById("movieDetailsModal");
    const modalBody = modal.querySelector(".modal-body");
    modal.style.display = "block";
    modalBody.innerHTML = `<div class="modal-loading">Carregando...</div>`;

    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,videos`);
        const movie = await response.json();

        let dataFormatada = movie.release_date ? new Date(movie.release_date).toLocaleDateString("pt-BR") : "Data não disponível";
        const diretores = movie.credits?.crew.filter(p => p.job === "Director").map(d => d.name).join(", ") || "Não disponível";
        const roteiristas = movie.credits?.crew.filter(p => ["Screenplay", "Writer", "Story"].includes(p.job)).map(r => r.name).join(", ") || "Não disponível";
        const elenco = movie.credits?.cast.slice(0, 5).map(a => a.name).join(", ") || "Não disponível";
        const generos = movie.genres.map(g => g.name).join(", ") || "Não disponível";
        const trailer = movie.videos?.results.find(v => v.type === "Trailer" && v.site === "YouTube");

        modalBody.innerHTML = `
            <div class="modal-header">
                <div class="modal-poster">
                    <img src="${movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=Sem+Imagem'}" alt="${movie.title}">
                </div>
                <div class="modal-info">
                    <h2>${movie.title}</h2>
                    ${movie.title !== movie.original_title ? `<h3>(${movie.original_title})</h3>` : ""}
                    <div class="modal-meta">
                        <span>${dataFormatada}</span>
                        <span>${movie.runtime ? `${movie.runtime} min` : "Duração N/A"}</span>
                        <span>${generos}</span>
                    </div>
                    <div class="modal-rating">
                        <span class="star">⭐</span> ${movie.vote_average.toFixed(1)}/10
                    </div>
                    <div class="modal-overview">
                        <h4>Sinopse</h4>
                        <p>${movie.overview || "Sinopse não disponível."}</p>
                    </div>
                </div>
            </div>
            <div class="modal-details">
                <h4>Ficha Técnica</h4>
                <table class="movie-details-table">
                    <tr><td><strong>Direção:</strong></td><td>${diretores}</td></tr>
                    <tr><td><strong>Roteiro:</strong></td><td>${roteiristas}</td></tr>
                    <tr><td><strong>Elenco:</strong></td><td>${elenco}</td></tr>
                    <tr><td><strong>Gêneros:</strong></td><td>${generos}</td></tr>
                    <tr><td><strong>País:</strong></td><td>${movie.production_countries.map(c => c.name).join(", ") || "Não disponível"}</td></tr>
                    <tr><td><strong>Idioma:</strong></td><td>${movie.original_language?.toUpperCase() || "Não disponível"}</td></tr>
                    <tr><td><strong>Orçamento:</strong></td><td>${movie.budget ? `$${movie.budget.toLocaleString()}` : "Não disponível"}</td></tr>
                    <tr><td><strong>Receita:</strong></td><td>${movie.revenue ? `$${movie.revenue.toLocaleString()}` : "Não disponível"}</td></tr>
                </table>
            </div>
            ${trailer ? `
                <div class="modal-trailer">
                    <h4>Trailer</h4>
                    <div class="trailer-container">
                        <iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>
                    </div>
                </div>` : ""}
        `;
    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
        modalBody.innerHTML = `<div class="modal-error"><p>Erro ao carregar detalhes. Tente novamente mais tarde.</p></div>`;
    }
}

// Pesquisa
async function searchMovies(query) {
    try {
        const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`;
        const searchResults = await fetchMovies(url);

        document.querySelector("section:nth-child(5)").style.display = "block";
        document.querySelectorAll("section:not(:nth-child(5))").forEach(s => s.style.display = "none");

        resultadoPesquisaContainer.innerHTML = "";
        if (searchResults.length > 0) {
            renderMovieSection(resultadoPesquisaContainer, searchResults, "resultadoPesquisa");
        } else {
            resultadoPesquisaContainer.innerHTML = `<p style="text-align:center; padding: 20px;">Nenhum filme encontrado para "${query}".</p>`;
        }
    } catch (error) {
        console.error("Erro ao pesquisar filmes:", error);
        resultadoPesquisaContainer.innerHTML = `<p style="text-align:center; padding: 20px;">Erro ao pesquisar filmes. Tente novamente.</p>`;
    }
}
