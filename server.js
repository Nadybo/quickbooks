const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
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
    database: 'quickBooks',
});

db.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Соединение с базой данных установлено.');
    }
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
             const token = jwt.sign({ userId: user.user_id, role: user.role, name: user.name }, secretKey, { expiresIn: '1h' });

            res.send({
                message: 'Вход успешен!',
                token,
                user: {
                    name: user.name,
                    role: user.role
                }
            });


        } catch (err) {
            console.error('Ошибка при проверке пароля:', err);
            res.status(500).send({ message: 'Ошибка при проверке пароля.' });
        }
    });
});

// Получение всех клиентов с возможностью поиска
app.get('/clients', (req, res) => {
    const search = req.query.search || '';
    const query = `
        SELECT * FROM Clients 
        WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR type LIKE ?
    `;
    db.query(query, [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`], (err, results) => {
        if (err) {
            console.error('Ошибка получения клиентов:', err);
            return res.status(500).send({ message: 'Ошибка сервера.' });
        }
        res.send(results);
    });
});

// Добавление нового клиента
app.post('/clients', (req, res) => {
    const { name, email, phone, address, type } = req.body;

    if (!name || !type) {
        return res.status(400).send({ message: 'Имя и тип клиента обязательны.' });
    }

    const query = `
        INSERT INTO Clients (name, email, phone, address, type, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    db.query(query, [name, email, phone, address, type], (err, result) => {
        if (err) {
            console.error('Ошибка добавления клиента:', err);
            return res.status(500).send({ message: 'Ошибка сервера.' });
        }
        res.status(201).send({ id: result.insertId, name, email, phone, address, type });
    });
});

// Обновление клиента
app.put('/clients/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, type } = req.body;

    const query = `
        UPDATE Clients 
        SET name = ?, email = ?, phone = ?, address = ?, type = ?, updated_at = NOW()
        WHERE id = ?
    `;
    db.query(query, [name, email, phone, address, type, id], (err, result) => {
        if (err) {
            console.error('Ошибка обновления клиента:', err);
            return res.status(500).send({ message: 'Ошибка сервера.' });
        }
        res.send({ message: 'Клиент обновлен успешно!' });
    });
});

// Удаление клиента
app.delete('/clients/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM Clients WHERE id = ?`;
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Ошибка удаления клиента:', err);
            return res.status(500).send({ message: 'Ошибка сервера.' });
        }
        res.send({ message: 'Клиент удален успешно!' });
    });
});


app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
