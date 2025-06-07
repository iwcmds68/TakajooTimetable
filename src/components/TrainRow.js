import React, {useState, useEffect, useRef} from 'react';
import { getTrainType } from '../hooks/useTrainTimeTable';

const TrainRow = ({trainData, displayInterval = 6000}) => {
    const { ID, Time, Type, Destination, Carriages, Platform, Information } = trainData;
    const [isRemarkMode, setIsRemarkMode] = useState(false); // 備考を表示するかどうかの状態
    const remarkTextRef = useRef(null);
    const displayType = getTrainType(Type); // 種別コードを文字列に変換

    // 備考表示の切り替えタイマー
    useEffect(() => {
        let cycleTimer;
        let animationEndListenerAdded = false;

        // 備考がない、または通過列車の場合は、常に通常モードで何もしない
        if (Type === '20' || !Information) {
        setIsRemarkMode(false);
        return;
        }

        const handleAnimationEnd = () => {
        if (remarkTextRef.current && animationEndListenerAdded) {
            remarkTextRef.current.removeEventListener('animationend', handleAnimationEnd);
            animationEndListenerAdded = false;
            remarkTextRef.current.classList.remove('remark-slide-animation');
        }
        setIsRemarkMode(false); // 通常モードに戻す
        cycleTimer = setTimeout(startRemarkCycle, displayInterval);
        };

        const startRemarkCycle = () => {
        setIsRemarkMode(true); // 備考モードへ切り替え
        // ★ ここでDOM更新を待つロジックは不要になるはず（refは常に存在するため）
        // ただし、アニメーションをリセットするためにクラスを剥がす・付与する処理は必要
        };

        // --- isRemarkModeがtrueになった時の処理（ここが重要） ---
        if (isRemarkMode && Information && Type !== '20') { // 備考モードに入った場合
        // DOMの更新を待つために、わずかなsetTimeoutを挟むのが最も確実
        // これにより、ReactがDOMをレンダリングし、refが設定されるのを確実に待つ
        const domReadyTimer = setTimeout(() => {
            if (remarkTextRef.current) {
            const textWidth = remarkTextRef.current.scrollWidth;
            const containerWidth = remarkTextRef.current.offsetWidth;
            const speed = 120;
            const duration = ((textWidth + containerWidth) / speed) * 1.5;
            const effectiveDuration = Math.max(duration, 3); // 最低3秒など

            remarkTextRef.current.style.setProperty('--scroll-duration', `${effectiveDuration}s`);

            // アニメーションをリセットするため、一度クラスを削除してから再度追加
            remarkTextRef.current.classList.remove('remark-slide-animation');
            // クラスを削除した後、ブラウザが再描画するのを待ってから再度追加
            // これがアニメーションを再トリガーするトリック
            requestAnimationFrame(() => {
                requestAnimationFrame(() => { // 二重のrequestAnimationFrameでより確実に
                if (remarkTextRef.current) {
                    remarkTextRef.current.classList.add('remark-slide-animation');
                    if (!animationEndListenerAdded) { // 重複登録を防ぐ
                        remarkTextRef.current.addEventListener('animationend', handleAnimationEnd);
                        animationEndListenerAdded = true;
                    }
                }
                });
            });

            } else {
            // rare case: should not happen if ref is always rendered
            console.warn(`[${ID}] remarkTextRef.current is null even in remark mode. This should not happen.`);
            setIsRemarkMode(false); // エラー時は通常モードに戻す
            cycleTimer = setTimeout(startRemarkCycle, displayInterval);
            }
        }, 50); // DOM更新を待つための小さな遅延

        return () => clearTimeout(domReadyTimer); // クリーンアップ
        }

        // 初回、または通常モードに戻った後に次のサイクルを開始
        cycleTimer = setTimeout(startRemarkCycle, displayInterval);

        // --- クリーンアップ関数 ---
        return () => {
        clearTimeout(cycleTimer);
        if (remarkTextRef.current && animationEndListenerAdded) {
            remarkTextRef.current.removeEventListener('animationend', handleAnimationEnd);
            remarkTextRef.current.classList.remove('remark-slide-animation');
            remarkTextRef.current.style.removeProperty('--scroll-duration');
        }
        };
    }, [ID, Information, Type, displayInterval, isRemarkMode]); // isRemarkModeも依存配列に含める

    if (Type === '20') {
        return (
            <tr className="train-row train-row-pass">
                <td className="id-cell">{ID}</td>
                <td className="time-cell">{Time}</td>
                <td className="type-cell"></td>
                <td colSpan="2" className="destination-pass-full-row">通　過</td>
                <td className="platform-cell">{Platform}<span className="unit">のりば</span></td>
            </tr>
        );
    }

    return ( 
        <tr className="train-row">
            {Type !== '20' && isRemarkMode && Information !== '' ? (
                <td colSpan="6" className="remark-full-row">
                    <span ref={remarkTextRef} className="remark-text">
                        {Information}
                    </span>
                </td>
            ) : (
                <>
                    <td className="id-cell">{ID}</td>
                    <td className="time-cell">{Time}</td>
                    <td className="type-cell">{displayType}</td>
                    <td className="destination-cell">{Destination}</td>
                    <td className="carriages-cell">{Carriages || '?'}<span className="unit">両</span></td>
                    <td className="platform-cell">{Platform}<span className="unit">のりば</span></td>
                </>
            )}
        </tr>
    )
 };

export default TrainRow;