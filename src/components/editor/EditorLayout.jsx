import TopToolbar from './TopToolbar'
import FloorBar from './FloorBar'
import Sidebar from './Sidebar'
import Viewport from './Viewport'

export default function EditorLayout() {
  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <TopToolbar />
      <FloorBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Viewport />
      </div>
    </div>
  )
}
