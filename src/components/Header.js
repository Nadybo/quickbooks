import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Modal from 'react-bootstrap/Modal';
import { Button } from 'react-bootstrap';
import { jwtDecode } from 'jwt-decode';
import { FaUserCircle } from "react-icons/fa";

const Navbar = ({ onLogout }) => {
  const { t, i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const getUserDataFromToken = () => {
    const token = localStorage.getItem('userToken');
    if (token) {
      const decodedToken = jwtDecode(token);
      return {
        name: decodedToken.name,
        email: decodedToken.email, 
      };
    }
    return { name: '', role: '', email: '' }; 
  };

  const user = getUserDataFromToken();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const radios = [
    { name: 'En', value: 'en' },
    { name: 'RU', value: 'ru' },
  ];

  return (
    <>
      <StyledNavbar>
        <NavbarContainer>
          <Nav>
            {/* <NavItem>First item</NavItem>
            <NavItem>Second item</NavItem>
            <NavItem>Third item</NavItem> */}
          </Nav>
          <RightSection>
            <ButtonGroup>
              {radios.map((radio, idx) => (
                <ToggleButton
                  key={idx}
                  $isActive={i18n.language === radio.value}
                  onClick={() => changeLanguage(radio.value)}
                >
                  {radio.name}
                </ToggleButton>
              ))}
            </ButtonGroup>
            <Avatar onClick={() => setShowModal(true)}>
              <FaUserCircle/>
              <UserName>{user.name}</UserName>
            </Avatar>
          </RightSection>
        </NavbarContainer>
      </StyledNavbar>

      {/* Модальное окно */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('modal.userSettings')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{"name: " + user.name}</p>
          <p>{"email: " + user.email}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={onLogout}>
            {t('modal.logout')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Navbar;

const StyledNavbar = styled.nav`
  height: 100px;
  background-color: white;
  padding: 10px 20px;
`;

const NavbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Nav = styled.div`
  display: flex;
  gap: 15px;
`;

const NavItem = styled.div`
  padding: 5px 10px;
  font-size: 1rem;
  color: #555;
  cursor: pointer;

  &:hover {
    background-color: #e9ecef;
    border-radius: 5px;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const ToggleButton = styled.button`
  padding: 5px 10px;
  font-size: 0.9rem;
  color: ${(props) => (props.$isActive ? '#fff' : '#333')};
  background-color: ${(props) => (props.$isActive ? '#2CA01C' : 'transparent')};
  border: 1px solid ${(props) => (props.$isActive ? '#2CA01C' : '#ccc')};
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => (props.$isActive ? '#2CA01C' : '#f1f1f1')};
  }
`;

const Avatar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 30px;
  cursor: pointer;
  padding: 10px;

  svg {
    color: black;
    transition: color 0.3s ease;
  }

  &:hover svg {
    color: #2CA01C;
  }
`;

const UserName = styled.span`
  font-size: 1rem;
  color: #333;
  font-weight: bold;
`;
