import logo from './logo.svg';
import './App.css';
import {useTrainTimeTable} from './hooks/useTrainTimeTable';
import TrainRow from './components/TrainRow'
import React from 'react';

const TrainTimetableDisplay = ({ direction, fileName }) => {
  const { displayTrains, loading, error } = useTrainTimeTable(fileName);
  if (loading) {
    return <div className="timetable-section"><p>読み込み中・・・</p></div>;
  }

  if (error) {
    return <div className="timetable-section"><p style={{ color: 'red' }}>{direction}時刻表エラー: {error}</p></div>
  }

  return (
    <div className="timetable-section">
      {displayTrains.length > 0 ? (
        <table className="timetable-table">
          <thead></thead>
          <tbody>
            {displayTrains.map((train, index) => (
              <TrainRow trainData={train} />
            ))}
          </tbody>
        </table>
      ) : (
        <p>表示できる列車はありません．</p>
      )}
    </div>
  )
}

export let showCanBeOnTime = false;

const changeCanBeOnTime = () => {
  if (showCanBeOnTime === true) {
    showCanBeOnTime = false;
  } else {
    console.log("True")
    showCanBeOnTime = true;
  }
}

export const App = () => {


  return (
    <div class="main">
      <h1>高城駅　発車標</h1>
      <label><input type="checkbox" name="can_be_on_time" value="can_be_on_time" onClick={changeCanBeOnTime}/>間に合うかどうかを表示</label>
      <h2>日豊本線　上り（大分・中津方面）</h2>
      <div id="up-trains"><TrainTimetableDisplay direction="上り" fileName="UpTrains" /></div>
      <h2>日豊本線　下り（臼杵・佐伯方面）</h2>
      <div id="down-trains"><TrainTimetableDisplay direction="下り" fileName="DownTrains" /></div>
    </div>
  );
}

export default App;
