// @ts-ignore
import React from 'react';
import './HeroBlock.css'

function HeroBlock(){
    return (
        <>
            <div className="hero-block">
                <div className={"Main-container"}>
                    <h1 className={"main-text"}>Умный кредитный кабинет
                        предпринимателя
                        малого и микробизнеса</h1>
                    <p className={"bottom-text"}>Подберите и расчитайте кредит с помощью умного ИИ-помошника</p>
                    <div className={"ButtonDown"}>
                        <a className={"buttonComponentGetMoney"}>
                            <span className={"getMoney"}>Получить деньги</span>
                        </a>
                    </div>
                    <div className={"BottomBlocks"}>
                        <div className={"Block1"}>
                            <p className={"blockTextH"}>За 5 минут</p>
                            <p className={"blockTextP"}>подбрем лучшее решение</p>
                            <img alt="" className="blockImage" height="48" loading="lazy" src="src/shared/image/clock.png" width="48"/>
                        </div>
                        <div className={"Block2"}>
                            <p className={"BlockTextH"}>До 30 млн Р.</p>
                            <p className={"BlockTextP"}>сумма кредита</p>
                            <img alt="" className="blockImage" height="48" loading="lazy" src="src/shared/image/diagonal.png" width="48"/>
                        </div>
                        <div className={"Block3"}>
                            <p className={"blockTextH"}>От 1 до 5 лет</p>
                            <p className={"blockTextP"}>срок кредита</p>
                            <img alt="" className="blockImage" height="48" loading="lazy" src="src/shared/image/calendar.png" width="48"/>
                        </div>
                        <div className={"Block3"}>
                            <p className={"blockTextH"}>С ИИ выгоднее</p>
                            <p className={"blockTextP"}>комфортные платежи</p>
                            <img alt="" className="blockImage" height="48" loading="lazy" src="src/shared/image/deposit.png" width="48"/>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HeroBlock;