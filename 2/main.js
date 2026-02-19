const express = require('express');
const app = express();
const port = 3000;

let products = [
    { id: 1, name: 'Носок(1)', price: 75000 },
    { id: 2, name: 'Молоко', price: 150 },
    { id: 3, name: 'Комод', price: 3500 }
];

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send('Главная страница');
});

//создание товара
app.post('/products', (req, res) => {
    const { name, price } = req.body;
    
    const newProduct = {
        id: Date.now(),
        name,
        price
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.get('/products', (req, res) => {
    res.json(products);
});

//просмотр одного товара
app.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    res.json(product);
});

//обновление товара
app.patch('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    const { name, price } = req.body;
    
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    
    res.json(product);
});

//удаление товара
app.delete('/products/:id', (req, res) => {
    const productExists = products.some(p => p.id == req.params.id);
    
    if (!productExists) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    products = products.filter(p => p.id != req.params.id);
    res.json({ message: 'Товар удалён' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});