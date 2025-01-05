import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  Col,
  Row,
  Tab,
  Tabs,
  Modal,
  Button,
  Dropdown,
  Form,
} from "react-bootstrap";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import axios from "axios";
import styled from "styled-components";
import { Link } from "react-router-dom";
import {
  FaExchangeAlt,
  FaFileInvoiceDollar,
  FaFileExport,
  FaUser,
  FaUserPlus,
  FaPlus,
  FaEdit,
  FaTrash,
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
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler
  );

  const [editTask, setEditTask] = useState(null);
  const [clients, setClients] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const handleCloseCardModal = () => setCardModal(false);
  const handleShowCardModal = () => setCardModal(true);
  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  const [onAddCard] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cards, setCards] = useState([]);
  const [tasks, setTasks] = useState({
    notStarted: [],
    inProgress: [],
    completed: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [showCardModal, setCardModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "not_started",
  });
  const [newCard, setNewCard] = useState({
    card_number: "",
    card_holder_name: "",
    expiration_date: "",
    cvv: "",
  });
  const [pieChartData, setPieChartData] = useState({
    labels: ["Категория 1", "Категория 2", "Категория 3", "Категория 4"],
    datasets: [
      {
        label: "Количество транзакций",
        data: [0, 0, 0, 0],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  });

  const handleAddTask = () => {
    if (!newTask.title) {
      toast.error("Введите название задачи.");
      return;
    }
    addTask(newTask);
    setNewTask({ title: "", description: "", status: "not_started" });
    handleCloseModal();
  };

  const handleShowEditModal = (task) => {
    setEditTask(task);
    setShowModal(true);
  };

  const handleSaveEditTask = async () => {
    if (!editTask.title) {
      toast.error(t("homeToast.editTaskTitleError"));
      return;
    }
    await handleUpdateTask(editTask.id, editTask);
    setEditTask(null);
    handleCloseModal();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCard({
      ...newCard,
      [name]: value,
    });
  };

  const token = localStorage.getItem("userToken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsResponse = await axios.get(
          "http://localhost:5000/clients",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClients(clientsResponse.data);

        const accountsResponse = await axios.get(
          "http://localhost:5000/accounts",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const categoriesResponse = await axios.get(
          "http://localhost:5000/categories",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const categoryMap = categoriesResponse.data.reduce((acc, category) => {
          acc[category.id] = category.name;
          return acc;
        }, {});

        setCategories(categoryMap);

        const cardsResponse = await axios.get("http://localhost:5000/cards", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (
          Array.isArray(cardsResponse.data) &&
          cardsResponse.data.length > 0
        ) {
          setCards(cardsResponse.data);
        }

        const income = accountsResponse.data.filter(
          (account) =>
            account.status === "paid" &&
            (account.category_id === 2 || account.category_id === 4)
        );
        const expenses = accountsResponse.data.filter(
          (account) =>
            account.status === "paid" &&
            (account.category_id === 1 || account.category_id === 3)
        );

        setIncomeData(income);
        setExpenseData(expenses);
      } catch (error) {
        console.error("Ошибка при загрузке данных", error);
      }
    };

    fetchData();
  }, [token]);

  const handleAddCard = async () => {
    try {
      if (!newCard.expiration_date) {
        toast.error(t("homeToast.addCardDateError"));
        return;
      }

      const [year, month] = newCard.expiration_date.split("-");
      const formattedExpirationDate = `${year}-${month}-31`;

      const response = await axios.post(
        "http://localhost:5000/cards",
        {
          ...newCard,
          expiration_date: formattedExpirationDate,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      onAddCard(response.data);
      handleCloseCardModal();
      handleAddCard();
      toast.success(t("dashboard.addCardSuccess"));
    } catch (error) {
      toast.error(t("dashboard.addCardError"));
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://localhost:5000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      toast.success(t("homeToast.addTaskSuccess"));
    } catch (error) {
      toast.error(t("homeToast.addTaskError"));
    }
  };

  const handleUpdateTask = async (taskId, updatedTask) => {
    if (!updatedTask.title || updatedTask.title.trim() === "") {
      toast.error(t("homeToast.editTaskTitleError"));
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/tasks/${taskId}`,
        updatedTask,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        toast.success(t("homeToast.updateTaskSuccess"));
        fetchTasks();
      }
    } catch (error) {
      toast.error(t("homeToast.updateTaskError"));
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
      toast.success(t("homeToast.deleteTaskSuccess"));
    } catch (error) {
      toast.error(t("homeToast.deleteTaskError"));
    }
  };

  const multiAxisChartData = {
    labels: incomeData.map((account) =>
      new Date(account.created_at).toLocaleDateString()
    ),
    datasets: [
      {
        label: t("dashboard.income"),
        data: incomeData.map((account) => parseFloat(account.amount)),
        borderColor: "green",
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        fill: true,
        yAxisID: "y1",
      },
      {
        label: t("dashboard.expenses"),
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
        position: "left", // Ось Y для доходов будет слева
        ticks: {
          beginAtZero: true,
        },
      },
      y2: {
        type: "linear",
        position: "right", // Ось Y для расходов будет справа
        ticks: {
          beginAtZero: true,
        },
      },
    },
  };

  useEffect(() => {
    if (incomeData.length > 0 || (expenseData.length > 0 && categories)) {
      const allData = [...incomeData, ...expenseData];

      const categoryCounts = Object.keys(categories).map(
        (categoryId) =>
          allData.filter(
            (transaction) => transaction.category_id === parseInt(categoryId)
          ).length
      );

      setPieChartData({
        labels: Object.values(categories),
        datasets: [
          {
            label: t("dashboard.NumberTransactions"),
            data: categoryCounts,
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(75, 192, 192, 0.6)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
            ],
            borderWidth: 1,
          },
        ],
      });
    }
  }, [incomeData, expenseData, categories]);

  const handleCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    toast.success(t("homeToast.textCopySuccess"));
  };
  

  return (
    <div>
      <ToastContainer />
      <Tabs
        defaultActiveKey="home"
        id="uncontrolled-tab-example"
        className="mb-3"
      >
        <Tab eventKey="home" title={t("dashboard.titleHome")}>
          <ScrollableContainer>
            <Row style={{ display: "flex", alignItems: "stretch" }}>
              {cards.length > 0 ? (
                cards.map((card, index) => (
                  <Col
                    md={6}
                    key={index}
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <Card style={{ flex: 1 }}>
                      <Card.Body>
                        <Card.Title>{t("dashboard.creditCard")}</Card.Title>
                        <p>
                          {t("dashboard.balance")}: {card.balance} ₽
                        </p>
                        <p>
                          {t("dashboard.cardNumber")}: {card.card_number}
                        </p>
                        <p>
                          {t("dashboard.name")}:{" "}
                          {card.card_holder_name || t("dashboard.unknown")}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col
                  md={6}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <Card>
                    <Card.Body
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "150px",
                      }}
                    >
                      <FaPlus
                        onClick={handleShowCardModal}
                        style={{
                          fontSize: "24px",
                          cursor: "pointer",
                          marginBottom: "8px",
                        }}
                      />
                      {t("dashboard.addCard")}
                    </Card.Body>
                  </Card>
                </Col>
              )}

              <Col md={6} style={{ display: "flex", flexDirection: "column" }}>
                <Card style={{ flex: 1 }}>
                  <Card.Body>
                    <CustomDiv>
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
              <Col md={7}>
                <Card>
                  <Card.Body>
                    <Card.Title>{t("dashboard.incomeExpenses")}</Card.Title>
                    <GraphWrapper>
                      <Line
                        data={multiAxisChartData}
                        options={multiAxisChartOptions}
                      />
                    </GraphWrapper>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={5}>
                <Card>
                  <Card.Body>
                    <Card.Title>{t("dashboard.category")}</Card.Title>
                    <GraphWrapper>
                      <Pie
                        data={pieChartData}
                        options={{
                          responsive: true,
                          plugins: { legend: { position: "top" } },
                        }}
                      />
                    </GraphWrapper>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col md={3}>
                <Card>
                  <Card.Body>
                    <Card.Title>{t("dashboard.listCustomers")}</Card.Title>
                    <ClientList>
                      {clients.map((client, index) => (
                        <CardDiv
                          key={client.id || index}
                          onClick={() =>
                            handleCopyText(`${client.name}: ${client.phone}`)
                          }
                        >
                          {client.name} - {client.company_name}
                        </CardDiv>
                      ))}
                    </ClientList>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card>
                  <Card.Body>
                    <Card.Title>{t("dashboard.listAccounts")}</Card.Title>
                    <AccountList>
                      {incomeData.map((account, index) => (
                        <CardDiv
                          key={account.id || index}
                          onClick={() =>
                            handleCopyText(
                              `${account.description} - ${account.amount} ₽`
                            )
                          }
                        >
                          {account.description} - {account.amount} ₽
                        </CardDiv>
                      ))}
                      {expenseData.map((account, index) => (
                        <CardDiv
                          key={account.id || index}
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
                    <Card.Title>{t("dashboard.listTasks")}</Card.Title>
                    <ClientList>
                      {tasks.notStarted.map((task, index) => (
                        <CardDiv key={task.id || index}>
                          <h3>{task.title}</h3>
                          <p> {task.description}</p>
                        </CardDiv>
                      ))}
                    </ClientList>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Modal show={showCardModal} onHide={handleCloseCardModal}>
                  <Modal.Header closeButton>
                    <Modal.Title>{t("addCardModal.title")}</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form>
                      <Form.Group controlId="formCardNumber">
                        <Form.Label>
                          {t("addCardModal.cardNumberLabel")}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="card_number"
                          value={newCard.card_number}
                          onChange={handleInputChange}
                          maxLength={16}
                          required
                        />
                      </Form.Group>

                      <Form.Group controlId="formCardHolderName">
                        <Form.Label>
                          {t("addCardModal.cardHolderNameLabel")}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="card_holder_name"
                          value={newCard.card_holder_name}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group controlId="formExpirationDate">
                        <Form.Label>
                          {t("addCardModal.expirationDateLabel")}
                        </Form.Label>
                        <Form.Control
                          type="month"
                          name="expiration_date"
                          value={newCard.expiration_date}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group controlId="formCVV">
                        <Form.Label>{t("addCardModal.cvvLabel")}</Form.Label>
                        <Form.Control
                          type="text"
                          name="cvv"
                          value={newCard.cvv}
                          onChange={handleInputChange}
                          maxLength={3}
                          required
                        />
                      </Form.Group>
                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseCardModal}>
                      {t("addCardModal.cancelButton")}
                    </Button>
                    <Button variant="primary" onClick={handleAddCard}>
                      {t("addCardModal.addButtonText")}
                    </Button>
                  </Modal.Footer>
                </Modal>
              </Col>
            </Row>
          </ScrollableContainer>
        </Tab>

        <Tab eventKey="planner" title={t("dashboard.titlePlanner")}>
          <Row className="mt-4">
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>{t("taskBoard.notStartedTitle")}</Card.Title>
                  {tasks.notStarted.map((task, index) => (
                    <TaskDiv
                      key={task.id || index}
                      onClick={() =>
                        handleUpdateTask(task.id, { status: "in_progress" })
                      }
                    >
                      <h3>{task.title}</h3>
                      <p>{task.description}</p>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="primary"
                          size="sm"
                          id="dropdown-menu-end"
                        >
                          {t("taskBoard.actionsDropdown")}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => deleteTask(task.id)}>
                            <FaTrash />
                            {t("taskBoard.deleteTask")}
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => handleShowEditModal(task)}
                          >
                            <FaEdit />
                            {t("taskBoard.editTask")}
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </TaskDiv>
                  ))}

                  <TaskDiv
                    onClick={handleShowModal}
                    style={{
                      cursor: "pointer",
                      border: "1px dashed #ccc",
                      padding: "10px",
                    }}
                  >
                    <FaPlus size={20} />
                  </TaskDiv>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>{t("taskBoard.inProgressTitle")}</Card.Title>
                  {tasks.inProgress.map((task, index) => (
                    <TaskDiv
                      key={task.id || index}
                      onClick={() =>
                        handleUpdateTask(task.id, { status: "completed" })
                      }
                    >
                      <h3>{task.title}</h3>
                      <p>{task.description}</p>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="primary"
                          size="sm"
                          id="dropdown-menu-end"
                        >
                          {t("taskBoard.actionsDropdown")}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => deleteTask(task.id)}>
                            <FaTrash />
                            {t("taskBoard.deleteTask")}
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => handleShowEditModal(task)}
                          >
                            <FaEdit />
                            {t("taskBoard.editTask")}
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </TaskDiv>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>{t("taskBoard.completedTitle")}</Card.Title>
                  {tasks.completed.map((task, index) => (
                    <TaskDiv
                      key={task.id || index}
                      onClick={() => deleteTask(task.id)}
                    >
                      <h3>{task.title}</h3>
                      <p>{task.description}</p>
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
                  <Modal.Title>
                    {editTask
                      ? t("taskBoard.modalTitleEditTask")
                      : t("taskBoard.modalTitleAddTask")}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <form>
                    <div className="form-group">
                      <label>{t("taskBoard.form.titleLabel")}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editTask ? editTask.title : newTask.title}
                        onChange={(e) =>
                          editTask
                            ? setEditTask({
                                ...editTask,
                                title: e.target.value,
                              })
                            : setNewTask({ ...newTask, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group mt-3">
                      <label>{t("taskBoard.form.descriptionLabel")}</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={
                          editTask ? editTask.description : newTask.description
                        }
                        onChange={(e) =>
                          editTask
                            ? setEditTask({
                                ...editTask,
                                description: e.target.value,
                              })
                            : setNewTask({
                                ...newTask,
                                description: e.target.value,
                              })
                        }
                      />
                    </div>
                    <div className="form-group mt-3">
                      <label>{t("taskBoard.form.statusLabel")}</label>
                      <select
                        className="form-control"
                        value={editTask ? editTask.status : newTask.status}
                        onChange={(e) =>
                          editTask
                            ? setEditTask({
                                ...editTask,
                                status: e.target.value,
                              })
                            : setNewTask({ ...newTask, status: e.target.value })
                        }
                      >
                        <option value="not_started">
                          {t("taskBoard.form.statusOptions.notStarted")}
                        </option>
                        <option value="in_progress">
                          {t("taskBoard.form.statusOptions.inProgress")}
                        </option>
                        <option value="completed">
                          {t("taskBoard.form.statusOptions.completed")}
                        </option>
                      </select>
                    </div>
                  </form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    {t("taskBoard.cancelButtonText")}
                  </Button>
                  <Button
                    variant="success"
                    onClick={editTask ? handleSaveEditTask : handleAddTask}
                  >
                    {editTask
                      ? t("taskBoard.saveChangesButtonText")
                      : t("taskBoard.addButtonText")}
                  </Button>
                </Modal.Footer>
              </Modal>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
}

export default Home;

const TaskDiv = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: #f5f5f5;
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
  background-color: #f5f5f5;
  border-radius: 5px;
  margin-bottom: 5px;
  height: auto;
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

const GraphWrapper = styled.div`
  height: 500px;
`;
