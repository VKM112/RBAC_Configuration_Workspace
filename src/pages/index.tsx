import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/dashboard/permissions',
    permanent: false,
  },
})

const HomePage = () => null

export default HomePage
