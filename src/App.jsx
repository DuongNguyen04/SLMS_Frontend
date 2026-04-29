import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { OPS_ROLES, ROLES } from './constants/roles'
import { AdminOnly, PublicOnlyRoute, RequireAuthRoute, RoleHomeRedirect } from './components/RouteGuards'
import CustomerLayout from './layouts/CustomerLayout'
import OpsLayout from './layouts/OpsLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import CatalogPage from './pages/customer/CatalogPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import CartPage from './pages/customer/CartPage'
import OrdersPage from './pages/customer/OrdersPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
import OpsHomePage from './pages/ops/OpsHomePage'
import OpsOrdersPage from './pages/ops/OpsOrdersPage'
import OpsOrderDetailPage from './pages/ops/OpsOrderDetailPage'
import OpsInventoryPage from './pages/ops/OpsInventoryPage'
import OpsShipmentsPage from './pages/ops/OpsShipmentsPage'
import AdminProductsPage from './pages/ops/AdminProductsPage'
import AdminUsersPage from './pages/ops/AdminUsersPage'
import AdminReportsPage from './pages/ops/AdminReportsPage'
import AdminBatchPage from './pages/ops/AdminBatchPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleHomeRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuthRoute roles={[ROLES.CUSTOMER]} />}>
        <Route path="/shop" element={<CustomerLayout />}>
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<CatalogPage />} />
          <Route path="products/:productName" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuthRoute roles={OPS_ROLES} />}>
        <Route path="/ops" element={<OpsLayout />}>
          <Route index element={<OpsHomePage />} />
          <Route path="orders" element={<OpsOrdersPage />} />
          <Route path="orders/:orderId" element={<OpsOrderDetailPage />} />
          <Route path="inventory" element={<OpsInventoryPage />} />
          <Route path="shipments" element={<OpsShipmentsPage />} />
          <Route
            path="products"
            element={(
              <AdminOnly>
                <AdminProductsPage />
              </AdminOnly>
            )}
          />
          <Route
            path="users"
            element={(
              <AdminOnly>
                <AdminUsersPage />
              </AdminOnly>
            )}
          />
          <Route
            path="reports"
            element={(
              <AdminOnly>
                <AdminReportsPage />
              </AdminOnly>
            )}
          />
          <Route
            path="batch"
            element={(
              <AdminOnly>
                <AdminBatchPage />
              </AdminOnly>
            )}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
