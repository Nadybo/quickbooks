import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import styled from "styled-components";
import { Card, Col, Row, Button, Form, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Doughnut, Line } from "react-chartjs-2";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
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

      const income = accountsResponse.data
        .filter(
          (account) =>
            account.status === "paid" &&
            (account.category_id === 2 || account.category_id === 4)
        )
        .map((account) => ({
          ...account,
          client_name: clientsMap[account.client_id] || "Неизвестно",
        }));

      const expenses = accountsResponse.data
        .filter(
          (account) =>
            account.status === "paid" &&
            (account.category_id === 1 || account.category_id === 3)
        )
        .map((account) => ({
          ...account,
          client_name: clientsMap[account.client_id] || "Неизвестно",
        }));

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

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedData((prev) => ({ ...prev, [name]: checked }));
  };

  const exportData = async (format) => {
    const dataToExport = [];

    if (selectedData.clientsReport) {
      dataToExport.push(
        ...clients.map((client) => ({
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          type: client.type,
        }))
      );
    }

    if (selectedData.paidBills) {
      const paidAccounts = accounts.filter(
        (account) => account.status === "paid"
      );

      dataToExport.push(
        ...paidAccounts.map((account) => ({
          client_name: account.client_name,
          amount: account.amount,
          status: account.status,
          description: account.description,
          created_at: account.created_at,
        }))
      );
    }

    if (selectedData.unpaidBills) {
      const paidAccounts = accounts.filter(
        (account) => account.status === "unpaid"
      );

      dataToExport.push(
        ...paidAccounts.map((account) => ({
          client_name: account.client_name,
          amount: account.amount,
          status: account.status,
          description: account.description,
          created_at: account.created_at,
        }))
      );
    }

    if (selectedData.income) {
      dataToExport.push(
        ...incomeData.map((income) => ({
          client_name: income.client_name,
          amount: income.amount,
          status: income.status,
          description: income.description,
          created_at: income.created_at,
        }))
      );
    }

    if (selectedData.transactionsReport) {
      dataToExport.push(
        ...accounts.map((account) => ({
          client_name: account.client_name,
          amount: account.amount,
          status: account.status,
          description: account.description,
          created_at: account.created_at,
        }))
      );
    }

    if (selectedData.expense) {
      dataToExport.push(
        ...expenseData.map((expense) => ({
          client_name: expense.client_name,
          amount: expense.amount,
          status: expense.status,
          description: expense.description,
          created_at: expense.created_at,
        }))
      );
    }

    try {
      if (format === "excel") {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        const borderStyle = {
          top: { style: "thin" },
          right: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
        };

        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
            if (cell) {
              cell.s = {
                border: borderStyle,
              };
            }
          }
        }

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

        const tableData = dataToExport.map((item) => [
          item.client_name || "N/A",
          item.amount || "N/A",
          item.status || "N/A",
          item.description || "N/A",
          item.created_at || "N/A",
        ]);

        const tableHeaders = [
          "Client Name",
          "Amount",
          "Status",
          "Description",
          "Created At",
        ];

        if (tableData.length === 0) {
          toast.error("Нет данных для экспорта в PDF.");
          return;
        }

        doc.autoTable({
          head: [tableHeaders],
          body: tableData,
          theme: "grid",
          styles: { fontSize: 10 },
        });

        doc.save("exported_data.pdf");
      }

      const reportName = `Exported ${format.toUpperCase()} Report`;

      await apiRequest("http://localhost:5000/reports", "POST", {
        report_name: reportName,
      });
      fetchAllData();
      toast.success(
        `Данные успешно экспортированы в ${format} и сохранены в отчетах.`
      );
    } catch (error) {
      toast.error("Ошибка при экспорте данных: " + error.message);
    }
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

  const totalIncome = incomeData.reduce(
    (sum, account) => sum + parseFloat(account.amount),
    0
  );

  const totalExpense = expenseData.reduce(
    (sum, account) => sum + parseFloat(account.amount),
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
  const multiAxisChartData = {
    labels: incomeData.map((account) =>
      new Date(account.created_at).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Доходы",
        data: incomeData.map((account) => parseFloat(account.amount)),
        borderColor: "green",
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        fill: true,
        yAxisID: "y1",
      },
      {
        label: "Расходы",
        data: expenseData.map((account) => parseFloat(account.amount)),
        borderColor: "red",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        fill: true,
        yAxisID: "y2",
      },
    ],
  };

  const multiAxisChartOptions = {
    responsive: true,
    scales: {
      y1: {
        type: "linear",
        position: "left",
        ticks: {
          beginAtZero: true,
        },
      },
      y2: {
        type: "linear",
        position: "right",
        ticks: {
          beginAtZero: true,
        },
      },
    },
  };
  return (
    <MainDiv>
      <h3 className="mb-4">{t("reports.title")}</h3>
      <Row>
        <ToastContainer />
        <Col md={12} className="mt-3">
          <Card>
            <Card.Body>
              <h5>{t("reports.selectReportTypes")}</h5>
              <Form>
                <CheckboxContainer>
                  <CardWrapper
                    className={selectedData.paidBills ? "selected" : ""}
                    onClick={() =>
                      handleCheckboxChange({
                        target: {
                          name: "paidBills",
                          checked: !selectedData.paidBills,
                        },
                      })
                    }
                  >
                    <CheckboxInput
                      type="checkbox"
                      id="paidBills"
                      name="paidBills"
                      checked={selectedData.paidBills}
                      onChange={handleCheckboxChange}
                    />
                    <CheckboxLabel htmlFor="paidBills">
                      {t("reports.paidBills")}
                    </CheckboxLabel>
                  </CardWrapper>
                  <CardWrapper
                    className={selectedData.expense ? "selected" : ""}
                    onClick={() =>
                      handleCheckboxChange({
                        target: {
                          name: "expense",
                          checked: !selectedData.expense,
                        },
                      })
                    }
                  >
                    <CheckboxInput
                      type="checkbox"
                      id="expense"
                      name="expense"
                      checked={selectedData.expense}
                      onChange={handleCheckboxChange}
                    />
                    <CheckboxLabel htmlFor="expense">
                      {t("reports.expenses")}
                    </CheckboxLabel>
                  </CardWrapper>
                </CheckboxContainer>

                <CheckboxContainer>
                  <CardWrapper
                    className={selectedData.unpaidBills ? "selected" : ""}
                    onClick={() =>
                      handleCheckboxChange({
                        target: {
                          name: "unpaidBills",
                          checked: !selectedData.unpaidBills,
                        },
                      })
                    }
                  >
                    <CheckboxInput
                      type="checkbox"
                      id="unpaidBills"
                      name="unpaidBills"
                      checked={selectedData.unpaidBills}
                      onChange={handleCheckboxChange}
                    />
                    <CheckboxLabel htmlFor="unpaidBills">
                      {t("reports.unpaidBills")}
                    </CheckboxLabel>
                  </CardWrapper>

                  <CardWrapper
                    className={selectedData.income ? "selected" : ""}
                    onClick={() =>
                      handleCheckboxChange({
                        target: {
                          name: "income",
                          checked: !selectedData.income,
                        },
                      })
                    }
                  >
                    <CheckboxInput
                      type="checkbox"
                      id="income"
                      name="income"
                      checked={selectedData.income}
                      onChange={handleCheckboxChange}
                    />
                    <CheckboxLabel htmlFor="income">
                      {t("reports.income")}
                    </CheckboxLabel>
                  </CardWrapper>
                </CheckboxContainer>

                <CheckboxContainer>
                  <CardWrapper
                    className={selectedData.clientsReport ? "selected" : ""}
                    onClick={() =>
                      handleCheckboxChange({
                        target: {
                          name: "clientsReport",
                          checked: !selectedData.clientsReport,
                        },
                      })
                    }
                  >
                    <CheckboxInput
                      type="checkbox"
                      id="clientsReport"
                      name="clientsReport"
                      checked={selectedData.clientsReport}
                      onChange={handleCheckboxChange}
                    />
                    <CheckboxLabel htmlFor="clientsReport">
                      {t("reports.clientsReport")}
                    </CheckboxLabel>
                  </CardWrapper>

                  <CardWrapper
                    className={
                      selectedData.transactionsReport ? "selected" : ""
                    }
                    onClick={() =>
                      handleCheckboxChange({
                        target: {
                          name: "transactionsReport",
                          checked: !selectedData.transactionsReport,
                        },
                      })
                    }
                  >
                    <CheckboxInput
                      type="checkbox"
                      id="transactionsReport"
                      name="transactionsReport"
                      checked={selectedData.transactionsReport}
                      onChange={handleCheckboxChange}
                    />
                    <CheckboxLabel htmlFor="transactionsReport">
                      {t("reports.transactionsReport")}
                    </CheckboxLabel>
                  </CardWrapper>
                </CheckboxContainer>
              </Form>

              <GraphWrapper>
                <GraphDiv id="doughnutChart">
                  <Doughnut
                    data={doughnutChartData}
                    options={{ responsive: true }}
                  />
                </GraphDiv>
                <GraphDiv id="LineChart">
                  <Line
                    data={multiAxisChartData}
                    options={multiAxisChartOptions}
                  />
                </GraphDiv>
              </GraphWrapper>

              <div className="mt-4 d-flex align-items-center">
                <Button variant="success" onClick={() => exportData("excel")}>
                  {t("reports.exportExcel")}
                </Button>
                <Button
                  variant="success"
                  className="ms-2"
                  onClick={() => exportData("csv")}
                >
                  {t("reports.exportCsv")}
                </Button>
                <Button
                  variant="success"
                  className="ms-2"
                  onClick={() => exportData("pdf")}
                >
                  {t("reports.exportPdf")}
                </Button>
                <Dropdown className="ms-2">
                  <Dropdown.Toggle
                    variant="outline-success"
                    size="sm"
                    id="dropdown-menu-end"
                  >
                    {t("reports.exportChart")}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => exportChart("doughnutChart")}>
                      {t("reports.doughnutChart")}
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => exportChart("LineChart")}>
                      {t("reports.lineChart")}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </MainDiv>
  );
}

export default Reports;

const MainDiv = styled.div`
  max-height: 810px;
  min-height: 810px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const GraphDiv = styled.div`
  flex: 1;
  max-height: 400px;
  margin: 10px;
`;

const GraphWrapper = styled.div`
  display: flex;
  justify-content: space-between; /* Разделяем графики с отступами */
  gap: 10px;
  width: 100%;
`;

const CheckboxContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const CardWrapper = styled.div`
  width: 48%;
  height: 50px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  transition: box-shadow 0.3s ease; /* Плавный переход для box-shadow */
  cursor: pointer;

  &:hover {
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.35); /* Эффект при наведении */
  }

  &.selected {
    background-color: #2ca01c; /* Цвет фона при выделении */
    box-shadow: 0px 4px 10px #2ca01c; /* Эффект выделения */
    color: white;
  }
`;

const CheckboxInput = styled.input`
  display: none;
`;

const CheckboxLabel = styled.label`
  margin-left: 10px;
  font-size: 14px;
  cursor: pointer;
`;
