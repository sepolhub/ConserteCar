const express = require('express');
const path = require('path');
const hbs = require('hbs');
const mysql = require('mysql2'); // Adicionado
const bcrypt = require('bcrypt'); // Adicionado

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuração da Ligação à Base de Dados ---
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // ATENÇÃO: Troque pela sua senha do MySQL.
    database: 'consertecar_db'
}).promise();

// --- Configuração dos Caminhos ---
const publicDirectoryPath = path.join(__dirname, '..', 'public');
const viewsPath = path.join(__dirname, '..', 'views');
const partialsPath = path.join(__dirname, '..', 'views', 'partials');
const layoutsPath = path.join(__dirname, '..', 'views', 'layouts');

// --- Configuração do Handlebars (HBS) e da pasta Views ---
app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);
hbs.registerPartials(layoutsPath); // A sua linha original, mantida.

// --- Configuração da pasta de arquivos estáticos (public) ---
app.use(express.static(publicDirectoryPath));

// --- Configuração para receber dados de formulários ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROTAS DAS PÁGINAS (Views) ---
// Mantive a sua estrutura original de renderização
app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layouts/main',
        pageTitle: 'ConserteCar - Seu Guia Automotivo'
    });
});

app.get('/servicos', (req, res) => {
    res.render('servicos', {
        layout: 'layouts/main',
        pageTitle: 'Encontrar Serviços - ConserteCar'
    });
});

app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'layouts/main',
        pageTitle: 'Login - ConserteCar'
    });
});

app.get('/cadastro', (req, res) => {
    res.render('cadastro', {
        layout: 'layouts/main',
        pageTitle: 'Cadastro - ConserteCar'
    });
});

// --- ROTA DE API PARA BUSCAR OFICINAS ---
app.get('/api/oficinas', async (req, res) => {
    try {
        const query = `
            SELECT 
                o.id, o.nome, o.endereco, o.lat, o.lon, o.rating, o.imagem_url as img,
                GROUP_CONCAT(so.servico_nome SEPARATOR ', ') as servicos
            FROM oficinas o
            LEFT JOIN servicos_oficina so ON o.id = so.oficina_id
            GROUP BY o.id;
        `;
        const [oficinas] = await db.query(query);
        const oficinasComServicosArray = oficinas.map(oficina => ({
            ...oficina,
            servicos: oficina.servicos ? oficina.servicos.split(', ') : []
        }));
        res.json(oficinasComServicosArray);
    } catch (error) {
        console.error("Erro ao buscar oficinas:", error);
        res.status(500).json({ error: 'Erro ao conectar-se à base de dados.' });
    }
});

// --- ROTA DE API PARA PROCESSAR O CADASTRO ---
app.post('/cadastro', async (req, res) => {
    try {
        const { nome_completo, email, senha } = req.body;
        if (!nome_completo || !email || !senha) {
            return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
        }
        const [users] = await db.query('SELECT id FROM clientes WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(409).json({ success: false, message: 'Este email já está a ser utilizado.' });
        }
        const salt = await bcrypt.genSalt(10);
        const senhaEncriptada = await bcrypt.hash(senha, salt);
        await db.query('INSERT INTO clientes (nome_completo, email, senha) VALUES (?, ?, ?)', [nome_completo, email, senhaEncriptada]);
        res.status(201).json({ success: true, message: 'Cadastro realizado com sucesso! Pode agora fazer o login.' });
    } catch (error) {
        console.error("Erro no cadastro:", error);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor. Tente novamente mais tarde.' });
    }
});


// VAI COMEÇAR O SERVIDOR AQUI!
app.listen(PORT, () => {
    console.log(`Servidor ConserteCar rodando em http://localhost:${3000}`);
    console.log('Pressione Ctrl+C para parar o servidor.');
});
