import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext.jsx';
import Login from './pages/Login.jsx';
import VentasList from './pages/VentasList.jsx';
import VentaForm from './pages/VentaForm.jsx';
import CotizacionesList from './pages/CotizacionesList.jsx';
import CotizacionForm from './pages/CotizacionForm.jsx';
import ComprasList from './pages/ComprasList.jsx';
import CompraForm from './pages/CompraForm.jsx';
import RentabilidadPorVestido from './pages/RentabilidadPorVestido.jsx';
import Configuracion from './pages/Configuracion.jsx';
import Dashboard from './pages/Dashboard.jsx';

function PrivateRoute({ children }) {
  const { authenticated } = useAuth();
  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
        <p className="text-sm text-[#2C2420]/50">Cargando…</p>
      </div>
    );
  }
  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/ventas" replace />} />
      <Route
        path="/ventas"
        element={
          <PrivateRoute>
            <VentasList />
          </PrivateRoute>
        }
      />
      <Route
        path="/ventas/nueva"
        element={
          <PrivateRoute>
            <VentaForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/ventas/:id"
        element={
          <PrivateRoute>
            <VentaForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/cotizaciones"
        element={
          <PrivateRoute>
            <CotizacionesList />
          </PrivateRoute>
        }
      />
      <Route
        path="/cotizaciones/nueva"
        element={
          <PrivateRoute>
            <CotizacionForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/cotizaciones/:id"
        element={
          <PrivateRoute>
            <CotizacionForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/costos/insumos"
        element={
          <PrivateRoute>
            <ComprasList />
          </PrivateRoute>
        }
      />
      <Route
        path="/costos/insumos/nueva"
        element={
          <PrivateRoute>
            <CompraForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/costos/insumos/:id"
        element={
          <PrivateRoute>
            <CompraForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/costos/rentabilidad"
        element={
          <PrivateRoute>
            <RentabilidadPorVestido />
          </PrivateRoute>
        }
      />
      <Route
        path="/configuracion"
        element={
          <PrivateRoute>
            <Configuracion />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/ventas" replace />} />
    </Routes>
  );
}
