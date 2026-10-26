// @ts-ignore
import React, {useEffect, useState} from 'react';
import './feedback.css';
import like from '../../image/like.png';

const STARS = [1, 2, 3, 4, 5];

type Props = {
    onRate?: (rating: number) => void;
};


function FeedbackBuitton({onRate}: Props) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    const close = () => {
        setIsOpen(prev => !prev);
        setHover(0);
    };

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const rate = (value: number) => {
        setRating(value);
        setIsOpen(prev => !prev);
        onRate?.(value);
    };

    const active = hover || rating;


    return (
        <>
            {!isOpen && (
                <div className="feedbackRightDown">
                    <div className="feedbackButton" onClick={() => setIsOpen(true)}>
                        <img className={"feedback_img"} src={like}/>
                    </div>
                </div>
            )}
            {isOpen && (
                <div className="feedbackOverlay" onClick={close}>
                    <div className="feedbackModal" onClick={(e) => e.stopPropagation()}>
                        <div className="feedbackModal__close" onClick={close}>✕</div>

                        <div className="feedbackModal__title">Вам нравится пользоваться сайтом?</div>
                        <div className="feedbackModal__text">
                            Наша команда старается сделать сайт максимально удобным для вас ❤️
                        </div>

                        <div className="feedbackModal__hearts" onMouseLeave={() => setHover(0)}>
                            {STARS.map((n) => (
                                <div
                                    key={n}
                                    className={`feedbackModal__heart${n <= active ? ' is-active' : ''}`}
                                    onMouseEnter={() => setHover(n)}
                                    onClick={() => rate(n)}
                                >
                                    ♥
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            )}

        </>
    );
}

export default FeedbackBuitton;
