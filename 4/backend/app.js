const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

let products = [
  {
    id: nanoid(6),
    name: 'Мастер и Маргарита',
    category: 'Классика',
    description: 'Великий роман Михаила Булгакова о визите дьявола в Москву',
    price: 450,
    stock: 12
  },
  {
    id: nanoid(6),
    name: '1984',
    category: 'Антиутопия',
    description: 'Роман-предупреждение Джорджа Оруэлла о тоталитаризме',
    price: 380,
    stock: 8
  },
  {
    id: nanoid(6),
    name: 'Преступление и наказание',
    category: 'Классика',
    description: 'Философский роман Федора Достоевского о морали и искуплении',
    price: 520,
    stock: 5
  },
  {
    id: nanoid(6),
    name: 'Маленький принц',
    category: 'Сказка',
    description: 'Философская сказка Антуана де Сент-Экзюпери о дружбе и любви',
    price: 290,
    stock: 15
  },
  {
    id: nanoid(6),
    name: 'Гарри Поттер и философский камень',
    category: 'Фэнтези',
    description: 'Первая книга о мальчике, который выжил',
    price: 650,
    stock: 7
  },
  {
    id: nanoid(6),
    name: 'Три товарища',
    category: 'Роман',
    description: 'Эрих Мария Ремарк о дружбе и любви в послевоенной Германии',
    price: 410,
    stock: 4
  },
  {
    id: nanoid(6),
    name: 'Алхимик',
    category: 'Притча',
    description: 'Пауло Коэльо о путешествии к своей мечте',
    price: 350,
    stock: 9
  },
  {
    id: nanoid(6),
    name: 'Война и мир. Том 1',
    category: 'Классика',
    description: 'Эпопея Льва Толстого о жизни русского общества',
    price: 680,
    stock: 3
  },
  {
    id: nanoid(6),
    name: 'Портрет Дориана Грея',
    category: 'Роман',
    description: 'Оскар Уайльд о вечной молодости и цене красоты',
    price: 390,
    stock: 6
  },
  {
    id: nanoid(6),
    name: 'Вино из одуванчиков',
    category: 'Роман',
    description: 'Рэй Брэдбери о лете, детстве и воспоминаниях',
    price: 440,
    stock: 10
  }
];

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

//GET /api/products - получить все товары
app.get('/api/products', (req, res) => {
  res.json(products);
});

//GET /api/products/:id - получить товар по ID
app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

//POST /api/products - создать товар
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock } = req.body;

  if (!name?.trim() || !category?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Name, category and description are required' });
  }

  if (price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Price and stock are required' });
  }

  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock)
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.patch('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  const { name, category, description, price, stock } = req.body;

  if (!name && !category && !description && price === undefined && stock === undefined) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);

  res.json(product);
});

//DELETE /api/products/:id - удалить товар
app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const exists = products.some(p => p.id === id);
  
  if (!exists) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

//404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

//обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});