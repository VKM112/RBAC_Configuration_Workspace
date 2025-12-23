import DashboardLayout from '../../components/DashboardLayout'
import ProtectedRoute from '../../components/ProtectedRoute'
import RolesPage from '../../views/RolesPage'

const RolesRoute = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <RolesPage />
    </DashboardLayout>
  </ProtectedRoute>
)

export default RolesRoute
