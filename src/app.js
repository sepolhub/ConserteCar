// --- DEPENDÊNCIAS ---
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuração da Ligação à Base de Dados ---
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();


// --- Configuração dos Caminhos ---
const publicDirectoryPath = path.join(__dirname, '..', 'public');
const viewsPath = path.join(__dirname, '..', 'views');
const partialsPath = path.join(__dirname, '..', 'views', 'partials');
const layoutsPath = path.join(__dirname, '..', 'views', 'layouts');

// --- Configuração do Handlebars ---
app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);
hbs.registerPartials(layoutsPath);

// --- Configuração da pasta de arquivos estáticos ---
app.use(express.static(publicDirectoryPath));

// --- Configuração para receber dados de formulários ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Configuração de Sessões ---
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // Cookie válido por 1 dia
    }
}));

// --- NOVO MIDDLEWARE DE CONTEXTO DO UTILIZADOR ---
app.use((req, res, next) => {
    if (req.session.user) {
        res.locals.user = req.session.user;
        res.locals.isLoggedIn = req.session.isLoggedIn;
        res.locals.user.isPartner = (req.session.user.tipo === 'parceiro');
    }
    next();
});


// --- Middleware para proteger rotas de parceiros ---
const requirePartnerLogin = (req, res, next) => {
    if (req.session.isLoggedIn && req.session.user && req.session.user.tipo === 'parceiro') {
        next();
    } else {
        res.redirect('/login');
    }
};


// --- ROTAS DAS PÁGINAS ---
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

app.get('/perfil', (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    res.render('perfil', {
        layout: 'layouts/main',
        pageTitle: 'Meu Perfil - ConserteCar'
    });
});

app.get('/painel', requirePartnerLogin, async (req, res) => {
    try {
        const [oficinas] = await db.query('SELECT * FROM oficinas WHERE dono_id = ?', [req.session.user.id]);
        const oficina = oficinas.length > 0 ? oficinas[0] : null;
        res.render('painel', {
            layout: 'layouts/main',
            pageTitle: 'Painel do Parceiro',
            oficina: oficina
        });
    } catch (error) {
        console.error("Erro ao carregar o painel:", error);
        res.redirect('/');
    }
});

app.get('/painel/editar', requirePartnerLogin, async (req, res) => {
    try {
        const [oficinas] = await db.query('SELECT * FROM oficinas WHERE dono_id = ?', [req.session.user.id]);
        if (oficinas.length === 0) {
            return res.redirect('/painel');
        }
        res.render('editar-oficina', {
            layout: 'layouts/main',
            pageTitle: 'Editar Oficina',
            oficina: oficinas[0]
        });
    } catch (error) {
        console.error("Erro ao carregar página de edição:", error);
        res.redirect('/painel');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) { return res.redirect('/'); }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.get('/quero-ser-parceiro', (req, res) => {
    res.render('quero-ser-parceiro', {
        layout: 'layouts/main',
        pageTitle: 'Quero ser um Parceiro - ConserteCar'
    });
});

app.get('/aguarde-aprovacao', (req, res) => {
    res.render('aguarde-aprovacao', {
        layout: 'layouts/main',
        pageTitle: 'Aplicação Recebida - ConserteCar'
    });
});

// --- ROTAS DE API ---
app.get('/api/oficinas', async (req, res) => {
    try {
        const { lat, lon, servicos, ordenarPor } = req.query;
        const raio_km = 50; 

        // --- INÍCIO DA DEPURAÇÃO ---
        console.log("\n--- NOVA REQUISIÇÃO PARA /api/oficinas ---");
        console.log("Filtros recebidos:", { lat, lon, servicos, ordenarPor });
        // --- FIM DA DEPURAÇÃO ---

        let queryParams = [];
        let whereClauses = ["o.status = 'aprovado'"];
        
        if (servicos) {
            const listaServicos = servicos.split(',');
            whereClauses.push(`
                EXISTS (
                    SELECT 1 FROM servicos_oficina so 
                    WHERE so.oficina_id = o.id AND so.servico_nome IN (?)
                )
            `);
            queryParams.push(listaServicos);
        }

        let query = `
            SELECT 
                o.id, o.nome, o.status, o.lat, o.lon, o.rating, 
                (SELECT GROUP_CONCAT(so.servico_nome SEPARATOR ', ') FROM servicos_oficina so WHERE so.oficina_id = o.id) as servicos
                ${lat && lon ? `, (6371 * acos(cos(radians(?)) * cos(radians(o.lat)) * cos(radians(o.lon) - radians(?)) + sin(radians(?)) * sin(radians(o.lat)))) AS distancia` : ''}
            FROM oficinas o
            WHERE ${whereClauses.join(' AND ')}
        `;

        if (lat && lon) {
            queryParams.unshift(lat, lon, lat);
            query += ` HAVING distancia < ?`;
            queryParams.push(raio_km);
        }

        if (ordenarPor === 'avaliacao') {
            query += ` ORDER BY o.rating DESC`;
        } else if (lat && lon) {
            query += ` ORDER BY distancia ASC`;
        }

        // --- INÍCIO DA DEPURAÇÃO ---
        console.log("Query SQL a ser executada:", query);
        console.log("Parâmetros da Query:", queryParams);
        // --- FIM DA DEPURAÇÃO ---

        const [oficinas] = await db.query(query, queryParams);
        
        // --- INÍCIO DA DEPURAÇÃO ---
        console.log(`Resultado bruto da base de dados: Encontradas ${oficinas.length} oficinas.`);
        console.log(oficinas);
        // --- FIM DA DEPURAÇÃO ---
        
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
        const { nome_completo, email, senha, telefone, cep, endereco, cpf, veiculo_marca, veiculo_modelo, veiculo_ano, placa_veiculo } = req.body;
        
        if (!nome_completo || !email || !senha || !cpf) {
            return res.status(400).json({ success: false, message: 'Os campos de nome, email, senha e CPF são obrigatórios.' });
        }

        const [users] = await db.query('SELECT id FROM clientes WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(409).json({ success: false, message: 'Este email já está a ser utilizado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaEncriptada = await bcrypt.hash(senha, salt);
        
        await db.query(
            'INSERT INTO clientes (nome_completo, email, senha, tipo_cliente, telefone, cep, endereco, cpf, veiculo_marca, veiculo_modelo, veiculo_ano, placa_veiculo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nome_completo, email, senhaEncriptada, 'cliente', telefone, cep, endereco, cpf, veiculo_marca, veiculo_modelo, veiculo_ano, placa_veiculo]
        );
        
        res.status(201).json({ success: true, message: 'Cadastro realizado com sucesso! Pode agora fazer o login.' });

    } catch (error) {
        console.error("Erro no cadastro:", error);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor. Tente novamente mais tarde.' });
    }
});

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

        if (user.tipo_cliente === 'parceiro') {
            const [oficinas] = await db.query('SELECT status FROM oficinas WHERE dono_id = ?', [user.id]);
            if (oficinas.length === 0 || oficinas[0].status !== 'aprovado') {
                return res.status(403).json({ success: false, message: 'A sua conta de parceiro ainda está pendente de aprovação.' });
            }
        }

        req.session.user = { id: user.id, nome: user.nome_completo, email: user.email, tipo: user.tipo_cliente };
        req.session.isLoggedIn = true;

        let redirectUrl = (user.tipo_cliente === 'parceiro') ? '/painel' : '/';
        res.status(200).json({ success: true, message: 'Login bem-sucedido!', redirectUrl: redirectUrl });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor.' });
    }
});

