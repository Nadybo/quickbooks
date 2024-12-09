const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');  // Используйте bcryptjs вместо bcrypt для совместимости
require('dotenv').config();
const secretKey = process.env.SECRET_KEY; // Используйте переменные окружения для хранения секретов

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: '127.0.0.1', 
    user: 'root',      
    password: 'root', 
    database: 'QuickBooks',
});

db.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Соединение с базой данных установлено.');
    }
});

// Пример: Получение всех пользователей
app.get('/users', (req, res) => {
    const query = 'SELECT * FROM Users';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Ошибка на сервере');
        } else {
            res.json(results);
        }
    });
});

// Регистрация пользователя
app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).send({ message: 'Все поля обязательны.' });
    }

    try {
        // Хэширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO Users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())';
        db.query(query, [name, email, hashedPassword, role], (err, results) => {
            if (err) {
                console.error(err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).send({ message: 'Пользователь с таким email уже существует.' });
                }
                return res.status(500).send({ message: 'Ошибка сервера.' });
            }
            res.status(201).send({ message: 'Регистрация успешна!' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Ошибка при хэшировании пароля.' });
    }
});


// Вход пользователя
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        console.error('Отсутствует email или пароль');
        return res.status(400).send({ message: 'Все поля обязательны.' });
    }

    const query = 'SELECT * FROM Users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Ошибка запроса в базе данных:', err);
            return res.status(500).send({ message: 'Ошибка сервера.' });
        }

        if (results.length === 0) {
            console.error('Пользователь с таким email не найден');
            return res.status(401).send({ message: 'Неверный email или пароль.' });
        }

        const user = results[0];

        try {
            // Сравнение пароля
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.error('Неверный пароль');
                return res.status(401).send({ message: 'Неверный email или пароль.' });
            }

            // Создание JWT токена
            const token = jwt.sign({ userId: user.user_id, role: user.role }, secretKey, { expiresIn: '1h' });

            res.send({ message: 'Вход успешен!', token });
        } catch (err) {
            console.error('Ошибка при проверке пароля:', err);
            res.status(500).send({ message: 'Ошибка при проверке пароля.' });
        }
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
