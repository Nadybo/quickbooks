const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const secretKey = process.env.SECRET_KEY;

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "root",
  database: "falite",
});

db.connect((err) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err.message);
  } else {
    console.log("Соединение с базой данных установлено.");
  }
});

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).send({ message: "Токен не предоставлен" });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).send({ message: "Неверный или устаревший токен" });
    }

    req.user = user;
    next();
  });
}

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).send({ message: "Все поля обязательны." });
  }

  try {
    const checkQuery = "SELECT * FROM Users WHERE email = ?";
    db.query(checkQuery, [email], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ message: "Ошибка при проверке email." });
      }

      if (results.length > 0) {
        return res
          .status(400)
          .send({ message: "Пользователь с таким email уже существует." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const query =
        "INSERT INTO Users (name, email, password, created_at) VALUES (?, ?, ?, NOW())";
      db.query(query, [name, email, hashedPassword], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send({ message: "Ошибка сервера." });
        }
        res.status(201).send({ message: "Регистрация успешна!" });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Ошибка при хэшировании пароля." });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    console.error("Отсутствует email или пароль");
    return res.status(400).send({ message: "Все поля обязательны." });
  }

  const query = "SELECT * FROM Users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Ошибка запроса в базе данных:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }

    if (results.length === 0) {
      console.error("Пользователь с таким email не найден");
      return res.status(401).send({ message: "Неверный email или пароль." });
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.error("Неверный пароль");
        return res.status(401).send({ message: "Неверный email или пароль." });
      }

      const token = jwt.sign(
        { userId: user.id, name: user.name, email: user.email },
        secretKey,
        { expiresIn: "24h" }
      );

      res.send({
        message: "Вход успешен!",
        token,
        user: {
          user_id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
      });
    } catch (err) {
      console.error("Ошибка при проверке пароля:", err);
      res.status(500).send({ message: "Ошибка при проверке пароля." });
    }
  });
});

app.get("/clients", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `SELECT * FROM Clients WHERE user_id = ?`;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Ошибка получения клиентов:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res.send(results);
  });
});

