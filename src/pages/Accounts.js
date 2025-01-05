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
import { useTranslation } from "react-i18next";
import axios from "axios";

function Accounts() {
  const { t } = useTranslation();
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
  const [card, setcard] = useState(null);

  const initialAccountData = {
    client_id: "",
    amount: "",
    status: "",
    description: "",
    category_id: "",
  };
  const [accountData, setAccountData] = useState(initialAccountData);

  const handleShowModal = (account = null) => {
    setIsEditMode(!!account);
    setSelectedAccount(account);
    setAccountData(account || initialAccountData);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

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
      const [categoriesResponse, clientsResponse, accountsResponse, cardsResponse] =
        await Promise.all([
          apiRequest("http://localhost:5000/categories"),
          apiRequest("http://localhost:5000/clients"),
          apiRequest("http://localhost:5000/accounts"),
          apiRequest("http://localhost:5000/cards"),
        ]);

      const categoriesMap = Object.fromEntries(
        categoriesResponse.data.map((category) => [category.id, category.name])
      );
      const clientsMap = Object.fromEntries(
        clientsResponse.data.map((client) => [client.id, client.name])
      );

      setCategories(categoriesResponse.data);
      setClients(clientsResponse.data);
      setAccounts(
        accountsResponse.data.map((account) => ({
          ...account,
          category_name: categoriesMap[account.category_id] || "Неизвестно",
          client_name: clientsMap[account.client_id] || "Неизвестно",
        }))
      );
      if (Array.isArray(cardsResponse.data) && cardsResponse.data.length > 0) {
        setcard(cardsResponse.data[0]);
      }
    } catch (error) {
      toast.error("Ошибка загрузки данных: " + error.message);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAccountData({ ...accountData, [name]: value });
  };

  const handleClientChange = (e) => {
    const selectedClientId = e.target.value; 
    console.log("Selected Client:", selectedClientId);
    setAccountData({
      ...accountData,
      client_id: selectedClientId,
    });
  };

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
    if (!status) return accounts; 
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

  const handleShowPaymentModal = (account) => {
    if (!account) {
      console.error("Account is undefined");
      return;
    }
    setSelectedPaymentAccount(account);
    setShowPaymentModal(true);
  };
  
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentAccount(null);
  };

  const expenseCategories = [1, 3]; 
const incomeCategories = [4, 2]; 

