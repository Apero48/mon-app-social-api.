const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(bodyParser.json());

// --- "Base de données" en mémoire ---
let users = [];
let categories = [
    { id: 1, name: 'Électronique', description: 'Gadgets et appareils' },
    { id: 2, name: 'Livres', description: 'Livres et magazines' }
];
let products = [
    { id: 1, name: 'Smartphone Pro', description: 'Un super smartphone', price: 999.99 },
    { id: 2, name: 'Livre de Code', description: 'Apprendre à coder', price: 29.99 }
];
let nextUserId = 1;
let nextCategoryId = 3;
let nextProductId = 3;

// --- Router ---
const apiRouter = express.Router();

// Route d’accueil de l’API
apiRouter.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API de Mon App Social !' });
});

// --- Routes d'authentification ---
apiRouter.post('/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Champs manquants' });
    }
    const newUser = { id: nextUserId++, username, email, password };
    users.push(newUser);
    console.log('Nouvel utilisateur enregistré:', newUser);
    res.status(201).json(newUser);
});

apiRouter.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        console.log('Utilisateur connecté:', user);
        res.status(200).json(user);
    } else {
        res.status(401).json({ message: 'Identifiants incorrects' });
    }
});

// --- Routes pour les Catégories ---
apiRouter.get('/categories', (req, res) => {
    console.log('GET /api/categories');
    res.json(categories);
});

apiRouter.post('/categories', (req, res) => {
    const { name, description } = req.body;
    const newCategory = { id: nextCategoryId++, name, description };
    categories.push(newCategory);
    console.log('Nouvelle catégorie ajoutée:', newCategory);
    res.status(201).json(newCategory);
});

apiRouter.delete('/categories/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    categories = categories.filter(c => c.id !== id);
    console.log('Catégorie supprimée, id:', id);
    res.status(200).json({ message: 'Catégorie supprimée' });
});

// --- Routes pour les Produits ---
apiRouter.get('/products', (req, res) => {
    console.log('GET /api/products');
    res.json(products);
});

apiRouter.post('/products', (req, res) => {
    const { name, description, price } = req.body;
    const newProduct = { id: nextProductId++, name, description, price };
    products.push(newProduct);
    console.log('Nouveau produit ajouté:', newProduct);
    res.status(201).json(newProduct);
});

apiRouter.delete('/products/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    products = products.filter(p => p.id !== id);
    console.log('Produit supprimé, id:', id);
    res.status(200).json({ message: 'Produit supprimé' });
});

// --- Montage du router ---
app.use('/api', apiRouter);

// --- Route test à la racine ---
app.get('/', (req, res) => {
  res.send('🚀 Mon API est en ligne et fonctionne sur Vercel !');
});

// --- Export pour Vercel ---
module.exports = app;