app.post("/clients", authenticateToken, (req, res) => {
  const { name, email, phone, address, type, company_name } = req.body;
  const userId = req.user.userId;

  if (!name || !type) {
    return res.status(400).send({ message: "Имя и тип клиента обязательны." });
  }

  const query = `INSERT INTO Clients (name, email, phone, address, type, user_id, company_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;

  db.query(
    query,
    [name, email, phone, address, type, userId, company_name],
    (err, result) => {
      if (err) {
        console.error("Ошибка добавления клиента:", err);
        return res.status(500).send({ message: "Ошибка сервера." });
      }

      if (result && result.insertId) {
        res.status(201).send({
          id: result.insertId,
          name,
          email,
          phone,
          address,
          type,
          company_name,
        });
      } else {
        console.error("Ошибка: результат не содержит insertId.");
        res
          .status(500)
          .send({ message: "Ошибка сервера при добавлении клиента." });
      }
    }
  );
});

app.put("/clients/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, type, company_name } = req.body;
  const userId = req.user.userId;

  const query = `UPDATE Clients SET name = ?, email = ?, phone = ?, address = ?, type = ?, company_name = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`;
  db.query(
    query,
    [name, email, phone, address, type, company_name, id, userId],
    (err, result) => {
      if (err) {
        console.error("Ошибка обновления клиента:", err);
        return res.status(500).send({ message: "Ошибка сервера." });
      }
      if (result.affectedRows === 0) {
        return res.status(404).send({
          message:
            "Клиент не найден или у вас нет прав на редактирование этого клиента.",
        });
      }
      res.send({ message: "Клиент обновлен успешно!" });
    }
  );
});

app.delete("/clients/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const query = `DELETE FROM Clients WHERE id = ? AND user_id = ?`;

  db.query(query, [id, userId], (err, result) => {
    if (err) {
      console.error("Ошибка удаления клиента:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({
        message:
          "Клиент не найден или у вас нет прав на удаление этого клиента.",
      });
    }
    res.send({ message: "Клиент удален успешно!" });
  });
});

app.get("/accounts", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `
        SELECT 
            Accounts.id AS account_id,
            Accounts.client_id,
            Accounts.amount,
            Accounts.status,
            Accounts.description,
            Accounts.created_at,
            Accounts.updated_at,
            Categories.id AS category_id,
            Categories.name AS category_name
        FROM Accounts
        LEFT JOIN Categories ON Accounts.category_id = Categories.id
        LEFT JOIN Clients ON Accounts.client_id = Clients.id
        WHERE Accounts.user_id = ?
    `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Ошибка получения счетов:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res.send(results);
  });
});

app.put("/accounts/pay/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const accountId = req.params.id;

  const checkQuery = `
      SELECT status FROM Accounts 
      WHERE id = ? AND user_id = ?;
    `;

  const updateQuery = `
      UPDATE Accounts 
      SET status = 'paid', updated_at = NOW() 
      WHERE id = ? AND user_id = ?;
    `;

  db.query(checkQuery, [accountId, userId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Ошибка проверки статуса счета:", checkErr);
      return res.status(500).send({ message: "Ошибка сервера." });
    }

    if (checkResults.length === 0) {
      return res
        .status(404)
        .send({ message: "Счет не найден или доступ запрещен." });
    }

    if (checkResults[0].status === "paid") {
      return res.status(400).send({ message: "Счет уже оплачен." });
    }

    db.query(updateQuery, [accountId, userId], (updateErr, updateResults) => {
      if (updateErr) {
        console.error("Ошибка обновления статуса счета:", updateErr);
        return res.status(500).send({ message: "Ошибка сервера." });
      }

      if (updateResults.affectedRows === 0) {
        return res
          .status(404)
          .send({ message: "Счет не найден или доступ запрещен." });
      }

      res.send({ message: "Счет успешно оплачен." });
    });
  });
});

app.post("/accounts", authenticateToken, (req, res) => {
  const { client_id, amount, status, description, category_id } = req.body;
  const userId = req.user.userId;

  if (!client_id || isNaN(client_id) || client_id <= 0) {
    return res.status(400).send({
      message: "Неверный client_id. Он должен быть положительным числом.",
    });
  }

  if (isNaN(amount) || amount < 0) {
    return res
      .status(400)
      .send({ message: "Сумма должна быть числом и больше или равна нулю." });
  }

  if (!["paid", "unpaid"].includes(status)) {
    return res
      .status(400)
      .send({ message: "Неверный статус. Допустимые значения: paid, unpaid." });
  }

  if (!category_id) {
    return res
      .status(400)
      .send({ message: "Категория является обязательным полем." });
  }

  const query = `
        INSERT INTO accounts (user_id, client_id, amount, status, description, category_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

  db.query(
    query,
    [userId, client_id, amount, status, description, category_id],
    (err, result) => {
      if (err) {
        console.error("Ошибка при добавлении счета:", err);
        return res.status(500).send({ message: "Ошибка сервера." });
      }

      if (result && result.insertId) {
        res.status(201).send({
          id: result.insertId,
          user_id: userId,
          client_id,
          amount,
          status,
          description,
          category_id,
          created_at: new Date(),
          updated_at: new Date(),
        });
      } else {
        console.error("Ошибка: результат не содержит insertId.");
        res.status(500).send({ message: "Ошибка при добавлении счета." });
      }
    }
  );
});

app.delete("/accounts/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const query = `DELETE FROM Accounts WHERE id = ? AND user_id = ?`;

  db.query(query, [id, userId], (err, result) => {
    if (err) {
      console.error("Ошибка удаления клиента:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({
        message: "Счет не найден или у вас нет прав на удаление этого счета.",
      });
    }
    res.send({ message: "Клиент удален успешно!" });
  });
});

app.put("/accounts/:id", async (req, res) => {
  const { id } = req.params;
  const { client_id, amount, status, description, category_id } = req.body;

  if (!amount || !status || !category_id) {
    return res
      .status(400)
      .json({ error: "Поля amount, status и category_id обязательны." });
  }

  try {
    const query = `
        UPDATE accounts 
        SET 
          client_id = ?, 
          amount = ?, 
          status = ?, 
          description = ?, 
          category_id = ?, 
          updated_at = NOW() 
        WHERE id = ?`;

    const values = [client_id, amount, status, description, category_id, id];

    const result = await db.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Запись не найдена." });
    }

    res.status(200).json({ message: "Запись успешно обновлена." });
  } catch (error) {
    console.error("Ошибка обновления записи:", error);
    res.status(500).json({ error: "Ошибка на сервере." });
  }
});

app.get("/categories", authenticateToken, (req, res) => {
  const query = `SELECT * FROM categories`;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Ошибка получения категорий:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res.send(results);
  });
});

app.post("/categories", authenticateToken, (req, res) => {
  const { name, description } = req.body;

  const query = `
        INSERT INTO categories (name, description)
        VALUES (?, ?)
    `;

  db.query(query, [name, description], (err, result) => {
    if (err) {
      console.error("Ошибка добавления категории:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res.send({
      message: "Категория успешно добавлена.",
      categoryId: result.insertId,
    });
  });
});

