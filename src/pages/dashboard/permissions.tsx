import DashboardLayout from '../../components/DashboardLayout'
import ProtectedRoute from '../../components/ProtectedRoute'
import PermissionsPage from '../../views/PermissionsPage'

const PermissionsRoute = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <PermissionsPage />
    </DashboardLayout>
  </ProtectedRoute>
)

export default PermissionsRoute
