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
        const localizacaoPadrao = [-23.2037, -47.2882]; // Salto-SP
        const mapa = L.map('mapa', { zoomControl: false }).setView(localizacaoPadrao, 13);
        L.control.zoom({ position: 'topright' }).addTo(mapa);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapa);
        
         const userIcon = L.divIcon({
            html: '<i class="bi bi-geo-alt-fill user-location-icon"></i>',
            className: 'custom-map-icon', // Classe para remover estilos padrão do Leaflet
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        const workshopIcon = L.divIcon({
            html: '<i class="bi bi-tools workshop-location-icon"></i>',
            className: 'custom-map-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
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

            listaDeOficinas.forEach((oficina) => {
                if (oficina.lat == null || oficina.lon == null) {
                    console.error("Oficina com dados inválidos foi ignorada:", oficina);
                    return;
                }

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
                const ratingNum = parseFloat(oficina.rating);
                if (!isNaN(ratingNum)) {
                    for (let i = 1; i <= 5; i++) {
                        if (i <= ratingNum) ratingHtml += '<i class="bi bi-star-fill"></i>';
                        else if (i - 0.5 <= ratingNum) ratingHtml += '<i class="bi bi-star-half"></i>';
                        else ratingHtml += '<i class="bi bi-star"></i>';
                    }
                    ratingHtml += `<span class="ms-1">(${ratingNum.toFixed(1)})</span>`;
                } else {
                    ratingHtml = '<span class="text-muted small">Sem avaliação</span>';
                }

                let distanciaHtml = oficina.distancia ? `<span class="text-muted small">${oficina.distancia.toFixed(1)} km</span>` : '';
                
                const cardHtml = `
                    <div class="result-card" data-id="${oficina.id}">
                        <img src="${oficina.img || '/images/placeholder.png'}" alt="${oficina.nome}" class="result-card-img">
                        <div class="result-card-body">
                            <h6 class="mb-1">${oficina.nome}</h6>
                            <div class="rating-stars small mb-1" title="Avaliação: ${oficina.rating || 'N/A'} de 5">
                                ${ratingHtml}
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
                oficinasFiltradas = oficinasFiltradas.filter(oficina => Array.isArray(oficina.servicos) && oficina.servicos.some(servico => filtrosSelecionados.includes(servico)));
            }
            if (sortBySelect && sortBySelect.value === 'avaliacao') {
                oficinasFiltradas.sort((a, b) => b.rating - a.rating);
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

        async function iniciarPagina(lat, lon) {
            try {
                const apiUrl = (lat && lon) ? `/api/oficinas?lat=${lat}&lon=${lon}` : '/api/oficinas';
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('Falha ao carregar dados.');
                oficinasMasterList = await response.json();
                atualizarResultados();
            } catch (error) {
                console.error("Erro ao iniciar:", error);
                document.getElementById('lista-resultados').innerHTML = `<div class="alert alert-danger">Erro ao carregar oficinas.</div>`;
            }
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLatLng = [position.coords.latitude, position.coords.longitude];
                    userMarker = L.marker(userLatLng, { icon: userIcon }).addTo(mapa).bindPopup('<b>Você está aqui!</b>').openPopup();
                    mapa.setView(userLatLng, 14);
                    iniciarPagina(userLatLng[0], userLatLng[1]);
                },
                () => {
                    if(sortBySelect) sortBySelect.querySelector('option[value="distancia"]').disabled = true;
                    iniciarPagina(); 
                }
            );
        } else {
            if(sortBySelect) sortBySelect.querySelector('option[value="distancia"]').disabled = true;
            iniciarPagina();
        }
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
                } else {
                    authMessage.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
                }
            } catch (error) {
                console.error('Erro ao enviar formulário:', error);
                authMessage.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        });
    }

    // --- LÓGICA DO FORMULÁRIO DE LOGIN ---
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
                authMessage.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        });
    }
});
