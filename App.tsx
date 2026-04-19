import { useSlideshow } from "./hooks/useSlideshow";
import Navigation from "./components/Navigation";
import { Chapter0, Chapter1to6, Chapter7to9 } from "./components/Chapter0to9";
import { Chapter10to12, Chapter13to15, Chapter16, Chapter17to18 } from "./components/Chapter10to18";
import { Chapter19to20, Chapter21, Chapter22 } from "./components/Chapter19to22";

export default function App() {
  const { activeSection, setActiveSection } = useSlideshow(10);

  return (
    <div className="w-full h-[100vh] overflow-hidden bg-black text-white relative select-none">
      <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <div 
        className="w-full h-[1000vh] flex flex-col transition-transform duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{ transform: `translateY(-${activeSection * 10}%)` }}
      >
        <Chapter0 isActive={activeSection === 0} />
        <Chapter1to6 isActive={activeSection === 1} />
        <Chapter7to9 isActive={activeSection === 2} />
        <Chapter10to12 isActive={activeSection === 3} />
        <Chapter13to15 isActive={activeSection === 4} />
        <Chapter16 isActive={activeSection === 5} />
        <Chapter17to18 isActive={activeSection === 6} />
        <Chapter19to20 isActive={activeSection === 7} />
        <Chapter21 isActive={activeSection === 8} />
        <Chapter22 isActive={activeSection === 9} />
      </div>
    </div>
  );
}
