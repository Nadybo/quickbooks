import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Tabs, Tab, Table } from 'react-bootstrap';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeTab, setActiveTab] = useState('unpaid');
  const [showModal, setShowModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    client_name: '',
    amount: '',
    status: 'unpaid',
    description: '',
    category_id: 1,
  });
  const [error, setError] = useState(null);

  const token = localStorage.getItem("userToken");

  // Загрузка данных
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch('http://localhost:5000/accounts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Ошибка загрузки данных');
        }

        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        setError('Ошибка загрузки данных');
      }
    }

    fetchAccounts();
  }, [token]);

  // Фильтрация и сортировка данных
  const filterAndSortAccounts = (accounts) => {
    return accounts
      .filter((account) =>
        account.client_name.toLowerCase().includes(search.toLowerCase()) ||
        account.description.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sortOrder === 'asc') {
          return new Date(a.created_at) - new Date(b.created_at);
        } else {
          return new Date(b.created_at) - new Date(a.created_at);
        }
      });
  };

  const unpaidAccounts = filterAndSortAccounts(accounts.filter(account => account.status === 'unpaid'));
  const paidAccounts = filterAndSortAccounts(accounts.filter(account => account.status === 'paid'));

  // Открытие и закрытие модального окна
  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  // Обработчик изменения данных нового счета
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newAccount),
      });

      if (!response.ok) {
        throw new Error('Ошибка при добавлении счета');
      }

      const data = await response.json();
      setAccounts((prevAccounts) => [data, ...prevAccounts]); // Добавляем новый счет в список
      handleCloseModal(); // Закрываем модальное окно
    } catch (error) {
      setError('Ошибка при добавлении счета');
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Счета</h1>

      {/* Поиск */}
      <Form.Control
        type="text"
        placeholder="Поиск по имени клиента или описанию"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />
      {/* Кнопка для добавления нового счета */}
      <Button variant="primary" onClick={handleShowModal}>Добавить новый счет</Button>

      {/* Сортировка */}
      <Form.Select
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="mb-3"
      >
        <option value="asc">Сортировать по возрастанию даты</option>
        <option value="desc">Сортировать по убыванию даты</option>
      </Form.Select>

      {/* Вкладки */}
      <Tabs activeKey={activeTab} onSelect={(key) => setActiveTab(key)} className="mb-3">
        <Tab eventKey="unpaid" title="Не оплачено">
          <AccountTable accounts={unpaidAccounts} />
        </Tab>
        <Tab eventKey="paid" title="Оплачено">
          <AccountTable accounts={paidAccounts} />
        </Tab>
      </Tabs>

      {/* Модальное окно для добавления счета */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить новый счет</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Имя клиента</Form.Label>
              <Form.Control
                type="text"
                placeholder="Введите имя клиента"
                name="client_name"
                value={newAccount.client_name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Сумма</Form.Label>
              <Form.Control
                type="number"
                placeholder="Введите сумму"
                name="amount"
                value={newAccount.amount}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Статус</Form.Label>
              <Form.Select
                name="status"
                value={newAccount.status}
                onChange={handleInputChange}
                required
              >
                <option value="unpaid">Не оплачено</option>
                <option value="paid">Оплачено</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Введите описание"
                name="description"
                value={newAccount.description}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Категория</Form.Label>
              <Form.Control
                as="select"
                name="category_id"
                value={newAccount.category_id}
                onChange={handleInputChange}
                required
              >
                <option value="1">Операционные расходы</option>
                <option value="2">Доходы</option>
                <option value="3">Налоги</option>
                <option value="4">Прочее</option>
              </Form.Control>
            </Form.Group>

            <Button variant="primary" type="submit">
              Добавить
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

function AccountTable({ accounts }) {
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>ID</th>
          <th>Имя клиента</th>
          <th>Описание</th>
          <th>Сумма</th>
          <th>Статус</th>
          <th>Дата создания</th>
        </tr>
      </thead>
      <tbody>
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <tr key={account.id}>
              <td>{account.id}</td>
              <td>{account.client_name}</td>
              <td>{account.description}</td>
              <td>{account.amount}</td>
              <td>{account.status === 'unpaid' ? 'Не оплачено' : 'Оплачено'}</td>
              <td>{new Date(account.created_at).toLocaleDateString()}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center">Данные не найдены</td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

export default Accounts;
