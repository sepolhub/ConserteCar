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
                
                const pontoOficina = [oficina.lat, oficina.lon];
                pontosParaZoom.push(pontoOficina);

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

                const marker = L.marker(pontoOficina, { icon: workshopIcon })
                    .addTo(mapa)
                    .bindPopup(popupContent);
                
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
            const filtrosSelecionados = Array.from(checkboxesFiltro)
                .filter(i => i.checked)
                .map(i => i.value);
            
            const ordenacao = sortBySelect ? sortBySelect.value : 'distancia';
            const latLng = userMarker ? userMarker.getLatLng() : null;

            iniciarPagina({
                lat: latLng ? latLng.lat : null,
                lon: latLng ? latLng.lng : null,
                servicos: filtrosSelecionados,
                ordenarPor: ordenacao
            });
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

        async function iniciarPagina(filtros = {}) {
            try {
                const params = new URLSearchParams();
                if (filtros.lat && filtros.lon) {
                    params.append('lat', filtros.lat);
                    params.append('lon', filtros.lon);
                }
                if (filtros.servicos && filtros.servicos.length > 0) {
                    params.append('servicos', filtros.servicos.join(','));
                }
                if (filtros.ordenarPor) {
                    params.append('ordenarPor', filtros.ordenarPor);
                }
                const apiUrl = `/api/oficinas?${params.toString()}`;
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('Falha ao carregar dados.');
                
                const oficinas = await response.json();
                renderizarOficinas(oficinas);

            } catch (error) {
                console.error("Erro ao iniciar:", error);
                document.getElementById('lista-resultados').innerHTML = `<div class="alert alert-danger">Erro ao carregar oficinas.</div>`;
            }
        }
        
        const coordenadasDeTeste = [-23.2028, -47.2881]; 
        userMarker = L.marker(coordenadasDeTeste, { icon: userIcon }).addTo(mapa).bindPopup('<b>Você está aqui (Simulado)</b>').openPopup();
        mapa.setView(coordenadasDeTeste, 14);
        iniciarPagina({ lat: coordenadasDeTeste[0], lon: coordenadasDeTeste[1] });
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

    // --- LÓGICA PARA O FORMULÁRIO DE EDIÇÃO DE PERFIL DO CLIENTE ---
    const formEditarPerfil = document.getElementById('form-editar-perfil');
    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', async (event) => {
            event.preventDefault();
            const profileMessage = document.getElementById('profile-message');
            const formData = new FormData(formEditarPerfil);
            const data = Object.fromEntries(formData.entries());
            profileMessage.innerHTML = '';
            try {
                const response = await fetch('/perfil/editar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await response.json();
                if (result.success) {
                    profileMessage.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    const userNameInHeader = document.querySelector('#navbarDropdown');
                    if (userNameInHeader) {
                        userNameInHeader.innerText = `Olá, ${data.nome_completo}`;
                    }
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                profileMessage.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        });
    }

    // --- LÓGICA DO FORMULÁRIO DE APLICAÇÃO DE PARCEIRO ---
    const formAplicarParceiro = document.getElementById('form-aplicar-parceiro');
    if (formAplicarParceiro) {
        // Lógica de validação do formulário
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
            if (diasChecked.length > 0) {
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
                if (result.success) {
                    window.location.href = '/aguarde-aprovacao';
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                formMessage.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        });

        // Lógica dinâmica para os horários (na página de aplicação)
        const secaoHorariosAplicacao = formAplicarParceiro.querySelectorAll('.horario-dia');
        secaoHorariosAplicacao.forEach(dia => {
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

    // --- LÓGICA PARA PÁGINA DE EDIÇÃO DE OFICINA ---
    const formEditarOficina = document.getElementById('form-editar-oficina');
    if (formEditarOficina) {
        // Lógica para preencher o formulário com dados existentes
        if (typeof oficinaData !== 'undefined') {
            const todasEspecialidades = ['Mecânica Geral', 'Elétrica', 'Funilaria e Pintura', 'Borracharia'];
            const todasFormasPagamento = ['Cartão de Crédito', 'PIX', 'Dinheiro'];
            const horariosSalvos = JSON.parse(oficinaData.horario_funcionamento || '{}');
            const especialidadesSalvas = oficinaData.especialidades ? oficinaData.especialidades.split(', ') : [];
            const pagamentosSalvos = oficinaData.formas_pagamento ? oficinaData.formas_pagamento.split(', ') : [];
            
            const secaoEspecialidades = document.getElementById('secao-especialidades-edicao');
            if(secaoEspecialidades) {
                todasEspecialidades.forEach(esp => {
                    const isChecked = especialidadesSalvas.includes(esp);
                    const id = `esp-${esp.replace(/[^a-zA-Z0-9]/g, '')}`;
                    secaoEspecialidades.innerHTML += `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="especialidades" value="${esp}" id="${id}" ${isChecked ? 'checked' : ''}>
                            <label class="form-check-label" for="${id}">${esp}</label>
                        </div>
                    `;
                });
            }

            const secaoPagamentos = document.getElementById('secao-pagamentos-edicao');
            if(secaoPagamentos) {
                todasFormasPagamento.forEach(pag => {
                    const isChecked = pagamentosSalvos.includes(pag);
                    const id = `pag-${pag.replace(/[^a-zA-Z0-9]/g, '')}`;
                    secaoPagamentos.innerHTML += `
                        <div class="form-check me-3 d-inline-block">
                            <input class="form-check-input" type="checkbox" name="formas_pagamento" value="${pag}" id="${id}" ${isChecked ? 'checked' : ''}>
                            <label class="form-check-label" for="${id}">${pag}</label>
                        </div>
                    `;
                });
            }

            const secaoHorariosEdicao = document.getElementById('secao-horarios-edicao');
            if(secaoHorariosEdicao) {
                const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
                const diasLabel = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
                dias.forEach((dia, index) => {
                    const abre = horariosSalvos[`${dia}_abre`] || '';
                    const fecha = horariosSalvos[`${dia}_fecha`] || '';
                    const isChecked = !!(abre && fecha);
                    secaoHorariosEdicao.innerHTML += `
                        <div class="row align-items-center mb-2 horario-dia">
                            <div class="col-lg-3 col-md-4 col-5">
                                <div class="form-check">
                                    <input class="form-check-input dia-checkbox" type="checkbox" name="${dia}_check" value="${diasLabel[index]}" id="${dia}" ${isChecked ? 'checked' : ''}>
                                    <label class="form-check-label" for="${dia}">${diasLabel[index]}</label>
                                </div>
                            </div>
                            <div class="col"><input type="time" class="form-control hora-input" name="${dia}_abre" value="${abre}" ${!isChecked ? 'disabled' : ''}></div>
                            <div class="col-auto text-center">às</div>
                            <div class="col"><input type="time" class="form-control hora-input" name="${dia}_fecha" value="${fecha}" ${!isChecked ? 'disabled' : ''}></div>
                        </div>
                    `;
                });
            
                const secaoHorarios = secaoHorariosEdicao.querySelectorAll('.horario-dia');
                secaoHorarios.forEach(dia => {
                    const checkbox = dia.querySelector('.dia-checkbox');
                    const timeInputs = dia.querySelectorAll('.hora-input');
                    checkbox.addEventListener('change', () => {
                        timeInputs.forEach(input => {
                            input.disabled = !checkbox.checked;
                            if (!checkbox.checked) input.value = '';
                        });
                    });
                });
            }
        }
        
        // Lógica de SUBMIT do formulário de edição
        formEditarOficina.addEventListener('submit', async (event) => {
            event.preventDefault();
            const editMessage = document.getElementById('edit-message');
            const formData = new FormData(formEditarOficina);
            const data = Object.fromEntries(formData.entries());
            editMessage.innerHTML = '';
            try {
                const response = await fetch('/painel/editar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await response.json();
                if (result.success) {
                    editMessage.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                editMessage.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        });
    }

    
    // LÓGICA PARA EXIBIR O HORÁRIO DE FUNCIONAMENTO NO PAINEL
    const horarioDisplay = document.getElementById('horario-display');
if (horarioDisplay) {
    const horariosData = horarioDisplay.getAttribute('data-horarios');
    
    // MODO DE DEPURAÇÃO: Mostra os dados brutos diretamente na página
    if (horariosData) {
        horarioDisplay.innerHTML = `
            <p><strong>Dados Brutos Recebidos (para depuração):</strong></p>
            <pre style="background-color: #eee; border: 1px solid #ccc; padding: 10px; white-space: pre-wrap; word-wrap: break-word;">${horariosData}</pre>
        `;
    } else {
        horarioDisplay.innerHTML = '<p class="text-info">Atributo data-horarios não foi encontrado ou está vazio.</p>';
    }
}
    
});