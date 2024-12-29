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
  const [accountData, setAccountData] = useState({
    client_name: "",
    amount: "",
    status: "",
    description: "",
    category_name: "",
  });
  const token = localStorage.getItem("userToken"); 

  const handleShowModal = (account = null) => {
    setIsEditMode(!!account);
    setSelectedAccount(account);
    setAccountData(
      account || {
      client_name: "",
    amount: "",
    status: "",
    description: "",
    category_name: "",
      }
    );
    setShowModal(true);
  };

  const fetchAllData = async () => {
    try {
      const [categoriesResponse, clientsResponse, accountsResponse] = await Promise.all([
        axios.get('http://localhost:5000/categories', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get('http://localhost:5000/clients', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get('http://localhost:5000/accounts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
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
  },[]);

  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAccountData({ ...accountData, [name]: value });
  };

  const handleSaveAccount = async () => {
    try {
      if (isEditMode && selectedAccount) {
        await axios.put(
          `http://localhost:5000/accounts/${selectedAccount.id}`,
          accountData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        toast.success("Клиент успешно обновлен!");
      } else {
        // Добавление нового клиента
        await axios.post(
          "http://localhost:5000/accounts",
          accountData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        toast.success("Клиент успешно добавлен!");
      }
      handleCloseModal();
      fetchAllData();
    } catch (error) {
      toast.error("Ошибка при сохранении клиента: " + error.message);
    }
  };

  // Уведомления
  const notifyError = (message) => toast.error(message);
  
  const deleteAccount = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/accounts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Счет успешно удален!');
      fetchAllData();
      setAccounts(accounts.filter((account) => account.id !== id));
    } catch (error) {
      notifyError('Ошибка удаления клиента: ' + error.message);
    }
  };

  // Сортировка и фильтрация
  const filteredAccounts = accounts
    .filter((account) =>
      account.client_name.toLowerCase().includes(search.toLowerCase()) ||
      account.description.toLowerCase().includes(search.toLowerCase()) ||
      account.amount.includes(search) ||
      account.status.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortType === 'name') {
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
        <button className="btn btn-outline-secondary me-2"  onClick={() => handleShowModal()}>
        <FaUserPlus />
        </button>
        <button
          className="btn btn-outline-secondary me-2"
          onClick={() => {
            setSortType('name');
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
            {filteredAccounts.map((account) => (
              <tr key={account.account_id}>
                <td>{account.client_name}</td>
                <td>{account.amount}</td>
                <td>{account.status}</td>
                <td>{account.description}</td>
                <td>{account.category_name}</td>
                <td>{new Date(account.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger me-2"
                    onClick={() => deleteAccount(account.account_id)}
                  >
                    <FaTrash />
                  </button>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleShowModal(account)}
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </StyledTable>

        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditMode ? "Редактировать клиента" : "Добавить клиента"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
            <Form.Group className="mb-3">
                <Form.Label>Имя клиента</Form.Label>
                <Form.Select
                  name="client_name"
                  value={accountData.client_name}
                  onChange={handleInputChange}
                >
                  <option value="">Выберите клиента</option>
                  {clients.map((client, index) => (
                    <option key={client.id || index} value={client.id}>
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
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Статус</Form.Label>
                <Form.Select
                  name="status"
                  value={accountData.status}
                  onChange={handleInputChange}
                >
                  <option value="paid">Оплачено</option>
                  <option value="unpaid">Не оплачено</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Описание</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  placeholder="Введите описание"
                  value={accountData.description}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Категория</Form.Label>
                <Form.Select
                  name="category_id"
                  value={accountData.category_id}
                  onChange={handleInputChange}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category, index) => (
                    <option key={category.id || index} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Отменить
            </Button>
            <Button variant="primary" onClick={handleSaveAccount}>
              Сохранить
            </Button>
          </Modal.Footer>
        </Modal>
      </StyledTableContainer>
    </div>
  );
}

export default Accounts;

// Стили таблицы и контейнера
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