app.put("/categories/:id", authenticateToken, (req, res) => {
  const categoryId = req.params.id;
  const { name, description } = req.body;

  const query = `
        UPDATE categories 
        SET name = ?, description = ?
        WHERE id = ?
    `;

  db.query(query, [name, description, categoryId], (err, result) => {
    if (err) {
      console.error("Ошибка обновления категории:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res.send({ message: "Категория успешно обновлена." });
  });
});

app.delete("/categories/:id", authenticateToken, (req, res) => {
  const categoryId = req.params.id;

  const query = `
        DELETE FROM categories WHERE id = ?
    `;

  db.query(query, [categoryId], (err, result) => {
    if (err) {
      console.error("Ошибка удаления категории:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res.send({ message: "Категория успешно удалена." });
  });
});

app.get("/users", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `SELECT * FROM users WHERE id = ?`;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Ошибка получения клиентов:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res.send(results);
  });
});

app.put("/users", authenticateToken, (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;

  const query = "UPDATE users SET amount = ? WHERE id = ?";
  db.query(query, [amount, userId], (err, result) => {
    if (err) {
      console.error("Ошибка при обновлении баланса пользователя", err);
      return res.status(500).json({ message: "Ошибка при обновлении баланса" });
    }
    res.status(200).json({ message: "Баланс пользователя обновлен успешно" });
  });
});

app.post("/tasks", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { title, description, status, start_date, due_date } = req.body;

  const query = `INSERT INTO tasks (user_id, title, description, status, start_date, due_date, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

  db.query(
    query,
    [userId, title, description, status, start_date, due_date],
    (err, result) => {
      if (err) {
        console.error("Ошибка при создании задачи:", err);
        return res.status(500).send({ message: "Ошибка сервера." });
      }
      res
        .status(201)
        .send({ message: "Задача создана.", taskId: result.insertId });
    }
  );
});

app.get("/tasks", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `SELECT * FROM tasks WHERE user_id = ?`;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Ошибка получения задач:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res.send(results);
  });
});

app.put("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, status, start_date, due_date } = req.body;
  const userId = req.user.userId;

  const query = `
      UPDATE tasks
      SET title = ?, description = ?, status = ?, start_date = ?, due_date = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

  db.query(
    query,
    [title, description, status, start_date, due_date, id, userId],
    (err, results) => {
      if (err) {
        console.error("Ошибка обновления задачи:", err);
        return res.status(500).json({ message: "Ошибка сервера." });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Задача не найдена." });
      }

      res.status(200).json({ message: "Задача успешно обновлена." });
    }
  );
});

app.delete("/tasks/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const taskId = req.params.id;

  const query = `DELETE FROM tasks WHERE id = ? AND user_id = ?`;

  db.query(query, [taskId, userId], (err, result) => {
    if (err) {
      console.error("Ошибка удаления задачи:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Задача не найдена." });
    }
    res.send({ message: "Задача удалена." });
  });
});

app.post("/cards", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { card_number, card_holder_name, expiration_date, cvv } = req.body;

  const query = `INSERT INTO cards (user_id, card_number, card_holder_name, expiration_date, cvv) 
                   VALUES (?, ?, ?, ?, ?)`;

  db.query(
    query,
    [userId, card_number, card_holder_name, expiration_date, cvv],
    (err, result) => {
      if (err) {
        console.error("Ошибка при добавлении карты:", err);
        return res.status(500).send({ message: "Ошибка сервера." });
      }

      res.status(201).send({ message: "Карта успешно добавлена." });
    }
  );
});

app.get("/cards", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `SELECT * FROM cards WHERE user_id = ?`;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Ошибка получения карт:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res.send(results);
  });
});

app.put("/cards/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const cardId = req.params.id;
  const { balance } = req.body; // balance из тела запроса

  if (balance === undefined) {
    return res.status(400).send({ message: "Баланс не может быть undefined." });
  }

  const query = `
    UPDATE cards 
    SET 
      balance = COALESCE(?, balance), 
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?`;

  db.query(query, [balance, cardId, userId], (err, result) => {
    if (err) {
      console.error("Ошибка обновления карты:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Карта не найдена." });
    }
    res.send({ message: "Карта успешно обновлена." });
  });
});

app.delete("/cards/:id", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const cardId = req.params.id;

  const query = `DELETE FROM cards WHERE id = ? AND user_id = ?`;

  db.query(query, [cardId, userId], (err, result) => {
    if (err) {
      console.error("Ошибка удаления карты:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Карта не найдена." });
    }
    res.send({ message: "Карта успешно удалена." });
  });
});

app.get("/reports", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `SELECT * FROM reports WHERE user_id = ?`;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Ошибка получения карт:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res.send(results);
  });
});

app.post("/reports", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { report_name } = req.body;

  const query = `
      INSERT INTO reports (user_id, report_name) 
      VALUES (?, ?)
    `;

  db.query(query, [userId, report_name], (err, result) => {
    if (err) {
      console.error("Ошибка при добавлении отчета:", err);
      return res.status(500).send({ message: "Ошибка сервера." });
    }
    res
      .status(201)
      .send({ message: "Отчет успешно добавлен.", reportId: result.insertId });
  });
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
