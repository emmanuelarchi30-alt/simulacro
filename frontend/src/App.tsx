import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { RequireAuth, RequireRole, GuestOnly } from './components/common/RouteGuards';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { NewCategoryPage } from './pages/NewCategoryPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { DemoCrashPage } from './pages/DemoCrashPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Árbol de la aplicación.
 *
 * Orden de providers (de afuera hacia adentro):
 *  1. ErrorBoundary — captura fallos de renderizado de TODO lo de abajo.
 *  2. ThemeProvider — tema claro/oscuro persistente.
 *  3. ToastProvider — avisos globales usados por auth/favoritos.
 *  4. AuthProvider  — sesión global (usuario, rol, login/logout).
 *  5. FavoritesProvider — depende de la sesión y de los toasts.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <FavoritesProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Navigate to="/products" replace />} />

                  {/* Rutas públicas de sesión */}
                  <Route
                    path="/login"
                    element={
                      <GuestOnly>
                        <LoginPage />
                      </GuestOnly>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <GuestOnly>
                        <RegisterPage />
                      </GuestOnly>
                    }
                  />

                  {/* Catálogo público */}
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/categories/:id" element={<CategoryDetailPage />} />

                  {/* Autenticadas: cualquier rol */}
                  <Route
                    path="/products/new"
                    element={
                      <RequireRole roles={['admin']}>
                        <ProductFormPage mode="create" />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/categories/:categoryId/products/new"
                    element={
                      <RequireRole roles={['admin']}>
                        <ProductFormPage mode="create" />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/products/:id/edit"
                    element={
                      <RequireRole roles={['admin']}>
                        <ProductFormPage mode="edit" />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/favorites"
                    element={
                      <RequireAuth>
                        <FavoritesPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <RequireAuth>
                        <ProfilePage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/my-orders"
                    element={
                      <RequireAuth>
                        <MyOrdersPage />
                      </RequireAuth>
                    }
                  />

                  {/* Solo admin (RBAC): crear categorías */}
                  <Route
                    path="/categories/new"
                    element={
                      <RequireRole roles={['admin']}>
                        <NewCategoryPage />
                      </RequireRole>
                    }
                  />

                  {/* Demo del Error Boundary */}
                  <Route path="/demo-crash" element={<DemoCrashPage />} />

                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
              </FavoritesProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