app.post('/quero-ser-parceiro', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { nome_completo, email, senha, ...dadosOficina } = req.body;
        
        if (!nome_completo || !email || !senha) {
            throw new Error('Nome, email e senha são obrigatórios.');
        }

        const [users] = await connection.query('SELECT id FROM clientes WHERE email = ?', [email]);
        if (users.length > 0) {
            throw new Error('Este email já está a ser utilizado.');
        }

        const salt = await bcrypt.genSalt(10);
        const senhaEncriptada = await bcrypt.hash(senha, salt);

        const [resultCliente] = await connection.query(
            'INSERT INTO clientes (nome_completo, email, senha, tipo_cliente) VALUES (?, ?, ?, ?)',
            [nome_completo, email, senhaEncriptada, 'parceiro']
        );
        const novoDonoId = resultCliente.insertId;

        const { logradouro, numero, cidade, estado } = dadosOficina;
        const enderecoCompleto = `${logradouro}, ${numero}, ${cidade}, ${estado}, Brasil`;
        const urlApi = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}`;
        let lat = null, lon = null;
        
        const geoResponse = await fetch(urlApi, { headers: { 'User-Agent': 'ConserteCarApp/1.0 (seuemail@exemplo.com)' } });
        const geoData = await geoResponse.json();
        if (geoData && geoData.length > 0) {
            lat = geoData[0].lat;
            lon = geoData[0].lon;
        }

        const { nome_oficina, cnpj, telefone, cep, bairro, complemento, nome_responsavel, website, especialidades, formas_pagamento, descricao, ...horarios } = dadosOficina;
        const especialidadesFormatado = Array.isArray(especialidades) ? especialidades.join(', ') : especialidades;
        const pagamentosFormatado = Array.isArray(formas_pagamento) ? formas_pagamento.join(', ') : formas_pagamento;
        const horariosJSON = JSON.stringify(horarios);

        await connection.query(
            `INSERT INTO oficinas (dono_id, nome, cnpj, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, lat, lon, nome_responsavel, website, especialidades, formas_pagamento, descricao, horario_funcionamento, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
            [novoDonoId, nome_oficina, cnpj, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, lat, lon, nome_responsavel, website, especialidadesFormatado, pagamentosFormatado, descricao, horariosJSON]
        );

        await connection.commit();

        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
        const mailOptions = { from: `Plataforma ConserteCar <${process.env.EMAIL_USER}>`, to: process.env.EMAIL_USER, subject: 'Novo Registo de Parceiro PENDENTE!', html: `<h1>Novo registo de parceiro recebido.</h1><p>Acesse o painel de administração para rever e aprovar a oficina: ${nome_oficina}.</p>` };
        await transporter.sendMail(mailOptions);
        
        res.status(201).json({ success: true, message: 'Registo realizado! A sua conta será revista e aprovada em breve.' });

    } catch (error) {
        await connection.rollback();
        console.error('Erro no registo de parceiro:', error);
        res.status(500).json({ success: false, message: error.message || 'Ocorreu um erro no servidor.' });
    } finally {
        connection.release();
    }
});

app.post('/painel/editar', requirePartnerLogin, async (req, res) => {
    try {
        const { nome, endereco } = req.body;
        const dono_id = req.session.user.id;
        await db.query(
            'UPDATE oficinas SET nome = ?, endereco = ? WHERE dono_id = ?',
            [nome, endereco, dono_id]
        );
        res.json({ success: true, message: 'Informações da oficina atualizadas com sucesso!' });
    } catch (error) {
        console.error("Erro ao atualizar oficina:", error);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor.' });
    }
});


// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor ConserteCar rodando em http://localhost:${PORT}`);
    console.log('Pressione Ctrl+C para parar o servidor.');
});