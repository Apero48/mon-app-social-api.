require('dotenv').config();
const express = require('express');
const { kv } = require('@vercel/kv');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ---- Helpers ----
async function getNextId(key) {
    return await kv.incr(`next:${key}:id`);
}

// ---- Router ----
const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
  res.json({ message: "Bienvenue sur l'API de Mon App Social !" });
});

// --- AUTH ---
apiRouter.post('/auth/register', async (req, res) => {
    try {
        const { nom, prenoms, email, password, ...rest } = req.body;
        if (!nom || !email || !password) {
            return res.status(400).json({ message: 'Champs requis manquants' });
        }

        const id = await getNextId('user');
        const newUser = { id, nom, prenoms, email, password, ...rest };

        await kv.set(`user:${email}`, newUser);
        res.status(201).json(newUser);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

apiRouter.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await kv.get(`user:${email}`);

        if (user && user.password === password) {
            res.status(200).json(user);
        } else {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- CATEGORIES ---
apiRouter.get('/users/:userId/categories', async (req, res) => {
    try {
        const { userId } = req.params;
        const categoryIds = await kv.zrange(
            `user:${userId}:categories`,
            0,
            -1,
            { rev: true }
        );

        if (categoryIds.length === 0) return res.json([]);

        const categories = await kv.mget(...categoryIds);
        res.json(categories.filter(c => c));

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

apiRouter.post('/categories', async (req, res) => {
    try {
        const { name, description, userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'userId manquant' });
        }

        const id = await getNextId('category');
        const now = new Date();

        const newCategory = {
            id,
            name,
            description,
            userId,
            createdAt: now,
            updatedAt: now
        };

        await kv.set(`category:${id}`, newCategory);
        await kv.zadd(`user:${userId}:categories`, {
            score: now.getTime(),
            member: `category:${id}`
        });

        res.status(201).json(newCategory);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- PRODUCTS ---
apiRouter.get('/users/:userId/products', async (req, res) => {
    try {
        const { userId } = req.params;

        const productIds = await kv.zrange(
            `user:${userId}:products`,
            0,
            -1,
            { rev: true }
        );

        if (productIds.length === 0) return res.json([]);

        const products = await kv.mget(...productIds);
        res.json(products.filter(p => p));

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

apiRouter.post('/products', async (req, res) => {
    try {
        const { name, description, price, quantity, categoryId, userId } = req.body;

        if (!userId || !categoryId) {
            return res.status(400).json({ message: 'userId ou categoryId manquant' });
        }

        const id = await getNextId('product');
        const now = new Date();

        const newProduct = {
            id,
            name,
            description,
            price,
            quantity,
            categoryId,
            userId,
            createdAt: now,
            updatedAt: now
        };

        await kv.set(`product:${id}`, newProduct);
        await kv.zadd(`user:${userId}:products`, {
            score: now.getTime(),
            member: `product:${id}`
        });

        res.status(201).json(newProduct);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.use('/api', apiRouter);

// Default route
app.get('/', (req, res) => {
  res.send('🚀 Mon API est en ligne et fonctionne !');
});

// EXPORT (important pour Vercel)
module.exports = app;

// ---- LOCAL SERVER ----
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`🚀 API lancée sur http://localhost:${PORT}`));
}