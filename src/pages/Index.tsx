import { useCardStore } from '@/stores/useCardStore';
import LandingScreen from '@/components/LandingScreen';
import CanvasView from '@/components/CanvasView';

const Index = () => {
  const view = useCardStore((s) => s.view);

  return view === 'landing' ? <LandingScreen /> : <CanvasView />;
};

export default Index;
