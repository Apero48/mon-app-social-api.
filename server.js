const express = require('express');
const { createClient } = require('@vercel/kv');
const cors = require('cors');

const app = express();

// Initialiser le client KV
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// --- Middlewares ---
app.use(cors());
app.use(express.json()); // Remplacer bodyParser, express.json() est standard

// --- Router ---
const apiRouter = express.Router();

// Route d’accueil de l’API
apiRouter.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API de Mon App Social !' });
});

// --- Fonctions utilitaires pour les IDs ---
async function getNextId(key) {
    return await kv.incr(`next:${key}:id`);
}

// --- Routes pour les Catégories ---
apiRouter.get('/categories', async (req, res) => {
    try {
        const categoryIds = await kv.zrange('categories', 0, -1);
        if (categoryIds.length === 0) return res.json([]);
        const categories = await kv.mget(...categoryIds);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

apiRouter.post('/categories', async (req, res) => {
    try {
        const { name, description } = req.body;
        const id = await getNextId('category');
        const newCategory = { id, name, description };
        
        await kv.set(`category:${id}`, newCategory);
        await kv.zadd('categories', { score: id, member: `category:${id}` });
        
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Routes pour les Produits ---
apiRouter.get('/products', async (req, res) => {
    try {
        const productIds = await kv.zrange('products', 0, -1);
        if (productIds.length === 0) return res.json([]);
        const products = await kv.mget(...productIds);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

apiRouter.post('/products', async (req, res) => {
    try {
        const { name, description, price } = req.body;
        const id = await getNextId('product');
        const newProduct = { id, name, description, price };

        await kv.set(`product:${id}`, newProduct);
        await kv.zadd('products', { score: id, member: `product:${id}` });

        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Préfixer toutes les routes avec /api
app.use('/api', apiRouter);

// --- Route test à la racine ---
app.get('/', (req, res) => {
  res.send('🚀 Mon API est en ligne et fonctionne sur Vercel !');
});

// --- Export pour Vercel ---
module.exports = app;
