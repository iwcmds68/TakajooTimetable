import { useEffect, useState } from 'react';
import Papa from 'papaparse';

export const getTrainType = typeCode => {
  switch (typeCode) {
    case '0' : return '普通';
    case '1' : return '快速';
    case '2' : return '急行';
    case '3' : return '特急';
    case '20' : return '通過';
    default: return '不明';
  }
};

export const useTrainTimeTable = fileName => {
  const [timetable, setTimetable] = useState([]); // CSV全体のデータ
  const [displayTrains, setDisplayTrains] = useState([]); // 表示する3列車分のデータ
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCsvData = async () => {
      try {
         // process.env.PUBLIC_URL を使って、ベースパスを動的に決定
        // PUBLIC_URLは、ローカル環境では通常 '/' (または空文字列)、
        // デプロイ先では '/TakajooTimetable' となる
        const basePath = process.env.PUBLIC_URL; // これで十分なはずです

        // 正しいパスの構築
        // 例: ローカルでは '/your_file_name.csv'
        // 例: デプロイ先では '/TakajooTimetable/your_file_name.csv'
        const urlToFetch = `${basePath}/${fileName}.csv`; // fileName には 'your_file_name' のような文字列を渡す
        console.log("フェッチするURL:", urlToFetch); // デバッグ用にログ出力
        const response = await fetch(urlToFetch);
        if (!response.ok) {
          throw new Error(`HTTPエラー．ステータス: ${response.status}`);
        }
        const csvText = await response.text();

        // CSVをパース
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          complete: (results) => {
            console.log("パースされたCSVデータ (results.data):", results.data);
            setTimetable(results.data);
          },
          error: (error) => {
            console.error('CSVのパース中にエラーが発生しました:', error)
          }
        });
      } catch (error) {
        console.error('CSVのフェッチ中にエラーが発生しました:', error);
      }
      setLoading(false);
    };
    fetchCsvData();
  }, [fileName]);

  // 現在時刻に基づいて，表示する列車を更新する
  useEffect (() => {
    if (timetable.length === 0) return;
    const updateDisplayTrains = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const upcomingTrains = []; // これから来る列車のリスト
      let foundFirstUpcoming = false;

      console.log("時刻表" + timetable)

      // 時刻順にソートしなおす
      // 時刻を Date オブジェクトに変換して比較
      const sortedData = [...timetable].sort((a, b) => {
        const timeA = new Date(today.getTime()).setHours(...a.Time.split(':').map(Number), 0, 0);
        const timeB = new Date(today.getTime()).setHours(...b.Time.split(':').map(Number), 0, 0);
        return timeA - timeB;
      });

      for (let i = 0; i < sortedData.length; i++) {
        const train = sortedData[i];
        const trainTime = new Date(today.getTime()).setHours(...train.Time.split(':').map(Number), 0, 0);

        // 現在時刻を過ぎた列車はスキップする．ただし，最初のこれから来る列車を見つけるまではスキップしつづける
        if (trainTime < now.getTime() && !foundFirstUpcoming) {
          continue;
        }
        foundFirstUpcoming = true;

        upcomingTrains.push(train)

        if (upcomingTrains.length >= 3) break; // 3つ後の列車まで表示する
      }

      setDisplayTrains(upcomingTrains);
    };

    // 初回実行
    updateDisplayTrains();

    // 3秒ごとに更新して次の列車を表示
    const intervalId = setInterval(updateDisplayTrains, 3000);

    // コンポーネントがアンマウントされるときにインターバルをクリアする
    return () => clearInterval(intervalId);
  }, [timetable, loading, error]); // timetableが更新されたときのみ再実行

  return { displayTrains, loading, error, getTrainType };
};