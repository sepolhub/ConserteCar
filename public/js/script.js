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
            className: 'custom-map-icon',
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

                // A lógica para criar o HTML das estrelas e da distância precisa estar ANTES
                // de ser usada no pop-up e no card.
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
                
                // ##### INÍCIO DA ALTERAÇÃO #####
                const pontoOficina = [oficina.lat, oficina.lon];
                pontosParaZoom.push(pontoOficina);

                // 1. Construir o HTML para o conteúdo do pop-up
                let popupContent = `
                    <div style="font-family: 'Roboto', sans-serif; min-width: 180px;">
                        <h6 class="mb-1" style="font-weight: 700;">${oficina.nome}</h6>
                        <p class="text-muted small mb-2" style="font-size: 0.8rem;">${oficina.logradouro || ''}, ${oficina.numero || ''} - ${oficina.bairro || ''}</p>
                        <div class="rating-stars small mb-2" title="Avaliação: ${oficina.rating || 'N/A'} de 5">
                            ${ratingHtml}
                        </div>
                        <a href="/oficina/${oficina.id}" class="btn btn-primary btn-sm w-100">Ver Detalhes</a>
                    </div>
                `;

                // 2. Criar o marcador e associar o novo pop-up
                const marker = L.marker(pontoOficina, { icon: workshopIcon })
                    .addTo(mapa)
                    .bindPopup(popupContent);
                // ##### FIM DA ALTERAÇÃO #####
                
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

                const cardHtml = `
                    <div class="result-card" data-id="${oficina.id}">
                        <img src="${oficina.imagem_url || '/images/placeholder.png'}" alt="${oficina.nome}" class="result-card-img">
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
        
        const coordenadasDeTeste = [-23.2028, -47.2881]; 
        userMarker = L.marker(coordenadasDeTeste, { icon: userIcon }).addTo(mapa).bindPopup('<b>Você está aqui (Simulado)</b>').openPopup();
        mapa.setView(coordenadasDeTeste, 14);
        iniciarPagina(coordenadasDeTeste[0], coordenadasDeTeste[1]);
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
                    setTimeout(() => {
                        window.location.href = result.redirectUrl;
                    }, 1500);
                } else {
                    authMessage.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
                }
            } catch (error) {
                console.error('Erro ao enviar formulário:', error);
                authMessage.innerHTML = `<div class="alert alert-danger">Ocorreu um erro. Tente novamente.</div>`;
            }
        });
    }

    // --- LÓGICA DINÂMICA PARA O FORMULÁRIO DE HORÁRIO ---
    const secaoHorarios = document.querySelectorAll('.horario-dia');
    if (secaoHorarios.length > 0) {
        secaoHorarios.forEach(dia => {
            const checkbox = dia.querySelector('.dia-checkbox');
            const timeInputs = dia.querySelectorAll('.hora-input');

            checkbox.addEventListener('change', () => {
                timeInputs.forEach(input => {
                    input.disabled = !checkbox.checked;
                    if (!checkbox.checked) {
                        input.value = '';
                    }
                });
            });
        });
    }
    
    // --- LÓGICA PARA O FORMULÁRIO DE EDIÇÃO DA OFICINA ---
    const formEditarOficina = document.getElementById('form-editar-oficina');
    if (formEditarOficina) {
        formEditarOficina.addEventListener('submit', async (event) => {
            event.preventDefault();
            const editMessage = document.getElementById('edit-message');
            const formData = new FormData(formEditarOficina);
            const data = Object.fromEntries(formData.entries());
            editMessage.innerHTML = '';

            try {
                const response = await fetch('/painel/editar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                const result = await response.json();

                if (result.success) {
                    editMessage.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    setTimeout(() => {
                        window.location.href = '/painel';
                    }, 2000);
                } else {
                    editMessage.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
                }
            } catch (error) {
                console.error('Erro ao atualizar oficina:', error);
                editMessage.innerHTML = `<div class="alert alert-danger">Ocorreu um erro. Tente novamente.</div>`;
            }
        });
    }

    // --- LÓGICA DO FORMULÁRIO DE APLICAÇÃO DE PARCEIRO ---
    const formAplicarParceiro = document.getElementById('form-aplicar-parceiro');
    if (formAplicarParceiro) {
        formAplicarParceiro.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formMessage = document.getElementById('form-message');
            formMessage.innerHTML = '';

            let isValid = true;
            let errorMessage = '';

            const especialidadesChecked = formAplicarParceiro.querySelectorAll('input[name="especialidades"]:checked');
            if (especialidadesChecked.length === 0) {
                isValid = false;
                errorMessage += '<p>Por favor, selecione pelo menos uma especialidade.</p>';
            }

            const diasChecked = formAplicarParceiro.querySelectorAll('.dia-checkbox:checked');
            if (diasChecked.length === 0) {
                isValid = false;
                errorMessage += '<p>Por favor, defina o horário para pelo menos um dia da semana.</p>';
            } else {
                diasChecked.forEach(diaCheckbox => {
                    const diaRow = diaCheckbox.closest('.horario-dia');
                    const abreInput = diaRow.querySelector('input[name*="_abre"]');
                    const fechaInput = diaRow.querySelector('input[name*="_fecha"]');
                    if (!abreInput.value || !fechaInput.value) {
                        isValid = false;
                        errorMessage += `<p>Por favor, preencha o horário de abertura e fecho para ${diaCheckbox.value}.</p>`;
                    }
                });
            }

            if (!isValid) {
                formMessage.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
                return;
            }

            const formData = new FormData(formAplicarParceiro);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/quero-ser-parceiro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                 window.location.href = '/aguarde-aprovacao';
            } catch (error) {
                formMessage.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        });
    }
    
});