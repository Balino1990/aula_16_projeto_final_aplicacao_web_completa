const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const clearButton = document.getElementById("clearButton");
const scrollTopButton = document.getElementById("scrollTopButton");

const sections = [
  { id: "emCartaz", api: "now_playing" },
  { id: "populares", api: "popular" },
  { id: "avaliados", api: "top_rated" },
  { id: "novidades", api: "upcoming" }
];
const resultadoPesquisaContainer = document.getElementById("resultadoPesquisa");

const API_KEY = "77c4e2b070a2e1396500d0b42ebf7cec";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

const mainContent = document.getElementById("main-content");
const modalOverlay = document.createElement("div");
modalOverlay.className = "modal-overlay";
document.body.appendChild(modalOverlay);

const detailsModal = document.getElementById("detailsModal");

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("resultadoPesquisa").style.display = "none";
  await fetchAndRenderAllSections();
  setupEventListeners();
});

function setupEventListeners() {
  searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) searchMovies(query);
  });
  searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) searchMovies(query);
    }
  });
  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    document.getElementById("resultadoPesquisa").style.display = "none";
    mainContent.style.filter = "";
    modalOverlay.style.display = "none";
    detailsModal.style.display = "none";
    document.querySelectorAll("main > section").forEach(s => (s.style.display = "block"));
  });
  window.addEventListener("scroll", () => {
    scrollTopButton.style.display = window.scrollY > 300 ? "block" : "none";
  });
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  modalOverlay.addEventListener("click", closeDetailsModal);
  detailsModal.addEventListener("keydown", e => {
    if (e.key === "Escape") closeDetailsModal();
  });
}

async function fetchAndRenderAllSections() {
  for (const sec of sections) {
    const movies = await fetchMovies(`${BASE_URL}/movie/${sec.api}?api_key=${API_KEY}&language=pt-BR&page=1`);
    renderMovieSection(document.getElementById(sec.id), movies, sec.id);
  }
}

