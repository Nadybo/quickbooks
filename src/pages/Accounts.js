import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FaTrash,
  FaEdit,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaPlus,
  FaFilter,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState("client_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const token = localStorage.getItem("userToken");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState(null);

  const initialAccountData = {
    client_id: "",
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
  const apiRequest = (url, method = "GET", data = null) => {
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
      const [categoriesResponse, clientsResponse, accountsResponse] =
        await Promise.all([
          apiRequest("http://localhost:5000/categories"),
          apiRequest("http://localhost:5000/clients"),
          apiRequest("http://localhost:5000/accounts"),
        ]);

      const categoriesMap = Object.fromEntries(
        categoriesResponse.data.map((category) => [category.id, category.name])
      );
      const clientsMap = Object.fromEntries(
        clientsResponse.data.map((client) => [client.id, client.name])
      );

      setCategories(categoriesResponse.data);
      setClients(clientsResponse.data); // Ensure it's an array
      setAccounts(
        accountsResponse.data.map((account) => ({
          ...account,
          category_name: categoriesMap[account.category_id] || "Неизвестно",
          client_name: clientsMap[account.client_id] || "Неизвестно",
        }))
      );
    } catch (error) {
      toast.error("Ошибка загрузки данных: " + error.message);
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
    const selectedClientId = e.target.value; // Получаем id выбранного клиента
    console.log("Selected Client:", selectedClientId);
    setAccountData({
      ...accountData,
      client_id: selectedClientId, // Обновляем client_id в состоянии
    });
  };

  // Сохранение
  const saveAccount = async () => {
    const payload = {
      ...accountData,
      category_id: parseInt(accountData.category_id, 10),
      client_id: accountData.client_id,
    };
    const url = isEditMode
      ? `http://localhost:5000/accounts/${selectedAccount.account_id}`
      : "http://localhost:5000/accounts";
    const method = isEditMode ? "PUT" : "POST";
    console.log("Payload:", payload);
    await apiRequest(url, method, payload);
  };

  const handleSaveAccount = async () => {
    try {
      if (
        !accountData.amount ||
        !accountData.status ||
        !accountData.category_id
      ) {
        toast.error("Пожалуйста, заполните все обязательные поля.");
        return;
      }
      await saveAccount();
      toast.success(
        isEditMode ? "Счет успешно обновлен!" : "Счет успешно добавлен!"
      );
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
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Счет успешно удален!");
      fetchAllData();
    } catch (error) {
      toast.error("Ошибка удаления счета: " + error.message);
    }
  };

  // Фильтрация и сортировка
  const filterAndSortAccounts = (accounts, search, sortType, sortOrder) => {
    const filtered = accounts.filter((account) =>
      ["client_name", "description", "amount", "status"].some((key) =>
        account[key]?.toString().toLowerCase().includes(search.toLowerCase())
      )
    );

    return filtered.sort((a, b) => {
      const order = sortOrder === "asc" ? 1 : -1;
      switch (sortType) {
        case "client_name":
        case "status":
        case "category_name":
          return a[sortType]?.localeCompare(b[sortType]) * order;
        case "amount":
          return (a[sortType] - b[sortType]) * order;
        case "date":
          return (new Date(a.created_at) - new Date(b.created_at)) * order;
        default:
          return 0;
      }
    });
  };

  const filterByStatus = (accounts, status) => {
    if (!status) return accounts; // Если статус не выбран, возвращаем все записи
    return accounts.filter((account) => account.status === status);
  };

  const filteredAccounts = filterByStatus(
    filterAndSortAccounts(accounts, search, sortType, sortOrder),
    statusFilter
  );

  const handleSort = (type) => {
    if (sortType === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortType(type);
      setSortOrder("asc");
    }
  };

  // Открыть модальное окно оплаты
  const handleShowPaymentModal = (account) => {
    if (!account) {
      console.error("Account is undefined");
      return;
    }
    setSelectedPaymentAccount(account);
    setShowPaymentModal(true);
  };
  
  // Закрыть модальное окно оплаты
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentAccount(null);
  };

  const onPay = async (accountId) => {
    try {
      await axios.put(
        `http://localhost:5000/accounts/pay/${accountId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Счет успешно оплачен!");
      fetchAllData(); // Обновляем данные
      handleClosePaymentModal(); // Закрываем модальное окно
    } catch (error) {
      toast.error("Ошибка при оплате счета: " + error.message);
    }
  };

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
        <button
          className="btn btn-outline-success me-2"
          onClick={() => handleShowModal()}
        >
          <FaPlus />
        </button>
        <button
          className="btn btn-outline-success me-2"
          onClick={() => {
            setSortType("client_name");
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
          }}
        >
          {sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
        </button>
        <button
          className="btn btn-outline-success me-2"
          onClick={() => {
            setSortType("date");
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
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
          onSort={handleSort}
          sortType={sortType}
          sortOrder={sortOrder}
          onPay={handleShowPaymentModal}
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
      <PaymentModal
        show={showPaymentModal}
        onHide={handleClosePaymentModal}
        account={selectedPaymentAccount}
        onPay={onPay}
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
const AccountsTable = ({
  accounts,
  onEdit,
  onDelete,
  onSort,
  sortType,
  sortOrder,
  onPay
}) => (
  <StyledTable className="table table-hover">
    <thead>
      <tr>
        <th onClick={() => onSort("client_name")} style={{ cursor: "pointer" }}>
          Имя клиента{" "}
          {sortType === "client_name" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th onClick={() => onSort("amount")} style={{ cursor: "pointer" }}>
          Сумма{" "}
          {sortType === "amount" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th onClick={() => onSort("status")} style={{ cursor: "pointer" }}>
          Статус{" "}
          {sortType === "status" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th>Описание</th>
        <th
          onClick={() => onSort("category_name")}
          style={{ cursor: "pointer" }}
        >
          Категория{" "}
          {sortType === "category_name" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th onClick={() => onSort("date")} style={{ cursor: "pointer" }}>
          Дата создания{" "}
          {sortType === "date" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th>Действия</th>
      </tr>
    </thead>
    <tbody>
      {accounts.map((account) => (
        <tr key={account.account_id}>
          <td>{account.client_name}</td>
          <td>{account.amount} ₽</td>
          <td
            style={{
              backgroundColor:
                account.status === "paid" ? "green" : "transparent",
              color: account.status === "paid" ? "white" : "black",
            }}
          >
            {statusMapping[account.status] || account.status}
          </td>
          <td>{account.description}</td>
          <td>{account.category_name}</td>
          <td>{new Date(account.created_at).toLocaleDateString()}</td>
          <td>
            {account.status !== "paid" ? (
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-success"
                  size="sm"
                  id="dropdown-basic"
                >
                  Действия
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => onEdit(account)}>
                    <FaEdit className="me-2" />
                    Редактировать
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => onDelete(account.account_id)}>
                    <FaTrash className="me-2" />
                    Удалить
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => onPay(account)}>
                    💳 Оплатить
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <span></span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </StyledTable>
);

const AccountModal = ({
  show,
  onHide,
  accountData,
  clients,
  categories,
  onChange,
  onSave,
  onClientChange,
}) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>
        {accountData.client_name ? "Редактировать счет" : "Добавить счет"}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Имя клиента</Form.Label>
          <Form.Select
            name="client_id" // Используем client_id для связывания
            value={accountData.client_id} // Привязываем к состоянию
            onChange={onClientChange} // Обработчик изменения для клиента
          >
            <option value="">Выберите клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {" "}
                {/* value - client.id */}
                {client.name} {/* Отображаем имя клиента */}
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

const PaymentModal = ({ show, onHide, account, onPay }) => {
  if (!account) return null;

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Оплата счета</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          <strong>Имя клиента:</strong> {account.client_name}
        </p>
        <p>
          <strong>Сумма:</strong> {account.amount} ₽
        </p>
        <p>
          <strong>Статус:</strong> {account.status}
        </p>
        <p>
          <strong>Описание:</strong> {account.description}
        </p>
        <p>
          <strong>Категория:</strong> {account.category_name}
        </p>
        <p>
          <strong>Дата создания:</strong>{" "}
          {new Date(account.created_at).toLocaleDateString()}
        </p>
        <hr />
        <p>Вы уверены, что хотите оплатить этот счет?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Отменить
        </Button>
        <Button variant="primary" onClick={() => onPay(account.account_id)}>
          Оплатить
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Стили
const StyledTableContainer = styled.div`
  max-height: 700px;
  min-height: 700px;
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
