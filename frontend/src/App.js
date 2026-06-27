import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import Issues from './pages/Issues';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './auth';

function PrivateRoute({ children, allowedRoles = ['member', 'librarian'] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const fallback = user.role === 'librarian' ? '/' : '/issues';
    return <Navigate to={fallback} replace />;
  }

  return children;
}

function Layout({ children }) {
  const { user } = useAuth();
  const isLibrarian = user?.role === 'librarian';

  return (
    <div>
      <nav style={{ display: 'flex', gap: 16, padding: 16, background: '#1f2937', color: '#fff' }}>
        <Link to="/" style={{ color: '#fff' }}>Dashboard</Link>
        {isLibrarian && <Link to="/books" style={{ color: '#fff' }}>Books</Link>}
        {isLibrarian && <Link to="/members" style={{ color: '#fff' }}>Members</Link>}
        <Link to="/issues" style={{ color: '#fff' }}>Issues</Link>
        {isLibrarian && <Link to="/settings" style={{ color: '#fff' }}>Settings</Link>}
      </nav>
      <main>{children}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/books"
          element={
            <PrivateRoute allowedRoles={['librarian']}>
              <Layout>
                <Books />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/members"
          element={
            <PrivateRoute allowedRoles={['librarian']}>
              <Layout>
                <Members />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/issues"
          element={
            <PrivateRoute>
              <Layout>
                <Issues />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute allowedRoles={['librarian']}>
              <Layout>
                <Settings />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
