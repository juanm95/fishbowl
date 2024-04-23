import './App.css';
import { FishbowlController } from './FishbowlController';
import { Fishbowl } from './FishbowlView';


function App() {
  let fishbowlController = new FishbowlController();
  return (
    <Fishbowl initialController={fishbowlController}></Fishbowl>
  );
}

export default App;
