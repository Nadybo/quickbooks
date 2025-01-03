import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import styled from "styled-components";
import { FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";
import { Card, Col, Row, Button, Form } from "react-bootstrap";
// import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
  Tooltip,
  Legend
);
function Reports() {
  // const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [selectedData, setSelectedData] = useState({
    clients: false,
    paidBills: false,
    unpaidBills: false,
    incomeExpenses: false,
    clientsReport: false,
    transactionsReport: false,
    individualUserReports: false,
  });
  const token = localStorage.getItem("userToken");

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
      const [reportsResponse, accountsResponse, clientsResponse] =
        await Promise.all([
          apiRequest("http://localhost:5000/reports"),
          apiRequest("http://localhost:5000/accounts"),
          apiRequest("http://localhost:5000/clients"),
        ]);

      const clientsMap = Object.fromEntries(
        clientsResponse.data.map((client) => [client.id, client.name])
      );

      const income = accountsResponse.data.filter(
        (account) => account.status === "paid" && account.category_id === 2
      );
      const expenses = accountsResponse.data.filter(
        (account) =>
          account.status === "paid" &&
          (account.category_id === 1 || account.category_id === 4)
      );

      setIncomeData(income);
      setExpenseData(expenses);

      setReports(reportsResponse.data);
      setClients(clientsResponse.data);

      setAccounts(
        accountsResponse.data.map((account) => ({
          ...account,
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

  const handleSearch = (e) => {
    setSearch(e.target.value.toLowerCase());
  };

  const handleSort = (field) => {
    const order = sortType === field && sortOrder === "asc" ? "desc" : "asc";
    setSortType(field);
    setSortOrder(order);
    const sortedReports = [...reports].sort((a, b) => {
      if (a[field] < b[field]) return order === "asc" ? -1 : 1;
      if (a[field] > b[field]) return order === "asc" ? 1 : -1;
      return 0;
    });
    setReports(sortedReports);
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedData((prev) => ({ ...prev, [name]: checked }));
  };

  const exportData = (format) => {
    const dataToExport = [];

    if (selectedData.clientsReport) {
      dataToExport.push(
        ...clients.map((client) => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          type: client.type,
        }))
      );
    }

    if (selectedData.transactionsReport) {
      dataToExport.push(
        ...accounts.map((account) => ({
          id: account.id,
          client_name: account.client_name,
          amount: account.amount,
          status: account.status,
          description: account.description,
          created_at: account.created_at,
        }))
      );
    }

    if (selectedData.individualUserReports) {
      dataToExport.push(
        ...reports.map((report) => ({
          id: report.id,
          user_id: report.user_id,
          report_name: report.report_name,
          generated_at: report.generated_at,
        }))
      );
    }

    if (format === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, "exported_data.xlsx");
    } else if (format === "csv") {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "exported_data.csv");
      link.click();
    } else if (format === "pdf") {
      const doc = new jsPDF();
      doc.autoTable({ body: dataToExport });
      doc.save("exported_data.pdf");
    }
  };

  const filteredReports = reports.filter((report) =>
    report.report_name?.toLowerCase().includes(search)
  );

  const totalIncome = incomeData.reduce(
    (sum, account) => sum + account.amount,
    0
  );
  const totalExpense = expenseData.reduce(
    (sum, account) => sum + account.amount,
    0
  );

  const doughnutChartData = {
    labels: ["Доходы", "Расходы"],
    datasets: [
      {
        data: [totalIncome, totalExpense],
        backgroundColor: ["rgba(0, 255, 0, 0.6)", "rgba(255, 0, 0, 0.6)"],
        hoverBackgroundColor: ["rgba(0, 255, 0, 0.8)", "rgba(255, 0, 0, 0.8)"],
      },
    ],
  };
  const exportChart = async (chartId) => {
    const chartElement = document.getElementById(chartId);

    if (!chartElement) {
      toast.error("График не найден!");
      return;
    }

    try {
      const canvas = await html2canvas(chartElement);
      const image = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = image;
      link.download = `${chartId}.png`;
      link.click();
    } catch (error) {
      toast.error("Ошибка при экспорте графика: " + error.message);
    }
  };

  // const exportChartToPDF = async (chartId) => {
  //   const chartElement = document.getElementById(chartId);

  //   if (!chartElement) {
  //     toast.error("График не найден!");
  //     return;
  //   }

  //   try {
  //     const canvas = await html2canvas(chartElement);
  //     const image = canvas.toDataURL("image/png");

  //     const doc = new jsPDF();
  //     doc.addImage(image, "PNG", 10, 10, 190, 90); // Настройте размеры
  //     doc.save(`${chartId}.pdf`);
  //   } catch (error) {
  //     toast.error("Ошибка при экспорте в PDF: " + error.message);
  //   }
  // };

  return (
    <MainDiv>
      <Row>
        <ToastContainer />
        <Col md={5} className="mt-3">
          <Card>
            <Card.Body>
              <div>
                <SearchContainer>
                  <input
                    className="form-control me-3"
                    type="text"
                    placeholder="Поиск по названию отчета..."
                    value={search}
                    onChange={handleSearch}
                  />
                </SearchContainer>
                <StyledTableContainer>
                  <ReportsTable
                    reports={filteredReports}
                    onSort={handleSort}
                    sortType={sortType}
                    sortOrder={sortOrder}
                  />
                </StyledTableContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={7} className="mt-3">
          <Card>
            <Card.Body>
              <h5>Выберите типы отчетов для экспорта:</h5>
              <Form>
                <Form.Check
                  type="checkbox"
                  id="clients"
                  name="clients"
                  label="Клиенты"
                  checked={selectedData.clients}
                  onChange={handleCheckboxChange}
                />
                <Form.Check
                  type="checkbox"
                  id="paidBills"
                  name="paidBills"
                  label="Оплаченные счета"
                  checked={selectedData.paidBills}
                  onChange={handleCheckboxChange}
                />
                <Form.Check
                  type="checkbox"
                  id="unpaidBills"
                  name="unpaidBills"
                  label="Неоплаченные счета"
                  checked={selectedData.unpaidBills}
                  onChange={handleCheckboxChange}
                />
                <Form.Check
                  type="checkbox"
                  id="incomeExpenses"
                  name="incomeExpenses"
                  label="Доходы и расходы"
                  checked={selectedData.incomeExpenses}
                  onChange={handleCheckboxChange}
                />
                {/* Новые отчеты */}
                <Form.Check
                  type="checkbox"
                  id="clientsReport"
                  name="clientsReport"
                  label="Отчет по клиентам"
                  checked={selectedData.clientsReport}
                  onChange={handleCheckboxChange}
                />
                <Form.Check
                  type="checkbox"
                  id="transactionsReport"
                  name="transactionsReport"
                  label="Отчет по транзакциям"
                  checked={selectedData.transactionsReport}
                  onChange={handleCheckboxChange}
                />
                <Form.Check
                  type="checkbox"
                  id="individualUserReports"
                  name="individualUserReports"
                  label="Индивидуальные отчеты пользователя"
                  checked={selectedData.individualUserReports}
                  onChange={handleCheckboxChange}
                />
              </Form>

              <div id="doughnutChart">
                <Doughnut
                  data={doughnutChartData}
                  options={{ responsive: true }}
                />
              </div>

              <div className="mt-4">
                <Button variant="success" onClick={() => exportData("excel")}>
                  Экспорт в Excel
                </Button>
                <Button
                  variant="info"
                  className="ms-2"
                  onClick={() => exportData("csv")}
                >
                  Экспорт в CSV
                </Button>
                <Button
                  variant="danger"
                  className="ms-2"
                  onClick={() => exportData("pdf")}
                >
                  Экспорт в PDF
                </Button>
                <Button
                  variant="primary"
                  className="ms-2"
                  onClick={() => exportChart("doughnutChart")}
                >
                  Экспорт графика
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </MainDiv>
  );
}

