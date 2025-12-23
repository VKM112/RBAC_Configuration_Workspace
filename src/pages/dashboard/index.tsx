import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/dashboard/permissions',
    permanent: false,
  },
})

const DashboardIndex = () => null

export default DashboardIndex
