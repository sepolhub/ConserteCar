// Espera todo o conteúdo da página carregar antes de executar os scripts
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DO MENU RESPONSIVO ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (navList.classList.contains('active')) {
                    navList.classList.remove('active');
                }
            });
        });
    }

    // --- LÓGICA DO BOTÃO "VOLTAR AO TOPO" ---
    const btnVoltarAoTopo = document.getElementById('btnVoltarAoTopo');

    if (btnVoltarAoTopo) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { // Mostra o botão depois de rolar 300px
                btnVoltarAoTopo.classList.add('show');
            } else {
                btnVoltarAoTopo.classList.remove('show');
            }
        });

        btnVoltarAoTopo.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- LÓGICA DO FORMULÁRIO DE CONTATO ---
    const contactForm = document.querySelector('.contact-form');
    const formMessage = document.getElementById('form-message');

    if (contactForm && formMessage) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            formMessage.innerHTML = `
                <div class="alert alert-success" role="alert">
                  <strong>Mensagem enviada com sucesso!</strong> Entraremos em contato em breve.
                </div>
            `;
            contactForm.reset();
            setTimeout(() => {
                formMessage.innerHTML = '';
            }, 5000);
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

        const oficinasExemplo = [
            { id: 1, nome: 'Auto Mecânica Veloz', endereco: 'Av. Paulista, 1000', lat: -23.5614, lon: -46.6564, servicos: ['Mecânica Geral', 'Elétrica'], rating: 4.5, img: '/images/oficina-destaque-1.jpg' },
            { id: 2, nome: 'JP Pneus e Serviços', endereco: 'Rua da Consolação, 222', lat: -23.5489, lon: -46.6500, servicos: ['Borracharia'], rating: 5.0, img: '/images/oficina-destaque-2.jpg' },
            { id: 3, nome: 'Car Center Estética', endereco: 'Rua Augusta, 1500', lat: -23.5573, lon: -46.6620, servicos: ['Funilaria e Pintura'], rating: 4.0, img: '/images/oficina-destaque-3.jpg' },
            { id: 4, nome: 'Rei do Óleo', endereco: 'Av. Brigadeiro Faria Lima, 4500', lat: -23.5859, lon: -46.6836, servicos: ['Mecânica Geral'], rating: 4.8, img: '/images/oficina-destaque-4.jpg' },
            { id: 5, nome: 'Speed Motorsport', endereco: 'Av. Morumbi, 7000', lat: -23.6119, lon: -46.7037, servicos: ['Mecânica Geral', 'Elétrica'], rating: 4.9, img: '/images/oficina-destaque-5.jpg' },
            { id: 6, nome: 'Borracharia Central', endereco: 'Praça da Sé, 100', lat: -23.5507, lon: -46.6333, servicos: ['Borracharia'], rating: 4.2, img: '/images/oficina-destaque-1.jpg' },
            { id: 7, nome: 'Pintura Mágica', endereco: 'Rua Oscar Freire, 500', lat: -23.5600, lon: -46.6690, servicos: ['Funilaria e Pintura'], rating: 4.7, img: '/images/oficina-destaque-2.jpg' }
        ];

        let userMarker = null;
        let markers = {};

        function calcularDistancia(lat1, lon1, lat2, lon2) { /* ...função de distância... */ }

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

                marker.on('click', function() { /* ...lógica de clique no marcador... */ });

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

            // Ajusta o zoom para mostrar os pontos relevantes
            if (pontosParaZoom.length > 0) {
                mapa.fitBounds(pontosParaZoom, { padding: [50, 50] });
            }
        }
        
        const sortBySelect = document.getElementById('sortBy');
        const checkboxesFiltro = document.querySelectorAll('#filtros-servicos input[type="checkbox"]');

        function atualizarResultados() {
            // 1. Filtra por tipo de serviço
            const filtrosSelecionados = Array.from(checkboxesFiltro).filter(i => i.checked).map(i => i.value);
            let oficinasFiltradas = filtrosSelecionados.length === 0 
                ? [...oficinasExemplo] 
                : oficinasExemplo.filter(oficina => oficina.servicos.some(servico => filtrosSelecionados.includes(servico)));

            // 2. --- NOVO: Filtra por distância se a localização do utilizador for conhecida ---
            if (userMarker) {
                const RAIO_MAXIMO_KM = 50; // Defina aqui o raio máximo de busca
                oficinasFiltradas = oficinasFiltradas.filter(oficina => oficina.distancia <= RAIO_MAXIMO_KM);
            }

            // 3. Ordena os resultados
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
        if(listaResultadosDiv) { /* ...lógica de mouseover... */ }

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (posicao) => {
                    const userLatLng = [posicao.coords.latitude, posicao.coords.longitude];
                    userMarker = L.marker(userLatLng, { icon: userIcon }).addTo(mapa).bindPopup('<b>Você está aqui!</b>').openPopup();
                    
                    oficinasExemplo.forEach(oficina => {
                        oficina.distancia = calcularDistancia(userLatLng[0], userLatLng[1], oficina.lat, oficina.lon);
                    });

                    atualizarResultados(); // Chama a função que agora irá filtrar e ordenar
                },
                (erro) => {
                    console.warn(`AVISO: Não foi possível obter a localização.`, erro);
                    if(sortBySelect) sortBySelect.querySelector('option[value="distancia"]').disabled = true;
                    atualizarResultados(); // Renderiza mesmo sem localização
                }
            );
        } else {
            if(sortBySelect) sortBySelect.querySelector('option[value="distancia"]').disabled = true;
            atualizarResultados(); // Renderiza mesmo sem geolocalização
        }
    }
});