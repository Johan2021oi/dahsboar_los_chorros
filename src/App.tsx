import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
// We will create these next
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Ventas from './pages/Ventas';
import Pagos from './pages/Pagos';
import Gastos from './pages/Gastos';
import Inventario from './pages/Inventario';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="inventario" element={<Inventario />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