const onPay = async (accountId) => {
  try {
    const account = accounts.find((acc) => acc.account_id === accountId);

    if (!account) {
      toast.error("Счет не найден!");
      return;
    }

    const category_id = account.category_id;
    let updatedBalance;

    if (expenseCategories.includes(category_id)) {
      updatedBalance = parseFloat(card.balance) - parseFloat(account.amount); 
    } else if (incomeCategories.includes(category_id)) {
      updatedBalance = parseFloat(card.balance) + parseFloat(account.amount); 
    } else {
      throw new Error("Неизвестная категория!");
    }

    if (isNaN(updatedBalance)) {
      throw new Error("Некорректные данные для обновления баланса.");
    }

    // console.log("account.amount:", account.amount);
    // console.log("card.balance:", card.balance);
    // console.log("updatedBalance:", updatedBalance);

    await axios.put(
      `http://localhost:5000/cards/${card.id}`,
      { balance: updatedBalance },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await axios.put(
      `http://localhost:5000/accounts/pay/${accountId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success("Счет успешно оплачен!");
    fetchAllData();
    handleClosePaymentModal();
  } catch (error) {
    toast.error("Ошибка при оплате счета: " + error.message);
    console.error("Ошибка при оплате счета:", error);
  }
};




  

  return (
    <div>
      <ToastContainer />
      <h3 className="mb-4">{t("accounts.title")}</h3>
      <SearchContainer>
        <input
          type="text"
          className="form-control me-3"
          placeholder={t("accounts.searchTitle")}
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
          t={t}
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
        t={t}
      />
      <PaymentModal
        show={showPaymentModal}
        onHide={handleClosePaymentModal}
        account={selectedPaymentAccount}
        onPay={onPay}
        t={t}
      />
    </div>
  );
}

export default Accounts;

const statusMapping = {
  paid: "Оплачено",
  unpaid: "Не оплачено",
};

const AccountsTable = ({
  accounts,
  onEdit,
  onDelete,
  onSort,
  sortType,
  sortOrder,
  onPay,
  t
}) => (
  <StyledTable className="table table-hover">
    <thead>
      <tr>
        <th onClick={() => onSort("client_name")} style={{ cursor: "pointer" }}>
          {t("accounts.accountsTable.clientName")}{" "}
          {sortType === "client_name" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th onClick={() => onSort("amount")} style={{ cursor: "pointer" }}>
        {t("accounts.accountsTable.amount")}{" "}
          {sortType === "amount" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th onClick={() => onSort("status")} style={{ cursor: "pointer" }}>
        {t("accounts.accountsTable.status")}{" "}
          {sortType === "status" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th>{t("accounts.accountsTable.description")}</th>
        <th
          onClick={() => onSort("category_name")}
          style={{ cursor: "pointer" }}
        >
          {t("accounts.accountsTable.category")}{" "}
          {sortType === "category_name" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th onClick={() => onSort("date")} style={{ cursor: "pointer" }}>
        {t("accounts.accountsTable.creationDate")}{" "}
          {sortType === "date" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th>{t("accounts.accountsTable.actions")}</th>
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
                {t("accounts.accountsTable.actions")}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => onEdit(account)}>
                    <FaEdit className="me-2" />
                    {t("accounts.accountsTable.editAccount")}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => onDelete(account.account_id)}>
                    <FaTrash className="me-2" />
                    {t("accounts.accountsTable.deleteAccount")}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => onPay(account)}>
                    💳 {t("accounts.accountsTable.pay")}
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
  t
}) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>
        {accountData.client_name ? t("accounts.modal.editAccount") : t("accounts.modal.addAccount")}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>{t("accounts.modal.clientNameLabel")}</Form.Label>
          <Form.Select
            name="client_id"
            value={accountData.client_id}
            onChange={onClientChange}
          >
            <option value="">{t("accounts.modal.selectClient")}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {" "}
                {client.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t("accounts.modal.amountLabel")}</Form.Label>
          <Form.Control
            type="number"
            name="amount"
            placeholder={t("accounts.modal.amountPlaceholder")}
            value={accountData.amount}
            onChange={onChange}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t("accounts.modal.statusLabel")}</Form.Label>
          <Form.Select
            name="status"
            value={accountData.status}
            onChange={onChange}
          >
            <option value="paid">{t("accounts.modal.paidOption")}</option>
            <option value="unpaid">{t("accounts.modal.unpaidOption")}</option>
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t("accounts.modal.descriptionLabel")}</Form.Label>
          <Form.Control
            type="textarea"
            name="description"
            placeholder={t("accounts.modal.descriptionPlaceholder")}
            value={accountData.description}
            onChange={onChange}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t("accounts.modal.categoryLabel")}</Form.Label>
          <Form.Select
            name="category_id"
            value={accountData.category_id}
            onChange={onChange}
          >
            <option value="">{t("accounts.modal.selectCategory")}</option>
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
      {t("accounts.modal.cancelButton")}
      </Button>
      <Button variant="primary" onClick={onSave}>
      {t("accounts.modal.saveButton")}
      </Button>
    </Modal.Footer>
  </Modal>
);

const PaymentModal = ({ show, onHide, account, onPay, t }) => {
  if (!account) return null;

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Оплата счета</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          <strong>{t("accounts.modal.clientNameLabel")}:</strong> {account.client_name}
        </p>
        <p>
          <strong>{t("accounts.modal.amountLabel")}:</strong> {account.amount} ₽
        </p>
        <p>
          <strong>{t("accounts.modal.statusLabel")}:</strong> {account.status}
        </p>
        <p>
          <strong>{t("accounts.modal.descriptionLabel")}:</strong> {account.description}
        </p>
        <p>
          <strong>{t("accounts.modal.categoryLabel")}:</strong> {account.category_name}
        </p>
        <p>
          <strong>{t("accounts.modal.creationDate")}:</strong>{" "}
          {new Date(account.created_at).toLocaleDateString()}
        </p>
        <hr />
        <p>{t("accounts.modal.textMsg")}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
        {t("accounts.modal.cancelButton")}
        </Button>
        <Button variant="primary" onClick={() => onPay(account.account_id)}>
        {t("accounts.accountsTable.pay")}
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