export default Reports;

const ReportsTable = ({ reports, onSort, sortType, sortOrder }) => (
  <StyledTable className="table table-hover">
    <thead>
      <tr>
        <th onClick={() => onSort("client_name")} style={{ cursor: "pointer" }}>
          Название отчета{" "}
          {sortType === "client_name" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th
          onClick={() => onSort("generated_at")}
          style={{ cursor: "pointer" }}
        >
          Дата генерации{" "}
          {sortType === "generated_at" &&
            (sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />)}
        </th>
        <th>Данные отчета</th>
      </tr>
    </thead>
    <tbody>
      {reports.map((report) => (
        <tr key={report.id}>
          <td>{report.report_name}</td>
          <td>{new Date(report.generated_at).toLocaleDateString()}</td>
          <td>{report.report_data}</td>
        </tr>
      ))}
    </tbody>
  </StyledTable>
);

const MainDiv = styled.div`
  max-height: 800px;
  min-height: 800px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const StyledTableContainer = styled.div`
  max-height: 670px;
  min-height: 670px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
`;

const SearchContainer = styled.div`
  margin-bottom: 20px;
  margin-top: 20px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  overflow-y: auto;

  thead th {
    position: sticky;
    top: 0;
    background: #f8f9fa;
    z-index: 1;
    cursor: pointer;
  }

  tbody tr:nth-child(odd) {
    background-color: #f9f9f9;
  }
  tbody tr:nth-child(even) {
    background-color: #ffffff;
  }
`;
