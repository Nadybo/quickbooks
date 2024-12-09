import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import styled from 'styled-components';
import logo from './images/logo.png'

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <SidebarContainer>
      <Container className="nav">
      <Logo src={logo} className="photo" />
        <Stack gap={3}>
          <StyledLink
            className="nav-link"
            to="/"
            aria-current={location.pathname === '/' ? 'page' : undefined}
          >
            {t('sidebar.home')}
          </StyledLink>
          <StyledLink
            className="nav-link"
            to="/transactions"
            aria-current={location.pathname === '/transactions' ? 'page' : undefined}
          >
            {t('sidebar.transactions')}
          </StyledLink>
          <StyledLink
            className="nav-link"
            to="/accounts"
            aria-current={location.pathname === '/accounts' ? 'page' : undefined}
          >
            {t('sidebar.accounts')}
          </StyledLink>
          <StyledLink
            className="nav-link"
            to="/reports"
            aria-current={location.pathname === '/reports' ? 'page' : undefined}
          >
            {t('sidebar.reports')}
          </StyledLink>
          <StyledLink
            className="nav-link"
            to="/customers"
            aria-current={location.pathname === '/customers' ? 'page' : undefined}
          >
            {t('sidebar.customers')}
          </StyledLink>
        </Stack>
      </Container>
    </SidebarContainer>
  );
};
export default Sidebar;

const StyledLink = styled(({ ...props }) => <Link {...props} />)`
  text-decoration: none;
  color: white;
  padding: 10px;
  transition: color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  background-color: ${({ 'aria-current': current }) =>
    current === 'page' ? 'black' : 'transparent'};
  box-shadow: ${({ 'aria-current': current }) =>
    current === 'page' ? 'inset 5px 0 0 #2CA01C' : 'none'};

  &:hover {
    color: white;
    background-color: black;
    box-shadow: inset 5px 0 0 #2CA01C;
  }

  &:focus {
    color: white;
  }
`;

const SidebarContainer = styled.aside`
  background-color: #282828;
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh; /* Высота на всю высоту экрана */
`;

const Container = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center; /* Центрирование элементов внутри */
  gap: 20px; /* Отступы между элементами */
  margin-top: 20px; /* Отступ сверху */
`;

const Logo = styled.img`
  width: 200px; /* Фиксированная ширина логотипа */
  height: auto; /* Сохраняет пропорции */
  margin-bottom: 20px; /* Отступ между логотипом и кнопками */
  cursor: pointer; /* Указатель при наведении */

  &:hover {
    opacity: 0.9; /* Лёгкое затемнение */
  }
`;

