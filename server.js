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
    database: 'quickbooks2',
});

db.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Соединение с базой данных установлено.');
    }
});

// Функция для аутентификации токена
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; 

    if (!token) {
        return res.status(401).send({ message: 'Токен не предоставлен' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).send({ message: 'Неверный или устаревший токен' });
        }

        req.user = user; // Добавляем данные пользователя в запрос
        next();
    });
}

// Регистрация пользователя
app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).send({ message: 'Все поля обязательны.' });
    }

    try {
        // Проверка, существует ли уже пользователь с таким email
        const checkQuery = 'SELECT * FROM Users WHERE email = ?';
        db.query(checkQuery, [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send({ message: 'Ошибка при проверке email.' });
            }

            if (results.length > 0) {
                return res.status(400).send({ message: 'Пользователь с таким email уже существует.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const query = 'INSERT INTO Users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())';
            db.query(query, [name, email, hashedPassword, role], (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send({ message: 'Ошибка сервера.' });
                }
                res.status(201).send({ message: 'Регистрация успешна!' });
            });
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
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.error('Неверный пароль');
                return res.status(401).send({ message: 'Неверный email или пароль.' });
            }

            const token = jwt.sign({ userId: user.id, role: user.role, name: user.name, email: user.email }, secretKey, { expiresIn: '1h' });

            res.send({
                message: 'Вход успешен!',
                token,
                user: {
                    user_id: user.id,
                    name: user.name,
                    role: user.role,
                    email: user.email
                }
            });
        } catch (err) {
            console.error('Ошибка при проверке пароля:', err);
            res.status(500).send({ message: 'Ошибка при проверке пароля.' });
        }
    });
});

// Получение клиентов, фильтруя по user_id
app.get('/clients', authenticateToken, (req, res) => {
    const userId = req.user.userId;  // Получаем userId из токена

    const query = `SELECT * FROM Clients WHERE user_id = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка получения клиентов:', err);
            return res.status(500).send({ message: 'Ошибка сервера.' });
        }
        res.send(results);
    });
});

// Добавление нового клиента с user_id
app.post('/clients', authenticateToken, (req, res) => {
    const { name, email, phone, address, type } = req.body;
    const userId = req.user.userId;  // Получаем userId из токена

    if (!name || !type) {
        return res.status(400).send({ message: 'Имя и тип клиента обязательны.' });
    }

    const query = `INSERT INTO Clients (name, email, phone, address, type, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`;

    db.query(query, [name, email, phone, address, type, userId], (err, result) => {
        if (err) {
            console.error('Ошибка добавления клиента:', err);
            return res.status(500).send({ message: 'Ошибка сервера.' });
        }
        res.status(201).send({ id: result.insertId, name, email, phone, address, type });
    });
});

// Обновление клиента с проверкой на user_id
app.put('/clients/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, type } = req.body;
    const userId = req.user.userId;

    const query = `UPDATE Clients SET name = ?, email = ?, phone = ?, address = ?, type = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`;

    db.query(query, [name, email, phone, address, type, id, userId], (err, result) => {
        if (err) {
            console.error('Ошибка обновления клиента:', err);
            return res.status(500).send({ message: 'Ошибка сервера.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Клиент не найден или у вас нет прав на редактирование этого клиента.' });
        }
        res.send({ message: 'Клиент обновлен успешно!' });
    });
});

// Удаление клиента с проверкой на user_id
app.delete('/clients/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const query = `DELETE FROM Clients WHERE id = ? AND user_id = ?`;

    db.query(query, [id, userId], (err, result) => {
        if (err) {
            console.error('Ошибка удаления клиента:', err);
            return res.status(500).send({ message: 'Ошибка сервера.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Клиент не найден или у вас нет прав на удаление этого клиента.' });
        }
        res.send({ message: 'Клиент удален успешно!' });
    });
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
