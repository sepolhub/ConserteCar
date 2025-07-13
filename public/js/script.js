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
        
        const localizacaoPadrao = [-23.5505, -46.6333]; // Coordenadas de São Paulo
        const zoomPadrao = 13;
        const mapa = L.map('mapa').setView(localizacaoPadrao, zoomPadrao);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapa);

        const oficinasExemplo = [
            { nome: 'Auto Mecânica Veloz', endereco: 'Av. Paulista, 1000', lat: -23.5614, lon: -46.6564, servicos: ['Mecânica Geral', 'Elétrica'] },
            { nome: 'JP Pneus e Serviços', endereco: 'Rua da Consolação, 222', lat: -23.5489, lon: -46.6500, servicos: ['Borracharia'] },
            { nome: 'Car Center Estética', endereco: 'Rua Augusta, 1500', lat: -23.5573, lon: -46.6620, servicos: ['Funilaria e Pintura'] },
            { nome: 'Rei do Óleo', endereco: 'Av. Brigadeiro Faria Lima, 4500', lat: -23.5859, lon: -46.6836, servicos: ['Mecânica Geral'] }
        ];

        let markersLayer = L.layerGroup().addTo(mapa);
        let todosOsPontos = []; // Array para guardar as coordenadas de todos os marcadores

        function renderizarOficinas(listaDeOficinas) {
            const listaResultados = document.getElementById('lista-resultados');
            
            markersLayer.clearLayers();
            todosOsPontos = []; // Limpa os pontos antes de adicionar novos
            listaResultados.innerHTML = '<h4 class="mb-3">Resultados da Busca</h4>'; 
            
            if (listaDeOficinas.length === 0) {
                listaResultados.innerHTML += '<p>Nenhuma oficina encontrada com os filtros selecionados.</p>';
                return;
            }

            listaDeOficinas.forEach(oficina => {
                const pontoOficina = [oficina.lat, oficina.lon];
                todosOsPontos.push(pontoOficina);
                L.marker(pontoOficina).addTo(markersLayer)
                    .bindPopup(`<b>${oficina.nome}</b><br>${oficina.endereco}`);

                const cardHtml = `
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">${oficina.nome}</h5>
                            <p class="card-text text-muted">${oficina.endereco}</p>
                            <a href="#" class="btn btn-sm btn-outline-primary">Ver Perfil</a>
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
                if (checkbox.checked) {
                    filtrosSelecionados.push(checkbox.parentElement.innerText.trim());
                }
            });

            const oficinasFiltradas = filtrosSelecionados.length === 0
                ? oficinasExemplo // Se nenhum filtro, mostra todas
                : oficinasExemplo.filter(oficina => 
                    oficina.servicos.some(servico => filtrosSelecionados.includes(servico))
                );
            
            renderizarOficinas(oficinasFiltradas);
            // Ajusta o zoom para mostrar os marcadores filtrados
            if (todosOsPontos.length > 0) {
                mapa.fitBounds(todosOsPontos, { padding: [50, 50] });
            }
        }

        checkboxesFiltro.forEach(checkbox => {
            checkbox.addEventListener('change', atualizarResultados);
        });

        // Renderiza todas as oficinas inicialmente
        renderizarOficinas(oficinasExemplo);

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (posicao) => {
                    const userLatLng = [posicao.coords.latitude, posicao.coords.longitude];
                    
                    // Adiciona o marcador do usuário, mas não move o mapa ainda
                    L.marker(userLatLng).addTo(mapa)
                        .bindPopup('<b>Você está aqui!</b>')
                        .openPopup();
                    
                    // Adiciona o ponto do usuário à lista de pontos
                    todosOsPontos.push(userLatLng);
                    
                    // AGORA A MÁGICA ACONTECE AQUI:
                    // Ajusta o mapa para mostrar TODOS os pontos (usuário + oficinas)
                    mapa.fitBounds(todosOsPontos, { padding: [50, 50] });
                },
                (erro) => {
                    console.warn(`AVISO: Não foi possível obter a localização. Erro (${erro.code}): ${erro.message}`);
                    // Se não tem localização do usuário, apenas ajusta o mapa para as oficinas
                    if (todosOsPontos.length > 0) {
                         mapa.fitBounds(todosOsPontos, { padding: [50, 50] });
                    }
                }
            );
        } else {
            console.error("Geolocalização não é suportada por este navegador.");
            // Se não tem geolocalização, apenas ajusta o mapa para as oficinas
            if (todosOsPontos.length > 0) {
                mapa.fitBounds(todosOsPontos, { padding: [50, 50] });
            }
        }
    }

});
