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

    // Este código só vai rodar se o elemento com id="mapa" existir na página
    if (mapaContainer) {
        
        const localizacaoPadrao = [-23.5505, -46.6333]; // Coordenadas de São Paulo
        const zoomPadrao = 13;
        const mapa = L.map('mapa').setView(localizacaoPadrao, zoomPadrao);
        let userMarker = null; // Variável para guardar a localização do utilizador

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapa);

        const oficinasExemplo = [
            { id: 1, nome: 'Auto Mecânica Veloz', endereco: 'Av. Paulista, 1000', lat: -23.5614, lon: -46.6564, servicos: ['Mecânica Geral', 'Elétrica'], rating: 4.5 },
            { id: 2, nome: 'JP Pneus e Serviços', endereco: 'Rua da Consolação, 222', lat: -23.5489, lon: -46.6500, servicos: ['Borracharia'], rating: 5.0 },
            { id: 3, nome: 'Car Center Estética', endereco: 'Rua Augusta, 1500', lat: -23.5573, lon: -46.6620, servicos: ['Funilaria e Pintura'], rating: 4.0 },
            { id: 4, nome: 'Rei do Óleo', endereco: 'Av. Brigadeiro Faria Lima, 4500', lat: -23.5859, lon: -46.6836, servicos: ['Mecânica Geral'], rating: 4.8 }
        ];

        let markersLayer = L.layerGroup().addTo(mapa);
        
        // --- NOVA FUNÇÃO PARA CALCULAR DISTÂNCIA ---
        function calcularDistancia(lat1, lon1, lat2, lon2) {
            const R = 6371; // Raio da Terra em km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distância em km
        }

        function renderizarOficinas(listaDeOficinas) {
            const listaResultados = document.getElementById('lista-resultados');
            
            markersLayer.clearLayers();
            listaResultados.innerHTML = '<h4 class="mb-3">Resultados da Busca</h4>'; 
            
            if (listaDeOficinas.length === 0) {
                listaResultados.innerHTML += '<p>Nenhuma oficina encontrada com os filtros selecionados.</p>';
                return;
            }

            listaDeOficinas.forEach(oficina => {
                L.marker([oficina.lat, oficina.lon]).addTo(markersLayer)
                    .bindPopup(`<b>${oficina.nome}</b><br>${oficina.endereco}`);

                let ratingHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= oficina.rating) ratingHtml += '<i class="bi bi-star-fill"></i>';
                    else if (i - 0.5 <= oficina.rating) ratingHtml += '<i class="bi bi-star-half"></i>';
                    else ratingHtml += '<i class="bi bi-star"></i>';
                }

                // --- CÁLCULO E EXIBIÇÃO DA DISTÂNCIA ---
                let distanciaHtml = '';
                if (userMarker) {
                    const userLat = userMarker.getLatLng().lat;
                    const userLon = userMarker.getLatLng().lng;
                    const distancia = calcularDistancia(userLat, userLon, oficina.lat, oficina.lon);
                    distanciaHtml = `<p class="card-text"><i class="bi bi-geo-alt-fill me-1"></i>Aprox. ${distancia.toFixed(1)} km de você</p>`;
                }

                const cardHtml = `
                    <div class="card mb-3 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h5 class="card-title">${oficina.nome}</h5>
                                    <p class="card-text text-muted mb-2">${oficina.endereco}</p>
                                    <div class="rating-stars mb-2" title="Avaliação: ${oficina.rating} de 5">
                                        ${ratingHtml}
                                        <span class="ms-2 text-muted">(${oficina.rating.toFixed(1)})</span>
                                    </div>
                                    ${distanciaHtml}
                                </div>
                                <div class="text-center">
                                    <button class="btn btn-sm btn-outline-primary btn-ver-mapa" data-lat="${oficina.lat}" data-lon="${oficina.lon}">
                                        Ver no<br>Mapa
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                listaResultados.innerHTML += cardHtml;
            });
        }

        const checkboxesFiltro = document.querySelectorAll('.list-group-item input[type="checkbox"]');
        function atualizarResultados() {
            const filtrosSelecionados = [];
            checkboxesFiltro.forEach(checkbox => {
                if (checkbox.checked) filtrosSelecionados.push(checkbox.value);
            });
            const oficinasFiltradas = filtrosSelecionados.length === 0 ? oficinasExemplo : oficinasExemplo.filter(oficina => oficina.servicos.some(servico => filtrosSelecionados.includes(servico)));
            renderizarOficinas(oficinasFiltradas);
        }
        checkboxesFiltro.forEach(checkbox => checkbox.addEventListener('change', atualizarResultados));

        document.getElementById('lista-resultados').addEventListener('click', function(event) {
            const target = event.target.closest('.btn-ver-mapa');
            if (target) {
                const lat = parseFloat(target.dataset.lat);
                const lon = parseFloat(target.dataset.lon);
                mapa.flyTo([lat, lon], 16);
                markersLayer.eachLayer(layer => {
                    if (layer.getLatLng().lat === lat && layer.getLatLng().lng === lon) layer.openPopup();
                });
            }
        });

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (posicao) => {
                    const userLatLng = [posicao.coords.latitude, posicao.coords.longitude];
                    userMarker = L.marker(userLatLng).addTo(mapa).bindPopup('<b>Você está aqui!</b>').openPopup();
                    mapa.setView(userLatLng, zoomPadrao);
                    
                    // Re-renderiza os cards agora que temos a localização do utilizador para calcular a distância
                    atualizarResultados(); 
                },
                (erro) => {
                    console.warn(`AVISO: Não foi possível obter a localização. Erro (${erro.code}): ${erro.message}`);
                    renderizarOficinas(oficinasExemplo); // Renderiza sem a distância
                }
            );
        } else {
            console.error("Geolocalização não é suportada por este navegador.");
            renderizarOficinas(oficinasExemplo); // Renderiza sem a distância
        }
    }
});
