import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack, Button } from 'react-bootstrap';
import { FaAngleLeft, FaAngleRight  } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';
import styled from 'styled-components';
import logo from './images/logo.png';

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {isSidebarVisible && (
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
                to="/customers"
                aria-current={location.pathname === '/customers' ? 'page' : undefined}
              >
                {t('sidebar.customers')}
              </StyledLink>
              <StyledLink
                className="nav-link"
                to="/categories"
                aria-current={location.pathname === '/categories' ? 'page' : undefined}
              >
                {t('sidebar.categories')}
              </StyledLink>
              <StyledLink
                className="nav-link"
                to="/reports"
                aria-current={location.pathname === '/reports' ? 'page' : undefined}
              >
                {t('sidebar.reports')}
              </StyledLink>
            </Stack>
          </Container>
        </SidebarContainer>
      )}
      <div style={{ flex: 1 }}>
        <ButtonContainer>
          <ToggleButton onClick={toggleSidebar}>
            {isSidebarVisible ? <FaAngleLeft /> : <FaAngleRight />}
          </ToggleButton>
        </ButtonContainer>
      </div>
    </div>
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
  }

  &:focus {
    color: white;
  }
`;

const SidebarContainer = styled.aside`
  padding: 0;
  background-color: #282828;
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
`;

const Container = styled.nav`
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center; 
  gap: 20px; 
  margin-top: 20px; 
`;

const Logo = styled.img`
  width: 200px;
  height: auto;
  margin-bottom: 20px;
  cursor: pointer;
  &:hover {
    opacity: 0.9; 
  }
`;

const ButtonContainer = styled.div`
  padding: 10px 0 0 0;
  text-align: center;
`;

const ToggleButton = styled(Button)`
  background-color: #282828;
  border: none;
  border-radius: 0 10px 10px 0;

  &:hover {
    background-color: #1d8b17;
  }
`;
