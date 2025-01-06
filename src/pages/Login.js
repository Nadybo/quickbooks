import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FloatingLabel, Form, Button } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function LoginPage({ onLogin }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        axios
            .post('http://localhost:5000/login', formData)
            .then((response) => {
                const { token } = response.data;
                localStorage.setItem('userToken', token);

                toast.success('Вы успешно вошли!');
                onLogin(true);  

                navigate('/');
            })
            .catch((error) => {
                toast.error('Ошибка входа. Проверьте данные!');
                setError(error.response?.data?.message || 'Неверный email или пароль');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className="container mt-5">
            <ToastContainer />
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <h2 className="text-center mb-4">Вход</h2>
                    <form onSubmit={handleSubmit}>
                        <FloatingLabel controlId="floatingInput" label="Email" className="mb-3">
                            <Form.Control
                                type="email"
                                placeholder="name@example.com"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </FloatingLabel>

                        <FloatingLabel controlId="floatingPassword" label="Пароль" className="mb-3">
                            <Form.Control
                                type="password"
                                placeholder="Пароль"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </FloatingLabel>

                        <Button type="submit" className="btn btn-success w-100" disabled={isLoading}>
                            {isLoading ? 'Загрузка...' : 'Войти'}
                        </Button>
                        <div className="mt-3 text-center">
                            <span>Нет аккаунта? </span>
                            <Link to="/register">Зарегистрироваться</Link>
                        </div>
                    </form>

                    {error && <p className="text-danger text-center mt-3">{error}</p>}
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
