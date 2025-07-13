const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar o Express para servir arquivos estáticos da pasta 'public'
// Esta linha já está correta e é muito importante.
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rota para a página inicial (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// --- ROTAS ATUALIZADAS PARA LOGIN E CADASTRO ---

// Rota para a página de login
app.get('/login', (req, res) => {
    // Em vez de enviar texto, agora envia o arquivo HTML
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Rota para a página de cadastro
app.get('/cadastro', (req, res) => {
    // Em vez de enviar texto, agora envia o arquivo HTML
    res.sendFile(path.join(__dirname, '..', 'public', 'cadastro.html'));
});

// VAI COMEÇAR O SERVIDOR AQUI!
app.listen(PORT, () => {
    console.log(`Servidor ConserteCar rodando em http://localhost:${PORT}`);
    console.log('Pressione Ctrl+C para parar o servidor.');
});
