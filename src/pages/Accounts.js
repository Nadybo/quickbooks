import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTrash, FaEdit, FaSortAlphaDown, FaSortAlphaUp, FaUserPlus, FaFilter } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import { Modal, Button, Form } from "react-bootstrap";
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [sortType, setSortType] = useState('client_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false); 
  const [isEditMode, setIsEditMode] = useState(false); 
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const token = localStorage.getItem("userToken"); 

  const initialAccountData = {
    client_name: "",
    amount: "",
    status: "",
    description: "",
    category_id: "",
  };
  const [accountData, setAccountData] = useState(initialAccountData);
  // Модальное окно
  const handleShowModal = (account = null) => {
    setIsEditMode(!!account);
    setSelectedAccount(account);
    setAccountData(account || initialAccountData);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // API-запросы
  const apiRequest = (url, method = 'GET', data = null) => {
    const config = {
      method,
      url,
      headers: { Authorization: `Bearer ${token}` },
    };
    if (data) config.data = data;
    return axios(config);
  };

  const fetchAllData = async () => {
    try {
      const [categoriesResponse, clientsResponse, accountsResponse] = await Promise.all([
        apiRequest('http://localhost:5000/categories'),
        apiRequest('http://localhost:5000/clients'),
        apiRequest('http://localhost:5000/accounts'),
      ]);
      setCategories(categoriesResponse.data);
      setClients(clientsResponse.data);
      setAccounts(accountsResponse.data);
    } catch (error) {
      toast.error('Ошибка загрузки данных: ' + error.message);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Обработка изменений
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAccountData({ ...accountData, [name]: value });
  };

  const handleClientChange = (e) => {
    const selectedClientName = e.target.value;
    const selectedClient = clients.find(client => client.name === selectedClientName);
    setAccountData({
      ...accountData,
      client_name: selectedClientName,
      client_id: selectedClient?.id || '',
    });
  };

  // Сохранение
  const saveAccount = async () => {
    const payload = {
      ...accountData,
      category_id: parseInt(accountData.category_id, 10),
    };
    const url = isEditMode
      ? `http://localhost:5000/accounts/${selectedAccount.account_id}`
      : 'http://localhost:5000/accounts';
    const method = isEditMode ? 'PUT' : 'POST';
    await apiRequest(url, method, payload);
  };

  const handleSaveAccount = async () => {
    try {
      if (!accountData.amount || !accountData.status || !accountData.category_id) {
        toast.error("Пожалуйста, заполните все обязательные поля.");
        return;
      }
      await saveAccount();
      toast.success(isEditMode ? "Счет успешно обновлен!" : "Счет успешно добавлен!");
      handleCloseModal();
      fetchAllData();
    } catch (error) {
      toast.error("Ошибка при сохранении счета: " + error.message);
    }
  };

  // Удаление
  const deleteAccount = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Счет успешно удален!');
      fetchAllData();
    } catch (error) {
      toast.error('Ошибка удаления счета: ' + error.message);
    }
  };

  // Фильтрация и сортировка
  const filterAndSortAccounts = (accounts, search, sortType, sortOrder) => {
    const filtered = accounts.filter((account) =>
      ['client_name', 'description', 'amount', 'status'].some((key) =>
        account[key]?.toString().toLowerCase().includes(search.toLowerCase())
      )
    );

    return filtered.sort((a, b) => {
      if (sortType === 'client_name') {
        return sortOrder === 'asc'
          ? a.client_name.localeCompare(b.client_name)
          : b.client_name.localeCompare(a.client_name);
      } else if (sortType === 'date') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  };

  const filteredAccounts = filterAndSortAccounts(accounts, search, sortType, sortOrder);

  return (
    <div>
      <ToastContainer />
      <h3 className="mb-4">Список счетов</h3>
      <SearchContainer>
        <input
          type="text"
          className="form-control me-3"
          placeholder="Поиск счетов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-outline-secondary me-2" onClick={() => handleShowModal()}>
          <FaUserPlus />
        </button>
        <button
          className="btn btn-outline-secondary me-2"
          onClick={() => {
            setSortType('client_name');
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          }}
        >
          {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => {
            setSortType('date');
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          }}
        >
          <FaFilter />
        </button>
      </SearchContainer>
      <StyledTableContainer>
        <AccountsTable
          accounts={filteredAccounts}
          onEdit={handleShowModal}
          onDelete={deleteAccount}
        />
      </StyledTableContainer>
      <AccountModal
        show={showModal}
        onHide={handleCloseModal}
        accountData={accountData}
        clients={clients}
        categories={categories}
        onChange={handleInputChange}
        onSave={handleSaveAccount}
        onClientChange={handleClientChange}
      />
    </div>
  );
}

export default Accounts;

const statusMapping = {
  paid: "Оплачено",
  unpaid: "Не оплачено",
};

// Компоненты таблицы и модального окна
const AccountsTable = ({ accounts, onEdit, onDelete }) => (
  <StyledTable className="table table-hover">
    <thead>
      <tr>
        <th>Имя клиента</th>
        <th>Сумма</th>
        <th>Статус</th>
        <th>Описание</th>
        <th>Категория</th>
        <th>Дата создания</th>
        <th>Действия</th>
      </tr>
    </thead>
    <tbody>
      {accounts.map((account) => (
        <tr key={account.account_id}>
          <td>{account.client_name}</td>
          <td>{account.amount}</td>
          <td>{statusMapping[account.status] || account.status}</td>
          <td>{account.description}</td>
          <td>{account.category_name}</td>
          <td>{new Date(account.created_at).toLocaleDateString()}</td>
          <td>
            <button
              className="btn btn-sm btn-outline-danger me-2"
              onClick={() => onDelete(account.account_id)}
            >
              <FaTrash />
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => onEdit(account)}
            >
              <FaEdit />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </StyledTable>
);

const AccountModal = ({ show, onHide, accountData, clients, categories, onChange, onSave, onClientChange }) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>{accountData.client_name ? "Редактировать счет" : "Добавить счет"}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Имя клиента</Form.Label>
          <Form.Select
            name="client_name"
            value={accountData.client_name}
            onChange={onClientChange}
          >
            <option value="">Выберите клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.name}>
                {client.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Сумма</Form.Label>
          <Form.Control
            type="number"
            name="amount"
            placeholder="Введите сумму"
            value={accountData.amount}
            onChange={onChange}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Статус</Form.Label>
          <Form.Select
            name="status"
            value={accountData.status}
            onChange={onChange}
          >
            <option value="paid">Оплачено</option>
            <option value="unpaid">Не оплачено</option>
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Описание</Form.Label>
          <Form.Control
            type="textarea"
            name="description"
            placeholder="Введите описание"
            value={accountData.description}
            onChange={onChange}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Категория</Form.Label>
          <Form.Select
            name="category_id"
            value={accountData.category_id}
            onChange={onChange}
          >
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Отменить
      </Button>
      <Button variant="primary" onClick={onSave}>
        Сохранить
      </Button>
    </Modal.Footer>
  </Modal>
);

// Стили
const StyledTableContainer = styled.div`
  max-height: 680px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  thead th {
    position: sticky;
    top: 0;
    background: #f8f9fa;
    z-index: 1;
  }

  tbody tr:nth-child(odd) {
    background-color: #f9f9f9;
  }
  tbody tr:nth-child(even) {
    background-color: #ffffff;
  }
`;

const SearchContainer = styled.div`
  height: fit-content;
  width: 60%;
  display: flex;
  margin-bottom: 20px;
`;
