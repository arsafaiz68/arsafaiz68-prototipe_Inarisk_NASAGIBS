import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { MapView } from './components/map/MapView';
import { DatePanel } from './components/panels/DatePanel';
import { LayerInfoPanel } from './components/panels/LayerInfoPanel';
import { Sidebar } from './components/sidebar/Sidebar';

export default function App() {
  return (
    <div className="flex h-full flex-col bg-slate-100">
      <Header />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative min-w-0 flex-1">
          <MapView />
          <DatePanel />
          <LayerInfoPanel />
          <StatusBar />
        </main>
      </div>
    </div>
  );
}
