import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaFilter,
  FaFileExcel,
  FaFileCsv,
  FaFilePdf,
  FaPlus,
} from "react-icons/fa";
import { Card, Col, Row, Tab, Tabs, Modal, Button } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";

function Transactions() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
  const [card, setcard] = useState(null);
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState("client_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [clients, setClients] = useState([]);
  const token = localStorage.getItem("userToken");
  const [statusFilter, setStatusFilter] = useState("paid"); // Default filter to "paid"

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
    if (!status) return accounts; // If no status filter is set, return all accounts
    return accounts.filter((account) => account.status === status);
  };

  const fetchAllData = async () => {
    try {
      const [accountsResponse, clientsResponse, userResponse] =
        await Promise.all([
          apiRequest("http://localhost:5000/accounts"),
          apiRequest("http://localhost:5000/clients"),
          apiRequest("http://localhost:5000/cards"),
        ]);
      setAccounts(accountsResponse.data);
      setClients(clientsResponse.data);
      if (Array.isArray(userResponse.data) && userResponse.data.length > 0) {
        setcard(userResponse.data[0]);
      }
    } catch (error) {
      toast.error("Ошибка загрузки данных: " + error.message);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const apiRequest = (url, method = "GET", data = null) => {
    const config = {
      method,
      url,
      headers: { Authorization: `Bearer ${token}` },
    };
    if (data) config.data = data;
    return axios(config);
  };

  // Добавление имени клиента в объект account
  const updatedAccounts = accounts.map((account) => {
    const client = clients.find((client) => client.id === account.client_id);
    return {
      ...account,
      client_name: client ? client.name : "Неизвестен", // Если клиента нет, ставим 'Неизвестен'
    };
  });

  const filteredAccounts = filterByStatus(
    filterAndSortAccounts(updatedAccounts, search, sortType, sortOrder),
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

  const exportToCSV = () => {
    const csvData = Papa.unparse(filteredAccounts);
    const blob = new Blob([csvData], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "accounts.csv";
    link.click();
  };

  const exportToXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(filteredAccounts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accounts");
    XLSX.writeFile(wb, "accounts.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "14");
    doc.text("Список оплаченных счетов", 20, 10);
    let yPosition = 20;

    filteredAccounts.forEach((account, index) => {
      yPosition += 10;
      doc.text(
        `${account.client_name} - ${account.amount} - ${
          statusMapping[account.status]
        }`,
        20,
        yPosition
      );
    });

    doc.save("accounts.pdf");
  };

  return (
    <div>
      <ToastContainer />
      <h3 className="mb-4">Список транзакций</h3>
      <Row
        style={{
          display: "flex",
          marginBlockStart: "20px",
          alignItems: "stretch",
        }}
      >
        <Col md={3} style={{ display: "flex", flexDirection: "column" }}>
          <Card style={{ flex: 1 }}>
            <Card.Body>
              <Card.Title>{t("dashboard.creditCard")}</Card.Title>
              <p>
                {t("dashboard.balance")}: {card?.balance || 0} ₽
              </p>
              <p>
                {t("dashboard.name")}: {card?.card_holder_name || "Неизвестно"}
              </p>
              <p>
                {t("dashboard.name")}: {card?.card_number || "Неизвестно"}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <SearchContainer>
        <input
          type="text"
          className="form-control me-3"
          placeholder="Поиск счетов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ButtonsGroup>
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
          <button
            className="btn btn-outline-success me-2"
            onClick={exportToCSV}
          >
            <FaFileCsv />
          </button>
          <button
            className="btn btn-outline-success me-2"
            onClick={exportToXLSX}
          >
            <FaFileExcel />
          </button>
          <button
            className="btn btn-outline-success me-2"
            onClick={exportToPDF}
          >
            <FaFilePdf />
          </button>
        </ButtonsGroup>
      </SearchContainer>
      <StyledTableContainer>
        <AccountsTable
          accounts={filteredAccounts}
          onSort={handleSort}
          sortType={sortType}
          sortOrder={sortOrder}
        />
      </StyledTableContainer>
    </div>
  );
}

export default Transactions;

const statusMapping = {
  paid: "Оплачено",
  unpaid: "Не оплачено",
};

const AccountsTable = ({ accounts, onSort, sortType, sortOrder }) => (
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
        <th>Статус</th>
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
      </tr>
    </thead>
    <tbody>
      {accounts.map((account) => (
        <tr key={account.account_id}>
          <td>{account.client_name}</td>
          <td>{account.amount} ₽</td>
          <td>{statusMapping[account.status] || account.status}</td>
          <td>{account.description}</td>
          <td>{account.category_name}</td>
          <td>{new Date(account.created_at).toLocaleDateString()}</td>
        </tr>
      ))}
    </tbody>
  </StyledTable>
);

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
  width: 70%;
  display: flex;
  margin-bottom: 20px;
  margin-top: 20px;
`;

const ButtonsGroup = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
`;
