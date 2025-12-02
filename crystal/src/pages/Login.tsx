import { useState } from 'react';
import './Login.css'; // Importamos los estilos

const Login = () => {
  // Estado para guardar los valores de los inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Función que se ejecuta al enviar el formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue

    // Aquí iría tu lógica de conexión a la API (backend)
    if (email === '' || password === '') {
      alert('Please complete all fields');
    } else {
      console.log('Data sent:', { email, password });
      alert('Login sent! Check the console.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn">
            Log In
          </button>

        </form>
      </div>
    </div>
  );
};

export default Login;
