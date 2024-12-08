import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import styled from 'styled-components';

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <SidebarContainer>
      <Container className="nav">
        <Stack gap={3}>
          <StyledLink
            className="nav-link"
            to="/"
            isActive={location.pathname === '/'}
          >
            {t('sidebar.home')}
          </StyledLink>
          <StyledLink
            className="nav-link"
            to="/transactions"
            isActive={location.pathname === '/transactions'}
          >
            {t('sidebar.transactions')}
          </StyledLink>
          <StyledLink
            className="nav-link"
            to="/accounts"
            isActive={location.pathname === '/accounts'}
          >
            {t('sidebar.accounts')}
          </StyledLink>
          <StyledLink
            className="nav-link"
            to="/reports"
            isActive={location.pathname === '/reports'}
          >
            {t('sidebar.reports')}
          </StyledLink>
          <StyledLink
            className="nav-link"
            to="/customers"
            isActive={location.pathname === '/customers'}
          >
            {t('sidebar.customers')}
          </StyledLink>
        </Stack>
      </Container>
    </SidebarContainer>
  );
};
export default Sidebar;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: white;
  padding: 10px;
  transition: color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  background-color: ${({ isActive }) => (isActive ? 'gray' : 'transparent')};
  box-shadow: ${({ isActive }) =>
    isActive ? 'inset 5px 0 0 #2CA01C' : 'none'};
  
  &:hover {
    color: white;
    background-color: gray;
    box-shadow: inset 5px 0 0 #2CA01C;
  }

  &:focus {
    color: white;
  }
`;

const Container = styled.nav`
  width: 100%;
  display: flex;
  flex-direction: column;
  height: fit-content;
`;

const SidebarContainer = styled.aside`
  background-color: #282828;
  width: 220px;
  display: flex;
  align-items: center;
`;
