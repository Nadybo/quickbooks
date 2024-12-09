import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Modal from 'react-bootstrap/Modal';
import { Button } from 'react-bootstrap';

const Navbar = ({ userName, onLogout }) => {
  const { t, i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);

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
            <NavItem>First item</NavItem>
            <NavItem>Second item</NavItem>
            <NavItem>Third item</NavItem>
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
              <img
                src="https://via.placeholder.com/40" // Замените на ссылку к картинке пользователя
                alt="User Avatar"
              />
              <UserName>{userName}</UserName>
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
          <Button variant="secondary" className="mb-3 w-100">
            {t('Change Password')}
          </Button>
          <Button variant="secondary" className="mb-3 w-100">
            {t('Change Name')}
          </Button>
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
  cursor: pointer;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
`;

const UserName = styled.span`
  font-size: 1rem;
  color: #333;
  font-weight: bold;
`;
