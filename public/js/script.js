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

    // --- NOVA LÓGICA PARA INICIALIZAR O SWIPER.JS ---
    const swiper = new Swiper('.oficinas-swiper', {
        // Quantos slides mostrar
        slidesPerView: 1,
        // Espaçamento entre os slides
        spaceBetween: 30,
        // Configuração da paginação (bolinhas)
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        // Configuração da navegação (setas)
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        // Configuração responsiva
        breakpoints: {
            // quando a tela for maior ou igual a 768px
            768: {
                slidesPerView: 2,
                spaceBetween: 30,
            },
            // quando a tela for maior ou igual a 992px
            992: {
                slidesPerView: 3,
                spaceBetween: 30,
            }
        }
    });

});