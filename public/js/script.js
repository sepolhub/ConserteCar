// Espera todo o conteúdo da página carregar antes de executar os scripts
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DO MENU RESPONSIVO ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }

    // --- LÓGICA DO BOTÃO "VOLTAR AO TOPO" ---
    const btnVoltarAoTopo = document.getElementById('btnVoltarAoTopo');
    if (btnVoltarAoTopo) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btnVoltarAoTopo.classList.add('show');
            } else {
                btnVoltarAoTopo.classList.remove('show');
            }
        });
        btnVoltarAoTopo.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- LÓGICA DO FORMULÁRIO DE CONTATO ---
    const contactForm = document.querySelector('.contact-form');
    const formMessage = document.getElementById('form-message');
    if (contactForm && formMessage) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            formMessage.innerHTML = `<div class="alert alert-success">Mensagem enviada com sucesso!</div>`;
            contactForm.reset();
            setTimeout(() => { formMessage.innerHTML = ''; }, 5000);
        });
    }

    // --- LÓGICA PARA O MAPA NA PÁGINA DE SERVIÇOS ---
    const mapaContainer = document.getElementById('mapa');
    if (mapaContainer) {
        const localizacaoPadrao = [-23.5505, -46.6333];
        const zoomPadrao = 13;
        const mapa = L.map('mapa', { zoomControl: false }).setView(localizacaoPadrao, zoomPadrao);
        L.control.zoom({ position: 'topright' }).addTo(mapa);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapa);
        const userIcon = L.icon({ iconUrl: 'https://i.imgur.com/u3W4bGO.png', iconSize: [40, 40], popupAnchor: [0, -20] });
        const workshopIcon = L.icon({ iconUrl: 'https://i.imgur.com/A7i981t.png', iconSize: [30, 40], iconAnchor: [15, 40], popupAnchor: [0, -35] });
        let oficinasMasterList = [];
        let userMarker = null;
        let markers = {};
        function calcularDistancia(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }
        function renderizarOficinas(listaDeOficinas) {
            const listaResultados = document.getElementById('lista-resultados');
            const resultsCount = document.getElementById('results-count');
            for (const id in markers) { mapa.removeLayer(markers[id]); }
            markers = {};
            if (resultsCount) resultsCount.textContent = `${listaDeOficinas.length} resultados encontrados`;
            listaResultados.innerHTML = '';
            if (listaDeOficinas.length === 0) {
                listaResultados.innerHTML = '<p class="px-4">Nenhuma oficina encontrada perto de si ou com os filtros selecionados.</p>';
                return;
            }
            let pontosParaZoom = [];
            if (userMarker) pontosParaZoom.push(userMarker.getLatLng());
            listaDeOficinas.forEach(oficina => {
                const pontoOficina = [oficina.lat, oficina.lon];
                pontosParaZoom.push(pontoOficina);
                const marker = L.marker(pontoOficina, { icon: workshopIcon }).addTo(mapa).bindPopup(`<b>${oficina.nome}</b>`);
                marker.oficinaId = oficina.id;
                markers[oficina.id] = marker;
                marker.on('click', function () {
                    document.querySelectorAll('.result-card').forEach(c => c.classList.remove('result-card-highlight'));
                    const cardSelecionado = document.querySelector(`.result-card[data-id="${this.oficinaId}"]`);
                    if (cardSelecionado) {
                        cardSelecionado.classList.add('result-card-highlight');
                        cardSelecionado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
                let ratingHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= oficina.rating) ratingHtml += '<i class="bi bi-star-fill"></i>';
                    else if (i - 0.5 <= oficina.rating) ratingHtml += '<i class="bi bi-star-half"></i>';
                    else ratingHtml += '<i class="bi bi-star"></i>';
                }
                let distanciaHtml = oficina.distancia ? `<span class="text-muted small">${oficina.distancia.toFixed(1)} km</span>` : '';
                const cardHtml = `
                    <div class="result-card" data-id="${oficina.id}">
                        <img src="${oficina.img}" alt="${oficina.nome}" class="result-card-img">
                        <div class="result-card-body">
                            <h6 class="mb-1">${oficina.nome}</h6>
                            <div class="rating-stars small mb-1" title="Avaliação: ${oficina.rating} de 5">
                                ${ratingHtml} <span class="ms-1">(${oficina.rating.toFixed(1)})</span>
                            </div>
                            <p class="text-muted small mb-0">${distanciaHtml}</p>
                        </div>
                    </div>
                `;
                listaResultados.innerHTML += cardHtml;
            });
            if (pontosParaZoom.length > 0) {
                mapa.fitBounds(pontosParaZoom, { padding: [50, 50], maxZoom: 15 });
            }
        }
        const sortBySelect = document.getElementById('sortBy');
        const checkboxesFiltro = document.querySelectorAll('#filtros-servicos input[type="checkbox"]');
        function atualizarResultados() {
            let oficinasFiltradas = [...oficinasMasterList];
            const filtrosSelecionados = Array.from(checkboxesFiltro).filter(i => i.checked).map(i => i.value);
            if (filtrosSelecionados.length > 0) {
                oficinasFiltradas = oficinasFiltradas.filter(oficina => oficina.servicos.some(servico => filtrosSelecionados.includes(servico)));
            }
            if (userMarker) {
                const RAIO_MAXIMO_KM = 50;
                oficinasFiltradas = oficinasFiltradas.filter(oficina => oficina.distancia <= RAIO_MAXIMO_KM);
            }
            if (sortBySelect) {
                const sortValue = sortBySelect.value;
                if (sortValue === 'distancia' && userMarker) {
                    oficinasFiltradas.sort((a, b) => a.distancia - b.distancia);
                } else if (sortValue === 'avaliacao') {
                    oficinasFiltradas.sort((a, b) => b.rating - a.rating);
                }
            }
            renderizarOficinas(oficinasFiltradas);
        }
        if (checkboxesFiltro.length > 0) checkboxesFiltro.forEach(checkbox => checkbox.addEventListener('change', atualizarResultados));
        if (sortBySelect) sortBySelect.addEventListener('change', atualizarResultados);
        const listaResultadosDiv = document.getElementById('lista-resultados');
        if (listaResultadosDiv) {
            listaResultadosDiv.addEventListener('mouseover', (event) => {
                const card = event.target.closest('.result-card');
                if (card) {
                    const id = card.dataset.id;
                    if (markers[id]) markers[id].openPopup();
                }
            });
        }
        async function iniciarPaginaServicos() {
            try {
                const response = await fetch('/api/oficinas');
                if (!response.ok) throw new Error('Falha ao carregar dados das oficinas.');
                oficinasMasterList = await response.json();
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        (posicao) => {
                            const userLatLng = [posicao.coords.latitude, posicao.coords.longitude];
                            userMarker = L.marker(userLatLng, { icon: userIcon }).addTo(mapa).bindPopup('<b>Você está aqui!</b>').openPopup();
                            oficinasMasterList.forEach(oficina => {
                                oficina.distancia = calcularDistancia(userLatLng[0], userLatLng[1], oficina.lat, oficina.lon);
                            });
                            atualizarResultados();
                        },
                        (erro) => {
                            console.warn(`AVISO: Não foi possível obter a localização.`, erro);
                            if (sortBySelect) sortBySelect.querySelector('option[value="distancia"]').disabled = true;
                            atualizarResultados();
                        }
                    );
                } else {
                    if (sortBySelect) sortBySelect.querySelector('option[value="distancia"]').disabled = true;
                    atualizarResultados();
                }
            } catch (error) {
                console.error("Erro ao iniciar a página de serviços:", error);
                document.getElementById('lista-resultados').innerHTML = `<div class="alert alert-danger">Não foi possível carregar os dados das oficinas. Tente novamente mais tarde.</div>`;
            }
        }
        iniciarPaginaServicos();
    }

    // --- LÓGICA DO FORMULÁRIO DE CADASTRO ---
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (event) => {
            event.preventDefault();
            const authMessage = document.getElementById('auth-message');
            const formData = new FormData(formCadastro);
            const data = Object.fromEntries(formData.entries());
            authMessage.innerHTML = '';
            try {
                const response = await fetch('/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!response.ok) {
                    const errorResult = await response.text();
                    throw new Error(errorResult);
                }
                const result = await response.json();
                if (result.success) {
                    authMessage.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    formCadastro.reset();
                    setTimeout(() => { window.location.href = '/login'; }, 2000);
                }
            } catch (error) {
                console.error('Erro ao enviar formulário:', error);
                authMessage.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        });
    }

    // --- NOVA LÓGICA PARA O FORMULÁRIO DE LOGIN ---
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (event) => {
            event.preventDefault();
            const authMessage = document.getElementById('auth-message');
            const formData = new FormData(formLogin);
            const data = Object.fromEntries(formData.entries());
            authMessage.innerHTML = '';
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await response.json();
                if (result.success) {
                    authMessage.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    setTimeout(() => { window.location.href = '/'; }, 1500);
                } else {
                    authMessage.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
                }
            } catch (error) {
                console.error('Erro ao enviar formulário:', error);
                authMessage.innerHTML = `<div class="alert alert-danger">Ocorreu um erro. Tente novamente.</div>`;
            }
        });
    }

});
