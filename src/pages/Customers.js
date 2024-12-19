import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaFilter, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import styled from 'styled-components';

function Customers() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'client',
  });
  const [sortAscending, setSortAscending] = useState(true);

  useEffect(() => {
    fetchClients();
  });

  const fetchClients = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/clients?search=${search}`);
      setClients(response.data);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (modalData.id) {
        // Обновление
        await axios.put(`http://localhost:5000/clients/${modalData.id}`, modalData);
      } else {
        // Добавление
        await axios.post('http://localhost:5000/clients', modalData);
      }
      setShowModal(false);
      fetchClients();
    } catch (error) {
      console.error('Ошибка сохранения клиента:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/clients/${id}`);
      fetchClients();
    } catch (error) {
      console.error('Ошибка удаления клиента:', error);
    }
  };

  const handleSort = () => {
    const sortedClients = [...clients].sort((a, b) => {
      if (sortAscending) {
        return a.name.localeCompare(b.name); 
      } else {
        return b.name.localeCompare(a.name);
      }
    });
    setClients(sortedClients);
    setSortAscending(!sortAscending);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase()) ||
    client.phone.toLowerCase().includes(search.toLowerCase()) ||
    client.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ClientsWrapper>
      <h3>Список клиентов</h3>
      
      <SearchWrapper>
        <SearchInput
          type="text"
          placeholder="Поиск по имени, email, телефону или типу"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <IconButton onClick={() => {}}>
            <FaFilter size={20} color="gray" />
        </IconButton>
        <AddButton
          onClick={() => {
            setModalData({ id: null, name: '', email: '', phone: '', address: '', type: 'client' });
            setShowModal(true);
          }}
        >
          Добавить клиента
        </AddButton>
        <Button variant="outline-secondary" onClick={handleSort}>
        {sortAscending ? <FaSortAlphaDown /> : <FaSortAlphaUp />} Сортировать по имени
      </Button>
      </SearchWrapper>

      <TableContainer>
        <Table striped bordered hover className="mt-3">
          <StickyTableHeader>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Адрес</th>
              <th>Тип</th>
              <th>Действия</th>
            </tr>
          </StickyTableHeader>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>{client.id}</td>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.phone}</td>
                <td>{client.address}</td>
                <td>{client.type}</td>
                <td>
                <IconButton onClick={() => {
                    setModalData(client);
                    setShowModal(true);
                  }}>
                    <FaEdit size={20} color="orange" />
                  </IconButton>{' '}
                  <IconButton onClick={() => handleDelete(client.id)}>
                    <FaTrash size={20} color="red" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modalData.id ? 'Изменить клиента' : 'Добавить клиента'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Имя</Form.Label>
              <Form.Control
                type="text"
                value={modalData.name}
                onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={modalData.email}
                onChange={(e) => setModalData({ ...modalData, email: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Телефон</Form.Label>
              <Form.Control
                type="text"
                value={modalData.phone}
                onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Адрес</Form.Label>
              <Form.Control
                type="text"
                value={modalData.address}
                onChange={(e) => setModalData({ ...modalData, address: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Тип</Form.Label>
              <Form.Select
                value={modalData.type}
                onChange={(e) => setModalData({ ...modalData, type: e.target.value })}
              >
                <option value="client">Клиент</option>
                <option value="supplier">Поставщик</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={handleSave}>Сохранить</Button>
        </Modal.Footer>
      </Modal>
    </ClientsWrapper>
  );
}

export default Customers;

const ClientsWrapper = styled.div`
  h2 {
    margin-bottom: 15px;
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 2;
  padding: 10px 0;
  border-bottom: 1px solid #ddd;
`;

const SearchInput = styled(Form.Control)`
  width: 70%;
  margin-right: 10px;
`;

const AddButton = styled(Button)`
  border: none;
  background-color: #2CA01C;
  flex-shrink: 0;
  &:hover{
    background-color:rgba(49, 170, 33, 0.8);
  }
`;

const TableContainer = styled.div`
  margin-top: 15px;
  max-height: 700px;
  overflow-y: auto;
`;

const StickyTableHeader = styled.thead`
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 1;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  margin: 0;
`;