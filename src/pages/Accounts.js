import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTrash, FaPlus, FaSortNumericDown, FaSortNumericUp } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import { Modal, Button, Form } from 'react-bootstrap';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    client_name: '',
    amount: '',
    status: 'unpaid',
    description: '',
    category_id: '',
  });
  const token = localStorage.getItem('userToken');

  // Загрузка данных
  const fetchAccounts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAccounts(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки данных: ' + error.message);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount({ ...newAccount, [name]: value });
  };

  const handleSaveAccount = async () => {
    try {
      const response = await axios.post('http://localhost:5000/accounts', newAccount, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAccounts([response.data, ...accounts]);
      toast.success('Счет успешно добавлен!');
      handleCloseModal();
    } catch (error) {
      toast.error('Ошибка при добавлении счета: ' + error.message);
    }
  };

  const deleteAccount = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/accounts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAccounts(accounts.filter((account) => account.id !== id));
      toast.success('Счет успешно удален!');
    } catch (error) {
      toast.error('Ошибка удаления счета: ' + error.message);
    }
  };

  // Фильтрация и сортировка
  const filteredAccounts = accounts
    .filter(
      (account) =>
        account.client_name.toLowerCase().includes(search.toLowerCase()) ||
        account.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      return sortOrder === 'asc'
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at);
    });

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
        <button className="btn btn-outline-secondary me-2" onClick={handleShowModal}>
          <FaPlus />
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? <FaSortNumericDown /> : <FaSortNumericUp />}
        </button>
      </SearchContainer>

      <StyledTableContainer>
        <StyledTable className="table table-hover">
          <thead>
            <tr>
              <th>Имя клиента</th>
              <th>Описание</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((account) => (
              <tr key={account.id}>
                <td>{account.client_name}</td>
                <td>{account.description}</td>
                <td>{account.amount}</td>
                <td>{account.status === 'unpaid' ? 'Не оплачено' : 'Оплачено'}</td>
                <td>{new Date(account.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => deleteAccount(account.id)}
                  >
                    <FaTrash />
                  </button>
                  
                </td>
              </tr>
            ))}
          </tbody>
        </StyledTable>
      </StyledTableContainer>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить новый счет</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Имя клиента</Form.Label>
              <Form.Control
                type="text"
                name="client_name"
                value={newAccount.client_name}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={newAccount.description}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Сумма</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                value={newAccount.amount}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Статус</Form.Label>
              <Form.Select
                name="status"
                value={newAccount.status}
                onChange={handleInputChange}
              >
                <option value="unpaid">Не оплачено</option>
                <option value="paid">Оплачено</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Категория</Form.Label>
              <Form.Select
                name="category"
                value={newAccount.category}
                onChange={handleInputChange}
              >
                <option value="1">Операционные расходы</option>
                <option value="2">Доходы</option>
                <option value="3">Налоги</option>
                <option value="4">Прочее</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSaveAccount}>
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Accounts;

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