async function fetchMovies(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

function renderMovieSection(container, movies, sectionId) {
  container.innerHTML = "";
  container.classList.add("movies-row");

  // Remove possíveis botões de navegação anteriores 
  container.parentElement.querySelectorAll(".nav-button").forEach(btn => btn.remove());

  let prevButton = document.createElement("button");
  prevButton.className = "nav-button prev";
  prevButton.innerHTML = "&#10094;";
  prevButton.onclick = () => container.scrollBy({ left: -500, behavior: "smooth" });

  let nextButton = document.createElement("button");
  nextButton.className = "nav-button next";
  nextButton.innerHTML = "&#10095;";
  nextButton.onclick = () => container.scrollBy({ left: 500, behavior: "smooth" });

  container.parentElement.style.position = "relative";
  container.parentElement.appendChild(prevButton);
  container.parentElement.appendChild(nextButton);

  movies.forEach(movie => {
    const card = createMovieCard(movie, sectionId);
    container.appendChild(card);
  });
}

function createMovieCard(movie, sectionId) {
  const card = document.createElement("div");
  card.classList.add("card_filme");
  card.dataset.movieId = movie.id;

  const img = document.createElement("img");
  img.src = movie.imagem;
  img.alt = movie.titulo;
  img.loading = "lazy";
  img.onerror = () => (img.src = "https://via.placeholder.com/200x300?text=Sem+Imagem");

  const infos = document.createElement("div");
  infos.classList.add("infos");
  let dataFormatada = movie.data ? new Date(movie.data).toLocaleDateString("pt-BR") : "Data não disponível";
  infos.innerHTML = `
    <h3>${movie.titulo}</h3>
    <p><strong>Estreia:</strong> ${dataFormatada}</p>
    <p><strong>Nota:</strong> <span data-nome="nota">${movie.nota ? movie.nota.toFixed(1) : "N/A"}</span></p>
  `; // Sinopse removida

  const icones = document.createElement("div");
  icones.classList.add("icones");

  const infoIcon = createIcon("ℹ️", "Mais informações", "Ver mais informações", () =>
    showDetailsModal(movie.id, sectionId, card)
  );

  icones.append(infoIcon);

  card.append(img, infos, icones);

  card.addEventListener("click", () => showDetailsModal(movie.id, sectionId, card));

  return card;
}

function clearCardHighlights(sectionId) {
  document.querySelectorAll(`#${sectionId} .card_filme.selected`).forEach(card => card.classList.remove("selected"));
}

function createIcon(symbol, title, tooltipText, action) {
  const icon = document.createElement("span");
  icon.classList.add("icone");
  icon.innerHTML = symbol;
  icon.title = title;
  icon.addEventListener("click", e => {
    e.stopPropagation();
    action();
  });
  const tooltip = document.createElement("span");
  tooltip.classList.add("tooltip");
  tooltip.textContent = tooltipText;
  icon.appendChild(tooltip);
  return icon;
}

async function showDetailsModal(movieId, sectionId, clickedCard) {
  clearCardHighlights(sectionId);
  if (clickedCard) clickedCard.classList.add("selected");

  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,videos`
    );
    const movie = await response.json();

    let dataFormatada = movie.release_date ? new Date(movie.release_date).toLocaleDateString("pt-BR") : "Data não disponível";
    const diretores = movie.credits?.crew
      .filter(p => p.job === "Director")
      .map(d => d.name)
      .join(", ") || "Não disponível";
    const roteiristas = movie.credits?.crew
      .filter(p => ["Screenplay", "Writer", "Story"].includes(p.job))
      .map(r => r.name)
      .join(", ") || "Não disponível";
    const elenco =
      movie.credits?.cast.slice(0, 5).map(a => a.name).join(", ") || "Não disponível";
    const generos = movie.genres.map(g => g.name).join(", ") || "Não disponível";
    const trailer = movie.videos?.results.find(v => v.type === "Trailer" && v.site === "YouTube");

    detailsModal.innerHTML = `
      <span class="details-close-btn" title="Fechar">&times;</span>
      <div class="details-card">
        <div class="details-header">
          <img src="${movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=Sem+Imagem'}" alt="${movie.title}">
          <div class="details-info">
            <h2>${movie.title}</h2>
            ${movie.title !== movie.original_title ? `<h3>(${movie.original_title})</h3>` : ""}
            <div class="details-meta">${dataFormatada} • ${movie.runtime ? `${movie.runtime} min` : ""} ${generos ? "• " + generos : ""}</div>
            <div class="details-rating">
              <span class="star">⭐</span> <span style="color:#ffd838;"><b>${movie.vote_average.toFixed(1)}/10</b></span>
            </div>
            <div class="details-overview">
              <h4>Sinopse</h4>
              <p>${movie.overview || "Sinopse não disponível."}</p>
            </div>
          </div>
        </div>
        <div class="modal-details">
          <h4>Ficha Técnica</h4>
          <table class="details-table">
            <tr><td>Direção:</td><td>${diretores}</td></tr>
            <tr><td>Roteiro:</td><td>${roteiristas}</td></tr>
            <tr><td>Elenco Principal:</td><td>${elenco}</td></tr>
            <tr><td>Gêneros:</td><td>${generos}</td></tr>
            <tr><td>País de Origem:</td><td>${movie.production_countries?.map(c => c.name).join(", ") || "Não disponível"}</td></tr>
            <tr><td>Idioma Original:</td><td>${movie.original_language?.toUpperCase() || "Não disponível"}</td></tr>
            <tr><td>Orçamento:</td><td>${movie.budget ? `$${movie.budget.toLocaleString()}` : "Não disponível"}</td></tr>
            <tr><td>Receita:</td><td>${movie.revenue ? `$${movie.revenue.toLocaleString()}` : "Não disponível"}</td></tr>
          </table>
        </div>
        ${trailer ? `
          <div class="trailer-container">
            <h4>Trailer</h4>
            <iframe height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>
          </div>` : ""}
      </div>
    `;
    modalOverlay.style.display = "block";
    detailsModal.style.display = "block";
    mainContent.classList.add("blur-background");

    // Evento para fechar modal clicando no botão X
    detailsModal.querySelector(".details-close-btn").onclick = closeDetailsModal;
  } catch (error) {
    detailsModal.innerHTML = `<div class="details-card"><p style="color:#f00; text-align:center;">Erro ao carregar detalhes. Tente novamente mais tarde.</p></div>`;
    modalOverlay.style.display = "block";
    detailsModal.style.display = "block";
    mainContent.classList.add("blur-background");
  }
}

function closeDetailsModal() {
  detailsModal.style.display = "none";
  modalOverlay.style.display = "none";
  mainContent.classList.remove("blur-background");
  clearCardHighlights();
}

function clearCardHighlights() {
  document.querySelectorAll(".card_filme.selected").forEach(card => card.classList.remove("selected"));
}
