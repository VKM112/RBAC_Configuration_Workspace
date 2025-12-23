import DashboardLayout from '../../components/DashboardLayout'
import ProtectedRoute from '../../components/ProtectedRoute'
import LoginAccessPage from '../../views/LoginAccessPage'

const AccessRoute = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <LoginAccessPage />
    </DashboardLayout>
  </ProtectedRoute>
)

export default AccessRoute
