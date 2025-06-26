const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar o Express para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rota para a página inicial (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Exemplo de rota para uma página de login (que criaremos depois)
app.get('/login', (req, res) => {
    res.send('Página de Login (em construção)');
});

// Exemplo de rota para uma página de cadastro (que criaremos depois)
app.get('/cadastro', (req, res) => {
    res.send('Página de Cadastro (em construção)');
});

// VAI COMEÇAR O SERVIDOR AQUI!
app.listen(PORT, () => {
    console.log(`Servidor ConserteCar rodando em http://localhost:${3000}`);
    console.log('Pressione Ctrl+C para parar o servidor.');
});