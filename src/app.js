const express = require('express');
const path = require('path');
const hbs = require('hbs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuração dos Caminhos ---
const publicDirectoryPath = path.join(__dirname, '..', 'public');
const viewsPath = path.join(__dirname, '..', 'views');
const partialsPath = path.join(__dirname, '..', 'views', 'partials');
const layoutsPath = path.join(__dirname, '..', 'views', 'layouts');

// --- Configuração do Handlebars (HBS) e da pasta Views ---
app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);
hbs.registerPartials(layoutsPath); // Registra também a pasta de layouts

// --- Configuração da pasta de arquivos estáticos (public) ---
app.use(express.static(publicDirectoryPath));

// --- ROTAS (agora usando res.render) ---

// Rota para a página inicial
app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layouts/main', // Especifica o layout a ser usado
        pageTitle: 'ConserteCar - Seu Guia Automotivo'
    });
});

// Rota para a página de serviços
app.get('/servicos', (req, res) => {
    res.render('servicos', {
        layout: 'layouts/main',
        pageTitle: 'Encontrar Serviços - ConserteCar'
    });
});

// Rota para a página de login
app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'layouts/main',
        pageTitle: 'Login - ConserteCar'
    });
});

// Rota para a página de cadastro
app.get('/cadastro', (req, res) => {
    res.render('cadastro', {
        layout: 'layouts/main',
        pageTitle: 'Cadastro - ConserteCar'
    });
});


// VAI COMEÇAR O SERVIDOR AQUI!
app.listen(PORT, () => {
    console.log(`Servidor ConserteCar rodando em http://localhost:${3000}`);
    console.log('Pressione Ctrl+C para parar o servidor.');
});
