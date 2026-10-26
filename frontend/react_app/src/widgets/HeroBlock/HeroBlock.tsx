// @ts-ignore
import React from 'react';
import './HeroBlock.css'
import Wallet from "./Wallet.tsx";
import clock from '../../shared/image/clock.png';
import diagonal from '../../shared/image/diagonal.png';
import calendar from '../../shared/image/calendar.png';
import deposit from '../../shared/image/deposit.png';

function scrollToCatalog() {
    document
        .querySelector('.loan-catalog')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function HeroBlock(){
    return (
        <>
            <div className="hero-block">
                <div className={"Main-container"}>
                    <Wallet></Wallet>
                    <h1 className={"main-text"}>Умный кредитный кабинет
                        предпринимателя
                        малого и микробизнеса</h1>
                    <p className={"bottom-text"}>Подберите и расчитайте кредит с помощью умного ИИ-помошника</p>
                    <div className={"ButtonDown"}>
                        <a
                            className={"buttonComponentGetMoney"}
                            href="#loan-catalog"
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToCatalog();
                            }}
                        >
                            <span className={"getMoney"}>Получить деньги</span>
                        </a>
                    </div>
                    <div className={"BottomBlocks"}>
                        <div className={"Block1"}>
                            <p className={"blockTextH"}>За 5 минут</p>
                            <p className={"blockTextP"}>подбрем лучшее решение</p>
                            <img alt="" className="blockImage" height="48" loading="lazy" src={clock} width="48"/>
                        </div>
                        <div className={"Block2"}>
                            <p className={"BlockTextH"}>До 30 млн Р.</p>
                            <p className={"BlockTextP"}>сумма кредита</p>
                            <img alt="" className="blockImage" height="48" loading="lazy" src={diagonal} width="48"/>
                        </div>
                        <div className={"Block3"}>
                            <p className={"blockTextH"}>От 1 до 15 лет</p>
                            <p className={"blockTextP"}>срок кредита</p>
                            <img alt="" className="blockImage" height="48" loading="lazy" src={calendar} width="48"/>
                        </div>
                        <div className={"Block3"}>
                            <p className={"blockTextH"}>С нами выгоднее</p>
                            <p className={"blockTextP"}>комфортные платежи</p>
                            <img alt="" className="blockImage" height="48" loading="lazy" src={deposit} width="48"/>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HeroBlock;
