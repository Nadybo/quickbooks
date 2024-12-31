import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Col, Row } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaHome, FaExchangeAlt, FaFileInvoiceDollar, FaFileExport, FaUser, FaUserPlus } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Home() {
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

  const token = localStorage.getItem("userToken");

  // API запросы для получения данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем данные пользователя
        const userResponse = await axios.get('http://localhost:5000/users', { headers: { Authorization: `Bearer ${token}` } });
        setUser(userResponse.data);
  
        // Загружаем счета
        const accountsResponse = await axios.get('http://localhost:5000/accounts', { headers: { Authorization: `Bearer ${token}` } });
  
        // Фильтруем счета по категориям (расходы и доходы)
        const income = accountsResponse.data.filter(account => account.status === 'paid' && account.category_id === 2);
        const expenses = accountsResponse.data.filter(account => 
          account.status === 'paid' && (account.category_id === 1 || account.category_id === 4)
        );
  
        setIncomeData(income);
        setExpenseData(expenses);
      } catch (error) {
        console.error("Ошибка при загрузке данных", error);
      }
    };
  
    fetchData();
  }, [token]);

  // Функция для обновления статуса счета и баланса
  const updateAccountStatus = async (accountId, newStatus, amount) => {
    try {
      // Изменяем статус счета в базе данных
      await axios.put(`http://localhost:5000/accounts/${accountId}`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Обновляем сумму на основе нового статуса
      const updatedAmount = newStatus === 'paid' ? user.amount + amount : user.amount - amount;
      
      // Обновляем сумму пользователя в базе данных
      await axios.put('http://localhost:5000/users', 
        { amount: updatedAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Обновляем локальные данные
      setUser(prevState => ({ ...prevState, amount: updatedAmount }));

      // Обновляем графики
      const accountsResponse = await axios.get('http://localhost:5000/accounts', { headers: { Authorization: `Bearer ${token}` } });
      const income = accountsResponse.data.filter(account => account.status === 'paid' && account.category_id === 2);
      const expenses = accountsResponse.data.filter(account => account.status === 'paid' && (account.category_id === 1 || account.category_id === 4));

      setIncomeData(income);
      setExpenseData(expenses);
    } catch (error) {
      console.error("Ошибка при изменении статуса счета", error);
    }
  };

  // Данные для графика доходов
  const incomeChartData = {
    labels: incomeData.map((account) => new Date(account.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Доходы',
        data: incomeData.map((account) => account.amount),
        borderColor: 'green',
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
        fill: true,
      },
    ],
  };

  // Данные для графика расходов
  const expenseChartData = {
    labels: expenseData.map((account) => new Date(account.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Расходы',
        data: expenseData.map((account) => account.amount),
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        fill: true,
      },
    ],
  };

  return (
    <ScrollableContainer>
      <h3 className="mb-4">{t('dashboard.title')}</h3>
      <Row style={{ display: 'flex', alignItems: 'stretch' }}>
    <Col md={6} style={{ display: 'flex', flexDirection: 'column' }}>
      <Card style={{ flex: 1 }}>
        <Card.Body>
          <Card.Title>{t('dashboard.creditCard')}</Card.Title>
          {user ? (
            <>
              <p>{t('dashboard.balance')}: {user.amount} ₽</p>
            </>
          ) : (
            <p>Загрузка...</p>
          )}
        </Card.Body>
      </Card>
    </Col>
    <Col md={6} style={{ display: 'flex', flexDirection: 'column' }}>
      <Card style={{ flex: 1 }}>
        <Card.Body>
          <CustomDiv>
            <CustomLink className="nav-link" to="/"><FaHome /></CustomLink>
            <CustomLink className="nav-link" to="/transactions"><FaExchangeAlt /></CustomLink>
            <CustomLink className="nav-link" to="/accounts"><FaFileInvoiceDollar /></CustomLink>
            <CustomLink className="nav-link" to="/reports"><FaFileExport /></CustomLink>
            <CustomLink className="nav-link" to="/customers"><FaUser /></CustomLink> 
            <CustomLink className="nav-link" to="/customers"><FaUserPlus /></CustomLink>
          </CustomDiv>
        </Card.Body>
      </Card>
    </Col>
  </Row>
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>{t('dashboard.income')}</Card.Title>
              <Line data={incomeChartData} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>{t('dashboard.expenses')}</Card.Title>
              <Line data={expenseChartData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </ScrollableContainer>
  );
}

export default Home;

const ScrollableContainer = styled.div`
  max-height: 780px;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 10px;
`;

const CustomDiv = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;  // Выравнивание по центру по вертикали
  height: 100%;
`;

const CustomLink = styled(({ ...props }) => <Link {...props} />)`
  height: 50px;
  width: 50px;  // Задание фиксированной ширины и высоты для иконок
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease, color 0.3s ease;
  font-size: 25px;  // Увеличение размера иконки
  box-shadow: 1px 1px 5px rgb(112, 114, 112);

  &:hover {
    background-color: #2CA01C;
  }

  svg {
    color: black;
    transition: color 0.3s ease;
  }

  &:hover svg {
    color: white;
  }
`;
