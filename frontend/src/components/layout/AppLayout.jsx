import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Toast from '../ui/Toast'
import TourGuide from '../ui/TourGuide'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-5 pb-24 md:pb-6 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <Toast />
      <TourGuide />
    </div>
  )
}
