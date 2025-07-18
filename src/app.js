const express = require('express');
const path = require('path');
const hbs = require('hbs');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');

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
hbs.registerPartials(layoutsPath);

// --- Configuração da pasta de arquivos estáticos (public) ---
app.use(express.static(publicDirectoryPath));

// --- Configuração para receber dados de formulários ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Configuração de Sessões ---
app.use(session({
    secret: 'seu_segredo_super_secreto_e_aleatorio',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// --- NOVO: Middleware para proteger rotas de parceiros ---
const requirePartnerLogin = (req, res, next) => {
    if (req.session.isLoggedIn && req.session.user && req.session.user.tipo === 'parceiro') {
        next(); // Se for um parceiro logado, continua
    } else {
        res.redirect('/login'); // Caso contrário, redireciona para o login
    }
};


// --- ROTAS DAS PÁGINAS (Views) ---
app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layouts/main',
        pageTitle: 'ConserteCar - Seu Guia Automotivo',
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user
    });
});

app.get('/servicos', (req, res) => {
    res.render('servicos', {
        layout: 'layouts/main',
        pageTitle: 'Encontrar Serviços - ConserteCar',
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user
    });
});

app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'layouts/main',
        pageTitle: 'Login - ConserteCar',
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user
    });
});

app.get('/cadastro', (req, res) => {
    res.render('cadastro', {
        layout: 'layouts/main',
        pageTitle: 'Cadastro - ConserteCar',
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user
    });
});

// --- NOVA ROTA PARA O PAINEL DO PARCEIRO (PROTEGIDA) ---
app.get('/painel', requirePartnerLogin, async (req, res) => {
    try {
        // Busca a oficina que pertence ao utilizador logado
        const [oficinas] = await db.query('SELECT * FROM oficinas WHERE dono_id = ?', [req.session.user.id]);
        
        const oficina = oficinas.length > 0 ? oficinas[0] : null;

        res.render('painel', {
            layout: 'layouts/main',
            pageTitle: 'Painel do Parceiro - ConserteCar',
            isLoggedIn: req.session.isLoggedIn,
            user: req.session.user,
            oficina: oficina // Envia os dados da oficina para a página
        });
    } catch (error) {
        console.error("Erro ao carregar o painel:", error);
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) { return res.redirect('/'); }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});


// --- ROTAS DE API ---
app.get('/api/oficinas', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const raio_km = 50; 

        let query;
        let queryParams = [];

        if (lat && lon) {
            query = `
                SELECT 
                    o.id, o.nome, o.endereco, o.lat, o.lon, o.rating, o.imagem_url as img,
                    (6371 * acos(cos(radians(?)) * cos(radians(o.lat)) * cos(radians(o.lon) - radians(?)) + sin(radians(?)) * sin(radians(o.lat)))) AS distancia,
                    (SELECT GROUP_CONCAT(servico_nome SEPARATOR ', ') FROM servicos_oficina WHERE oficina_id = o.id) as servicos
                FROM oficinas o
                HAVING distancia < ?
                ORDER BY distancia;
            `;
            queryParams = [lat, lon, lat, raio_km];
        } else {
            query = `
                SELECT o.id, o.nome, o.endereco, o.lat, o.lon, o.rating, o.imagem_url as img, 
                       (SELECT GROUP_CONCAT(servico_nome SEPARATOR ', ') FROM servicos_oficina WHERE oficina_id = o.id) as servicos
                FROM oficinas o
                GROUP BY o.id;
            `;
        }

        const [oficinas] = await db.query(query, queryParams);

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

app.post('/cadastro', async (req, res) => {
    try {
        const { nome_completo, email, senha, tipo_cliente } = req.body;
        if (!nome_completo || !email || !senha || !tipo_cliente) {
            return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
        }
        const [users] = await db.query('SELECT id FROM clientes WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(409).json({ success: false, message: 'Este email já está a ser utilizado.' });
        }
        const salt = await bcrypt.genSalt(10);
        const senhaEncriptada = await bcrypt.hash(senha, salt);
        await db.query('INSERT INTO clientes (nome_completo, email, senha, tipo_cliente) VALUES (?, ?, ?, ?)', [nome_completo, email, senhaEncriptada, tipo_cliente]);
        res.status(201).json({ success: true, message: 'Cadastro realizado com sucesso! Pode agora fazer o login.' });
    } catch (error) {
        console.error("Erro no cadastro:", error);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor. Tente novamente mais tarde.' });
    }
});

// --- ROTA DE LOGIN ATUALIZADA COM REDIRECIONAMENTO ---
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios.' });
        }
        const [users] = await db.query('SELECT * FROM clientes WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }
        const user = users[0];
        const senhaCorreta = await bcrypt.compare(senha, user.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }
        req.session.user = {
            id: user.id,
            nome: user.nome_completo,
            email: user.email,
            tipo: user.tipo_cliente
        };
        req.session.isLoggedIn = true;

        // --- LÓGICA DE REDIRECIONAMENTO ---
        let redirectUrl = '/'; // Padrão: redireciona para a página inicial
        if (user.tipo_cliente === 'parceiro') {
            redirectUrl = '/painel'; // Se for parceiro, redireciona para o painel
        }

        res.status(200).json({ success: true, message: 'Login bem-sucedido!', redirectUrl: redirectUrl });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor.' });
    }
});


// VAI COMEÇAR O SERVIDOR AQUI!
app.listen(PORT, () => {
    console.log(`Servidor ConserteCar rodando em http://localhost:${3000}`);
    console.log('Pressione Ctrl+C para parar o servidor.');
});
