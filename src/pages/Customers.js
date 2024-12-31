import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTrash, FaEdit, FaSortAlphaDown, FaSortAlphaUp, FaUserPlus, FaFilter } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";

function Customers() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [sortType, setSortType] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false); 
  const [isEditMode, setIsEditMode] = useState(false); 
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    type: "client",
  });
  const token = localStorage.getItem("userToken"); 

  const handleShowModal = (client = null) => {
    setIsEditMode(!!client);
    setSelectedClient(client);
    setClientData(
      client || {
        name: "",
        email: "",
        phone: "",
        address: "",
        type: "client",
      }
    );
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientData({ ...clientData, [name]: value });
  };

  const handleSaveClient = async () => {
    try {
      if (isEditMode && selectedClient) {
        await axios.put(
          `http://localhost:5000/clients/${selectedClient.id}`,
          clientData,
          {
            headers: {
              Authorization: `Bearer ${token}` // Добавляем токен в заголовок
            }
          }
        );
        toast.success("Клиент успешно обновлен!");
      } else {
        // Добавление нового клиента
        await axios.post(
          "http://localhost:5000/clients",
          clientData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        toast.success("Клиент успешно добавлен!");
      }
      handleCloseModal();
      fetchClients();
    } catch (error) {
      toast.error("Ошибка при сохранении клиента: " + error.message);
    }
  };

  // Уведомления
  const notifyError = (message) => toast.error(message);

  // Получение данных с сервера
  const fetchClients = async () => {
    try {
      const response = await axios.get('http://localhost:5000/clients', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setClients(response.data);
    } catch (error) {
      notifyError('Ошибка загрузки данных: ' + error.message);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []); 
  
  const deleteClient = async (id) => {

    try {
      await axios.delete(`http://localhost:5000/clients/${id}`, {
        headers: {
          Authorization: `Bearer ${token}` // Добавляем токен в заголовок
        }
      });
      toast.success('Клиент успешно удален!');
      setClients(clients.filter((client) => client.id !== id));
    } catch (error) {
      notifyError('Ошибка удаления клиента: ' + error.message);
    }
  };

  // Сортировка и фильтрация
  const filteredClients = clients
    .filter((client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search) ||
      client.type.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortType === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
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
      <h3 className="mb-4">Список клиентов</h3>
      <SearchContainer>
        <input
          type="text"
          className="form-control me-3"
          placeholder="Поиск клиентов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-outline-success me-2"  onClick={() => handleShowModal()}>
        <FaUserPlus />
        </button>
        <button
          className="btn btn-outline-success me-2"
          onClick={() => {
            setSortType('name');
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          }}
        >
          {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
        </button>
        <button
          className="btn btn-outline-success me-2"
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
              <th>Имя</th>
              <th>Почта</th>
              <th>Телефон</th>
              <th>Тип</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.phone}</td>
                <td>{client.type}</td>
                <td>{new Date(client.created_at).toLocaleDateString()}</td>
                <td>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-success" size="sm" id="dropdown-basic">
                    Действия
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => deleteClient(client.id)}>
                    <FaTrash />
                    Удалить
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleShowModal(client)}>
                    <FaEdit />
                    Редактировать
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
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
                <Form.Label>Имя</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="Введите имя"
                  value={clientData.name}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Введите email"
                  value={clientData.email}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Телефон</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  placeholder="Введите телефон"
                  value={clientData.phone}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Адрес</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  placeholder="Введите адрес"
                  value={clientData.address}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Тип клиента</Form.Label>
                <Form.Select
                  name="type"
                  value={clientData.type}
                  onChange={handleInputChange}
                >
                  <option value="client">Клиент</option>
                  <option value="supplier">Поставщик</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Отменить
            </Button>
            <Button variant="primary" onClick={handleSaveClient}>
              Сохранить
            </Button>
          </Modal.Footer>
        </Modal>
      </StyledTableContainer>
    </div>
  );
}

export default Customers;

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