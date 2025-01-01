import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, Col, Row, Tab, Tabs, Modal, Button } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import styled from "styled-components";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaExchangeAlt,
  FaFileInvoiceDollar,
  FaFileExport,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Home() {
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [tasks, setTasks] = useState({
    notStarted: [],
    inProgress: [],
    completed: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "not_started",
  });

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const handleAddTask = () => {
    if (!newTask.title) {
      toast.error("Введите название задачи.");
      return;
    }
    addTask(newTask);
    setNewTask({ title: "", description: "", status: "not_started" });
    handleCloseModal();
  };

  const token = localStorage.getItem("userToken");

  // API запросы для получения данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем данные пользователя
        const userResponse = await axios.get("http://localhost:5000/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(userResponse.data) && userResponse.data.length > 0) {
          setUser(userResponse.data[0]);
        }

        const clientsResponse = await axios.get(
          "http://localhost:5000/clients",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClients(clientsResponse.data);

        // Загружаем счета
        const accountsResponse = await axios.get(
          "http://localhost:5000/accounts",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Фильтруем счета по категориям (расходы и доходы)
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
      } catch (error) {
        console.error("Ошибка при загрузке данных", error);
      }
    };

    fetchData();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://localhost:5000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Распределение задач по статусам
      const notStarted = response.data.filter(
        (task) => task.status === "not_started"
      );
      const inProgress = response.data.filter(
        (task) => task.status === "in_progress"
      );
      const completed = response.data.filter(
        (task) => task.status === "completed"
      );

      setTasks({ notStarted, inProgress, completed });
    } catch (error) {
      console.error("Ошибка при загрузке задач:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (task) => {
    try {
      await axios.post("http://localhost:5000/tasks", task, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
      toast.success("Задача добавлена!");
    } catch (error) {
      console.error("Ошибка при добавлении задачи:", error);
      toast.error("Ошибка при добавлении задачи.");
    }
  };

  const updateTask = async (taskId, updatedData) => {
    try {
      await axios.put(`http://localhost:5000/tasks/${taskId}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
      toast.success("Задача обновлена!");
    } catch (error) {
      console.error("Ошибка при обновлении задачи:", error);
      toast.error("Ошибка при обновлении задачи.");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
      toast.success("Задача удалена!");
    } catch (error) {
      console.error("Ошибка при удалении задачи:", error);
      toast.error("Ошибка при удалении задачи.");
    }
  };

  // Данные для графика доходов
  const incomeChartData = {
    labels: incomeData.map((account) =>
      new Date(account.created_at).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Доходы",
        data: incomeData.map((account) => account.amount),
        borderColor: "green",
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        fill: true,
      },
    ],
  };

  // Данные для графика расходов
  const expenseChartData = {
    labels: expenseData.map((account) =>
      new Date(account.created_at).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Расходы",
        data: expenseData.map((account) => account.amount),
        borderColor: "red",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        fill: true,
      },
    ],
  };

  const handleCopyText = (text) => {
    // Создаем временный элемент input для копирования текста в буфер обмена
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    toast.success("Текст скопирован!");
  };

  return (
    <Tabs
      defaultActiveKey="home"
      id="uncontrolled-tab-example"
      className="mb-3"
    >
      <ToastContainer />
      <Tab eventKey="home" title="Home">
        <ScrollableContainer>
          <Row style={{ display: "flex", alignItems: "stretch" }}>
            <Col md={6} style={{ display: "flex", flexDirection: "column" }}>
              <Card style={{ flex: 1 }}>
                <Card.Body>
                  <Card.Title>{t("dashboard.creditCard")}</Card.Title>
                  <p>
                    {t("dashboard.balance")}: {user?.amount || 0} ₽
                  </p>
                  <p>
                    {t("dashboard.name")}: {user?.name || "Неизвестно"}
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} style={{ display: "flex", flexDirection: "column" }}>
              <Card style={{ flex: 1 }}>
                <Card.Body>
                  <CustomDiv>
                    <CustomLink className="nav-link" to="/">
                      <FaHome />
                    </CustomLink>
                    <CustomLink className="nav-link" to="/transactions">
                      <FaExchangeAlt />
                    </CustomLink>
                    <CustomLink className="nav-link" to="/accounts">
                      <FaFileInvoiceDollar />
                    </CustomLink>
                    <CustomLink className="nav-link" to="/reports">
                      <FaFileExport />
                    </CustomLink>
                    <CustomLink className="nav-link" to="/customers">
                      <FaUser />
                    </CustomLink>
                    <CustomLink className="nav-link" to="/customers">
                      <FaUserPlus />
                    </CustomLink>
                  </CustomDiv>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>{t("dashboard.income")}</Card.Title>
                  <Line data={incomeChartData} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>{t("dashboard.expenses")}</Card.Title>
                  <Line data={expenseChartData} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col md={3}>
              <Card>
                <Card.Body>
                  <Card.Title>Список клиентов</Card.Title>
                  <ClientList>
                    {clients.map((client) => (
                      <CardDiv
                        key={client.id}
                        onClick={() =>
                          handleCopyText(`${client.name}: ${client.phone}`)
                        }
                      >
                        {client.name}: {client.phone}
                      </CardDiv>
                    ))}
                  </ClientList>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card>
                <Card.Body>
                  <Card.Title>Список счетов</Card.Title>
                  <AccountList>
                    {incomeData.map((account) => (
                      <CardDiv
                        key={account.id}
                        onClick={() =>
                          handleCopyText(
                            `${account.description} - ${account.amount} ₽`
                          )
                        }
                      >
                        {account.description} - {account.amount} ₽
                      </CardDiv>
                    ))}
                    {expenseData.map((account) => (
                      <CardDiv
                        key={account.id}
                        onClick={() =>
                          handleCopyText(
                            `${account.description} - ${account.amount} ₽`
                          )
                        }
                      >
                        {account.description} - {account.amount} ₽
                      </CardDiv>
                    ))}
                  </AccountList>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>графика</Card.Title>
                  <AccountList></AccountList>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </ScrollableContainer>
      </Tab>

      <Tab eventKey="profile" title="Planner">
        <Row className="mt-4">
          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>Не начато</Card.Title>
                {tasks.notStarted.map((task) => (
                  <TaskDiv
                    key={task.id}
                    onClick={() =>
                      updateTask(task.id, { status: "in_progress" })
                    }
                  >
                    {task.title}
                    {task.description}
                  </TaskDiv>
                ))}
                <Button
                  variant="primary"
                  onClick={handleShowModal}
                  className="mb-3"
                >
                  Добавить задачу
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>В процессе</Card.Title>
                {tasks.inProgress.map((task) => (
                  <TaskDiv
                    key={task.id}
                    onClick={() => updateTask(task.id, { status: "completed" })}
                  >
                    {task.title}
                    {task.description}
                  </TaskDiv>
                ))}
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>Завершенные</Card.Title>
                {tasks.completed.map((task) => (
                  <TaskDiv key={task.id} onClick={() => deleteTask(task.id)}>
                    {task.title}
                    {task.description}
                  </TaskDiv>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Modal show={showModal} onHide={handleCloseModal}>
              <Modal.Header closeButton>
                <Modal.Title>Добавить задачу</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <form>
                  <div className="form-group">
                    <label>Название</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group mt-3">
                    <label>Описание</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group mt-3">
                    <label>Статус</label>
                    <select
                      className="form-control"
                      value={newTask.status}
                      onChange={(e) =>
                        setNewTask({ ...newTask, status: e.target.value })
                      }
                    >
                      <option value="not_started">Не начато</option>
                      <option value="in_progress">В процессе</option>
                      <option value="completed">Завершено</option>
                    </select>
                  </div>
                </form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal}>
                  Отмена
                </Button>
                <Button variant="success" onClick={handleAddTask}>
                  Сохранить
                </Button>
              </Modal.Footer>
            </Modal>
          </Col>
        </Row>
      </Tab>
    </Tabs>
  );
}

export default Home;

const TaskDiv = styled.div`
 padding: 5px;
  background-color: rgb(231, 235, 231);
  border-radius: 5px;
  margin-bottom: 5px;
  cursor: pointer;
  &:hover {
    background-color: #2ca01c;
    color: white;
  }
`;

const ScrollableContainer = styled.div`
  max-height: 780px;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 10px;
`;

const CardDiv = styled.div`
  padding: 5px;
  background-color: rgb(231, 235, 231);
  border-radius: 5px;
  margin-bottom: 5px;
  cursor: pointer;
  &:hover {
    background-color: #2ca01c;
    color: white;
  }
`;

const CustomDiv = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
`;

const CustomLink = styled(({ ...props }) => <Link {...props} />)`
  height: 50px;
  width: 50px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease, color 0.3s ease;
  font-size: 25px;
  box-shadow: 1px 1px 5px rgb(112, 114, 112);

  &:hover {
    background-color: #2ca01c;
  }

  svg {
    color: black;
    transition: color 0.3s ease;
  }

  &:hover svg {
    color: white;
  }
`;

const ClientList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const AccountList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;
