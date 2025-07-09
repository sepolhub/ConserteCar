// Espera todo o conteúdo da página carregar antes de executar os scripts
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DO MENU RESPONSIVO (MOVIDA DO HTML PARA CÁ) ---
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
        // Mostra ou esconde o botão baseado na rolagem da página
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { // Mostra o botão depois de rolar 300px
                btnVoltarAoTopo.classList.add('show');
            } else {
                btnVoltarAoTopo.classList.remove('show');
            }
        });

        // Faz a página rolar suavemente para o topo ao clicar
        btnVoltarAoTopo.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- LÓGICA DO FORMULÁRIO DE CONTATO SEM RECARREGAR ---
    const contactForm = document.querySelector('.contact-form');
    const formMessage = document.getElementById('form-message');

    if (contactForm && formMessage) {
        contactForm.addEventListener('submit', (event) => {
            // 1. Previne o comportamento padrão do formulário (que é recarregar a página)
            event.preventDefault();

            // 2. Mostra uma mensagem de sucesso
            formMessage.innerHTML = `
                <div class="alert alert-success" role="alert">
                  <strong>Mensagem enviada com sucesso!</strong> Entraremos em contato em breve.
                </div>
            `;
            
            // 3. Limpa os campos do formulário
            contactForm.reset();

            // 4. (Opcional) Faz a mensagem desaparecer depois de alguns segundos
            setTimeout(() => {
                formMessage.innerHTML = '';
            }, 5000); // 5000 milissegundos = 5 segundos

            // NOTA FUTURA: Aqui seria o local para adicionar o código `fetch()`
            // para enviar os dados para um servidor backend de verdade.
        });
    }

});