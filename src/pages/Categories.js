import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FaTrash,
  FaEdit,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaPlus,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryData, setCategoryData] = useState({
    name: "",
    description: "",
  });
  const token = localStorage.getItem("userToken");

  const handleShowModal = (category = null) => {
    setIsEditMode(!!category);
    setSelectedCategory(category);
    setCategoryData(category || { name: "", description: "" });
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryData({ ...categoryData, [name]: value });
  };

  const handleSaveCategory = async () => {
    try {
      if (isEditMode && selectedCategory) {
        await axios.put(
          `http://localhost:5000/categories/${selectedCategory.id}`,
          categoryData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Категория успешно обновлена!");
      } else {
        await axios.post("http://localhost:5000/categories", categoryData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("Категория успешно добавлена!");
      }
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      toast.error("Ошибка при сохранении категории: " + error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:5000/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(response.data);
    } catch (error) {
      toast.error("Ошибка загрузки категорий: " + error.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const deleteCategory = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Категория успешно удалена!");
      setCategories(categories.filter((category) => category.id !== id));
    } catch (error) {
      toast.error("Ошибка удаления категории: " + error.message);
    }
  };

  const filteredCategories = categories
    .filter(
      (category) =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.description?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

  return (
    <div>
      <ToastContainer />
      <h3 className="mb-4">Список категорий</h3>
      <SearchContainer>
        <input
          type="text"
          className="form-control me-3"
          placeholder="Поиск категорий..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn btn-outline-success me-2"
          onClick={() => handleShowModal()}
        >
          <FaPlus />
        </button>
        <button
          className="btn btn-outline-success me-2"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          {sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
        </button>
      </SearchContainer>
      <StyledTableContainer>
        <StyledTable className="table table-hover">
          <thead>
            <tr>
              <th>Название</th>
              <th>Описание</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.description}</td>
                <td>
                  <Dropdown>
                    <Dropdown.Toggle
                      variant="outline-success"
                      size="sm"
                      id="dropdown-basic"
                    >
                      Действия
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        onClick={() => deleteCategory(category.id)}
                      >
                        <FaTrash />
                        Удалить
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleShowModal(category)}>
                        <FaEdit />
                        Редактировать
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </StyledTable>
      </StyledTableContainer>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditMode ? "Редактировать категорию" : "Добавить категорию"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Название</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Введите название"
                value={categoryData.name}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                as="textarea"
                rows={3} // Устанавливает количество строк
                name="description"
                placeholder="Введите описание"
                value={categoryData.description}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Отменить
          </Button>
          <Button variant="primary" onClick={handleSaveCategory}>
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Categories;

// Стили
const StyledTableContainer = styled.div`
  max-height: 700px;
  min-height: 700px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  thead th {
    position: sticky;
    top: 0;
    background: #f8f9fa;
    z-index: 1;
  }

  tbody tr:nth-child(odd) {
    background-color: #f9f9f9;
  }
  tbody tr:nth-child(even) {
    background-color: #ffffff;
  }
`;

const SearchContainer = styled.div`
  width: 60%;
  display: flex;
  margin-bottom: 20px;
`;
